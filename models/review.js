const mongoose = require("mongoose");

const ReviewSchema = new mongoose.Schema({

    tripId: { type: mongoose.Schema.Types.ObjectId, ref: 'Trip' },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    fullname: { type: String, required: true },
    profilePhoto: { type: String },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true, trim: true }
}, {
    timestamps: true   // ✅ automatically adds createdAt & updatedAt
})

// 👇 🔥 HERE you add index
ReviewSchema.index({ tripId: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model('Review', ReviewSchema);
