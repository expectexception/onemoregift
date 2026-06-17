'use strict';

const SurpriseRequest = require('../model/SurpriseRequest');
const Gift = require('../model/Gift');
const { logAction } = require('../utils/auditLogger');

// GET /api/v1/admin/surprise — list all requests with filters
const listRequests = async (req, res) => {
    try {
        const { status, eventType, page = 1, limit = 20, search } = req.query;
        const query = {};
        if (status) query.status = status;
        if (eventType) query.eventType = eventType;
        if (search) query.recipientName = { $regex: search, $options: 'i' };

        const skip = (Number(page) - 1) * Number(limit);
        const [data, total] = await Promise.all([
            SurpriseRequest.find(query)
                .populate('userId', 'name email')
                .populate('assignedGift', 'name thumbnail')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(Number(limit)),
            SurpriseRequest.countDocuments(query),
        ]);

        return res.json({ error: false, data, total, page: Number(page) });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: true, msg: 'Failed to fetch surprise requests' });
    }
};

// GET /api/v1/admin/surprise/:id
const getRequest = async (req, res) => {
    try {
        const doc = await SurpriseRequest.findById(req.params.id)
            .populate('userId', 'name email phone')
            .populate('assignedGift')
            .populate('reviewedBy', 'username email')
            .populate('giftAssignedBy', 'username email');
        if (!doc) return res.status(404).json({ error: true, msg: 'Request not found' });
        return res.json({ error: false, data: doc });
    } catch (err) {
        return res.status(500).json({ error: true, msg: 'Failed to fetch request' });
    }
};

// PATCH /api/v1/admin/surprise/:id/status
const updateStatus = async (req, res) => {
    try {
        const { status, adminNotes, rejectionReason } = req.body;
        const doc = await SurpriseRequest.findById(req.params.id);
        if (!doc) return res.status(404).json({ error: true, msg: 'Request not found' });

        const prev = doc.status;
        doc.status = status;
        if (adminNotes) doc.adminNotes = adminNotes;
        if (rejectionReason) doc.rejectionReason = rejectionReason;
        doc.reviewedBy = req.adminDoc?._id;
        doc.reviewedAt = new Date();

        // Append to timeline
        doc.verificationTimeline.push({
            status,
            note: adminNotes || rejectionReason || '',
            adminId: req.adminDoc?._id,
            adminEmail: req.adminDoc?.email,
        });

        await doc.save();

        await logAction({
            action: 'surprise.status_update',
            category: 'surprise',
            admin: req.user,
            adminDoc: req.adminDoc,
            entityType: 'SurpriseRequest',
            entityId: doc._id,
            prevValue: { status: prev },
            newValue: { status },
            description: `Status changed from ${prev} to ${status}`,
            req,
        });

        return res.json({ error: false, msg: 'Status updated', data: doc });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: true, msg: 'Failed to update status' });
    }
};

// POST /api/v1/admin/surprise/:id/assign-gift
const assignGift = async (req, res) => {
    try {
        const { giftId } = req.body;
        if (!giftId) return res.status(400).json({ error: true, msg: 'giftId required' });

        const [doc, gift] = await Promise.all([
            SurpriseRequest.findById(req.params.id),
            Gift.findById(giftId),
        ]);
        if (!doc) return res.status(404).json({ error: true, msg: 'Request not found' });
        if (!gift) return res.status(404).json({ error: true, msg: 'Gift not found' });
        if (gift.stock <= 0) return res.status(400).json({ error: true, msg: 'Gift out of stock' });

        doc.assignedGift = giftId;
        doc.giftAssignedAt = new Date();
        doc.giftAssignedBy = req.adminDoc?._id;
        doc.status = 'gift_assigned';
        doc.verificationTimeline.push({
            status: 'gift_assigned',
            note: `Gift "${gift.name}" assigned`,
            adminId: req.adminDoc?._id,
            adminEmail: req.adminDoc?.email,
        });

        gift.stock -= 1;
        gift.assignedCount += 1;
        gift.assignmentHistory.push({
            requestId: doc._id,
            requestType: 'surprise',
            userId: doc.userId,
            assignedBy: req.adminDoc?._id,
        });

        await Promise.all([doc.save(), gift.save()]);

        await logAction({
            action: 'surprise.gift_assigned',
            category: 'surprise',
            admin: req.user,
            adminDoc: req.adminDoc,
            entityType: 'SurpriseRequest',
            entityId: doc._id,
            newValue: { giftId, giftName: gift.name },
            req,
        });

        return res.json({ error: false, msg: 'Gift assigned', data: doc });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: true, msg: 'Failed to assign gift' });
    }
};

// PATCH /api/v1/admin/surprise/:id/flag
const flagFraud = async (req, res) => {
    try {
        const { reason } = req.body;
        const doc = await SurpriseRequest.findByIdAndUpdate(
            req.params.id,
            { isFraudFlagged: true, fraudFlagReason: reason },
            { new: true }
        );
        if (!doc) return res.status(404).json({ error: true, msg: 'Request not found' });

        await logAction({
            action: 'surprise.fraud_flagged',
            category: 'surprise',
            admin: req.user,
            adminDoc: req.adminDoc,
            entityType: 'SurpriseRequest',
            entityId: doc._id,
            newValue: { reason },
            req,
        });

        return res.json({ error: false, msg: 'Request flagged', data: doc });
    } catch (err) {
        return res.status(500).json({ error: true, msg: 'Failed to flag request' });
    }
};

// GET /api/v1/admin/surprise/stats
const getStats = async (req, res) => {
    try {
        const stats = await SurpriseRequest.aggregate([
            { $group: { _id: '$status', count: { $sum: 1 } } },
        ]);
        const total = await SurpriseRequest.countDocuments({});
        const result = { total };
        stats.forEach(s => { result[s._id] = s.count; });
        return res.json({ error: false, data: result });
    } catch (err) {
        return res.status(500).json({ error: true, msg: 'Failed to fetch stats' });
    }
};

module.exports = { listRequests, getRequest, updateStatus, assignGift, flagFraud, getStats };
