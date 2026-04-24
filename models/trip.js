
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
    tripType: { type: String, enum: ["AI", "JOIN"], required: true },
    from: { type: String, required: true },
    to: { type: String, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    pickupPoint: { type: String },
    dropPoint: { type: String },
    budget: { type: String, required: true },
    price: { type: Number, required: true },
    transportMode: { type: String, enum: ["Bus", "Train", "Plane","Car"] },
    dayPlan: [DayPlanSchema],
    hotels: [String],
    foodPlace: [String],
    images: [String],
    description: String,
    category: { type: String, enum: ['Heritage', 'Mountains', 'Beaches', 'Cities'] },
    travelers:{ type: Number},
    tripPace:{ type: String},
    fullname: { type: String },
    profilePhoto: { type: String },
}, {
    timestamps: true   // ✅ automatically adds createdAt & updatedAt
})


module.exports = mongoose.model('Trip', TripSchema);    