const mongoose = require("mongoose");
const Trip = require("../models/trip");
const { geminiService } = require("../services/geminiService");
const User = require("../models/user");
const Notification = require("../models/notification");
const { emitToAllUsers } = require("../socket/socketManager");

// ─── Helper: validate MongoDB ObjectId ───────────────────────────────────────
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// ─── CREATE TRIP (POST) ───────────────────────────────────────────────────────

const createTripBatch = async (req, res) => {
  try {
    const newTrip = new Trip({ ...req.body });
    await newTrip.save();

    const users = await User.find({ role: { $ne: "ADMIN" } }).select("_id");


    if (users.length > 0) {
      const notifData = {
        type: "NEW_TRIP",
        title: "New Trip Available ✈️",
        message: `A new trip has been added: "${newTrip.title || newTrip.name}". Tap to explore!`,
        link: "/join-trip",
        tripId: newTrip._id,
        isRead: false,
      };

      // 1️⃣  Persist to DB for each user
      const dbNotifs = users.map((u) => ({ ...notifData, userId: u._id }));
      await Notification.insertMany(dbNotifs).catch((e) =>
        console.error("Notification insertMany error:", e)
      );

      // 2️⃣  Push live to all connected users via Socket.io
      emitToAllUsers(notifData);
    }

    res.status(201).json(newTrip);

  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// -----------------------------------How the data flows now------------------------------------
// User clicks "Page 3"
//   → frontend calls fetchTrip({ page: 3, limit: 6 })
//     → GET /trip/get?page=3&limit=6
//       → backend skips 12, fetches next 6 from MongoDB
//         → returns { trips[6], totalTrips: 32, totalPages: 6, currentPage: 3 }
//           → frontend renders those 6 cards + correct pagination UI

// ─── GET ALL TRIPS (GET) ──────────────────────────────────────────────────────

const getTripWithPagination = async (req, res) => {
  try {
    // Parse + clamp so clients can't request 10,000 docs in one shot
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 6));
    const skip = (page - 1) * limit;

    // Optional filters
    const filter = {};
    if (req.query.category) filter.category = req.query.category;
    if (req.query.location) filter.location = new RegExp(req.query.location, "i");

    // Run total count and page fetch in parallel — faster than sequential awaits
    const [totalTrips, trips] = await Promise.all([
      Trip.countDocuments(filter),
      Trip.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    ]);

    return res.status(200).json({
      success: true,
      trips,
      totalTrips,                          // e.g. 32
      totalPages: Math.ceil(totalTrips / limit), // e.g. 6 (at 6 per page)
      currentPage: page,
      limit,
    });
  } catch (error) {
    console.error("getTrip error:", error);
    return res.status(500).json({ success: false, message: error.message || "Server error. Please try again." });
  }
};

const getTrip = async (req, res) => {
  try {
    const trips = await Trip.find().sort({ createdAt: -1 });

    if (!trips || trips.length === 0) {            // If no trips found in database, check if data exists
      return res.status(404).json({
        success: false,
        message: "No trips found"
      });
    }

    res.status(200).json({             // If trips found 
      success: true,
      trip: trips,
      count: trips.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Server Error"
    });
  }
};


// ─── GET TRIP BY ID (GET) ─────────────────────────────────────────────────────
const getTripById = async (req, res) => {
  try {
    const { id } = req.params;

    // FIX: Validate ObjectId format before querying — prevents ugly CastError from Mongoose
    if (!isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid trip ID format" });
    }

    const trip = await Trip.findById(id);
    if (!trip) {
      return res.status(404).json({ success: false, message: "Trip not found" });
    }

    return res.status(200).json({ success: true, trip });
  } catch (error) {
    console.error("getTripById error:", error);
    return res.status(500).json({ success: false, message: error.message || "Server error. Please try again." });
  }
};

// ─── UPDATE TRIP (PUT) ────────────────────────────────────────────────────────
const updateTrip = async (req, res) => {
  try {
    const { id } = req.params;

    // FIX: Validate ObjectId format
    if (!isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid trip ID format" });
    }

    // Optional: only the creator or admin can update
    const trip = await Trip.findById(id);
    if (!trip) {
      return res.status(404).json({ success: false, message: "Trip not found" });
    }

    if (
      req.user?.role !== "ADMIN" &&
      trip.createdBy?.toString() !== req.user?.id
    ) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized to update this trip",
      });
    }

    const updatedTrip = await Trip.findByIdAndUpdate(
      id,
      req.body,
      {
        new: true, // return updated data
        runValidators: true,
      }
    );

    return res.status(200).json({
      success: true,
      message: "Trip updated successfully",
      trip: updatedTrip,
    });
  } catch (error) {
    console.error("updateTrip error:", error);
    return res.status(500).json({ success: false, message: error.message || "Server error. Please try again." });
  }
};

// ─── DELETE TRIP (DELETE) ─────────────────────────────────────────────────────
const deleteTrip = async (req, res) => {
  try {
    const { id } = req.params;

    // FIX: Validate ObjectId format
    if (!isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid trip ID format" });
    }

    // FIX: Authorization check — only the creator or admin can delete
    const trip = await Trip.findById(id);
    if (!trip) {
      return res.status(404).json({ success: false, message: "Trip not found" });
    }

    if (
      req.user?.role !== "ADMIN" &&
      trip.createdBy?.toString() !== req.user?.id
    ) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized to delete this trip",
      });
    }

    await Trip.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "Trip deleted successfully",
    });
  } catch (error) {
    console.error("deleteTrip error:", error);
    return res.status(500).json({ success: false, message: error.message || "Server error. Please try again." });
  }
};

const deployTrip = async (req, res) => {
  try {
    const tripData = req.body;

    // Optional: backend validation
    if (!tripData.title || !tripData.price) {
      return res.status(400).json({
        success: false,
        message: "Required fields missing",
      });
    }

    const newTrip = new Trip(tripData);
    await newTrip.save();

    res.status(201).json({
      success: true,
      message: "Trip deployed successfully",
      data: newTrip,
    });

  } catch (error) {
    console.log("deployTrip error:", error.message);

    res.status(500).json({
      success: false,
      message: "Server error while deploying trip",
    });
  }
};


const aiTrip = async (req, res) => {
  try {
    console.log("aiTrip function call")
    const result = await geminiService.generateTrip(req.body);
    console.log("result : ", result)
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to generate trip"
    });
  }
};



module.exports = { createTripBatch, getTrip, getTripById, updateTrip, deleteTrip, getTripWithPagination, deployTrip, aiTrip };
