'use strict';

const mongoose = require('mongoose');
const { encrypt, decrypt } = require('../utils/crypto');

// Fields encrypted at rest with AES-256-GCM
const ENCRYPTED_SCALAR_FIELDS = ['phone', 'address'];

const addressSubSchema = new mongoose.Schema({
    label: { type: String, default: 'Home' },
    fullName: { type: String, default: '' },
    line1: { type: String, default: '' },
    line2: { type: String, default: '' },
    city: { type: String, default: '' },
    state: { type: String, default: '' },
    country: { type: String, default: '' },
    postalCode: { type: String, default: '' },
    phone: { type: String, default: '' },
    isDefault: { type: Boolean, default: false },
}, { _id: true });

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
        default: '',
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
    blocked: {
        type: Boolean,
        default: false,
    },
    resetToken: {
        token: { type: String },
        attempts: { type: Number },
        expires: { type: Date },
    },
    loginOtp: {
        token: { type: String },
        expires: { type: Date },
        attempts: { type: Number, default: 0 },
    },
    googleId: { type: String },
    isGoogleAuth: { type: Boolean, default: false },
    localPasswordSet: { type: Boolean, default: true },
    avatar: { type: String },
    address: { type: String },
    addresses: [addressSubSchema],
    // BUG FIX: was default true — new users must verify email first
    isVerified: {
        type: Boolean,
        default: false,
    },
    legalConsent: {
        termsAcceptedAt: { type: Date },
        privacyAcceptedAt: { type: Date },
        policyVersion: { type: String },
        ipAddress: { type: String },
        userAgent: { type: String },
    },
}, { timestamps: true, versionKey: false });

// ── Encryption: pre-save ──────────────────────────────────────────────────────
userSchema.pre('save', function (next) {
    try {
        // Scalar fields
        for (const field of ENCRYPTED_SCALAR_FIELDS) {
            if (this.isModified(field) && this[field]) {
                this[field] = encrypt(this[field]);
            }
        }
        // legalConsent.ipAddress
        if (this.isModified('legalConsent.ipAddress') && this.legalConsent && this.legalConsent.ipAddress) {
            this.legalConsent.ipAddress = encrypt(this.legalConsent.ipAddress);
        }
        // addresses array — encrypt phone inside each sub-doc
        if (this.isModified('addresses') && Array.isArray(this.addresses)) {
            this.addresses.forEach((addr) => {
                if (addr.phone) addr.phone = encrypt(addr.phone);
                if (addr.line1) addr.line1 = encrypt(addr.line1);
                if (addr.line2) addr.line2 = encrypt(addr.line2);
            });
        }
        next();
    } catch (err) {
        next(err);
    }
});

// ── Decryption: post-find hooks ───────────────────────────────────────────────
function decryptDoc(doc) {
    if (!doc) return;
    for (const field of ENCRYPTED_SCALAR_FIELDS) {
        if (doc[field]) doc[field] = decrypt(doc[field]);
    }
    if (doc.legalConsent && doc.legalConsent.ipAddress) {
        doc.legalConsent.ipAddress = decrypt(doc.legalConsent.ipAddress);
    }
    if (Array.isArray(doc.addresses)) {
        doc.addresses.forEach((addr) => {
            if (addr.phone) addr.phone = decrypt(addr.phone);
            if (addr.line1) addr.line1 = decrypt(addr.line1);
            if (addr.line2) addr.line2 = decrypt(addr.line2);
        });
    }
}

userSchema.post('find', function (docs) {
    docs.forEach(decryptDoc);
});
userSchema.post('findOne', function (doc) {
    decryptDoc(doc);
});
userSchema.post('findOneAndUpdate', function (doc) {
    decryptDoc(doc);
});
userSchema.post('save', function (doc) {
    decryptDoc(doc);
});

const Users = mongoose.model('Users', userSchema);

module.exports = Users;
