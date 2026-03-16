import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Lazy initialization to avoid crashes during prerendering when env vars are missing
function getFirebaseApp(): FirebaseApp | null {
  if (!firebaseConfig.apiKey) return null;
  return getApps().length ? getApp() : initializeApp(firebaseConfig);
}

let _app: FirebaseApp | null | undefined;
let _auth: Auth | null;
let _db: Firestore | null;
let _storage: FirebaseStorage | null;

function ensureApp() {
  if (_app === undefined) {
    _app = getFirebaseApp();
  }
  return _app;
}

export function getClientAuth(): Auth {
  if (!_auth) {
    const app = ensureApp();
    if (!app) throw new Error("Firebase not initialized — missing API key");
    _auth = getAuth(app);
  }
  return _auth;
}

export function getClientDb(): Firestore {
  if (!_db) {
    const app = ensureApp();
    if (!app) throw new Error("Firebase not initialized — missing API key");
    _db = getFirestore(app);
  }
  return _db;
}

export function getClientStorage(): FirebaseStorage {
  if (!_storage) {
    const app = ensureApp();
    if (!app) throw new Error("Firebase not initialized — missing API key");
    _storage = getStorage(app);
  }
  return _storage;
}

// Convenience getters — safe to call on client, will throw during SSR prerender if used
export const auth = typeof window !== "undefined" ? getClientAuth() : (null as unknown as Auth);
export const db = typeof window !== "undefined" ? getClientDb() : (null as unknown as Firestore);
export const storage = typeof window !== "undefined" ? getClientStorage() : (null as unknown as FirebaseStorage);
