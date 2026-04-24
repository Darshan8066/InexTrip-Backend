const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const User = require("../models/user");
const bcrypt = require("bcrypt");
const Trip = require("../models/trip");
const Payment = require("../models/payment");
const Review = require("../models/review");
const History = require("../models/history");

// ─────────────────────── POST────────────────────────────────

const registerUser = async (req, res) => {
    try {
        const { fullname, email, mobile, password } = req.body;

        // Input validation
        if (!fullname || !email || !mobile || !password) {
            return res.status(400).json({ message: "All fields are required" });
        }

        if (password.length < 6) {
            return res
                .status(400)
                .json({ message: "Password must be at least 6 characters" });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(409).json({ message: "User already exists with this email" });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create and save user first — so _id is guaranteed
        const user = new User({ fullname, email, mobile, password: hashedPassword });
        await user.save(); // FIX: save before generating token so _id is finalized

        // Generate JWT token after save
        const token = jwt.sign(
            { id: user._id, email: user.email, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: "24h" }
        );

        const userData = user.toObject();
        delete userData.password;

        return res.status(201).json({
            success: true,
            token,
            user: userData,
            message: "Registered successfully",
        });
    } catch (error) {
        console.error("registerUser error:", error);
        return res.status(500).json({ message: "Server error. Please try again." });
    }
};

const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Input validation
        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required" });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: "Invalid credentials" }); // 401 Unauthorized
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: "Invalid credentials" }); // Don't hint which field is wrong
        }

        // Generate JWT token
        const token = jwt.sign(
            { id: user._id, email: user.email, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: "24h" }
        );

        const userData = user.toObject();
        delete userData.password;

        return res.status(200).json({ // FIX: 200 OK (not 201 Created)
            success: true,
            token,
            user: userData,
            message: "Logged in successfully",
        });
    } catch (error) {
        console.error("loginUser error:", error); // FIX: was empty catch — errors were silently lost
        return res.status(500).json({ message: "Server error. Please try again." });
    }
};

// ──────────────── GET Admin only ───────────────────────────

const getUser = async (req, res) => {
    try {
        // Basic pagination to avoid crashing on large datasets
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        const users = await User.find().select("-password").skip(skip).limit(limit);
        const total = await User.countDocuments();

        return res.status(200).json({
            success: true,
            users,
            count: users.length,
            total,
            page,
            totalPages: Math.ceil(total / limit),
        });
    } catch (error) {
        console.error("getUser error:", error);
        return res.status(500).json({ message: "Server error. Please try again." });
    }
};

const getAdminStats = async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const totalTrips = await Trip.countDocuments();

        const payments = await Payment.find();
        const totalRevenue = payments.reduce((sum, p) => sum + (p.amount || 0), 0);

        const monthlyData = await Payment.aggregate([
            {
                $group: {
                    _id: { $month: "$createdAt" },
                    revenue: { $sum: "$amount" },
                },
            },
            { $sort: { _id: 1 } },
        ]);

        const monthNames = [
            "", "Jan", "Feb", "Mar", "Apr", "May", "Jun",
            "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
        ];

        const monthlyRevenue = monthlyData.map((item) => ({
            name: monthNames[item._id],
            revenue: item.revenue,
        }));

        return res.status(200).json({
            success: true,
            totalUsers,
            totalTrips,
            totalRevenue,
            monthlyRevenue,
            message: "Admin stats fetched successfully",
        });
    } catch (error) {
        console.error("getAdminStats error:", error);
        return res.status(500).json({ message: "Server error. Please try again." });
    }
};


// ───────────────────── GET user ──────────────────────────────────

const getUserById = async (req, res) => {
    try {
        const id = req.user.id;
        const user = await User.findById(id).select("-password");

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        return res.status(200).json({ success: true, user });
    } catch (error) {
        console.error("getUserById error:", error);
        return res.status(500).json({ message: "Server error. Please try again." });
    }
};

const getAuditUser = async (req, res) => {
    try {
        const { id } = req.params; // 🔥 important (NOT req.user.id)

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: "Invalid user ID" });
        }

        // Get user
        const user = await User.findById(id).select("-password");

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Replace "Activity" with your actual model
        const reviews = await Review.find({ userId: id }).countDocuments();
        const history = await History.find({ userId: id }).populate({ path: "tripId", select: "to" }).sort({ createdAt: -1 });


        // Final response
        return res.status(200).json({
            success: true,
            nodeMetadata: user,
            history,
            reviews
        });

    } catch (error) {
        console.error("getAuditUser error:", error);
        return res.status(500).json({ message: error.message });
    }
};

// ─────────────────────── PUT ───────────────────────────────────

const updatedUser = async (req, res) => {
    try {
        const id = req.user.id;

        // ✅ added currentPassword (IMPORTANT)
        const { fullname, email, mobile, password, currentPassword, profilePhoto } = req.body;

        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Update only provided fields
        if (fullname) user.fullname = fullname;
        if (email) user.email = email;
        if (mobile) user.mobile = mobile;
        if (profilePhoto) user.profilePhoto = profilePhoto;
        console.log("mobile :", mobile)

        // 🔒 Password update logic (ONLY if password is provided)
        if (password) {

            // check current password
            if (!currentPassword) {
                return res.status(400).json({ message: "Current password is required" });
            }

            const isMatch = await bcrypt.compare(currentPassword, user.password);
            if (!isMatch) {
                return res.status(400).json({ message: "Current password is incorrect" });

            }

            const isNew = await bcrypt.compare(password, user.password);
            if (isNew) {
                return res.status(400).json({ message: "Your new password cannot be same as old password." });
            }

            // FIX: removed the plain-text password assignment that happened before hashing
            if (password) {
                if (password.length < 6) {
                    return res
                        .status(400)
                        .json({ message: "Password must be at least 6 characters" });
                }

                const salt = await bcrypt.genSalt(10);
                user.password = await bcrypt.hash(password, salt);
            }
        }

        await user.save();

        const updatedUserData = user.toObject();
        delete updatedUserData.password;

        return res.status(200).json({
            success: true,
            message: "User updated successfully",
            user: updatedUserData,
        });

    } catch (error) {
        console.error("updatedUser error:", error);
        return res.status(500).json({ message: "Server error. Please try again." });
    }
};

const toggleFavourite = async (req, res) => {
    try {
        const id = req.user.id;
        const { tripId } = req.body;

        if (!tripId) {
            return res.status(400).json({ message: "tripId is required" });
        }

        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const alreadyFavourite = user.favourites.includes(tripId);

        if (alreadyFavourite) {
            user.favourites = user.favourites.filter(
                (favId) => favId.toString() !== tripId
            );
        } else {
            user.favourites.push(tripId);
        }

        await user.save();

        const userData = user.toObject();
        delete userData.password;

        return res.status(200).json({
            success: true,
            user: userData,
            message: alreadyFavourite ? "Removed from favourites" : "Added to favourites",
        });
    } catch (error) {
        console.error("toggleFavourite error:", error);
        return res.status(500).json({ message: "Server error. Please try again." });
    }
};


// ─────────────────── DELETE ────────────────────────────

const deleteUserAccount = async (req, res) => {
    try {
        const userId = req.params.id;
        console.log("deleteUserAccount userId :", userId);


        // FIX: Authorization check — only the user themselves or an admin can delete
        if (req.user.id !== userId && req.user.role !== "ADMIN") {
            return res.status(403).json({ message: "Unauthorized to delete this account" });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Preserve user info in related documents before deletion
        await Review.updateMany(
            { userId },
            { $set: { fullname: user.fullname, profilePhoto: user.profilePhoto } }
        );

        await Trip.updateMany(
            { createdBy: userId },
            { $set: { fullname: user.fullname, profilePhoto: user.profilePhoto } }
        );

        await Payment.updateMany(
            { userId },
            { $set: { fullname: user.fullname, profilePhoto: user.profilePhoto } }
        );

        await User.findByIdAndDelete(userId);

        return res.status(200).json({
            success: true,
            message: "User deleted successfully",
        });
    } catch (error) {
        console.error("deleteUserAccount error:", error);
        return res.status(500).json({ message: "Server error. Please try again." });
    }
};

module.exports = {
    registerUser,
    getAuditUser,
    loginUser,
    toggleFavourite,
    getUser,
    getAdminStats,
    updatedUser,
    getUserById,
    deleteUserAccount,
};