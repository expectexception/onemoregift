'use strict';

const Order = require('../model/Order');
const Product = require('../model/Product');
const { ORDER_STATUSES, ORDER_STATUS_TRANSITIONS } = require('../model/Order');
const { logAction } = require('../utils/auditLogger');
const crypto = require('crypto');

// Restore stock for an order's items (used on refund/cancel)
const restoreStock = async (order) => {
    for (const item of order.items) {
        if (item.variantId) {
            await Product.updateOne(
                { _id: item.productId, 'variants._id': item.variantId },
                { $inc: { 'variants.$.stock': item.quantity } }
            ).catch(() => {});
        } else {
            await Product.updateOne(
                { _id: item.productId },
                { $inc: { stock: item.quantity } }
            ).catch(() => {});
        }
    }
};

// GET /api/v1/admin/orders
const listOrders = async (req, res) => {
    try {
        const { status, paymentStatus, storeId, userId, page = 1, limit = 20, search } = req.query;
        const query = {};
        if (status) query.status = status;
        if (paymentStatus) query.paymentStatus = paymentStatus;
        if (storeId) query.pickupStoreId = storeId;
        if (userId) query.userId = userId;
        if (search) query.orderNumber = { $regex: search, $options: 'i' };

        const skip = (Number(page) - 1) * Number(limit);
        const [data, total] = await Promise.all([
            Order.find(query)
                .populate('userId', 'name email')
                .populate('pickupStoreId', 'name city')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(Number(limit)),
            Order.countDocuments(query),
        ]);
        return res.json({ error: false, data, total, page: Number(page) });
    } catch (err) {
        return res.status(500).json({ error: true, msg: 'Failed to fetch orders' });
    }
};

// GET /api/v1/admin/orders/:id
const getOrder = async (req, res) => {
    try {
        const doc = await Order.findById(req.params.id)
            .populate('userId', 'name email phone')
            .populate('pickupStoreId')
            .populate('items.productId', 'name images');
        if (!doc) return res.status(404).json({ error: true, msg: 'Order not found' });
        return res.json({ error: false, data: doc });
    } catch (err) {
        return res.status(500).json({ error: true, msg: 'Failed to fetch order' });
    }
};

// PATCH /api/v1/admin/orders/:id/status
const updateOrderStatus = async (req, res) => {
    try {
        const { status, adminNote } = req.body;
        if (!ORDER_STATUSES.includes(status)) {
            return res.status(400).json({ error: true, msg: 'Invalid order status' });
        }
        const doc = await Order.findById(req.params.id);
        if (!doc) return res.status(404).json({ error: true, msg: 'Order not found' });

        const prev = doc.status;
        if (prev !== status) {
            const allowed = ORDER_STATUS_TRANSITIONS[prev] || [];
            if (!allowed.includes(status)) {
                return res.status(400).json({ error: true, msg: `Cannot move order from '${prev}' to '${status}'` });
            }
        }

        // Refund/cancel via this endpoint should also restore stock, same as the dedicated refund flow
        if (status === 'refunded' && prev !== 'refunded') {
            await restoreStock(doc);
            doc.paymentStatus = 'refunded';
            doc.refundedAt = new Date();
            doc.refundedBy = req.adminDoc?._id;
        }
        if (status === 'cancelled' && prev !== 'cancelled') {
            await restoreStock(doc);
            doc.cancelledAt = new Date();
            doc.cancelledBy = req.adminDoc?._id;
        }

        doc.status = status;
        if (adminNote) doc.adminNote = adminNote;

        // Auto generate pickup code when ready
        if (status === 'ready_for_pickup' && !doc.pickupCode) {
            doc.pickupCode = crypto.randomBytes(6).toString('hex').toUpperCase();
        }

        await doc.save();

        await logAction({
            action: 'order.status_update',
            category: 'order',
            admin: req.user,
            adminDoc: req.adminDoc,
            entityType: 'Order',
            entityId: doc._id,
            prevValue: { status: prev },
            newValue: { status },
            req,
        });

        return res.json({ error: false, msg: 'Order status updated', data: doc });
    } catch (err) {
        return res.status(500).json({ error: true, msg: 'Failed to update order status' });
    }
};

// POST /api/v1/admin/orders/:id/verify-pickup
const verifyPickup = async (req, res) => {
    try {
        const { pickupCode } = req.body;
        const doc = await Order.findById(req.params.id);
        if (!doc) return res.status(404).json({ error: true, msg: 'Order not found' });
        if (doc.pickupCode !== pickupCode) {
            return res.status(400).json({ error: true, msg: 'Invalid pickup code' });
        }
        if (doc.status !== 'ready_for_pickup') {
            return res.status(400).json({ error: true, msg: 'Order is not ready for pickup' });
        }

        doc.status = 'collected';
        doc.pickupVerifiedAt = new Date();
        doc.pickupVerifiedBy = req.adminDoc?._id;
        await doc.save();

        return res.json({ error: false, msg: 'Pickup verified — order collected', data: doc });
    } catch (err) {
        return res.status(500).json({ error: true, msg: 'Failed to verify pickup' });
    }
};

// POST /api/v1/admin/orders/:id/refund
const refundOrder = async (req, res) => {
    try {
        const { reason } = req.body;
        const doc = await Order.findById(req.params.id);
        if (!doc) return res.status(404).json({ error: true, msg: 'Order not found' });

        const allowed = ORDER_STATUS_TRANSITIONS[doc.status] || [];
        if (doc.status !== 'refunded' && !allowed.includes('refunded')) {
            return res.status(400).json({ error: true, msg: `Cannot refund an order with status '${doc.status}'` });
        }
        if (doc.status === 'refunded') {
            return res.status(400).json({ error: true, msg: 'Order is already refunded' });
        }

        await restoreStock(doc);

        doc.status = 'refunded';
        doc.paymentStatus = 'refunded';
        doc.refundReason = reason;
        doc.refundedAt = new Date();
        doc.refundedBy = req.adminDoc?._id;
        await doc.save();

        await logAction({
            action: 'order.refund',
            category: 'order',
            admin: req.user,
            adminDoc: req.adminDoc,
            entityType: 'Order',
            entityId: doc._id,
            newValue: { reason },
            req,
        });

        return res.json({ error: false, msg: 'Order refunded', data: doc });
    } catch (err) {
        return res.status(500).json({ error: true, msg: 'Failed to refund order' });
    }
};

// GET /api/v1/admin/orders/stats
const getOrderStats = async (req, res) => {
    try {
        const [statusStats, revenue] = await Promise.all([
            Order.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
            Order.aggregate([
                { $match: { paymentStatus: 'paid' } },
                { $group: { _id: null, total: { $sum: '$total' } } },
            ]),
        ]);
        const result = { total: 0, revenue: revenue[0]?.total || 0 };
        statusStats.forEach(s => { result[s._id] = s.count; result.total += s.count; });
        return res.json({ error: false, data: result });
    } catch (err) {
        return res.status(500).json({ error: true, msg: 'Failed to fetch order stats' });
    }
};

module.exports = { listOrders, getOrder, updateOrderStatus, verifyPickup, refundOrder, getOrderStats };
