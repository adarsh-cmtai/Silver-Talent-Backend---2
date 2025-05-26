// backend/models/Subscription.js
const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true, // Ensure no duplicate email subscriptions
        trim: true,
        lowercase: true,
        match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please provide a valid email address'],
    }
}, { timestamps: true });

module.exports = mongoose.model('Subscription', subscriptionSchema);