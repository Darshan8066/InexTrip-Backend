
const express = require("express");
const { getPayments, getPaymentsByUserId, createPayment } = require("../controllers/paymentController");
const { verifyToken } = require("../middleware/auth");

const router = express.Router(); 

//post
router.post("/create",verifyToken ,createPayment);

//get
router.get("/", getPayments);
router.get("/get",verifyToken ,getPaymentsByUserId);

module.exports = router;