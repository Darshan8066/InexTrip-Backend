const Payment = require("../models/payment");

const getPayments = async (req, res) => {
    try {
        const payments = await Payment.find();

        res.status(200).json({
            success: true,
            payments,
            count: payments.length,
            message: "get all Payment"
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || "Server Error"
        });

    }
}
const getPaymentsByUserId = async (req, res) => {
    try {
        const userId = req.user.id;
        const payments = await Payment.find({ userId });
        console.log("getPaymentsByUserId : ", payments)

        res.status(200).json({
            success: true,
            payments,
            count: payments.length,
            message: "User payments fetched successfully"
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message || "Server Error"
        });


    }
}

const savePayment = async (req, res) => {
    try {

        const userId = req.user.id; // from token

        const { amount, paymentMethod } = req.body;

        const payment = new Payment({
            userId,
            transactionId: "TXN" + Date.now(),
            amount,
            paymentMethod
        });

        await payment.save();

        res.status(201).json({
            success: true,
            message: "Payment saved successfully",
            payment
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message || "Server Error"
        });

    }
};


module.exports = { getPayments, getPaymentsByUserId, savePayment };