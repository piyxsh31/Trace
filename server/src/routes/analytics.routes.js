const express = require('express');
const { getAnalyticsDashboard } = require('../controllers/analytics.controller');
const { protect } = require('../middleware/auth.middleware');

const router = express.Router();

router.use(protect);

router.get('/', getAnalyticsDashboard);

module.exports = router;
