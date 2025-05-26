// backend/models/Application.js
const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
    jobId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Job',
        required: true,
    },
    jobTitle: {
        type: String,
        required: true,
    },
    companyName: {
        type: String,
        required: true,
    },
    name: {
        type: String,
        required: [true, "Applicant name is required."],
        trim: true,
    },
    email: {
        type: String,
        required: [true, "Applicant email is required."],
        trim: true,
        lowercase: true,
    },
    coverLetter: {
        type: String,
        trim: true,
    },
    resume: { // Store Cloudinary details for the resume
        public_id: String,
        url: String, // Secure URL from Cloudinary
    },
    status: {
        type: String,
        enum: ['Pending', 'Viewed', 'In Progress', 'Contacted', 'Hired', 'Rejected'],
        default: 'Pending',
    },
    adminNotes: { // Optional notes by admin
        type: String,
        trim: true,
    },
    appliedDate: {
        type: Date,
        default: Date.now,
    },
}, { timestamps: true });

module.exports = mongoose.model('Application', applicationSchema);