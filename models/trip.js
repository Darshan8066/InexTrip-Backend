
const mongoose = require("mongoose");

// DAY PLAN SCHEMA (SUB-DOCUMENT)
const DayPlanSchema = new mongoose.Schema({
    day: { type: Number, required: true },
    activities: [String],
    image: [String],
    meals: {
        breakfast: String,
        lunch: String,
        dinner: String
    }
});

//  MAIN TRIP SCHEMA
const TripSchema = new mongoose.Schema({

    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    fullname: { type: String },
    profilePhoto: { type: String },
    tripType: { type: String, enum: ["AI", "JOIN"], required: true },
    from: { type: String, required: true },
    to: { type: String, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    pickupPoint: { type: String },
    dropPoint: { type: String },
    budget: { type: Number, required: true },
    price: { type: Number, required: true },
    transportMode: { type: String, enum: ["Bus", "Train", "Plane"] },
    dayPlan: [DayPlanSchema],
    hotels: [String],
    foodPlace: [String],
    images: [String],
    description: String,
    category: { type: String, enum: ['Heritage', 'Mountains', 'Beaches', 'Cities'] },
}, {
    timestamps: true   // ✅ automatically adds createdAt & updatedAt
})


module.exports = mongoose.model('Trip', TripSchema);    