/**
 * Custom operational error class for Trace server.
 * Use this for known, expected errors (validation failures, not found, etc.)
 * The global error handler checks `isOperational` to distinguish these from bugs.
 */
class AppError extends Error {
  /**
   * @param {string} message - Human-readable error message
   * @param {number} statusCode - HTTP status code
   * @param {Array<{row?: number, field: string, message: string}>|null} [errors] - Aggregated validation errors
   */
  constructor(message, statusCode, errors = null) {
    super(message);

    this.statusCode = statusCode;
    this.status = statusCode >= 400 && statusCode < 500 ? 'fail' : 'error';
    this.isOperational = true;
    this.errors = errors; // Row-level validation errors, or null

    // Capture stack trace (excludes constructor call from trace)
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
