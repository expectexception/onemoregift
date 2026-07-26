'use strict';

/**
 * One-time migration: populate emailHash for all existing users, and
 * re-encrypt any fields that may have been stored in plaintext before the
 * current encryption scheme was in place.
 *
 * Usage:
 *   node scripts/migrate-encrypt.js           # live run
 *   node scripts/migrate-encrypt.js --dry-run # preview only, no writes
 *
 * Run AFTER deploying the new code with the FIELD_ENCRYPTION_KEY set.
 * Safe to run multiple times: already-encrypted fields are skipped.
 */

require('../utils/loadEnv');

const mongoose = require('mongoose');
const { hmacHash, isEncrypted, encrypt } = require('../utils/crypto');

const DRY_RUN = process.argv.includes('--dry-run');

async function main() {
    const MONGO_URI = process.env.MONGO_URI;
    if (!MONGO_URI) {
        console.error('❌  MONGO_URI not set. Check your .env or APP_MASTER_KEY.');
        process.exit(1);
    }

    console.log(`[migrate-encrypt] Connecting to MongoDB...`);
    await mongoose.connect(MONGO_URI);
    console.log(`[migrate-encrypt] Connected.`);
    if (DRY_RUN) console.log(`[migrate-encrypt] DRY RUN, no writes will be made.\n`);

    const db = mongoose.connection.db;
    const users = db.collection('users');

    const cursor = users.find({});
    let total = 0, updated = 0, skipped = 0, errors = 0;

    while (await cursor.hasNext()) {
        const doc = await cursor.next();
        total++;
        try {
            const patch = {};

            // Populate emailHash if missing
            if (doc.email && !doc.emailHash) {
                // If email is encrypted, decrypt first; otherwise it's the plain value
                const plainEmail = isEncrypted(doc.email)
                    ? (() => {
                        const { decrypt } = require('../utils/crypto');
                        return decrypt(doc.email);
                    })()
                    : doc.email.trim().toLowerCase();
                patch.emailHash = hmacHash(plainEmail);
                // Ensure email is encrypted
                if (!isEncrypted(doc.email)) {
                    patch.email = encrypt(plainEmail);
                }
            }

            // Encrypt name if plaintext
            if (doc.name && !isEncrypted(doc.name)) {
                patch.name = encrypt(doc.name);
            }
            // Encrypt fullName if plaintext
            if (doc.fullName && !isEncrypted(doc.fullName)) {
                patch.fullName = encrypt(doc.fullName);
            }
            // Encrypt phone if plaintext
            if (doc.phone && !isEncrypted(doc.phone)) {
                patch.phone = encrypt(doc.phone);
            }
            // Encrypt address if plaintext
            if (doc.address && !isEncrypted(doc.address)) {
                patch.address = encrypt(doc.address);
            }

            // Encrypt address sub-fields
            const ADDRESS_FIELDS = ['fullName', 'phone', 'line1', 'line2', 'city', 'state', 'country', 'postalCode', 'label'];
            if (Array.isArray(doc.addresses) && doc.addresses.length > 0) {
                let addrChanged = false;
                const newAddresses = doc.addresses.map((addr) => {
                    const a = { ...addr };
                    for (const f of ADDRESS_FIELDS) {
                        if (a[f] && !isEncrypted(a[f])) {
                            a[f] = encrypt(a[f]);
                            addrChanged = true;
                        }
                    }
                    return a;
                });
                if (addrChanged) patch.addresses = newAddresses;
            }

            // legalConsent.ipAddress
            if (doc.legalConsent?.ipAddress && !isEncrypted(doc.legalConsent.ipAddress)) {
                patch['legalConsent.ipAddress'] = encrypt(doc.legalConsent.ipAddress);
            }

            if (Object.keys(patch).length === 0) {
                skipped++;
                continue;
            }

            if (!DRY_RUN) {
                await users.updateOne({ _id: doc._id }, { $set: patch });
            }

            updated++;
            const email = doc.email?.substring(0, 20) || doc._id;
            console.log(`  ✓ [${DRY_RUN ? 'would update' : 'updated'}] user: ${email}... (${Object.keys(patch).join(', ')})`);
        } catch (err) {
            errors++;
            console.error(`  ✗ [error] user ${doc._id}: ${err.message}`);
        }
    }

    console.log(`\n[migrate-encrypt] Done.`);
    console.log(`  Total: ${total} | Updated: ${updated} | Skipped (already encrypted): ${skipped} | Errors: ${errors}`);
    if (DRY_RUN) console.log(`  DRY RUN, run without --dry-run to apply changes.`);

    await mongoose.disconnect();
    process.exit(errors > 0 ? 1 : 0);
}

main().catch(err => {
    console.error('[migrate-encrypt] Fatal error:', err);
    process.exit(1);
});
