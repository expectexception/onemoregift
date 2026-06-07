'use strict';

const express = require('express');
const multer = require('multer');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const sharp = require('sharp');
const isAdmin = require('../middleware/isAdmin');
const ImageStore = require('../model/ImageStore');
require('dotenv').config();

// ── Config ────────────────────────────────────────────────────────────────────
const IMAGE_STORAGE = (process.env.IMAGE_STORAGE || 'disk').toLowerCase().trim();
const SERVER_URL = (process.env.SERVER_URL || 'http://localhost:9000').replace(/\/$/, '');
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB input limit

// Disk storage path — configurable, defaults to public/uploads/images
const MEDIA_DIR = process.env.MEDIA_DIR
    ? path.resolve(process.env.MEDIA_DIR)
    : path.join(__dirname, '../public/uploads/images');

// Sharp compression settings
const SHARP_MAX_WIDTH = 1920;
const SHARP_MAX_HEIGHT = 1920;
const SHARP_QUALITY = 82; // JPEG/WebP quality (0-100)

const ALLOWED_IMAGE_TYPES = new Map([
    ['image/jpeg', '.jpg'],
    ['image/png', '.png'],
    ['image/webp', '.webp'],
    ['image/gif', '.gif'],
]);

console.log(`[Upload] IMAGE_STORAGE=${IMAGE_STORAGE} | ${IMAGE_STORAGE === 'disk' ? `MEDIA_DIR=${MEDIA_DIR}` : 'MongoDB'}`);

if (IMAGE_STORAGE === 'disk') {
    fs.mkdirSync(MEDIA_DIR, { recursive: true });
}

// ── Magic-byte validation ─────────────────────────────────────────────────────
const hasAllowedSignature = (buf, mimetype) => {
    if (mimetype === 'image/jpeg')
        return buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff;
    if (mimetype === 'image/png')
        return buf.length >= 8 && buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
    if (mimetype === 'image/gif')
        return buf.length >= 6 && ['GIF87a', 'GIF89a'].includes(buf.subarray(0, 6).toString('ascii'));
    if (mimetype === 'image/webp')
        return buf.length >= 12 && buf.subarray(0, 4).toString('ascii') === 'RIFF' && buf.subarray(8, 12).toString('ascii') === 'WEBP';
    return false;
};

// ── Multer — always use memory storage so we can compress before saving ───────
const fileFilter = (req, file, cb) => {
    if (!ALLOWED_IMAGE_TYPES.has(file.mimetype)) {
        return cb(new Error('Only JPG, PNG, WEBP, or GIF images are allowed'));
    }
    cb(null, true);
};

const upload = multer({
    storage: multer.memoryStorage(),
    fileFilter,
    limits: { fileSize: MAX_IMAGE_SIZE_BYTES, files: 10 },
});

// ── Sharp compress ────────────────────────────────────────────────────────────
async function compressBuffer(buffer, mimetype) {
    const isGif = mimetype === 'image/gif';
    if (isGif) return buffer; // skip compression for GIF (animated support)

    const pipeline = sharp(buffer)
        .resize(SHARP_MAX_WIDTH, SHARP_MAX_HEIGHT, { fit: 'inside', withoutEnlargement: true });

    if (mimetype === 'image/png') {
        return pipeline.png({ compressionLevel: 8, adaptiveFiltering: true }).toBuffer();
    }
    if (mimetype === 'image/webp') {
        return pipeline.webp({ quality: SHARP_QUALITY }).toBuffer();
    }
    // JPEG default
    return pipeline.jpeg({ quality: SHARP_QUALITY, progressive: true }).toBuffer();
}

// ── Save to disk ──────────────────────────────────────────────────────────────
async function saveToDisk(file) {
    const ext = ALLOWED_IMAGE_TYPES.get(file.mimetype) || '.jpg';
    const filename = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${ext}`;
    const compressed = await compressBuffer(file.buffer, file.mimetype);
    const filePath = path.join(MEDIA_DIR, filename);
    await fs.promises.writeFile(filePath, compressed);

    console.log(`[Upload/disk] ${filename} | ${file.size}B → ${compressed.length}B`);

    // Always return a relative URL — in dev it proxies through Next.js (no CORP issue),
    // in prod the same origin serves it. Only use SERVER_URL if explicitly set for external CDN.
    const isPublic = MEDIA_DIR.includes(path.join('public', 'uploads', 'images'));
    const url = isPublic
        ? `/uploads/images/${filename}`
        : `/media/${filename}`;

    return { filename, url, size: compressed.length, originalSize: file.size };
}

// ── Save to MongoDB ───────────────────────────────────────────────────────────
async function saveToMongo(file) {
    const originalSize = file.size;
    const compressed = await compressBuffer(file.buffer, file.mimetype);
    const ext = ALLOWED_IMAGE_TYPES.get(file.mimetype) || '.jpg';
    const filename = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${ext}`;

    const doc = await ImageStore.create({
        filename,
        mimetype: file.mimetype,
        size: compressed.length,
        originalSize,
        data: compressed,
    });

    console.log(`[Upload/mongo] ${filename} | ${originalSize}B → ${compressed.length}B | id=${doc._id}`);

    // Relative URL — proxied through Next.js in dev, same-origin in prod
    const url = `/api/v1/upload/image/${doc._id}`;
    return { filename, url, size: compressed.length, originalSize, id: doc._id };
}

// ── Routes ────────────────────────────────────────────────────────────────────

// Serve MongoDB images
router.get('/image/:id', async (req, res) => {
    try {
        const doc = await ImageStore.findById(req.params.id).select('data mimetype filename');
        if (!doc) return res.status(404).json({ error: true, msg: 'Image not found' });
        res.set('Content-Type', doc.mimetype);
        res.set('Cache-Control', 'public, max-age=31536000, immutable');
        res.set('Content-Disposition', `inline; filename="${doc.filename}"`);
        return res.send(doc.data);
    } catch {
        return res.status(500).json({ error: true, msg: 'Failed to retrieve image' });
    }
});

// Serve disk images from custom MEDIA_DIR (if not inside public/)
router.get('/media/:filename', async (req, res) => {
    try {
        const filename = path.basename(req.params.filename); // prevent path traversal
        const filePath = path.join(MEDIA_DIR, filename);
        if (!fs.existsSync(filePath)) return res.status(404).json({ error: true, msg: 'Image not found' });
        res.set('Cache-Control', 'public, max-age=31536000, immutable');
        return res.sendFile(filePath);
    } catch {
        return res.status(500).json({ error: true, msg: 'Failed to retrieve image' });
    }
});

// Upload single image
router.post('/', isAdmin, upload.single('image'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: true, msg: 'No valid image file provided' });

        if (!hasAllowedSignature(req.file.buffer, req.file.mimetype)) {
            return res.status(400).json({ error: true, msg: 'Uploaded file is not a valid image' });
        }

        const result = IMAGE_STORAGE === 'mongodb'
            ? await saveToMongo(req.file)
            : await saveToDisk(req.file);

        return res.status(200).json({
            error: false,
            url: result.url,
            filename: result.filename,
            storage: IMAGE_STORAGE,
            originalSize: result.originalSize,
            compressedSize: result.size,
        });
    } catch (error) {
        console.error('[Upload] Error:', error.message);
        return res.status(500).json({ error: true, msg: 'File upload failed: ' + error.message });
    }
});

// Upload multiple images
router.post('/multiple', isAdmin, upload.array('images', 10), async (req, res) => {
    try {
        if (!req.files || req.files.length === 0)
            return res.status(400).json({ error: true, msg: 'No valid image files provided' });

        const invalid = req.files.find(f => !hasAllowedSignature(f.buffer, f.mimetype));
        if (invalid) return res.status(400).json({ error: true, msg: 'One or more files are not valid images' });

        const save = IMAGE_STORAGE === 'mongodb' ? saveToMongo : saveToDisk;
        const results = await Promise.all(req.files.map(save));
        const urls = results.map(r => r.url);

        return res.status(200).json({ error: false, urls, storage: IMAGE_STORAGE });
    } catch (error) {
        return res.status(500).json({ error: true, msg: 'Upload failed: ' + error.message });
    }
});

// Error handler
router.use((err, req, res, _next) => {
    if (err instanceof multer.MulterError) {
        const msg = err.code === 'LIMIT_FILE_SIZE' ? 'File too large (max 5MB)' : err.message;
        return res.status(400).json({ error: true, msg });
    }
    return res.status(400).json({ error: true, msg: err.message || 'Upload error' });
});

module.exports = router;
