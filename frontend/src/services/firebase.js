import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBUlZ2FSsO1ysCQDhzmgDfh7PKA69cYTXU",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "librarymanagementsystem-65bca.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "librarymanagementsystem-65bca",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "librarymanagementsystem-65bca.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "200291228506",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:200291228506:web:9b78b46d6c2f0b06167163",
  measurementId: "G-RV2JT9YRFZ"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);

export const googleProvider = new GoogleAuthProvider();

googleProvider.setCustomParameters({
  prompt: "select_account",
});

export default app;