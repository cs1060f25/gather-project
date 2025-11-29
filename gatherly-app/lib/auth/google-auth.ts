/**
 * Google SSO Authentication
 * Linear Tasks: GATHER-76, GATHER-78
 * 
 * Implements Google Sign-In with Firebase Auth
 */

import { 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithRedirect,
  getRedirectResult,
  UserCredential,
  AuthError
} from 'firebase/auth';
import { getFirebaseAuth, getFirestoreDb } from '../db/firebase.config';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';

// Error codes for structured error handling
export const AUTH_ERROR_CODES = {
  EMAIL_ALREADY_EXISTS: 'EMAIL_ALREADY_EXISTS',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  POPUP_CLOSED: 'POPUP_CLOSED',
  NETWORK_ERROR: 'NETWORK_ERROR',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
} as const;

export type AuthErrorCode = typeof AUTH_ERROR_CODES[keyof typeof AUTH_ERROR_CODES];

export interface AuthResult {
  success: boolean;
  user?: {
    uid: string;
    email: string | null;
    displayName: string | null;
    photoURL: string | null;
  };
  error?: {
    code: AuthErrorCode;
    message: string;
  };
  isNewUser?: boolean;
}

// Store for redirectTo parameter
const REDIRECT_TO_KEY = 'gatherly_redirect_to';

/**
 * Save redirectTo path for after authentication
 */
export function saveRedirectTo(path: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(REDIRECT_TO_KEY, path);
  }
}

/**
 * Get and clear the saved redirectTo path
 */
export function getAndClearRedirectTo(): string | null {
  if (typeof window !== 'undefined') {
    const path = localStorage.getItem(REDIRECT_TO_KEY);
    localStorage.removeItem(REDIRECT_TO_KEY);
    return path;
  }
  return null;
}

/**
 * Check if an email already exists in our user database
 */
export async function checkEmailExists(email: string): Promise<boolean> {
  const db = getFirestoreDb();
  // Query users collection by email
  const { collection, query, where, getDocs } = await import('firebase/firestore');
  const usersRef = collection(db, 'users');
  const q = query(usersRef, where('email', '==', email));
  const snapshot = await getDocs(q);
  return !snapshot.empty;
}

/**
 * Sign in with Google using popup
 */
export async function signInWithGoogle(): Promise<AuthResult> {
  try {
    const auth = getFirebaseAuth();
    const provider = new GoogleAuthProvider();
    
    // Add scopes for calendar access
    provider.addScope('https://www.googleapis.com/auth/calendar.readonly');
    provider.addScope('https://www.googleapis.com/auth/calendar.events');
    
    const result: UserCredential = await signInWithPopup(auth, provider);
    const user = result.user;
    
    // Check if this is a new user
    const db = getFirestoreDb();
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    const isNewUser = !userDoc.exists();
    
    // Create or update user document
    await setDoc(doc(db, 'users', user.uid), {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      updatedAt: serverTimestamp(),
      ...(isNewUser && { createdAt: serverTimestamp() }),
    }, { merge: true });
    
    return {
      success: true,
      user: {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
      },
      isNewUser,
    };
  } catch (error) {
    const authError = error as AuthError;
    return handleAuthError(authError);
  }
}

/**
 * Sign up with email/password
 * Returns structured error for duplicate emails (GATHER-76)
 */
export async function signUpWithEmail(
  email: string, 
  password: string, 
  displayName: string
): Promise<AuthResult> {
  try {
    const { createUserWithEmailAndPassword, updateProfile } = await import('firebase/auth');
    const auth = getFirebaseAuth();
    
    // Check if email already exists (for better error handling)
    const emailExists = await checkEmailExists(email);
    if (emailExists) {
      return {
        success: false,
        error: {
          code: AUTH_ERROR_CODES.EMAIL_ALREADY_EXISTS,
          message: 'An account with this email already exists. Please sign in instead.',
        },
      };
    }
    
    const result = await createUserWithEmailAndPassword(auth, email, password);
    const user = result.user;
    
    // Update profile with display name
    await updateProfile(user, { displayName });
    
    // Create user document
    const db = getFirestoreDb();
    await setDoc(doc(db, 'users', user.uid), {
      uid: user.uid,
      email: user.email,
      displayName,
      photoURL: null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    
    return {
      success: true,
      user: {
        uid: user.uid,
        email: user.email,
        displayName,
        photoURL: null,
      },
      isNewUser: true,
    };
  } catch (error) {
    const authError = error as AuthError;
    return handleAuthError(authError);
  }
}

/**
 * Sign in with email/password
 */
export async function signInWithEmail(
  email: string, 
  password: string
): Promise<AuthResult> {
  try {
    const { signInWithEmailAndPassword } = await import('firebase/auth');
    const auth = getFirebaseAuth();
    
    const result = await signInWithEmailAndPassword(auth, email, password);
    const user = result.user;
    
    return {
      success: true,
      user: {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
      },
      isNewUser: false,
    };
  } catch (error) {
    const authError = error as AuthError;
    return handleAuthError(authError);
  }
}

/**
 * Sign out the current user
 */
export async function signOut(): Promise<void> {
  const { signOut: firebaseSignOut } = await import('firebase/auth');
  const auth = getFirebaseAuth();
  await firebaseSignOut(auth);
}

/**
 * Handle Firebase auth errors and return structured error response
 */
function handleAuthError(error: AuthError): AuthResult {
  console.error('Auth error:', error.code, error.message);
  
  switch (error.code) {
    case 'auth/email-already-in-use':
      return {
        success: false,
        error: {
          code: AUTH_ERROR_CODES.EMAIL_ALREADY_EXISTS,
          message: 'An account with this email already exists. Please sign in instead.',
        },
      };
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return {
        success: false,
        error: {
          code: AUTH_ERROR_CODES.INVALID_CREDENTIALS,
          message: 'Invalid email or password. Please try again.',
        },
      };
    case 'auth/popup-closed-by-user':
      return {
        success: false,
        error: {
          code: AUTH_ERROR_CODES.POPUP_CLOSED,
          message: 'Sign-in was cancelled. Please try again.',
        },
      };
    case 'auth/network-request-failed':
      return {
        success: false,
        error: {
          code: AUTH_ERROR_CODES.NETWORK_ERROR,
          message: 'Network error. Please check your connection and try again.',
        },
      };
    default:
      return {
        success: false,
        error: {
          code: AUTH_ERROR_CODES.UNKNOWN_ERROR,
          message: 'An unexpected error occurred. Please try again.',
        },
      };
  }
}

