import React, { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import AdminSidebar from "../components/AdminSidebar";
import { getCurrentUser, getHomePathForRole } from "../services/authService";
import "../styles/admin-layout.css";

export default function AdminLayout() {
  const [user, setUser] = useState(() => getCurrentUser());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setUser(getCurrentUser());
    setLoading(false);
  }, []);

  if (loading) {
    return <div className="dashboard-loading">Loading Admin Portal...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const role = (user.role || "").toUpperCase().trim();
  if (role !== "ADMIN") {
    return <Navigate to={getHomePathForRole(role)} replace />;
  }

  return (
    <div className="admin-layout">
      <AdminSidebar user={user} />

      <main className="admin-layout-main">
        <Outlet context={{ user }} />
      </main>
    </div>
  );
}