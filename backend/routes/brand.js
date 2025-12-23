const express = require('express');
const router = express.Router();
const brandCtrl = require('../controllers/brand');
const { protect, admin } = require('../middlewares/auth');

// Public routes
router.get('/', brandCtrl.getBrands);
router.get('/slug/:slug', brandCtrl.getBrandBySlug);
router.get('/:id', brandCtrl.getBrandById);

// Protected admin routes
router.post('/', protect, admin, brandCtrl.createBrand);
router.put('/:id', protect, admin, brandCtrl.updateBrand);
router.delete('/:id', protect, admin, brandCtrl.deleteBrand);

module.exports = router;

