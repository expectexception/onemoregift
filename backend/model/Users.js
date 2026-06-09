'use strict';

const mongoose = require('mongoose');
const { encrypt, decrypt, hmacHash } = require('../utils/crypto');

// Scalar top-level fields encrypted at rest with AES-256-GCM
const ENCRYPTED_SCALAR_FIELDS = ['phone', 'address', 'name', 'fullName'];

// Address sub-document fields encrypted at rest
const ENCRYPTED_ADDRESS_FIELDS = ['fullName', 'phone', 'line1', 'line2', 'city', 'state', 'country', 'postalCode', 'label'];

const addressSubSchema = new mongoose.Schema({
    label: { type: String, default: 'Home' },
    fullName: { type: String, default: '' },
    line1: { type: String, default: '' },
    line2: { type: String, default: '' },
    city: { type: String, default: '' },
    state: { type: String, default: '' },
    country: { type: String, default: '' },
    countryCode: { type: String, default: '' },
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
    // Deterministic HMAC hash of email for lookups (since email field is encrypted)
    emailHash: {
        type: String,
        unique: true,
        sparse: true,
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

        // Email hash for lookups (derived from the plain value before encrypting)
        if (this.isModified('email') && this.email) {
            // email may already be encrypted by the line above if 'email' was in ENCRYPTED_SCALAR_FIELDS
            // We handle hash separately: email is NOT in ENCRYPTED_SCALAR_FIELDS to control order
            // Note: email is encrypted below explicitly
        }

        // Encrypt email explicitly and set hash before encryption
        if (this.isModified('email') && this.email) {
            const plain = decrypt(this.email); // safe — returns plain if not yet encrypted
            this.emailHash = hmacHash(plain);
            this.email = encrypt(plain);
        }

        // legalConsent.ipAddress
        if (this.isModified('legalConsent.ipAddress') && this.legalConsent && this.legalConsent.ipAddress) {
            this.legalConsent.ipAddress = encrypt(this.legalConsent.ipAddress);
        }

        // addresses array — encrypt all sensitive fields
        if (this.isModified('addresses') && Array.isArray(this.addresses)) {
            this.addresses.forEach((addr) => {
                for (const f of ENCRYPTED_ADDRESS_FIELDS) {
                    if (addr[f]) addr[f] = encrypt(addr[f]);
                }
            });
        }

        next();
    } catch (err) {
        next(err);
    }
});

// Handle findOneAndUpdate — encrypt fields in $set
userSchema.pre('findOneAndUpdate', function (next) {
    try {
        const update = this.getUpdate();
        const setObj = update?.$set || update;
        if (!setObj) return next();

        // Scalar fields in update
        for (const field of ['phone', 'address', 'name', 'fullName']) {
            if (setObj[field]) {
                setObj[field] = encrypt(setObj[field]);
            }
        }

        // Email in update
        if (setObj.email) {
            const plain = decrypt(setObj.email);
            setObj.emailHash = hmacHash(plain);
            setObj.email = encrypt(plain);
        }

        // Addresses array in update
        if (Array.isArray(setObj.addresses)) {
            setObj.addresses = setObj.addresses.map((addr) => {
                const copy = { ...addr };
                for (const f of ENCRYPTED_ADDRESS_FIELDS) {
                    if (copy[f]) copy[f] = encrypt(copy[f]);
                }
                return copy;
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

    if (doc.email) doc.email = decrypt(doc.email);

    if (doc.legalConsent && doc.legalConsent.ipAddress) {
        doc.legalConsent.ipAddress = decrypt(doc.legalConsent.ipAddress);
    }

    if (Array.isArray(doc.addresses)) {
        doc.addresses.forEach((addr) => {
            for (const f of ENCRYPTED_ADDRESS_FIELDS) {
                if (addr[f]) addr[f] = decrypt(addr[f]);
            }
        });
    }
}

userSchema.post('find', function (docs) { docs.forEach(decryptDoc); });
userSchema.post('findOne', function (doc) { decryptDoc(doc); });
userSchema.post('findOneAndUpdate', function (doc) { decryptDoc(doc); });
userSchema.post('save', function (doc) { decryptDoc(doc); });

const Users = mongoose.model('Users', userSchema);

module.exports = Users;
