
const express = require("express");
const router = express.Router();    // Create router

const { registerUser, loginUser, getUser, updatedUser, getUserById, toggleFavourite, getAdminStats, deleteUserAccount } = require("../controllers/userController");
const { verifyToken } = require("../middleware/auth");

//Post
router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/favourite", verifyToken, toggleFavourite);

//get
router.get("/get", getUser);
router.get("/getUser", verifyToken, getUserById);
router.get("/stats", verifyToken, getAdminStats);

// put
router.put("/update", verifyToken, updatedUser);

//delete
// router.delete("/delete/:id", deleteUser);
router.delete("/delete/:id", deleteUserAccount);

module.exports = router;