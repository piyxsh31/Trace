const mongoose = require('mongoose');
const config = require('./env');
const logger = require('../utils/logger');

/**
 * Connects to MongoDB using the URI from environment config.
 * Exits the process if the initial connection fails.
 */
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(config.mongodbUri);
    logger.info(`MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    logger.error('MongoDB connection failed', { error: error.message });
    process.exit(1);
  }
};

module.exports = connectDB;
