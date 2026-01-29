// Firebase configuration for ChatX
// Project: chatX (chatbot-9536c)

import { initializeApp } from 'firebase/app';
import {
    getAuth,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signInWithPopup,
    GoogleAuthProvider,
    signOut,
    onAuthStateChanged,
    sendPasswordResetEmail,
    updateProfile
} from 'firebase/auth';

const firebaseConfig = {
    apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
    authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
    storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.REACT_APP_FIREBASE_APP_ID,
    measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// Auth functions
export const loginWithEmail = (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
};

export const registerWithEmail = (email, password) => {
    return createUserWithEmailAndPassword(auth, email, password);
};

export const loginWithGoogle = () => {
    return signInWithPopup(auth, googleProvider);
};

export const logout = () => {
    return signOut(auth);
};

export const resetPassword = (email) => {
    return sendPasswordResetEmail(auth, email);
};

export const updateUserProfile = (displayName, photoURL) => {
    return updateProfile(auth.currentUser, { displayName, photoURL });
};

export { auth, onAuthStateChanged };
export default app;
