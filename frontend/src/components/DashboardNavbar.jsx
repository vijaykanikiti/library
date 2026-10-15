import React from "react";

import {
  Bell,
  Search,
  UserRound,
  LogOut,
} from "lucide-react";

import ThemeToggle from "./ThemeToggle";

import "../styles/dashboard-layout.css";

export default function DashboardNavbar({ user, onLogout }) {
  const displayName =
    user?.displayName ||
    user?.email?.split("@")[0] ||
    "Student";

  return (
    <header className="dashboard-navbar">
      <div className="dashboard-navbar-left">
        <div className="dashboard-welcome">
          <span>LIBRARY PORTAL</span>

          <h2>My Dashboard</h2>
        </div>
      </div>

      <div className="dashboard-navbar-actions">
        <label className="dashboard-search">
          <Search size={18} />

          <input
            type="search"
            placeholder="Search library..."
            aria-label="Search library"
          />
        </label>

        <ThemeToggle />

        <button
          type="button"
          className="dashboard-icon-button"
          title="Notifications"
          aria-label="Notifications"
          onClick={() => {
            window.alert("Notifications will be available soon.");
          }}
        >
          <Bell size={19} />
        </button>

        <div className="dashboard-user">
          <div className="dashboard-user-avatar">
            {user?.photoURL ? (
              <img src={user.photoURL} alt="" />
            ) : (
              <UserRound size={20} />
            )}
          </div>

          <div className="dashboard-user-info">
            <strong>{displayName}</strong>
            <span>Student</span>
          </div>
        </div>

        <button
          type="button"
          className="dashboard-logout-button"
          onClick={onLogout}
          title="Logout"
          aria-label="Logout"
        >
          <LogOut size={19} />
        </button>
      </div>
    </header>
  );
}