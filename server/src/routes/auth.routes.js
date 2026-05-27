const express = require('express');
const { googleAuth, refresh, logout, logoutAll, getMe } = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth.middleware');
const { authLimiter } = require('../middleware/rate-limit.middleware');
const { validate } = require('../middleware/validate.middleware');

const router = express.Router();

// POST /api/v1/auth/google — Firebase ID token → JWT session
router.post('/google', authLimiter, validate({ idToken: 'string' }), googleAuth);

// POST /api/v1/auth/refresh — rotate refresh token, issue new access token
router.post('/refresh', refresh);

// POST /api/v1/auth/logout — revoke current refresh token
router.post('/logout', logout);

// POST /api/v1/auth/logout-all — revoke all refresh tokens (all devices)
router.post('/logout-all', protect, logoutAll);

// GET /api/v1/auth/me — return current user profile
router.get('/me', protect, getMe);

module.exports = router;
