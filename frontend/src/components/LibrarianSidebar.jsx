import React from "react";
import { NavLink, Link, useNavigate } from "react-router-dom";

import {
  LayoutDashboard,
  BookOpen,
  BookPlus,
  BookMarked,
  RotateCcw,
  CalendarDays,
  Clock,
  LibraryBig,
  LogOut,
  Users,
  IndianRupee,
  BarChart3,
} from "lucide-react";

import { logoutUser } from "../services/authService";

import "../styles/librarian-sidebar.css";

const menuItems = [
  {
    label: "Dashboard",
    path: "/librarian/dashboard",
    icon: LayoutDashboard,
    end: true,
  },
  {
    label: "Manage Books",
    path: "/librarian/books",
    icon: BookOpen,
    end: true,
  },
  {
    label: "Add New Book",
    path: "/librarian/books/add",
    icon: BookPlus,
    end: true,
  },
  {
    label: "Issue Books",
    path: "/librarian/issue-book",
    icon: BookMarked,
    end: true,
  },
  {
    label: "Book Returns",
    path: "/librarian/returns",
    icon: RotateCcw,
    end: true,
  },
  {
    label: "Reservations",
    path: "/librarian/reservations",
    icon: CalendarDays,
    end: true,
  },
  {
    label: "Overdue Books",
    path: "/librarian/overdue",
    icon: Clock,
    end: true,
  },
  {
    label: "Fine Management",
    path: "/librarian/fines",
    icon: IndianRupee,
    end: true,
  },
  {
    label: "Reports & Analytics",
    path: "/librarian/reports",
    icon: BarChart3,
    end: true,
  },
  {
    label: "Students",
    path: "/librarian/students",
    icon: Users,
    end: true,
  },
];

export default function LibrarianSidebar() {
  const navigate = useNavigate();

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
      alert("Unable to log out. Please try again.");
    }
  }

  return (
    <aside className="librarian-sidebar">
      <Link
        to="/librarian/dashboard"
        className="librarian-sidebar-brand"
      >
        <span className="librarian-brand-icon">
          <LibraryBig size={25} />
        </span>

        <span className="librarian-brand-text">
          <strong>LibraSpace</strong>
          <small>Librarian Portal</small>
        </span>
      </Link>

      <div className="librarian-sidebar-label">
        LIBRARIAN MENU
      </div>

      <nav className="librarian-sidebar-menu">
        {menuItems.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              className={({ isActive }) =>
                `librarian-sidebar-link ${
                  isActive ? "active" : ""
                }`
              }
            >
              <Icon size={19} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="librarian-sidebar-bottom">
        <div className="librarian-sidebar-help">
          <BookOpen size={23} />

          <strong>Library Workspace</strong>

          <p>
            Keep the library organized and help students
            discover great books.
          </p>
        </div>

        <button
          type="button"
          className="librarian-sidebar-logout"
          onClick={handleLogout}
        >
          <LogOut size={19} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}