const express = require("express");
const router = express.Router();


const { verifyToken } = require("../middleware/auth");
const { fetchReview, createReview, fetchReviewByTripId } = require("../controllers/reviewController");

router.get("/", fetchReview);
router.post("/create/", verifyToken, createReview);
router.get("/:tripId", fetchReviewByTripId);



module.exports = router;