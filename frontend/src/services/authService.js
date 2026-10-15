import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  sendPasswordResetEmail,
  updateProfile,
  signOut,
} from "firebase/auth";
import { auth, googleProvider } from "./firebase";
import { authApi } from "./api";

export async function registerWithEmail(name, email, password) {
  const credential = await createUserWithEmailAndPassword(auth, email, password);

  await updateProfile(credential.user, {
    displayName: name,
  });

  try {
    await authApi.register({
      name,
      email,
      password,
    });
  } catch {
    // Fallback when backend API is offline.
  }

  return credential.user;
}

export async function loginWithEmail(email, password) {
  const credential = await signInWithEmailAndPassword(auth, email, password);

  try {
    await authApi.login({ email, password });
  } catch {
    // Fallback when backend API is offline.
  }

  return credential.user;
}

export async function loginWithGoogle() {
  const credential = await signInWithPopup(auth, googleProvider);
  return credential.user;
}

export async function resetPassword(email) {
  return sendPasswordResetEmail(auth, email);
}

export async function logoutUser() {
  try {
    await authApi.logout();
  } catch {
    // Fallback when backend API is offline.
  }

  return signOut(auth);
}