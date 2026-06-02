const mongoose = require('mongoose');

const pendingRegistrationSchema = new mongoose.Schema({
    phone: {
        type: String,
        required: true,
    },
    name: {
        type: String,
        required: true,
    },
    fullName: {
        type: String,
        default: "",
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    loginOtp: {
        token: {
            type: String,
            required: true,
        },
        expires: {
            type: Date,
            required: true,
        },
        attempts: {
            type: Number,
            default: 0,
        }
    },
    legalConsent: {
        termsAcceptedAt: Date,
        privacyAcceptedAt: Date,
        policyVersion: String,
        ipAddress: String,
        userAgent: String,
    }
}, { timestamps: true, versionKey: false });

pendingRegistrationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 });
pendingRegistrationSchema.index({ phone: 1 });

module.exports = mongoose.model('PendingRegistration', pendingRegistrationSchema);
