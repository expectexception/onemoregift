'use strict';

const crypto = require('crypto');

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // 96-bit IV for GCM
const TAG_LENGTH = 16;
const ENCODING = 'hex';

let _key = null;

function getKey() {
    if (_key) return _key;
    const raw = process.env.FIELD_ENCRYPTION_KEY;
    if (!raw || raw.length !== 64) {
        throw new Error(
            'FIELD_ENCRYPTION_KEY must be a 64-character hex string (32 bytes). ' +
            'Generate with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"'
        );
    }
    _key = Buffer.from(raw, 'hex');
    return _key;
}

/**
 * Encrypt a string value using AES-256-GCM.
 * Returns format: iv:tag:ciphertext (all hex)
 * Returns null/undefined as-is.
 */
function encrypt(plaintext) {
    if (plaintext === null || plaintext === undefined || plaintext === '') return plaintext;

    const key = getKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    const encrypted = Buffer.concat([cipher.update(String(plaintext), 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();

    return `${iv.toString(ENCODING)}:${tag.toString(ENCODING)}:${encrypted.toString(ENCODING)}`;
}

/**
 * Decrypt a value encrypted by encrypt().
 * Passes through values that don't look like encrypted blobs.
 * Returns null/undefined as-is.
 */
function decrypt(ciphertext) {
    if (ciphertext === null || ciphertext === undefined || ciphertext === '') return ciphertext;

    const parts = String(ciphertext).split(':');
    // If not our format (iv:tag:ct), return as-is (unencrypted legacy value)
    if (parts.length !== 3) return ciphertext;

    try {
        const key = getKey();
        const iv = Buffer.from(parts[0], ENCODING);
        const tag = Buffer.from(parts[1], ENCODING);
        const encrypted = Buffer.from(parts[2], ENCODING);

        if (iv.length !== IV_LENGTH || tag.length !== TAG_LENGTH) return ciphertext;

        const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
        decipher.setAuthTag(tag);

        return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8');
    } catch {
        // Auth tag mismatch or bad data — return raw to avoid data loss on legacy rows
        return ciphertext;
    }
}

module.exports = { encrypt, decrypt };
