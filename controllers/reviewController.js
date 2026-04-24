const Review = require("../models/review");

const createReview = async (req, res) => {
    try {
        const userId = req.user.id;
        const { rating, comment, tripId } = req.body;

        // ✅ Basic validation
        if (!rating || !comment) {
            return res.status(400).json({
                success: false,
                message: "Rating and comment are required",
            });
        }

        // ✅ Create review
        const review = await Review.create({
            userId,
            tripId,
            rating,
            comment,
        });

        res.status(201).json({
            success: true,
            message: "Successfully created review",
            review,
        });

    } catch (error) {
        console.error("Create Review Error:", error);

        res.status(500).json({
            success: false,
            message: error.message || "Server Error",
        });
    }
};

const fetchReviewByTripId = async (req, res) => {
    try {
        const { tripId } = req.params;

        // ✅ validation
        if (!tripId) {
            return res.status(400).json({
                success: false,
                message: "Trip ID is required",
            });
        }

        // ✅ fetch reviews + user details
        const reviews = await Review.find({ tripId })
            .populate("userId", "fullname profilePhoto")
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            reviews,
            count: reviews.length,
            message: "Reviews fetched successfully",
        });

    } catch (error) {
        console.error("Fetch Review Error:", error);

        res.status(500).json({
            success: false,
            message: error.message || "Server Error",
        });
    }
};

const fetchReview = async (req, res) => {

    try {
        const reviews = await Review.find()
            .populate("userId", "fullname profilePhoto")
            .populate("tripId", "category from to");

        res.status(200).json({
            success: true,
            reviews,
            message: "Get Review SuccessFully",
        });
    } catch (error) {
        console.log(error)
    }
}


const fetchUserReviews = async (req, res) => {

    try {
        const userId = req.user.id
        console.log("fetchUserReviews : ", userId)
        const reviews = await Review.find({ userId })
                .populate("tripId", "category from to");
        console.log("reviews : ", reviews)
        if (!reviews || reviews.length === 0) {
            return res.status(404).json({
                success: false,
                message: "No reviews found for this user"
            });
        }
        res.status(200).json({
            success: true,
            count: reviews.length,
            reviews,
            message: "User reviews fetched successfully"
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Something went wrong while fetching reviews"
        })
    }
}

module.exports = { createReview, fetchReviewByTripId, fetchReview, fetchUserReviews }