import { initializeApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore/lite';
import { getAuth, Auth } from 'firebase/auth';

let app: FirebaseApp | null = null;
let db: Firestore | null = null;
let auth: Auth | null = null;
let firebaseInitializationError: string | null = null;

try {
  // Using the hardcoded Firebase configuration provided by the user.
  // This bypasses the need for the FIREBASE_CONFIG secret.
  const firebaseConfig = {
    apiKey: "AIzaSyA_fZp_gw_ABK02RYMITxfENf6kPdBT-gg",
    authDomain: "gen-lang-client-0877787739.firebaseapp.com",
    projectId: "gen-lang-client-0877787739",
    storageBucket: "gen-lang-client-0877787739.firebasestorage.app",
    messagingSenderId: "351793974523",
    appId: "1:351793974523:web:710469295a3e7bacca745e"
  };

  if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
    throw new Error("The provided Firebase configuration is incomplete.");
  }
  
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  auth = getAuth(app);

} catch (error) {
  console.error("Firebase initialization failed:", error);
  if (error instanceof Error) {
      firebaseInitializationError = `Failed to initialize Firebase: ${error.message}. Please check the hardcoded configuration in firebase.ts.`;
  } else {
      firebaseInitializationError = "An unknown error occurred during Firebase initialization.";
  }
}

export { db, auth, firebaseInitializationError };