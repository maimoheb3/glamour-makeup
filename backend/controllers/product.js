const Product = require('../models/product');

exports.createProduct = async (req, res) => {
  try {
    // Extract product data from form
    const productData = {
      title: req.body.title,
      description: req.body.description || '',
      price: parseFloat(req.body.price),
      brand: req.body.brand || '',
      stock: parseInt(req.body.stock) || 0,
      category: req.body.category || '',
    };
    
    // Handle image upload
    if (req.file) {
      // Store image filename in images array
      productData.images = [req.file.filename];
    } else {
      productData.images = [];
    }
    
    // Validate required fields
    if (!productData.title || !productData.price) {
      return res.status(400).json({ message: 'Title and price are required' });
    }
    
    const product = new Product(productData);
    await product.save();
    return res.status(201).json(product);
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
};

exports.getProducts = async (req, res) => {
  try {
    const products = await Product.find();
    return res.json(products);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    return res.json(product);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    // Get existing product to preserve existing images
    const existingProduct = await Product.findById(req.params.id);
    if (!existingProduct) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    // Extract product data from form
    const productData = {
      title: req.body.title || existingProduct.title,
      description: req.body.description !== undefined ? req.body.description : existingProduct.description,
      price: req.body.price ? parseFloat(req.body.price) : existingProduct.price,
      brand: req.body.brand !== undefined ? req.body.brand : existingProduct.brand,
      stock: req.body.stock !== undefined ? parseInt(req.body.stock) : existingProduct.stock,
      category: req.body.category !== undefined ? req.body.category : existingProduct.category,
    };
    
    // Handle image upload - add new image to existing images array
    if (req.file) {
      const existingImages = Array.isArray(existingProduct.images) 
        ? [...existingProduct.images] 
        : [];
      existingImages.push(req.file.filename);
      productData.images = existingImages;
    } else {
      // Keep existing images if no new image uploaded
      productData.images = existingProduct.images || [];
    }
    
    const product = await Product.findByIdAndUpdate(req.params.id, productData, { new: true, runValidators: true });
    return res.json(product);
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    return res.json({ message: 'Product deleted' });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};
