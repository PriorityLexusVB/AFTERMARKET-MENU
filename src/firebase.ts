import { initializeApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore/lite';
import { getAuth, Auth } from 'firebase/auth';

let app: FirebaseApp | null = null;
let db: Firestore | null = null;
let auth: Auth | null = null;
let firebaseInitializationError: string | null = null;

try {
  // In Vite, environment variables must be prefixed with VITE_ to be exposed to the client
  // FIX: Changed from import.meta.env to process.env to resolve TypeScript error and maintain consistency with other parts of the app.
  const firebaseConfigStr = (process.env as any).VITE_FIREBASE_CONFIG;
  if (!firebaseConfigStr) {
    firebaseInitializationError = "Firebase configuration is missing. Please go to the 'Secrets' tab (key icon 🔑) and set VITE_FIREBASE_CONFIG with the configuration object from your Firebase project's settings.";
    throw new Error(firebaseInitializationError);
  }

  let firebaseConfig;
  try {
    firebaseConfig = JSON.parse(firebaseConfigStr);
  } catch (e) {
    firebaseInitializationError = "Failed to parse VITE_FIREBASE_CONFIG. Please ensure it's a valid JSON object copied from your Firebase project's settings.";
    throw new Error(firebaseInitializationError);
  }

  if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
    firebaseInitializationError = "The VITE_FIREBASE_CONFIG is incomplete. Please provide the full configuration object from your Firebase project.";
    throw new Error(firebaseInitializationError);
  }
  
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  auth = getAuth(app);

} catch (error) {
  console.error("Firebase initialization failed:", error);
  if (error instanceof Error && !firebaseInitializationError) {
      firebaseInitializationError = `Failed to initialize Firebase: ${error.message}. Please check your VITE_FIREBASE_CONFIG secret.`;
  } else if (!firebaseInitializationError) {
      firebaseInitializationError = "An unknown error occurred during Firebase initialization.";
  }
}

export { db, auth, firebaseInitializationError };
