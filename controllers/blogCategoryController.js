// backend/controllers/blogCategoryController.js
const BlogCategory = require('../models/BlogCategory');
const BlogPost = require('../models/BlogPost'); // To check for posts in a category before deletion

// Create a new blog category (Admin)
exports.createBlogCategory = async (req, res) => {
    try {
        const { name, description } = req.body;
        if (!name) {
            return res.status(400).json({ message: "Category name is required." });
        }
        
        const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');

        const existingCategory = await BlogCategory.findOne({ $or: [{ name }, { slug }] });
        if (existingCategory) {
            return res.status(409).json({ message: "A category with this name or slug already exists." });
        }

        const newCategory = new BlogCategory({ name, slug, description });
        await newCategory.save();
        res.status(201).json({ message: "Blog category created successfully.", category: newCategory });
    } catch (error) {
        console.error("Error creating blog category:", error);
        res.status(500).json({ message: "Server error creating blog category.", error: error.message });
    }
};

// Get all blog categories
exports.getAllBlogCategories = async (req, res) => {
    try {
        const categories = await BlogCategory.find().sort({ name: 1 });
        res.status(200).json(categories);
    } catch (error)
 {
        console.error("Error fetching blog categories:", error);
        res.status(500).json({ message: "Server error fetching blog categories.", error: error.message });
    }
};

// Get a single blog category by ID (for editing)
exports.getBlogCategoryById = async (req, res) => {
    try {
        const category = await BlogCategory.findById(req.params.id);
        if (!category) {
            return res.status(404).json({ message: "Blog category not found." });
        }
        res.status(200).json(category);
    } catch (error) {
        console.error("Error fetching blog category by ID:", error);
        if (error.kind === 'ObjectId') {
            return res.status(404).json({ message: "Category not found (invalid ID format)." });
        }
        res.status(500).json({ message: "Server error fetching category.", error: error.message });
    }
};

// Update a blog category (Admin)
exports.updateBlogCategory = async (req, res) => {
    try {
        const { name, description } = req.body;
        const categoryId = req.params.id;

        if (!name) {
            return res.status(400).json({ message: "Category name is required for update." });
        }
        
        const categoryToUpdate = await BlogCategory.findById(categoryId);
        if (!categoryToUpdate) {
            return res.status(404).json({ message: "Category not found to update." });
        }

        const newSlug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');

        // Check if new name or slug conflicts with another existing category
        const conflictingCategory = await BlogCategory.findOne({ 
            $or: [{ name }, { slug: newSlug }], 
            _id: { $ne: categoryId } // Exclude the current category itself
        });
        if (conflictingCategory) {
            return res.status(409).json({ message: "Another category with this name or generated slug already exists." });
        }

        categoryToUpdate.name = name;
        categoryToUpdate.slug = newSlug; // Model pre-save hook will also handle this if name changes
        categoryToUpdate.description = description || ""; // Handle undefined

        const updatedCategory = await categoryToUpdate.save();
        res.status(200).json({ message: "Blog category updated successfully.", category: updatedCategory });
    } catch (error) {
        console.error("Error updating blog category:", error);
        if (error.kind === 'ObjectId') {
            return res.status(404).json({ message: "Category not found (invalid ID format for update)." });
        }
        res.status(500).json({ message: "Server error updating blog category.", error: error.message });
    }
};

// Delete a blog category (Admin)
exports.deleteBlogCategory = async (req, res) => {
    try {
        const categoryId = req.params.id;
        
        // Check if any blog posts are using this category
        const postsInCategory = await BlogPost.countDocuments({ category: categoryId });
        if (postsInCategory > 0) {
            return res.status(400).json({ 
                message: `Cannot delete category. ${postsInCategory} post(s) are currently assigned to it. Please reassign them first.` 
            });
        }

        const categoryToDelete = await BlogCategory.findByIdAndDelete(categoryId);
        if (!categoryToDelete) {
            return res.status(404).json({ message: "Category not found to delete." });
        }
        
        res.status(200).json({ message: "Blog category deleted successfully.", categoryId: categoryId });
    } catch (error) {
        console.error("Error deleting blog category:", error);
        if (error.kind === 'ObjectId') {
            return res.status(404).json({ message: "Category not found (invalid ID format for delete)." });
        }
        res.status(500).json({ message: "Server error deleting blog category.", error: error.message });
    }
};