
const cloudinary = require("cloudinary").v2;        // Import cloudinary package and use version 2 of API
const { CloudinaryStorage } = require("multer-storage-cloudinary");          // Import CloudinaryStorage from multer-storage-cloudinary This helps to directly upload files to Cloudinary

// Ensure environment variables exist
if (!process.env.CLOUD_NAME ||
  !process.env.CLOUD_API_KEY ||
  !process.env.CLOUD_API_SECRET) {
  throw new Error("Cloudinary environment variables are missing");
}

// Configure Cloudinary with your account credentials These values are stored inside .env file for security
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
});


const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {


    return {
      folder: "tripplanner",
      resource_type: "image",
      allowed_formats: ["jpg", "png", "jpeg", "webp", "PNG"],
      public_id: `user_${req.user.id}`,
      overwrite: true,

    };
  },
});
module.exports = { cloudinary, storage }; 