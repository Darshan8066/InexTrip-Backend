const mongoose = require("mongoose");

// Define User Schema (structure of User collection)
const UserSchema = new mongoose.Schema({

    fullname: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    mobile: { type: Number, required: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['USER', 'ADMIN'], default: 'USER' },
    profilePhoto: { type: String, },
    favourites: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Trip' }],
    resetPasswordToken: { type: String },
    resetPasswordExpiry: { type: Date },
    // Activity: { type: String }
}, {
    timestamps: true   // ✅ automatically adds createdAt & updatedAt
})

module.exports = mongoose.model('User', UserSchema);


