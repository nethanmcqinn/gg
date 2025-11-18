import admin from 'firebase-admin';

let firebaseApp = null;

/**
 * Initialize Firebase Admin SDK
 * Uses service account credentials from environment variables
 */
export function initializeFirebaseAdmin() {
  if (firebaseApp) {
    return firebaseApp;
  }

  try {
    // Initialize with minimal config (for ID token verification only)
    firebaseApp = admin.initializeApp({
      projectId: process.env.FIREBASE_PROJECT_ID,
    });

    console.log('Firebase Admin initialized successfully');
    return firebaseApp;
  } catch (error) {
    console.error('Firebase Admin initialization error:', error);
    throw error;
  }
}

/**
 * Get Firebase Admin Auth instance
 */
export function getFirebaseAuth() {
  if (!firebaseApp) {
    initializeFirebaseAdmin();
  }
  return admin.auth();
}

/**
 * Verify Firebase ID token
 * @param {string} idToken - Firebase ID token from client
 * @returns {Promise<Object>} Decoded token payload
 */
export async function verifyFirebaseToken(idToken) {
  try {
    const auth = getFirebaseAuth();
    const decodedToken = await auth.verifyIdToken(idToken);
    return decodedToken;
  } catch (error) {
    console.error('Firebase token verification error:', error);
    throw error;
  }
}
