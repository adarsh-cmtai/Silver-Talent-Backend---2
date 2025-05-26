// backend/utils/imageUploader.js
const cloudinary = require('cloudinary').v2;

exports.uploadImageToCloudinary = async (file, folder, height, quality) => {
    const options = { folder };
    if (height) {
        options.height = height;
    }
    if (quality) {
        options.quality = quality;
    }
    options.resource_type = "auto"; // Automatically detect resource type (image, video, etc.)

    try {
        // file.tempFilePath is from express-fileupload
        return await cloudinary.uploader.upload(file.tempFilePath, options);
    } catch (error) {
        console.error("Cloudinary Upload Error:", error);
        throw new Error("Failed to upload image to Cloudinary: " + error.message);
    }
};

exports.deleteImageFromCloudinary = async (public_id) => {
    try {
        // Specify resource_type if it's not 'image' (e.g., 'video', 'raw')
        // For company logos, 'image' is usually correct.
        const result = await cloudinary.uploader.destroy(public_id, { resource_type: 'image' });
        return result;
    } catch (error) {
        console.error("Cloudinary Delete Error:", error);
        throw new Error("Failed to delete image from Cloudinary: " + error.message);
    }
};