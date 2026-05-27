const AppError = require('../utils/app-error');
const logger = require('../utils/logger');
const config = require('../config/env');

/**
 * Handle Mongoose CastError (invalid ObjectId, etc.)
 * @param {import('mongoose').CastError} err
 * @returns {AppError}
 */
const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400);
};

/**
 * Handle Mongoose duplicate key error (code 11000).
 * @param {object} err
 * @returns {AppError}
 */
const handleDuplicateFieldsDB = (err) => {
  const field = Object.keys(err.keyValue || {})[0] || 'field';
  const value = err.keyValue ? err.keyValue[field] : '';
  const message = `Duplicate value for ${field}: "${value}". Please use another value.`;
  return new AppError(message, 409);
};

/**
 * Handle Mongoose ValidationError.
 * @param {import('mongoose').Error.ValidationError} err
 * @returns {AppError}
 */
const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);
  const message = `Invalid input data: ${errors.join('. ')}`;
  return new AppError(message, 400);
};

/**
 * Handle expired JWT.
 * @returns {AppError}
 */
const handleJWTExpiredError = () =>
  new AppError('Your token has expired. Please log in again.', 401);

/**
 * Handle invalid JWT.
 * @returns {AppError}
 */
const handleJWTError = () =>
  new AppError('Invalid token. Please log in again.', 401);

/**
 * Global error handling middleware.
 * Must be registered last in Express (after all routes).
 *
 * @param {Error} err
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  let error = Object.assign(Object.create(Object.getPrototypeOf(err)), err);
  error.message = err.message;

  // Mongoose errors
  if (error.name === 'CastError') error = handleCastErrorDB(error);
  if (error.code === 11000) error = handleDuplicateFieldsDB(error);
  if (error.name === 'ValidationError') error = handleValidationErrorDB(error);

  // JWT errors
  if (error.name === 'JsonWebTokenError') error = handleJWTError();
  if (error.name === 'TokenExpiredError') error = handleJWTExpiredError();

  if (config.nodeEnv === 'development') {
    // In dev: send full error details
    logger.error(error.message, { stack: error.stack });
    return res.status(error.statusCode).json({
      success: false,
      message: error.message,
      ...(error.errors && { errors: error.errors }),
      stack: error.stack,
    });
  }

  // Production: only send operational errors to client
  if (error.isOperational) {
    return res.status(error.statusCode).json({
      success: false,
      message: error.message,
      ...(error.errors && { errors: error.errors }),
    });
  }

  // Unknown / programming error — log it, send generic message
  logger.error('UNEXPECTED ERROR', { error });
  return res.status(500).json({
    success: false,
    message: 'Something went wrong. Please try again later.',
  });
};

module.exports = errorHandler;
