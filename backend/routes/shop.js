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

// Public endpoints
router.get('/products', listProducts);
router.get('/products/categories', getCategories);
router.get('/products/:id', getProduct);
router.get('/stores', listStores);

// Auth protected endpoints
router.post('/orders', isAuth, createOrder);
router.post('/orders/simulate-payment', isAuth, simulatePayment);
router.get('/orders', isAuth, listMyOrders);
router.get('/orders/:id', isAuth, getMyOrder);
router.patch('/orders/:id/cancel', isAuth, cancelMyOrder);

module.exports = router;
