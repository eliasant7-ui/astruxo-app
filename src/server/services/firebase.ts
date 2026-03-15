/**
 * Firebase Admin SDK Service
 * Handles authentication verification
 */

import admin from 'firebase-admin';

let firebaseApp: admin.app.App | null = null;

/**
 * Initialize Firebase Admin SDK
 */
export function initializeFirebase() {
  // Check if Firebase Admin is already initialized
  if (admin.apps.length > 0) {
    firebaseApp = admin.app();
    console.log('✅ Firebase Admin already initialized');
    return firebaseApp;
  }

  try {
    // Get credentials from environment variables
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;

    // Validate credentials
    if (!projectId || !privateKey || !clientEmail) {
      console.warn('⚠️ Firebase Admin credentials not found in environment variables');
      console.warn('FIREBASE_PROJECT_ID:', projectId ? '✅' : '❌');
      console.warn('FIREBASE_CLIENT_EMAIL:', clientEmail ? '✅' : '❌');
      console.warn('FIREBASE_PRIVATE_KEY:', privateKey ? '✅' : '❌');
      return null;
    }

    // Initialize Firebase Admin
    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        privateKey: privateKey.replace(/\\n/g, '\n'), // Handle newlines in private key
        clientEmail,
      }),
    });

    console.log('✅ Firebase Admin initialized successfully');
    return firebaseApp;
  } catch (error) {
    console.error('❌ Failed to initialize Firebase Admin:', error);
    return null;
  }
}

/**
 * Get Firebase Admin app instance
 */
export function getFirebaseApp() {
  if (!firebaseApp) {
    firebaseApp = initializeFirebase();
  }
  return firebaseApp;
}

/**
 * Verify Firebase ID token
 */
export async function verifyIdToken(token: string) {
  try {
    const app = getFirebaseApp();
    if (!app) {
      throw new Error('Firebase Admin not initialized');
    }
    const decodedToken = await app.auth().verifyIdToken(token);
    return decodedToken;
  } catch (error) {
    console.error('❌ Error verifying Firebase token:', error);
    return null;
  }
}