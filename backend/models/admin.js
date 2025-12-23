const mongoose = require('mongoose');

// Ensure base User model is registered
const User = require('./user');
const UserClass = User.UserClass;

const adminSchema = new mongoose.Schema({
  // admin-specific fields
  role: { type: String, default: 'admin' },
}, {
  timestamps: true,
});

// Admin-specific class that extends the UserClass
class AdminClass extends UserClass {
  constructor(name, email, password, role = 'admin') {
    super(name, email, password);
    this.role = role;
    this.isAdmin = true;
  }

  promoteTo(role) {
    this.role = role;
  }
}

// Load the class into the schema so instance methods come from AdminClass
adminSchema.loadClass(AdminClass);

// Make sure admin documents always have isAdmin = true
adminSchema.pre('save', function (next) {
  this.isAdmin = true;
  next();
});

const Admin = mongoose.models.Admin || User.discriminator('Admin', adminSchema);
// expose the plain class constructor for programmatic usage
Admin.AdminClass = AdminClass;
Admin.AdminPlain = AdminClass;
module.exports = Admin;