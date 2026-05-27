const mongoose = require('mongoose');

/**
 * GET /api/v1/health
 * Returns server and database status.
 *
 * @type {import('express').RequestHandler}
 */
const getHealth = (req, res) => {
  const dbState = mongoose.connection.readyState;
  // 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
  const dbStatus = dbState === 1 ? 'connected' : 'disconnected';

  res.status(200).json({
    success: true,
    data: {
      status: 'ok',
      db: dbStatus,
      timestamp: new Date().toISOString(),
    },
  });
};

module.exports = { getHealth };
