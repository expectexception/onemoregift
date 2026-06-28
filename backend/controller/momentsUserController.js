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
            userId: req.user.data._id,
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
                .populate('comments.userId', 'name profilePic')
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
        const data = await HappyMoment.find({ userId: req.user.data._id })
            .populate('userId', 'name profilePic')
            .populate('comments.userId', 'name profilePic')
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
        const userId = req.user.data._id;

        // Atomic ops to avoid read-modify-write races producing duplicate/lost reactions
        // 1. Toggle off if the same reaction already exists
        let doc = await HappyMoment.findOneAndUpdate(
            { _id: req.params.id, reactions: { $elemMatch: { userId, type } } },
            { $pull: { reactions: { userId } } },
            { new: true }
        );
        if (!doc) {
            // 2. Update type if a different reaction from this user exists
            doc = await HappyMoment.findOneAndUpdate(
                { _id: req.params.id, 'reactions.userId': userId },
                { $set: { 'reactions.$[r].type': type } },
                { new: true, arrayFilters: [{ 'r.userId': userId }] }
            );
        }
        if (!doc) {
            // 3. No existing reaction from this user — push a new one
            doc = await HappyMoment.findOneAndUpdate(
                { _id: req.params.id },
                { $push: { reactions: { userId, type } } },
                { new: true }
            );
        }
        if (!doc) return res.status(404).json({ error: true, msg: 'Moment not found' });

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

        const alreadyReported = doc.reports.some(r => r.userId?.toString() === req.user.data._id);
        if (alreadyReported) {
            return res.status(400).json({ error: true, msg: 'You have already reported this moment' });
        }

        doc.reports.push({ userId: req.user.data._id, reason });
        // Automatically hide or flag if reports count exceeds threshold
        const reportThreshold = Number(process.env.MOMENT_REPORT_AUTOHIDE_THRESHOLD) || 5;
        if (doc.reports.length >= reportThreshold) {
            doc.status = 'under_review';
            doc.isPublished = false;
        }

        await doc.save();
        return res.json({ error: false, msg: 'Moment reported' });
    } catch (err) {
        return res.status(500).json({ error: true, msg: 'Failed to submit report' });
    }
};

// POST /api/v1/happy-moment/:id/comment
const addComment = async (req, res) => {
    try {
        const { text } = req.body;
        if (!text || !text.trim()) {
            return res.status(400).json({ error: true, msg: 'Comment text is required' });
        }

        const doc = await HappyMoment.findById(req.params.id);
        if (!doc) {
            return res.status(404).json({ error: true, msg: 'Moment not found' });
        }

        doc.comments.push({
            userId: req.user.data._id,
            text: text.trim()
        });

        await doc.save();

        const populatedDoc = await HappyMoment.findById(req.params.id)
            .populate('comments.userId', 'name profilePic');

        return res.json({ error: false, data: populatedDoc.comments });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: true, msg: 'Failed to add comment' });
    }
};

// PATCH /api/v1/happy-moment/:id/comment/:commentId
const editComment = async (req, res) => {
    try {
        const { text } = req.body;
        if (!text || !text.trim()) {
            return res.status(400).json({ error: true, msg: 'Comment text is required' });
        }

        const doc = await HappyMoment.findById(req.params.id);
        if (!doc) {
            return res.status(404).json({ error: true, msg: 'Moment not found' });
        }

        const comment = doc.comments.id(req.params.commentId);
        if (!comment) {
            return res.status(404).json({ error: true, msg: 'Comment not found' });
        }

        if (comment.userId.toString() !== req.user.data._id) {
            return res.status(403).json({ error: true, msg: 'Unauthorized to edit this comment' });
        }

        comment.text = text.trim();
        comment.editedAt = new Date();
        await doc.save();

        const populatedDoc = await HappyMoment.findById(req.params.id)
            .populate('comments.userId', 'name profilePic');

        return res.json({ error: false, data: populatedDoc.comments });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: true, msg: 'Failed to edit comment' });
    }
};

// DELETE /api/v1/happy-moment/:id/comment/:commentId
const deleteComment = async (req, res) => {
    try {
        const doc = await HappyMoment.findById(req.params.id);
        if (!doc) {
            return res.status(404).json({ error: true, msg: 'Moment not found' });
        }

        const comment = doc.comments.id(req.params.commentId);
        if (!comment) {
            return res.status(404).json({ error: true, msg: 'Comment not found' });
        }

        if (comment.userId.toString() !== req.user.data._id) {
            return res.status(403).json({ error: true, msg: 'Unauthorized to delete this comment' });
        }

        doc.comments.pull(req.params.commentId);
        await doc.save();

        const populatedDoc = await HappyMoment.findById(req.params.id)
            .populate('comments.userId', 'name profilePic');

        return res.json({ error: false, data: populatedDoc.comments });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: true, msg: 'Failed to delete comment' });
    }
};

module.exports = { createMoment, listGallery, listMyMoments, reactToMoment, reportMoment, addComment, editComment, deleteComment };
