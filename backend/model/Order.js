'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const Counter = require('./Counter');

const ORDER_STATUSES = ['pending', 'paid', 'ready_for_pickup', 'collected', 'cancelled', 'refunded'];

// Legal status transitions — prevents e.g. moving a collected order back to pending
const ORDER_STATUS_TRANSITIONS = {
    pending: ['paid', 'cancelled'],
    paid: ['ready_for_pickup', 'refunded', 'cancelled'],
    ready_for_pickup: ['collected', 'refunded', 'cancelled'],
    collected: ['refunded'],
    cancelled: [],
    refunded: [],
};

const orderItemSchema = new Schema({
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    productName: { type: String },
    variantId: { type: Schema.Types.ObjectId },
    variantName: { type: String },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true },
    totalPrice: { type: Number, required: true },
}, { _id: true });

const orderSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'Users', required: true },
    orderNumber: { type: String, unique: true }, // auto-generated e.g. OMG-20260601-0001

    items: [orderItemSchema],
    subtotal: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    total: { type: Number, required: true },

    couponCode: { type: String },

    // Payment
    paymentStatus: { type: String, enum: ['pending', 'verification_pending', 'paid', 'failed', 'refunded'], default: 'pending' },
    paymentMethod: { type: String },
    paymentGateway: { type: String },
    paymentId: { type: String }, // gateway transaction ID
    paidAt: { type: Date },

    // Manual QR/UPI payment — user uploads proof, admin verifies
    paymentProofs: [{
        url: { type: String, required: true },
        uploadedAt: { type: Date, default: Date.now },
    }],
    paymentReference: { type: String }, // UPI transaction ID entered by user
    paymentProofSubmittedAt: { type: Date },
    paymentVerifiedAt: { type: Date },
    paymentVerifiedBy: { type: Schema.Types.ObjectId, ref: 'admins' },
    paymentRejectedReason: { type: String },

    // Pickup
    pickupStoreId: { type: Schema.Types.ObjectId, ref: 'Store' },
    scheduledPickupTime: { type: Date },
    pickupCode: { type: String }, // QR code value
    pickupVerifiedAt: { type: Date },
    pickupVerifiedBy: { type: Schema.Types.ObjectId, ref: 'admins' },

    // Status
    status: { type: String, enum: ORDER_STATUSES, default: 'pending' },

    // Notes
    customerNote: { type: String },
    adminNote: { type: String },

    // Refund
    refundReason: { type: String },
    refundedAt: { type: Date },
    refundedBy: { type: Schema.Types.ObjectId, ref: 'admins' },

    // Cancellation
    cancelledReason: { type: String },
    cancelledAt: { type: Date },
    cancelledBy: { type: Schema.Types.ObjectId, ref: 'admins' },

    invoiceUrl: { type: String },

}, { timestamps: true, versionKey: false });

// Auto-generate order number
orderSchema.pre('save', async function (next) {
    if (!this.orderNumber) {
        const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const seq = await Counter.nextSeq(`order-${date}`);
        this.orderNumber = `OMG-${date}-${String(seq).padStart(4, '0')}`;
    }
    next();
});

orderSchema.index({ userId: 1, status: 1 });
orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ pickupStoreId: 1, status: 1 });

const Order = mongoose.model('Order', orderSchema);
module.exports = Order;
module.exports.ORDER_STATUSES = ORDER_STATUSES;
module.exports.ORDER_STATUS_TRANSITIONS = ORDER_STATUS_TRANSITIONS;
