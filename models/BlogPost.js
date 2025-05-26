// backend/models/BlogPost.js
const mongoose = require('mongoose');

const blogPostSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, "Blog post title is required"],
        trim: true,
    },
    slug: {
        type: String,
        // required: true, // Not strictly required here as pre-save generates it
        unique: true,
        lowercase: true,
        index: true, // Good for query performance on slugs
    },
    excerpt: {
        type: String,
        required: [true, "Excerpt is required"],
        trim: true,
    },
    content: { 
        type: [String], 
        required: true,
    },
    author: {
        type: String, 
        required: true,
        trim: true,
    },
    publishDate: {
        type: Date,
        // default: Date.now, // Default only if isPublished is true from start
    },
    readTime: { 
        type: String,
        required: true,
    },
    featuredImage: {
        public_id: String, 
        url: String,       
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'BlogCategory',
        required: [true, "Category is required"],
    },
    tags: {
        type: [String],
        default: [],
    },
    isPublished: {
        type: Boolean,
        default: false, 
    },
    views: { 
        type: Number,
        default: 0,
    }
}, { timestamps: true });

// Pre-save hook to generate/update slug from title
blogPostSchema.pre('save', async function(next) {
    if (this.isModified('title') || !this.slug) { // if title changed or slug is not set
        let baseSlug = this.title.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
        let slug = baseSlug;
        let count = 1;
        // Check for uniqueness and append number if needed
        // Important: Ensure 'this.constructor' is correctly referencing the BlogPost model
        // and that this query doesn't conflict with the document being saved if it's an update.
        while (await this.constructor.findOne({ slug: slug, _id: { $ne: this._id } })) { // $ne: this._id handles updates
            slug = `${baseSlug}-${count}`;
            count++;
        }
        this.slug = slug;
    }
    next();
});

module.exports = mongoose.model('BlogPost', blogPostSchema);