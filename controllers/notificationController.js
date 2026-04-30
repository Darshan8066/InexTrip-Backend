
const Notification = require("../models/notification");

// ─── GET MY NOTIFICATIONS ─────────────────────────────────────────────────────
// Returns all notifications for the logged-in user (or admin), newest first
const getMyNotifications = async (req, res) => {
    try {
        const userId = req.user.id;

        const notifications = await Notification.find({ userId })
            .sort({ createdAt: -1 })
            .limit(50)
            .lean();

        const unreadCount = notifications.filter(n => !n.isRead).length;

        res.status(200).json({
            success: true,
            data: notifications,
            unreadCount,
        });

    } catch (err) {
        console.error("getMyNotifications error:", err);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// ─── MARK ONE AS READ ─────────────────────────────────────────────────────────
const markOneAsRead = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        await Notification.findOneAndUpdate(
            { _id: id, userId },
            { isRead: true }
        );

        res.status(200).json({ success: true });
    } catch (err) {
        console.error("markOneAsRead error:", err);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// ─── MARK ALL AS READ ────────────────────────────────────────────────────────
const markAllAsRead = async (req, res) => {
    try {
        const userId = req.user.id;

        await Notification.updateMany(
            { userId, isRead: false },
            { isRead: true }
        );

        res.status(200).json({ success: true, message: "All notifications marked as read" });
    } catch (err) {
        console.error("markAllAsRead error:", err);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

module.exports = { getMyNotifications, markOneAsRead, markAllAsRead };
