const mongoose = require('mongoose');

// MongoDB connection URL (update with your MongoDB details)
const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/TechZen';

const connectDB = async () => {
  try {
    await mongoose.connect(mongoURI);
    console.log('MongoDB connected successfully to TechZen database');
    return true;
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  }
};

module.exports = connectDB;