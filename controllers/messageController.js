const { default: mongoose } = require("mongoose");
const Message = require("../models/message")

const createMessage = async (req, res) => {
    try {
        let { userId, fullname, email, phone, subject, message } = req.body;

        if (!userId || !fullname || !email || !phone || !subject || !message) {
            return res.status(400).json({
                success: false,
                message: "All fields are required",
            });
        }

        // email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: "Invalid email format",
            });
        }

        // trim data
        const newMessage = await Message.create({
            userId,
            fullname: fullname.trim(),
            phone,
            email: email.trim(),
            subject: subject.trim(),
            message: message.trim(),
        });

        res.status(201).json({
            success: true,
            message: "Message created successfully",
            data: newMessage,
        });

    } catch (error) {
        console.error("createMessage error:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Server error",
        });
    }
};

const getMessages = async (req, res) => {
    try {
        const { status, search } = req.query;

        // dynamic query
        const query = {};

        // filter by status
        if (status && ["PENDING", "RESOLVED"].includes(status)) {
            query.status = status;
        }

        // search (email / subject / name)
        if (search) {
            query.$or = [
                { fullname: { $regex: search, $options: "i" } },
                { email: { $regex: search, $options: "i" } },
                { subject: { $regex: search, $options: "i" } },
            ];
        }

        const messages = await Message.find(query)
            .sort({ createdAt: -1 }) // latest first
            .lean(); // faster response

        res.status(200).json({
            success: true,
            count: messages.length,
            data: messages,
        });

    } catch (error) {
        console.error("getMessages error:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Server error",
        });
    }
};


const getUserMessages = async (req, res) => {
    try {
        const userId = req.user?.id; // from auth middleware

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized",
            });
        }

        const { status, search } = req.query;

        const query = { userId };

        // filter by status (optional)
        if (status && ["PENDING", "RESOLVED"].includes(status)) {
            query.status = status;
        }

        // search (optional)
        if (search) {
            query.$or = [
                { subject: { $regex: search, $options: "i" } },
                { message: { $regex: search, $options: "i" } },
            ];
        }

        const messages = await Message.find(query)
            .sort({ createdAt: -1 }) // latest first
            .select("-__v") // remove unnecessary field
            .lean(); // faster response

        res.status(200).json({
            success: true,
            count: messages.length,
            data: messages,
        });

    } catch (error) {
        console.error("getUserMessages error:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Server error",
        });
    }
};



const updateMessageStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        // validate MongoDB ObjectId
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid message ID",
            });
        }

        // validate status
        const allowedStatus = ["PENDING", "RESOLVED"];
        if (!allowedStatus.includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid status value",
            });
        }

        // update status
        const updatedMessage = await Message.findByIdAndUpdate(
            id,
            { status },
            {
                new: true,
                runValidators: true,
                select: "-__v", // cleaner response
            }
        ).lean();

        if (!updatedMessage) {
            return res.status(404).json({
                success: false,
                message: "Message not found",
            });
        }

        res.status(200).json({
            success: true,
            message: "Status updated successfully",
            data: updatedMessage,
        });

    } catch (error) {
        console.error("updateMessageStatus error:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Server error",
        });
    }
};

const deleteMessage = async (req, res) => {
    try {
        const { id } = req.params;

        // validate ObjectId
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid message ID",
            });
        }

        // find & delete
        const deletedMessage = await Message.findByIdAndDelete(id).lean();

        if (!deletedMessage) {
            return res.status(404).json({
                success: false,
                message: "Message not found",
            });
        }

        res.status(200).json({
            success: true,
            message: "Message deleted successfully",
            data: deletedMessage, // optional (can remove if not needed)
        });

    } catch (error) {
        console.error("deleteMessage error:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Server error",
        });
    }
};

module.exports = { createMessage, getMessages, getUserMessages, updateMessageStatus, deleteMessage }