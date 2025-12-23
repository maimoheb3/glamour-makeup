const Brand = require('../models/brand');

// Create brand
exports.createBrand = async (req, res) => {
  try {
    const { name, description, logo } = req.body;
    
    // Generate slug
    const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    
    const brand = new Brand({ name, slug, description, logo });
    await brand.save();
    return res.status(201).json(brand);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: 'Brand name or slug already exists' });
    }
    return res.status(400).json({ message: err.message });
  }
};

// Get all brands
exports.getBrands = async (req, res) => {
  try {
    const brands = await Brand.find({ isActive: true }).sort({ name: 1 });
    return res.json(brands);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// Get brand by ID
exports.getBrandById = async (req, res) => {
  try {
    const brand = await Brand.findById(req.params.id);
    if (!brand) return res.status(404).json({ message: 'Brand not found' });
    return res.json(brand);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// Get brand by slug
exports.getBrandBySlug = async (req, res) => {
  try {
    const brand = await Brand.findOne({ slug: req.params.slug, isActive: true });
    if (!brand) return res.status(404).json({ message: 'Brand not found' });
    return res.json(brand);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// Update brand
exports.updateBrand = async (req, res) => {
  try {
    const { name, description, logo, isActive } = req.body;
    const updateData = { description, logo, isActive };
    
    // Regenerate slug if name changed
    if (name) {
      updateData.name = name;
      updateData.slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    }
    
    const brand = await Brand.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!brand) return res.status(404).json({ message: 'Brand not found' });
    return res.json(brand);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: 'Brand name or slug already exists' });
    }
    return res.status(400).json({ message: err.message });
  }
};

// Delete brand
exports.deleteBrand = async (req, res) => {
  try {
    const brand = await Brand.findByIdAndDelete(req.params.id);
    if (!brand) return res.status(404).json({ message: 'Brand not found' });
    return res.json({ message: 'Brand deleted successfully' });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

