const mongoose = require("mongoose");

const cancellationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    tripId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Trip",
      required: true
    },

    paymentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment' },

    transactionId: {
      type: String
    },

    fullname: String,
    email: String,
    phone: String,

    upiId: {
      type: String,
      required: true
    },

    reason: {
      type: String,
      required: true
    },

    invoicePhoto: String,

    refundAmount: Number,
    refundPercent: Number,
    diffDays: Number,

    status: {
      type: String,
      enum: ["PENDING", "APPROVED", "REJECTED"],
      default: "PENDING"
    },
    
    resolution: {
      type: String,
      default: ""
    }
  },
  {
    timestamps: true // 🔥 auto add createdAt, updatedAt
  }
);

module.exports = mongoose.model("Cancellation", cancellationSchema);