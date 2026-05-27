const { verifyAccessToken } = require('../utils/token');
const User = require('../models/user.model');
const AppError = require('../utils/app-error');

/**
 * `protect` middleware — verifies the access token and attaches `req.user`.
 *
 * Expects: `Authorization: Bearer <accessToken>` header.
 * Attaches: `req.user` (full User document)
 *
 * @type {import('express').RequestHandler}
 */
const protect = async (req, res, next) => {
  try {
    // 1. Extract token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(new AppError('No access token provided. Please log in.', 401));
    }

    const token = authHeader.split(' ')[1];

    // 2. Verify token
    const decoded = verifyAccessToken(token);

    // 3. Check user exists and is active
    const user = await User.findById(decoded.userId).select('-__v');
    if (!user) {
      return next(new AppError('User no longer exists.', 401));
    }
    if (!user.isActive) {
      return next(new AppError('Your account has been deactivated.', 401));
    }

    // 4. Attach user to request and continue
    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = { protect };
