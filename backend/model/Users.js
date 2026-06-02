const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    phone: {
        type: String,
        required: false,
        unique: true,
        sparse: true,
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
    localPasswordSet: {
        type: Boolean,
        default: true,
    },
    avatar: {
        type: String,
    },
    address: {
        type: String
    },
    addresses: [{
        label: {
            type: String,
            default: "Home",
        },
        fullName: {
            type: String,
            default: "",
        },
        line1: {
            type: String,
            default: "",
        },
        line2: {
            type: String,
            default: "",
        },
        city: {
            type: String,
            default: "",
        },
        state: {
            type: String,
            default: "",
        },
        country: {
            type: String,
            default: "",
        },
        postalCode: {
            type: String,
            default: "",
        },
        phone: {
            type: String,
            default: "",
        },
        isDefault: {
            type: Boolean,
            default: false,
        }
    }],
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
