/**
 * Firebase Admin SDK service for Vercel serverless functions
 */

import admin from 'firebase-admin';

let firebaseApp = null;

function hasValue(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function getRequestSafeError(error) {
  if (error instanceof Error) {
    return { name: error.name, message: error.message };
  }
  return { message: String(error) };
}

export function initializeFirebase() {
  if (admin.apps.length > 0) {
    firebaseApp = admin.app();
    return firebaseApp;
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;

  if (!hasValue(projectId) || !hasValue(privateKey) || !hasValue(clientEmail)) {
    console.warn('[FIREBASE] Missing admin credentials', {
      hasProjectId: hasValue(projectId),
      hasPrivateKey: hasValue(privateKey),
      hasClientEmail: hasValue(clientEmail),
    });
    return null;
  }

  try {
    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        privateKey: privateKey.replace(/\\n/g, '\n'),
        clientEmail,
      }),
    });

    console.log('[FIREBASE] Admin initialized');
    return firebaseApp;
  } catch (error) {
    console.error('[FIREBASE] Failed to initialize admin app', getRequestSafeError(error));
    return null;
  }
}

export function getFirebaseApp() {
  if (!firebaseApp) {
    firebaseApp = initializeFirebase();
  }
  return firebaseApp;
}

export async function verifyIdToken(token) {
  try {
    const app = getFirebaseApp();
    if (!app) {
      console.error('[FIREBASE] Cannot verify token: admin app unavailable');
      return null;
    }

    return await app.auth().verifyIdToken(token);
  } catch (error) {
    console.error('[FIREBASE] verifyIdToken failed', getRequestSafeError(error));
    return null;
  }
}
