const Payment = require("../models/payment");
const History = require("../models/history");


const createPayment = async (req, res) => {
    try {

        const { userId, tripId, amount, paymentMethod, transactionId } = req.body;

        const payment = await Payment.create({
            userId,
            tripId,
            amount,
            paymentMethod,
            transactionId,
            status: "SUCCESS"
        });

        await History.create({
            userId,
            tripId,
            paymentId: payment._id,
            type: "JOINED"
        });

        res.status(201).json({
            success: true,
            message: "Payment successful",
            payment
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getPayments = async (req, res) => {
    try {
        const payments = await Payment.find()
            .populate('userId', 'fullname profilePhoto -_id');

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





// const savePayment = async (req, res) => {
//     try {

//         const userId = req.user.id; // from token

//         const { amount, paymentMethod } = req.body;

//         const payment = new Payment({
//             userId,
//             transactionId: "TXN" + Date.now(),
//             amount,
//             paymentMethod
//         });

//         await payment.save();

//         res.status(201).json({
//             success: true,
//             message: "Payment saved successfully",
//             payment
//         });

//     } catch (error) {

//         res.status(500).json({
//             success: false,
//             message: error.message || "Server Error"
//         });

//     }
// };


module.exports = { getPayments, getPaymentsByUserId, createPayment };