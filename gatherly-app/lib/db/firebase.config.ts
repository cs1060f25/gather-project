/**
 * Firebase Configuration
 * Linear Task: GATHER-27
 * 
 * Sets up Firebase/Firestore connection for Gatherly
 */

import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';

// Firebase configuration
// In production, these should be environment variables
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'mock-api-key',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'gatherly-dev.firebaseapp.com',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'gatherly-dev',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'gatherly-dev.appspot.com',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '123456789',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '1:123456789:web:abcdef',
};

// Initialize Firebase (singleton pattern)
let app: FirebaseApp;
let db: Firestore;
let auth: Auth;

export function initializeFirebase() {
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);
    
    console.log('✓ Firebase initialized:', firebaseConfig.projectId);
  }
  return { app, db, auth };
}

// Export singleton instances
export const getFirebaseApp = () => {
  if (!app) {
    initializeFirebase();
  }
  return app;
};

export const getFirestoreDb = () => {
  if (!db) {
    initializeFirebase();
  }
  return db;
};

export const getFirebaseAuth = () => {
  if (!auth) {
    initializeFirebase();
  }
  return auth;
};

// Collection names as constants
export const COLLECTIONS = {
  USERS: 'users',
  EVENT_SESSIONS: 'eventSessions',
  MESSAGES: 'messages', // subcollection under eventSessions
} as const;

