const express = require('express');
const router = express.Router();
const isAdmin = require('../middleware/isAdmin');
const isRootAdmin = require('../middleware/isRootAdmin');
const { listAdmins, updateRole, toggleActive, updatePermissions, getMatrix } = require('../controller/roleController');

router.get('/matrix', isAdmin, getMatrix);
router.get('/admins', isAdmin, isRootAdmin, listAdmins);
router.patch('/admins/:id/role', isAdmin, isRootAdmin, updateRole);
router.patch('/admins/:id/activate', isAdmin, isRootAdmin, toggleActive);
router.patch('/admins/:id/permissions', isAdmin, isRootAdmin, updatePermissions);

module.exports = router;
