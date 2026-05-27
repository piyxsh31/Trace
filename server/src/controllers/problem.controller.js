const Problem = require('../models/problem.model');
const AppError = require('../utils/app-error');
const { validateProblemUpdate } = require('../utils/problem-validator');

/**
 * GET /api/v1/sheets/:sheetId/problems
 * Returns all problems for a specific sheet, in original imported order.
 *
 * @type {import('express').RequestHandler}
 */
const getProblemsBySheet = async (req, res, next) => {
  try {
    const { sheetId } = req.params;

    const problems = await Problem.find({ sheetId, userId: req.user._id })
      .sort({ order: 1 })
      .lean(); // Returns plain JS objects for performance

    // Normalize _id -> id
    const normalized = problems.map(({ _id, ...rest }) => ({ id: _id, ...rest }));

    return res.status(200).json({
      success: true,
      data: { problems: normalized },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/v1/problems/:id
 * Updates a problem's mutable fields (status, difficulty, topics, notes).
 *
 * @type {import('express').RequestHandler}
 */
const updateProblem = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Validate and sanitize the payload
    const { isValid, sanitized, errors } = validateProblemUpdate(req.body);
    if (!isValid) {
      return next(new AppError('Validation failed', 400, errors));
    }

    // Handle solvedAt logic for analytics
    if (sanitized.status) {
      if (sanitized.status === 'solved') {
        sanitized.solvedAt = new Date();
      } else {
        sanitized.solvedAt = null;
      }
    }

    // 1. Fetch old problem to check previous status
    const oldProblem = await Problem.findOne({ _id: id, userId: req.user._id });
    if (!oldProblem) {
      return next(new AppError('Problem not found or unauthorized', 404));
    }

    const wasSolved = oldProblem.status === 'solved';
    const isSolved = sanitized.status === 'solved';

    // 2. Update the problem
    const problem = await Problem.findOneAndUpdate(
      { _id: id, userId: req.user._id },
      { $set: sanitized },
      { new: true, runValidators: true }
    ).lean();

    // 3. Update Sheet solvedCount if status changed
    if (sanitized.status !== undefined && wasSolved !== isSolved) {
      const incVal = isSolved ? 1 : -1;
      // We must require Sheet at the top if it's not already
      const Sheet = require('../models/sheet.model');
      await Sheet.updateOne({ _id: oldProblem.sheetId }, { $inc: { solvedCount: incVal } });
    }

    if (!problem) {
      return next(new AppError('Problem not found or unauthorized', 404));
    }

    // Normalize _id -> id
    const { _id, ...rest } = problem;

    return res.status(200).json({
      success: true,
      data: { problem: { id: _id, ...rest } },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProblemsBySheet,
  updateProblem,
};
