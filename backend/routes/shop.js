const express = require('express');
const router = express.Router();
const isAuth = require('../middleware/isAuth');
const {
    getCategories,
    listProducts,
    getProduct,
    createOrder,
    submitPaymentProof,
    simulatePayment,
    listMyOrders,
    getMyOrder,
    cancelMyOrder
} = require('../controller/shopUserController');
const { listStores } = require('../controller/storeController');
const { subscribe } = require('../controller/dropSubscriberController');
const { validateCoupon } = require('../controller/couponController');
const { getConfigHelper } = require('../controller/configController');

// Master switch: browsing stays available, but checkout/order actions are blocked
// when the shop is taken offline (admin panel toggle, env ENABLE_SHOP as default).
const requireShopEnabled = async (req, res, next) => {
    try {
        const cfg = await getConfigHelper();
        if (!cfg.shopEnabled) {
            return res.status(503).json({ error: true, msg: 'Shop checkout is temporarily unavailable' });
        }
        next();
    } catch (err) {
        return res.status(500).json({ error: true, msg: 'Failed to check shop availability' });
    }
};

// Public endpoints
router.get('/products', listProducts);
// Open to signed-out visitors: capturing interest during the reveal window is the point
router.post('/notify-me', subscribe);
router.get('/products/categories', getCategories);
router.get('/products/:id', getProduct);
router.get('/stores', listStores);

// Auth protected endpoints
router.post('/coupons/validate', isAuth, validateCoupon);
router.post('/orders', isAuth, requireShopEnabled, createOrder);
router.post('/orders/simulate-payment', isAuth, requireShopEnabled, simulatePayment);
router.post('/orders/:id/payment-proof', isAuth, requireShopEnabled, submitPaymentProof);
router.get('/orders', isAuth, listMyOrders);
router.get('/orders/:id', isAuth, getMyOrder);
router.patch('/orders/:id/cancel', isAuth, cancelMyOrder);

module.exports = router;
