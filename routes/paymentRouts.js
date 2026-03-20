
const express = require("express");
const { getPayments, getPaymentsByUserId, createPayment } = require("../controllers/paymentController");
const { verifyToken } = require("../middleware/auth");
const router = express.Router(); 

router.get("/", getPayments);
router.get("/get",verifyToken ,getPaymentsByUserId);
router.post("/create",verifyToken ,createPayment);


module.exports = router;