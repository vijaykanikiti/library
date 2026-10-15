import React, { useEffect, useState } from "react";
import {
  Navigate,
  Outlet,
  useNavigate,
} from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";

import { auth } from "../services/firebase";
import { getCurrentUser, logoutUser } from "../services/authService";
import DashboardSidebar from "../components/DashboardSidebar";
import DashboardNavbar from "../components/DashboardNavbar";

import "../styles/dashboard-layout.css";

export default function DashboardLayout() {
  const navigate = useNavigate();

  const [user, setUser] = useState(() => getCurrentUser());
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    const localUser = getCurrentUser();
    if (localUser) {
      setUser(localUser);
      setCheckingAuth(false);
    }

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser((prev) => ({
          ...prev,
          displayName: currentUser.displayName || prev?.displayName || currentUser.email?.split("@")[0],
          name: currentUser.displayName || prev?.name || currentUser.email?.split("@")[0],
          email: currentUser.email || prev?.email,
          photoURL: currentUser.photoURL || prev?.photoURL,
          role: prev?.role || "STUDENT",
        }));
      } else if (!getCurrentUser()) {
        setUser(null);
      }
      setCheckingAuth(false);
    });

    return unsubscribe;
  }, []);

  async function handleLogout() {
    const confirmed = window.confirm(
      "Are you sure you want to log out?"
    );

    if (!confirmed) return;

    try {
      await logoutUser();
      navigate("/login", { replace: true });
    } catch (error) {
      console.error("Logout failed:", error);
      window.alert("Unable to log out. Please try again.");
    }
  }

  if (checkingAuth) {
    return (
      <div className="dashboard-loading">
        Checking your login...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const role = (user.role || "").toUpperCase().trim();
  if (role === "ADMIN") {
    return <Navigate to="/admin/dashboard" replace />;
  }
  if (role === "LIBRARIAN") {
    return <Navigate to="/librarian/dashboard" replace />;
  }

  return (
    <div className="dashboard-layout">
      <DashboardSidebar />

      <div className="dashboard-main">
        <DashboardNavbar
          user={user}
          onLogout={handleLogout}
        />

        <div className="dashboard-content">
          <Outlet context={{ user }} />
        </div>

        <footer className="dashboard-footer">
          <div className="dashboard-footer-inner">
            <div className="dashboard-footer-brand">
              <strong>LibraSpace Portal</strong>
              <small>Empowering campus learners with knowledge</small>
            </div>

            <div className="dashboard-footer-social">
              <span>Connect & Follow:</span>
              <div className="dashboard-footer-social-links">
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="dashboard-social-btn"
                  title="GitHub"
                  aria-label="GitHub"
                >
                  <i className="bi bi-github"></i>
                </a>
                <a
                  href="https://linkedin.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="dashboard-social-btn"
                  title="LinkedIn"
                  aria-label="LinkedIn"
                >
                  <i className="bi bi-linkedin"></i>
                </a>
                <a
                  href="https://twitter.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="dashboard-social-btn"
                  title="Twitter / X"
                  aria-label="Twitter / X"
                >
                  <i className="bi bi-twitter-x"></i>
                </a>
                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="dashboard-social-btn"
                  title="Instagram"
                  aria-label="Instagram"
                >
                  <i className="bi bi-instagram"></i>
                </a>
                <a
                  href="https://youtube.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="dashboard-social-btn"
                  title="YouTube"
                  aria-label="YouTube"
                >
                  <i className="bi bi-youtube"></i>
                </a>
                <a
                  href="https://discord.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="dashboard-social-btn"
                  title="Discord"
                  aria-label="Discord"
                >
                  <i className="bi bi-discord"></i>
                </a>
              </div>
            </div>

            <p className="dashboard-footer-copy">
              © {new Date().getFullYear()} LibraSpace. All rights reserved.
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}