const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    phone: {
        type: String,
        required: false,
        unique: true,
        sparse: true,
        default: null,
    },
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    blocked: {
        type: Boolean,
        default: false
    },
    resetToken: {
        token: {
            type: String,
        },
        attempts: {
            type: Number,
        },
        expires: {
            type: Date,
        }
    },
    loginOtp: {
        token: {
            type: String,
        },
        expires: {
            type: Date,
        },
        attempts: {
            type: Number,
            default: 0,
        }
    },
    googleId: {
        type: String,
    },
    isGoogleAuth: {
        type: Boolean,
        default: false,
    },
    avatar: {
        type: String,
    },
    address: {
        type: String
    },
    isVerified: {
        type: Boolean,
        default: true
    },
    legalConsent: {
        termsAcceptedAt: {
            type: Date,
        },
        privacyAcceptedAt: {
            type: Date,
        },
        policyVersion: {
            type: String,
        },
        ipAddress: {
            type: String,
        },
        userAgent: {
            type: String,
        }
    }
}, { timestamps: true, versionKey: false });



const Users = mongoose.model('Users', userSchema);

module.exports = Users;
