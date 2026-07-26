'use strict';

const SurpriseRequest = require('../model/SurpriseRequest');
const { getConfigHelper } = require('./configController');
const { sanitizeUrlList } = require('../utils/mediaUrls');

// Statuses that count as an "active" application for the 1-per-user rule
const ACTIVE_STATUSES = ['submitted', 'under_review', 'verification_pending', 'approved', 'gift_assigned'];

// POST /api/v1/surprise
const createRequest = async (req, res) => {
    try {
        const { eventName, eventType, eventDate, description, recipientName, recipientContact, documents } = req.body;
        if (!eventName || !eventType || !eventDate || !recipientName) {
            return res.status(400).json({ error: true, msg: 'Required fields missing: eventName, eventType, eventDate, recipientName' });
        }

        // An unparseable date would otherwise surface as a Mongoose cast error and a
        // confusing 500 rather than a field-level message.
        const parsedEventDate = new Date(eventDate);
        if (Number.isNaN(parsedEventDate.getTime())) {
            return res.status(400).json({ error: true, msg: 'Please choose a valid event date' });
        }

        const cfg = await getConfigHelper();
        if (!cfg.surpriseEnabled) {
            return res.status(503).json({ error: true, msg: 'Surprise applications are temporarily closed. Please check back later.' });
        }

        // The proof requirement was only enforced in the form — the API accepted an
        // application with no documents at all.
        const documentUrls = sanitizeUrlList(documents);
        if (cfg.requireSurpriseProof && !documentUrls.length) {
            return res.status(400).json({ error: true, msg: 'Please upload at least one supporting document for verification' });
        }
        if (cfg.surpriseOneActivePerUser) {
            const active = await SurpriseRequest.findOne({
                userId: req.user.data._id,
                status: { $in: ACTIVE_STATUSES },
            }).select('_id');
            if (active) {
                return res.status(400).json({
                    error: true,
                    msg: 'You already have an active surprise application. For now only 1 application per user is allowed — please wait for it to complete or cancel it first.',
                });
            }
        }

        const doc = await SurpriseRequest.create({
            userId: req.user.data._id,
            eventName: String(eventName).trim().slice(0, 200),
            eventType,
            eventDate: parsedEventDate,
            description: description ? String(description).trim().slice(0, 2000) : undefined,
            recipientName: String(recipientName).trim().slice(0, 120),
            recipientContact: recipientContact ? String(recipientContact).trim().slice(0, 120) : undefined,
            documents: documentUrls,
            status: 'submitted',
            verificationTimeline: [{
                status: 'submitted',
                note: 'Request created and submitted by user',
            }],
        });

        // The one-per-user check above can be raced by two simultaneous submits.
        // Re-check after the write and roll back the loser rather than leaving the
        // user with two live applications.
        if (cfg.surpriseOneActivePerUser) {
            const duplicate = await SurpriseRequest.findOne({
                _id: { $ne: doc._id },
                userId: req.user.data._id,
                status: { $in: ACTIVE_STATUSES },
            }).select('_id');
            if (duplicate) {
                await SurpriseRequest.deleteOne({ _id: doc._id });
                return res.status(400).json({
                    error: true,
                    msg: 'You already have an active surprise application. For now only 1 application per user is allowed.',
                });
            }
        }

        return res.status(201).json({ error: false, data: doc });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: true, msg: 'Failed to create surprise request' });
    }
};

// GET /api/v1/surprise/my-requests
const listMyRequests = async (req, res) => {
    try {
        const data = await SurpriseRequest.find({ userId: req.user.data._id })
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
        const doc = await SurpriseRequest.findOne({ _id: req.params.id, userId: req.user.data._id })
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
        const doc = await SurpriseRequest.findOne({ _id: req.params.id, userId: req.user.data._id });
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
