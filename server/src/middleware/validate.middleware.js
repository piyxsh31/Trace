const AppError = require('../utils/app-error');

/**
 * Validation middleware factory.
 * Validates that all required fields exist in `req.body` with the correct type.
 *
 * @param {Record<string, 'string' | 'number' | 'boolean'>} schema
 * - Keys are field names, values are expected JS typeof strings.
 * @returns {import('express').RequestHandler}
 *
 * @example
 * // Ensures req.body.idToken is a non-empty string
 * router.post('/google', validate({ idToken: 'string' }), handler)
 */
const validate = (schema) => (req, res, next) => {
  const errors = [];

  for (const [field, expectedType] of Object.entries(schema)) {
    const value = req.body[field];

    if (value === undefined || value === null) {
      errors.push(`"${field}" is required`);
      continue;
    }

    if (typeof value !== expectedType) {
      errors.push(`"${field}" must be a ${expectedType}`);
      continue;
    }

    // Extra check for strings: must not be empty/whitespace
    if (expectedType === 'string' && value.trim() === '') {
      errors.push(`"${field}" must not be empty`);
    }
  }

  if (errors.length > 0) {
    return next(new AppError(`Validation failed: ${errors.join(', ')}`, 400));
  }

  next();
};

module.exports = { validate };
