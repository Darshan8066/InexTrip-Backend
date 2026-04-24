const mongoose = require("mongoose");

const ReviewSchema = new mongoose.Schema({

    tripId: { type: mongoose.Schema.Types.ObjectId, ref: 'Trip' },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true, trim: true },
    fullname: { type: String },
    profilePhoto: { type: String },
}, {
    timestamps: true   // ✅ automatically adds createdAt & updatedAt
})

// 👇 🔥 HERE you add index
ReviewSchema.index({ tripId: 1, userId: 1 }, { unique: true, partialFilterExpression: { userId: { $ne: null } } });

module.exports = mongoose.model('Review', ReviewSchema);
