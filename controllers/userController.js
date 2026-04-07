const jwt = require("jsonwebtoken");
const User = require("../models/user");
const bcrypt = require("bcrypt");
const Trip = require("../models/trip");
const Payment = require("../models/payment");
const Review = require("../models/review");
const History = require("../models/history");

// ─── REGISTER USER (POST) ────────────────────────────────────────────────────
const registerUser = async (req, res) => {
    try {
        const { fullname, email, mobile, password } = req.body;

        // Input validation
        if (!fullname || !email || !mobile || !password) {
            return res.status(400).json({ message: "All fields are required" });
        }

        // const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        // if (!emailRegex.test(email)) {
        //     return res.status(400).json({ message: "Invalid email format" });
        // }

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



// ─── LOGIN USER (POST) ───────────────────────────────────────────────────────
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

// ─── TOGGLE FAVOURITE (PUT) ──────────────────────────────────────────────────
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

// ─── GET ALL USERS (GET) — Admin only ────────────────────────────────────────
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

// ─── GET USER BY ID (GET) ────────────────────────────────────────────────────
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

const getUserProfileById = async (req, res) => {
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


const mongoose = require("mongoose");


const getAuditUser = async (req, res) => {
    try {
        const { id } = req.params; // 🔥 important (NOT req.user.id)

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: "Invalid user ID" });
        }

        // 1. Get user
        const user = await User.findById(id).select("-password");

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // 2. Get activity logs (example)
        // 👉 Replace "Activity" with your actual model
        // const trips = await Trip.find({ createdBy: id }).sort({ createdAt: -1 });
        const reviews = await Review.find({ userId: id }).countDocuments();
        const history = await History.find({ userId: id }).populate({ path: "tripId", select: "to" }).sort({ createdAt: -1 });


        // 4. Final response
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


// ─── UPDATE USER (PUT) ───────────────────────────────────────────────────────
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


// ─── GET ADMIN STATS (GET) ───────────────────────────────────────────────────
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

// ─── DELETE USER ACCOUNT (DELETE) ────────────────────────────────────────────
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
    getUserProfileById,
    loginUser,
    toggleFavourite,
    getUser,
    getAdminStats,
    updatedUser,
    getUserById,
    deleteUserAccount,
};




// const jwt = require("jsonwebtoken");
// const User = require("../models/user");
// const bcrypt = require("bcrypt");
// const Trip = require("../models/trip");
// const Payment = require("../models/payment");
// const Review = require("../models/review");


// // REGISTER USER  (POST METHOD)
// const registerUser = async (req, res) => {

//     try {
//         const { fullname, email, mobile, password, } = req.body;     // Destructure user data from request body

//         let user = await User.findOne({ email });                   // Check if user already exists with same email
//         if (user) return res.status(400).json({ message: "Identity Already Exists" });

//         const salt = await bcrypt.genSalt(10);                      // Generate salt (for stronger password hashing)
//         const hashedPassword = await bcrypt.hash(password, salt);   // Hash the password using bcrypt

//         user = new User({            // Create new user object
//             fullname,
//             email,
//             mobile,
//             password: hashedPassword,

//         });

//         // Generate JWT token
//         // const token = jwt.sign({ id: user._id, email: user.email },
//         //     "securecode",       // Secret key
//         //     { expiresIn: "1d" })    // Token valid for 1 day


//         const token = jwt.sign({
//             id: user._id, email: user.email, role: user.role
//         },
//             process.env.JWT_SECRET,
//             { expiresIn: "1d" })
//         await user.save();          // Save user in database
//         res
//             .status(201)
//             .json({ success: true, token, user: user, message: "registered Successfully" });

//     }
//     catch (error) {
//         res
//             .status(400)
//             .json({ message: error.message });

//     }
// }

// // LOGIN USER  (POST METHOD)

// const loginUser = async (req, res) => {
//     const { email, password } = req.body;
//     const user = await User.findOne({ email })
//     if (!user) return res.status(400).json({ message: "Invalid Credentials" });

//     const isMatch = await bcrypt.compare(password, user.password)    // Compare entered password with hashed password
//     if (!isMatch) return res.status(400).json({ message: "Invalid Password" })

//     // Generate JWT token with role also included
//     const token = jwt.sign({
//         id: user._id, email: user.email, role: user.role
//     },
//         process.env.JWT_SECRET,
//         { expiresIn: "1d" })

//     const userData = user.toObject();     // Convert mongoose object to normal object
//     delete userData.password;        // Remove password before sending response

//     res.status(201).json({ token, user: userData });
// }

// const toggleFavourite = async (req, res) => {
//     try {
//         // console.log("toggleFavourite");
//         const id = req.user.id;
//         const { tripId } = req.body;
//         const user = await User.findById(id);
//         if (!user) {
//             return res.status(404).json({ message: "User not found" });
//         }

//         const alreadyFavourite = user.favourites.includes(tripId);

//         if (alreadyFavourite) {
//             user.favourites = user.favourites.filter(
//                 id => id.toString() !== tripId
//             );
//             console.log("alreadyFavourite : ", user.favourites);
//         } else {

//             user.favourites.push(tripId);
//         }

//         await user.save();
//         res.status(200).json(user);
//     } catch (error) {
//         res.status(400).json({ message: error.message });
//     }
// };

// // Get MEthod



// const getUser = async (req, res) => {
//     try {
//         const user = await User.find().select("-password")   // Fetch all users but exclude password field
//         res.status(200).json({
//             user, count: user.length,
//         });
//     } catch (error) {
//         res
//             .status(400)
//             .json({ message: error.message });

//     }
// }

// const getUser = async (req, res) => {
//     try {
//         const user = await User.find().select("-password")   // Fetch all users but exclude password field
//         res.status(200).json({
//             user, count: user.length,
//         });
//     } catch (error) {
//         res
//             .status(400)
//             .json({ message: error.message });

//     }
// }

// // Get UserById Method

// const getUserById = async (req, res) => {
//     try {
//         const id = req.user.id;
//         const user = await User.findById(id).select("-password");     // Find user by ID and exclude password
//         if (!user) {
//             return res.status(400).json({ message: "user not Found" })
//         }
//         res.status(200).json({ user: user, message: "user is Found" })

//     }
//     catch (error) {
//         res.status(500).json({ message: error.message })
//     }
// }


// // Update MEthod


// const updatedUser = async (req, res) => {

//     try {
//         const id = req.user.id;      // Get user ID from JWT middleware (authenticated user)
//         const { fullname, email, mobile, password, profilePhoto } = req.body;
//         const user = await User.findById(id);
//         if (!user) {
//             return res.status(400).json({ message: "User not Found" });
//         }

//         // Update fields if provided
//         if (fullname) user.fullname = fullname;
//         if (email) user.email = email;
//         if (mobile) user.mobile = mobile;
//         if (password) user.password = password;
//         if (profilePhoto) user.profilePhoto = profilePhoto

//         // If password is updated, hash it again
//         if (password) {
//             const salt = await bcrypt.genSalt(10);
//             user.password = await bcrypt.hash(password, salt);
//         }

//         await user.save();      // Save updated user

//         // Remove password before sending response
//         const updatedUser = user.toObject();
//         delete updatedUser.password;

//         res.status(200).json({
//             success: true,
//             message: "user updated Successfully",
//             user: updatedUser,
//         });
//     } catch (error) {
//         res.status(500).json({ message: error.message });
//     };
// }


// // Delete MEthod



// const getAdminStats = async (req, res) => {
//     try {
//         // 🔹 Total Users
//         const totalUsers = await User.countDocuments();

//         // 🔹 Total Trips
//         const totalTrips = await Trip.countDocuments();

//         // 🔹 Total Revenue
//         const payments = await Payment.find();
//         const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);

//         const monthlyData = await Payment.aggregate([
//             {
//                 $group: {
//                     _id: { $month: "$createdAt" },
//                     revenue: { $sum: "$amount" }
//                 }
//             },
//             {
//                 $sort: { _id: 1 }
//             }
//         ]);

//         // 🔥 Month names array
//         const monthNames = [
//             "", "Jan", "Feb", "Mar", "Apr", "May", "Jun",
//             "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
//         ];

//         // 🔥 Convert to required format
//         const monthlyRevenue = monthlyData.map(item => ({
//             name: monthNames[item._id],
//             revenue: item.revenue
//         }));


//         res.status(200).json({
//             success: true,
//             totalUsers,
//             totalTrips,
//             totalRevenue,
//             monthlyRevenue,
//             message: "Admin stats fetched successfully"
//         });


//     } catch (error) {
//         res
//             .status(400)
//             .json({ message: error.message });

//     }
// }

// // const deleteUser = async (req, res) => {
// //     try {
// //         const { id } = req.params;

// //         const user = await User.findById(id)
// //         if (!user) {
// //             return res.status(400).json({ message: "User not Found" });
// //         }
// //         await User.findByIdAndDelete(id);
// //         res.status(200).json({
// //             success: true,
// //             message: "User deleted Successfully"
// //         })

// //     } catch (error) {
// //         res.status(500).json({ message: error.message });
// //     };
// // }

// const deleteUserAccount = async (req, res) => {

//     const userId = req.params.id;
//     try {
//         const user = await User.findById(userId);
//         if (!user) throw new Error("User not found");

//         // 1. Reviews — userId ref remove
//         await Review.updateMany(
//             { userId },
//             { $set: { fullname: user.fullname, profilePhoto: user.profilePhoto } }
//         );

//         // 2. Trips — store creator info before removing ref
//         await Trip.updateMany(
//             { createdBy: userId },
//             {
//                 $set: {
//                     fullname: user.fullname,
//                     profilePhoto: user.profilePhoto
//                 }
//             }
//         );

//         // 3. Payment — just flag it
//         await Payment.updateMany(
//             { userId },
//             { $set: { fullname: user.fullname, profilePhoto: user.profilePhoto } }
//         );

//         // 4. Finally delete the user
//         await User.findByIdAndDelete(userId);
//         res.status(200).json({
//             success: true,
//             message: "User deleted Successfully"
//         })

//     } catch (error) {
//         res.status(500).json({ message: error.message });
//     };
// };

// // ─── UPDATE USER (PUT) ───────────────────────────────────────────────────────
// const updatedUser = async (req, res) => {
//     try {
//         const id = req.user.id;
//         const { fullname, email, mobile, password, profilePhoto } = req.body;

//         const user = await User.findById(id);
//         if (!user) {
//             return res.status(404).json({ message: "User not found" });
//         }

//         // Update only provided fields
//         if (fullname) user.fullname = fullname;
//         if (email) user.email = email;
//         if (mobile) user.mobile = mobile;
//         if (profilePhoto) user.profilePhoto = profilePhoto;


//         // 🔒 Password update logic (ONLY if password is provided)
//         if (password) {
//             // check current password
//             if (!currentPassword) {
//                 return res.status(400).json({ message: "Current password is required" });
//             }
//             const isMatch = await bcrypt.compare(currentPassword, user.password);
//             if (!isMatch) {
//                 return res.status(400).json({ message: "Current password is incorrect" });
//             }

//             // FIX: removed the plain-text password assignment that happened before hashing
//             if (password) {
//                 if (password.length < 6) {
//                     return res
//                         .status(400)
//                         .json({ message: "Password must be at least 6 characters" });
//                 }
//                 const salt = await bcrypt.genSalt(10);
//                 user.password = await bcrypt.hash(password, salt);
//             }

//             await user.save();

//             const updatedUserData = user.toObject();
//             delete updatedUserData.password;

//             return res.status(200).json({
//                 success: true,
//                 message: "User updated successfully",
//                 user: updatedUserData,
//             });
//         } catch (error) {
//             console.error("updatedUser error:", error);
//             return res.status(500).json({ message: "Server error. Please try again." });
//         }
//     };

// // ─── UPDATE USER (PUT) ───────────────────────────────────────────────────────
// const updatedUser = async (req, res) => {
//     try {
//         const id = req.user.id;
//         const { fullname, email, mobile, password, profilePhoto } = req.body;

//         const user = await User.findById(id);
//         if (!user) {
//             return res.status(404).json({ message: "User not found" });
//         }

//         // Update only provided fields
//         if (fullname) user.fullname = fullname;
//         if (email) user.email = email;
//         if (mobile) user.mobile = mobile;
//         if (profilePhoto) user.profilePhoto = profilePhoto;


//         // 🔒 Password update logic (ONLY if password is provided)
//         if (password) {
//             // check current password
//             if (!currentPassword) {
//                 return res.status(400).json({ message: "Current password is required" });
//             }
//             const isMatch = await bcrypt.compare(currentPassword, user.password);
//             if (!isMatch) {
//                 return res.status(400).json({ message: "Current password is incorrect" });
//             }

//             // FIX: removed the plain-text password assignment that happened before hashing
//             if (password) {
//                 if (password.length < 6) {
//                     return res
//                         .status(400)
//                         .json({ message: "Password must be at least 6 characters" });
//                 }
//                 const salt = await bcrypt.genSalt(10);
//                 user.password = await bcrypt.hash(password, salt);
//             }

//             await user.save();

//             const updatedUserData = user.toObject();
//             delete updatedUserData.password;

//             return res.status(200).json({
//                 success: true,
//                 message: "User updated successfully",
//                 user: updatedUserData,
//             });
//         } catch (error) {
//             console.error("updatedUser error:", error);
//             return res.status(500).json({ message: "Server error. Please try again." });
//         }
//     };


// const registerUser = async (req, res) => {

//     try {
//         const { fullname, email, mobile, password, } = req.body;     // Destructure user data from request body

//         let user = await User.findOne({ email });                   // Check if user already exists with same email
//         if (user) return res.status(400).json({ message: "Identity Already Exists" });

//         const salt = await bcrypt.genSalt(10);                      // Generate salt (for stronger password hashing)
//         const hashedPassword = await bcrypt.hash(password, salt);   // Hash the password using bcrypt

//         user = new User({            // Create new user object
//             fullname,
//             email,
//             mobile,
//             password: hashedPassword,

//         });

//         // Generate JWT token
//         // const token = jwt.sign({ id: user._id, email: user.email },
//         //     "securecode",       // Secret key
//         //     { expiresIn: "1d" })    // Token valid for 1 day


//         const token = jwt.sign({
//             id: user._id, email: user.email, role: user.role
//         },
//             process.env.JWT_SECRET,
//             { expiresIn: "1d" })
//         await user.save();          // Save user in database
//         res
//             .status(201)
//             .json({ success: true, token, user: user, message: "registered Successfully" });

//     }
//     catch (error) {
//         res
//             .status(400)
//             .json({ message: error.message });

//     }
// }

// module.exports = { registerUser, loginUser, toggleFavourite, getUser, getAdminStats, updatedUser, getUserById, deleteUserAccount }



