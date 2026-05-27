const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const config = require('../config/env');

/**
 * Generates a short-lived access token (15 minutes).
 * @param {string} userId - MongoDB user _id
 * @returns {string} Signed JWT
 */
const generateAccessToken = (userId) => {
  return jwt.sign({ userId: userId.toString() }, config.accessTokenSecret, {
    expiresIn: '15m',
  });
};

/**
 * Generates a long-lived refresh token (7 days).
 * @param {string} userId - MongoDB user _id
 * @returns {string} Signed JWT
 */
const generateRefreshToken = (userId) => {
  return jwt.sign({ userId: userId.toString() }, config.refreshTokenSecret, {
    expiresIn: '7d',
  });
};

/**
 * Verifies an access token and returns the decoded payload.
 * @param {string} token
 * @returns {{ userId: string, iat: number, exp: number }}
 * @throws {JsonWebTokenError | TokenExpiredError}
 */
const verifyAccessToken = (token) => {
  return jwt.verify(token, config.accessTokenSecret);
};

/**
 * Verifies a refresh token and returns the decoded payload.
 * @param {string} token
 * @returns {{ userId: string, iat: number, exp: number }}
 * @throws {JsonWebTokenError | TokenExpiredError}
 */
const verifyRefreshToken = (token) => {
  return jwt.verify(token, config.refreshTokenSecret);
};

/**
 * Hashes a token string with SHA-256 for secure storage.
 * @param {string} token - Raw token string
 * @returns {string} Hex-encoded hash
 */
const hashToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  hashToken,
};
