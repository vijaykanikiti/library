import React from "react";
import { NavLink, Link, useNavigate } from "react-router-dom";

import {
  LayoutDashboard,
  BookOpen,
  BookMarked,
  History,
  CalendarDays,
  CalendarClock,
  UserRound,
  LibraryBig,
  Star,
  LogOut,
} from "lucide-react";

import { logoutUser } from "../services/authService";

import "../styles/dashboard-layout.css";

const menuItems = [
  {
    label: "Dashboard",
    path: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Browse Books",
    path: "/dashboard/books",
    icon: BookOpen,
  },
  {
    label: "My Borrowings",
    path: "/dashboard/my-books",
    icon: BookMarked,
  },
  {
    label: "Reservations",
    path: "/dashboard/reservations",
    icon: CalendarDays,
  },
  {
    label: "Due Dates & Fines",
    path: "/dashboard/due-dates",
    icon: CalendarClock,
  },
  {
    label: "Borrowing History",
    path: "/dashboard/history",
    icon: History,
  },
  {
    label: "Book Reviews",
    path: "/dashboard/reviews",
    icon: Star,
  },
  {
    label: "My Profile",
    path: "/dashboard/profile",
    icon: UserRound,
  },
];

export default function DashboardSidebar() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    const confirmLogout = window.confirm(
      "Are you sure you want to log out?"
    );

    if (!confirmLogout) return;

    try {
      await logoutUser();
      navigate("/login", { replace: true });
    } catch (error) {
      console.error("Logout error:", error);
      alert("Unable to log out. Please try again.");
    }
  };

  return (
    <aside className="dashboard-sidebar">
      <Link to="/dashboard" className="sidebar-brand">
        <span className="sidebar-brand-icon">
          <LibraryBig size={25} />
        </span>

        <span>
          <strong>LibraSpace</strong>
          <small>Library Portal</small>
        </span>
      </Link>

      <div className="sidebar-section-label">
        STUDENT MENU
      </div>

      <nav className="sidebar-menu">
        {menuItems.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/dashboard"}
              className={({ isActive }) =>
                `sidebar-link ${isActive ? "active" : ""}`
              }
            >
              <Icon size={19} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="sidebar-bottom">
        <div className="sidebar-help-card">
          <BookOpen size={23} />

          <strong>Keep Learning!</strong>

          <p>
            Every book opens a new door to knowledge.
          </p>
        </div>

        <button
          type="button"
          className="sidebar-logout-button"
          onClick={handleLogout}
        >
          <LogOut size={19} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}