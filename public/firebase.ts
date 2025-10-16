import { initializeApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore/lite';
import { getAuth, Auth } from 'firebase/auth';
import { getEnvValue } from './env';

let app: FirebaseApp | null = null;
let db: Firestore | null = null;
let auth: Auth | null = null;
let firebaseInitializationError: string | null = null;

try {
  const firebaseConfigStr = getEnvValue('FIREBASE_CONFIG');
  let firebaseConfig = null;
  if (firebaseConfigStr) {
    try {
      firebaseConfig = JSON.parse(firebaseConfigStr);
    } catch (error) {
      console.error('Failed to parse FIREBASE_CONFIG env value:', error);
      firebaseInitializationError = 'Failed to parse FIREBASE_CONFIG. Ensure it is valid JSON.';
    }
  }

  if (!firebaseConfig || !firebaseConfig.apiKey || !firebaseConfig.projectId) {
    const apiKey = getEnvValue('FIREBASE_API_KEY');
    const projectId = getEnvValue('FIREBASE_PROJECT_ID');
    const authDomain = getEnvValue('FIREBASE_AUTH_DOMAIN');
    const storageBucket = getEnvValue('FIREBASE_STORAGE_BUCKET');
    const messagingSenderId = getEnvValue('FIREBASE_MESSAGING_SENDER_ID');
    const appId = getEnvValue('FIREBASE_APP_ID');

    if (apiKey && projectId && authDomain) {
      firebaseConfig = {
        apiKey,
        projectId,
        authDomain,
        storageBucket,
        messagingSenderId,
        appId,
      };
    }
  }

  if (!firebaseConfig || !firebaseConfig.apiKey || !firebaseConfig.projectId) {
    firebaseInitializationError = firebaseInitializationError ?? "Firebase configuration is missing or incomplete. Provide FIREBASE_CONFIG or the individual Firebase environment variables.";
    throw new Error(firebaseInitializationError);
  }

  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  auth = getAuth(app);

} catch (error) {
  console.error("Firebase initialization failed:", error);
  if (error instanceof Error && !firebaseInitializationError) {
      firebaseInitializationError = `Failed to initialize Firebase: ${error.message}. Please check your FIREBASE_CONFIG secret.`;
  } else if (!firebaseInitializationError) {
      firebaseInitializationError = "An unknown error occurred during Firebase initialization.";
  }
}

export { db, auth, firebaseInitializationError };
