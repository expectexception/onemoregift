'use strict';

const Coupon = require('../model/Coupon');
const Order = require('../model/Order');
const Product = require('../model/Product');
const { evaluateCoupon } = require('../utils/couponEngine');
const { logAction } = require('../utils/auditLogger');

const normalizeCode = (raw) => String(raw || '').trim().toUpperCase();

// Statuses where the customer still holds the redemption. A cancelled or refunded
// order releases it, so those are excluded from the per-user count.
const HOLDING_STATUSES = ['pending', 'paid', 'ready_for_pickup', 'collected'];

const countUserUses = (couponCode, userId) => Order.countDocuments({
    userId,
    couponCode,
    status: { $in: HOLDING_STATUSES },
});

/**
 * Turns the requested cart items into priced lines using live database prices, so
 * a doctored client payload cannot inflate the discount. Returns null if any item
 * is unavailable, leaving the caller to report it.
 */
const priceCartLines = async (items) => {
    const lines = [];
    for (const item of items || []) {
        const product = await Product.findOne({ _id: item.productId, isActive: true, isArchived: false })
            .select('name category basePrice discountedPrice hasVariants variants');
        if (!product) return null;

        let unitPrice = product.discountedPrice || product.basePrice;
        if (product.hasVariants && item.variantId) {
            const variant = product.variants.id(item.variantId);
            if (!variant) return null;
            unitPrice = variant.price;
        }

        const quantity = Number(item.quantity);
        if (!Number.isInteger(quantity) || quantity < 1) return null;

        lines.push({
            productId: String(product._id),
            category: product.category,
            totalPrice: unitPrice * quantity,
        });
    }
    return lines;
};

// POST /api/v1/shop/coupons/validate
// Preview only. The real discount is recomputed when the order is created.
const validateCoupon = async (req, res) => {
    try {
        const code = normalizeCode(req.body?.code);
        if (!code) return res.status(400).json({ error: true, msg: 'Please enter a coupon code' });

        const coupon = await Coupon.findOne({ code });
        if (!coupon) return res.status(404).json({ error: true, msg: 'That coupon code is not valid' });

        const lines = await priceCartLines(req.body?.items);
        if (!lines || !lines.length) {
            return res.status(400).json({ error: true, msg: 'Your cart is empty or contains an unavailable item' });
        }

        const subtotal = lines.reduce((sum, l) => sum + l.totalPrice, 0);
        const userUses = await countUserUses(code, req.user.data._id);
        const result = evaluateCoupon(coupon, { lines, subtotal, userUses });

        if (!result.ok) return res.status(400).json({ error: true, msg: result.reason });

        return res.json({
            error: false,
            msg: result.message,
            data: {
                code: coupon.code,
                description: coupon.description || '',
                discount: result.discount,
                subtotal,
                total: Math.max(0, subtotal - result.discount),
            },
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: true, msg: 'Could not check that coupon' });
    }
};

/**
 * Claims one redemption atomically, so two orders racing for the last use of a
 * limited coupon cannot both win. Returns the coupon or null when it is exhausted.
 */
const claimRedemption = async (couponId) => Coupon.findOneAndUpdate(
    {
        _id: couponId,
        isActive: true,
        $or: [
            { usageLimit: 0 },
            { $expr: { $lt: ['$usedCount', '$usageLimit'] } },
        ],
    },
    { $inc: { usedCount: 1 } },
    { new: true },
);

const releaseRedemption = async (code) => {
    if (!code) return;
    await Coupon.updateOne(
        { code: normalizeCode(code), usedCount: { $gt: 0 } },
        { $inc: { usedCount: -1 } },
    ).catch(() => { /* releasing is best effort, never block the cancel */ });
};

// ---------------------------------------------------------------- admin

const listCoupons = async (req, res) => {
    try {
        const { page = 1, limit = 50, search } = req.query;
        const query = {};
        if (search) query.code = { $regex: String(search).trim(), $options: 'i' };

        const skip = (Number(page) - 1) * Number(limit);
        const [data, total] = await Promise.all([
            Coupon.find(query).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
            Coupon.countDocuments(query),
        ]);
        return res.json({ error: false, data, total, page: Number(page) });
    } catch (err) {
        return res.status(500).json({ error: true, msg: 'Failed to fetch coupons' });
    }
};

const buildCouponPayload = (body) => {
    const discountType = body.discountType === 'flat' ? 'flat' : 'percent';
    const payload = {
        code: normalizeCode(body.code),
        description: String(body.description || '').trim().slice(0, 300),
        discountType,
        discountValue: Number(body.discountValue),
        maxDiscount: Math.max(0, Number(body.maxDiscount) || 0),
        minOrderValue: Math.max(0, Number(body.minOrderValue) || 0),
        usageLimit: Math.max(0, Number(body.usageLimit) || 0),
        perUserLimit: Math.max(0, Number(body.perUserLimit) || 0),
        isActive: body.isActive !== false,
        productIds: Array.isArray(body.productIds) ? body.productIds.filter(Boolean) : [],
        categories: Array.isArray(body.categories) ? body.categories.filter(Boolean).map(String) : [],
        validFrom: body.validFrom ? new Date(body.validFrom) : null,
        validUntil: body.validUntil ? new Date(body.validUntil) : null,
    };
    return payload;
};

const validatePayload = (payload) => {
    if (!payload.code || !/^[A-Z0-9_-]{3,24}$/.test(payload.code)) {
        return 'Code must be 3 to 24 characters, using letters, numbers, hyphen or underscore';
    }
    if (!Number.isFinite(payload.discountValue) || payload.discountValue <= 0) {
        return 'Discount value must be greater than zero';
    }
    if (payload.discountType === 'percent' && payload.discountValue > 100) {
        return 'A percentage discount cannot exceed 100';
    }
    if (payload.validFrom && Number.isNaN(payload.validFrom.getTime())) return 'Start date is not a valid date';
    if (payload.validUntil && Number.isNaN(payload.validUntil.getTime())) return 'End date is not a valid date';
    if (payload.validFrom && payload.validUntil && payload.validUntil <= payload.validFrom) {
        return 'The end date must be after the start date';
    }
    return null;
};

const createCoupon = async (req, res) => {
    try {
        const payload = buildCouponPayload(req.body || {});
        const problem = validatePayload(payload);
        if (problem) return res.status(400).json({ error: true, msg: problem });

        const existing = await Coupon.findOne({ code: payload.code });
        if (existing) return res.status(409).json({ error: true, msg: 'A coupon with that code already exists' });

        const doc = await Coupon.create({ ...payload, createdBy: req.adminDoc?._id });
        await logAction({
            action: 'coupon.create', category: 'shop', admin: req.user, adminDoc: req.adminDoc,
            entityType: 'Coupon', entityId: doc._id, newValue: { code: doc.code }, req,
        }).catch(() => {});

        return res.status(201).json({ error: false, msg: 'Coupon created', data: doc });
    } catch (err) {
        if (err?.code === 11000) return res.status(409).json({ error: true, msg: 'A coupon with that code already exists' });
        console.error(err);
        return res.status(500).json({ error: true, msg: 'Failed to create coupon' });
    }
};

const updateCoupon = async (req, res) => {
    try {
        const payload = buildCouponPayload(req.body || {});
        const problem = validatePayload(payload);
        if (problem) return res.status(400).json({ error: true, msg: problem });

        const clash = await Coupon.findOne({ code: payload.code, _id: { $ne: req.params.id } });
        if (clash) return res.status(409).json({ error: true, msg: 'Another coupon already uses that code' });

        // usedCount is never taken from the request, only from real redemptions
        const doc = await Coupon.findByIdAndUpdate(req.params.id, payload, { new: true, runValidators: true });
        if (!doc) return res.status(404).json({ error: true, msg: 'Coupon not found' });

        await logAction({
            action: 'coupon.update', category: 'shop', admin: req.user, adminDoc: req.adminDoc,
            entityType: 'Coupon', entityId: doc._id, newValue: { code: doc.code }, req,
        }).catch(() => {});

        return res.json({ error: false, msg: 'Coupon updated', data: doc });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: true, msg: 'Failed to update coupon' });
    }
};

const deleteCoupon = async (req, res) => {
    try {
        const doc = await Coupon.findById(req.params.id);
        if (!doc) return res.status(404).json({ error: true, msg: 'Coupon not found' });

        // A code that has been redeemed is deactivated rather than deleted, so the
        // orders that reference it keep their history
        if (doc.usedCount > 0) {
            doc.isActive = false;
            await doc.save();
            return res.json({ error: false, msg: 'Coupon has redemptions, so it was deactivated instead of deleted', data: doc });
        }

        await Coupon.deleteOne({ _id: doc._id });
        await logAction({
            action: 'coupon.delete', category: 'shop', admin: req.user, adminDoc: req.adminDoc,
            entityType: 'Coupon', entityId: doc._id, prevValue: { code: doc.code }, req,
        }).catch(() => {});

        return res.json({ error: false, msg: 'Coupon deleted' });
    } catch (err) {
        return res.status(500).json({ error: true, msg: 'Failed to delete coupon' });
    }
};

module.exports = {
    validateCoupon,
    listCoupons,
    createCoupon,
    updateCoupon,
    deleteCoupon,
    claimRedemption,
    releaseRedemption,
    countUserUses,
    normalizeCode,
    priceCartLines,
};
