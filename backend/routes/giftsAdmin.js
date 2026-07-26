const express = require('express');
const router = express.Router();
const isAdmin = require('../middleware/isAdmin');
const hasRole = require('../middleware/hasRole');
const { listGifts, getGift, createGift, updateGift, deleteGift } = require('../controller/giftController');

router.get('/', isAdmin, hasRole('gifts:read'), listGifts);
router.get('/:id', isAdmin, hasRole('gifts:read'), getGift);
router.post('/', isAdmin, hasRole('gifts:write'), createGift);
router.patch('/:id', isAdmin, hasRole('gifts:write'), updateGift);
router.delete('/:id', isAdmin, hasRole('gifts:write'), deleteGift);

module.exports = router;
