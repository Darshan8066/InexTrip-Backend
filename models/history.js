const mongoose = require("mongoose");

const HistorySchema = new mongoose.Schema({

    userId: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    tripId: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Trip' }],
    paymentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment' },
    type: { type: String, enum: ['CREATED', 'JOINED'] },
    date: { type: Date, default: Date.now },
    createdAt: { type: Date, default: Date.now }

})

module.exports = mongoose.model('History', HistorySchema);