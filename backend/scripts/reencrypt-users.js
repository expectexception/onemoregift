'use strict';
// Repairs users whose PII was stored in PLAINTEXT by the broken
// pre('findOneAndUpdate') encryption hook (it missed fields that mongoose kept
// top-level while timestamps injected $set.updatedAt). For every user this:
//   - encrypts any plaintext phone/address/name/fullName/email/addresses fields
//   - recomputes emailHash and phoneHash from the plain values (fixes stale
//     emailHash after email changes, which silently broke login by new email)
//
// Usage: node scripts/reencrypt-users.js
// Safe to re-run (idempotent). Run once per environment after deploying the fix.

require('dotenv').config();
const mongoose = require('mongoose');
const { encrypt, decrypt, hmacHash, isEncrypted } = require('../utils/crypto');

const SCALARS = ['phone', 'address', 'name', 'fullName'];
const ADDRESS_FIELDS = ['fullName', 'phone', 'line1', 'line2', 'city', 'state', 'country', 'postalCode', 'label'];

(async () => {
    await mongoose.connect(process.env.MONGO_URI);
    const users = mongoose.connection.collection('users');

    let repaired = 0;
    let scanned = 0;

    for await (const doc of users.find({})) {
        scanned++;
        const set = {};

        for (const f of SCALARS) {
            if (doc[f] && typeof doc[f] === 'string' && !isEncrypted(doc[f])) {
                set[f] = encrypt(doc[f]);
            }
        }

        if (doc.email && typeof doc.email === 'string') {
            const plainEmail = isEncrypted(doc.email) ? decrypt(doc.email) : doc.email;
            const wantHash = hmacHash(plainEmail);
            if (!isEncrypted(doc.email)) set.email = encrypt(plainEmail);
            if (doc.emailHash !== wantHash) set.emailHash = wantHash;
        }

        if (doc.phone && typeof doc.phone === 'string') {
            const plainPhone = isEncrypted(doc.phone) ? decrypt(doc.phone) : doc.phone;
            const wantHash = hmacHash(plainPhone);
            if (doc.phoneHash !== wantHash) set.phoneHash = wantHash;
        }

        if (doc.legalConsent?.ipAddress && !isEncrypted(doc.legalConsent.ipAddress)) {
            set['legalConsent.ipAddress'] = encrypt(doc.legalConsent.ipAddress);
        }

        if (Array.isArray(doc.addresses) && doc.addresses.length) {
            const needsWork = doc.addresses.some(a => ADDRESS_FIELDS.some(f => a?.[f] && !isEncrypted(a[f])));
            if (needsWork) {
                set.addresses = doc.addresses.map(a => {
                    const copy = { ...a };
                    for (const f of ADDRESS_FIELDS) {
                        if (copy[f] && !isEncrypted(copy[f])) copy[f] = encrypt(copy[f]);
                    }
                    return copy;
                });
            }
        }

        if (Object.keys(set).length) {
            await users.updateOne({ _id: doc._id }, { $set: set });
            repaired++;
            console.log(`repaired ${doc._id}: ${Object.keys(set).join(', ')}`);
        }
    }

    console.log(`Done. Scanned ${scanned} user(s), repaired ${repaired}.`);
    await mongoose.disconnect();
    process.exit(0);
})().catch((err) => {
    console.error('Re-encrypt failed:', err.message);
    process.exit(1);
});
