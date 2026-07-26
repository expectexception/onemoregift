'use strict';

const Order = require('../model/Order');
const Users = require('../model/Users');
const DropSubscriber = require('../model/DropSubscriber');

// Anything starting with these can be interpreted as a formula by Excel/Sheets,
// so a value like "=cmd|..." pasted into a name field would execute on open.
const escapeCell = (value) => {
    if (value === null || value === undefined) return '';
    let str = String(value);
    if (/^[=+\-@\t\r]/.test(str)) str = `'${str}`;
    if (/[",\n\r]/.test(str)) str = `"${str.replace(/"/g, '""')}"`;
    return str;
};

const toCsv = (columns, rows) => {
    const head = columns.map(c => escapeCell(c.label)).join(',');
    const body = rows.map(row => columns.map(c => escapeCell(c.value(row))).join(','));
    // BOM so Excel opens UTF-8 (rupee signs, Indian names) correctly
    return '﻿' + [head, ...body].join('\r\n');
};

const send = (res, filename, csv) => {
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.send(csv);
};

const istDate = (value) => (value
    ? new Date(value).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'short', timeStyle: 'short' })
    : '');

// GET /api/v1/admin/export/orders?from=&to=&status=&paymentStatus=
const exportOrders = async (req, res) => {
    try {
        const { from, to, status, paymentStatus } = req.query;
        const query = {};
        if (status) query.status = status;
        if (paymentStatus) query.paymentStatus = paymentStatus;
        if (from || to) {
            query.createdAt = {};
            if (from) query.createdAt.$gte = new Date(from);
            if (to) {
                const end = new Date(to);
                end.setHours(23, 59, 59, 999);
                query.createdAt.$lte = end;
            }
        }

        const orders = await Order.find(query)
            .populate('userId', 'name email phone')
            .populate('pickupStoreId', 'name city')
            .sort({ createdAt: -1 })
            .limit(5000);

        const columns = [
            { label: 'Order Number', value: o => o.orderNumber },
            { label: 'Placed On (IST)', value: o => istDate(o.createdAt) },
            { label: 'Customer', value: o => o.userId?.name || '' },
            { label: 'Email', value: o => o.userId?.email || '' },
            { label: 'Phone', value: o => o.userId?.phone || '' },
            { label: 'Items', value: o => (o.items || []).map(i => `${i.productName}${i.variantName ? ` (${i.variantName})` : ''} x${i.quantity}`).join(' | ') },
            { label: 'Subtotal', value: o => o.subtotal },
            { label: 'Discount', value: o => o.discount || 0 },
            { label: 'Total', value: o => o.total },
            { label: 'Coupon', value: o => o.couponCode || '' },
            { label: 'Payment Method', value: o => o.paymentMethod || '' },
            { label: 'Payment Status', value: o => o.paymentStatus },
            { label: 'Payment Reference', value: o => o.paymentReference || '' },
            { label: 'Paid At (IST)', value: o => istDate(o.paidAt) },
            { label: 'Order Status', value: o => o.status },
            { label: 'Pickup Store', value: o => o.pickupStoreId?.name || '' },
            { label: 'Scheduled Pickup (IST)', value: o => istDate(o.scheduledPickupTime) },
            { label: 'Collected At (IST)', value: o => istDate(o.pickupVerifiedAt) },
            { label: 'Pickup Code', value: o => o.pickupCode || '' },
            { label: 'Customer Note', value: o => o.customerNote || '' },
            { label: 'Admin Note', value: o => o.adminNote || '' },
        ];

        const stamp = new Date().toISOString().slice(0, 10);
        return send(res, `omg-orders-${stamp}.csv`, toCsv(columns, orders));
    } catch (err) {
        console.error('[Export] orders failed:', err.message);
        return res.status(500).json({ error: true, msg: 'Failed to export orders' });
    }
};

// GET /api/v1/admin/export/users
const exportUsers = async (req, res) => {
    try {
        const users = await Users.find({}).select('-password -resetToken -loginOtp').sort({ createdAt: -1 }).limit(10000);

        const columns = [
            { label: 'Username', value: u => u.name || '' },
            { label: 'Full Name', value: u => u.fullName || '' },
            { label: 'Email', value: u => u.email || '' },
            { label: 'Phone', value: u => u.phone || '' },
            { label: 'Verified', value: u => (u.isVerified === false ? 'No' : 'Yes') },
            { label: 'Blocked', value: u => (u.isBlocked ? 'Yes' : 'No') },
            { label: 'Default Address', value: u => u.address || '' },
            { label: 'Joined (IST)', value: u => istDate(u.createdAt) },
        ];

        const stamp = new Date().toISOString().slice(0, 10);
        return send(res, `omg-users-${stamp}.csv`, toCsv(columns, users));
    } catch (err) {
        console.error('[Export] users failed:', err.message);
        return res.status(500).json({ error: true, msg: 'Failed to export users' });
    }
};

// GET /api/v1/admin/export/subscribers
const exportSubscribers = async (req, res) => {
    try {
        const subs = await DropSubscriber.find({ isActive: true }).populate('productId', 'name').sort({ createdAt: -1 }).limit(10000);
        const columns = [
            { label: 'Email', value: s => s.email || '' },
            { label: 'Product', value: s => s.productId?.name || 'Any drop' },
            { label: 'Signed Up (IST)', value: s => istDate(s.createdAt) },
            { label: 'Notified (IST)', value: s => istDate(s.notifiedAt) },
        ];
        const stamp = new Date().toISOString().slice(0, 10);
        return send(res, `omg-notify-list-${stamp}.csv`, toCsv(columns, subs));
    } catch (err) {
        console.error('[Export] subscribers failed:', err.message);
        return res.status(500).json({ error: true, msg: 'Failed to export the notify list' });
    }
};

module.exports = { exportOrders, exportUsers, exportSubscribers, toCsv, escapeCell };
