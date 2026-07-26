'use strict';

/**
 * Enterprise Key Generator
 * Usage: node scripts/gen-keys.js
 *
 * Generates all required secrets for OneMoreGift production.
 * The APP_MASTER_KEY is printed ONCE. Store it safely. It's needed to decrypt .env.enc at startup.
 */

const crypto = require('crypto');

function randomHex(bytes) {
    return crypto.randomBytes(bytes).toString('hex');
}

function randomBase64(bytes) {
    return crypto.randomBytes(bytes).toString('base64');
}

const masterKey = randomHex(32);
const fieldEncKey = randomHex(32);
const jwtSecret = randomHex(32);
const emailSigningSecret = randomHex(32);
const emailApiKey = randomHex(32);

const divider = '─'.repeat(64);

console.log('');
console.log(divider);
console.log('  🔐  OneMoreGift Enterprise Key Generator');
console.log(divider);
console.log('');
console.log('⚠️  IMPORTANT: Copy these values NOW. They are generated fresh each run.');
console.log('');
console.log('┌─────────────────────────────────────────────────────────────┐');
console.log('│  APP_MASTER_KEY  (keep ONLY in PM2 env or shell, never a .env file)');
console.log('└─────────────────────────────────────────────────────────────┘');
console.log(`APP_MASTER_KEY=${masterKey}`);
console.log('');
console.log('┌─────────────────────────────────────────────────────────────┐');
console.log('│  Paste these into your plain .env before encrypting it');
console.log('└─────────────────────────────────────────────────────────────┘');
console.log(`FIELD_ENCRYPTION_KEY=${fieldEncKey}`);
console.log(`JWT_SECRET=${jwtSecret}`);
console.log(`EMAIL_SERVICE_SIGNING_SECRET=${emailSigningSecret}`);
console.log(`EMAIL_SERVICE_API_KEY=${emailApiKey}`);
console.log('');
console.log(divider);
console.log('  Next steps:');
console.log('  1. Put the .env values above into your .env file');
console.log('  2. Run: node scripts/env-encrypt.js --key <APP_MASTER_KEY> --input .env --output .env.enc');
console.log('  3. Delete the plain .env from server (or chmod 000 it)');
console.log('  4. Set APP_MASTER_KEY in PM2 ecosystem config (ecosystem.config.cjs)');
console.log('  5. Restart PM2: pm2 restart all');
console.log(divider);
console.log('');
