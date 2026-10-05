const express = require('express');
const router = express.Router();
const { publicCache } = require('../middleware/publicCache');
const rateLimit = require('express-rate-limit');
const isAdmin = require('../middleware/isAdmin');
const isRootAdmin = require('../middleware/isRootAdmin');
const hasRole = require('../middleware/hasRole');
const { register, login, verifyAdminOtp, allUsers, banUser, unBanUser, delUser, adminHome, updateUser, getUserById, getAllGiveaways, singleGiveaway, me, logout, getPublicStats, clearParticipants, clearAllJoined, changeAdminPassword, getDbStatus, downloadBackup } = require('../controller/adminController');
const { getWinnersForAdmin } = require('../controller/giveawayController');
const { getAdminConfig, updateConfig } = require('../controller/configController');

const adminAuthLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 15,
    standardHeaders: true,
    legacyHeaders: false,
    skip: () => process.env.NODE_ENV === 'test',
});

// Public stats
router.get('/stats', publicCache(), getPublicStats);

router.post('/register', adminAuthLimiter, register);
router.post('/login', adminAuthLimiter, login);
router.post('/verify-otp', adminAuthLimiter, verifyAdminOtp);
router.get('/me', isAdmin, me);
router.post('/logout', logout);
router.patch('/change-password', isAdmin, changeAdminPassword);
router.get('/all-users', isAdmin, hasRole('users:read'), allUsers);
router.post('/users/ban', isAdmin, hasRole('users:write'), banUser);
router.post('/users/unban', isAdmin, hasRole('users:write'), unBanUser);
router.post('/users/del', isAdmin, hasRole('users:delete'), delUser);
router.patch('/users/:userId', isAdmin, hasRole('users:write'), updateUser);
router.get('/users/:userId', isAdmin, hasRole('users:read'), getUserById);
router.get('/', isAdmin, adminHome)
router.get('/giveaways', isAdmin, getAllGiveaways)
router.get('/winners', isAdmin, getWinnersForAdmin)
router.get('/giveaway/:id', isAdmin, singleGiveaway)

// Config management
// Coupons
const { listCoupons, createCoupon, updateCoupon, deleteCoupon } = require('../controller/couponController');
router.get('/coupons', isAdmin, hasRole('coupons:read'), listCoupons);
router.post('/coupons', isAdmin, hasRole('coupons:write'), createCoupon);
router.patch('/coupons/:id', isAdmin, hasRole('coupons:write'), updateCoupon);
router.delete('/coupons/:id', isAdmin, hasRole('coupons:write'), deleteCoupon);

// CSV exports
const { exportOrders, exportUsers, exportSubscribers } = require('../controller/exportController');
router.get('/export/orders', isAdmin, hasRole('exports:read'), exportOrders);
router.get('/export/users', isAdmin, hasRole('exports:read'), exportUsers);
router.get('/export/subscribers', isAdmin, hasRole('exports:read'), exportSubscribers);

// Drop notify list
const { listSubscribers, notifySubscribers, removeSubscriber } = require('../controller/dropSubscriberController');
router.get('/drop-subscribers', isAdmin, hasRole('users:read'), listSubscribers);
router.post('/drop-subscribers/notify', isAdmin, hasRole('users:write'), notifySubscribers);
router.delete('/drop-subscribers/:id', isAdmin, hasRole('users:write'), removeSubscriber);

router.get('/config', isAdmin, hasRole('config:read'), getAdminConfig);
router.post('/config', isAdmin, hasRole('config:write'), updateConfig);

// Database Maintenance
router.post('/maintenance/reset/:id', isAdmin, isRootAdmin, clearParticipants);
router.post('/maintenance/clear-all', isAdmin, isRootAdmin, clearAllJoined);
router.get('/maintenance/db-status', isAdmin, getDbStatus);
router.get('/maintenance/backup', isAdmin, isRootAdmin, downloadBackup);

module.exports = router;

