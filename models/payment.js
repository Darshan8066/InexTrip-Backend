const mongoose = require("mongoose");

const passengersdetails = new mongoose.Schema({

    name: { type: String, required: true },
    age: { type: Number, required: true },
    gender: { type: String, required: true },
    mobile: { type: Number },
});

const PaymentSchema = new mongoose.Schema({

    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    tripId: { type: mongoose.Schema.Types.ObjectId, ref: 'Trip' },
    amount: { type: Number, required: true },
    paymentMethod: { type: String, required: true },
    transactionId: { type: String, required: true },
    status: { type: String, enum: ['PENDING', 'SUCCESS', 'FAILED'] },
    numPersons: { type: Number, required: true },
    passengers: [passengersdetails],
    contactEmail: { type: String },
    contactMobile: { type: Number },
    emergencyContactName: { type: String },
    emergencyContactPhone: { type: Number },
    specialRequests: { type: String },

    fullname: { type: String },
    profilePhoto: { type: String },
}, {
    timestamps: true   // ✅ automatically adds createdAt & updatedAt
})

module.exports = mongoose.model('Payment', PaymentSchema);
