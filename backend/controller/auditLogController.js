'use strict';

const AuditLog = require('../model/AuditLog');

const listLogs = async (req, res) => {
    try {
        const { category, action, adminId, page = 1, limit = 50, from, to } = req.query;
        const query = {};
        if (category) query.category = category;
        if (action) query.action = { $regex: action, $options: 'i' };
        if (adminId) query.adminId = adminId;
        if (from || to) {
            query.createdAt = {};
            if (from) query.createdAt.$gte = new Date(from);
            if (to) query.createdAt.$lte = new Date(to);
        }

        const skip = (Number(page) - 1) * Number(limit);
        const [data, total] = await Promise.all([
            AuditLog.find(query)
                .populate('adminId', 'username email role')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(Number(limit)),
            AuditLog.countDocuments(query),
        ]);
        return res.json({ error: false, data, total, page: Number(page) });
    } catch (err) {
        return res.status(500).json({ error: true, msg: 'Failed to fetch audit logs' });
    }
};

const getLog = async (req, res) => {
    try {
        const doc = await AuditLog.findById(req.params.id).populate('adminId', 'username email role');
        if (!doc) return res.status(404).json({ error: true, msg: 'Log not found' });
        return res.json({ error: false, data: doc });
    } catch (err) {
        return res.status(500).json({ error: true, msg: 'Failed to fetch log' });
    }
};

module.exports = { listLogs, getLog };
