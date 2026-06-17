'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const OCCASION_TYPES = ['birthday', 'anniversary', 'wedding', 'graduation', 'achievement', 'festival', 'custom'];
const STATUS_TYPES = ['draft', 'submitted', 'under_review', 'verification_pending', 'approved', 'rejected', 'gift_assigned', 'completed'];

const verificationTimelineSchema = new Schema({
    status: { type: String },
    note: { type: String },
    adminId: { type: Schema.Types.ObjectId, ref: 'admins' },
    adminEmail: { type: String },
    at: { type: Date, default: Date.now },
}, { _id: false });

const surpriseRequestSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'Users', required: true },

    // Event info
    eventName: { type: String, required: true },
    eventType: { type: String, enum: OCCASION_TYPES, required: true },
    eventDate: { type: Date, required: true },
    description: { type: String },

    // Recipient
    recipientName: { type: String, required: true },
    recipientContact: { type: String },

    // Documents uploaded by user
    documents: [{ type: String }], // file URLs/paths

    // Status workflow
    status: { type: String, enum: STATUS_TYPES, default: 'draft' },

    // Admin
    adminNotes: { type: String },
    reviewedBy: { type: Schema.Types.ObjectId, ref: 'admins' },
    reviewedAt: { type: Date },
    rejectionReason: { type: String },

    // Gift
    assignedGift: { type: Schema.Types.ObjectId, ref: 'Gift' },
    giftAssignedAt: { type: Date },
    giftAssignedBy: { type: Schema.Types.ObjectId, ref: 'admins' },

    // Timeline
    verificationTimeline: [verificationTimelineSchema],

    // Flags
    isFraudFlagged: { type: Boolean, default: false },
    fraudFlagReason: { type: String },

    // Notifications sent
    notificationsSent: [{ type: String, at: Date }],

}, { timestamps: true, versionKey: false });

surpriseRequestSchema.index({ userId: 1, status: 1 });
surpriseRequestSchema.index({ eventDate: 1 });
surpriseRequestSchema.index({ status: 1, createdAt: -1 });

const SurpriseRequest = mongoose.model('SurpriseRequest', surpriseRequestSchema);
module.exports = SurpriseRequest;
module.exports.OCCASION_TYPES = OCCASION_TYPES;
module.exports.STATUS_TYPES = STATUS_TYPES;
