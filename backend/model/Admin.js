'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const AdminSchema = new Schema({
    username: { type: String },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    image: { type: String },
    isAdmin: { type: Boolean, default: false },
    // role field was used in controller but missing from schema
    role: { type: String, default: 'admin' },
    loginOtp: {
        token: { type: String },
        expires: { type: Date },
        attempts: { type: Number, default: 0 },
    },
}, { timestamps: true, versionKey: false });

const Admin = mongoose.model('admins', AdminSchema);
module.exports = Admin;