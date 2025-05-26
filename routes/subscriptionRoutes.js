// backend/routes/subscriptionRoutes.js
const express = require('express');
const router = express.Router();
const subscriptionController = require('../controllers/subscriptionController');

router.post('/subscribe', subscriptionController.subscribeToAlerts);

module.exports = router;