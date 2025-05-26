// backend/models/ContactInfo.js
const mongoose = require('mongoose');

// Since there's usually only one set of contact info,
// we can use a fixed ID or a "singleton" pattern.
const contactInfoSchema = new mongoose.Schema({
    identifier: { // To ensure only one document
        type: String,
        default: "main_contact_info",
        unique: true,
    },
    address: {
        type: String,
        trim: true,
    },
    phone: {
        type: String,
        trim: true,
    },
    email: {
        type: String,
        trim: true,
        lowercase: true,
    },
    locationMapUrl: {
        type: String,
        trim: true,
    }
}, { timestamps: true });

module.exports = mongoose.model('ContactInfo', contactInfoSchema);