'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const { encrypt, decrypt, hmacHash } = require('../utils/crypto');

// Someone who asked to be told when the next drop opens, or when a specific
// product is back in stock. Email is encrypted at rest like every other address
// in this system, with a deterministic hash so duplicates can still be caught.
const dropSubscriberSchema = new Schema({
    email: { type: String, required: true },
    emailHash: { type: String, required: true, index: true },

    // Null for a general "tell me about the next drop" signup
    productId: { type: Schema.Types.ObjectId, ref: 'Product', default: null },
    // Set when a signed-in customer subscribes, so the admin can see who it was
    userId: { type: Schema.Types.ObjectId, ref: 'Users', default: null },

    source: { type: String, default: 'shop' },
    notifiedAt: { type: Date, default: null },
    isActive: { type: Boolean, default: true },
}, { timestamps: true, versionKey: false });

// One live subscription per email per product
dropSubscriberSchema.index({ emailHash: 1, productId: 1 }, { unique: true });

dropSubscriberSchema.pre('save', function (next) {
    if (this.isModified('email')) {
        const plain = decrypt(this.email); // safe, returns plain if not yet encrypted
        this.emailHash = hmacHash(plain.toLowerCase());
        this.email = encrypt(plain);
    }
    next();
});

const decryptDoc = (doc) => {
    if (!doc) return doc;
    const list = Array.isArray(doc) ? doc : [doc];
    list.forEach((d) => {
        if (d && d.email) {
            try { d.email = decrypt(d.email); } catch (_) { /* leave as-is */ }
        }
    });
    return doc;
};

dropSubscriberSchema.post('find', decryptDoc);
dropSubscriberSchema.post('findOne', decryptDoc);
dropSubscriberSchema.post('save', decryptDoc);

const DropSubscriber = mongoose.model('DropSubscriber', dropSubscriberSchema);
module.exports = DropSubscriber;
