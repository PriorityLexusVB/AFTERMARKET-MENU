import { initializeApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore/lite';
import { getAuth, Auth } from 'firebase/auth';

const firebaseConfig = {
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
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  auth = getAuth(app);
} catch (error) {
  console.error('Firebase initialization failed:', error);
  firebaseInitializationError = error instanceof Error ? error.message : 'Unknown error';
}

export { db, auth, firebaseInitializationError };