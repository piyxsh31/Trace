const rateLimit = require('express-rate-limit');

/**
 * Rate limiter for auth endpoints.
 * Allows 20 requests per IP per 15-minute window.
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP. Please try again after 15 minutes.',
  },
});

/**
 * Rate limiter for the sheet import endpoint.
 * Allows 5 imports per 15-minute window, keyed by user ID.
 * Import is a heavy write operation (transaction + bulk insert), so it
 * gets a stricter limit. Keyed by user ID (not IP) since the route is
 * behind the `protect` middleware.
 */
const importLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.user?._id?.toString() || req.ip,
  message: {
    success: false,
    message: 'Too many imports. Please wait 15 minutes before trying again.',
  },
});

module.exports = { authLimiter, importLimiter };
