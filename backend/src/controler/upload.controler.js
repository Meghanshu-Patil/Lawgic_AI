const ImageKit = require('imagekit');

// Initialize ImageKit
// Ensure these variables are added to your .env file
const imagekit = new ImageKit({
    publicKey: process.env.IMAGEKIT_PUBLIC_KEY || "YOUR_IMAGEKIT_PUBLIC_KEY",
    privateKey: process.env.IMAGEKIT_PRIVATE_KEY || "YOUR_IMAGEKIT_PRIVATE_KEY",
    urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT || "YOUR_IMAGEKIT_URL_ENDPOINT"
});

async function uploadFile(req, res) {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "No file uploaded" });
        }

        // Upload to ImageKit
        const result = await imagekit.upload({
            file: req.file.buffer, // required, buffer or base64 string
            fileName: req.file.originalname, // required
            folder: "/chat_uploads", // optional
        });

        // Return the ImageKit URL and mimeType to the frontend
        res.status(200).json({
            message: "File uploaded successfully",
            fileUrl: result.url,
            mimeType: req.file.mimetype
        });

    } catch (error) {
        console.error("Error in uploadFile:", error);
        res.status(500).json({ error: "Failed to upload file", message: error.message });
    }
}

module.exports = { uploadFile };
