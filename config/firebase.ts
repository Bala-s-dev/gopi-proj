import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getMessaging, isSupported } from 'firebase/messaging';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyC53kVFqRXusn-OzbOx9TR-C6moOnV49Bc",
  authDomain: "rm-shop-268b8.firebaseapp.com",
  projectId: "rm-shop-268b8",
  storageBucket: "rm-shop-268b8.firebasestorage.app",
  messagingSenderId: "279599248305",
  appId: "1:279599248305:web:4b67958272fd5a38648390"
};

// Initialize Firebase
let app;
let auth;
let db;
let messaging = null;

try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);

  // Initialize messaging only if supported (web only)
  if (typeof window !== 'undefined') {
    isSupported().then(supported => {
      if (supported) {
        messaging = getMessaging(app);
      }
    }).catch(error => {
      console.warn('Firebase messaging not supported:', error);
    });
  }
} catch (error) {
  console.error('Firebase initialization error:', error);
  throw new Error('Failed to initialize Firebase. Please check your configuration.');
}

export { app, auth, db, messaging };