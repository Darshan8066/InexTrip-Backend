const Review = require("../models/review");

exports.createReview = async (req, res) => {
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

exports.fetchReviewByTripId = async (req, res) => {
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


exports.fetchReview = async (req, res) => {

    try {
        // const response = await Review.find();

        const reviews = await Review.find()
            .populate("userId", "name profilePhoto");

        res.status(200).json({
            success: true,
            reviews,
            message: "Get Review SuccessFully",
        });
    } catch (error) {
        console.log(error)
    }
}