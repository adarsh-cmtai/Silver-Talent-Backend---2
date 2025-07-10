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

        res.status(201).json({ message: `Successfully subscribed ${email} for job alerts!`, subscription: newSubscription });

    } catch (error) {
        if (error.name === 'ValidationError') {
            return res.status(400).json({ message: "Validation Error", errors: error.errors });
        }
        res.status(500).json({ message: "Server error: Could not process subscription.", error: error.message });
    }
};

exports.getAllSubscriptions = async (req, res) => {
    try {
        const subscriptions = await Subscription.find({});
        res.status(200).json({ count: subscriptions.length, subscriptions });
    } catch (error) {
        res.status(500).json({ message: "Server error: Could not retrieve subscriptions.", error: error.message });
    }
};

exports.updateSubscription = async (req, res) => {
    try {
        const { id } = req.params;
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ message: "Email is required for update." });
        }

        const updatedSubscription = await Subscription.findByIdAndUpdate(id, { email }, { new: true, runValidators: true });

        if (!updatedSubscription) {
            return res.status(404).json({ message: "Subscription not found." });
        }

        res.status(200).json({ message: "Subscription updated successfully.", subscription: updatedSubscription });

    } catch (error) {
        if (error.name === 'ValidationError') {
            return res.status(400).json({ message: "Validation Error", errors: error.errors });
        }
        res.status(500).json({ message: "Server error: Could not update subscription.", error: error.message });
    }
};

exports.deleteSubscription = async (req, res) => {
    try {
        const { id } = req.params;
        const deletedSubscription = await Subscription.findByIdAndDelete(id);

        if (!deletedSubscription) {
            return res.status(404).json({ message: "Subscription not found." });
        }

        res.status(200).json({ message: "Subscription deleted successfully." });

    } catch (error) {
        res.status(500).json({ message: "Server error: Could not delete subscription.", error: error.message });
    }
};
