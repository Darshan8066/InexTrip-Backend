// Load environment variables from .env file
const dotenv = require("dotenv");
dotenv.config()

// Import required packages
const express = require('express');
const mongoose = require("mongoose");
const cors = require("cors");

// Import route files
const userRoutes = require("./routes/userRoutes");
const tripRoutes = require("./routes/tripRouts");
const uploadRoutes = require("./routes/uploadRoutes");
const paymentRouts = require("./routes/paymentRouts");
const historyRoutes = require("./routes/historyRoutes");
const messageRoutes = require("./routes/messageRoutes");
const reviewRoutes = require("./routes/reviewRoutes")
const authRoutes = require("./routes/authRoutes")


// Create Express application
const app = express()

// Get port number from .env
const port = process.env.PORT;

// MIDDLEWARE SECTION

// Enable CORS (Cross-Origin Resource Sharing), Allows frontend (React) to call backend API
app.use(cors({
    origin: "*",
    credentials: true
}));
app.use(express.json());                                   // Parse incoming JSON requests
app.use(express.urlencoded({ extended: true }));          // Parse URL-encoded data (form submissions)

// ROUTES SECTION
app.use('/user', userRoutes)
app.use('/trip', tripRoutes)
app.use('/payments', paymentRouts)
app.use('/upload', uploadRoutes)
app.use('/history', historyRoutes)
app.use('/messages', messageRoutes)
app.use('/review', reviewRoutes)
app.use('/api/auth', authRoutes)



// DATABASE CONNECTION
mongoose.connect(process.env.MONGO_URL)              // Connect to MongoDB using MONGO_URL from .env
    .then(() => console.log("MongoDb connected"))
    .catch((err) => console.error("MongoDb Error", err))

// START SERVER
app.listen(port, "0.0.0.0", () => {                                      // Start server on given port
    console.log(`running server on http://localhost:${port}`);
});