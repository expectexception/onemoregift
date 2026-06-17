const express = require('express');
const router = express.Router();
const isAuth = require('../middleware/isAuth');
const { createMoment, listGallery, listMyMoments, reactToMoment, reportMoment } = require('../controller/momentsUserController');

router.get('/gallery', listGallery);
router.post('/', isAuth, createMoment);
router.get('/my-moments', isAuth, listMyMoments);
router.post('/:id/react', isAuth, reactToMoment);
router.post('/:id/report', isAuth, reportMoment);

module.exports = router;
