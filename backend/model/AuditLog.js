'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Immutable audit log: never updated, only appended
const auditLogSchema = new Schema({
    action: { type: String, required: true }, // e.g. 'user.ban', 'product.create'
    category: {
        type: String,
        enum: ['user', 'admin', 'surprise', 'moment', 'product', 'order', 'store', 'gift', 'setting', 'auth', 'system'],
        required: true,
    },
    adminId: { type: Schema.Types.ObjectId, ref: 'admins' },
    adminEmail: { type: String },
    adminRole: { type: String },
    targetUserId: { type: Schema.Types.ObjectId, ref: 'Users' },
    entityType: { type: String }, // 'User', 'Product', 'Order', etc.
    entityId: { type: Schema.Types.ObjectId },
    prevValue: { type: Schema.Types.Mixed },
    newValue: { type: Schema.Types.Mixed },
    description: { type: String },
    ipAddress: { type: String },
    userAgent: { type: String },
    metadata: { type: Schema.Types.Mixed },
}, {
    timestamps: { createdAt: true, updatedAt: false }, // only createdAt
    versionKey: false,
});

// Make immutable: block all updates
auditLogSchema.pre(['updateOne', 'findOneAndUpdate', 'updateMany'], function (next) {
    next(new Error('AuditLog is immutable'));
});

const AuditLog = mongoose.model('AuditLog', auditLogSchema);
module.exports = AuditLog;
