'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const SystemConfigSchema = new Schema({
    key: {
        type: String,
        required: true,
        unique: true,
    },
    value: {
        type: Schema.Types.Mixed,
        required: true,
    },
}, { timestamps: true, versionKey: false });

const SystemConfig = mongoose.model('configs', SystemConfigSchema);
module.exports = SystemConfig;
