import { initializeApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore/lite';
import { getAuth, Auth } from 'firebase/auth/lite';

let app: FirebaseApp | null = null;
let db: Firestore | null = null;
let auth: Auth | null = null;
let firebaseInitializationError: string | null = null;

try {
  const firebaseConfigStr = process.env.FIREBASE_CONFIG;
  if (!firebaseConfigStr) {
    throw new Error("FIREBASE_CONFIG secret is not set.");
  }

  const firebaseConfig = JSON.parse(firebaseConfigStr);
  
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  auth = getAuth(app);

} catch (error) {
  console.error("Firebase initialization failed:", error);
  if (error instanceof SyntaxError) {
      firebaseInitializationError = "Firebase config is not valid JSON. Please check the FIREBASE_CONFIG secret.";
  } else if (error instanceof Error) {
      firebaseInitializationError = `Failed to initialize Firebase: ${error.message}. Refer to the README for setup instructions.`;
  } else {
      firebaseInitializationError = "An unknown error occurred during Firebase initialization.";
  }
}

export { db, auth, firebaseInitializationError };