const express = require('express');
const multer = require('multer');
const router = express.Router();
const path = require('path');
const isAdmin = require('../middleware/isAdmin');
require('dotenv').config();
let ServerURL = process.env.SERVER_URL

//TODO:
//1.If Auth user can upload files, then api cant be misused
//Update filters

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // cb(null, './public/uploads/images/');
        cb(null, path.join(__dirname, '../public', 'uploads', 'images'));
    },
    filename: (req, file, cb) => {
        // cb(null, Date.now() + '-' + file.originalname);
        cb(null, Date.now() + '-' + file.originalname.split(" ").join('-'));
    }
});

// File filter function to accept only images
// const fileFilter = (req, file, cb) => {
//     // Check file extension
//     const filetypes = /jpeg|jpg|png/;
//     const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
//     // Check MIME type
//     const mimetype = filetypes.test(file.mimetype);

//     if (extname && mimetype) {
//         cb(null, true);
//     } else {
//         cb(false);
//     }
// };
let fileFilter = function (req, file, cb) {
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
        // return cb(new Error('Only image files are allowed!'));
        return cb(null, false);
    }
    cb(null, true);
}

const uploadStorage = multer({
    storage: storage,
    fileFilter: fileFilter
});

router.post('/', isAdmin, uploadStorage.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: true, msg: 'No valid image file provided' });
        }
        res.status(200).json({ error: false, url: `${ServerURL}` + '/uploads/images/' + req.file.filename });
    } catch (error) {
        // console.log(error);
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
        const urls = req.files.map(file => "https://businessdialer.in/uploads/images/" + file.filename);
        res.status(200).json({ error: false, urls });
    } catch (error) {
        res.status(500).json({ error: true, msg: 'An error occurred while processing the uploaded files' });
    }
});

// Error handling middleware
router.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        // Handle specific instances of Multer errors
        if (err.code === "LIMIT_FILE_SIZE") {
            res.status(400).json({ error: true, msg: 'File size too large' });
        } else if (err.code === "LIMIT_UNEXPECTED_FILE") {
            res.status(400).json({ error: true, msg: 'Too many files uploaded' });
        } else {
            res.status(400).json({ error: true, msg: 'Upload failed: ' + err.message });
        }
    } else if (err) {
        // Handle other errors
        res.status(500).json({ error: true, msg: 'An error occurred: ' + err.message });
    } else {
        // Call the next middleware if no error is encountered
        next();
    }
});
module.exports = router;
