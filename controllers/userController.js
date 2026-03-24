const jwt = require("jsonwebtoken");
const User = require("../models/user");
const bcrypt = require("bcrypt");
const Trip = require("../models/trip");
const Payment = require("../models/payment");


// REGISTER USER  (POST METHOD)
const registerUser = async (req, res) => {

    try {
        const { fullname, email, mobile, password, } = req.body;     // Destructure user data from request body

        let user = await User.findOne({ email });                   // Check if user already exists with same email
        if (user) return res.status(400).json({ message: "Identity Already Exists" });

        const salt = await bcrypt.genSalt(10);                      // Generate salt (for stronger password hashing)
        const hashedPassword = await bcrypt.hash(password, salt);   // Hash the password using bcrypt

        user = new User({            // Create new user object
            fullname,
            email,
            mobile,
            password: hashedPassword,

        });

        // Generate JWT token
        // const token = jwt.sign({ id: user._id, email: user.email },
        //     "securecode",       // Secret key 
        //     { expiresIn: "1d" })    // Token valid for 1 day


        const token = jwt.sign({
            id: user._id, email: user.email, role: user.role
        },
            process.env.JWT_SECRET,
            { expiresIn: "1d" })
        await user.save();          // Save user in database
        res
            .status(201)
            .json({ success: true, token, user: user, message: "registered Successfully" });

    }
    catch (error) {
        res
            .status(400)
            .json({ message: error.message });

    }
}

// LOGIN USER  (POST METHOD)

const loginUser = async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email })
    if (!user) return res.status(400).json({ message: "Invalid Credentials" });

    const isMatch = await bcrypt.compare(password, user.password)    // Compare entered password with hashed password
    if (!isMatch) return res.status(400).json({ message: "Invalid Password" })

    // Generate JWT token with role also included
    const token = jwt.sign({
        id: user._id, email: user.email, role: user.role
    },
        process.env.JWT_SECRET,
        { expiresIn: "1d" })

    const userData = user.toObject();     // Convert mongoose object to normal object
    delete userData.password;        // Remove password before sending response

    res.status(201).json({ token, user: userData });
}

const toggleFavourite = async (req, res) => {
    try {
        // console.log("toggleFavourite");
        const id = req.user.id;
        const { tripId } = req.body;
        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const alreadyFavourite = user.favourites.includes(tripId);

        if (alreadyFavourite) {
            user.favourites = user.favourites.filter(
                id => id.toString() !== tripId
            );
            console.log("alreadyFavourite : ", user.favourites);
        } else {

            user.favourites.push(tripId);
        }

        await user.save();
        res.status(200).json(user);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Get MEthod


const getUser = async (req, res) => {
    try {
        const user = await User.find().select("-password")   // Fetch all users but exclude password field
        res.status(200).json({
            user, count: user.length,
        });
    } catch (error) {
        res
            .status(400)
            .json({ message: error.message });

    }
}

// Get UserById Method

const getUserById = async (req, res) => {
    try {
        const id = req.user.id;
        const user = await User.findById(id).select("-password");     // Find user by ID and exclude password
        if (!user) {
            return res.status(400).json({ message: "user not Found" })
        }
        res.status(200).json({ user: user, message: "user is Found" })

    }
    catch (error) {
        res.status(500).json({ message: error.message })
    }
}


// Update MEthod


const updatedUser = async (req, res) => {

    try {
        const id = req.user.id;      // Get user ID from JWT middleware (authenticated user)
        const { fullname, email, mobile, password, profilePhoto } = req.body;
        const user = await User.findById(id);
        if (!user) {
            return res.status(400).json({ message: "User not Found" });
        }

        // Update fields if provided
        if (fullname) user.fullname = fullname;
        if (email) user.email = email;
        if (mobile) user.mobile = mobile;
        if (password) user.password = password;
        if (profilePhoto) user.profilePhoto = profilePhoto

        // If password is updated, hash it again
        if (password) {
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(password, salt);
        }

        await user.save();      // Save updated user

        // Remove password before sending response
        const updatedUser = user.toObject();
        delete updatedUser.password;

        res.status(200).json({
            success: true,
            message: "user updated Successfully",
            user: updatedUser,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    };
}


// Delete MEthod



const getAdminStats = async (req, res) => {
    try {
        // 🔹 Total Users
        const totalUsers = await User.countDocuments();

        // 🔹 Total Trips
        const totalTrips = await Trip.countDocuments();

        // 🔹 Total Revenue
        const payments = await Payment.find();
        const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);

        const monthlyData = await Payment.aggregate([
            {
                $group: {
                    _id: { $month: "$createdAt" },
                    revenue: { $sum: "$amount" }
                }
            },
            {
                $sort: { _id: 1 }
            }
        ]);

        // 🔥 Month names array
        const monthNames = [
            "", "Jan", "Feb", "Mar", "Apr", "May", "Jun",
            "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
        ];

        // 🔥 Convert to required format
        const monthlyRevenue = monthlyData.map(item => ({
            name: monthNames[item._id],
            revenue: item.revenue
        }));


        res.status(200).json({
            success: true,
            totalUsers,
            totalTrips,
            totalRevenue,
            monthlyRevenue,
            message: "Admin stats fetched successfully"
        });


    } catch (error) {
        res
            .status(400)
            .json({ message: error.message });

    }
}

const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;

        const user = await User.findById(id)
        if (!user) {
            return res.status(400).json({ message: "User not Found" });
        }
        await User.findByIdAndDelete(id);
        res.status(200).json({
            success: true,
            message: "User deleted Successfully"
        })

    } catch (error) {
        res.status(500).json({ message: error.message });
    };
}
module.exports = { registerUser, loginUser, toggleFavourite, getUser, getAdminStats, updatedUser, deleteUser, getUserById }
