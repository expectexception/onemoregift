'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const operatingHoursSchema = new Schema({
    day: { type: String, enum: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] },
    open: { type: String }, // '09:00'
    close: { type: String }, // '18:00'
    isClosed: { type: Boolean, default: false },
}, { _id: false });

const storeSchema = new Schema({
    name: { type: String, required: true },
    code: { type: String, unique: true }, // short code e.g. 'DEL-01'

    // Location
    address: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String },
    country: { type: String, default: 'India' },
    postalCode: { type: String },
    landmark: { type: String },
    coordinates: {
        lat: { type: Number },
        lng: { type: Number },
    },

    // Contact
    phone: { type: String },
    email: { type: String },
    managerId: { type: Schema.Types.ObjectId, ref: 'admins' },

    // Capacity
    dailyPickupCapacity: { type: Number, default: 50 },
    operatingHours: [operatingHoursSchema],

    isActive: { type: Boolean, default: true },

    // Analytics
    totalPickups: { type: Number, default: 0 },

}, { timestamps: true, versionKey: false });

storeSchema.index({ city: 1, isActive: 1 });

const Store = mongoose.model('Store', storeSchema);
module.exports = Store;
