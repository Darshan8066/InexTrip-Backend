const mongoose = require("mongoose");
const Trip = require("../models/trip");
// NOTE: Removed unused `user` import — add back only if needed for population

// ─── Helper: validate MongoDB ObjectId ───────────────────────────────────────
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// ─── CREATE TRIP (POST) ───────────────────────────────────────────────────────
// const createTripBatch = async (req, res) => {
//   try {
//     const {
//       title,
//       description,
//       price,
//       location,
//       duration,
//       maxGroupSize,
//       images,
//       category,
//     } = req.body;

//     // FIX: Validate required fields instead of blindly spreading req.body
//     if (!title || !description || !price || !location || !duration) {
//       return res.status(400).json({
//         success: false,
//         message: "title, description, price, location, and duration are required",
//       });
//     }

//     if (typeof price !== "number" || price <= 0) {
//       return res.status(400).json({
//         success: false,
//         message: "Price must be a positive number",
//       });
//     }

//     if (typeof duration !== "number" || duration <= 0) {
//       return res.status(400).json({
//         success: false,
//         message: "Duration must be a positive number",
//       });
//     }

//     // FIX: Whitelist fields instead of spreading entire req.body (prevents field injection)
//     const newTrip = new Trip({
//       title,
//       description,
//       price,
//       location,
//       duration,
//       maxGroupSize,
//       images,
//       category,
//       createdBy: req.user?.id, // attach creator from auth middleware if available
//     });

//     await newTrip.save();

//     return res.status(201).json({
//       success: true,
//       message: "Trip created successfully",
//       trip: newTrip,
//     });
//   } catch (error) {
//     console.error("createTripBatch error:", error);
//     // FIX: was returning 400 for all errors — 500 for unexpected server errors
//     return res.status(500).json({
//       success: false,
//       message: error.message || "Server error. Please try again.",
//     });
//   }
// };
const createTripBatch = async (req, res) => {

    try {
        const newTrip = new Trip({
            ...req.body,
            // images: imageUrls
        });
        await newTrip.save();
        res.status(201).json(newTrip);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
}


// How the data flows now
// User clicks "Page 3"
//   → frontend calls fetchTrip({ page: 3, limit: 6 })
//     → GET /trip/get?page=3&limit=6
//       → backend skips 12, fetches next 6 from MongoDB
//         → returns { trips[6], totalTrips: 32, totalPages: 6, currentPage: 3 }
//           → frontend renders those 6 cards + correct pagination UI

// ─── GET ALL TRIPS (GET) ──────────────────────────────────────────────────────
// const getTrip = async (req, res) => {
//   try {
//     // FIX: Added pagination to avoid crashes on large datasets
//     const page = parseInt(req.query.page) || 1;
//     const limit = parseInt(req.query.limit) || 10;
//     const skip = (page - 1) * limit;

//     // Optional: filter by category or location via query params
//     const filter = {};
//     if (req.query.category) filter.category = req.query.category;
//     if (req.query.location) filter.location = new RegExp(req.query.location, "i");

//     const total = await Trip.countDocuments(filter);
//     const trips = await Trip.find(filter)
//       .sort({ createdAt: -1 })
//       .skip(skip)
//       .limit(limit);

//     // FIX: Return empty array with 200 instead of 404 — no trips is not an error
//     return res.status(200).json({
//       success: true,
//       trips,
//       count: trips.length,
//       total,
//       page,
//       totalPages: Math.ceil(total / limit),
//     });
//   } catch (error) {
//     console.error("getTrip error:", error);
//     return res.status(500).json({
//       success: false,
//       message: error.message || "Server error. Please try again.",
//     });
//   }
// };

const getTrip = async (req, res) => {
  try {
    // Parse + clamp so clients can't request 10,000 docs in one shot
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 6));
    const skip  = (page - 1) * limit;
 
    // Optional filters
    const filter = {};
    if (req.query.category) filter.category = req.query.category;
    if (req.query.location)  filter.location = new RegExp(req.query.location, "i");
 
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

    // // FIX: Whitelist allowed update fields — prevents overwriting sensitive fields like createdBy
    // const allowedFields = [
    //   "title",
    //   "description",
    //   "price",
    //   "location",
    //   "duration",
    //   "maxGroupSize",
    //   "images",
    //   "category",
    // ];

    // const updateData = {};
    // allowedFields.forEach((field) => {
    //   if (req.body[field] !== undefined) {
    //     updateData[field] = req.body[field];
    //   }
    // });

    // if (Object.keys(updateData).length === 0) {
    //   return res.status(400).json({
    //     success: false,
    //     message: "No valid fields provided for update",
    //   });
    // }

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
      req.user?.role !== "admin" &&
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

module.exports = { createTripBatch, getTrip, getTripById, updateTrip, deleteTrip };
// const Trip = require("../models/trip");
// const user = require("../models/user");

// // Post Method

// const createTripBatch = async (req, res) => {

//     try {
//         const newTrip = new Trip({
//             ...req.body,
//             // images: imageUrls
//         });
//         await newTrip.save();
//         res.status(201).json(newTrip);
//     } catch (error) {
//         res.status(400).json({ message: error.message });
//     }
// }

// // Get MEthod

// const getTrip = async (req, res) => {
//     try {
//         const trips = await Trip.find().sort({ createdAt: -1 });
       
//         if (!trips || trips.length === 0) {            // If no trips found in database, check if data exists
//             return res.status(404).json({
//                 success: false,
//                 message: "No trips found"
//             });
//         }
       
//         res.status(200).json({             // If trips found 
//             success: true,
//             trip: trips,
//             count: trips.length
//         });
//     } catch (error) {
//         res.status(500).json({
//             success: false,
//             message: error.message || "Server Error"
//         });
//     }
// };

// // Get TripById Method

// const getTripById = async (req, res) => {
//     try {
//         const { id } = req.params;     // Get trip ID from URL params
//         const trip = await Trip.findById(id);      // Find trip by MongoDB ID
//         if (!trip) {
//             return res.status(404).json({ success: false, message: "Trip Not Found" });

//         }
//         res.status(200).json({ success: true, message: "Trip Is Found", trip });
//     } catch (error) {
//         res.status(500).json({ success: false, message: error.message });
//     }
// }

// // Update MEthod

// const updateTrip = async (req, res) => {
//     try {
//         const { id } = req.params;                       // Get ID from URL
//         const updatedTrip = await Trip.findByIdAndUpdate(     // Find trip by ID and update with new data
//             id,
//             req.body,
//             {
//                 new: true,                             // Return updated document
//                 runValidators: true                     // Apply schema validation
//             }
//         );
//         if (!updatedTrip) {
//             return res.status(404).json({
//                 success: false,
//                 message: "Trip not found"
//             });
//         }
//         return res.status(200).json({
//             success: true,
//             message: "Trip updated successfully",
//             data: updatedTrip
//         });
//     } catch (error) {
//         return res.status(500).json({
//             success: false,
//             message: error.message
//         });
//     }
// };

// // delete MEthod

// const deleteTrip = async (req, res) => {

//     try {
//         const { id } = req.params;                     // Get ID from params
//         const deletedTrip = await Trip.findByIdAndDelete(id);          // Delete trip from database

//         if (!deletedTrip) {
//             return res.status(404).json({
//                 success: false,
//                 message: "Trip not found"
//             });
//         }
//         return res.status(200).json({
//             success: true,
//             message: "Trip deleted successfully"
//         });

//     } catch (error) {
//         return res.status(500).json({
//             success: false,
//             message: error.message
//         });
//     }
// };

// module.exports = { createTripBatch, getTrip, getTripById, updateTrip, deleteTrip };