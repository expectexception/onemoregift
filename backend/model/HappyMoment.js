'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const MOMENT_STATUSES = ['draft', 'submitted', 'under_review', 'verification_pending', 'approved', 'rejected', 'gift_assigned', 'published'];

const reactionSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'Users' },
    type: { type: String, enum: ['like', 'love', 'wow', 'celebrate'], default: 'like' },
    at: { type: Date, default: Date.now },
}, { _id: false });

const reportSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'Users' },
    reason: { type: String },
    at: { type: Date, default: Date.now },
    resolved: { type: Boolean, default: false },
}, { _id: true });

const happyMomentSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'Users', required: true },

    caption: { type: String, required: true },
    description: { type: String },

    // Media uploaded by user
    media: [{ url: String, type: { type: String, enum: ['image', 'video'] }, thumbnail: String }],
    proofs: [{ type: String }], // verification documents

    status: { type: String, enum: MOMENT_STATUSES, default: 'draft' },
    isFeatured: { type: Boolean, default: false },
    isPublished: { type: Boolean, default: false },

    // Community
    reactions: [reactionSchema],
    reports: [reportSchema],
    viewCount: { type: Number, default: 0 },

    // Admin
    adminNotes: { type: String },
    reviewedBy: { type: Schema.Types.ObjectId, ref: 'admins' },
    reviewedAt: { type: Date },
    rejectionReason: { type: String },

    // Gift
    assignedGift: { type: Schema.Types.ObjectId, ref: 'Gift' },
    giftAssignedAt: { type: Date },
    giftAssignedBy: { type: Schema.Types.ObjectId, ref: 'admins' },

    publishedAt: { type: Date },
    unpublishedAt: { type: Date },

}, { timestamps: true, versionKey: false });

happyMomentSchema.index({ userId: 1, status: 1 });
happyMomentSchema.index({ isPublished: 1, isFeatured: -1, createdAt: -1 });
happyMomentSchema.index({ status: 1, createdAt: -1 });

const HappyMoment = mongoose.model('HappyMoment', happyMomentSchema);
module.exports = HappyMoment;
module.exports.MOMENT_STATUSES = MOMENT_STATUSES;
