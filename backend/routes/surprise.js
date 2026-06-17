const express = require('express');
const router = express.Router();
const isAuth = require('../middleware/isAuth');
const { createRequest, listMyRequests, getMyRequest, cancelMyRequest } = require('../controller/surpriseUserController');

router.post('/', isAuth, createRequest);
router.get('/my-requests', isAuth, listMyRequests);
router.get('/:id', isAuth, getMyRequest);
router.patch('/:id/cancel', isAuth, cancelMyRequest);

module.exports = router;
