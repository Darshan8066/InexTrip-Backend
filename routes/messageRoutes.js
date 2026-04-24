

const express = require("express");
const { createMessage, getMessages, getUserMessages, updateMessageStatus, deleteMessage } = require("../controllers/messageController");
const { verifyToken } = require("../middleware/auth")
const router = express.Router();

router.post("/create", verifyToken, createMessage);
router.get("/all", getMessages);
router.get("/user", verifyToken, getUserMessages);
router.put("/update/:id", verifyToken, updateMessageStatus);
router.delete("/delete/:id", deleteMessage);

module.exports = router;
