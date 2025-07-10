const express = require('express');
const router = express.Router();
const subscriptionController = require('../controllers/subscriptionController');

router.post('/subscribe', subscriptionController.subscribeToAlerts);
router.get('/subscriptions', subscriptionController.getAllSubscriptions);
router.put('/subscriptions/:id', subscriptionController.updateSubscription);
router.delete('/subscriptions/:id', subscriptionController.deleteSubscription);

module.exports = router;
