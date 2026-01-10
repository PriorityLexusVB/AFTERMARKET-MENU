import { initializeApp, FirebaseApp } from "firebase/app";
import { getFirestore, Firestore } from "firebase/firestore/lite";
import { getAuth, Auth } from "firebase/auth";

// This is the standard Vite way to access environment variables.
// They must be prefixed with VITE_ to be exposed to the client-side code.
// Using bracket notation for strict TypeScript mode.
//
// Supported configuration options:
// - Option A: Provide a single JSON object via VITE_FIREBASE_CONFIG
// - Option B: Provide individual keys via VITE_FIREBASE_* vars
const firebaseConfigFromJson = (() => {
  const raw = import.meta.env["VITE_FIREBASE_CONFIG"];
  if (!raw || typeof raw !== "string") return null;
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    return {
      apiKey: parsed["apiKey"],
      authDomain: parsed["authDomain"],
      projectId: parsed["projectId"],
      storageBucket: parsed["storageBucket"],
      messagingSenderId: parsed["messagingSenderId"],
      appId: parsed["appId"],
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to parse JSON.";
    console.error(
      `Firebase initialization was skipped because VITE_FIREBASE_CONFIG is not valid JSON: ${errorMessage}`
    );
    return { __parseError: true } as const;
  }
})();

const firebaseConfigFromKeys = {
  apiKey: import.meta.env["VITE_FIREBASE_API_KEY"],
  authDomain: import.meta.env["VITE_FIREBASE_AUTH_DOMAIN"],
  projectId: import.meta.env["VITE_FIREBASE_PROJECT_ID"],
  storageBucket: import.meta.env["VITE_FIREBASE_STORAGE_BUCKET"],
  messagingSenderId: import.meta.env["VITE_FIREBASE_MESSAGING_SENDER_ID"],
  appId: import.meta.env["VITE_FIREBASE_APP_ID"],
};

const firebaseConfig = {
  ...firebaseConfigFromKeys,
  ...(firebaseConfigFromJson && !("__parseError" in firebaseConfigFromJson)
    ? firebaseConfigFromJson
    : {}),
};

let app: FirebaseApp | null = null;
let db: Firestore | null = null;
let auth: Auth | null = null;
let firebaseInitializationError: string | null = null;

const requiredKeys: Array<keyof typeof firebaseConfigFromKeys> = [
  "apiKey",
  "projectId",
  "authDomain",
];

// We must check that the essential configuration values are present before initializing.
if (firebaseConfigFromJson && "__parseError" in firebaseConfigFromJson) {
  firebaseInitializationError =
    "Firebase initialization was skipped because VITE_FIREBASE_CONFIG is not valid JSON.";
} else if (
  firebaseConfig.apiKey &&
  firebaseConfig.projectId &&
  firebaseConfig.authDomain
) {
  try {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);
  } catch (error) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : "An unknown error occurred during Firebase initialization.";
    console.error("Firebase initialization failed:", errorMessage);
    firebaseInitializationError = errorMessage;
  }
} else {
  // Create a more informative error message if variables are missing.
  const missingKeyNames = requiredKeys.filter(
    (key) => !firebaseConfig[key] || typeof firebaseConfig[key] !== "string"
  );

  const missingVars = missingKeyNames.map((key) => {
    const map: Record<string, string> = {
      apiKey: "VITE_FIREBASE_API_KEY",
      projectId: "VITE_FIREBASE_PROJECT_ID",
      authDomain: "VITE_FIREBASE_AUTH_DOMAIN",
    };
    return map[key];
  });

  const errorMessage = `Firebase initialization was skipped because the following required environment variables are missing (or VITE_FIREBASE_CONFIG is missing required keys): ${missingVars.join(
    ", "
  )}. Please ensure they are set in your .env.local file for local development or in your hosting provider's environment settings.`;
  console.error(errorMessage);
  firebaseInitializationError = errorMessage;
}

export { app, db, auth, firebaseInitializationError };
