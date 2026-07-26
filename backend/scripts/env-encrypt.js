'use strict';

/**
 * Encrypt a plain .env file into an AES-256-GCM encrypted .env.enc
 * Usage:
 *   node scripts/env-encrypt.js --key <64-char-hex-master-key> [--input .env] [--output .env.enc]
 *
 * The output file format (JSON):
 *   { "v": 1, "iv": "<hex>", "tag": "<hex>", "data": "<hex>" }
 */

'use strict';

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const ALGORITHM = 'aes-256-gcm';

function parseArgs() {
    const args = process.argv.slice(2);
    const result = { key: null, input: '.env', output: '.env.enc' };
    for (let i = 0; i < args.length; i++) {
        if (args[i] === '--key' && args[i + 1]) result.key = args[++i];
        else if (args[i] === '--input' && args[i + 1]) result.input = args[++i];
        else if (args[i] === '--output' && args[i + 1]) result.output = args[++i];
    }
    return result;
}

function main() {
    const { key, input, output } = parseArgs();

    if (!key || key.length !== 64) {
        console.error('❌  --key must be a 64-character hex string (32 bytes).');
        console.error('   Generate one with: node scripts/gen-keys.js');
        process.exit(1);
    }

    const inputPath = path.resolve(process.cwd(), input);
    const outputPath = path.resolve(process.cwd(), output);

    if (!fs.existsSync(inputPath)) {
        console.error(`❌  Input file not found: ${inputPath}`);
        process.exit(1);
    }

    const plaintext = fs.readFileSync(inputPath, 'utf8');
    const keyBuf = Buffer.from(key, 'hex');
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv(ALGORITHM, keyBuf, iv);
    const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();

    const payload = JSON.stringify({
        v: 1,
        iv: iv.toString('hex'),
        tag: tag.toString('hex'),
        data: encrypted.toString('hex'),
    });

    fs.writeFileSync(outputPath, payload, 'utf8');

    console.log(`✅  Encrypted ${input} → ${output}`);
    console.log(`   Lines: ${plaintext.split('\n').length}`);
    console.log(`   Size: ${Buffer.byteLength(payload)} bytes`);
    console.log('');
    console.log('⚠️  NEXT: Delete or chmod 000 the plain .env file from server.');
    console.log('   Then set APP_MASTER_KEY in your PM2 ecosystem config and restart.');
}

main();
