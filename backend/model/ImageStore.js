'use strict';

const mongoose = require('mongoose');

/**
 * Used when IMAGE_STORAGE=mongodb
 * Stores compressed image binary + metadata directly in MongoDB.
 */
const imageStoreSchema = new mongoose.Schema({
    filename: { type: String, required: true },
    mimetype: { type: String, required: true },
    size: { type: Number, required: true },       // bytes after compression
    originalSize: { type: Number },                // bytes before compression
    data: { type: Buffer, required: true },
    uploadedBy: { type: String, default: 'admin' },
}, { timestamps: true, versionKey: false });

module.exports = mongoose.model('ImageStore', imageStoreSchema);
