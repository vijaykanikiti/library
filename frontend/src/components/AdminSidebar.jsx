import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  ShieldCheck,
  BookOpen,
  BarChart3,
  Settings,
  UserRound,
  LogOut,
  Library,
} from "lucide-react";
import { logoutUser } from "../services/authService";
import "../styles/admin-sidebar.css";

const navigationItems = [
  {
    label: "Dashboard",
    path: "/admin/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "User Management",
    path: "/admin/users",
    icon: Users,
  },
  {
    label: "Role Management",
    path: "/admin/roles",
    icon: ShieldCheck,
  },
  {
    label: "Library Overview",
    path: "/admin/library",
    icon: BookOpen,
  },
  {
    label: "Reports & Analytics",
    path: "/admin/reports",
    icon: BarChart3,
  },
  {
    label: "System Settings",
    path: "/admin/settings",
    icon: Settings,
  },
  {
    label: "My Profile",
    path: "/admin/profile",
    icon: UserRound,
  },
];

export default function AdminSidebar({ user }) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    const confirmed = window.confirm("Are you sure you want to log out?");
    if (!confirmed) return;

    try {
      await logoutUser();
      navigate("/login", { replace: true });
    } catch (error) {
      console.error("Admin logout failed:", error);
      alert("Unable to log out. Please try again.");
    }
  };

  return (
    <aside className="admin-sidebar">
      <div className="admin-sidebar-brand">
        <div className="admin-sidebar-logo">
          <Library size={25} />
        </div>

        <div>
          <h2>LibraSpace</h2>
          <span>Admin Portal</span>
        </div>
      </div>

      <div className="admin-sidebar-section-label">
        ADMINISTRATION
      </div>

      <nav className="admin-sidebar-navigation">
        {navigationItems.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/admin/dashboard"}
              className={({ isActive }) =>
                `admin-sidebar-link ${isActive ? "active" : ""}`
              }
            >
              <Icon size={19} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="admin-sidebar-footer">
        <div className="admin-sidebar-role">
          <ShieldCheck size={18} />
          <div>
            <strong>Administrator</strong>
            <span>Management Portal</span>
          </div>
        </div>

        <button
          type="button"
          className="admin-sidebar-logout"
          onClick={handleLogout}
        >
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}