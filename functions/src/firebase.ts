/**
 * Firebase Admin SDK singleton
 * Initializes Firebase Admin once and exports db and storage instances
 */

import * as admin from "firebase-admin";

// Initialize Firebase Admin (only once)
if (!admin.apps.length) {
  admin.initializeApp();
}

// Export pre-configured instances for use in other modules
export const db = admin.firestore();
export const storage = admin.storage();
export const bucket = storage.bucket();

// Export admin for any additional use cases
export default admin;
