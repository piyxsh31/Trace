const URL_REGEX = /^https?:\/\//;
const HTML_TAG_REGEX = /<[^>]*>/g;
const MAX_PROBLEMS = 500;
const MAX_ERRORS = 20;

/**
 * Strips HTML tags from a string to prevent stored XSS.
 * @param {string} str
 * @returns {string}
 */
const sanitizeString = (str) => String(str).replace(HTML_TAG_REGEX, '').trim();

/**
 * Validates and sanitizes the import sheet payload.
 *
 * Returns either:
 *   { isValid: true,  sanitized: { name, description, problems[] } }
 *   { isValid: false, errors: [{ row?, field, message }] }
 *
 * Collects all errors (up to MAX_ERRORS) before returning so the user
 * can fix issues in one pass instead of playing whack-a-mole.
 *
 * @param {unknown} body - Raw req.body
 * @returns {{ isValid: boolean, sanitized?: object, errors?: object[] }}
 */
function validateImportPayload(body) {
  const errors = [];

  // ── Sheet-level validation ────────────────────────────────────────────────

  if (!body || typeof body !== 'object') {
    return { isValid: false, errors: [{ field: 'body', message: 'Request body must be a JSON object' }] };
  }

  const { name, description, problems } = body;

  // name
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    errors.push({ field: 'name', message: 'Sheet name is required' });
  } else if (name.trim().length > 100) {
    errors.push({ field: 'name', message: 'Sheet name cannot exceed 100 characters' });
  }

  // description
  if (description !== undefined && description !== null) {
    if (typeof description !== 'string') {
      errors.push({ field: 'description', message: 'Description must be a string' });
    } else if (description.trim().length > 500) {
      errors.push({ field: 'description', message: 'Description cannot exceed 500 characters' });
    }
  }

  // problems array
  if (!Array.isArray(problems)) {
    errors.push({ field: 'problems', message: 'Problems must be an array' });
    return { isValid: false, errors };
  }

  if (problems.length === 0) {
    errors.push({ field: 'problems', message: 'At least one problem is required' });
    return { isValid: false, errors };
  }

  if (problems.length > MAX_PROBLEMS) {
    errors.push({
      field: 'problems',
      message: `Cannot import more than ${MAX_PROBLEMS} problems at once`,
    });
    return { isValid: false, errors };
  }

  // ── Row-level validation ─────────────────────────────────────────────────

  const sanitizedProblems = [];

  for (let i = 0; i < problems.length; i++) {
    if (errors.length >= MAX_ERRORS) break;

    const row = problems[i];
    const rowNum = i + 1; // 1-indexed for human-readable messages

    if (!row || typeof row !== 'object') {
      errors.push({ row: rowNum, field: 'problem', message: 'Must be an object' });
      continue;
    }

    const rowErrors = [];

    // name
    if (!row.name || typeof row.name !== 'string' || row.name.trim().length === 0) {
      rowErrors.push({ row: rowNum, field: 'name', message: 'Problem name is required' });
    } else if (row.name.trim().length > 300) {
      rowErrors.push({ row: rowNum, field: 'name', message: 'Problem name cannot exceed 300 characters' });
    }

    // link
    if (!row.link || typeof row.link !== 'string' || row.link.trim().length === 0) {
      rowErrors.push({ row: rowNum, field: 'link', message: 'Problem link is required' });
    } else if (!URL_REGEX.test(row.link.trim())) {
      rowErrors.push({
        row: rowNum,
        field: 'link',
        message: 'Must be a valid URL starting with http:// or https://',
      });
    }

    // topics (optional)
    if (row.topics !== undefined && row.topics !== null && row.topics !== '') {
      if (!Array.isArray(row.topics)) {
        rowErrors.push({ row: rowNum, field: 'topics', message: 'Topics must be an array' });
      } else if (row.topics.length > 10) {
        rowErrors.push({ row: rowNum, field: 'topics', message: 'A problem can have at most 10 topics' });
      }
    }

    // difficulty (optional)
    const VALID_DIFFICULTIES = ['easy', 'medium', 'hard', ''];
    if (row.difficulty !== undefined && row.difficulty !== null) {
      if (typeof row.difficulty !== 'string') {
        rowErrors.push({ row: rowNum, field: 'difficulty', message: 'Difficulty must be a string' });
      } else if (!VALID_DIFFICULTIES.includes(row.difficulty.toLowerCase())) {
        rowErrors.push({
          row: rowNum,
          field: 'difficulty',
          message: "Difficulty must be 'easy', 'medium', or 'hard'",
        });
      }
    }

    if (rowErrors.length > 0) {
      errors.push(...rowErrors.slice(0, MAX_ERRORS - errors.length));
      continue;
    }

    // ── Sanitize valid rows ──────────────────────────────────────────────

    // Normalize topics: sanitize, trim, lowercase, filter empty, cap at 10, truncate at 50
    let sanitizedTopics = [];
    if (Array.isArray(row.topics)) {
      sanitizedTopics = row.topics
        .map((t) => sanitizeString(String(t)).toLowerCase().slice(0, 50))
        .filter((t) => t.length > 0)
        .slice(0, 10);
    }

    // Normalize difficulty
    const sanitizedDifficulty =
      row.difficulty && ['easy', 'medium', 'hard'].includes(row.difficulty.toLowerCase())
        ? row.difficulty.toLowerCase()
        : '';

    sanitizedProblems.push({
      name: sanitizeString(row.name),
      link: sanitizeString(row.link),
      topics: sanitizedTopics,
      difficulty: sanitizedDifficulty,
    });
  }

  if (errors.length > 0) {
    return { isValid: false, errors };
  }

  return {
    isValid: true,
    sanitized: {
      name: sanitizeString(name),
      description: description ? sanitizeString(description) : '',
      problems: sanitizedProblems,
    },
  };
}

module.exports = { validateImportPayload };
