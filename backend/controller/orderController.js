'use strict';

const Order = require('../model/Order');
const Product = require('../model/Product');
const { ORDER_STATUSES, ORDER_STATUS_TRANSITIONS } = require('../model/Order');
const { logAction } = require('../utils/auditLogger');
const { emailPaymentVerified, emailPaymentRejected, emailOrderReady } = require('../utils/orderEmails');
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
            // Cancelling an order the customer already paid for is a refund in
            // everything but name — say so on the record, or revenue keeps counting
            // money that has to go back.
            if (doc.paymentStatus === 'paid') {
                return res.status(400).json({
                    error: true,
                    msg: 'This order is already paid — use Refund instead of Cancel so the payment is recorded correctly.',
                });
            }
            await restoreStock(doc);
            doc.cancelledAt = new Date();
            doc.cancelledBy = req.adminDoc?._id;
        }

        // Marking an order 'paid' by hand has to move paymentStatus too, otherwise the
        // order reads as paid in the list while revenue (which sums paymentStatus:
        // 'paid') silently ignores it.
        if (status === 'paid' && doc.paymentStatus !== 'paid') {
            doc.paymentStatus = 'paid';
            doc.paidAt = doc.paidAt || new Date();
            doc.paymentVerifiedBy = req.adminDoc?._id;
            doc.paymentVerifiedAt = new Date();
        }
        if (status === 'cancelled' && doc.paymentStatus === 'verification_pending') {
            // The proof is moot once the order is gone — don't leave it in the queue
            doc.paymentStatus = 'failed';
        }

        doc.status = status;
        if (adminNote) doc.adminNote = adminNote;

        // Auto generate pickup code when ready
        if (status === 'ready_for_pickup' && !doc.pickupCode) {
            doc.pickupCode = crypto.randomBytes(6).toString('hex').toUpperCase();
        }

        await doc.save();

        if (status === 'ready_for_pickup' && prev !== 'ready_for_pickup') {
            emailOrderReady(doc).catch(() => {});
        }

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

        // Cash-on-pickup orders are only actually paid at this moment. Without this
        // they stayed paymentStatus 'pending' forever and every cash sale was missing
        // from the revenue figures.
        if (doc.paymentStatus === 'pending') {
            doc.paymentStatus = 'paid';
            doc.paidAt = new Date();
            doc.paymentVerifiedBy = req.adminDoc?._id;
            doc.paymentVerifiedAt = new Date();
        }

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

// PATCH /api/v1/admin/orders/:id/verify-payment — approve/reject a QR payment proof
const verifyPayment = async (req, res) => {
    try {
        const { approve, note } = req.body;
        const doc = await Order.findById(req.params.id);
        if (!doc) return res.status(404).json({ error: true, msg: 'Order not found' });

        if (doc.paymentStatus !== 'verification_pending') {
            return res.status(400).json({ error: true, msg: 'No payment verification is pending on this order' });
        }

        if (approve === true) {
            doc.paymentStatus = 'paid';
            doc.status = 'paid';
            doc.paidAt = new Date();
            doc.paymentVerifiedAt = new Date();
            doc.paymentVerifiedBy = req.adminDoc?._id;
            if (!doc.pickupCode) {
                doc.pickupCode = crypto.randomBytes(6).toString('hex').toUpperCase();
            }
            if (note) doc.adminNote = note;
            await doc.save();

            for (const item of doc.items) {
                Product.findByIdAndUpdate(item.productId, { $inc: { totalOrders: item.quantity } }).exec().catch(() => {});
            }
            emailPaymentVerified(doc).catch(() => {});
        } else {
            doc.paymentStatus = 'failed';
            doc.paymentRejectedReason = String(note || 'Payment proof could not be verified').slice(0, 300);
            await doc.save();
            emailPaymentRejected(doc).catch(() => {});
        }

        await logAction({
            action: approve === true ? 'order.payment_approved' : 'order.payment_rejected',
            category: 'order',
            admin: req.user,
            adminDoc: req.adminDoc,
            entityType: 'Order',
            entityId: doc._id,
            newValue: { approve: approve === true, note },
            req,
        });

        return res.json({
            error: false,
            msg: approve === true ? 'Payment verified — order confirmed' : 'Payment proof rejected',
            data: doc,
        });
    } catch (err) {
        return res.status(500).json({ error: true, msg: 'Failed to verify payment' });
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

module.exports = { listOrders, getOrder, updateOrderStatus, verifyPickup, verifyPayment, refundOrder, getOrderStats, restoreStock };
