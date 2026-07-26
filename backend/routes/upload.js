'use strict';

const express = require('express');
const multer = require('multer');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const sharp = require('sharp');
const isAdmin = require('../middleware/isAdmin');
const isAuth = require('../middleware/isAuth');
const ImageStore = require('../model/ImageStore');
require('dotenv').config();

// ── Config ────────────────────────────────────────────────────────────────────
const IMAGE_STORAGE = (process.env.IMAGE_STORAGE || 'disk').toLowerCase().trim();
const SERVER_URL = (process.env.SERVER_URL || 'http://localhost:9000').replace(/\/$/, '');
const MAX_IMAGE_SIZE_BYTES = (Number(process.env.MAX_IMAGE_SIZE_MB) || 5) * 1024 * 1024;
const MAX_VIDEO_SIZE_BYTES = (Number(process.env.MAX_VIDEO_SIZE_MB) || 25) * 1024 * 1024;

// Disk storage path: configurable, defaults to public/uploads/images
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

const ALLOWED_VIDEO_TYPES = new Map([
    ['video/mp4', '.mp4'],
    ['video/webm', '.webm'],
    ['video/ogg', '.ogg'],
    ['video/quicktime', '.mov'],
]);

// Document proofs (surprise applications, payment proofs)
const ALLOWED_DOC_TYPES = new Map([
    ['application/pdf', '.pdf'],
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
    // MP4/MOV: ISO base media file format: bytes 4-8 are the 'ftyp' box marker
    if (mimetype === 'video/mp4' || mimetype === 'video/quicktime')
        return buf.length >= 12 && buf.subarray(4, 8).toString('ascii') === 'ftyp';
    // WebM: EBML header
    if (mimetype === 'video/webm')
        return buf.length >= 4 && buf.subarray(0, 4).equals(Buffer.from([0x1a, 0x45, 0xdf, 0xa3]));
    // Ogg: "OggS" capture pattern
    if (mimetype === 'video/ogg')
        return buf.length >= 4 && buf.subarray(0, 4).toString('ascii') === 'OggS';
    // PDF: "%PDF" header
    if (mimetype === 'application/pdf')
        return buf.length >= 4 && buf.subarray(0, 4).toString('ascii') === '%PDF';
    return false;
};

// ── Multer: always use memory storage so we can compress before saving ───────
const fileFilter = (req, file, cb) => {
    if (!ALLOWED_IMAGE_TYPES.has(file.mimetype) && !ALLOWED_VIDEO_TYPES.has(file.mimetype) && !ALLOWED_DOC_TYPES.has(file.mimetype)) {
        return cb(new Error('Only JPG, PNG, WEBP, GIF images, MP4, WEBM, OGG, MOV videos, or PDF documents are allowed'));
    }
    cb(null, true);
};

const upload = multer({
    storage: multer.memoryStorage(),
    fileFilter,
    // Multer enforces one cap regardless of type; use the larger (video) cap here and
    // reject undersized-for-type-but-over-image-cap files manually in isValidFile.
    limits: { fileSize: Math.max(MAX_IMAGE_SIZE_BYTES, MAX_VIDEO_SIZE_BYTES), files: 10 },
});

// ── Sharp compress ────────────────────────────────────────────────────────────
async function compressBuffer(buffer, mimetype) {
    const isGif = mimetype === 'image/gif';
    if (isGif) {
        try {
            // animated: true preserves all frames while still resizing oversized GIFs
            return await sharp(buffer, { animated: true })
                .resize(SHARP_MAX_WIDTH, SHARP_MAX_HEIGHT, { fit: 'inside', withoutEnlargement: true })
                .gif()
                .toBuffer();
        } catch {
            return buffer; // fall back to original if re-encoding fails
        }
    }

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
    const isVid = ALLOWED_VIDEO_TYPES.has(file.mimetype);
    const isDoc = ALLOWED_DOC_TYPES.has(file.mimetype);
    const ext = isVid ? ALLOWED_VIDEO_TYPES.get(file.mimetype)
        : isDoc ? ALLOWED_DOC_TYPES.get(file.mimetype)
        : (ALLOWED_IMAGE_TYPES.get(file.mimetype) || '.jpg');
    const filename = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${ext}`;
    const dataToWrite = (isVid || isDoc) ? file.buffer : await compressBuffer(file.buffer, file.mimetype);
    const filePath = path.join(MEDIA_DIR, filename);
    await fs.promises.writeFile(filePath, dataToWrite);

    console.log(`[Upload/disk] ${filename} | ${file.size}B → ${dataToWrite.length}B`);

    // Always return a relative URL: in dev it proxies through Next.js (no CORP issue),
    // in prod the same origin serves it. Only use SERVER_URL if explicitly set for external CDN.
    const isPublic = MEDIA_DIR.includes(path.join('public', 'uploads', 'images'));
    const url = isPublic
        ? `/uploads/images/${filename}`
        : `/media/${filename}`;

    return { filename, url, size: dataToWrite.length, originalSize: file.size, type: isVid ? 'video' : isDoc ? 'file' : 'image' };
}

// ── Save to MongoDB ───────────────────────────────────────────────────────────
async function saveToMongo(file) {
    const isVid = ALLOWED_VIDEO_TYPES.has(file.mimetype);
    const isDoc = ALLOWED_DOC_TYPES.has(file.mimetype);
    const ext = isVid ? ALLOWED_VIDEO_TYPES.get(file.mimetype)
        : isDoc ? ALLOWED_DOC_TYPES.get(file.mimetype)
        : (ALLOWED_IMAGE_TYPES.get(file.mimetype) || '.jpg');
    const filename = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${ext}`;
    const dataToWrite = (isVid || isDoc) ? file.buffer : await compressBuffer(file.buffer, file.mimetype);

    const doc = await ImageStore.create({
        filename,
        mimetype: file.mimetype,
        size: dataToWrite.length,
        originalSize: file.size,
        data: dataToWrite,
    });

    console.log(`[Upload/mongo] ${filename} | ${file.size}B → ${dataToWrite.length}B | id=${doc._id}`);

    // Relative URL: proxied through Next.js in dev, same-origin in prod
    // (the /image/:id route serves any stored file with its correct Content-Type)
    const url = isVid ? `/api/v1/upload/video/${doc._id}` : `/api/v1/upload/image/${doc._id}`;
    return { filename, url, size: dataToWrite.length, originalSize: file.size, id: doc._id, type: isVid ? 'video' : isDoc ? 'file' : 'image' };
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

// Serve MongoDB videos
router.get('/video/:id', async (req, res) => {
    try {
        const doc = await ImageStore.findById(req.params.id).select('data mimetype filename');
        if (!doc) return res.status(404).json({ error: true, msg: 'Video not found' });
        res.set('Content-Type', doc.mimetype);
        res.set('Cache-Control', 'public, max-age=31536000, immutable');
        res.set('Content-Disposition', `inline; filename="${doc.filename}"`);
        return res.send(doc.data);
    } catch {
        return res.status(500).json({ error: true, msg: 'Failed to retrieve video' });
    }
});

// Serve disk images/videos from custom MEDIA_DIR (if not inside public/)
router.get('/media/:filename', async (req, res) => {
    try {
        const filename = path.basename(req.params.filename); // prevent path traversal
        const filePath = path.join(MEDIA_DIR, filename);
        if (!fs.existsSync(filePath)) return res.status(404).json({ error: true, msg: 'File not found' });
        res.set('Cache-Control', 'public, max-age=31536000, immutable');
        return res.sendFile(filePath);
    } catch {
        return res.status(500).json({ error: true, msg: 'Failed to retrieve file' });
    }
});

// Helper to check if file is valid (signature must match declared mimetype, and respects per-type size caps)
const isValidFile = (file) => {
    if (!hasAllowedSignature(file.buffer, file.mimetype)) return false;
    const isVid = ALLOWED_VIDEO_TYPES.has(file.mimetype);
    const cap = isVid ? MAX_VIDEO_SIZE_BYTES : MAX_IMAGE_SIZE_BYTES; // PDFs use the image cap
    return file.size <= cap;
};

// Upload single image/video
router.post('/', isAdmin, upload.single('image'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: true, msg: 'No valid file provided' });

        if (!isValidFile(req.file)) {
            return res.status(400).json({ error: true, msg: 'Uploaded file is not a valid image or video' });
        }

        const result = IMAGE_STORAGE === 'mongodb'
            ? await saveToMongo(req.file)
            : await saveToDisk(req.file);

        return res.status(200).json({
            error: false,
            url: result.url,
            type: result.type,
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

// Upload multiple images/videos
router.post('/multiple', isAdmin, upload.array('images', 10), async (req, res) => {
    try {
        if (!req.files || req.files.length === 0)
            return res.status(400).json({ error: true, msg: 'No valid files provided' });

        const invalid = req.files.find(f => !isValidFile(f));
        if (invalid) return res.status(400).json({ error: true, msg: 'One or more files are not valid images or videos' });

        const save = IMAGE_STORAGE === 'mongodb' ? saveToMongo : saveToDisk;
        const results = await Promise.all(req.files.map(save));
        const urls = results.map(r => r.url);
        const media = results.map(r => ({ url: r.url, type: r.type }));

        return res.status(200).json({ error: false, urls, media, storage: IMAGE_STORAGE });
    } catch (error) {
        return res.status(500).json({ error: true, msg: 'Upload failed: ' + error.message });
    }
});

// Upload single image/video for authenticated users
router.post('/user', isAuth, upload.single('image'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: true, msg: 'No valid file provided' });
        if (!isValidFile(req.file)) {
            return res.status(400).json({ error: true, msg: 'Uploaded file is not a valid image or video' });
        }
        const result = IMAGE_STORAGE === 'mongodb' ? await saveToMongo(req.file) : await saveToDisk(req.file);
        return res.status(200).json({
            error: false,
            url: result.url,
            type: result.type,
            filename: result.filename,
            storage: IMAGE_STORAGE,
            originalSize: result.originalSize,
            compressedSize: result.size,
        });
    } catch (error) {
        return res.status(500).json({ error: true, msg: 'File upload failed: ' + error.message });
    }
});

// Upload multiple images/videos for authenticated users
router.post('/user-multiple', isAuth, upload.array('images', 10), async (req, res) => {
    try {
        if (!req.files || req.files.length === 0)
            return res.status(400).json({ error: true, msg: 'No valid files provided' });
        const invalid = req.files.find(f => !isValidFile(f));
        if (invalid) return res.status(400).json({ error: true, msg: 'One or more files are not valid images or videos' });
        const save = IMAGE_STORAGE === 'mongodb' ? saveToMongo : saveToDisk;
        const results = await Promise.all(req.files.map(save));
        const urls = results.map(r => r.url);
        const media = results.map(r => ({ url: r.url, type: r.type }));
        return res.status(200).json({ error: false, urls, media, storage: IMAGE_STORAGE });
    } catch (error) {
        return res.status(500).json({ error: true, msg: 'Upload failed: ' + error.message });
    }
});

// Error handler
router.use((err, req, res, _next) => {
    if (err instanceof multer.MulterError) {
        const msg = err.code === 'LIMIT_FILE_SIZE'
            ? `File too large (max ${MAX_IMAGE_SIZE_BYTES / 1024 / 1024}MB for images, ${MAX_VIDEO_SIZE_BYTES / 1024 / 1024}MB for videos)`
            : err.message;
        return res.status(400).json({ error: true, msg });
    }
    return res.status(400).json({ error: true, msg: err.message || 'Upload error' });
});

module.exports = router;
