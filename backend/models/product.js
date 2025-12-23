const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  price: { type: Number, required: true },
  brand: { type: String },
  stock: { type: Number, default: 0 },
  images: [{ type: String }],
  category: { type: String },
}, {
  timestamps: true,
});

module.exports = mongoose.models.Product || mongoose.model('Product', productSchema);
