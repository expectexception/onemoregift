'use strict';

const HappyMoment = require('../model/HappyMoment');

// POST /api/v1/happy-moment
const createMoment = async (req, res) => {
    try {
        const { caption, description, media, proofs, publishNow } = req.body;
        if (!caption) {
            return res.status(400).json({ error: true, msg: 'Caption is required' });
        }

        const doc = await HappyMoment.create({
            userId: req.user.id,
            caption,
            description,
            media: media || [],
            proofs: proofs || [],
            status: publishNow ? 'submitted' : 'draft',
        });

        return res.status(201).json({ error: false, data: doc });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: true, msg: 'Failed to create happy moment' });
    }
};

// GET /api/v1/happy-moment/gallery
const listGallery = async (req, res) => {
    try {
        const { page = 1, limit = 20 } = req.query;
        const skip = (Number(page) - 1) * Number(limit);
        const [data, total] = await Promise.all([
            HappyMoment.find({ isPublished: true })
                .populate('userId', 'name profilePic')
                .populate('assignedGift', 'name')
                .sort({ isFeatured: -1, createdAt: -1 })
                .skip(skip)
                .limit(Number(limit)),
            HappyMoment.countDocuments({ isPublished: true }),
        ]);

        return res.json({ error: false, data, total });
    } catch (err) {
        return res.status(500).json({ error: true, msg: 'Failed to fetch gallery' });
    }
};

// GET /api/v1/happy-moment/my-moments
const listMyMoments = async (req, res) => {
    try {
        const data = await HappyMoment.find({ userId: req.user.id })
            .populate('assignedGift', 'name')
            .sort({ createdAt: -1 });
        return res.json({ error: false, data });
    } catch (err) {
        return res.status(500).json({ error: true, msg: 'Failed to fetch your moments' });
    }
};

// POST /api/v1/happy-moment/:id/react
const reactToMoment = async (req, res) => {
    try {
        const { type = 'like' } = req.body;
        const doc = await HappyMoment.findById(req.params.id);
        if (!doc) return res.status(404).json({ error: true, msg: 'Moment not found' });

        const existIndex = doc.reactions.findIndex(r => r.userId.toString() === req.user.id);
        if (existIndex > -1) {
            // Toggle off if same type, else update
            if (doc.reactions[existIndex].type === type) {
                doc.reactions.splice(existIndex, 1);
            } else {
                doc.reactions[existIndex].type = type;
            }
        } else {
            doc.reactions.push({ userId: req.user.id, type });
        }

        await doc.save();
        return res.json({ error: false, data: doc.reactions });
    } catch (err) {
        return res.status(500).json({ error: true, msg: 'Failed to update reaction' });
    }
};

// POST /api/v1/happy-moment/:id/report
const reportMoment = async (req, res) => {
    try {
        const { reason } = req.body;
        if (!reason) return res.status(400).json({ error: true, msg: 'Reason is required' });

        const doc = await HappyMoment.findById(req.params.id);
        if (!doc) return res.status(404).json({ error: true, msg: 'Moment not found' });

        const alreadyReported = doc.reports.some(r => r.userId?.toString() === req.user.id);
        if (alreadyReported) {
            return res.status(400).json({ error: true, msg: 'You have already reported this moment' });
        }

        doc.reports.push({ userId: req.user.id, reason });
        // Automatically hide or flag if reports count exceeds threshold
        if (doc.reports.length >= 5) {
            doc.status = 'under_review';
            doc.isPublished = false;
        }

        await doc.save();
        return res.json({ error: false, msg: 'Moment reported' });
    } catch (err) {
        return res.status(500).json({ error: true, msg: 'Failed to submit report' });
    }
};

module.exports = { createMoment, listGallery, listMyMoments, reactToMoment, reportMoment };
