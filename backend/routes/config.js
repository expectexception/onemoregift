'use strict';

const express = require('express');
const router = express.Router();
const { publicCache } = require('../middleware/publicCache');
const { getPublicConfig } = require('../controller/configController');

router.get('/', publicCache(), getPublicConfig);

module.exports = router;
