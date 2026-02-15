import { initializeApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth, connectAuthEmulator } from 'firebase/auth';
import {
  getFirestore,
  Firestore,
  connectFirestoreEmulator,
  initializeFirestore,
  memoryLocalCache,
} from 'firebase/firestore';
import { getStorage, FirebaseStorage, connectStorageEmulator } from 'firebase/storage';

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
};

// Initialize Firebase
const app: FirebaseApp = initializeApp(firebaseConfig);

// Initialize Firebase services
const auth: Auth = getAuth(app);

// Initialize Firestore with memory-only cache (no persistence)
// This prevents cache corruption issues
const db: Firestore = initializeFirestore(app, {
  localCache: memoryLocalCache(),
});

const storage: FirebaseStorage = getStorage(app);

// Connect to Firebase Emulators if in development mode
if (process.env.REACT_APP_USE_FIREBASE_EMULATORS === 'true') {
  console.log('🔧 Connecting to Firebase Emulators...');

  // Connect to Auth Emulator
  connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });

  // Connect to Firestore Emulator
  connectFirestoreEmulator(db, 'localhost', 8081);

  // Connect to Storage Emulator
  connectStorageEmulator(storage, 'localhost', 9199);

  console.log('✅ Connected to Firebase Emulators');
}

export { app, auth, db, storage };
