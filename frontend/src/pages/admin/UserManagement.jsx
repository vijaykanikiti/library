import React, { useEffect, useMemo, useState } from "react";
import {
  Users,
  Search,
  UserRound,
  Mail,
  ShieldCheck,
  UserCheck,
  UserX,
  Eye,
  X,
} from "lucide-react";
import { sanitizeUserList } from "../../utils/auth";
import "../../styles/admin-users.css";

const MASTER_ADMIN = {
  id: 1,
  name: "Gopal Krishna",
  email: "gopalkrishnagopal6363@gmail.com",
  role: "Admin",
  status: "Active",
};

const STORAGE_KEY = "libraspace_admin_users";

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    const list = [MASTER_ADMIN];
    const registered = [];

    try {
      const savedReg = localStorage.getItem("users");
      if (savedReg) {
        const parsed = JSON.parse(savedReg);
        if (Array.isArray(parsed)) {
          registered.push(...sanitizeUserList(parsed));
        }
      }
    } catch {}

    try {
      const savedAdminUsers = localStorage.getItem(STORAGE_KEY);
      if (savedAdminUsers) {
        const parsed = JSON.parse(savedAdminUsers);
        if (Array.isArray(parsed)) {
          const cleanSaved = sanitizeUserList(parsed);
          cleanSaved.forEach((u) => {
            if (!registered.some((r) => r.email?.toLowerCase() === u.email?.toLowerCase())) {
              registered.push(u);
            }
          });
        }
      }
    } catch {}

    registered.forEach((u, idx) => {
      if (u.email?.toLowerCase() !== MASTER_ADMIN.email.toLowerCase()) {
        const rawRole = (u.role || "student").toLowerCase();
        const formattedRole =
          rawRole === "admin" ? "Admin" : rawRole === "librarian" ? "Librarian" : "Student";
        list.push({
          id: u.id || idx + 2,
          name: u.name || u.email.split("@")[0],
          email: u.email,
          role: formattedRole,
          status: u.status || "Active",
        });
      }
    });

    setUsers(list);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  }, []);

  const saveUsers = (updatedUsers) => {
    setUsers(updatedUsers);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedUsers));
  };

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchesSearch =
        user.name.toLowerCase().includes(search.toLowerCase()) ||
        user.email.toLowerCase().includes(search.toLowerCase());

      const matchesRole =
        roleFilter === "All" || user.role === roleFilter;

      const matchesStatus =
        statusFilter === "All" || user.status === statusFilter;

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, search, roleFilter, statusFilter]);

  const toggleStatus = (userId) => {
    const updatedUsers = users.map((user) => {
      if (user.id !== userId) return user;

      return {
        ...user,
        status: user.status === "Active" ? "Inactive" : "Active",
      };
    });

    saveUsers(updatedUsers);

    if (selectedUser?.id === userId) {
      setSelectedUser(
        updatedUsers.find((user) => user.id === userId)
      );
    }
  };

  const activeUsers = users.filter(
    (user) => user.status === "Active"
  ).length;

  const inactiveUsers = users.filter(
    (user) => user.status === "Inactive"
  ).length;

  return (
    <div className="admin-users-page">
      <header className="admin-users-header">
        <div>
          <span className="admin-users-eyebrow">
            ADMINISTRATION
          </span>
          <h1>User Management</h1>
          <p>View and manage registered library users.</p>
        </div>

        <div className="admin-users-total">
          <Users size={20} />
          <div>
            <strong>{users.length}</strong>
            <span>Total Users</span>
          </div>
        </div>
      </header>

      <section className="admin-users-stats">
        <article className="admin-user-stat">
          <div className="admin-user-stat-icon">
            <Users size={22} />
          </div>
          <div>
            <span>Total Users</span>
            <h2>{users.length}</h2>
          </div>
        </article>

        <article className="admin-user-stat">
          <div className="admin-user-stat-icon active">
            <UserCheck size={22} />
          </div>
          <div>
            <span>Active Users</span>
            <h2>{activeUsers}</h2>
          </div>
        </article>

        <article className="admin-user-stat">
          <div className="admin-user-stat-icon inactive">
            <UserX size={22} />
          </div>
          <div>
            <span>Inactive Users</span>
            <h2>{inactiveUsers}</h2>
          </div>
        </article>
      </section>

      <section className="admin-users-card">
        <div className="admin-users-toolbar">
          <div>
            <h2>Registered Users</h2>
            <p>Search users and manage their status.</p>
          </div>

          <div className="admin-users-filters">
            <label className="admin-users-search">
              <Search size={18} />
              <input
                type="search"
                placeholder="Search name or email..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </label>

            <select
              aria-label="Filter by role"
              value={roleFilter}
              onChange={(event) => setRoleFilter(event.target.value)}
            >
              <option value="All">All Roles</option>
              <option value="Student">Student</option>
              <option value="Librarian">Librarian</option>
              <option value="Admin">Admin</option>
            </select>

            <select
              aria-label="Filter by status"
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value)
              }
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
        </div>

        <div className="admin-users-table-wrapper">
          <table className="admin-users-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id}>
                  <td>
                    <div className="admin-user-identity">
                      <div className="admin-user-avatar">
                        {user.name.charAt(0).toUpperCase()}
                      </div>

                      <div>
                        <strong>{user.name}</strong>
                        <span>
                          <Mail size={13} />
                          {user.email}
                        </span>
                      </div>
                    </div>
                  </td>

                  <td>
                    <span
                      className={`admin-user-role ${user.role.toLowerCase()}`}
                    >
                      <ShieldCheck size={14} />
                      {user.role}
                    </span>
                  </td>

                  <td>
                    <span
                      className={`admin-user-status ${user.status.toLowerCase()}`}
                    >
                      <span className="admin-user-status-dot" />
                      {user.status}
                    </span>
                  </td>

                  <td>
                    <div className="admin-user-actions">
                      <button
                        type="button"
                        className="admin-user-view-btn"
                        onClick={() => setSelectedUser(user)}
                        title="View user details"
                        aria-label={`View ${user.name}`}
                      >
                        <Eye size={17} />
                      </button>

                      {user.role !== "Admin" && (
                        <button
                          type="button"
                          className={`admin-user-toggle-btn ${
                            user.status === "Active"
                              ? "deactivate"
                              : "activate"
                          }`}
                          onClick={() => toggleStatus(user.id)}
                        >
                          {user.status === "Active"
                            ? "Deactivate"
                            : "Activate"}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}

              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan="4">
                    <div className="admin-users-empty">
                      <Users size={30} />
                      <strong>No users found</strong>
                      <span>
                        Try changing your search or filters.
                      </span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="admin-users-footer">
          Showing {filteredUsers.length} of {users.length} users
        </div>
      </section>

      {selectedUser && (
        <div
          className="admin-user-modal-overlay"
          onClick={() => setSelectedUser(null)}
        >
          <section
            className="admin-user-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-user-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="admin-user-modal-header">
              <h2 id="admin-user-modal-title">User Details</h2>

              <button
                type="button"
                onClick={() => setSelectedUser(null)}
                aria-label="Close user details"
              >
                <X size={20} />
              </button>
            </div>

            <div className="admin-user-modal-avatar">
              {selectedUser.name.charAt(0).toUpperCase()}
            </div>

            <h3>{selectedUser.name}</h3>
            <p className="admin-user-modal-email">
              {selectedUser.email}
            </p>

            <div className="admin-user-detail-row">
              <span>Role</span>
              <strong>{selectedUser.role}</strong>
            </div>

            <div className="admin-user-detail-row">
              <span>Account Status</span>
              <strong>{selectedUser.status}</strong>
            </div>

            <button
              type="button"
              className="admin-user-modal-close"
              onClick={() => setSelectedUser(null)}
            >
              Close
            </button>
          </section>
        </div>
      )}
    </div>
  );
}