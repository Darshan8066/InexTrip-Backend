const mongoose = require("mongoose");

const MessageSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  fullname: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: Number, required: true },
  subject: { type: String, required: true },
  message: { type: String, required: true },
  status: { type: String, enum: ['PENDING', 'RESOLVED'], default: 'PENDING' }
}, {
  timestamps: true   // ✅ automatically adds createdAt & updatedAt
})

module.exports = mongoose.model('Message', MessageSchema);