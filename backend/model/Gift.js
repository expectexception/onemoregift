'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const giftSchema = new Schema({
    name: { type: String, required: true },
    description: { type: String },
    images: [{ type: String }],
    thumbnail: { type: String },

    // Value
    estimatedValue: { type: Number, default: 0 },

    // Stock
    stock: { type: Number, default: 0 },
    assignedCount: { type: Number, default: 0 },

    // Assignment rules
    occasions: [{ type: String }], // ['birthday', 'anniversary', 'custom']
    requiresVerification: { type: Boolean, default: true },
    minEventDaysAhead: { type: Number, default: 0 }, // event must be at least N days away

    // Status
    isActive: { type: Boolean, default: true },
    isArchived: { type: Boolean, default: false },

    // History
    assignmentHistory: [{
        requestId: { type: Schema.Types.ObjectId },
        requestType: { type: String, enum: ['surprise', 'moment'] },
        userId: { type: Schema.Types.ObjectId, ref: 'Users' },
        assignedBy: { type: Schema.Types.ObjectId, ref: 'admins' },
        assignedAt: { type: Date, default: Date.now },
    }],

}, { timestamps: true, versionKey: false });

giftSchema.index({ occasions: 1, isActive: 1 });

const Gift = mongoose.model('Gift', giftSchema);
module.exports = Gift;
