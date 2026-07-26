'use strict';

const express = require('express');
const router = express.Router();
const { getPublicConfig } = require('../controller/configController');

router.get('/', getPublicConfig);

module.exports = router;
