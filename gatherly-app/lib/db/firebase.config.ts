/**
 * Firebase Configuration
 * Linear Task: GATHER-27
 * 
 * Sets up Firebase/Firestore connection for Gatherly
 */

import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';

// Firebase configuration - Using real Gatherly MVP Firebase project
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'AIzaSyBsD5y5mkxgi8xcByOY6ln4XfOuco3h0bU',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'gatherly-mvp.firebaseapp.com',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'gatherly-mvp',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'gatherly-mvp.firebasestorage.app',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '79144554735',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '1:79144554735:web:068a3db8b55e4c9aeb0b1a',
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || 'G-8E5F5R4RXY'
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

