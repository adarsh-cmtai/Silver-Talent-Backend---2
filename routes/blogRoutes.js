// backend/routes/blogRoutes.js
const express = require('express');
const router = express.Router();

const blogPostController = require('../controllers/blogPostController');
const blogCategoryController = require('../controllers/blogCategoryController');

console.log("--- blogRoutes.js: Initializing blog routes ---");

// --- Blog Post Routes ---
router.get('/blog/posts', blogPostController.getAllBlogPosts); // Changed to getAllBlogPosts
router.get('/blog/posts/slug/:slug', blogPostController.getBlogPostBySlug);
router.post('/blog/posts', blogPostController.createBlogPost);
router.get('/blog/posts/:id', blogPostController.getBlogPostByIdForAdmin);
router.put('/blog/posts/:id', blogPostController.updateBlogPost);
router.delete('/blog/posts/:id', blogPostController.deleteBlogPost);
console.log("   Registered Blog Post routes");

// --- Blog Category Routes --- (No changes from previous version, seems okay)
router.get('/blog/categories', blogCategoryController.getAllBlogCategories);
router.post('/blog/categories', blogCategoryController.createBlogCategory);
router.get('/blog/categories/:id', blogCategoryController.getBlogCategoryById);
router.put('/blog/categories/:id', blogCategoryController.updateBlogCategory);
router.delete('/blog/categories/:id', blogCategoryController.deleteBlogCategory);
console.log("   Registered Blog Category routes");

module.exports = router;