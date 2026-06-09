'use strict';

/**
 * Decrypt a .env.enc file back to plaintext (for inspection/debugging)
 * Usage:
 *   node scripts/env-decrypt.js --key <64-char-hex-master-key> [--input .env.enc]
 *
 * Prints decrypted content to stdout. Does NOT write to disk.
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const ALGORITHM = 'aes-256-gcm';

function parseArgs() {
    const args = process.argv.slice(2);
    const result = { key: null, input: '.env.enc' };
    for (let i = 0; i < args.length; i++) {
        if (args[i] === '--key' && args[i + 1]) result.key = args[++i];
        else if (args[i] === '--input' && args[i + 1]) result.input = args[++i];
    }
    return result;
}

function main() {
    const { key, input } = parseArgs();

    if (!key || key.length !== 64) {
        console.error('❌  --key must be a 64-character hex string (32 bytes).');
        process.exit(1);
    }

    const inputPath = path.resolve(process.cwd(), input);
    if (!fs.existsSync(inputPath)) {
        console.error(`❌  File not found: ${inputPath}`);
        process.exit(1);
    }

    let payload;
    try {
        payload = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
    } catch {
        console.error('❌  Failed to parse .env.enc — file may be corrupted.');
        process.exit(1);
    }

    if (payload.v !== 1) {
        console.error(`❌  Unknown format version: ${payload.v}`);
        process.exit(1);
    }

    try {
        const keyBuf = Buffer.from(key, 'hex');
        const iv = Buffer.from(payload.iv, 'hex');
        const tag = Buffer.from(payload.tag, 'hex');
        const data = Buffer.from(payload.data, 'hex');

        const decipher = crypto.createDecipheriv(ALGORITHM, keyBuf, iv);
        decipher.setAuthTag(tag);
        const plaintext = Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8');

        console.log('✅  Decrypted content:\n');
        console.log(plaintext);
    } catch (err) {
        console.error('❌  Decryption failed — wrong key or corrupted file.');
        console.error(err.message);
        process.exit(1);
    }
}

main();
