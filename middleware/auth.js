// // Import jsonwebtoken package Used to verify and decode JWT tokens
// const jwt = require('jsonwebtoken');

// if (!process.env.JWT_SECRET) {
//     throw new Error("JWT_SECRET is missing in environment variables");
// }
// const JWT_SECRET = process.env.JWT_SECRET;

// //  VERIFY TOKEN MIDDLEWARE

// const verifyToken = (req, res, next) => {
//     // const token = req.headers['authorization']?.split(' ')[1];

//     const authHeader = req.headers.authorization;

//     if (!authHeader || !authHeader.startsWith("Bearer ")) {
//         return res.status(401).json({
//             message: "Access denied. No valid token provided."
//         });
//     }

//     const token = authHeader.split(" ")[1];  // Get token from Authorization header

//     if (!token) {    // If no token is provided
//         return res.status(401).json({
//             message: "No token provided. Access Denied."
//         });
//     }

//     try {
//         const decoded = jwt.verify(token, JWT_SECRET);
//         // console.log("decode:::::",decoded)     // Verify token using secret key
//         req.user = decoded;                                                        // Attach decoded data (id, email, role) to request
//         next();                                                                   // Move to next middleware or controller
//     } catch (err) {                                                              // If token is invalid or expired
//         return res.status(401).json({ message: "Unauthorized: Invalid or expired token." });
//     }
// };

// // ADMIN AUTHORIZATION MIDDLEWARE

// const isAdmin = (req, res, next) => {
//     console.log("user", req.user)
//     if (req.user && req.user.role === 'ADMIN') {       // Check if user exists and role is ADMIN
//         next();
//     } else {
//         res.status(403).json({
//             message: "Security Protocol Violation: Admin clearance required."
//         });
//     }
// };

// // TRIP DATA VALIDATION MIDDLEWARE

// const validateTripData = (req, res, next) => {
//     const { from, to, price, startDate, endDate } = req.body;
//     // Check required fields
//     if (!from || !to || !price || !startDate || !endDate) {
//         return res.status(400).json({ message: "Incomplete Payload: All fields are mandatory." });
//     }

//     if (new Date(startDate) > new Date(endDate)) {
//         return res.status(400).json({ message: "Logic Error: Conclude date cannot precede commence date." });
//     }

//     next();
// };

// module.exports = { verifyToken, isAdmin, validateTripData };





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

const isAdmin = (req, res, next) => {
    console.log("user", req.user);

    if (req.user?.role === 'ADMIN') {
        next();
    } else {
        return res.status(403).json({
            message: "Security Protocol Violation: Admin clearance required."
        });
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