// backend/controllers/subscriptionController.js
const Subscription = require('../models/Subscription');

exports.subscribeToAlerts = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ message: "Email is required." });
        }

        const existingSubscription = await Subscription.findOne({ email: email.toLowerCase() });
        if (existingSubscription) {
            return res.status(409).json({ message: `${email} is already subscribed.` });
        }

        const newSubscription = new Subscription({ email });
        await newSubscription.save();

        console.log(`New job alert subscription in DB: ${email}`);
        res.status(200).json({ message: `Successfully subscribed ${email} for job alerts!` });

    } catch (error) {
        console.error("Error subscribing to alerts:", error);
        if (error.name === 'ValidationError') {
            return res.status(400).json({ message: "Validation Error", errors: error.errors });
        }
        res.status(500).json({ message: "Server error: Could not process subscription.", error: error.message });
    }
};