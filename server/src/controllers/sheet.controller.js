const mongoose = require('mongoose');
const Sheet = require('../models/sheet.model');
const Problem = require('../models/problem.model');
const AppError = require('../utils/app-error');
const { validateImportPayload } = require('../utils/import-validator');
const logger = require('../utils/logger');

/**
 * POST /api/v1/sheets/import
 * Validates, sanitizes, and persists a new sheet with its problems.
 * Uses a MongoDB transaction for atomicity — either everything saves or nothing does.
 *
 * @type {import('express').RequestHandler}
 */
const importSheet = async (req, res, next) => {
  try {
    // 1. Validate & sanitize the entire payload
    const { isValid, sanitized, errors } = validateImportPayload(req.body);
    if (!isValid) {
      return next(new AppError('Validation failed', 400, errors));
    }

    const { name, description, problems } = sanitized;

    // 2. Open a MongoDB session and start a transaction
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // 3. Create the sheet document
      const [sheet] = await Sheet.create(
        [{ userId: req.user._id, name, description, problemCount: problems.length }],
        { session }
      );

      // 4. Prepare problem documents: attach sheetId, userId, and 0-indexed order
      const problemDocs = problems.map((p, i) => ({
        ...p,
        sheetId: sheet._id,
        userId: req.user._id,
        order: i,
      }));

      // 5. Bulk insert — ordered: false allows all valid docs to insert even if one fails
      await Problem.insertMany(problemDocs, { ordered: false, session });

      // 6. Commit the transaction
      await session.commitTransaction();

      logger.info(`Sheet imported: "${name}" (${problems.length} problems) by user ${req.user._id}`);

      return res.status(201).json({
        success: true,
        data: {
          sheet: {
            id: sheet._id,
            name: sheet.name,
            description: sheet.description,
            problemCount: sheet.problemCount,
            solvedCount: sheet.solvedCount || 0,
            createdAt: sheet.createdAt,
          },
        },
      });
    } catch (dbError) {
      // Roll back if anything in the transaction fails
      await session.abortTransaction();
      throw dbError;
    } finally {
      session.endSession();
    }
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/sheets
 * Returns all sheets for the authenticated user, newest first.
 *
 * @type {import('express').RequestHandler}
 */
const getSheets = async (req, res, next) => {
  try {
    const sheets = await Sheet.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .select('_id name description problemCount solvedCount createdAt')
      .lean(); // Return plain objects — faster than Mongoose documents for read-only data

    // Normalize _id → id for clean, consistent API responses
    const normalized = sheets.map(({ _id, ...rest }) => ({ id: _id, ...rest }));

    return res.status(200).json({
      success: true,
      data: { sheets: normalized },
    });
  } catch (error) {
    next(error);
  }
};
/**
 * GET /api/v1/sheets/:sheetId
 * Returns metadata for a single sheet for the authenticated user.
 *
 * @type {import('express').RequestHandler}
 */
const getSheetById = async (req, res, next) => {
  try {
    const { sheetId } = req.params;

    const sheet = await Sheet.findOne({ _id: sheetId, userId: req.user._id }).lean();

    if (!sheet) {
      return next(new AppError('Sheet not found', 404));
    }

    // Normalize _id -> id
    const { _id, ...rest } = sheet;

    return res.status(200).json({
      success: true,
      data: { sheet: { id: _id, ...rest } },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/v1/sheets/:sheetId
 * Deletes a sheet and all its associated problems.
 * Uses a MongoDB transaction to ensure both are deleted atomically.
 *
 * @type {import('express').RequestHandler}
 */
const deleteSheet = async (req, res, next) => {
  try {
    const { sheetId } = req.params;

    // 1. Verify ownership and existence
    const sheet = await Sheet.findOne({ _id: sheetId, userId: req.user._id });
    if (!sheet) {
      return next(new AppError('Sheet not found', 404));
    }

    // 2. Open a MongoDB session and start a transaction
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // 3. Delete the sheet
      await Sheet.deleteOne({ _id: sheetId }, { session });

      // 4. Delete all problems associated with the sheet
      await Problem.deleteMany({ sheetId }, { session });

      // 5. Commit the transaction
      await session.commitTransaction();

      logger.info(`Sheet deleted: "${sheet.name}" by user ${req.user._id}`);

      return res.status(200).json({
        success: true,
        data: null,
      });
    } catch (dbError) {
      // Roll back if anything in the transaction fails
      await session.abortTransaction();
      throw dbError;
    } finally {
      session.endSession();
    }
  } catch (error) {
    next(error);
  }
};

module.exports = { importSheet, getSheets, getSheetById, deleteSheet };
