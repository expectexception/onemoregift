'use strict';

const DropSubscriber = require('../model/DropSubscriber');
const Product = require('../model/Product');
const { hmacHash } = require('../utils/crypto');
const { getConfigHelper } = require('./configController');

const EMAIL_RE = /^\S+@\S+\.\S+$/;

// POST /api/v1/shop/notify-me
// Open to signed-out visitors as well, because the whole point is capturing
// interest during the reveal window before anyone has to make an account.
const subscribe = async (req, res) => {
    try {
        const email = String(req.body?.email || '').trim().toLowerCase();
        if (!email || !EMAIL_RE.test(email) || email.length > 200) {
            return res.status(400).json({ error: true, msg: 'Please enter a valid email address' });
        }

        let productId = null;
        if (req.body?.productId) {
            const product = await Product.findOne({ _id: req.body.productId, isArchived: false }).select('_id name');
            if (!product) {
                return res.status(404).json({ error: true, msg: 'Product not found' });
            }
            productId = product._id;
        }

        const emailHash = hmacHash(email);
        const existing = await DropSubscriber.findOne({ emailHash, productId });
        if (existing) {
            // Re-subscribing after being notified should work rather than error
            if (!existing.isActive || existing.notifiedAt) {
                existing.isActive = true;
                existing.notifiedAt = null;
                await existing.save();
            }
            return res.json({ error: false, msg: "You are on the list. We will email you when it opens." });
        }

        await DropSubscriber.create({
            email,
            emailHash,
            productId,
            userId: req.user?.data?._id || null,
            source: productId ? 'product' : 'shop',
        });

        return res.status(201).json({ error: false, msg: "You are on the list. We will email you when it opens." });
    } catch (err) {
        // A racing duplicate insert is a success from the customer's point of view
        if (err?.code === 11000) {
            return res.json({ error: false, msg: "You are on the list. We will email you when it opens." });
        }
        console.error(err);
        return res.status(500).json({ error: true, msg: 'Could not add you to the list. Please try again.' });
    }
};

// GET /api/v1/admin/drop-subscribers
const listSubscribers = async (req, res) => {
    try {
        const { page = 1, limit = 50, pending } = req.query;
        const query = { isActive: true };
        if (pending === '1') query.notifiedAt = null;

        const skip = (Number(page) - 1) * Number(limit);
        const [data, total, waiting] = await Promise.all([
            DropSubscriber.find(query)
                .populate('productId', 'name')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(Number(limit)),
            DropSubscriber.countDocuments(query),
            DropSubscriber.countDocuments({ isActive: true, notifiedAt: null }),
        ]);

        return res.json({ error: false, data, total, waiting, page: Number(page) });
    } catch (err) {
        return res.status(500).json({ error: true, msg: 'Failed to fetch the notify list' });
    }
};

// POST /api/v1/admin/drop-subscribers/notify
// Emails everyone who has not been told about this drop yet. Sends are
// fire-and-forget so one bad address cannot stall the batch.
const notifySubscribers = async (req, res) => {
    try {
        const { sendEmail } = require('./authController');
        const cfg = await getConfigHelper();

        const pending = await DropSubscriber.find({ isActive: true, notifiedAt: null }).populate('productId', 'name');
        if (!pending.length) {
            return res.json({ error: false, msg: 'Nobody is waiting to be notified', sent: 0 });
        }

        const custom = String(req.body?.message || '').trim();
        const opensAt = cfg.saleOpensAt
            ? new Date(cfg.saleOpensAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' })
            : null;

        let sent = 0;
        for (const sub of pending) {
            const productLine = sub.productId?.name
                ? `<p><b>${sub.productId.name}</b> is part of this drop.</p>`
                : '';
            const body = custom
                ? `<p>${custom}</p>`
                : `<p>The next OneMoreGift drop is opening${opensAt ? ` on <b>${opensAt} IST</b>` : ' shortly'}.</p>`
                  + `${productLine}<p>Quantities are limited, so be quick.</p>`;

            try {
                await sendEmail({
                    to: sub.email,
                    subject: 'The next drop is opening | OneMoreGift',
                    html: body,
                });
                sub.notifiedAt = new Date();
                await sub.save();
                sent++;
            } catch (err) {
                console.error(`[DropNotify] Failed for subscriber ${sub._id}:`, err.message);
            }
        }

        return res.json({ error: false, msg: `Notified ${sent} of ${pending.length} subscribers`, sent, total: pending.length });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: true, msg: 'Failed to send notifications' });
    }
};

// DELETE /api/v1/admin/drop-subscribers/:id
const removeSubscriber = async (req, res) => {
    try {
        const doc = await DropSubscriber.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
        if (!doc) return res.status(404).json({ error: true, msg: 'Subscriber not found' });
        return res.json({ error: false, msg: 'Removed from the list' });
    } catch (err) {
        return res.status(500).json({ error: true, msg: 'Failed to remove subscriber' });
    }
};

module.exports = { subscribe, listSubscribers, notifySubscribers, removeSubscriber };
