'use strict';

const Store = require('../model/Store');
const { logAction } = require('../utils/auditLogger');

const listStores = async (req, res) => {
    try {
        const { city, isActive, page = 1, limit = 20 } = req.query;
        const query = {};
        if (city) query.city = { $regex: city, $options: 'i' };
        if (isActive !== undefined) query.isActive = isActive === 'true';
        const skip = (Number(page) - 1) * Number(limit);
        const [data, total] = await Promise.all([
            Store.find(query).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
            Store.countDocuments(query),
        ]);
        return res.json({ error: false, data, total });
    } catch (err) {
        return res.status(500).json({ error: true, msg: 'Failed to fetch stores' });
    }
};

const getStore = async (req, res) => {
    try {
        const doc = await Store.findById(req.params.id);
        if (!doc) return res.status(404).json({ error: true, msg: 'Store not found' });
        return res.json({ error: false, data: doc });
    } catch (err) {
        return res.status(500).json({ error: true, msg: 'Failed to fetch store' });
    }
};

const createStore = async (req, res) => {
    try {
        const doc = await Store.create(req.body);
        await logAction({ action: 'store.create', category: 'store', admin: req.user, adminDoc: req.adminDoc, entityType: 'Store', entityId: doc._id, newValue: { name: doc.name }, req });
        return res.status(201).json({ error: false, data: doc });
    } catch (err) {
        if (err.code === 11000) {
            return res.status(409).json({ error: true, msg: 'A store with that code already exists. Please use a unique store code.' });
        }
        return res.status(500).json({ error: true, msg: 'Failed to create store' });
    }
};

const updateStore = async (req, res) => {
    try {
        const doc = await Store.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!doc) return res.status(404).json({ error: true, msg: 'Store not found' });
        await logAction({ action: 'store.update', category: 'store', admin: req.user, adminDoc: req.adminDoc, entityType: 'Store', entityId: doc._id, req });
        return res.json({ error: false, data: doc });
    } catch (err) {
        if (err.code === 11000) {
            return res.status(409).json({ error: true, msg: 'A store with that code already exists. Please use a unique store code.' });
        }
        return res.status(500).json({ error: true, msg: 'Failed to update store' });
    }
};

const deleteStore = async (req, res) => {
    try {
        const doc = await Store.findByIdAndDelete(req.params.id);
        if (!doc) return res.status(404).json({ error: true, msg: 'Store not found' });
        return res.json({ error: false, msg: 'Store deleted' });
    } catch (err) {
        return res.status(500).json({ error: true, msg: 'Failed to delete store' });
    }
};

module.exports = { listStores, getStore, createStore, updateStore, deleteStore };
