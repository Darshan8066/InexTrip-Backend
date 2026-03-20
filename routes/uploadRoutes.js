const express = require('express');
const multer = require('multer');                  // Import multer (used for handling file uploads)
const { storage } = require('../config/cloudinary');         // Import Cloudinary storage configuration
const { verifyToken } = require('../middleware/auth');

const router = express.Router();                 // Create router

const upload = multer({                    // Configure multer to use Cloudinary storage
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }   // 5MB or less size photo upload
});

//  SINGLE IMAGE UPLOAD ROUTE
router.post("/upload", verifyToken, (req, res) => {

    upload.single("image")(req, res, function (err) {

        if (err) {
            console.log("UPLOAD ERROR:", err);
            return res.status(500).json({
                message: err.message || "Upload failed"
            });
        }
        console.log("file : ", req.file);
        if (!req.file) {
            return res.status(400).json({
                message: "No file uploaded"
            });
        }
        res.status(200).json({
            imageUrl: req.file.path,
        });
    });
});
module.exports = router;
