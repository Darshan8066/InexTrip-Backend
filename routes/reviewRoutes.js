const express = require("express");
const router = express.Router();


const { verifyToken } = require("../middleware/auth");
const { fetchReview, createReview, fetchReviewByTripId, fetchUserReviews } = require("../controllers/reviewController");

//post
router.post("/create", verifyToken, createReview);

// get
router.get("/", fetchReview);
router.get("/trip/:tripId", fetchReviewByTripId);
router.get("/user", verifyToken , fetchUserReviews);

module.exports = router;