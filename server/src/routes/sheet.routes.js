const express = require('express');
const { importSheet, getSheets, getSheetById, deleteSheet } = require('../controllers/sheet.controller');
const { getProblemsBySheet } = require('../controllers/problem.controller');
const { protect } = require('../middleware/auth.middleware');
const { importLimiter } = require('../middleware/rate-limit.middleware');

const router = express.Router();

// All sheet routes require authentication
router.use(protect);

// POST /api/v1/sheets/import — create a new sheet from a mapped + parsed payload
router.post('/import', importLimiter, importSheet);

// GET /api/v1/sheets — list all sheets for the authenticated user
router.get('/', getSheets);

// GET /api/v1/sheets/:sheetId — get details of a specific sheet
router.get('/:sheetId', getSheetById);

// GET /api/v1/sheets/:sheetId/problems — list all problems for a specific sheet
router.get('/:sheetId/problems', getProblemsBySheet);

// DELETE /api/v1/sheets/:sheetId — permanently delete a sheet and its problems
router.delete('/:sheetId', deleteSheet);

module.exports = router;
