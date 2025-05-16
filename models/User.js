const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  accountType: {
    type: String,
    enum: ['buyer', 'seller'],
    default: 'buyer'
  },
  fullName: {
    type: String,
    trim: true
  },
  profilePicture: {
    type: String,
    default: ''
  },
  phone: {
    type: String,
    trim: true
  },
  // Seller-specific fields
  storeName: {
    type: String,
    trim: true
  },
  storeDescription: {
    type: String
  },
  sellerRating: {
    type: Number,
    min: 0,
    max: 5,
    default: 0
  },
  // Address information
  address: {
    street: String,
    city: String,
    state: String,
    postalCode: String,
    country: String
  },
  created: {
    type: Date,
    default: Date.now
  },
  lastLogin: {
    type: Date
  }
}, { collection: 'Users' }); // Specify the exact collection name

// Hash password before saving
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// Method to compare passwords
UserSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);