const mongoose = require('mongoose');

const brandSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  slug: { type: String, required: true, unique: true },
  description: { type: String },
  logo: { type: String },
  isActive: { type: Boolean, default: true },
}, {
  timestamps: true,
});

// Generate slug from name before saving
brandSchema.pre('save', function(next) {
  if (this.isModified('name') && !this.slug) {
    this.slug = this.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  }
  next();
});

const Brand = mongoose.models.Brand || mongoose.model('Brand', brandSchema);
module.exports = Brand;

