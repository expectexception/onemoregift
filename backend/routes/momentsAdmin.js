const express = require('express');
const router = express.Router();
const isAdmin = require('../middleware/isAdmin');
const hasRole = require('../middleware/hasRole');
const { listMoments, getMoment, updateStatus, toggleFeature, removeMoment, removeComment, resolveReport, assignGift } = require('../controller/momentsAdminController');

router.get('/', isAdmin, hasRole('moments:read'), listMoments);
router.get('/:id', isAdmin, hasRole('moments:read'), getMoment);
router.patch('/:id/status', isAdmin, hasRole('moments:write'), updateStatus);
router.patch('/:id/feature', isAdmin, hasRole('moments:write'), toggleFeature);
router.delete('/:id', isAdmin, hasRole('moments:write'), removeMoment);
router.delete('/:id/comment/:commentId', isAdmin, hasRole('moments:write'), removeComment);
router.patch('/:id/resolve-report', isAdmin, hasRole('moments:write'), resolveReport);
router.post('/:id/assign-gift', isAdmin, hasRole('moments:write'), assignGift);

module.exports = router;
