const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5001";

/**
 * Handle API responses with clear error messages.
 */
async function handleResponse(response) {
  let data = null;
  try {
    data = await response.json();
  } catch (_) {
    data = null;
  }

  if (!response.ok) {
    const message =
      (data && (data.error || data.message)) ||
      `Request failed with status ${response.status}`;
    const err = new Error(message);
    err.status = response.status;
    err.data = data;
    throw err;
  }

  return data;
}

/**
 * Safe fetch wrapper that intercepts network failures.
 */
async function safeFetch(url, options = {}) {
  try {
    return await fetch(url, options);
  } catch (_) {
    throw new Error(
      `Cannot reach the server. Please ensure the backend is running at ${API_BASE_URL}.`
    );
  }
}

/**
 * POST /api/auth/login
 * Body: { email, password, role, isGoogle, name }
 * Returns: { otpRequired: true, maskedEmail }
 */
export async function login({ email, password, role, isGoogle = false, name = "" }) {
  const res = await safeFetch(`${API_BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: (email || "").trim(),
      password: (password || "").trim(),
      role: (role || "student").toLowerCase().trim(),
      isGoogle: Boolean(isGoogle),
      name: (name || "").trim(),
    }),
  });

  return handleResponse(res);
}

/**
 * POST /api/auth/verify-otp
 * Body: { email, otp, role }
 * Returns: { token, user: { name, email, role } }
 */
export async function verifyOtp({ email, otp, role }) {
  const cleanOtp = (otp || "").toString().replace(/\D/g, "");
  const res = await safeFetch(`${API_BASE_URL}/api/auth/verify-otp`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: (email || "").trim(),
      otp: cleanOtp,
      role: (role || "student").toLowerCase().trim(),
    }),
  });

  return handleResponse(res);
}

/**
 * POST /api/auth/resend-otp
 * Body: { email, role }
 * Returns: { message, maskedEmail }
 */
export async function resendOtp({ email, role }) {
  const res = await safeFetch(`${API_BASE_URL}/api/auth/resend-otp`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: (email || "").trim(),
      role: (role || "student").toLowerCase().trim(),
    }),
  });

  return handleResponse(res);
}

export default {
  login,
  verifyOtp,
  resendOtp,
};
