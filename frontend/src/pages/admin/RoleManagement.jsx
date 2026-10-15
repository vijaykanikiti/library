import React, { useEffect, useState } from "react";
import {
  ShieldCheck,
  Users,
  BookOpen,
  Settings,
  FileText,
  CheckCircle2,
  LockKeyhole,
  GraduationCap,
  BriefcaseBusiness,
  Crown,
} from "lucide-react";
import "../../styles/role-management.css";

const ROLE_CONFIG = [
  {
    name: "Admin",
    description: "Manage the overall library system and its configuration.",
    icon: Crown,
    color: "admin",
    permissions: [
      "View admin dashboard",
      "Manage users",
      "Manage role assignments",
      "View library overview",
      "View reports and analytics",
      "Configure system settings",
    ],
  },
  {
    name: "Librarian",
    description: "Manage daily library operations and member services.",
    icon: BriefcaseBusiness,
    color: "librarian",
    permissions: [
      "View librarian dashboard",
      "Add and manage books",
      "Issue books to students",
      "Process book returns",
      "Manage reservations",
      "Manage overdue books and fines",
      "View library reports",
    ],
  },
  {
    name: "Student",
    description: "Browse books and manage personal borrowing activities.",
    icon: GraduationCap,
    color: "student",
    permissions: [
      "Browse the book collection",
      "View personal borrowings",
      "Reserve books",
      "View borrowing history",
      "Submit book reviews",
      "View personal fines and due dates",
      "Manage personal profile",
    ],
  },
];

const USER_STORAGE_KEY = "libraspace_admin_users";

export default function RoleManagement() {
  const [userCounts, setUserCounts] = useState({
    Admin: 0,
    Librarian: 0,
    Student: 0,
  });

  useEffect(() => {
    try {
      const savedUsers = JSON.parse(
        localStorage.getItem(USER_STORAGE_KEY) || "[]"
      );

      if (Array.isArray(savedUsers) && savedUsers.length > 0) {
        setUserCounts({
          Admin: savedUsers.filter((user) => user.role === "Admin").length,
          Librarian: savedUsers.filter(
            (user) => user.role === "Librarian"
          ).length,
          Student: savedUsers.filter((user) => user.role === "Student").length,
        });
      }
    } catch {}
  }, []);

  const totalRoles = ROLE_CONFIG.length;

  return (
    <div className="role-management-page">
      <header className="role-management-header">
        <div>
          <span className="role-management-eyebrow">
            ADMINISTRATION
          </span>
          <h1>Role Management</h1>
          <p>
            Review library roles and the permissions associated with each role.
          </p>
        </div>

        <div className="role-management-summary">
          <ShieldCheck size={22} />
          <div>
            <strong>{totalRoles}</strong>
            <span>Available Roles</span>
          </div>
        </div>
      </header>

      <section className="role-management-notice">
        <LockKeyhole size={20} />
        <div>
          <strong>Role-based access overview</strong>
          <p>
            This page documents intended permissions. Actual access control
            must be enforced by authentication and backend authorization.
          </p>
        </div>
      </section>

      <section className="role-management-stats">
        <article className="role-management-stat">
          <div className="role-stat-icon">
            <ShieldCheck size={22} />
          </div>
          <div>
            <span>Defined Roles</span>
            <h2>{totalRoles}</h2>
          </div>
        </article>

        <article className="role-management-stat">
          <div className="role-stat-icon">
            <Users size={22} />
          </div>
          <div>
            <span>Admin Accounts</span>
            <h2>{userCounts.Admin}</h2>
          </div>
        </article>

        <article className="role-management-stat">
          <div className="role-stat-icon">
            <BookOpen size={22} />
          </div>
          <div>
            <span>Librarian Accounts</span>
            <h2>{userCounts.Librarian}</h2>
          </div>
        </article>

        <article className="role-management-stat">
          <div className="role-stat-icon">
            <GraduationCap size={22} />
          </div>
          <div>
            <span>Student Accounts</span>
            <h2>{userCounts.Student}</h2>
          </div>
        </article>
      </section>

      <section className="role-management-grid">
        {ROLE_CONFIG.map((role) => {
          const RoleIcon = role.icon;

          return (
            <article
              className={`role-card role-card-${role.color}`}
              key={role.name}
            >
              <div className="role-card-header">
                <div className="role-card-icon">
                  <RoleIcon size={26} />
                </div>

                <span className="role-card-badge">
                  <CheckCircle2 size={14} />
                  Defined
                </span>
              </div>

              <h2>{role.name}</h2>
              <p className="role-card-description">
                {role.description}
              </p>

              <div className="role-card-user-count">
                <Users size={17} />
                <span>
                  {userCounts[role.name]}{" "}
                  {userCounts[role.name] === 1 ? "account" : "accounts"}
                </span>
              </div>

              <div className="role-permissions-heading">
                <h3>Permissions</h3>
                <span>{role.permissions.length}</span>
              </div>

              <ul className="role-permissions-list">
                {role.permissions.map((permission) => (
                  <li key={permission}>
                    <CheckCircle2 size={16} />
                    <span>{permission}</span>
                  </li>
                ))}
              </ul>
            </article>
          );
        })}
      </section>

      <section className="role-management-footer-card">
        <div className="role-footer-icon">
          <Settings size={22} />
        </div>

        <div>
          <h3>Permission enforcement</h3>
          <p>
            The current page is informational. In the completed system, the
            backend will validate user roles before allowing restricted
            operations.
          </p>
        </div>

        <FileText size={22} className="role-footer-document-icon" />
      </section>
    </div>
  );
}