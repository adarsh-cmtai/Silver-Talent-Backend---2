// backend/routes/contactRoutes.js
const express = require('express');
const router = express.Router();
const contactController = require('../controllers/contactController');

router.get('/contact-info', contactController.getContactInfo);
router.put('/contact-info', contactController.updateContactInfo); // Add isAdmin middleware
router.post('/contact-us', contactController.handlePublicContactForm);
console.log("--- contactRoutes.js: Registered POST /api/contact-us (public form) ---");

// Admin routes for managing contact submissions
router.get('/contact-submissions', contactController.getContactSubmissions);
console.log("--- contactRoutes.js: Registered GET /api/contact-submissions (admin) ---");

router.put('/contact-submissions/:submissionId/status', contactController.updateSubmissionStatus);
console.log("--- contactRoutes.js: Registered PUT /api/contact-submissions/:submissionId/status (admin) ---");

router.post('/contact-submissions/:submissionId/respond', contactController.respondToSubmission);
console.log("--- contactRoutes.js: Registered POST /api/contact-submissions/:submissionId/respond (admin) ---");

router.delete('/contact-submissions/:submissionId', contactController.deleteSubmission);
console.log("--- contactRoutes.js: Registered DELETE /api/contact-submissions/:submissionId (admin) ---");



module.exports = router;