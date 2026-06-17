const express = require('express');
const router = express.Router();
const isAdmin = require('../middleware/isAdmin');
const hasRole = require('../middleware/hasRole');
const { listStores, getStore, createStore, updateStore, deleteStore } = require('../controller/storeController');

router.get('/', isAdmin, hasRole('stores:read'), listStores);
router.get('/:id', isAdmin, hasRole('stores:read'), getStore);
router.post('/', isAdmin, hasRole('stores:write'), createStore);
router.patch('/:id', isAdmin, hasRole('stores:write'), updateStore);
router.delete('/:id', isAdmin, hasRole('stores:write'), deleteStore);

module.exports = router;
