const express = require("express");
const router = express.Router();

const { verifyToken } = require("../middleware/auth");
const { createCancellation, getAllCancellations, updateCancellation, getUserCancellations } = require("../controllers/cancellationController");

router.post("/trip", verifyToken, createCancellation);
router.get("/all", verifyToken, getAllCancellations);
router.get("/my", verifyToken, getUserCancellations);
router.put("/update/:id", verifyToken, updateCancellation);

module.exports = router;