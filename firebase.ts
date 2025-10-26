import { initializeApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore/lite';
import { getAuth, Auth } from 'firebase/auth';

let app: FirebaseApp | null = null;
let db: Firestore | null = null;
let auth: Auth | null = null;
let firebaseInitializationError: string | null = null;

try {
 fix-aistudio-dependency-issue
  // Vite exposes env variables on `import.meta.env`

 main
  const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
  };

  // Basic validation
  if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
 fix-aistudio-dependency-issue
    firebaseInitializationError = "Firebase configuration is missing or incomplete. Please check your .env file or environment variables.";

    firebaseInitializationError = "Firebase configuration is incomplete. Please provide the full configuration object from your Firebase project.";
 main
    throw new Error(firebaseInitializationError);
  }

  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  auth = getAuth(app);

} catch (error) {
  console.error("Firebase initialization failed:", error);
  if (error instanceof Error && !firebaseInitializationError) {
      firebaseInitializationError = `Failed to initialize Firebase: ${error.message}. Please check your environment variables.`;
  } else if (!firebaseInitializationError) {
      firebaseInitializationError = "An unknown error occurred during Firebase initialization.";
  }
}

export { db, auth, firebaseInitializationError };
