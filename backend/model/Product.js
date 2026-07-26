'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const variantSchema = new Schema({
    name: { type: String }, // e.g. 'Size: L', 'Color: Red'
    sku: { type: String },
    price: { type: Number, required: true },
    stock: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
}, { _id: true });

const storeStockSchema = new Schema({
    storeId: { type: Schema.Types.ObjectId, ref: 'Store', required: true },
    stock: { type: Number, default: 0 },
}, { _id: false });

const productSchema = new Schema({
    name: { type: String, required: true },
    description: { type: String },
    category: { type: String, required: true },
    tags: [{ type: String }], // for recommendation engine

    // Pricing
    basePrice: { type: Number, required: true },
    discountedPrice: { type: Number },
    isOnSale: { type: Boolean, default: false },

    // Media
    images: [{ type: String }],
    thumbnail: { type: String },

    // Variants (optional)
    hasVariants: { type: Boolean, default: false },
    variants: [variantSchema],

    // Inventory: global stock (if no variants)
    stock: { type: Number, default: 0 },
    lowStockThreshold: { type: Number, default: 5 },

    // Per-store stock
    storeStock: [storeStockSchema],

    // Status
    isActive: { type: Boolean, default: true },
    isArchived: { type: Boolean, default: false },
    isFeatured: { type: Boolean, default: false },

    // Analytics
    rating: { type: Number, default: 0 },
    totalOrders: { type: Number, default: 0 },
    viewCount: { type: Number, default: 0 },

    // Occasion tags for recommendation engine
    occasions: [{ type: String }], // ['birthday', 'anniversary', 'reward']

    // Metadata
    weight: { type: Number },
    dimensions: { width: Number, height: Number, depth: Number },
    sku: { type: String, unique: true, sparse: true },

}, { timestamps: true, versionKey: false });

productSchema.index({ category: 1, isActive: 1 });
productSchema.index({ occasions: 1, basePrice: 1 });
productSchema.index({ isActive: 1, stock: 1, rating: -1 });
productSchema.index({ name: 'text', description: 'text', tags: 'text' });

const Product = mongoose.model('Product', productSchema);
module.exports = Product;
