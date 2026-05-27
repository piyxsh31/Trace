require('dotenv').config();

// Import config first — validates env vars, exits if missing
const config = require('./src/config/env');
const connectDB = require('./src/config/db');
const app = require('./src/app');
const logger = require('./src/utils/logger');

let server;

const startServer = async () => {
  // Connect to MongoDB
  await connectDB();

  // Start Express server
  server = app.listen(config.port, () => {
    logger.info(`Trace server running on port ${config.port} [${config.nodeEnv}]`);
    logger.info(`Health check: http://localhost:${config.port}/api/v1/health`);
  });
};

// ─── Graceful shutdown ────────────────────────────────────────────────────────
const gracefulShutdown = async (signal) => {
  logger.warn(`${signal} received. Shutting down gracefully...`);

  if (server) {
    server.close(async () => {
      logger.info('HTTP server closed');
      const mongoose = require('mongoose');
      await mongoose.disconnect();
      logger.info('MongoDB disconnected');
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled Rejection', { reason });
  gracefulShutdown('unhandledRejection');
});

startServer();
