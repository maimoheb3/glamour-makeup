const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  address: { type: String },
  isAdmin: { type: Boolean, default: false },
}, {
  timestamps: true,
});

// ES6 class to provide instance methods for User
class UserClass {
  constructor(name, email, password) {
    // only set properties when provided; Mongoose documents will set fields normally
    if (typeof name !== 'undefined') this.name = name;
    if (typeof email !== 'undefined') this.email = email;
    if (typeof password !== 'undefined') this.password = password;
    // isAdmin defaults are handled by the schema
  }

  async comparePassword(candidate) {
    return bcrypt.compare(candidate, this.password);
  }

  setPassword(password) {
    this.password = password;
  }

  toJSON() {
    const obj = this.toObject();
    delete obj.password;
    return obj;
  }
}

// Attach the class methods to the schema
userSchema.loadClass(UserClass);

// Hash password before save if modified
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  // If the password already appears to be hashed (bcrypt starts with $2), skip hashing
  if (this.password && typeof this.password === 'string' && this.password.startsWith('$2')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    return next();
  } catch (err) {
    return next(err);
  }
});

const User = mongoose.models.User || mongoose.model('User', userSchema);
// expose the class so other modules can extend it
User.UserClass = UserClass;

module.exports = User;