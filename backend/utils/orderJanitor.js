'use strict';

// Auto-cancels stale unpaid orders and restores their reserved stock.
// Without this, every abandoned "pending" order locked its stock forever,
// a real problem for the limited-quantity weekly drops.
//
// Orders with paymentStatus 'verification_pending' are NEVER auto-cancelled:
// the user already paid and is waiting on admin verification.

const Order = require('../model/Order');
const { restoreStock } = require('../controller/orderController');
const { getConfigHelper } = require('../controller/configController');
const { emailOrderAutoCancelled } = require('./orderEmails');

const RUN_INTERVAL_MS = 10 * 60 * 1000; // every 10 minutes

const cancelStaleOrders = async () => {
    const cfg = await getConfigHelper();
    const hours = Number(cfg.orderAutoCancelHours);
    if (!Number.isFinite(hours) || hours <= 0) return { cancelled: 0 };

    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    const stale = await Order.find({
        status: 'pending',
        paymentStatus: { $in: ['pending', 'failed'] },
        createdAt: { $lt: cutoff },
    });

    let cancelled = 0;
    for (const order of stale) {
        try {
            await restoreStock(order);
            order.status = 'cancelled';
            order.cancelledAt = new Date();
            order.cancelledReason = `Auto-cancelled: payment not completed within ${hours}h`;
            await order.save();
            cancelled++;
            console.log(`[OrderJanitor] Auto-cancelled ${order.orderNumber} (unpaid > ${hours}h)`);
            emailOrderAutoCancelled(order).catch(() => {});
        } catch (err) {
            console.error(`[OrderJanitor] Failed to cancel ${order._id}:`, err.message);
        }
    }
    return { cancelled };
};

let _timer = null;

const startOrderJanitor = () => {
    if (_timer) return;
    // First pass shortly after boot, then on the interval
    setTimeout(() => cancelStaleOrders().catch(err => console.error('[OrderJanitor]', err.message)), 30 * 1000);
    _timer = setInterval(() => cancelStaleOrders().catch(err => console.error('[OrderJanitor]', err.message)), RUN_INTERVAL_MS);
    _timer.unref?.();
    console.log('[OrderJanitor] Started (checks every 10 min)');
};

module.exports = { startOrderJanitor, cancelStaleOrders };
