import { initializeApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore/lite';
import { getAuth, Auth } from 'firebase/auth';

let app: FirebaseApp | null = null;
let db: Firestore | null = null;
let auth: Auth | null = null;
let firebaseInitializationError: string | null = null;

try {
  // Use `process.env.FIREBASE_CONFIG` to align with the rest of the application's environment variable strategy
  // and resolve TypeScript errors related to `import.meta.env` which is not correctly configured in this project.
  const firebaseConfigStr = process.env.FIREBASE_CONFIG;
  if (!firebaseConfigStr || firebaseConfigStr === '""') {
    firebaseInitializationError = "Firebase configuration is missing. Please set the FIREBASE_CONFIG environment variable with the configuration object from your Firebase project's settings.";
    throw new Error(firebaseInitializationError);
  }

  let firebaseConfig;
  try {
    firebaseConfig = JSON.parse(firebaseConfigStr);
  } catch (e) {
    firebaseInitializationError = "Failed to parse FIREBASE_CONFIG. Please ensure it's a valid JSON object copied from your Firebase project's settings.";
    throw new Error(firebaseInitializationError);
  }

  if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
    firebaseInitializationError = "The FIREBASE_CONFIG is incomplete. Please provide the full configuration object from your Firebase project.";
    throw new Error(firebaseInitializationError);
  }
  
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  auth = getAuth(app);

} catch (error) {
  console.error("Firebase initialization failed:", error);
  if (error instanceof Error && !firebaseInitializationError) {
      firebaseInitializationError = `Failed to initialize Firebase: ${error.message}. Please check your FIREBASE_CONFIG.`;
  } else if (!firebaseInitializationError) {
      firebaseInitializationError = "An unknown error occurred during Firebase initialization.";
  }
}

export { db, auth, firebaseInitializationError };
