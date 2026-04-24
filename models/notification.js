// const mongoose = require("mongoose");

// const NotificationSchema = new mongoose.Schema(
//     {
//         userId: {
//             type: mongoose.Schema.Types.ObjectId,
//             ref: "User",
//             required: true,
//         },

//         type: {
//             type: String,
//             enum: ["USER_REQUEST", "ADMIN_REPLY", "TRIP"],
//             required: true,
//         },

//         subject: {
//             type: String,
//             required: true,
//         },

//         message: {
//             type: String,
//             default: "",
//         },

//         resolution: {
//             type: String,
//         },

//         requestId: {
//             type: mongoose.Schema.Types.ObjectId,
//             ref: "Message",
//         },

//         tripId: {
//             type: mongoose.Schema.Types.ObjectId,
//             ref: "Trip",
//         },

//         isRead: {
//             type: Boolean,
//             default: false,
//         },

//         createdBy: {
//             type: mongoose.Schema.Types.ObjectId,
//             ref: "User",
//         },
//     },
//     { timestamps: true }
// );

// // 🔥 performance index
// NotificationSchema.index({ userId: 1, isRead: 1 });

// module.exports = mongoose.model("Notification", NotificationSchema);