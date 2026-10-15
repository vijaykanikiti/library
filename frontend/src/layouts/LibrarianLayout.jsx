import React, { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";

import LibrarianSidebar from "../components/LibrarianSidebar";
import { getCurrentUser, getHomePathForRole } from "../services/authService";

import "../styles/librarian-layout.css";

export default function LibrarianLayout() {
  const [user, setUser] = useState(() => getCurrentUser());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setUser(getCurrentUser());
    setLoading(false);
  }, []);

  if (loading) {
    return <div className="dashboard-loading">Loading Librarian Portal...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const role = (user.role || "").toUpperCase().trim();
  if (role !== "LIBRARIAN") {
    return <Navigate to={getHomePathForRole(role)} replace />;
  }

  return (
    <div className="librarian-layout">
      <LibrarianSidebar user={user} />

      <main className="librarian-layout-main">
        <Outlet context={{ user }} />
      </main>
    </div>
  );
}