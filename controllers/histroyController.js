
const History = require("../models/history")

const saveHistory = async (req, res) => {
    try {

        const history = new History(req.body);
        console.log("saveHistory : ", history)
        await history.save();

        res.status(201).json({
            success: true,
            message: "History saved successfully",
            history
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message || "Server Error"
        });

    }
};


const getHistoryByUser = async (req, res) => {
    try {
        const userId = req.user.id;
        const history = await History.find({ userId })
            .populate("tripId")
            .populate("paymentId")
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            message: "User history fetched successfully",
            history: history
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message || "Server Error"
        });


    }
}

const clearHistory = async (req, res) => {
    try {

        const userId = req.user.id;

        await History.deleteMany({ userId });

        res.status(200).json({
            success: true,
            message: "All history cleared successfully"
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });

    }
};


module.exports = { saveHistory, getHistoryByUser, clearHistory };