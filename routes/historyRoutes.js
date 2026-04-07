const express = require("express");
const { saveHistory, getHistoryByUser, clearHistory } = require("../controllers/histroyController");
const { verifyToken } = require("../middleware/auth");
const router = express.Router();

router.post("/save", saveHistory);
router.get("/get", verifyToken, getHistoryByUser);
router.delete("/clear", verifyToken, clearHistory);


module.exports = router;    