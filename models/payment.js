const mongoose = require("mongoose");


const PaymentSchema = new mongoose.Schema({

    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    tripId: { type: mongoose.Schema.Types.ObjectId, ref: 'Trip' },
    amount: { type: Number, required: true },
    paymentMethod: { type: String, required: true },
    transactionId: { type: String, required: true },
    status: { type: String, enum: ['PENDING', 'SUCCESS', 'FAILED'] },
    date: { type: Date, default: Date.now },
    createdAt: { type: Date, default: Date.now }
})

module.exports = mongoose.model('Payment', PaymentSchema);
