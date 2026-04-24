const express = require("express");
const { getHistoryByUser, clearHistory, saveHistory } = require("../controllers/histroyController");
const { verifyToken } = require("../middleware/auth");
const router = express.Router();

//post
router.post("/save", saveHistory);

//get
router.get("/get", verifyToken, getHistoryByUser);

//delete
router.delete("/clear", verifyToken, clearHistory);


module.exports = router;    