const express = require('express');
const router = express.Router();
const productCtrl = require('../controllers/product');
const { createProductRules, updateProductRules } = require('../validators/productvalidators');
const upload = require('../config/multer');
const { protect, admin } = require('../middlewares/auth');

// File upload must come before validation middleware (express-validator doesn't work with multipart/form-data)
router.post('/', protect, admin, upload.single('image'), productCtrl.createProduct);
router.get('/', productCtrl.getProducts);
router.get('/:id', productCtrl.getProductById);
// File upload must come before validation middleware
router.put('/:id', protect, admin, upload.single('image'), productCtrl.updateProduct);
router.delete('/:id', protect, admin, productCtrl.deleteProduct);

module.exports = router;
