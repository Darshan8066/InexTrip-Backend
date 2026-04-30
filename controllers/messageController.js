const { default: mongoose } = require("mongoose");
const Message = require("../models/message");
const Notification = require("../models/notification");
const User = require("../models/user");
const { emitToAdmins, emitToUser } = require("../socket/socketManager");

// ─── CREATE MESSAGE ── user writes support → notify all admins ────────────────
const createMessage = async (req, res) => {
    try {
        const { userId, fullname, email, phone, subject, message } = req.body;

        if (!userId || !fullname || !email || !phone || !subject || !message)
            return res.status(400).json({ success: false, message: "All fields are required" });

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email))
            return res.status(400).json({ success: false, message: "Invalid email format" });

        const newMessage = await Message.create({
            userId,
            fullname: fullname.trim(),
            phone,
            email: email.trim(),
            subject: subject.trim(),
            message: message.trim(),
        });

        // ── Notification payload ──────────────────────────────────────────────
        const preview = subject.length > 70 ? subject.substring(0, 70) + "…" : subject;
        const notifData = {
            type: "SUPPORT_MESSAGE",
            title: "New Support Request 💬",
            message: `${fullname} submitted a support request: "${preview}"`,
            link: "/messages",    // admin messages page
            messageId: String(newMessage._id),
            isRead: false,
            createdAt: new Date(),
        };

        // 1️⃣  Save to DB for every admin (visible even if offline)
        const admins = await User.find({ role: "ADMIN" }).select("_id");
        if (admins.length > 0) {
            const dbNotifs = admins.map((a) => ({ ...notifData, userId: a._id }));
            await Notification.insertMany(dbNotifs).catch((e) =>
                console.error("❌ Support notification DB error:", e)
            );
        }

        // 2️⃣  Live push to connected admins
        emitToAdmins(notifData);

        res.status(201).json({ success: true, message: "Message created successfully", data: newMessage });
    } catch (error) {
        console.error("createMessage error:", error);
        res.status(500).json({ success: false, message: error.message || "Server error" });
    }
};

// ─── GET ALL MESSAGES (admin) ─────────────────────────────────────────────────
const getMessages = async (req, res) => {
    try {
        const { status, search } = req.query;
        const query = {};

        if (status && ["PENDING", "RESOLVED"].includes(status)) query.status = status;
        if (search) {
            query.$or = [
                { fullname: { $regex: search, $options: "i" } },
                { email: { $regex: search, $options: "i" } },
                { subject: { $regex: search, $options: "i" } },
            ];
        }

        const messages = await Message.find(query).sort({ createdAt: -1 }).lean();
        res.status(200).json({ success: true, count: messages.length, data: messages });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message || "Server error" });
    }
};

// ─── GET MESSAGES FOR LOGGED-IN USER ─────────────────────────────────────────
const getUserMessages = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

        const { status, search } = req.query;
        const query = { userId };

        if (status && ["PENDING", "RESOLVED"].includes(status)) query.status = status;
        if (search) {
            query.$or = [
                { subject: { $regex: search, $options: "i" } },
                { message: { $regex: search, $options: "i" } },
            ];
        }

        const messages = await Message.find(query).sort({ createdAt: -1 }).select("-__v").lean();
        res.status(200).json({ success: true, count: messages.length, data: messages });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message || "Server error" });
    }
};

// ─── UPDATE MESSAGE STATUS (admin) ── RESOLVED → notify the user ─────────────
const updateMessageStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, resolution } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id))
            return res.status(400).json({ success: false, message: "Invalid message ID" });

        if (!["PENDING", "RESOLVED"].includes(status))
            return res.status(400).json({ success: false, message: "Invalid status value" });

        const updatedMessage = await Message.findByIdAndUpdate(
            id,
            { status, resolution },
            { new: true, runValidators: true, select: "-__v" }
        ).lean();

        console.log("updatedMessage : ", updatedMessage);

        if (!updatedMessage)
            return res.status(404).json({ success: false, message: "Message not found" });

        // ── When admin RESOLVES a message → notify the user ───────────────────
        if (status === "RESOLVED") {
            const notifData = {
                type: "SUPPORT_MESSAGE",
                title: "Support Request Resolved ✅",
                message: `Your support request "${updatedMessage.subject.substring(0, 60)}${updatedMessage.subject.length > 60 ? "…" : ""}" has been resolved by our team. Check the Support Requests tab for details.`,
                link: "/history?active=support",   // ✅ takes user to their history → support tab
                messageId: String(updatedMessage._id),
                isRead: false,
                createdAt: new Date(),
            };

            // 1️⃣  Save to DB for the user (visible even if they're offline)
            await Notification.create({
                ...notifData,
                userId: updatedMessage.userId,
            }).catch((e) => console.error("❌ Message resolved notification DB error:", e));

            // 2️⃣  Live push to the user if connected
            emitToUser(updatedMessage.userId, notifData);
        }

        res.status(200).json({ success: true, message: "Status updated successfully", data: updatedMessage });
    } catch (error) {
        console.error("updateMessageStatus error:", error);
        res.status(500).json({ success: false, message: error.message || "Server error" });
    }
};

// ─── DELETE MESSAGE ───────────────────────────────────────────────────────────
const deleteMessage = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id))
            return res.status(400).json({ success: false, message: "Invalid message ID" });

        const deletedMessage = await Message.findByIdAndDelete(id).lean();
        if (!deletedMessage)
            return res.status(404).json({ success: false, message: "Message not found" });

        res.status(200).json({ success: true, message: "Message deleted successfully", data: deletedMessage });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message || "Server error" });
    }
};

module.exports = { createMessage, getMessages, getUserMessages, updateMessageStatus, deleteMessage };



// const { default: mongoose } = require("mongoose");
// const Message = require("../models/message")

// const createMessage = async (req, res) => {
//     try {
//         let { userId, fullname, email, phone, subject, message } = req.body;

//         if (!userId || !fullname || !email || !phone || !subject || !message) {
//             return res.status(400).json({
//                 success: false,
//                 message: "All fields are required",
//             });
//         }

//         // email validation
//         const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//         if (!emailRegex.test(email)) {
//             return res.status(400).json({
//                 success: false,
//                 message: "Invalid email format",
//             });
//         }

//         // trim data
//         const newMessage = await Message.create({
//             userId,
//             fullname: fullname.trim(),
//             phone,
//             email: email.trim(),
//             subject: subject.trim(),
//             message: message.trim(),
//         });

//         res.status(201).json({
//             success: true,
//             message: "Message created successfully",
//             data: newMessage,
//         });

//     } catch (error) {
//         console.error("createMessage error:", error);
//         res.status(500).json({
//             success: false,
//             message: error.message || "Server error",
//         });
//     }
// };

// const getMessages = async (req, res) => {
//     try {
//         const { status, search } = req.query;

//         // dynamic query
//         const query = {};

//         // filter by status
//         if (status && ["PENDING", "RESOLVED"].includes(status)) {
//             query.status = status;
//         }

//         // search (email / subject / name)
//         if (search) {
//             query.$or = [
//                 { fullname: { $regex: search, $options: "i" } },
//                 { email: { $regex: search, $options: "i" } },
//                 { subject: { $regex: search, $options: "i" } },
//             ];
//         }

//         const messages = await Message.find(query)
//             .sort({ createdAt: -1 }) // latest first
//             .lean(); // faster response

//         res.status(200).json({
//             success: true,
//             count: messages.length,
//             data: messages,
//         });

//     } catch (error) {
//         console.error("getMessages error:", error);
//         res.status(500).json({
//             success: false,
//             message: error.message || "Server error",
//         });
//     }
// };


// const getUserMessages = async (req, res) => {
//     try {
//         const userId = req.user?.id; // from auth middleware

//         if (!userId) {
//             return res.status(401).json({
//                 success: false,
//                 message: "Unauthorized",
//             });
//         }

//         const { status, search } = req.query;

//         const query = { userId };

//         // filter by status (optional)
//         if (status && ["PENDING", "RESOLVED"].includes(status)) {
//             query.status = status;
//         }

//         // search (optional)
//         if (search) {
//             query.$or = [
//                 { subject: { $regex: search, $options: "i" } },
//                 { message: { $regex: search, $options: "i" } },
//             ];
//         }

//         const messages = await Message.find(query)
//             .sort({ createdAt: -1 }) // latest first
//             .select("-__v") // remove unnecessary field
//             .lean(); // faster response

//         res.status(200).json({
//             success: true,
//             count: messages.length,
//             data: messages,
//         });

//     } catch (error) {
//         console.error("getUserMessages error:", error);
//         res.status(500).json({
//             success: false,
//             message: error.message || "Server error",
//         });
//     }
// };



// const updateMessageStatus = async (req, res) => {
//     try {
//         const { id } = req.params;
//         const { status } = req.body;

//         // validate MongoDB ObjectId
//         if (!mongoose.Types.ObjectId.isValid(id)) {
//             return res.status(400).json({
//                 success: false,
//                 message: "Invalid message ID",
//             });
//         }

//         // validate status
//         const allowedStatus = ["PENDING", "RESOLVED"];
//         if (!allowedStatus.includes(status)) {
//             return res.status(400).json({
//                 success: false,
//                 message: "Invalid status value",
//             });
//         }

//         // update status
//         const updatedMessage = await Message.findByIdAndUpdate(
//             id,
//             { status },
//             {
//                 new: true,
//                 runValidators: true,
//                 select: "-__v", // cleaner response
//             }
//         ).lean();

//         if (!updatedMessage) {
//             return res.status(404).json({
//                 success: false,
//                 message: "Message not found",
//             });
//         }

//         res.status(200).json({
//             success: true,
//             message: "Status updated successfully",
//             data: updatedMessage,
//         });

//     } catch (error) {
//         console.error("updateMessageStatus error:", error);
//         res.status(500).json({
//             success: false,
//             message: error.message || "Server error",
//         });
//     }
// };

// const deleteMessage = async (req, res) => {
//     try {
//         const { id } = req.params;

//         // validate ObjectId
//         if (!mongoose.Types.ObjectId.isValid(id)) {
//             return res.status(400).json({
//                 success: false,
//                 message: "Invalid message ID",
//             });
//         }

//         // find & delete
//         const deletedMessage = await Message.findByIdAndDelete(id).lean();

//         if (!deletedMessage) {
//             return res.status(404).json({
//                 success: false,
//                 message: "Message not found",
//             });
//         }

//         res.status(200).json({
//             success: true,
//             message: "Message deleted successfully",
//             data: deletedMessage, // optional (can remove if not needed)
//         });

//     } catch (error) {
//         console.error("deleteMessage error:", error);
//         res.status(500).json({
//             success: false,
//             message: error.message || "Server error",
//         });
//     }
// };

// module.exports = { createMessage, getMessages, getUserMessages, updateMessageStatus, deleteMessage }