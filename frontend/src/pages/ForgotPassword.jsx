import { useState } from "react";
import { Link } from "react-router-dom";
import { Mail, ArrowLeft, Send, CheckCircle } from "lucide-react";
import AuthLayout from "../layouts/AuthLayout";
import { resetPassword } from "../services/authService";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleReset(event) {
    event.preventDefault();
    setMessage("");
    setError("");

    try {
      setLoading(true);
      await resetPassword(email.trim());
      setMessage(
        "If an account exists for this address, Firebase will send a password reset email."
      );
    } catch (err) {
      if (err.code === "auth/invalid-email") {
        setError("Please enter a valid email address.");
      } else {
        setError(
          "Unable to send the reset email. Please check your configuration and try again."
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
          <Mail size={28} />
        </div>

        <div className="auth-heading">
          <span className="auth-eyebrow">ACCOUNT RECOVERY</span>
          <h1>Forgot password?</h1>
          <p>Enter your email address to request a password reset link.</p>
        </div>

        {message && (
          <div className="auth-success" role="status">
            <CheckCircle size={20} />
            <span>{message}</span>
          </div>
        )}

        {error && (
          <div className="auth-error" role="alert">
            {error}
          </div>
        )}

        <form onSubmit={handleReset}>
          <label className="auth-label" htmlFor="reset-email">
            Email Address
          </label>
          <div className="auth-input-wrapper">
            <Mail size={19} />
            <input
              id="reset-email"
              type="email"
              placeholder="Enter your registered email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              required
            />
          </div>

          <button type="submit" className="auth-submit" disabled={loading}>
            {loading ? "Sending..." : "Send Reset Link"}
            <Send size={18} />
          </button>
        </form>

        <Link to="/login" className="auth-back-login">
          <ArrowLeft size={17} />
          Back to Login
        </Link>
      </section>
    </AuthLayout>
  );
}