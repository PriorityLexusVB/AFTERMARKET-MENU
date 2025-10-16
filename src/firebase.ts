import { initializeApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore/lite';
import { getAuth, Auth } from 'firebase/auth';
import { getEnvValue } from './env';

interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId?: string;
}

const buildFirebaseConfig = (): FirebaseConfig | null => {
  const firebaseConfigStr = getEnvValue('FIREBASE_CONFIG');
  if (firebaseConfigStr) {
    try {
      const parsed = JSON.parse(firebaseConfigStr) as FirebaseConfig;
      if (parsed.apiKey && parsed.projectId) {
        return parsed;
      }
    } catch (error) {
      console.error('Failed to parse FIREBASE_CONFIG env value:', error);
    }
  }

  const apiKey = getEnvValue('VITE_FIREBASE_API_KEY') ?? getEnvValue('FIREBASE_API_KEY');
  const projectId = getEnvValue('VITE_FIREBASE_PROJECT_ID') ?? getEnvValue('FIREBASE_PROJECT_ID');
  const authDomain = getEnvValue('VITE_FIREBASE_AUTH_DOMAIN') ?? getEnvValue('FIREBASE_AUTH_DOMAIN');
  const storageBucket = getEnvValue('VITE_FIREBASE_STORAGE_BUCKET') ?? getEnvValue('FIREBASE_STORAGE_BUCKET');
  const messagingSenderId = getEnvValue('VITE_FIREBASE_MESSAGING_SENDER_ID') ?? getEnvValue('FIREBASE_MESSAGING_SENDER_ID');
  const appId = getEnvValue('VITE_FIREBASE_APP_ID') ?? getEnvValue('FIREBASE_APP_ID');

  if (apiKey && projectId && authDomain) {
    return {
      apiKey,
      projectId,
      authDomain,
      storageBucket,
      messagingSenderId,
      appId,
    };
  }

  return null;
};

const firebaseConfig = buildFirebaseConfig();

let app: FirebaseApp | null = null;
let db: Firestore | null = null;
let auth: Auth | null = null;
let firebaseInitializationError: string | null = null;

try {
  if (!firebaseConfig) {
    throw new Error('Missing Firebase configuration. Add FIREBASE_CONFIG or the individual Firebase environment variables.');
  }
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  auth = getAuth(app);
} catch (error) {
  console.error('Firebase initialization failed:', error);
  firebaseInitializationError = error instanceof Error ? error.message : 'Unknown error';
}

export { db, auth, firebaseInitializationError };