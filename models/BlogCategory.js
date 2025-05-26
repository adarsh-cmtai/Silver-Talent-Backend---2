// backend/models/BlogCategory.js
const mongoose = require('mongoose');

const blogCategorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Category name is required"],
        unique: true, // Name itself should be unique
        trim: true,
    },
    slug: {
        type: String,
        // required: true, // Not strictly required here
        unique: true,
        lowercase: true,
        index: true,
    },
    description: {
        type: String,
        trim: true,
    },
}, { timestamps: true });

// Pre-save hook to generate/update slug from name
blogCategorySchema.pre('save', async function(next) {
    if (this.isModified('name') || !this.slug) {
        let baseSlug = this.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
        let slug = baseSlug;
        let count = 1;
        while (await this.constructor.findOne({ slug: slug, _id: { $ne: this._id } })) {
            slug = `${baseSlug}-${count}`;
            count++;
        }
        this.slug = slug;
    }
    next();
});

module.exports = mongoose.model('BlogCategory', blogCategorySchema);