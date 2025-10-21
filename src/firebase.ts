import { initializeApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore/lite';
import { getAuth, Auth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
  apiKey: "<VITE_FIREBASE_API_KEY>",
  authDomain: "<VITE_FIREBASE_AUTH_DOMAIN>",
  projectId: "<VITE_FIREBASE_PROJECT_ID>",
  storageBucket: "<VITE_FIREBASE_STORAGE_BUCKET>",
  messagingSenderId: "<VITE_FIREBASE_MESSAGING_SENDER_ID>",
  appId: "<VITE_FIREBASE_APP_ID>"
};

let app: FirebaseApp | null = null;
let db: Firestore | null = null;
let auth: Auth | null = null;
let firebaseInitializationError: string | null = null;

try {
  if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
    throw new Error('Missing Firebase configuration. Make sure all VITE_FIREBASE_* environment variables are set.');


  if (!firebaseConfig) {
    firebaseInitializationError = "Firebase configuration is missing. Please create a `.env` file in the project root and add your Firebase credentials. See the README.md file for instructions.";
    throw new Error(firebaseInitializationError);
  }

  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  auth = getAuth(app);
} catch (error) {
  console.error('Firebase initialization failed:', error);
  if (!firebaseInitializationError) {
    firebaseInitializationError = error instanceof Error ? error.message : 'An unknown error occurred during Firebase initialization.';
  }
}

export { db, auth, firebaseInitializationError };