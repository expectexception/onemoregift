'use strict';

const SurpriseRequest = require('../model/SurpriseRequest');

// POST /api/v1/surprise
const createRequest = async (req, res) => {
    try {
        const { eventName, eventType, eventDate, description, recipientName, recipientContact, documents } = req.body;
        if (!eventName || !eventType || !eventDate || !recipientName) {
            return res.status(400).json({ error: true, msg: 'Required fields missing: eventName, eventType, eventDate, recipientName' });
        }

        const doc = await SurpriseRequest.create({
            userId: req.user.id,
            eventName,
            eventType,
            eventDate,
            description,
            recipientName,
            recipientContact,
            documents: documents || [],
            status: 'submitted',
            verificationTimeline: [{
                status: 'submitted',
                note: 'Request created and submitted by user',
            }],
        });

        return res.status(201).json({ error: false, data: doc });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: true, msg: 'Failed to create surprise request' });
    }
};

// GET /api/v1/surprise/my-requests
const listMyRequests = async (req, res) => {
    try {
        const data = await SurpriseRequest.find({ userId: req.user.id })
            .populate('assignedGift', 'name estimatedValue description')
            .sort({ createdAt: -1 });
        return res.json({ error: false, data });
    } catch (err) {
        return res.status(500).json({ error: true, msg: 'Failed to fetch your requests' });
    }
};

// GET /api/v1/surprise/:id
const getMyRequest = async (req, res) => {
    try {
        const doc = await SurpriseRequest.findOne({ _id: req.params.id, userId: req.user.id })
            .populate('assignedGift', 'name estimatedValue description');
        if (!doc) return res.status(404).json({ error: true, msg: 'Request not found' });
        return res.json({ error: false, data: doc });
    } catch (err) {
        return res.status(500).json({ error: true, msg: 'Failed to fetch request' });
    }
};

// PATCH /api/v1/surprise/:id/cancel
const cancelMyRequest = async (req, res) => {
    try {
        const doc = await SurpriseRequest.findOne({ _id: req.params.id, userId: req.user.id });
        if (!doc) return res.status(404).json({ error: true, msg: 'Request not found' });

        if (!['draft', 'submitted', 'under_review'].includes(doc.status)) {
            return res.status(400).json({ error: true, msg: 'Cannot cancel request after review/approval process has advanced.' });
        }

        doc.status = 'rejected';
        doc.rejectionReason = 'Cancelled by user';
        doc.verificationTimeline.push({
            status: 'rejected',
            note: 'Cancelled by user',
        });

        await doc.save();
        return res.json({ error: false, msg: 'Request cancelled successfully', data: doc });
    } catch (err) {
        return res.status(500).json({ error: true, msg: 'Failed to cancel request' });
    }
};

module.exports = { createRequest, listMyRequests, getMyRequest, cancelMyRequest };
