
const Trip = require("../models/trip");
const user = require("../models/user");

// Post Method

const createTripBatch = async (req, res) => {

    // req.files contains uploaded image data file.path contains Cloudinary image URL
    // const imageUrls = req.files?.map(file => file.path) || [];
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

// Get MEthod

const getTrip = async (req, res) => {
    try {
        const trips = await Trip.find();
       
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

// Get TripById Method

const getTripById = async (req, res) => {
    try {
        const { id } = req.params;     // Get trip ID from URL params
        const trip = await Trip.findById(id);      // Find trip by MongoDB ID
        if (!trip) {
            return res.status(404).json({ success: false, message: "Trip Not Found" });

        }
        res.status(200).json({ success: true, message: "Trip Is Found", trip });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}

// Update MEthod

const updateTrip = async (req, res) => {
    try {
        const { id } = req.params;                       // Get ID from URL
        const updatedTrip = await Trip.findByIdAndUpdate(     // Find trip by ID and update with new data
            id,
            req.body,
            {
                new: true,                             // Return updated document
                runValidators: true                     // Apply schema validation
            }
        );
        if (!updatedTrip) {
            return res.status(404).json({
                success: false,
                message: "Trip not found"
            });
        }
        return res.status(200).json({
            success: true,
            message: "Trip updated successfully",
            data: updatedTrip
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// delete MEthod

const deleteTrip = async (req, res) => {

    try {
        const { id } = req.params;                     // Get ID from params
        const deletedTrip = await Trip.findByIdAndDelete(id);          // Delete trip from database

        if (!deletedTrip) {
            return res.status(404).json({
                success: false,
                message: "Trip not found"
            });
        }
        return res.status(200).json({
            success: true,
            message: "Trip deleted successfully"
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

module.exports = { createTripBatch, getTrip, getTripById, updateTrip, deleteTrip };