'use strict';

// One-off backfill: populate `nameHash` for users created before username login
// was fixed. Safe to run repeatedly. Reads each user (post-find hooks decrypt the
// name), recomputes the deterministic hash, and writes it directly so the pre-save
// encryption hooks are not re-triggered.
//
//   node scripts/backfill-name-hash.js
//
// Requires the same env as the app (MONGO_URI, FIELD_ENCRYPTION_KEY, ...).

require('../utils/loadEnv');
const mongoose = require('mongoose');
const Users = require('../model/Users');
const { hmacHash } = require('../utils/crypto');

(async () => {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('[backfill] connected');

    const cursor = Users.find({}).cursor(); // post-find decrypts name
    let scanned = 0;
    let updated = 0;
    for (let user = await cursor.next(); user != null; user = await cursor.next()) {
        scanned++;
        if (!user.name) continue;
        const expected = hmacHash(user.name); // user.name is decrypted here
        if (user.nameHash === expected) continue;
        await Users.collection.updateOne({ _id: user._id }, { $set: { nameHash: expected } });
        updated++;
    }

    console.log(`[backfill] done: scanned ${scanned}, updated ${updated}`);
    await mongoose.disconnect();
    process.exit(0);
})().catch((err) => {
    console.error('[backfill] failed:', err);
    process.exit(1);
});
