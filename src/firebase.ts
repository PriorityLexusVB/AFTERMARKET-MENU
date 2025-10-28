import { initializeApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore/lite';
import { getAuth, Auth } from 'firebase/auth';

// This is the standard Vite way to access environment variables.
// They must be prefixed with VITE_ to be exposed to the client-side code.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

let app: FirebaseApp | null = null;
let db: Firestore | null = null;
let auth: Auth | null = null;
let firebaseInitializationError: string | null = null;

// We must check that the essential configuration values are present before initializing.
if (firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.authDomain) {
  try {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred during Firebase initialization.';
    console.error('Firebase initialization failed:', errorMessage);
    firebaseInitializationError = errorMessage;
  }
} else {
  // Create a more informative error message if variables are missing.
  const missingVars = Object.entries(firebaseConfig)
    .filter(([key, value]) => !value && ['apiKey', 'projectId', 'authDomain'].includes(key))
    .map(([key]) => `VITE_FIREBASE_${key.toUpperCase()}`);

  const errorMessage = `Firebase initialization was skipped because the following required environment variables are missing: ${missingVars.join(', ')}. Please ensure they are set in your .env.local file for local development or in your hosting provider's environment settings.`;
  console.error(errorMessage);
  firebaseInitializationError = errorMessage;
}

export { app, db, auth, firebaseInitializationError };