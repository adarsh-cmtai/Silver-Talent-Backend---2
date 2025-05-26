// backend/models/ContactSubmission.js
const mongoose = require('mongoose');

const contactSubmissionSchema = new mongoose.Schema({
    yourName: {
        type: String,
        required: [true, "Name is required."],
        trim: true,
    },
    yourEmail: {
        type: String,
        required: [true, "Email is required."],
        trim: true,
        lowercase: true,
        match: [/^\S+@\S+\.\S+$/, 'Please use a valid email address.'],
    },
    fullPhoneNumber: { // Includes country code
        type: String,
        required: [true, "Full phone number is required."],
        trim: true,
    },
    countryName: {
        type: String,
        trim: true,
    },
    countryCode: {
        type: String,
        trim: true,
    },
    yourMessage: {
        type: String,
        required: [true, "Message is required."],
        trim: true,
    },
    status: {
        type: String,
        enum: ['New', 'Viewed', 'Replied', 'Archived'],
        default: 'New',
    },
    adminNotes: { // Optional notes by admin
        type: String,
        trim: true,
    },
    submittedAt: {
        type: Date,
        default: Date.now,
    },
    repliedAt: {
        type: Date,
    }
});

// Index for faster querying by status and submission date
contactSubmissionSchema.index({ status: 1, submittedAt: -1 });

module.exports = mongoose.model('ContactSubmission', contactSubmissionSchema);