const mongoose = require('mongoose');

// Ensure base User model is registered
const User = require('./user');
const UserClass = User.UserClass;

const customerSchema = new mongoose.Schema({
  // customer-specific fields
  loyaltyPoints: { type: Number, default: 0 },
}, {
  timestamps: true,
});

// Customer-specific class that extends UserClass
class CustomerClass extends UserClass {
  constructor(name, email, password, loyaltyPoints = 0) {
    super(name, email, password);
    this.loyaltyPoints = loyaltyPoints;
  }

  addLoyalty(points) {
    this.loyaltyPoints = (this.loyaltyPoints || 0) + points;
  }
}

// Load the class into the schema so instance methods come from CustomerClass
customerSchema.loadClass(CustomerClass);

const Customer = mongoose.models.Customer || User.discriminator('Customer', customerSchema);
// expose the plain class constructor for programmatic usage
Customer.CustomerClass = CustomerClass;
Customer.CustomerPlain = CustomerClass;
module.exports = Customer;
