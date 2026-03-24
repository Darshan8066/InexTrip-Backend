const express = require("express");
const router = express.Router();


const { verifyToken } = require("../middleware/auth");
const { fetchReview, createReview, fetchReviewByTripId, fetchUserReviews } = require("../controllers/reviewController");

router.get("/", fetchReview);
router.post("/create", verifyToken, createReview);
router.get("/trip/:tripId", fetchReviewByTripId);
router.get("/user", verifyToken , fetchUserReviews);



module.exports = router;