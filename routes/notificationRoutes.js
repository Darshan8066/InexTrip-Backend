const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middleware/auth");
const { getMyNotifications, markOneAsRead, markAllAsRead } = require("../controllers/notificationController");

router.get("/my", verifyToken, getMyNotifications);
router.put("/read/:id", verifyToken, markOneAsRead);
router.put("/read-all", verifyToken, markAllAsRead);

module.exports = router;
