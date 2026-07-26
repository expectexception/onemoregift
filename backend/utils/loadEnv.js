'use strict';

/**
 * loadEnv: Decrypts .env.enc into process.env at startup.
 *
 * Requires APP_MASTER_KEY to be set in the process environment BEFORE
 * this module is loaded (e.g. via PM2 ecosystem config env block or shell).
 *
 * Falls back to plain dotenv (.env) if:
 *   - APP_MASTER_KEY is not set AND .env.enc does not exist (dev mode)
 *   - NODE_ENV === 'test' (uses .env.testing instead)
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

const ALGORITHM = 'aes-256-gcm';
const ROOT = path.resolve(__dirname, '..');

function decryptEnvFile(encPath, masterKey) {
    if (masterKey.length !== 64) {
        throw new Error(
            `APP_MASTER_KEY must be a 64-character hex string. Got length: ${masterKey.length}`
        );
    }

    let payload;
    try {
        payload = JSON.parse(fs.readFileSync(encPath, 'utf8'));
    } catch {
        throw new Error(`Failed to parse ${encPath}, file may be corrupted.`);
    }

    if (payload.v !== 1) {
        throw new Error(`Unknown .env.enc format version: ${payload.v}`);
    }

    const keyBuf = Buffer.from(masterKey, 'hex');
    const iv = Buffer.from(payload.iv, 'hex');
    const tag = Buffer.from(payload.tag, 'hex');
    const data = Buffer.from(payload.data, 'hex');

    const decipher = crypto.createDecipheriv(ALGORITHM, keyBuf, iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8');
}

function parseEnvString(str) {
    const result = {};
    const lines = str.split('\n');
    for (const raw of lines) {
        const line = raw.trim();
        if (!line || line.startsWith('#')) continue;
        const eqIdx = line.indexOf('=');
        if (eqIdx === -1) continue;
        const key = line.slice(0, eqIdx).trim();
        let value = line.slice(eqIdx + 1).trim();
        // Strip inline comments (after unquoted value)
        if (!value.startsWith('"') && !value.startsWith("'")) {
            const commentIdx = value.indexOf(' #');
            if (commentIdx !== -1) value = value.slice(0, commentIdx).trim();
        } else {
            // Strip surrounding quotes
            value = value.replace(/^["']|["']$/g, '');
        }
        result[key] = value;
    }
    return result;
}

function loadEnv() {
    const env = process.env.NODE_ENV || 'development';

    // Test mode: use .env.testing
    if (env === 'test') {
        const testEnvPath = path.join(ROOT, '.env.testing');
        if (fs.existsSync(testEnvPath)) {
            dotenv.config({ path: testEnvPath });
            console.log('[loadEnv] Loaded .env.testing');
        }
        return;
    }

    const masterKey = process.env.APP_MASTER_KEY;
    const encPath = path.join(ROOT, '.env.enc');
    const plainPath = path.join(ROOT, '.env');

    // Encrypted mode
    if (masterKey && fs.existsSync(encPath)) {
        try {
            const plaintext = decryptEnvFile(encPath, masterKey);
            const parsed = parseEnvString(plaintext);
            let count = 0;
            for (const [k, v] of Object.entries(parsed)) {
                if (!process.env[k]) { // Don't override already-set env vars
                    process.env[k] = v;
                    count++;
                }
            }
            console.log(`[loadEnv] ✅  Loaded encrypted .env.enc (${count} vars injected)`);
            return;
        } catch (err) {
            console.error('[loadEnv] ❌  Failed to decrypt .env.enc:', err.message);
            process.exit(1);
        }
    }

    // Production with no master key = hard fail if .env.enc exists
    if (!masterKey && fs.existsSync(encPath) && env === 'production') {
        console.error('[loadEnv] ❌  .env.enc exists but APP_MASTER_KEY is not set.');
        console.error('           Set APP_MASTER_KEY in PM2 ecosystem config or shell before starting.');
        process.exit(1);
    }

    // Development fallback: plain .env
    if (fs.existsSync(plainPath)) {
        dotenv.config({ path: plainPath });
        if (env === 'production') {
            console.warn('[loadEnv] ⚠️  Using plain .env in production. Consider encrypting with env-encrypt.js');
        } else {
            console.log('[loadEnv] Loaded plain .env (development mode)');
        }
    }
}

loadEnv();
