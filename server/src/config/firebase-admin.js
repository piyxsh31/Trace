const admin = require('firebase-admin');
const config = require('./env');
const logger = require('../utils/logger');

/**
 * Initialize Firebase Admin SDK (singleton).
 * Uses service account credentials from environment config.
 */
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: config.firebase.projectId,
      clientEmail: config.firebase.clientEmail,
      privateKey: config.firebase.privateKey,
    }),
  });
  logger.info('Firebase Admin SDK initialized');
}

/** @type {import('firebase-admin').auth.Auth} */
const firebaseAuth = admin.auth();

module.exports = firebaseAuth;
