// backend/controllers/blogPostController.js
const BlogPost = require('../models/BlogPost');
const BlogCategory = require('../models/BlogCategory');
const { uploadImageToCloudinary, deleteImageFromCloudinary } = require('../utils/imageUploader');


exports.getAllBlogPosts = async (req, res) => {
    console.log("--- INSIDE blogPostController.getAllBlogPosts ---");
    try {
        const { category: categorySlug, tag, search, page = 1, limit = 10, admin_view } = req.query;
        const query = {};
        const isAdminView = String(admin_view).toLowerCase() === 'true';

        if (!isAdminView) {
            query.isPublished = true; 
        }

        if (categorySlug && categorySlug !== "all-categories") {
            const categoryDoc = await BlogCategory.findOne({ slug: categorySlug });
            if (categoryDoc) query.category = categoryDoc._id;
            else return res.status(200).json({ posts: [], totalPages: 0, currentPage: 1, totalPosts: 0 });
        }
        if (tag) query.tags = { $regex: tag, $options: 'i' };
        if (search) {
            const searchRegex = { $regex: search, $options: 'i' };
            query.$or = [{ title: searchRegex }, { excerpt: searchRegex }, { content: searchRegex }, { tags: searchRegex }];
        }

        const effectivePage = parseInt(page);
        const effectiveLimit = isAdminView ? 200 : parseInt(limit);
        const skip = (effectivePage - 1) * effectiveLimit;
        
        let postsQuery = BlogPost.find(query)
            .populate('category', 'name slug')
            .skip(skip)
            .limit(effectiveLimit);

        if (isAdminView) {
            postsQuery = postsQuery.sort({ createdAt: -1 }); 
        } else {
            postsQuery = postsQuery.sort({ publishDate: -1 }); 
        }
        
        const posts = await postsQuery;
        const totalPosts = await BlogPost.countDocuments(query);
        console.log(`[BlogPostCtrl] getAllBlogPosts: isAdmin=${isAdminView}, fetched=${posts.length}, totalInDB=${totalPosts}`);

        res.status(200).json({ // सुनिश्चित करें कि यह ऑब्जेक्ट भेजा जा रहा है
            posts,
            totalPages: Math.ceil(totalPosts / effectiveLimit),
            currentPage: effectivePage,
            totalPosts
        });
    } catch (error) {
        console.error("[Controller] Error fetching blog posts:", error);
        res.status(500).json({ success: false, message: "Server error fetching blog posts." });
    }
};


exports.createBlogPost = async (req, res) => {
    console.log("--- INSIDE blogPostController.createBlogPost ---");
    try {
        const { title, excerpt, content, author, readTime, categoryId, tags, isPublished = "false" } = req.body;
        
        console.log("[Controller] Create Post - Received data:", req.body);
        if (req.files) console.log("[Controller] Create Post - Received files:", Object.keys(req.files));

        if (!title || !excerpt || !content || !author || !readTime || !categoryId) {
            return res.status(400).json({ success: false, message: "Missing required fields." });
        }
        const categoryExists = await BlogCategory.findById(categoryId);
        if (!categoryExists) return res.status(404).json({ success: false, message: "Blog category not found." });

        let featuredImageData = {};
        if (req.files && req.files.featuredImageFile) {
            try {
                const uploadedImage = await uploadImageToCloudinary(req.files.featuredImageFile, "silver_talent/blog_images");
                featuredImageData = { public_id: uploadedImage.public_id, url: uploadedImage.secure_url };
            } catch (uploadError) {
                console.error("[Controller] Image upload error during create:", uploadError);
                return res.status(500).json({ success: false, message: "Failed to upload featured image.", error: uploadError.message });
            }
        } else {
             return res.status(400).json({ success: false, message: "Featured image is required for new post." });
        }
        
        const contentArray = String(content).split(/\r?\n\r?\n|\r\n/).filter(p => p.trim() !== '');
        const tagsArray = tags ? String(tags).split(',').map(t => t.trim()).filter(t => t) : [];
        const publishFlag = String(isPublished).toLowerCase() === 'true';

        const newPost = new BlogPost({
            title, excerpt, content: contentArray, author, readTime, 
            category: categoryId, tags: tagsArray, featuredImage: featuredImageData,
            isPublished: publishFlag,
            publishDate: publishFlag ? new Date() : null,
        });

        await newPost.save();
        console.log("[Controller] Blog post saved:", newPost.title, "Slug:", newPost.slug);
        res.status(201).json({ success: true, message: "Blog post created successfully!", post: newPost });

    } catch (error) {
        console.error("[Controller] Error creating blog post:", error);
        if (error.name === 'ValidationError') return res.status(400).json({ success: false, message: "Validation Error", errors: error.errors });
        res.status(500).json({ success: false, message: "Server error creating blog post.", error: error.message });
    }
};

exports.getBlogPostByIdForAdmin = async (req, res) => {
    console.log("--- INSIDE blogPostController.getBlogPostByIdForAdmin ---");
    try {
        const { id } = req.params;
        const post = await BlogPost.findById(id).populate('category', 'name slug _id');
        if (!post) return res.status(404).json({ success: false, message: "Blog post not found." });
        res.status(200).json(post);
    } catch (error) {
        console.error("[Controller] Error fetching blog post by ID for admin:", error);
        if (error.kind === 'ObjectId') return res.status(404).json({ success: false, message: "Post not found (invalid ID)." });
        res.status(500).json({ success: false, message: "Server error fetching blog post." });
    }
};

exports.getBlogPostBySlug = async (req, res) => { 
    console.log("--- INSIDE blogPostController.getBlogPostBySlug ---");
    try {
        const { slug } = req.params;
        const post = await BlogPost.findOneAndUpdate(
            { slug, isPublished: true }, 
            { $inc: { views: 1 } }, 
            { new: true }
        ).populate('category', 'name slug');
        
        if (!post) return res.status(404).json({ success: false, message: "Blog post not found or not published." });
        res.status(200).json(post);
    } catch (error) {
        console.error("[Controller] Error fetching single blog post by slug:", error);
        res.status(500).json({ success: false, message: "Server error fetching blog post." });
    }
};

exports.updateBlogPost = async (req, res) => {
    console.log("--- INSIDE blogPostController.updateBlogPost ---");
    try {
        const postId = req.params.id;
        const { title, excerpt, content, author, readTime, categoryId, tags, isPublished = "false" } = req.body;

        console.log("[Controller] Update Post - Received data:", req.body);
        if (req.files) console.log("[Controller] Update Post - Received files:", Object.keys(req.files));

        const postToUpdate = await BlogPost.findById(postId);
        if (!postToUpdate) return res.status(404).json({ success: false, message: "Blog post not found to update." });

        if (!title || !excerpt || !content || !author || !readTime || !categoryId) {
            return res.status(400).json({ success: false, message: "Missing required fields for update." });
        }
        const categoryExists = await BlogCategory.findById(categoryId);
        if (!categoryExists) return res.status(404).json({ success: false, message: "Blog category not found for update." });

        postToUpdate.title = title;
        postToUpdate.excerpt = excerpt;
        postToUpdate.content = String(content).split(/\r?\n\r?\n|\r\n/).filter(p => p.trim() !== '');
        postToUpdate.author = author;
        postToUpdate.readTime = readTime;
        postToUpdate.category = categoryId;
        postToUpdate.tags = tags ? String(tags).split(',').map(t => t.trim()).filter(t => t) : [];
        
        const publishFlag = String(isPublished).toLowerCase() === 'true';
        if (publishFlag && !postToUpdate.isPublished) postToUpdate.publishDate = new Date();
        else if (!publishFlag) postToUpdate.publishDate = null;
        postToUpdate.isPublished = publishFlag;
        
        if (req.files && req.files.featuredImageFile) {
            if (postToUpdate.featuredImage && postToUpdate.featuredImage.public_id) {
                try { await deleteImageFromCloudinary(postToUpdate.featuredImage.public_id); }
                catch (e) { console.error("Error deleting old featured image during replacement:", e.message); }
            }
            try {
                const uploadedImage = await uploadImageToCloudinary(req.files.featuredImageFile, "silver_talent/blog_images");
                postToUpdate.featuredImage = { public_id: uploadedImage.public_id, url: uploadedImage.secure_url };
            } catch (uploadError) {
                console.error("[Controller] Image upload error during update:", uploadError.message);
            }
        } else if (req.body.removeFeaturedImage === 'true') {
            if (postToUpdate.featuredImage && postToUpdate.featuredImage.public_id) {
                try { await deleteImageFromCloudinary(postToUpdate.featuredImage.public_id); }
                catch (e) { console.error("Error deleting featured image on remove request:", e.message); }
            }
            postToUpdate.featuredImage = {};
        }

        await postToUpdate.save();
        console.log("[Controller] Blog post updated:", postToUpdate.title, "New Slug:", postToUpdate.slug);
        const updatedPostWithCategory = await BlogPost.findById(postToUpdate._id).populate('category', 'name slug _id');
        res.status(200).json({ success: true, message: "Blog post updated successfully!", post: updatedPostWithCategory });

    } catch (error) {
        console.error("[Controller] Error updating blog post:", error);
        if (error.name === 'ValidationError') return res.status(400).json({ success: false, message: "Validation Error", errors: error.errors });
        if (error.kind === 'ObjectId') return res.status(404).json({ message: "Post not found (invalid ID)." });
        res.status(500).json({ success: false, message: "Server error updating blog post.", error: error.message });
    }
};

exports.deleteBlogPost = async (req, res) => { 
    console.log("--- INSIDE blogPostController.deleteBlogPost ---");
    try {
        const postId = req.params.id;
        const postToDelete = await BlogPost.findById(postId);

        if (!postToDelete) {
            return res.status(404).json({ success: false, message: "Blog post not found to delete." });
        }

        if (postToDelete.featuredImage && postToDelete.featuredImage.public_id) {
            try {
                await deleteImageFromCloudinary(postToDelete.featuredImage.public_id);
            } catch (deleteError) {
                console.error("[Controller] Error deleting featured image from Cloudinary:", deleteError.message);
            }
        }

        await BlogPost.findByIdAndDelete(postId);
        res.status(200).json({ success: true, message: "Blog post deleted successfully!", postId: postId });

    } catch (error) {
        console.error("[Controller] Error deleting blog post:", error);
        if (error.kind === 'ObjectId') {
            return res.status(404).json({ success: false, message: "Post not found (invalid ID format for delete)." });
        }
        res.status(500).json({ success: false, message: "Server error deleting blog post.", error: error.message });
    }
};