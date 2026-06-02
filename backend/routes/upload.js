const express = require('express');
const multer = require('multer');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const isAdmin = require('../middleware/isAdmin');
require('dotenv').config();

const uploadDir = path.join(__dirname, '../public', 'uploads', 'images');
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Map([
    ['image/jpeg', '.jpg'],
    ['image/png', '.png'],
    ['image/webp', '.webp'],
    ['image/gif', '.gif'],
]);

fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const safeExt = ALLOWED_IMAGE_TYPES.get(file.mimetype) || path.extname(path.basename(file.originalname)).toLowerCase();
        cb(null, `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${safeExt}`);
    }
});

const fileFilter = (req, file, cb) => {
    const ext = path.extname(path.basename(file.originalname)).toLowerCase();
    const expectedExt = ALLOWED_IMAGE_TYPES.get(file.mimetype);
    const extensionAllowed = [...ALLOWED_IMAGE_TYPES.values()].includes(ext);

    if (!expectedExt || !extensionAllowed) {
        return cb(new Error('Only JPG, PNG, WEBP, or GIF images are allowed'));
    }

    cb(null, true);
};

const uploadStorage = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: MAX_IMAGE_SIZE_BYTES,
        files: 10,
    },
});

const hasAllowedImageSignature = (filePath, mimetype) => {
    const buffer = fs.readFileSync(filePath);
    if (mimetype === 'image/jpeg') {
        return buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
    }
    if (mimetype === 'image/png') {
        return buffer.length >= 8
            && buffer[0] === 0x89
            && buffer[1] === 0x50
            && buffer[2] === 0x4e
            && buffer[3] === 0x47
            && buffer[4] === 0x0d
            && buffer[5] === 0x0a
            && buffer[6] === 0x1a
            && buffer[7] === 0x0a;
    }
    if (mimetype === 'image/gif') {
        return buffer.length >= 6 && ['GIF87a', 'GIF89a'].includes(buffer.subarray(0, 6).toString('ascii'));
    }
    if (mimetype === 'image/webp') {
        return buffer.length >= 12
            && buffer.subarray(0, 4).toString('ascii') === 'RIFF'
            && buffer.subarray(8, 12).toString('ascii') === 'WEBP';
    }
    return false;
};

const removeFileQuietly = (filePath) => {
    fs.unlink(filePath, () => {});
};

const validateStoredImage = (file) => {
    if (!file || !hasAllowedImageSignature(file.path, file.mimetype)) {
        if (file?.path) removeFileQuietly(file.path);
        return false;
    }
    return true;
};

router.post('/', isAdmin, uploadStorage.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: true, msg: 'No valid image file provided' });
        }
        if (!validateStoredImage(req.file)) {
            return res.status(400).json({ error: true, msg: 'Uploaded file is not a valid image' });
        }
        // Return same-origin relative URL so it works across domain/IP/https without mixed-content issues.
        res.status(200).json({ error: false, url: `/uploads/images/${req.file.filename}` });
    } catch (error) {
        res.status(500).json({ error: true, msg: 'File Upload Failed, only Image files are accepted' });
    }
});

// router.post('/', uploadStorage.single('image'), (req, res) => {
//     // Check if filename is present in the request
//     console.log(req.file);
//     if (!req.file || !req.file.originalname) {
//         return res.status(400).json({ error: 'Filename is required' });
//     }

//     const filename = req.file.originalname;
//     // Handle the filename and uploaded file
//     res.json({ filename });
// });

// Route to upload multiple images
router.post('/multiple', isAdmin, uploadStorage.array('images', 10), async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ error: true, msg: 'No valid image files provided' });
        }
        const invalidFile = req.files.find(file => !validateStoredImage(file));
        if (invalidFile) {
            req.files.forEach(file => removeFileQuietly(file.path));
            return res.status(400).json({ error: true, msg: 'One or more uploaded files are not valid images' });
        }
        const urls = req.files.map(file => `/uploads/images/${file.filename}`);
        res.status(200).json({ error: false, urls });
    } catch (error) {
        res.status(500).json({ error: true, msg: 'An error occurred while processing the uploaded files' });
    }
});

// Error handling middleware
router.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
            res.status(400).json({ error: true, msg: 'File size too large. Maximum allowed size is 5MB' });
        } else if (err.code === "LIMIT_UNEXPECTED_FILE") {
            res.status(400).json({ error: true, msg: 'Too many files uploaded' });
        } else {
            res.status(400).json({ error: true, msg: 'Upload failed: ' + err.message });
        }
    } else if (err) {
        res.status(400).json({ error: true, msg: err.message || 'Invalid upload' });
    } else {
        next();
    }
});
module.exports = router;
