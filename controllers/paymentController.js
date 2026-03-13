const Payment = require("../models/payment");

const getPayments = async (req, res) => {
    try {
        const payments = await Payment.find();

        res.status(200).json({
            success: true,
            payments,
            count: payments.length,
            message: "get Payment"
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || "Server Error"
        });

    }
}

module.exports = { getPayments };