'use strict';

// Best-effort order lifecycle emails. Every send is fire-and-forget — an email
// failure must never fail the order flow itself.

const Users = require('../model/Users');

// Lazy require to avoid a circular dependency at module load time
// (authController requires models which are also used elsewhere).
let _mailer = null;
const mailer = () => {
    if (!_mailer) _mailer = require('../controller/authController');
    return _mailer;
};

const money = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

const sendOrderEmail = async (userId, { subject, title, message, code = '' }) => {
    try {
        const user = await Users.findById(userId).select('email name');
        if (!user?.email) return;
        const { sendEmail, generateEmailTemplate } = mailer();
        await sendEmail({
            to: user.email,
            subject,
            html: generateEmailTemplate(title, message, code),
        });
    } catch (err) {
        console.error('[OrderEmail] Failed:', err.message);
    }
};

// Order placed — content depends on the chosen payment method
const emailOrderPlaced = (order, method) => {
    const base = `Your order <b>${order.orderNumber}</b> (${money(order.total)}) has been placed.`;
    let message;
    let code = '';
    if (method === 'cod') {
        message = `${base} Pay in cash when you collect your items. Show the pickup code below at the store.`;
        code = order.pickupCode || '';
    } else if (method === 'qr') {
        message = `${base} Complete your UPI payment and upload the screenshot from My Orders — we verify it and confirm your order.`;
    } else {
        message = `${base} Complete the payment to receive your pickup code.`;
    }
    return sendOrderEmail(order.userId, {
        subject: `Order ${order.orderNumber} placed — OneMoreGift`,
        title: 'Order Placed 🎁',
        message,
        code,
    });
};

const emailPaymentVerified = (order) => sendOrderEmail(order.userId, {
    subject: `Payment confirmed for ${order.orderNumber} — OneMoreGift`,
    title: 'Payment Confirmed ✅',
    message: `We verified your payment for order <b>${order.orderNumber}</b> (${money(order.total)}). Show the pickup code below at the store during the Mon–Tue pickup window.`,
    code: order.pickupCode || '',
});

const emailPaymentRejected = (order) => sendOrderEmail(order.userId, {
    subject: `Payment proof issue for ${order.orderNumber} — OneMoreGift`,
    title: 'Payment Proof Rejected ⚠️',
    message: `We couldn't verify the payment proof for order <b>${order.orderNumber}</b>.<br/><br/>Reason: ${order.paymentRejectedReason || 'Not specified'}.<br/><br/>You can re-submit the correct screenshot from My Orders.`,
});

const emailOrderReady = (order) => sendOrderEmail(order.userId, {
    subject: `Order ${order.orderNumber} is ready for pickup — OneMoreGift`,
    title: 'Ready For Pickup 📦',
    message: `Your order <b>${order.orderNumber}</b> is packed and ready. Show the pickup code below at the store to collect it.`,
    code: order.pickupCode || '',
});

const emailOrderAutoCancelled = (order) => sendOrderEmail(order.userId, {
    subject: `Order ${order.orderNumber} cancelled — OneMoreGift`,
    title: 'Order Cancelled',
    message: `Your order <b>${order.orderNumber}</b> was cancelled because the payment was not completed in time. The items are back in stock — you can order again any time.`,
});

module.exports = {
    emailOrderPlaced,
    emailPaymentVerified,
    emailPaymentRejected,
    emailOrderReady,
    emailOrderAutoCancelled,
};
