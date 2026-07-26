'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const DISCOUNT_TYPES = ['percent', 'flat'];

const couponSchema = new Schema({
    // Stored uppercase and matched case-insensitively, because customers type these
    // by hand off a WhatsApp message
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    description: { type: String },

    discountType: { type: String, enum: DISCOUNT_TYPES, required: true, default: 'percent' },
    // Percentage (1-100) or a flat rupee amount, depending on discountType
    discountValue: { type: Number, required: true, min: 0 },
    // Ceiling on a percentage discount. 0 means no ceiling.
    maxDiscount: { type: Number, default: 0, min: 0 },
    // Cart subtotal the order must reach before the code applies
    minOrderValue: { type: Number, default: 0, min: 0 },

    validFrom: { type: Date, default: null },
    validUntil: { type: Date, default: null },

    // 0 means unlimited on both counters
    usageLimit: { type: Number, default: 0, min: 0 },
    perUserLimit: { type: Number, default: 1, min: 0 },
    usedCount: { type: Number, default: 0, min: 0 },

    // Empty arrays mean the code applies to the whole catalogue
    productIds: [{ type: Schema.Types.ObjectId, ref: 'Product' }],
    categories: [{ type: String }],

    isActive: { type: Boolean, default: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'admins' },
}, { timestamps: true, versionKey: false });

couponSchema.index({ isActive: 1, validUntil: 1 });

const Coupon = mongoose.model('Coupon', couponSchema);
module.exports = Coupon;
module.exports.DISCOUNT_TYPES = DISCOUNT_TYPES;
