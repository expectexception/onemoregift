const express = require('express');
const router = express.Router();
const isAdmin = require('../middleware/isAdmin');
const hasRole = require('../middleware/hasRole');
const { listOrders, getOrder, updateOrderStatus, verifyPickup, refundOrder, getOrderStats } = require('../controller/orderController');

router.get('/stats', isAdmin, hasRole('orders:read'), getOrderStats);
router.get('/', isAdmin, hasRole('orders:read'), listOrders);
router.get('/:id', isAdmin, hasRole('orders:read'), getOrder);
router.patch('/:id/status', isAdmin, hasRole('orders:write'), updateOrderStatus);
router.post('/:id/verify-pickup', isAdmin, hasRole('orders:write'), verifyPickup);
router.post('/:id/refund', isAdmin, hasRole('orders:write'), refundOrder);

module.exports = router;
