// backend/config/cloudinary.js
const cloudinary = require('cloudinary').v2;
require('dotenv').config();

exports.cloudinaryConnect = () => {
    try {
        if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
            console.error("FATAL ERROR: Cloudinary credentials are not defined in .env file.");
            console.error("Required: CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET");
            process.exit(1);
        }
        cloudinary.config({
            cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
            api_key: process.env.CLOUDINARY_API_KEY,
            api_secret: process.env.CLOUDINARY_API_SECRET,
        });
        console.log("Successfully connected to Cloudinary.");
    } catch (error) {
        console.error("Cloudinary connection error:", error);
        process.exit(1);
    }
};