const mongoose = require("mongoose");

const NotificationSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        type: {
            type: String,
            enum: ["NEW_TRIP", "TRIP_CANCEL", "CANCEL_STATUS", "SUPPORT_MESSAGE"],
            required: true,
        },

        title: {
            type: String,
            required: true,
        },

        message: {
            type: String,
            required: true,
        },

        // Frontend route to navigate to when notification is clicked
        link: {
            type: String,
            required: true,
        },

        isRead: {
            type: Boolean,
            default: false,
        },

        // Optional reference IDs for context
        tripId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Trip",
        },

        cancellationId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Cancellation",
        },

        messageId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Message",
        },
    },
    { timestamps: true }
);

// Performance index: fetch unread notifications for a user fast
NotificationSchema.index({ userId: 1, isRead: 1 });

module.exports = mongoose.model("Notification", NotificationSchema);
