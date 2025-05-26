// backend/models/Job.js
const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, "Job title is required"],
        trim: true,
    },
    company: {
        type: String,
        required: [true, "Company name is required"],
        trim: true,
    },
    location: {
        type: String,
        required: [true, "Location is required"],
        trim: true,
    },
    type: { // Job Type e.g., Full-time, Part-time
        type: String,
        required: [true, "Job type is required"],
        trim: true,
    },
    salary: {
        type: String,
        required: [true, "Salary information is required"],
        trim: true,
    },
    category: {
        type: String,
        required: [true, "Job category is required"],
        trim: true,
    },
    description: {
        type: String,
        required: [true, "Job description is required"],
        trim: true,
    },
    skills: {
        type: [String], // Array of strings
        default: [],
    },
    logo: { // URL to the company logo on Cloudinary
        public_id: String, // Cloudinary public_id
        url: String,       // Cloudinary secure_url
    },
    postedDate: { // Changed from 'posted' to be a Date type
        type: Date,
        default: Date.now,
    },
    rating: { // Consider if this is user-generated or admin-set
        type: Number,
        default: 0, // Or a default rating like 3.5
        min: 0,
        max: 5,
    },
    applicants: { // This might be a count, or an array of User IDs in a more complex app
        type: Number,
        default: 0,
    },
    // You might want to add a field for the admin/user who posted the job
    // postedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true }); // Adds createdAt and updatedAt timestamps

module.exports = mongoose.model('Job', jobSchema);