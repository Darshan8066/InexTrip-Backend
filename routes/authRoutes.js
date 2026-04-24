// ── ADD THESE TWO LINES to your existing authRoutes.js ───────────────────────
const express = require("express");
const router = express.Router();

const { forgotPassword, resetPassword } = require("../controllers/forgotpasswordController"); // adjust path

router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);


module.exports = router;
