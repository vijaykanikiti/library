import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  BookOpen,
  LoaderCircle,
  CheckCircle2,
  GraduationCap,
  Shield,
  RotateCcw,
  ShieldCheck,
  RefreshCw,
  X,
  UserCheck,
  AlertCircle,
} from "lucide-react";
import AuthLayout from "../layouts/AuthLayout";
import { loginWithGoogle } from "../services/authService";
import { login as apiLogin, verifyOtp as apiVerifyOtp, resendOtp as apiResendOtp } from "../utils/api";
import { getUser, login, logout, getHomePathForRole } from "../utils/auth";

const ROLE_CREDENTIALS = {
  admin: {
    email: "gopalkrishnagopal6363@gmail.com",
    password: "krish4318",
  },
  librarian: {
    email: "gopalkrishnagopal6363@gmail.com",
    password: "krish4318",
  },
  student: {
    email: "gopalkrishnagopal6363@gmail.com",
    password: "krish4318",
  },
};

const GOOGLE_ACCOUNTS = [
  {
    name: "Gopal Krishna",
    email: "gopalkrishnagopal6363@gmail.com",
    role: "admin",
    roleLabel: "Administrator (Executive Access)",
    avatarBg: "#4285F4",
  },
  {
    name: "Gopal Krishna",
    email: "gopalkrishnagopal6363@gmail.com",
    role: "librarian",
    roleLabel: "Senior Librarian (Catalog Authority)",
    avatarBg: "#0F9D58",
  },
  {
    name: "Gopal Krishna",
    email: "gopalkrishnagopal6363@gmail.com",
    role: "student",
    roleLabel: "Research Patron (Active Scholar)",
    avatarBg: "#DB4437",
  },
];

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();

  const [selectedRole, setSelectedRole] = useState("admin");
  const [email, setEmail] = useState("gopalkrishnagopal6363@gmail.com");
  const [password, setPassword] = useState("krish4318");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({ email: "", password: "" });
  const [formError, setFormError] = useState("");
  const [flashMessage, setFlashMessage] = useState(location.state?.message || "");
  const [existingSession, setExistingSession] = useState(() => getUser());

  const [googleChooserOpen, setGoogleChooserOpen] = useState(false);
  const [customGoogleEmail, setCustomGoogleEmail] = useState("");
  const [customGoogleName, setCustomGoogleName] = useState("");
  const [showCustomGoogleInput, setShowCustomGoogleInput] = useState(false);

  const [twoFactorOpen, setTwoFactorOpen] = useState(false);
  const [twoFactorUser, setTwoFactorUser] = useState(null);
  const [twoFactorDigits, setTwoFactorDigits] = useState(["", "", "", "", "", ""]);
  const [twoFactorTimer, setTwoFactorTimer] = useState(300);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [twoFactorError, setTwoFactorError] = useState("");
  const [twoFactorSuccess, setTwoFactorSuccess] = useState(false);
  const [twoFactorVerifying, setTwoFactorVerifying] = useState(false);
  const [remember2faDevice, setRemember2faDevice] = useState(true);
  const digitInputRefs = useRef([]);

  useEffect(() => {
    if (flashMessage) {
      const timer = setTimeout(() => {
        setFlashMessage("");
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [flashMessage]);

  useEffect(() => {
    let interval = null;
    if (twoFactorOpen && twoFactorTimer > 0 && !twoFactorSuccess) {
      interval = setInterval(() => {
        setTwoFactorTimer((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [twoFactorOpen, twoFactorTimer, twoFactorSuccess]);

  useEffect(() => {
    let interval = null;
    if (resendCooldown > 0) {
      interval = setInterval(() => {
        setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [resendCooldown]);

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins < 10 ? "0" : ""}${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const playAlertChime = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.setValueAtTime(523.25, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(783.99, ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } catch {}
  };

  const handleDigitChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newDigits = [...twoFactorDigits];
    newDigits[index] = value.slice(-1);
    setTwoFactorDigits(newDigits);
    setTwoFactorError("");

    if (value && index < 5) {
      digitInputRefs.current[index + 1]?.focus();
    }

    const fullCode = newDigits.join("");
    if (fullCode.length === 6 && !newDigits.includes("")) {
      verifyTwoFactor(fullCode);
    }
  };

  const handleDigitKeyDown = (index, e) => {
    if (e.key === "Backspace" && !twoFactorDigits[index] && index > 0) {
      digitInputRefs.current[index - 1]?.focus();
    }
  };

  const handleDigitPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    const newDigits = [...twoFactorDigits];
    for (let i = 0; i < 6; i++) {
      newDigits[i] = pasted[i] || "";
    }
    setTwoFactorDigits(newDigits);
    setTwoFactorError("");
    if (pasted.length === 6) {
      verifyTwoFactor(pasted);
    } else {
      digitInputRefs.current[Math.min(pasted.length, 5)]?.focus();
    }
  };

  const handleResendCode = async () => {
    if (!twoFactorUser || resendCooldown > 0) return;
    setTwoFactorError("");

    try {
      const response = await apiResendOtp({
        email: twoFactorUser.email,
        role: twoFactorUser.role,
      });

      setTwoFactorTimer(300);
      setResendCooldown(60);
      setTwoFactorDigits(["", "", "", "", "", ""]);
      digitInputRefs.current[0]?.focus();
      playAlertChime();

      if (response && response.maskedEmail) {
        setTwoFactorUser((prev) => ({
          ...prev,
          maskedEmail: response.maskedEmail,
          otpCode: response.otpCode || prev?.otpCode || "",
        }));
      }
    } catch (err) {
      setTwoFactorError(err.message || "Failed to resend verification code. Please try again.");
    }
  };

  const verifyTwoFactor = async (inputCode) => {
    if (!twoFactorUser || twoFactorVerifying) return;
    setTwoFactorVerifying(true);
    setTwoFactorError("");

    try {
      const response = await apiVerifyOtp({
        email: twoFactorUser.email,
        otp: inputCode,
        role: twoFactorUser.role,
      });

      if (response && (response.token || response.user)) {
        setTwoFactorSuccess(true);
        setTwoFactorError("");

        if (remember2faDevice) {
          try {
            localStorage.setItem(`libraspace_trusted_${twoFactorUser.email.toLowerCase()}`, "true");
          } catch (_) {}
        }

        const targetRole = (response.user?.role || twoFactorUser.role || "student").toLowerCase().trim();
        const sessionPayload = {
          name: response.user?.name || twoFactorUser.email.split("@")[0],
          email: response.user?.email || twoFactorUser.email,
          role: targetRole,
          token: response.token || ("token-" + Date.now()),
        };

        const jsonSession = JSON.stringify(sessionPayload);
        try {
          localStorage.setItem("libraspace-auth", jsonSession);
          sessionStorage.setItem("libraspace-auth", jsonSession);
          localStorage.setItem("user", jsonSession);
          sessionStorage.setItem("user", jsonSession);
          if (sessionPayload.token) {
            localStorage.setItem("token", sessionPayload.token);
            localStorage.setItem("auth_token", sessionPayload.token);
          }
        } catch (_) {}

        setTimeout(() => {
          if (targetRole === "admin") {
            navigate("/admin/dashboard", { replace: true });
          } else if (targetRole === "librarian") {
            navigate("/librarian/dashboard", { replace: true });
          } else {
            navigate("/dashboard", { replace: true });
          }
        }, 800);
      }
    } catch (err) {
      setTwoFactorError(err.message || "Invalid verification code. Please check your passcode and try again.");
    } finally {
      setTwoFactorVerifying(false);
    }
  };

  const handleRoleChange = (role) => {
    setSelectedRole(role);
    setFormError("");
    setFieldErrors({ email: "", password: "" });
    if (ROLE_CREDENTIALS[role]) {
      setEmail(ROLE_CREDENTIALS[role].email);
      setPassword(ROLE_CREDENTIALS[role].password);
    }
  };

  const handleEmailChange = (event) => {
    setEmail(event.target.value);
    if (fieldErrors.email) {
      setFieldErrors((previous) => ({ ...previous, email: "" }));
    }
    if (formError) setFormError("");
  };

  const handlePasswordChange = (event) => {
    setPassword(event.target.value);
    if (fieldErrors.password) {
      setFieldErrors((previous) => ({ ...previous, password: "" }));
    }
    if (formError) setFormError("");
  };

  const validateIdentifier = (value) => {
    const trimmed = (value || "").trim();
    if (!trimmed) {
      return "Email or username is required.";
    }

    if (trimmed.includes("@")) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(trimmed)) {
        return "Please enter a valid email address.";
      }
    }

    return "";
  };

  const validatePassword = (value) => {
    if (!value) {
      return "Password is required.";
    }

    if (value.length < 4) {
      return "Password must be at least 4 characters.";
    }

    return "";
  };

  const handleLogin = async (event) => {
    event.preventDefault();
    setFormError("");

    const emailErr = validateIdentifier(email);
    const passErr = validatePassword(password);

    if (emailErr || passErr) {
      setFieldErrors({ email: emailErr, password: passErr });
      return;
    }

    setFieldErrors({ email: "", password: "" });
    setLoading(true);

    try {
      const response = await apiLogin({
        email: email.trim(),
        password: password.trim(),
        role: selectedRole,
      });

      if (response && response.otpRequired) {
        setTwoFactorUser({
          email: email.trim(),
          role: selectedRole,
          maskedEmail: response.maskedEmail,
          otpCode: response.otpCode || "",
        });
        setTwoFactorDigits(["", "", "", "", "", ""]);
        setTwoFactorTimer(300);
        setResendCooldown(60);
        setTwoFactorError("");
        setTwoFactorSuccess(false);
        setTwoFactorOpen(true);
        playAlertChime();

        setTimeout(() => {
          digitInputRefs.current[0]?.focus();
        }, 150);
      } else if (response && (response.token || response.user)) {
        const sessionPayload = {
          name: response.user?.name || email.split("@")[0],
          email: response.user?.email || email,
          role: selectedRole,
          token: response.token,
        };
        login(sessionPayload, rememberMe);
        if (response.token) {
          localStorage.setItem("token", response.token);
          localStorage.setItem("auth_token", response.token);
        }
        const targetPath = getHomePathForRole(sessionPayload.role);
        navigate(targetPath, { replace: true });
      }
    } catch (err) {
      setFormError(err.message || "An unexpected error occurred during login. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    setFormError("");
    setFieldErrors({ email: "", password: "" });
    setGoogleChooserOpen(true);
  };

  const handleSelectGoogleAccount = async (acc) => {
    setGoogleChooserOpen(false);
    setLoading(true);
    try {
      const response = await apiLogin({
        email: acc.email,
        role: acc.role || selectedRole,
        isGoogle: true,
        name: acc.name,
      });

      if (response && response.otpRequired) {
        setTwoFactorUser({
          email: acc.email,
          role: acc.role || selectedRole,
          maskedEmail: response.maskedEmail,
        });
        setTwoFactorDigits(["", "", "", "", "", ""]);
        setTwoFactorTimer(300);
        setResendCooldown(60);
        setTwoFactorError("");
        setTwoFactorSuccess(false);
        setTwoFactorOpen(true);
        playAlertChime();

        setTimeout(() => {
          digitInputRefs.current[0]?.focus();
        }, 150);
      } else if (response && (response.token || response.user)) {
        const sessionPayload = {
          name: acc.name,
          email: acc.email,
          role: acc.role || selectedRole,
          token: response.token,
        };
        login(sessionPayload, true);
        if (response.token) {
          localStorage.setItem("token", response.token);
          localStorage.setItem("auth_token", response.token);
        }
        const targetPath = getHomePathForRole(sessionPayload.role);
        navigate(targetPath, { replace: true });
      }
    } catch (err) {
      setFormError(err.message || "Failed to initiate 2FA for Google account.");
    } finally {
      setLoading(false);
    }
  };

  const handleCustomGoogleSubmit = async (e) => {
    e.preventDefault();
    if (!customGoogleEmail.trim()) return;
    setGoogleChooserOpen(false);
    setLoading(true);
    try {
      const response = await apiLogin({
        email: customGoogleEmail.trim(),
        role: selectedRole,
        isGoogle: true,
        name: customGoogleName.trim() || customGoogleEmail.trim().split("@")[0],
      });

      if (response && response.otpRequired) {
        setTwoFactorUser({
          email: customGoogleEmail.trim(),
          role: selectedRole,
          maskedEmail: response.maskedEmail,
        });
        setTwoFactorDigits(["", "", "", "", "", ""]);
        setTwoFactorTimer(300);
        setResendCooldown(60);
        setTwoFactorError("");
        setTwoFactorSuccess(false);
        setTwoFactorOpen(true);
        playAlertChime();

        setTimeout(() => {
          digitInputRefs.current[0]?.focus();
        }, 150);
      } else if (response && (response.token || response.user)) {
        const sessionPayload = {
          name: customGoogleName.trim() || customGoogleEmail.trim().split("@")[0],
          email: customGoogleEmail.trim(),
          role: selectedRole,
          token: response.token,
        };
        login(sessionPayload, true);
        if (response.token) {
          localStorage.setItem("token", response.token);
          localStorage.setItem("auth_token", response.token);
        }
        const targetPath = getHomePathForRole(sessionPayload.role);
        navigate(targetPath, { replace: true });
      }
    } catch (err) {
      setFormError(err.message || "Failed to initiate 2FA for account.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <section className="auth-card">
        <div className="auth-icon">
          <BookOpen size={28} />
        </div>

        <div className="auth-heading">
          <span className="auth-eyebrow">WELCOME BACK</span>
          <h1>Sign in to LibraSpace</h1>
          <p>Continue exploring your world of knowledge.</p>
        </div>

        <div className="auth-role-tabs" role="tablist" aria-label="Select user role">
          <button
            type="button"
            role="tab"
            aria-selected={selectedRole === "student"}
            className={`auth-role-tab ${selectedRole === "student" ? "active" : ""}`}
            onClick={() => handleRoleChange("student")}
          >
            <GraduationCap size={16} />
            <span>Student</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={selectedRole === "librarian"}
            className={`auth-role-tab ${selectedRole === "librarian" ? "active" : ""}`}
            onClick={() => handleRoleChange("librarian")}
          >
            <BookOpen size={16} />
            <span>Librarian</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={selectedRole === "admin"}
            className={`auth-role-tab ${selectedRole === "admin" ? "active" : ""}`}
            onClick={() => handleRoleChange("admin")}
          >
            <Shield size={16} />
            <span>Admin</span>
          </button>
        </div>

        {existingSession && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "8px",
              padding: "10px 14px",
              background: "rgba(59, 130, 246, 0.08)",
              border: "1px solid rgba(59, 130, 246, 0.2)",
              borderRadius: "8px",
              marginBottom: "14px",
              fontSize: "13px",
            }}
          >
            <span>
              Signed in as <strong>{existingSession.name}</strong> ({existingSession.role})
            </span>
            <div style={{ display: "flex", gap: "10px" }}>
              <button
                type="button"
                onClick={() => navigate(getHomePathForRole(existingSession.role))}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--primary-color)",
                  fontWeight: 600,
                  cursor: "pointer",
                  fontSize: "12px",
                }}
              >
                Dashboard &rarr;
              </button>
              <button
                type="button"
                onClick={() => {
                  logout();
                  setExistingSession(null);
                }}
                style={{
                  background: "none",
                  border: "none",
                  color: "#ef4444",
                  fontWeight: 600,
                  cursor: "pointer",
                  fontSize: "12px",
                }}
              >
                Sign Out
              </button>
            </div>
          </div>
        )}

        {flashMessage && (
          <div className="auth-success-alert" role="status">
            <CheckCircle2 size={16} />
            <span>{flashMessage}</span>
          </div>
        )}

        {formError && (
          <div className="auth-error" role="alert">
            {formError}
          </div>
        )}

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "12px",
            fontSize: "12px",
            color: "var(--text-secondary)",
          }}
        >
          <span>
            Signing in as:{" "}
            <strong style={{ color: "var(--primary-color)", textTransform: "capitalize" }}>
              {selectedRole}
            </strong>
          </span>
        </div>

        <form onSubmit={handleLogin} noValidate>
          <label className="auth-label" htmlFor="login-email">
            Email Address
          </label>
          <div className={`auth-input-wrapper ${fieldErrors.email ? "error" : ""}`}>
            <Mail size={19} />
            <input
              id="login-email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={handleEmailChange}
              autoComplete="email"
            />
          </div>
          {fieldErrors.email && (
            <span className="auth-field-error" role="alert">
              {fieldErrors.email}
            </span>
          )}

          <div className="auth-password-heading">
            <label className="auth-label" htmlFor="login-password">
              Password
            </label>
            <Link to="/forgot-password">Forgot password?</Link>
          </div>
          <div className={`auth-input-wrapper ${fieldErrors.password ? "error" : ""}`}>
            <Lock size={19} />
            <input
              id="login-password"
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              value={password}
              onChange={handlePasswordChange}
              autoComplete="current-password"
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
          {fieldErrors.password && (
            <span className="auth-field-error" role="alert">
              {fieldErrors.password}
            </span>
          )}

          <div className="auth-remember-row">
            <label className="auth-checkbox-label" htmlFor="login-remember">
              <input
                id="login-remember"
                type="checkbox"
                checked={rememberMe}
                onChange={(event) => setRememberMe(event.target.checked)}
              />
              <span>Remember me</span>
            </label>
          </div>

          <button type="submit" className="auth-submit" disabled={loading}>
            {loading ? (
              <>
                <LoaderCircle className="spin-icon" size={19} />
                Signing in...
              </>
            ) : (
              <>
                Sign In
                <ArrowRight size={19} />
              </>
            )}
          </button>
        </form>

        <div className="auth-divider">
          <span>OR CONTINUE WITH</span>
        </div>

        <button type="button" className="google-button" onClick={handleGoogleLogin} disabled={loading}>
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
          Don't have an account?
          <Link to="/register"> Create account</Link>
        </p>
      </section>

      {googleChooserOpen && (
        <div className="auth-modal-backdrop" onClick={() => setGoogleChooserOpen(false)}>
          <div className="google-chooser-modal" onClick={(e) => e.stopPropagation()}>
            <div className="google-chooser-header">
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
                  <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.15z" />
                  <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.94H1.27v3.15C3.25 21.31 7.31 24 12 24z" />
                  <path fill="#FBBC05" d="M5.28 14.26a7.18 7.18 0 0 1 0-4.52V6.59H1.27a11.97 11.97 0 0 0 0 10.82l4.01-3.15z" />
                  <path fill="#EA4335" d="M12 4.77c1.77 0 3.35.61 4.6 1.8l3.43-3.43C17.95 1.19 15.24 0 12 0 7.31 0 3.25 2.69 1.27 6.59l4.01 3.15c.95-2.84 3.6-4.97 6.72-4.97z" />
                </svg>
                <span style={{ fontWeight: 700, fontSize: "16px", color: "var(--text-primary)" }}>Sign in with Google</span>
              </div>
              <button
                type="button"
                className="auth-modal-close"
                onClick={() => setGoogleChooserOpen(false)}
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <div className="google-chooser-body">
              <p className="google-chooser-sub">
                Choose an account to continue to <strong>LibraSpace Library Network</strong>
              </p>

              <div className="google-accounts-list">
                {GOOGLE_ACCOUNTS.map((acc, idx) => (
                  <div
                    key={idx}
                    className="google-account-item"
                    onClick={() => handleSelectGoogleAccount(acc)}
                  >
                    <div className="google-account-avatar" style={{ background: acc.avatarBg }}>
                      {acc.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="google-account-info">
                      <div className="google-account-name">{acc.name}</div>
                      <div className="google-account-email">{acc.email}</div>
                      <span className="google-account-badge">{acc.roleLabel}</span>
                    </div>
                    <ArrowRight size={16} className="google-account-arrow" />
                  </div>
                ))}

                {!showCustomGoogleInput ? (
                  <button
                    type="button"
                    className="google-use-another-btn"
                    onClick={() => setShowCustomGoogleInput(true)}
                  >
                    <UserCheck size={16} />
                    <span>Use another Google account</span>
                  </button>
                ) : (
                  <form onSubmit={handleCustomGoogleSubmit} className="google-custom-form">
                    <div className="auth-form-group" style={{ marginBottom: "10px" }}>
                      <label className="auth-label">Google Display Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Your Name"
                        className="auth-input-standalone"
                        value={customGoogleName}
                        onChange={(e) => setCustomGoogleName(e.target.value)}
                      />
                    </div>
                    <div className="auth-form-group" style={{ marginBottom: "12px" }}>
                      <label className="auth-label">Google / Gmail Address *</label>
                      <input
                        type="email"
                        required
                        placeholder="name@gmail.com"
                        className="auth-input-standalone"
                        value={customGoogleEmail}
                        onChange={(e) => setCustomGoogleEmail(e.target.value)}
                      />
                    </div>
                    <button type="submit" className="auth-submit" style={{ width: "100%", padding: "10px" }}>
                      Continue with this account &rarr;
                    </button>
                  </form>
                )}
              </div>

              <div className="google-chooser-footer-note">
                To continue, Google will share your name, email address, language preference, and profile picture with LibraSpace.
              </div>
            </div>
          </div>
        </div>
      )}

      {twoFactorOpen && (
        <div className="auth-modal-backdrop" style={{ zIndex: 1200 }}>
          <div className="auth-2fa-modal" onClick={(e) => e.stopPropagation()}>
            <div className="auth-2fa-header">
              <div className="auth-2fa-icon-badge">
                <ShieldCheck size={28} />
              </div>
              <h2 className="auth-2fa-title">Two-Factor Authentication</h2>
              <p className="auth-2fa-subtitle">
                Enter the 6-digit security verification code sent to:
              </p>
              <div className="auth-2fa-target-email">
                <Mail size={14} />
                <span>{twoFactorUser?.maskedEmail || twoFactorUser?.email}</span>
                <span className="auth-2fa-role-chip">{twoFactorUser?.role}</span>
              </div>
            </div>

            <p
              className="auth-2fa-notice-line"
              style={{
                textAlign: "center",
                margin: "12px 0 20px 0",
                fontSize: "13.5px",
                color: "var(--auth-text-muted, #94a3b8)",
                lineHeight: "1.5",
              }}
            >
              We sent a 6-digit code to{" "}
              <strong style={{ color: "var(--auth-text, #f8fafc)" }}>
                {twoFactorUser?.maskedEmail || twoFactorUser?.email}
              </strong>
              . Check your inbox and spam folder.
            </p>

            {twoFactorUser?.otpCode && (
              <div style={{ textAlign: "center", margin: "-6px 0 16px 0" }}>
                <button
                  type="button"
                  onClick={() => {
                    const digits = twoFactorUser.otpCode.split("").slice(0, 6);
                    setTwoFactorDigits(digits);
                    verifyTwoFactor(twoFactorUser.otpCode);
                  }}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    background: "rgba(59, 130, 246, 0.12)",
                    border: "1px dashed #3b82f6",
                    borderRadius: "6px",
                    padding: "6px 12px",
                    color: "#2563eb",
                    fontSize: "12px",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  <Sparkles size={14} />
                  <span>Auto-fill Verification Code ({twoFactorUser.otpCode})</span>
                </button>
              </div>
            )}

            <div className={`auth-2fa-inputs-row ${twoFactorError ? "shake-error" : ""}`}>
              {twoFactorDigits.map((digit, idx) => (
                <input
                  key={idx}
                  ref={(el) => (digitInputRefs.current[idx] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  className={`auth-2fa-digit-input ${digit ? "filled" : ""} ${twoFactorSuccess ? "success" : ""} ${twoFactorError ? "error" : ""}`}
                  value={digit}
                  onChange={(e) => handleDigitChange(idx, e.target.value)}
                  onKeyDown={(e) => handleDigitKeyDown(idx, e)}
                  onPaste={handleDigitPaste}
                  autoFocus={idx === 0}
                  disabled={twoFactorSuccess || twoFactorVerifying}
                />
              ))}
            </div>

            {twoFactorError && (
              <div className="auth-2fa-error-msg" role="alert">
                <AlertCircle size={15} />
                <span>{twoFactorError}</span>
              </div>
            )}

            {twoFactorSuccess && (
              <div className="auth-2fa-success-msg">
                <CheckCircle2 size={18} />
                <span>Passcode verified! Authenticating secure session...</span>
              </div>
            )}

            <button
              type="button"
              className="auth-submit auth-2fa-verify-btn"
              style={{
                marginTop: "14px",
                marginBottom: "12px",
                width: "100%",
                padding: "12px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                fontWeight: 600,
                fontSize: "14.5px",
                borderRadius: "8px",
                cursor: twoFactorVerifying || twoFactorSuccess ? "not-allowed" : "pointer",
              }}
              onClick={() => {
                const code = twoFactorDigits.join("");
                if (code.length === 6) {
                  verifyTwoFactor(code);
                } else {
                  setTwoFactorError("Please enter all 6 digits of your verification code.");
                }
              }}
              disabled={twoFactorVerifying || twoFactorSuccess}
            >
              {twoFactorVerifying ? (
                <>
                  <RefreshCw size={16} className="animate-spin" />
                  <span>Verifying Passcode...</span>
                </>
              ) : (
                <>
                  <ShieldCheck size={18} />
                  <span>Verify Passcode &amp; Sign In</span>
                </>
              )}
            </button>

            <div className="auth-2fa-footer-actions">
              <div className="auth-2fa-timer">
                {twoFactorTimer > 0 ? (
                  <span>
                    Expires in: <strong>{formatTimer(twoFactorTimer)}</strong>
                  </span>
                ) : (
                  <span style={{ color: "#ef4444", fontWeight: 600 }}>Code expired</span>
                )}
              </div>

              <button
                type="button"
                className="auth-2fa-resend-btn"
                onClick={handleResendCode}
                disabled={twoFactorSuccess || resendCooldown > 0}
                style={{ opacity: resendCooldown > 0 ? 0.6 : 1 }}
              >
                <RefreshCw size={13} />
                <span>
                  {resendCooldown > 0 ? `Resend Code (${resendCooldown}s)` : "Resend Fresh Code"}
                </span>
              </button>
            </div>

            <div className="auth-2fa-remember-row">
              <label className="auth-checkbox-label">
                <input
                  type="checkbox"
                  checked={remember2faDevice}
                  onChange={(e) => setRemember2faDevice(e.target.checked)}
                />
                <span>Trust this device for 30 days</span>
              </label>
              <button
                type="button"
                className="auth-2fa-cancel-btn"
                onClick={() => setTwoFactorOpen(false)}
              >
                Cancel Sign In
              </button>
            </div>
          </div>
        </div>
      )}
    </AuthLayout>
  );
}