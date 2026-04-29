const express = require('express');
const multer = require('multer');
const { authMiddleware } = require('../middleware/Auth.middleware');
const uploadControler = require('../controler/upload.controler');

const uploadRoute = express.Router();

// Use memory storage for ImageKit upload
const storage = multer.memoryStorage();

// Accept only images and PDFs
const fileFilter = (req, file, cb) => {
    const allowedMimeTypes = [
        'application/pdf',
        'image/jpeg',
        'image/png',
        'image/webp',
        'image/heic',
        'image/heif'
    ];
    
    if (allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only PDF and Image files are allowed.'));
    }
};

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB limit
    fileFilter: fileFilter
});

uploadRoute.post("/", authMiddleware, upload.single('file'), uploadControler.uploadFile);

module.exports = uploadRoute;
