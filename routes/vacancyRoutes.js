// backend/routes/vacancyRoutes.js
const express = require('express');
const router = express.Router();
const vacanciesController = require('../controllers/vacanciesController');
// const { isAdmin } = require('../middlewares/authMiddleware'); // IMPORTANT: Implement and apply this middleware

// --- Public Routes ---
router.get('/jobs', vacanciesController.getAllJobs);
router.get('/jobs/:id', vacanciesController.getJobById);
router.get('/featured-companies', vacanciesController.getFeaturedCompanies);
router.get('/filter-options', vacanciesController.getFilterOptions);

// Public route for submitting job applications (uses the modified applyForJob controller)
router.post('/jobs/apply', vacanciesController.applyForJob);

// --- Admin Routes ---
// These routes MUST be protected by an authentication/authorization middleware (e.g., isAdmin)

// Job Management (Admin)
router.post('/jobs', /* isAdmin, */ vacanciesController.createJob);
router.put('/jobs/:id', /* isAdmin, */ vacanciesController.updateJob);
router.delete('/jobs/:id', /* isAdmin, */ vacanciesController.deleteJob);

// Application Management (Admin)
router.get('/applications', /* isAdmin, */ vacanciesController.getAllApplications);
router.post('/applications/:applicationId/respond', /* isAdmin, */ vacanciesController.respondToApplication);
// Optional: A dedicated route to update application status without sending email
// router.put('/applications/:applicationId/status', /* isAdmin, */ vacanciesController.updateApplicationStatus);


module.exports = router;