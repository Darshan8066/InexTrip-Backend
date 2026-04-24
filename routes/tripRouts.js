
const express = require('express');
const multer = require('multer');             // Import multer (for handling file uploads)

const { createTripBatch, getTrip, getTripById, updateTrip, deleteTrip, getTripWithPagination, deployTrip, aiTrip } = require('../controllers/tripController');
const { verifyToken, isAdmin, validateTripData } = require('../middleware/auth');

const { storage } = require("../config/cloudinary");
const upload = multer({ storage });       // Configure multer to use Cloudinary storage 

const router = express.Router()      // Create router instance

//Post
router.post("/create", verifyToken,
    upload.array("images", 5),
    validateTripData,
    createTripBatch);

router.post("/create", deployTrip);

// get
router.get("/get", getTrip);
router.get("/getWithPage", getTripWithPagination);
router.get("/get/:id", getTripById);

//put         
router.put("/update/:id", verifyToken, isAdmin, updateTrip);

//delete
router.delete("/delete/:id", verifyToken, isAdmin, deleteTrip);

router.post("/generate", aiTrip);

module.exports = router;

