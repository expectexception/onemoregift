const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const isAdmin = require('../middleware/isAdmin');
const isRootAdmin = require('../middleware/isRootAdmin');
const { register, login, allUsers, banUser, unBanUser, delUser, adminHome, updateUser, getUserById, getAllGiveaways, singleGiveaway, me, logout, getPublicStats, clearParticipants, clearAllJoined, changeAdminPassword } = require('../controller/adminController');
const { getWinnersForAdmin } = require('../controller/giveawayController');

const adminAuthLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 15,
    standardHeaders: true,
    legacyHeaders: false,
    skip: () => process.env.NODE_ENV === 'test',
});

// Public stats
router.get('/stats', getPublicStats);

router.post('/register', adminAuthLimiter, register);
router.post('/login', adminAuthLimiter, login);
router.get('/me', isAdmin, me);
router.post('/logout', logout);
router.patch('/change-password', isAdmin, changeAdminPassword);
router.get('/all-users', isAdmin, allUsers);
router.post('/users/ban', isAdmin, banUser);
router.post('/users/unban', isAdmin, unBanUser);
router.post('/users/del', isAdmin, delUser);
router.patch('/users/:userId', isAdmin, updateUser);
router.get('/users/:userId', isAdmin, getUserById);
router.get('/', isAdmin, adminHome)
router.get('/giveaways', isAdmin, getAllGiveaways)
router.get('/winners', isAdmin, getWinnersForAdmin)
router.get('/giveaway/:id', isAdmin, singleGiveaway)

// Database Maintenance
router.post('/maintenance/reset/:id', isAdmin, isRootAdmin, clearParticipants);
router.post('/maintenance/clear-all', isAdmin, isRootAdmin, clearAllJoined);

module.exports = router;
