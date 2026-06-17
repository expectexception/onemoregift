'use strict';

const HappyMoment = require('../model/HappyMoment');
const Gift = require('../model/Gift');
const { logAction } = require('../utils/auditLogger');

// GET /api/v1/admin/moments
const listMoments = async (req, res) => {
    try {
        const { status, isFeatured, page = 1, limit = 20, flagged } = req.query;
        const query = {};
        if (status) query.status = status;
        if (isFeatured !== undefined) query.isFeatured = isFeatured === 'true';
        if (flagged === 'true') query['reports.0'] = { $exists: true };

        const skip = (Number(page) - 1) * Number(limit);
        const [data, total] = await Promise.all([
            HappyMoment.find(query)
                .populate('userId', 'name email')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(Number(limit)),
            HappyMoment.countDocuments(query),
        ]);
        return res.json({ error: false, data, total, page: Number(page) });
    } catch (err) {
        return res.status(500).json({ error: true, msg: 'Failed to fetch moments' });
    }
};

// GET /api/v1/admin/moments/:id
const getMoment = async (req, res) => {
    try {
        const doc = await HappyMoment.findById(req.params.id)
            .populate('userId', 'name email')
            .populate('reviewedBy', 'username email')
            .populate('assignedGift', 'name thumbnail');
        if (!doc) return res.status(404).json({ error: true, msg: 'Moment not found' });
        return res.json({ error: false, data: doc });
    } catch (err) {
        return res.status(500).json({ error: true, msg: 'Failed to fetch moment' });
    }
};

// PATCH /api/v1/admin/moments/:id/status
const updateStatus = async (req, res) => {
    try {
        const { status, adminNotes, rejectionReason } = req.body;
        const doc = await HappyMoment.findById(req.params.id);
        if (!doc) return res.status(404).json({ error: true, msg: 'Moment not found' });

        const prev = doc.status;
        doc.status = status;
        if (adminNotes) doc.adminNotes = adminNotes;
        if (rejectionReason) doc.rejectionReason = rejectionReason;
        doc.reviewedBy = req.adminDoc?._id;
        doc.reviewedAt = new Date();

        if (status === 'published') {
            doc.isPublished = true;
            doc.publishedAt = new Date();
        }
        if (status === 'rejected') {
            doc.isPublished = false;
        }

        await doc.save();

        await logAction({
            action: 'moment.status_update',
            category: 'moment',
            admin: req.user,
            adminDoc: req.adminDoc,
            entityType: 'HappyMoment',
            entityId: doc._id,
            prevValue: { status: prev },
            newValue: { status },
            req,
        });

        return res.json({ error: false, msg: 'Status updated', data: doc });
    } catch (err) {
        return res.status(500).json({ error: true, msg: 'Failed to update status' });
    }
};

// PATCH /api/v1/admin/moments/:id/feature
const toggleFeature = async (req, res) => {
    try {
        const doc = await HappyMoment.findById(req.params.id);
        if (!doc) return res.status(404).json({ error: true, msg: 'Moment not found' });
        doc.isFeatured = !doc.isFeatured;
        await doc.save();
        return res.json({ error: false, msg: doc.isFeatured ? 'Moment featured' : 'Moment unfeatured', data: doc });
    } catch (err) {
        return res.status(500).json({ error: true, msg: 'Failed to toggle feature' });
    }
};

// DELETE /api/v1/admin/moments/:id
const removeMoment = async (req, res) => {
    try {
        const doc = await HappyMoment.findByIdAndDelete(req.params.id);
        if (!doc) return res.status(404).json({ error: true, msg: 'Moment not found' });

        await logAction({
            action: 'moment.deleted',
            category: 'moment',
            admin: req.user,
            adminDoc: req.adminDoc,
            entityType: 'HappyMoment',
            entityId: doc._id,
            req,
        });

        return res.json({ error: false, msg: 'Moment removed' });
    } catch (err) {
        return res.status(500).json({ error: true, msg: 'Failed to remove moment' });
    }
};

// PATCH /api/v1/admin/moments/:id/resolve-report
const resolveReport = async (req, res) => {
    try {
        const { reportId } = req.body;
        const doc = await HappyMoment.findById(req.params.id);
        if (!doc) return res.status(404).json({ error: true, msg: 'Moment not found' });
        const report = doc.reports.id(reportId);
        if (!report) return res.status(404).json({ error: true, msg: 'Report not found' });
        report.resolved = true;
        await doc.save();
        return res.json({ error: false, msg: 'Report resolved' });
    } catch (err) {
        return res.status(500).json({ error: true, msg: 'Failed to resolve report' });
    }
};

// POST /api/v1/admin/moments/:id/assign-gift
const assignGift = async (req, res) => {
    try {
        const { giftId } = req.body;
        const [doc, gift] = await Promise.all([
            HappyMoment.findById(req.params.id),
            Gift.findById(giftId),
        ]);
        if (!doc) return res.status(404).json({ error: true, msg: 'Moment not found' });
        if (!gift) return res.status(404).json({ error: true, msg: 'Gift not found' });
        if (gift.stock <= 0) return res.status(400).json({ error: true, msg: 'Gift out of stock' });

        doc.assignedGift = giftId;
        doc.giftAssignedAt = new Date();
        doc.giftAssignedBy = req.adminDoc?._id;
        doc.status = 'gift_assigned';

        gift.stock -= 1;
        gift.assignedCount += 1;
        gift.assignmentHistory.push({
            requestId: doc._id,
            requestType: 'moment',
            userId: doc.userId,
            assignedBy: req.adminDoc?._id,
        });

        await Promise.all([doc.save(), gift.save()]);
        return res.json({ error: false, msg: 'Gift assigned', data: doc });
    } catch (err) {
        return res.status(500).json({ error: true, msg: 'Failed to assign gift' });
    }
};

module.exports = { listMoments, getMoment, updateStatus, toggleFeature, removeMoment, resolveReport, assignGift };
