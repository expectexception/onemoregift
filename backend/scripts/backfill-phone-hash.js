'use strict';
// Backfills the deterministic phoneHash for existing users so duplicate-phone
// checks work (the encrypted phone field itself can never be queried).
//
// Usage: node scripts/backfill-phone-hash.js
// Safe to re-run — only touches users that have a phone but no phoneHash.
// Run this once on each environment (local + droplet) after deploying.

require('dotenv').config();
const mongoose = require('mongoose');
const { decrypt, hmacHash } = require('../utils/crypto');

(async () => {
    await mongoose.connect(process.env.MONGO_URI);
    // Raw collection access — bypasses model hooks so we control exactly what changes
    const users = mongoose.connection.collection('users');

    const cursor = users.find(
        { phone: { $exists: true, $nin: [null, ''] }, phoneHash: { $exists: false } },
        { projection: { phone: 1 } }
    );

    let updated = 0;
    const seen = new Map(); // phoneHash -> first userId, to report duplicates

    for await (const doc of cursor) {
        const plainPhone = decrypt(doc.phone);
        if (!plainPhone) continue;
        const hash = hmacHash(plainPhone);

        if (seen.has(hash)) {
            console.warn(`DUPLICATE PHONE: user ${doc._id} shares a phone with user ${seen.get(hash)} — skipping (fix manually, unique index will reject it)`);
            continue;
        }
        seen.set(hash, doc._id);

        // A pre-existing user may already own this hash from an earlier partial run
        const owner = await users.findOne({ phoneHash: hash }, { projection: { _id: 1 } });
        if (owner) {
            console.warn(`DUPLICATE PHONE: user ${doc._id} shares a phone with user ${owner._id} — skipping`);
            continue;
        }

        await users.updateOne({ _id: doc._id }, { $set: { phoneHash: hash } });
        updated++;
    }

    console.log(`Done. phoneHash set for ${updated} user(s).`);
    await mongoose.disconnect();
    process.exit(0);
})().catch((err) => {
    console.error('Backfill failed:', err.message);
    process.exit(1);
});
