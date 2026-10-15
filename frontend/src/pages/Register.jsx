import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  UserRound,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  LoaderCircle,
  ShieldCheck,
} from "lucide-react";
import AuthLayout from "../layouts/AuthLayout";
import { loginWithGoogle } from "../services/authService";
import { login, getHomePathForRole } from "../utils/auth";
import { addNotification } from "../utils/notifications";

function getStoredUsers() {
  const saved = localStorage.getItem("users");

  if (!saved) {
    return [];
  }

  try {
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export default function Register() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("student");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function validateEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
  }

  async function handleRegister(event) {
    event.preventDefault();
    setError("");

    if (name.trim().length < 2) {
      setError("Please enter your full name.");
      return;
    }

    if (!validateEmail(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    if (password.length < 6) {
      setError("Password must contain at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);

      const allUsers = getStoredUsers();
      const sanitizedEmail = email.trim().toLowerCase();
      const duplicate = allUsers.some(
        (user) => user.email.toLowerCase() === sanitizedEmail
      );

      if (duplicate) {
        setError("An account with this email already exists.");
        return;
      }

      const newUser = {
        id: allUsers.length + 1,
        name: name.trim(),
        email: sanitizedEmail,
        password,
        role,
      };

      allUsers.push(newUser);
      localStorage.setItem("users", JSON.stringify(allUsers));

      if (role === "student") {
        try {
          const students = JSON.parse(
            localStorage.getItem("libraspace_students") || "[]"
          );
          if (!students.some((s) => s.email?.toLowerCase() === sanitizedEmail)) {
            students.push({
              id: Date.now(),
              name: name.trim(),
              email: sanitizedEmail,
              studentId: `STU${String(students.length + 1).padStart(3, "0")}`,
              department: "General Studies",
              phone: "",
              borrowedCount: 0,
              overdueCount: 0,
              status: "Active",
            });
            localStorage.setItem("libraspace_students", JSON.stringify(students));
          }
        } catch {}
      } else {
        try {
          const adminUsers = JSON.parse(
            localStorage.getItem("libraspace_admin_users") || "[]"
          );
          if (!adminUsers.some((u) => u.email?.toLowerCase() === sanitizedEmail)) {
            adminUsers.push({
              id: Date.now(),
              name: name.trim(),
              email: sanitizedEmail,
              role: role === "admin" ? "Admin" : "Librarian",
              status: "Active",
              joined: new Date().toISOString().slice(0, 10),
            });
            localStorage.setItem("libraspace_admin_users", JSON.stringify(adminUsers));
          }
        } catch {}
      }

      addNotification({
        title: `New ${role.charAt(0).toUpperCase() + role.slice(1)} Registered`,
        body: `${name.trim()} (${sanitizedEmail}) registered a new ${role} account.`,
        type: "system",
        toRole: "admin",
        toEmail: "all",
        fromEmail: sanitizedEmail,
      });

      navigate("/login", {
        state: { message: "Account created successfully. Please log in." },
      });
    } catch {
      setError("Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleRegister() {
    setError("");

    try {
      setLoading(true);
      const googleUser = await loginWithGoogle();
      const googleEmail = (googleUser.email || "").toLowerCase();
      const googleName =
        googleUser.displayName || googleEmail.split("@")[0] || "Student";

      const allUsers = getStoredUsers();
      let match = allUsers.find((user) => user.email.toLowerCase() === googleEmail);

      if (!match) {
        match = {
          id: allUsers.length + 1,
          name: googleName,
          email: googleEmail,
          password: "",
          role: "student",
        };
        allUsers.push(match);
        localStorage.setItem("users", JSON.stringify(allUsers));

        addNotification({
          title: "New Student Registered",
          body: `${googleName} (${googleEmail}) registered a new student patron account via Google.`,
          type: "system",
          toRole: "admin",
          toEmail: "all",
          fromEmail: googleEmail,
        });
      }

      login(match, false);
      navigate(getHomePathForRole(match.role));
    } catch (err) {
      if (err.code === "auth/popup-closed-by-user") {
        setError("The Google sign-in window was closed.");
      } else if (err.code === "auth/popup-blocked") {
        setError(
          "Pop-up blocked by your browser. Please allow pop-ups and try again."
        );
      } else if (err.code === "auth/unauthorized-domain") {
        setError(
          "Firebase Error: Unauthorized domain. Add your domain in Firebase Console."
        );
      } else if (err.code === "auth/operation-not-allowed") {
        setError("Firebase Error: Google provider not enabled in Firebase Console.");
      } else if (err.code === "auth/invalid-api-key") {
        setError("Firebase Error: Invalid API key. Please check VITE_FIREBASE_API_KEY.");
      } else {
        setError(
          err.message || "Google sign-in failed. Please check your Firebase configuration."
        );
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout>
      <section className="auth-card">
        <div className="auth-icon">
          <UserRound size={28} />
        </div>

        <div className="auth-heading">
          <span className="auth-eyebrow">JOIN OUR COMMUNITY</span>
          <h1>Create your account</h1>
          <p>Start your reading journey with LibraSpace.</p>
        </div>

        {error && (
          <div className="auth-error" role="alert">
            {error}
          </div>
        )}

        <form onSubmit={handleRegister} noValidate>
          <label className="auth-label" htmlFor="register-name">
            Full Name
          </label>
          <div className="auth-input-wrapper">
            <UserRound size={19} />
            <input
              id="register-name"
              type="text"
              placeholder="Enter your full name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              autoComplete="name"
              required
            />
          </div>

          <label className="auth-label" htmlFor="register-role">
            Register As (Role)
          </label>
          <div className="auth-input-wrapper">
            <ShieldCheck size={19} />
            <select
              id="register-role"
              value={role}
              onChange={(event) => setRole(event.target.value)}
              style={{
                width: "100%",
                background: "transparent",
                border: "none",
                outline: "none",
                color: "inherit",
                fontSize: "0.95rem",
                cursor: "pointer",
              }}
            >
              <option value="student" style={{ color: "#111" }}>Student</option>
              <option value="librarian" style={{ color: "#111" }}>Librarian</option>
              <option value="admin" style={{ color: "#111" }}>Admin</option>
            </select>
          </div>

          <label className="auth-label" htmlFor="register-email">
            Email Address
          </label>
          <div className="auth-input-wrapper">
            <Mail size={19} />
            <input
              id="register-email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              required
            />
          </div>

          <label className="auth-label" htmlFor="register-password">
            Password
          </label>
          <div className="auth-input-wrapper">
            <Lock size={19} />
            <input
              id="register-password"
              type={showPassword ? "text" : "password"}
              placeholder="Create a password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="new-password"
              required
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <label className="auth-label" htmlFor="register-confirm-password">
            Confirm Password
          </label>
          <div className="auth-input-wrapper">
            <Lock size={19} />
            <input
              id="register-confirm-password"
              type={showPassword ? "text" : "password"}
              placeholder="Confirm your password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              autoComplete="new-password"
              required
            />
          </div>

          <p className="auth-terms-note">
            By creating an account, you agree to our{" "}
            <Link
              to="/terms-and-conditions"
              target="_blank"
              rel="noopener noreferrer"
            >
              Terms & Conditions
            </Link>{" "}
            and{" "}
            <Link
              to="/privacy-policy"
              target="_blank"
              rel="noopener noreferrer"
            >
              Privacy Policy
            </Link>
            .
          </p>

          <button type="submit" className="auth-submit" disabled={loading}>
            {loading ? (
              <>
                <LoaderCircle className="spin-icon" size={19} />
                Creating account...
              </>
            ) : (
              <>
                Create Account
                <ArrowRight size={19} />
              </>
            )}
          </button>
        </form>

        <div className="auth-divider">
          <span>OR CONTINUE WITH</span>
        </div>

        <button
          type="button"
          className="google-button"
          onClick={handleGoogleRegister}
          disabled={loading}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
            <path
              fill="#4285F4"
              d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.15z"
            />
            <path
              fill="#34A853"
              d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.94H1.27v3.15C3.25 21.31 7.31 24 12 24z"
            />
            <path
              fill="#FBBC05"
              d="M5.28 14.26a7.18 7.18 0 0 1 0-4.52V6.59H1.27a11.97 11.97 0 0 0 0 10.82l4.01-3.15z"
            />
            <path
              fill="#EA4335"
              d="M12 4.77c1.77 0 3.35.61 4.6 1.8l3.43-3.43C17.95 1.19 15.24 0 12 0 7.31 0 3.25 2.69 1.27 6.59l4.01 3.15c.95-2.84 3.6-4.97 6.72-4.97z"
            />
          </svg>
          <span>Continue with Google</span>
        </button>

        <p className="auth-switch">
          Already have an account?
          <Link to="/login"> Sign in</Link>
        </p>
      </section>
    </AuthLayout>
  );
}