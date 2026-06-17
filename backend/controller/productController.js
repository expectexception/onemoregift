'use strict';

const Product = require('../model/Product');
const { logAction } = require('../utils/auditLogger');

// GET /api/v1/admin/products
const listProducts = async (req, res) => {
    try {
        const { category, isActive, isArchived, search, page = 1, limit = 20, lowStock } = req.query;
        const query = {};
        if (category) query.category = category;
        if (isActive !== undefined) query.isActive = isActive === 'true';
        if (isArchived !== undefined) query.isArchived = isArchived === 'true';
        if (search) query.$text = { $search: search };
        if (lowStock === 'true') query.$expr = { $lte: ['$stock', '$lowStockThreshold'] };

        const skip = (Number(page) - 1) * Number(limit);
        const [data, total] = await Promise.all([
            Product.find(query).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
            Product.countDocuments(query),
        ]);
        return res.json({ error: false, data, total, page: Number(page) });
    } catch (err) {
        return res.status(500).json({ error: true, msg: 'Failed to fetch products' });
    }
};

// GET /api/v1/admin/products/:id
const getProduct = async (req, res) => {
    try {
        const doc = await Product.findById(req.params.id);
        if (!doc) return res.status(404).json({ error: true, msg: 'Product not found' });
        return res.json({ error: false, data: doc });
    } catch (err) {
        return res.status(500).json({ error: true, msg: 'Failed to fetch product' });
    }
};

// POST /api/v1/admin/products
const createProduct = async (req, res) => {
    try {
        const doc = await Product.create(req.body);

        await logAction({
            action: 'product.create',
            category: 'product',
            admin: req.user,
            adminDoc: req.adminDoc,
            entityType: 'Product',
            entityId: doc._id,
            newValue: { name: doc.name, basePrice: doc.basePrice, stock: doc.stock },
            req,
        });

        return res.status(201).json({ error: false, data: doc });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: true, msg: 'Failed to create product' });
    }
};

// PATCH /api/v1/admin/products/:id
const updateProduct = async (req, res) => {
    try {
        const prev = await Product.findById(req.params.id).lean();
        if (!prev) return res.status(404).json({ error: true, msg: 'Product not found' });

        const doc = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });

        await logAction({
            action: 'product.update',
            category: 'product',
            admin: req.user,
            adminDoc: req.adminDoc,
            entityType: 'Product',
            entityId: doc._id,
            prevValue: { name: prev.name, basePrice: prev.basePrice, stock: prev.stock },
            newValue: { name: doc.name, basePrice: doc.basePrice, stock: doc.stock },
            req,
        });

        return res.json({ error: false, data: doc });
    } catch (err) {
        return res.status(500).json({ error: true, msg: 'Failed to update product' });
    }
};

// DELETE /api/v1/admin/products/:id (soft delete — archive)
const archiveProduct = async (req, res) => {
    try {
        const doc = await Product.findByIdAndUpdate(
            req.params.id,
            { isArchived: true, isActive: false },
            { new: true }
        );
        if (!doc) return res.status(404).json({ error: true, msg: 'Product not found' });

        await logAction({
            action: 'product.archive',
            category: 'product',
            admin: req.user,
            adminDoc: req.adminDoc,
            entityType: 'Product',
            entityId: doc._id,
            req,
        });

        return res.json({ error: false, msg: 'Product archived', data: doc });
    } catch (err) {
        return res.status(500).json({ error: true, msg: 'Failed to archive product' });
    }
};

// DELETE /api/v1/admin/products/:id/hard — permanent delete
const deleteProduct = async (req, res) => {
    try {
        const doc = await Product.findByIdAndDelete(req.params.id);
        if (!doc) return res.status(404).json({ error: true, msg: 'Product not found' });

        await logAction({
            action: 'product.delete',
            category: 'product',
            admin: req.user,
            adminDoc: req.adminDoc,
            entityType: 'Product',
            entityId: doc._id,
            prevValue: { name: doc.name },
            req,
        });

        return res.json({ error: false, msg: 'Product deleted' });
    } catch (err) {
        return res.status(500).json({ error: true, msg: 'Failed to delete product' });
    }
};

// PATCH /api/v1/admin/products/:id/stock — adjust stock
const adjustStock = async (req, res) => {
    try {
        const { adjustment, reason } = req.body; // positive or negative integer
        const doc = await Product.findById(req.params.id);
        if (!doc) return res.status(404).json({ error: true, msg: 'Product not found' });

        const prev = doc.stock;
        doc.stock = Math.max(0, doc.stock + Number(adjustment));
        await doc.save();

        await logAction({
            action: 'product.stock_adjust',
            category: 'product',
            admin: req.user,
            adminDoc: req.adminDoc,
            entityType: 'Product',
            entityId: doc._id,
            prevValue: { stock: prev },
            newValue: { stock: doc.stock, adjustment, reason },
            req,
        });

        return res.json({ error: false, msg: 'Stock adjusted', data: { stock: doc.stock } });
    } catch (err) {
        return res.status(500).json({ error: true, msg: 'Failed to adjust stock' });
    }
};

// GET /api/v1/admin/products/categories
const getCategories = async (req, res) => {
    try {
        const categories = await Product.distinct('category', { isArchived: false });
        return res.json({ error: false, data: categories });
    } catch (err) {
        return res.status(500).json({ error: true, msg: 'Failed to fetch categories' });
    }
};

module.exports = { listProducts, getProduct, createProduct, updateProduct, archiveProduct, deleteProduct, adjustStock, getCategories };
