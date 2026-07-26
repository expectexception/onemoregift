const express = require('express');
const router = express.Router();
const isAdmin = require('../middleware/isAdmin');
const hasRole = require('../middleware/hasRole');
const { listProducts, getProduct, createProduct, updateProduct, archiveProduct, deleteProduct, adjustStock, getCategories } = require('../controller/productController');

router.get('/categories', isAdmin, hasRole('products:read'), getCategories);
router.get('/', isAdmin, hasRole('products:read'), listProducts);
router.get('/:id', isAdmin, hasRole('products:read'), getProduct);
router.post('/', isAdmin, hasRole('products:write'), createProduct);
router.patch('/:id', isAdmin, hasRole('products:write'), updateProduct);
router.patch('/:id/stock', isAdmin, hasRole('products:write'), adjustStock);
router.patch('/:id/archive', isAdmin, hasRole('products:write'), archiveProduct);
router.delete('/:id', isAdmin, hasRole('products:write'), deleteProduct);

module.exports = router;
