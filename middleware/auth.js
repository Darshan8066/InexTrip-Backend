
const jwt = require('jsonwebtoken');

if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is missing in environment variables");
}

const JWT_SECRET = process.env.JWT_SECRET;

// ================= VERIFY TOKEN =================

const verifyToken = (req, res, next) => {
    const authHeader = req.headers.authorization;

    // Check Authorization header
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
            message: "Access denied. No valid token provided."
        });
    }

    const token = authHeader.split(" ")[1];

    if (!token) {    // If no token is provided
        return res.status(401).json({
            message: "No token provided. Access Denied."
        });
    }
    try {
        const decoded = jwt.verify(token, JWT_SECRET);

        // Attach user data (id, email, role)
        req.user = decoded;

        next();
    } catch (err) {
        // Better error handling (optional improvement)
        if (err.name === "TokenExpiredError") {
            return res.status(401).json({
                message: "Token expired. Please login again."
            });
        }

        return res.status(401).json({
            message: "Unauthorized: Invalid token."
        });
    }
};

// ================= ADMIN AUTH =================

// const isAdmin = (req, res, next) => {
//     console.log("user", req.user);
//     console.log("Trip", req.body.tripType);

//     if (req.user?.role === 'ADMIN' && req.body.tripType === 'JOIN') {
//         next();
//     } else if (req.user?.role === 'USER' && req.body.tripType === 'AI') {
//         next();
//     } else {
//         return res.status(403).json({
//             message: "Security Protocol Violation: Admin clearance required."
//         });
//     }
// };
const Trip = require("../models/trip");

const isAdmin = async (req, res, next) => {
    try {
        if (req.user?.role === "ADMIN") {
            return next(); // ✅ admin can do everything
        }

        return res.status(403).json({
            message: "Admin access required"
        });

    } catch (err) {
        return res.status(500).json({ message: "Server error" });
    }
};
// ================= VALIDATION =================

const validateTripData = (req, res, next) => {
    const { from, to, price, startDate, endDate } = req.body;

    // Required fields check
    if (!from || !to || !price || !startDate || !endDate) {
        return res.status(400).json({
            message: "Incomplete Payload: All fields are mandatory."
        });
    }

    // Date validation
    if (new Date(startDate) > new Date(endDate)) {
        return res.status(400).json({
            message: "Logic Error: Conclude date cannot precede commence date."
        });
    }

    next();
};

module.exports = {
    verifyToken,
    isAdmin,
    validateTripData
};