const express = require('express');
const router = express.Router();
const isAdmin = require('../middleware/isAdmin');
const hasRole = require('../middleware/hasRole');
const { listRequests, getRequest, updateStatus, assignGift, flagFraud, getStats } = require('../controller/surpriseAdminController');

router.get('/stats', isAdmin, hasRole('surprise:read'), getStats);
router.get('/', isAdmin, hasRole('surprise:read'), listRequests);
router.get('/:id', isAdmin, hasRole('surprise:read'), getRequest);
router.patch('/:id/status', isAdmin, hasRole('surprise:write'), updateStatus);
router.post('/:id/assign-gift', isAdmin, hasRole('surprise:write'), assignGift);
router.patch('/:id/flag', isAdmin, hasRole('surprise:write'), flagFraud);

module.exports = router;
