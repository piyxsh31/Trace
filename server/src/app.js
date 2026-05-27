const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const mongoSanitize = require('express-mongo-sanitize');
const morgan = require('morgan');

const config = require('./config/env');
const errorHandler = require('./middleware/error.middleware');
const AppError = require('./utils/app-error');

// Route imports
const healthRoutes = require('./routes/health.routes');
const authRoutes = require('./routes/auth.routes');
const sheetRoutes = require('./routes/sheet.routes');
const problemRoutes = require('./routes/problem.routes');
const analyticsRoutes = require('./routes/analytics.routes');

const app = express();

// ─── Security middleware ─────────────────────────────────────────────────────
app.use(helmet());
app.use(
  cors({
    origin: config.clientUrl,
    credentials: true,
  })
);

// ─── Body parsing ────────────────────────────────────────────────────────────
// 2mb limit to accommodate import payloads (up to 500 problems × fields).
// Real protection comes from auth, rate limiting, and field-level validation.
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));
app.use(cookieParser());

// ─── NoSQL injection prevention ─────────────────────────────────────────────
app.use(mongoSanitize());

// ─── Request logging (development only) ─────────────────────────────────────
if (config.nodeEnv === 'development') {
  app.use(morgan('dev'));
}

// ─── Routes ──────────────────────────────────────────────────────────────────
app.use('/api/v1/health', healthRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/sheets', sheetRoutes);
app.use('/api/v1/problems', problemRoutes);
app.use('/api/v1/analytics', analyticsRoutes);

// ─── 404 handler ─────────────────────────────────────────────────────────────
app.all('*', (req, res, next) => {
  next(new AppError(`Route ${req.originalUrl} not found`, 404));
});

// ─── Global error handler (must be last) ────────────────────────────────────
app.use(errorHandler);

module.exports = app;
