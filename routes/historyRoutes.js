const express = require("express");
const { saveHistory, getHistoryByUserId, clearHistory } = require("../controllers/histroyController");
const { verifyToken } = require("../middleware/auth");
const router = express.Router();

router.post("/save", saveHistory);
router.get("/get",verifyToken, getHistoryByUserId);
router.get("/clear",verifyToken, clearHistory);


module.exports = router;    