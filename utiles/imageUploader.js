// backend/utils/imageUploader.js
const cloudinary = require('cloudinary').v2;

// Configure Cloudinary - ideally called once at app start,
// but if not, ensure it's configured before use.
// This assumes cloudinaryConnect() in server.js handles this.
// cloudinary.config({
//   cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
//   api_key: process.env.CLOUDINARY_API_KEY,
//   api_secret: process.env.CLOUDINARY_API_SECRET,
//   secure: true,
// });


/**
 * Uploads an image file to Cloudinary.
 * @param {object} file - The file object (from express-fileupload).
 * @param {string} folder - The Cloudinary folder to upload to.
 * @param {number} [quality] - Optional quality setting (1-100).
 * @param {number} [height] - Optional height to resize to.
 * @returns {Promise<object>} - Promise resolving to Cloudinary upload response.
 */
exports.uploadImageToCloudinary = async (file, folder, quality, height) => {
    const options = { folder, resource_type: 'auto' }; // auto detects if it's image, video, raw etc.
    if (quality) {
        options.quality = quality;
    }
    if (height) {
        options.height = height;
        options.crop = 'scale'; // Or other crop modes like 'fill', 'limit'
    }

    // Check if tempFilePath exists, otherwise use buffer if available (depends on fileUpload setup)
    const filePath = file.tempFilePath || file.path; // path can be used if not using temp files
    if (!filePath) {
        throw new Error("No temporary file path found for upload.");
    }

    try {
        console.log(`Uploading to Cloudinary: ${filePath} into folder ${folder}`);
        const result = await cloudinary.uploader.upload(filePath, options);
        console.log("Cloudinary upload successful:", result.public_id);
        return result;
    } catch (error) {
        console.error("Cloudinary Upload Error:", error.message);
        // It's good to check the error structure from Cloudinary for more details
        // e.g., error.http_code, error.error (Cloudinary specific error object)
        throw new Error(`Cloudinary upload failed: ${error.message}`);
    }
};

/**
 * Deletes an image from Cloudinary.
 * @param {string} publicId - The public_id of the image to delete.
 * @returns {Promise<object>} - Promise resolving to Cloudinary deletion response.
 */
exports.deleteImageFromCloudinary = async (publicId) => {
    if (!publicId) {
        console.warn("No public_id provided for deletion.");
        return { result: 'ok', message: 'No public_id provided.' }; // Or throw error if it's critical
    }
    try {
        console.log(`Deleting from Cloudinary: ${publicId}`);
        // For images, resource_type is 'image'. If you upload other types, adjust accordingly.
        const result = await cloudinary.uploader.destroy(publicId, { resource_type: 'image' }); 
        console.log("Cloudinary deletion result:", result);
        if (result.result !== 'ok' && result.result !== 'not found') {
             // 'not found' is also a successful deletion from our perspective if file was already gone
            console.warn(`Cloudinary deletion warning for ${publicId}: ${result.result}`);
        }
        return result;
    } catch (error) {
        console.error("Cloudinary Deletion Error:", error.message);
        throw new Error(`Cloudinary deletion failed for ${publicId}: ${error.message}`);
    }
};