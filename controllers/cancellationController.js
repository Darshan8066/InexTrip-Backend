
const Cancellation = require("../models/Cancellation");
const Notification = require("../models/notification");
const Payment = require("../models/payment");
const user = require("../models/user");
const { emitToAdmins, emitToUser } = require("../socket/socketManager");


const createCancellation = async (req, res) => {
    try {
        const userId = req.user.id;
        const {
            tripId, paymentId, transactionId, fullname, email,
            phone, upiId, reason, invoicePhoto,
            refundAmount, refundPercent, diffDays,
        } = req.body;

        if (!tripId || !paymentId || !upiId || !reason)
            return res.status(400).json({ message: "Missing fields" });

        const payment = await Payment.findOne({ _id: paymentId, userId });
        if (!payment) return res.status(404).json({ message: "Invalid payment" });

        const existing = await Cancellation.findOne({ paymentId });
        if (existing) return res.status(400).json({ message: "Already cancelled" });

        const newCancellation = new Cancellation({
            userId, tripId, paymentId, transactionId, fullname, email,
            phone, upiId, reason, invoicePhoto,
            refundAmount, refundPercent, diffDays, status: "PENDING",
        });
        await newCancellation.save();

        // ── Build notification payload ────────────────────────────────────────
        const notifData = {
            type: "TRIP_CANCEL",
            title: "Trip Cancellation Request 🚨",
            message: `${fullname} submitted a cancellation request. Refund amount: ₹${refundAmount || 0}. Reason: "${reason}"`,
            link: "/refund",
            cancellationId: newCancellation._id,
            tripId,
            isRead: false,
            createdAt: new Date(),
        };

        // 1️⃣  Persist to DB for every admin
        const admins = await user.find({ role: "ADMIN" }).select("_id");
        if (admins.length > 0) {
            const dbNotifs = admins.map((a) => ({ ...notifData, userId: a._id }));
            await Notification.insertMany(dbNotifs).catch((e) =>
                console.error("Cancellation notification DB error:", e)
            );
        }

        // 2️⃣  Live push to connected admins
        emitToAdmins(notifData);

        res.status(201).json({ message: "Cancellation submitted", data: newCancellation });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
};
// const createCancellation = async (req, res) => {
//     try {
//         const userId = req.user.id;

//         const {
//             tripId,
//             paymentId,
//             transactionId,
//             fullname,
//             email,
//             phone,
//             upiId,
//             reason,
//             invoicePhoto,
//             refundAmount,
//             refundPercent,
//             diffDays
//         } = req.body;

//         if (!tripId || !paymentId || !upiId || !reason) {
//             return res.status(400).json({ message: "Missing fields" });
//         }

//         const payment = await Payment.findOne({ _id: paymentId, userId });

//         if (!payment) {
//             return res.status(404).json({ message: "Invalid payment" });
//         }

//         const existing = await Cancellation.findOne({ paymentId });

//         if (existing) {
//             return res.status(400).json({ message: "Already cancelled" });
//         }

//         const newCancellation = new Cancellation({
//             userId,
//             tripId,
//             paymentId,
//             transactionId,
//             fullname,
//             email,
//             phone,
//             upiId,
//             reason,
//             invoicePhoto,
//             refundAmount,
//             refundPercent,
//             diffDays,
//             status: "PENDING"
//         });

//         await newCancellation.save();

//         // Notify all admins about the cancellation request
//         const admins = await User.find({ role: "ADMIN" }).select("_id");

//         if (admins.length > 0) {
//             const adminNotifications = admins.map((admin) => ({
//                 userId: admin._id,
//                 type: "TRIP_CANCEL",
//                 title: "Trip Cancellation Request 🚨",
//                 message: `${fullname} has requested a trip cancellation. Refund: ₹${refundAmount || 0}`,
//                 link: "/refund",
//                 cancellationId: newCancellation._id,
//                 tripId,
//                 isRead: false,
//             }));

//             try {
//                 await Notification.insertMany(adminNotifications);
//             } catch (err) {
//                 console.error("Cancellation notification error:", err);
//             }
//         }

//         res.status(201).json({
//             message: "Cancellation submitted",
//             data: newCancellation
//         });

//     } catch (err) {
//         res.status(500).json({ message: "Server error" });
//     }
// };


const getAllCancellations = async (req, res) => {
    try {
        const cancellations = await Cancellation.find()
            .populate("userId", "fullname email mobile")
            .populate("tripId", "to startDate")
            .populate("paymentId", "transactionId")
            .sort({ createdAt: -1 });
console.log("cancellations",cancellations);
        // format response (frontend friendly)
        const formatted = cancellations.map(c => ({
            id: c._id,
            fullname: c.fullname || c.userId?.fullname,
            email: c.email || c.userId?.email,
            phone: c.phone || c.userId?.mobile,
            tripTo: c.tripId?.to,
            // createdAt: c.createdAt,
            refundAmount: c.refundAmount,
            upiId: c.upiId,
            reason: c.reason,
            status: c.status,
            transactionId: c.paymentId?.transactionId,
            invoicePhoto: c.invoicePhoto,
            paymentId: c.paymentId?._id,
            userId: c.userId?._id
        }));
// console.log("formatted",formatted)
        res.status(200).json({
            success: true,
            data: formatted
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
};

const updateCancellation = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, resolution, paymentId, refundTxnId } = req.body;

        const cancellation = await Cancellation.findById(id);
        if (!cancellation) return res.status(404).json({ message: "Cancellation not found" });

        if (status) cancellation.status = status;
        if (resolution) cancellation.resolution = resolution;
        await cancellation.save();


        if (status === "APPROVED" && paymentId) {
            await Payment.findByIdAndUpdate(paymentId, {
                refundStatus: "REFUNDED",
                refundTxnId,
            });
        }

        // Notify the user who made the cancellation request
        if (status === "APPROVED" || status === "REJECTED") {
            const isApproved = status === "APPROVED";

            const notifData = {
                type: "CANCEL_STATUS",
                title: isApproved ? "Cancellation Approved ✅" : "Cancellation Rejected ❌",
                message: isApproved
                    ? `Your trip cancellation has been approved. A refund of ₹${cancellation.refundAmount} will be processed to your UPI account.`
                    : `Your trip cancellation was rejected. ${resolution ? "Admin note: " + resolution : "Please contact support for more information."}`,
                link: "/history?active=support",
                cancellationId: cancellation._id,
                isRead: false,
            };

            // 1️⃣  Persist to DB
            await Notification.create({
                ...notifData,
                userId: cancellation.userId,
            }).catch((e) => console.error("Cancel status notification DB error:", e));

            // 2️⃣  Live push to that user
            emitToUser(cancellation.userId, notifData);
        }

        res.status(200).json({
            message: "Cancellation updated successfully",
            data: cancellation
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
};



// ─── GET CANCELLATIONS FOR LOGGED-IN USER ─────────────────────────────────────
const getUserCancellations = async (req, res) => {
    try {
        const userId = req.user.id;

        const cancellations = await Cancellation.find({ userId })
            .populate("tripId", "to from startDate")
            .populate("paymentId", "transactionId refundTxnId")
            .sort({ createdAt: -1 })
            .lean();

        res.status(200).json({ success: true, data: cancellations });
    } catch (err) {
        console.error("getUserCancellations error:", err);
        res.status(500).json({ message: "Server error" });
    }
};

module.exports = { createCancellation, getAllCancellations, updateCancellation, getUserCancellations }