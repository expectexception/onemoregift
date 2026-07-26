const express = require('express');
const router = express.Router();
const isAuth = require('../middleware/isAuth');
const { createMoment, listGallery, listMyMoments, reactToMoment, reportMoment, addComment, editComment, deleteComment } = require('../controller/momentsUserController');

router.get('/gallery', listGallery);
router.post('/', isAuth, createMoment);
router.get('/my-moments', isAuth, listMyMoments);
router.post('/:id/react', isAuth, reactToMoment);
router.post('/:id/report', isAuth, reportMoment);
router.post('/:id/comment', isAuth, addComment);
router.patch('/:id/comment/:commentId', isAuth, editComment);
router.delete('/:id/comment/:commentId', isAuth, deleteComment);

module.exports = router;
