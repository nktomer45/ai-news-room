/**
 * ╔══════════════════════════════════════════════════════════╗
 * ║         FIREBASE ADMIN CONFIG 🔥                          ║
 * ║  Initializes Firebase Admin SDK for Storage uploads       ║
 * ║  Requires: FIREBASE_PROJECT_ID, FIREBASE_PRIVATE_KEY,    ║
 * ║            FIREBASE_CLIENT_EMAIL, FIREBASE_STORAGE_BUCKET ║
 * ╚══════════════════════════════════════════════════════════╝
 */
require('dotenv').config();
const admin = require('firebase-admin');
const logger = require('./logger');

let storage = null;
let bucket = null;

const initFirebase = () => {
  try {
    const {
      FIREBASE_PROJECT_ID,
      FIREBASE_PRIVATE_KEY,
      FIREBASE_CLIENT_EMAIL,
      FIREBASE_STORAGE_BUCKET,
    } = process.env;

    if (!FIREBASE_PROJECT_ID || !FIREBASE_PRIVATE_KEY || !FIREBASE_CLIENT_EMAIL || !FIREBASE_STORAGE_BUCKET) {
      logger.warn('[Firebase] Missing env vars. Image upload will be disabled.');
      logger.warn('[Firebase] Required: FIREBASE_PROJECT_ID, FIREBASE_PRIVATE_KEY, FIREBASE_CLIENT_EMAIL, FIREBASE_STORAGE_BUCKET');
      return null;
    }

    // Avoid re-initializing if already running
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: FIREBASE_PROJECT_ID,
          privateKey: FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
          clientEmail: FIREBASE_CLIENT_EMAIL,
        }),
        storageBucket: FIREBASE_STORAGE_BUCKET,
      });
    }

    storage = admin.storage();
    bucket = storage.bucket();

    logger.info(`[Firebase] ✅ Initialized. Bucket: ${FIREBASE_STORAGE_BUCKET}`);
    return bucket;
  } catch (err) {
    logger.error(`[Firebase] Initialization failed: ${err.message}`);
    return null;
  }
};

// Initialize on first import
bucket = initFirebase();

module.exports = { bucket, admin };
