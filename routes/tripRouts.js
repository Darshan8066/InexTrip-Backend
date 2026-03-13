
const express = require('express');
const multer = require('multer');             // Import multer (for handling file uploads)

const { createTripBatch, getTrip, getTripById, updateTrip, deleteTrip } = require('../controllers/tripController');
const { verifyToken, isAdmin, validateTripData } = require('../middleware/auth');

const { storage } = require("../config/cloudinary");
const upload = multer({ storage });       // Configure multer to use Cloudinary storage 

const router = express.Router()      // Create router instance


router.post("/create", verifyToken,                    // CREATE TRIP ROUTE  
    isAdmin,
    upload.array("images", 5),
    validateTripData,
    createTripBatch);

router.get("/get", getTrip);                    // get TRIP ROUTE  
router.get("/get/:id", getTripById);            //getTripById TRIP ROUTE
router.put("/update/:id", verifyToken, isAdmin, updateTrip);          // update Trip ROUTE
router.delete("/delete/:id", verifyToken, isAdmin, deleteTrip);       //delete Trip ROUTE

module.exports = router;
