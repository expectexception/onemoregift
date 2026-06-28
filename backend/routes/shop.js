const express = require('express');
const router = express.Router();
const isAuth = require('../middleware/isAuth');
const {
    getCategories,
    listProducts,
    getProduct,
    createOrder,
    simulatePayment,
    listMyOrders,
    getMyOrder,
    cancelMyOrder
} = require('../controller/shopUserController');
const { listStores } = require('../controller/storeController');

// Master switch — browsing stays available, but checkout/order actions are blocked
// when the shop is taken offline via ENABLE_SHOP=false.
const requireShopEnabled = (req, res, next) => {
    if ((process.env.ENABLE_SHOP || 'true').toLowerCase() === 'false') {
        return res.status(503).json({ error: true, msg: 'Shop checkout is temporarily unavailable' });
    }
    next();
};

// Public endpoints
router.get('/products', listProducts);
router.get('/products/categories', getCategories);
router.get('/products/:id', getProduct);
router.get('/stores', listStores);

// Auth protected endpoints
router.post('/orders', isAuth, requireShopEnabled, createOrder);
router.post('/orders/simulate-payment', isAuth, requireShopEnabled, simulatePayment);
router.get('/orders', isAuth, listMyOrders);
router.get('/orders/:id', isAuth, getMyOrder);
router.patch('/orders/:id/cancel', isAuth, cancelMyOrder);

module.exports = router;
