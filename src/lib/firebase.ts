import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { CONFIG } from '@/config';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

export const firebaseSignIn = (email: string, password: string) =>
  signInWithEmailAndPassword(auth, email, password);

export const firebaseSignOut = () => signOut(auth);

export const firebaseSendPasswordReset = (email: string) =>
  sendPasswordResetEmail(auth, email);

// ─── Cookie helpers ────────────────────────────────────────────────────────────

const COOKIE_NAME = 'auth_token';
const COOKIE_MAX_AGE = 3600;

export function setAuthCookie(token: string): void {
  const secure = CONFIG.IS_DEV ? '' : '; Secure';
  document.cookie = `${COOKIE_NAME}=${encodeURIComponent(token)}; max-age=${COOKIE_MAX_AGE}; SameSite=Strict; path=/${secure}`;
}

export function getAuthCookie(): string | null {
  const match = document.cookie.match(
    new RegExp(`(?:^|; )${COOKIE_NAME}=([^;]*)`)
  );
  return match ? decodeURIComponent(match[1]) : null;
}

export function clearAuthCookie(): void {
  document.cookie = `${COOKIE_NAME}=; max-age=0; path=/`;
}
