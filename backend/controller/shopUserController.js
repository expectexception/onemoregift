'use strict';

const Product = require('../model/Product');
const Order = require('../model/Order');
const Store = require('../model/Store');
const crypto = require('crypto');
const { getConfigHelper, getISTDay, parseDays } = require('./configController');
const { emailOrderPlaced } = require('../utils/orderEmails');
const { restoreStock } = require('./orderController');

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
        const cfg = await getConfigHelper();

        // Weekly drop cycle: orders can only be placed during the Fri–Sat sale window
        if (cfg.weeklyDropEnabled && cfg.shopPhase !== 'sale') {
            return res.status(400).json({
                error: true,
                msg: 'Orders open only during the Friday–Saturday sale window. Products & prices reveal Wed–Thu, pickup happens Mon–Tue.',
            });
        }

        const requested = String(paymentMethod || '').toLowerCase();
        const allowedMethods = [
            cfg.qrPaymentEnabled && 'qr',
            cfg.paymentGatewayEnabled && 'online',
            cfg.codEnabled && 'cod',
        ].filter(Boolean);
        if (!allowedMethods.length) {
            return res.status(503).json({ error: true, msg: 'No payment methods are currently enabled. Please try again later.' });
        }
        const method = allowedMethods.includes(requested) ? requested : allowedMethods[0];

        if (!Array.isArray(items) || !items.length) {
            return res.status(400).json({ error: true, msg: 'Order items cannot be empty' });
        }

        // Quantities come straight from the browser — a negative or fractional value
        // would flip the stock decrement into an increment and mis-price the order.
        const maxQty = Number(cfg.shopMaxQtyPerOrder) || 0;
        const qtyByLine = new Map(); // per product+variant, so split lines can't beat the cap
        for (const item of items) {
            const qty = Number(item?.quantity);
            if (!Number.isInteger(qty) || qty < 1) {
                return res.status(400).json({ error: true, msg: 'Each item needs a whole quantity of at least 1' });
            }
            item.quantity = qty;

            const lineKey = `${item.productId}:${item.variantId || ''}`;
            const running = (qtyByLine.get(lineKey) || 0) + qty;
            qtyByLine.set(lineKey, running);
            if (maxQty > 0 && running > maxQty) {
                return res.status(400).json({
                    error: true,
                    msg: `These are limited drops — you can order at most ${maxQty} of the same item per order.`,
                });
            }
        }
        if (!pickupStoreId) {
            return res.status(400).json({ error: true, msg: 'Please select a pickup store' });
        }

        if (scheduledPickupTime) {
            const pickupAt = new Date(scheduledPickupTime);
            if (Number.isNaN(pickupAt.getTime())) {
                return res.status(400).json({ error: true, msg: 'Invalid pickup time' });
            }
            if (pickupAt.getTime() < Date.now()) {
                return res.status(400).json({ error: true, msg: 'Pickup time cannot be in the past' });
            }
            // Weekly drop cycle: pickup must land inside the configured pickup window
            if (cfg.weeklyDropEnabled) {
                const pickupDays = parseDays(cfg.dropPickupDays, [1, 2]);
                if (!pickupDays.includes(getISTDay(pickupAt))) {
                    return res.status(400).json({
                        error: true,
                        msg: `Pickup must be scheduled during the pickup window (${cfg.shopPhases?.pickup?.days || 'Mon, Tue'}).`,
                    });
                }
            }
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
            } else if (method === 'qr') {
                // Order stays pending until the user uploads payment proof and admin verifies it
                orderData.paymentMethod = 'UPI QR';
            }

            const order = await Order.create(orderData);

            if (method === 'cod') {
                for (const item of order.items) {
                    Product.findByIdAndUpdate(item.productId, { $inc: { totalOrders: item.quantity } }).exec().catch(() => {});
                }
            }

            // Fire-and-forget confirmation email
            emailOrderPlaced(order, method).catch(() => {});

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

// Submit UPI/QR payment proof for an order — admin verifies it manually
const submitPaymentProof = async (req, res) => {
    try {
        const cfg = await getConfigHelper();
        if (!cfg.qrPaymentEnabled) {
            return res.status(503).json({ error: true, msg: 'QR payment is currently disabled' });
        }

        const { proofs, reference } = req.body;
        const proofUrls = (Array.isArray(proofs) ? proofs : [])
            .filter(u => typeof u === 'string' && (u.startsWith('/') || u.startsWith('http')))
            .slice(0, 5);
        if (!proofUrls.length) {
            return res.status(400).json({ error: true, msg: 'Please upload at least one payment screenshot' });
        }

        const order = await Order.findOne({ _id: req.params.id, userId: req.user.data._id });
        if (!order) {
            return res.status(404).json({ error: true, msg: 'Order not found' });
        }
        if (order.status !== 'pending') {
            return res.status(400).json({ error: true, msg: 'This order is already processed' });
        }
        if (order.paymentStatus === 'paid') {
            return res.status(400).json({ error: true, msg: 'This order is already paid' });
        }

        order.paymentMethod = 'UPI QR';
        order.paymentStatus = 'verification_pending';
        order.paymentProofs = proofUrls.map(url => ({ url, uploadedAt: new Date() }));
        order.paymentReference = String(reference || '').trim().slice(0, 100);
        order.paymentProofSubmittedAt = new Date();
        order.paymentRejectedReason = undefined;
        await order.save();

        return res.json({
            error: false,
            msg: 'Payment proof submitted. We will verify it and confirm your order shortly.',
            data: order,
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: true, msg: 'Failed to submit payment proof' });
    }
};

// Sandbox payment completion — DEVELOPMENT ONLY.
//
// This endpoint marks an order paid on the caller's say-so, so it is gated three
// ways: the gateway toggle must be on, the provider must still be the sandbox, and
// `sandboxPaymentsAllowed` must be true (false whenever NODE_ENV=production). On the
// live site it always refuses — an unpaid order can only become paid through QR proof
// verification by an admin, or by being collected as cash on pickup.
const simulatePayment = async (req, res) => {
    try {
        const cfg = await getConfigHelper();
        if (!cfg.paymentGatewayEnabled) {
            return res.status(503).json({ error: true, msg: 'Online payment gateway is currently disabled' });
        }

        const provider = cfg.paymentsProvider;
        if (provider !== 'sandbox') {
            if (!cfg.realPaymentsEnabled) {
                return res.status(503).json({ error: true, msg: `Payment provider '${provider}' is not yet enabled` });
            }
            // Real gateway integration point — not implemented yet
            return res.status(501).json({ error: true, msg: `Payment provider '${provider}' integration is not implemented` });
        }
        if (!cfg.sandboxPaymentsAllowed) {
            return res.status(503).json({
                error: true,
                msg: 'Online card payment is not available yet. Please pay via UPI QR and upload the payment screenshot, or choose cash on pickup.',
            });
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
//
// Self-service cancellation is only for orders where no money has moved. Once the
// customer has paid — or uploaded a payment proof that is sitting in the admin
// verification queue — cancelling here would silently keep their money while
// handing the stock back, so those orders have to go through the admin refund flow.
const cancelMyOrder = async (req, res) => {
    try {
        const order = await Order.findOne({ _id: req.params.id, userId: req.user.data._id });
        if (!order) {
            return res.status(404).json({ error: true, msg: 'Order not found' });
        }

        // Payment state is checked first so a paid order gets the "contact us for a
        // refund" message rather than a flat "cannot be cancelled".
        if (order.paymentStatus === 'paid') {
            return res.status(400).json({
                error: true,
                msg: 'This order is already paid. Please contact support to request a refund — we will process it for you.',
            });
        }
        if (order.paymentStatus === 'verification_pending') {
            return res.status(400).json({
                error: true,
                msg: 'Your payment proof is being verified. Please contact support if you want to cancel this order.',
            });
        }
        if (!['pending', 'ready_for_pickup'].includes(order.status)) {
            return res.status(400).json({ error: true, msg: 'This order can no longer be cancelled' });
        }

        await restoreStock(order);

        order.status = 'cancelled';
        order.cancelledAt = new Date();
        order.cancelledReason = 'Cancelled by customer';
        await order.save();

        return res.json({ error: false, msg: 'Order cancelled successfully', data: order });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: true, msg: 'Failed to cancel order' });
    }
};

module.exports = {
    getCategories,
    listProducts,
    getProduct,
    createOrder,
    submitPaymentProof,
    simulatePayment,
    listMyOrders,
    getMyOrder,
    cancelMyOrder
};
