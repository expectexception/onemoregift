const express = require('express');
const router = express.Router();
const isAdmin = require('../middleware/isAdmin');
const isRootAdmin = require('../middleware/isRootAdmin');
const { listLogs, getLog } = require('../controller/auditLogController');

// Only super_admin (root) can view audit logs
router.get('/', isAdmin, isRootAdmin, listLogs);
router.get('/:id', isAdmin, isRootAdmin, getLog);

module.exports = router;
