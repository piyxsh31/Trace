// Static imports — Firebase modular SDK requires these to be at the top
// so the auth component gets registered with the app.
import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOutFn,
  setPersistence,
  browserLocalPersistence,
  type Auth,
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let _app: FirebaseApp | null = null;
let _auth: Auth | null = null;

/**
 * Returns the Firebase Auth instance.
 * Lazily initializes on first call — safe to call only from the browser.
 */
const getFirebaseAuth = (): Auth => {
  if (_auth) return _auth;

  if (!_app) {
    _app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  }

  _auth = getAuth(_app);
  void setPersistence(_auth, browserLocalPersistence);
  return _auth;
};

/**
 * Opens a Google sign-in popup and returns the Firebase ID token.
 * @throws {Error} If the user cancels or the popup fails
 */
export const signInWithGoogle = async (): Promise<string> => {
  const auth = getFirebaseAuth();
  const provider = new GoogleAuthProvider();
  const result = await signInWithPopup(auth, provider);
  return result.user.getIdToken();
};

/**
 * Signs the user out from Firebase.
 */
export const firebaseSignOut = async (): Promise<void> => {
  const auth = getFirebaseAuth();
  await firebaseSignOutFn(auth);
};
