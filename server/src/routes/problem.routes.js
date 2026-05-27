const express = require('express');
const { updateProblem } = require('../controllers/problem.controller');
const { protect } = require('../middleware/auth.middleware');

const router = express.Router();

// All problem routes require authentication
router.use(protect);

// PATCH /api/v1/problems/:id — update a problem's status, difficulty, topics, or notes
router.patch('/:id', updateProblem);

module.exports = router;
