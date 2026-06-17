'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ORDER_STATUSES = ['pending', 'paid', 'ready_for_pickup', 'collected', 'cancelled', 'refunded'];

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
    paymentStatus: { type: String, enum: ['pending', 'paid', 'failed', 'refunded'], default: 'pending' },
    paymentMethod: { type: String },
    paymentGateway: { type: String },
    paymentId: { type: String }, // gateway transaction ID
    paidAt: { type: Date },

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
        const count = await mongoose.model('Order').countDocuments({});
        this.orderNumber = `OMG-${date}-${String(count + 1).padStart(4, '0')}`;
    }
    next();
});

orderSchema.index({ userId: 1, status: 1 });
orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ pickupStoreId: 1, status: 1 });
orderSchema.index({ orderNumber: 1 });

const Order = mongoose.model('Order', orderSchema);
module.exports = Order;
module.exports.ORDER_STATUSES = ORDER_STATUSES;
