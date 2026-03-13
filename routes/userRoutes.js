
const express = require("express");
const router = express.Router();    // Create router

const { registerUser, loginUser, getUser, updatedUser, deleteUser, getUserById } = require("../controllers/userController");
const { verifyToken } = require("../middleware/auth");

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/get", getUser);
router.put("/update",verifyToken, updatedUser);
router.delete("/delete/:id", deleteUser);
router.get("/getUser", verifyToken,getUserById);

module.exports = router;