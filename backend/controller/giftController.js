'use strict';

const Gift = require('../model/Gift');
const { logAction } = require('../utils/auditLogger');

const listGifts = async (req, res) => {
    try {
        const { isActive, occasion, page = 1, limit = 20 } = req.query;
        const query = {};
        if (isActive !== undefined) query.isActive = isActive === 'true';
        if (occasion) query.occasions = occasion;
        const skip = (Number(page) - 1) * Number(limit);
        const [data, total] = await Promise.all([
            Gift.find(query).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
            Gift.countDocuments(query),
        ]);
        return res.json({ error: false, data, total });
    } catch (err) {
        return res.status(500).json({ error: true, msg: 'Failed to fetch gifts' });
    }
};

const getGift = async (req, res) => {
    try {
        const doc = await Gift.findById(req.params.id);
        if (!doc) return res.status(404).json({ error: true, msg: 'Gift not found' });
        return res.json({ error: false, data: doc });
    } catch (err) {
        return res.status(500).json({ error: true, msg: 'Failed to fetch gift' });
    }
};

const createGift = async (req, res) => {
    try {
        const doc = await Gift.create(req.body);
        await logAction({ action: 'gift.create', category: 'gift', admin: req.user, adminDoc: req.adminDoc, entityType: 'Gift', entityId: doc._id, newValue: { name: doc.name }, req });
        return res.status(201).json({ error: false, data: doc });
    } catch (err) {
        return res.status(500).json({ error: true, msg: 'Failed to create gift' });
    }
};

const updateGift = async (req, res) => {
    try {
        const doc = await Gift.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!doc) return res.status(404).json({ error: true, msg: 'Gift not found' });
        await logAction({ action: 'gift.update', category: 'gift', admin: req.user, adminDoc: req.adminDoc, entityType: 'Gift', entityId: doc._id, req });
        return res.json({ error: false, data: doc });
    } catch (err) {
        return res.status(500).json({ error: true, msg: 'Failed to update gift' });
    }
};

const deleteGift = async (req, res) => {
    try {
        const doc = await Gift.findByIdAndDelete(req.params.id);
        if (!doc) return res.status(404).json({ error: true, msg: 'Gift not found' });
        return res.json({ error: false, msg: 'Gift deleted' });
    } catch (err) {
        return res.status(500).json({ error: true, msg: 'Failed to delete gift' });
    }
};

module.exports = { listGifts, getGift, createGift, updateGift, deleteGift };
