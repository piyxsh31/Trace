const firebaseAuth = require('../config/firebase-admin');
const User = require('../models/user.model');
const RefreshToken = require('../models/refresh-token.model');
const AppError = require('../utils/app-error');
const {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  hashToken,
} = require('../utils/token');
const logger = require('../utils/logger');
const config = require('../config/env');

/** 7 days in milliseconds */
const REFRESH_TOKEN_EXPIRES_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Sets the refresh token as a secure HTTP-only cookie.
 * @param {import('express').Response} res
 * @param {string} refreshToken
 */
const setRefreshCookie = (res, refreshToken) => {
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: config.nodeEnv === 'production',
    sameSite: 'lax',
    maxAge: REFRESH_TOKEN_EXPIRES_MS,
    path: '/api/v1/auth',
  });
};

/**
 * Clears the refresh token cookie.
 * @param {import('express').Response} res
 */
const clearRefreshCookie = (res) => {
  res.cookie('refreshToken', '', {
    httpOnly: true,
    secure: config.nodeEnv === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/api/v1/auth',
  });
};

/**
 * POST /api/v1/auth/google
 * Verifies a Firebase ID token, upserts the user, issues JWT tokens.
 *
 * @type {import('express').RequestHandler}
 */
const googleAuth = async (req, res, next) => {
  try {
    const { idToken } = req.body;

    // 1. Verify Firebase ID token
    let decodedToken;
    try {
      decodedToken = await firebaseAuth.verifyIdToken(idToken);
    } catch (firebaseError) {
      logger.warn('Firebase token verification failed', { error: firebaseError.message });
      return next(new AppError('Invalid or expired Google token. Please sign in again.', 401));
    }

    const { uid, email, name, picture } = decodedToken;

    if (!email) {
      return next(new AppError('Google account must have a verified email address.', 400));
    }

    // 2. Upsert user — create on first login, update lastLoginAt on return
    const user = await User.findOneAndUpdate(
      { firebaseUid: uid },
      {
        firebaseUid: uid,
        email,
        name: name || email.split('@')[0],
        avatar: picture || '',
        lastLoginAt: new Date(),
      },
      { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
    );

    // 3. Generate tokens
    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    // 4. Hash and store refresh token
    const tokenHash = hashToken(refreshToken);
    await RefreshToken.create({
      userId: user._id,
      tokenHash,
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_EXPIRES_MS),
    });

    // 5. Set refresh token cookie
    setRefreshCookie(res, refreshToken);

    logger.info(`User authenticated: ${email}`);

    // 6. Respond
    return res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          avatar: user.avatar,
        },
        accessToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/auth/refresh
 * Rotates the refresh token and issues a new access token.
 *
 * @type {import('express').RequestHandler}
 */
const refresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.cookies;

    if (!refreshToken) {
      return next(new AppError('No refresh token provided. Please log in.', 401));
    }

    // 1. Verify JWT signature
    let decoded;
    try {
      decoded = verifyRefreshToken(refreshToken);
    } catch {
      clearRefreshCookie(res);
      return next(new AppError('Invalid or expired session. Please log in again.', 401));
    }

    // 2. Check token exists in DB (prevents reuse after rotation/logout)
    const tokenHash = hashToken(refreshToken);
    const storedToken = await RefreshToken.findOne({ tokenHash, userId: decoded.userId });

    if (!storedToken) {
      clearRefreshCookie(res);
      return next(new AppError('Session expired or already used. Please log in again.', 401));
    }

    // 3. Delete old token (rotation)
    await RefreshToken.deleteOne({ _id: storedToken._id });

    // 4. Check user still exists and is active
    const user = await User.findById(decoded.userId);
    if (!user || !user.isActive) {
      clearRefreshCookie(res);
      return next(new AppError('User account not found or deactivated.', 401));
    }

    // 5. Generate new tokens
    const newAccessToken = generateAccessToken(user._id);
    const newRefreshToken = generateRefreshToken(user._id);

    // 6. Store new refresh token hash
    await RefreshToken.create({
      userId: user._id,
      tokenHash: hashToken(newRefreshToken),
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_EXPIRES_MS),
    });

    // 7. Set new cookie and respond
    setRefreshCookie(res, newRefreshToken);

    return res.status(200).json({
      success: true,
      data: { 
        accessToken: newAccessToken,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          avatar: user.avatar,
        }
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/auth/logout
 * Revokes the current refresh token and clears the cookie.
 *
 * @type {import('express').RequestHandler}
 */
const logout = async (req, res, next) => {
  try {
    const { refreshToken } = req.cookies;

    if (refreshToken) {
      const tokenHash = hashToken(refreshToken);
      await RefreshToken.deleteOne({ tokenHash });
    }

    clearRefreshCookie(res);

    return res.status(200).json({
      success: true,
      data: { message: 'Logged out successfully' },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/auth/logout-all (protected)
 * Revokes all refresh tokens for the current user (sign out from all devices).
 *
 * @type {import('express').RequestHandler}
 */
const logoutAll = async (req, res, next) => {
  try {
    await RefreshToken.deleteMany({ userId: req.user._id });
    clearRefreshCookie(res);

    logger.info(`User logged out from all devices: ${req.user.email}`);

    return res.status(200).json({
      success: true,
      data: { message: 'Logged out from all devices' },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/auth/me (protected)
 * Returns the currently authenticated user's profile.
 *
 * @type {import('express').RequestHandler}
 */
const getMe = (req, res) => {
  const { _id: id, name, email, avatar, lastLoginAt, createdAt } = req.user;

  res.status(200).json({
    success: true,
    data: {
      user: { id, name, email, avatar, lastLoginAt, createdAt },
    },
  });
};

module.exports = { googleAuth, refresh, logout, logoutAll, getMe };
