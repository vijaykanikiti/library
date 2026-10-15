import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  sendPasswordResetEmail,
  updateProfile,
  signOut,
} from "firebase/auth";

import { auth, googleProvider } from "./firebase";
import { authApi } from "../api/api";

export const AUTH_STORAGE_KEY = "libraspace-auth";

export function getHomePathForRole(role) {
  const norm = (role || "").toUpperCase().trim();
  if (norm === "ADMIN") return "/admin/dashboard";
  if (norm === "LIBRARIAN") return "/librarian/dashboard";
  return "/dashboard";
}

export function getCurrentUser() {
  const tryParse = (raw) => {
    if (!raw || raw === "undefined" || raw === "null") return null;
    try {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") {
        if (parsed.role) {
          parsed.role = String(parsed.role).toUpperCase().trim();
        }
        return parsed;
      }
    } catch {
      return null;
    }
    return null;
  };

  return (
    tryParse(localStorage.getItem("user")) ||
    tryParse(localStorage.getItem(AUTH_STORAGE_KEY)) ||
    tryParse(sessionStorage.getItem("user")) ||
    tryParse(sessionStorage.getItem(AUTH_STORAGE_KEY)) ||
    null
  );
}

function saveSession(token, user) {
  if (token) {
    localStorage.setItem("token", token);
    localStorage.setItem("auth_token", token);
  }
  if (user) {
    const normalizedUser = {
      ...user,
      role: (user.role || "STUDENT").toUpperCase().trim(),
    };
    const json = JSON.stringify(normalizedUser);
    localStorage.setItem("user", json);
    localStorage.setItem(AUTH_STORAGE_KEY, json);
    sessionStorage.setItem("user", json);
  }
}

export async function registerWithEmail(name, email, password, phone = null) {
  const normalizedEmail = email.trim().toLowerCase();
  let firebaseUser = null;

  try {
    const credential = await createUserWithEmailAndPassword(
      auth,
      normalizedEmail,
      password
    );
    firebaseUser = credential.user;
    await updateProfile(firebaseUser, {
      displayName: name.trim(),
    });
  } catch (fbError) {
    if (fbError.code !== "auth/email-already-in-use") {
      throw fbError;
    }
  }

  try {
    await authApi.register({
      name: name.trim(),
      email: normalizedEmail,
      password,
      phone: phone ? phone.trim() : null,
    });
  } catch (backendError) {
    console.warn("Backend register message:", backendError.response?.data?.message || backendError.message);
  }

  try {
    const loginRes = await authApi.login({
      email: normalizedEmail,
      password,
    });
    if (loginRes?.token) {
      saveSession(loginRes.token, loginRes.user);
      return loginRes.user;
    }
  } catch (loginErr) {
    console.warn("Automatic backend login after register failed:", loginErr.message);
  }

  const fallbackUser = {
    name: name.trim(),
    email: normalizedEmail,
    role: "STUDENT",
    phone,
  };
  saveSession(null, fallbackUser);
  return fallbackUser;
}

export async function loginWithEmail(email, password) {
  const normalizedEmail = email.trim().toLowerCase();
  let backendUser = null;
  let backendToken = null;
  let backendError = null;

  try {
    const res = await authApi.login({
      email: normalizedEmail,
      password,
    });
    if (res?.token) {
      backendToken = res.token;
      backendUser = res.user;
      saveSession(backendToken, backendUser);
    }
  } catch (err) {
    backendError = err;
  }

  let fbUser = null;
  try {
    const fbCred = await signInWithEmailAndPassword(
      auth,
      normalizedEmail,
      password
    );
    fbUser = fbCred.user;
  } catch (fbErr) {
    if (!backendUser) {
      if (backendError?.response?.data?.message) {
        throw new Error(backendError.response.data.message);
      }
      throw fbErr;
    }
  }

  if (backendUser) {
    return backendUser;
  }

  if (fbUser) {
    const fallbackUser = {
      name: fbUser.displayName || fbUser.email.split("@")[0],
      email: fbUser.email,
      role: "STUDENT",
    };
    saveSession(null, fallbackUser);
    return fallbackUser;
  }

  throw new Error("Login failed. Please check your credentials.");
}

export async function loginWithGoogle() {
  const credential = await signInWithPopup(auth, googleProvider);
  const fbUser = credential.user;
  const idToken = await fbUser.getIdToken();

  const googleEmail = fbUser.email.toLowerCase().trim();
  const googleName = fbUser.displayName || googleEmail.split("@")[0];

  try {
    const backendRes = await authApi.googleLogin({
      email: googleEmail,
      name: googleName,
      idToken: idToken,
    });

    if (backendRes?.token && backendRes?.user) {
      saveSession(backendRes.token, backendRes.user);
      return backendRes.user;
    }
  } catch (err) {
    console.warn("Backend Google sync warning:", err.response?.data?.message || err.message);
  }

  const fallbackUser = {
    name: googleName,
    email: googleEmail,
    role: "STUDENT",
    photoURL: fbUser.photoURL,
  };
  saveSession(null, fallbackUser);
  return fallbackUser;
}

export async function resetPassword(email) {
  return sendPasswordResetEmail(auth, email.trim().toLowerCase());
}

export async function logoutUser() {
  localStorage.removeItem("token");
  localStorage.removeItem("auth_token");
  localStorage.removeItem("user");
  localStorage.removeItem(AUTH_STORAGE_KEY);
  sessionStorage.removeItem("user");
  sessionStorage.removeItem(AUTH_STORAGE_KEY);

  try {
    await authApi.logout();
  } catch {}

  try {
    await signOut(auth);
  } catch {}
}