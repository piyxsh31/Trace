const HTML_TAG_REGEX = /<[^>]*>/g;

/**
 * Strips HTML tags from a string to prevent stored XSS.
 * @param {string} str
 * @returns {string}
 */
const sanitizeString = (str) => String(str).replace(HTML_TAG_REGEX, '').trim();

/**
 * Validates and sanitizes the problem update payload.
 *
 * @param {object} body - Raw req.body
 * @returns {{ isValid: boolean, sanitized: object, errors: object[] }}
 */
function validateProblemUpdate(body) {
  const errors = [];
  const sanitized = {};

  if (!body || typeof body !== 'object') {
    return { isValid: false, sanitized: {}, errors: [{ field: 'body', message: 'Request body must be an object' }] };
  }

  // Validate status
  if (body.status !== undefined) {
    if (!['unsolved', 'attempted', 'solved'].includes(body.status)) {
      errors.push({ field: 'status', message: "Status must be 'unsolved', 'attempted', or 'solved'" });
    } else {
      sanitized.status = body.status;
    }
  }

  // Validate difficulty
  if (body.difficulty !== undefined) {
    if (typeof body.difficulty !== 'string') {
      errors.push({ field: 'difficulty', message: 'Difficulty must be a string' });
    } else {
      const diff = body.difficulty.toLowerCase();
      if (!['easy', 'medium', 'hard', ''].includes(diff)) {
        errors.push({ field: 'difficulty', message: "Difficulty must be 'easy', 'medium', 'hard', or empty string" });
      } else {
        sanitized.difficulty = diff;
      }
    }
  }

  // Validate topics
  if (body.topics !== undefined) {
    if (!Array.isArray(body.topics)) {
      errors.push({ field: 'topics', message: 'Topics must be an array' });
    } else if (body.topics.length > 10) {
      errors.push({ field: 'topics', message: 'A problem can have at most 10 topics' });
    } else {
      // Normalize topics: sanitize, trim, lowercase, slice to 50 chars, remove empty
      sanitized.topics = body.topics
        .map((t) => sanitizeString(t).toLowerCase().slice(0, 50))
        .filter((t) => t.length > 0);
    }
  }

  // Validate notes
  if (body.notes !== undefined) {
    if (typeof body.notes !== 'string') {
      errors.push({ field: 'notes', message: 'Notes must be a string' });
    } else if (body.notes.length > 5000) {
      errors.push({ field: 'notes', message: 'Notes cannot exceed 5000 characters' });
    } else {
      sanitized.notes = sanitizeString(body.notes);
    }
  }

  return {
    isValid: errors.length === 0,
    sanitized,
    errors,
  };
}

module.exports = { validateProblemUpdate };
