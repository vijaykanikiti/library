import React from "react";
import { AlertTriangle, Home, LogIn } from "lucide-react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  handleReset = () => {
    localStorage.removeItem("libraspace-auth");
    sessionStorage.removeItem("libraspace-auth");
    localStorage.removeItem("user");
    localStorage.removeItem("libraspace_activities");
    window.location.href = "/login";
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "24px",
            backgroundColor: "#0f172a",
            color: "#f8fafc",
            fontFamily: "system-ui, -apple-system, sans-serif",
          }}
        >
          <div
            style={{
              maxWidth: "520px",
              width: "100%",
              backgroundColor: "#1e293b",
              borderRadius: "16px",
              padding: "32px",
              border: "1px solid #334155",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.5)",
              textAlign: "center",
            }}
          >
            <div
              style={{
                width: "56px",
                height: "56px",
                borderRadius: "50%",
                backgroundColor: "rgba(239, 68, 68, 0.15)",
                display: "grid",
                placeItems: "center",
                margin: "0 auto 16px",
                color: "#ef4444",
              }}
            >
              <AlertTriangle size={30} />
            </div>

            <h2 style={{ fontSize: "20px", fontWeight: 700, margin: "0 0 8px" }}>
              Something went wrong loading this view
            </h2>
            <p style={{ fontSize: "14px", color: "#94a3b8", margin: "0 0 20px", lineHeight: 1.5 }}>
              A rendering issue occurred. You can reset your session or return to the login screen.
            </p>

            {this.state.error?.message && (
              <div
                style={{
                  padding: "10px 14px",
                  borderRadius: "8px",
                  backgroundColor: "#0f172a",
                  color: "#f87171",
                  fontSize: "12px",
                  fontFamily: "monospace",
                  textAlign: "left",
                  marginBottom: "24px",
                  overflowX: "auto",
                  border: "1px solid #334155",
                }}
              >
                {this.state.error.message}
              </div>
            )}

            <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
              <button
                type="button"
                onClick={this.handleReset}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "10px 18px",
                  borderRadius: "8px",
                  border: "none",
                  backgroundColor: "#3b82f6",
                  color: "#fff",
                  fontSize: "14px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                <LogIn size={16} />
                Reset & Sign In
              </button>

              <button
                type="button"
                onClick={() => (window.location.href = "/")}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "10px 18px",
                  borderRadius: "8px",
                  border: "1px solid #475569",
                  backgroundColor: "transparent",
                  color: "#cbd5e1",
                  fontSize: "14px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                <Home size={16} />
                Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
