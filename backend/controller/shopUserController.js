'use strict';

const Product = require('../model/Product');
const Order = require('../model/Order');
const Store = require('../model/Store');
const crypto = require('crypto');

// Get active categories
const getCategories = async (req, res) => {
    try {
        const categories = await Product.distinct('category', { isActive: true, isArchived: false });
        return res.json({ error: false, data: categories });
    } catch (err) {
        return res.status(500).json({ error: true, msg: 'Failed to fetch categories' });
    }
};

// List products for user
const listProducts = async (req, res) => {
    try {
        const { category, search, minPrice, maxPrice, sort, page = 1, limit = 20 } = req.query;
        const query = { isActive: true, isArchived: false };

        if (category) query.category = category;
        if (search) query.$text = { $search: search };

        if (minPrice !== undefined || maxPrice !== undefined) {
            query.basePrice = {};
            if (minPrice !== undefined) query.basePrice.$gte = Number(minPrice);
            if (maxPrice !== undefined) query.basePrice.$lte = Number(maxPrice);
        }

        let sortQuery = { createdAt: -1 };
        if (sort === 'price_asc') sortQuery = { basePrice: 1 };
        if (sort === 'price_desc') sortQuery = { basePrice: -1 };
        if (sort === 'rating') sortQuery = { rating: -1 };
        if (sort === 'popular') sortQuery = { totalOrders: -1 };

        const skip = (Number(page) - 1) * Number(limit);
        const [data, total] = await Promise.all([
            Product.find(query).sort(sortQuery).skip(skip).limit(Number(limit)),
            Product.countDocuments(query),
        ]);

        return res.json({ error: false, data, total, page: Number(page) });
    } catch (err) {
        return res.status(500).json({ error: true, msg: 'Failed to search products' });
    }
};

// Get product details
const getProduct = async (req, res) => {
    try {
        const doc = await Product.findOne({ _id: req.params.id, isActive: true, isArchived: false });
        if (!doc) return res.status(404).json({ error: true, msg: 'Product not found' });
        
        // Increment view count asynchronously
        Product.findByIdAndUpdate(req.params.id, { $inc: { viewCount: 1 } }).exec().catch(() => {});

        return res.json({ error: false, data: doc });
    } catch (err) {
        return res.status(500).json({ error: true, msg: 'Failed to fetch product details' });
    }
};

// Create Order
const createOrder = async (req, res) => {
    try {
        const { items, pickupStoreId, scheduledPickupTime, customerNote, paymentMethod } = req.body;
        const method = String(paymentMethod || 'online').toLowerCase() === 'cod' ? 'cod' : 'online';
        if (!items || !items.length) {
            return res.status(400).json({ error: true, msg: 'Order items cannot be empty' });
        }
        if (!pickupStoreId) {
            return res.status(400).json({ error: true, msg: 'Please select a pickup store' });
        }

        // Validate store
        const store = await Store.findOne({ _id: pickupStoreId, isActive: true });
        if (!store) {
            return res.status(400).json({ error: true, msg: 'Invalid or inactive pickup store select' });
        }

        let subtotal = 0;
        const processedItems = [];
        const decremented = []; // for rollback on partial failure

        const rollback = async () => {
            for (const d of decremented) {
                if (d.variantId) {
                    await Product.updateOne(
                        { _id: d.productId, 'variants._id': d.variantId },
                        { $inc: { 'variants.$.stock': d.quantity } }
                    ).catch(() => {});
                } else {
                    await Product.updateOne(
                        { _id: d.productId },
                        { $inc: { stock: d.quantity } }
                    ).catch(() => {});
                }
            }
        };

        // Validate products & variants stock with atomic conditional decrement
        for (const item of items) {
            const baseProduct = await Product.findOne({ _id: item.productId, isActive: true, isArchived: false });
            if (!baseProduct) {
                await rollback();
                return res.status(400).json({ error: true, msg: `Product ${item.productId} not found or inactive` });
            }

            let unitPrice = baseProduct.discountedPrice || baseProduct.basePrice;
            let variantName = '';

            if (baseProduct.hasVariants && item.variantId) {
                const variant = baseProduct.variants.id(item.variantId);
                if (!variant || !variant.isActive) {
                    await rollback();
                    return res.status(400).json({ error: true, msg: `Variant not found or inactive for ${baseProduct.name}` });
                }
                unitPrice = variant.price;
                variantName = variant.name;

                // Atomic conditional decrement — only succeeds if stock is still sufficient
                const updated = await Product.findOneAndUpdate(
                    {
                        _id: item.productId,
                        isActive: true,
                        isArchived: false,
                        variants: { $elemMatch: { _id: item.variantId, isActive: true, stock: { $gte: item.quantity } } },
                    },
                    { $inc: { 'variants.$[v].stock': -item.quantity } },
                    { arrayFilters: [{ 'v._id': item.variantId }], new: true }
                );
                if (!updated) {
                    await rollback();
                    return res.status(400).json({ error: true, msg: `Insufficient stock for ${baseProduct.name} (${variant.name})` });
                }
                decremented.push({ productId: item.productId, variantId: item.variantId, quantity: item.quantity });
            } else {
                const updated = await Product.findOneAndUpdate(
                    { _id: item.productId, isActive: true, isArchived: false, stock: { $gte: item.quantity } },
                    { $inc: { stock: -item.quantity } },
                    { new: true }
                );
                if (!updated) {
                    await rollback();
                    return res.status(400).json({ error: true, msg: `Insufficient stock for product ${baseProduct.name}` });
                }
                decremented.push({ productId: item.productId, variantId: null, quantity: item.quantity });
            }

            const itemTotal = unitPrice * item.quantity;
            subtotal += itemTotal;

            processedItems.push({
                productId: baseProduct._id,
                productName: baseProduct.name,
                variantId: item.variantId || null,
                variantName,
                quantity: item.quantity,
                unitPrice,
                totalPrice: itemTotal
            });
        }

        const total = subtotal; // can implement coupons later

        try {
            const orderData = {
                userId: req.user.data._id,
                items: processedItems,
                subtotal,
                total,
                pickupStoreId,
                scheduledPickupTime: scheduledPickupTime ? new Date(scheduledPickupTime) : null,
                customerNote,
                status: 'pending',
                paymentStatus: 'pending'
            };

            // Cash on Delivery / Pay at Pickup: confirm the order immediately (no online
            // payment step). Payment is collected on pickup, so paymentStatus stays 'pending'.
            if (method === 'cod') {
                orderData.paymentMethod = 'COD';
                orderData.status = 'ready_for_pickup';
                orderData.pickupCode = crypto.randomBytes(6).toString('hex').toUpperCase();
            }

            const order = await Order.create(orderData);

            if (method === 'cod') {
                for (const item of order.items) {
                    Product.findByIdAndUpdate(item.productId, { $inc: { totalOrders: item.quantity } }).exec().catch(() => {});
                }
            }

            return res.status(201).json({ error: false, data: order });
        } catch (createErr) {
            await rollback();
            throw createErr;
        }
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: true, msg: 'Failed to create order' });
    }
};

// Simulate Payment API (or sandbox integration)
const simulatePayment = async (req, res) => {
    try {
        const provider = (process.env.PAYMENTS_PROVIDER || 'sandbox').toLowerCase();
        const realPaymentsEnabled = (process.env.ENABLE_REAL_PAYMENTS || 'false').toLowerCase() === 'true';
        if (provider !== 'sandbox' && !realPaymentsEnabled) {
            return res.status(503).json({ error: true, msg: `Payment provider '${provider}' is not yet enabled` });
        }
        if (provider !== 'sandbox') {
            // Real gateway integration point — not implemented yet
            return res.status(501).json({ error: true, msg: `Payment provider '${provider}' integration is not implemented` });
        }

        const { orderId, success } = req.body;
        const order = await Order.findOne({ _id: orderId, userId: req.user.data._id });
        if (!order) {
            return res.status(404).json({ error: true, msg: 'Order not found' });
        }

        if (order.status !== 'pending') {
            return res.status(400).json({ error: true, msg: 'Order is already processed' });
        }

        if (success === true) {
            order.paymentStatus = 'paid';
            order.status = 'paid';
            order.paymentMethod = 'Simulated Card';
            order.paymentGateway = 'Sandbox';
            order.paymentId = 'PAY-' + crypto.randomBytes(8).toString('hex').toUpperCase();
            order.paidAt = new Date();
            // Generate pickup code
            order.pickupCode = crypto.randomBytes(6).toString('hex').toUpperCase();
            await order.save();

            // Increment totalOrders count on products asynchronously
            for (const item of order.items) {
                Product.findByIdAndUpdate(item.productId, { $inc: { totalOrders: item.quantity } }).exec().catch(() => {});
            }

            return res.json({ error: false, msg: 'Payment successful', data: order });
        } else {
            order.paymentStatus = 'failed';
            await order.save();
            return res.json({ error: false, msg: 'Payment simulation marked failed', data: order });
        }
    } catch (err) {
        return res.status(500).json({ error: true, msg: 'Payment simulation failed' });
    }
};

// User Order History
const listMyOrders = async (req, res) => {
    try {
        const orders = await Order.find({ userId: req.user.data._id })
            .populate('pickupStoreId', 'name city address')
            .sort({ createdAt: -1 });
        return res.json({ error: false, data: orders });
    } catch (err) {
        return res.status(500).json({ error: true, msg: 'Failed to fetch your orders' });
    }
};

// User Single Order Details
const getMyOrder = async (req, res) => {
    try {
        const order = await Order.findOne({ _id: req.params.id, userId: req.user.data._id })
            .populate('pickupStoreId')
            .populate('items.productId', 'name images category');
        if (!order) {
            return res.status(404).json({ error: true, msg: 'Order not found' });
        }
        return res.json({ error: false, data: order });
    } catch (err) {
        return res.status(500).json({ error: true, msg: 'Failed to fetch order details' });
    }
};

// Cancel My Order
const cancelMyOrder = async (req, res) => {
    try {
        const order = await Order.findOne({ _id: req.params.id, userId: req.user.data._id });
        if (!order) {
            return res.status(404).json({ error: true, msg: 'Order not found' });
        }

        if (!['pending', 'paid'].includes(order.status)) {
            return res.status(400).json({ error: true, msg: 'Cannot cancel order in current status' });
        }

        // Return stock
        for (const item of order.items) {
            const product = await Product.findById(item.productId);
            if (product) {
                if (product.hasVariants && item.variantId) {
                    const variant = product.variants.id(item.variantId);
                    if (variant) {
                        variant.stock += item.quantity;
                    }
                } else {
                    product.stock += item.quantity;
                }
                await product.save();
            }
        }

        order.status = 'cancelled';
        order.cancelledAt = new Date();
        order.cancelledReason = 'Cancelled by customer';
        await order.save();

        return res.json({ error: false, msg: 'Order cancelled successfully', data: order });
    } catch (err) {
        return res.status(500).json({ error: true, msg: 'Failed to cancel order' });
    }
};

module.exports = {
    getCategories,
    listProducts,
    getProduct,
    createOrder,
    simulatePayment,
    listMyOrders,
    getMyOrder,
    cancelMyOrder
};
