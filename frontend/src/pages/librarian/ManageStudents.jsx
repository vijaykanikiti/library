import React, { useMemo, useState } from "react";
import {
  ArrowLeft,
  Search,
  Users,
  UserRound,
  Mail,
  GraduationCap,
  Eye,
  Pencil,
  CheckCircle,
  XCircle,
  X,
  Save,
  RotateCcw,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import { sanitizeUserList } from "../../utils/auth";
import "../../styles/manage-students.css";

const emptyStudent = {
  id: "",
  name: "",
  email: "",
  department: "",
  year: "",
  phone: "",
  status: "ACTIVE",
  joinedDate: "",
};

const formatDate = (dateString) => {
  if (!dateString) return "—";

  return new Date(`${dateString}T00:00:00`).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

export default function ManageStudents() {
  const navigate = useNavigate();

  const [students, setStudents] = useState(() => {
    const list = [];
    try {
      const saved = localStorage.getItem("libraspace_students");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          list.push(...sanitizeUserList(parsed));
        }
      }
    } catch {}

    try {
      const savedUsers = localStorage.getItem("users");
      if (savedUsers) {
        const parsed = JSON.parse(savedUsers);
        if (Array.isArray(parsed)) {
          const cleanUsers = sanitizeUserList(parsed);
          cleanUsers.forEach((u) => {
            if (
              (u.role || "").toLowerCase() === "student" &&
              !list.some((s) => s.email?.toLowerCase() === u.email?.toLowerCase())
            ) {
              list.push({
                id: "STU" + String(u.id || Date.now()).slice(-4),
                name: u.name || u.email.split("@")[0],
                email: u.email,
                department: u.department || "General Studies",
                year: u.year || "1st Year",
                phone: u.phone || "—",
                status: u.status || "ACTIVE",
                joinedDate: u.joinedDate || new Date().toISOString().split("T")[0],
              });
            }
          });
        }
      }
    } catch {}

    localStorage.setItem("libraspace_students", JSON.stringify(list));
    return list;
  });

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [editingStudent, setEditingStudent] = useState(null);
  const [form, setForm] = useState(emptyStudent);
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState("");

  const saveStudents = (updatedStudents) => {
    setStudents(updatedStudents);

    localStorage.setItem(
      "libraspace_students",
      JSON.stringify(updatedStudents)
    );
  };

  const activeCount = students.filter(
    (student) => student.status === "ACTIVE"
  ).length;

  const inactiveCount = students.filter(
    (student) => student.status === "INACTIVE"
  ).length;

  const filteredStudents = useMemo(() => {
    const query = search.trim().toLowerCase();

    return students.filter((student) => {
      const matchesSearch =
        String(student.id || "").toLowerCase().includes(query) ||
        String(student.name || "").toLowerCase().includes(query) ||
        String(student.email || "").toLowerCase().includes(query) ||
        String(student.department || "").toLowerCase().includes(query);

      const matchesStatus =
        statusFilter === "ALL" || student.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [students, search, statusFilter]);

  const openEditModal = (student) => {
    setEditingStudent(student);

    setForm({
      ...student,
    });

    setErrors({});
    setMessage("");
  };

  const handleFormChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    setErrors((previous) => ({
      ...previous,
      [name]: "",
    }));
  };

  const handleUpdateStudent = (event) => {
    event.preventDefault();

    const newErrors = {};

    if (!form.name.trim()) {
      newErrors.name = "Student name is required.";
    }

    if (!form.email.trim()) {
      newErrors.email = "Email address is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = "Enter a valid email address.";
    }

    if (form.phone && !/^[0-9+\-\s()]{7,20}$/.test(form.phone)) {
      newErrors.phone = "Enter a valid phone number.";
    }

    const duplicateEmail = students.some(
      (student) =>
        student.id !== editingStudent.id &&
        student.email.toLowerCase() === form.email.trim().toLowerCase()
    );

    if (duplicateEmail) {
      newErrors.email = "This email is already assigned to another student.";
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) return;

    const updatedStudents = students.map((student) =>
      student.id === editingStudent.id
        ? {
            ...student,
            ...form,
            name: form.name.trim(),
            email: form.email.trim(),
            phone: form.phone.trim(),
          }
        : student
    );

    saveStudents(updatedStudents);

    setMessage(`Student ${form.name.trim()} updated successfully.`);
    setEditingStudent(null);
    setForm(emptyStudent);
    setErrors({});
  };

  const toggleStudentStatus = (student) => {
    const newStatus =
      student.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";

    const updatedStudents = students.map((item) =>
      item.id === student.id
        ? { ...item, status: newStatus }
        : item
    );

    saveStudents(updatedStudents);

    setMessage(
      `${student.name}'s status changed to ${newStatus.toLowerCase()}.`
    );

    setSelectedStudent((current) =>
      current?.id === student.id
        ? { ...current, status: newStatus }
        : current
    );
  };

  const resetFilters = () => {
    setSearch("");
    setStatusFilter("ALL");
    setMessage("");
  };

  return (
    <div className="manage-students-page">
      <header className="students-page-header">
        <div>
          <button
            type="button"
            className="students-back-button"
            onClick={() => navigate("/librarian/dashboard")}
          >
            <ArrowLeft size={17} />
            Back to Dashboard
          </button>

          <div className="students-heading-row">
            <div className="students-heading-icon">
              <Users size={28} />
            </div>

            <div>
              <h1>Manage Students</h1>
              <p>View student profiles and manage account status.</p>
            </div>
          </div>
        </div>

        <div className="students-header-badge">
          <GraduationCap size={19} />
          Student Directory
        </div>
      </header>

      {message && (
        <div className="students-message" role="status">
          <CheckCircle size={19} />
          <span>{message}</span>

          <button
            type="button"
            onClick={() => setMessage("")}
            aria-label="Dismiss message"
          >
            <X size={17} />
          </button>
        </div>
      )}

      <section className="students-stats-grid">
        <article className="students-stat-card">
          <div className="students-stat-icon total">
            <Users size={22} />
          </div>

          <div>
            <p>Total Students</p>
            <h2>{students.length}</h2>
          </div>
        </article>

        <article className="students-stat-card">
          <div className="students-stat-icon active">
            <CheckCircle size={22} />
          </div>

          <div>
            <p>Active Students</p>
            <h2>{activeCount}</h2>
          </div>
        </article>

        <article className="students-stat-card">
          <div className="students-stat-icon inactive">
            <XCircle size={22} />
          </div>

          <div>
            <p>Inactive Students</p>
            <h2>{inactiveCount}</h2>
          </div>
        </article>
      </section>

      <section className="students-table-card">
        <div className="students-toolbar">
          <div className="students-search">
            <Search size={19} />

            <input
              type="text"
              placeholder="Search by name, ID, email, or department..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              aria-label="Search students"
            />
          </div>

          <select
            className="students-status-filter"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            aria-label="Filter students by status"
          >
            <option value="ALL">All Students</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>

          <button
            type="button"
            className="students-reset-button"
            onClick={resetFilters}
          >
            <RotateCcw size={16} />
            Reset
          </button>
        </div>

        <div className="students-table-heading">
          <div>
            <h2>Student Directory</h2>
            <p>
              Showing {filteredStudents.length} of {students.length} students
            </p>
          </div>
        </div>

        <div className="students-table-wrapper">
          <table className="students-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Department</th>
                <th>Academic Year</th>
                <th>Joined Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredStudents.map((student) => (
                <tr key={student.id}>
                  <td>
                    <div className="student-directory-cell">
                      <div className="student-directory-avatar">
                        {student.name.charAt(0).toUpperCase()}
                      </div>

                      <div>
                        <strong>{student.name}</strong>
                        <small>{student.id}</small>
                        <small className="student-email">
                          <Mail size={12} />
                          {student.email}
                        </small>
                      </div>
                    </div>
                  </td>

                  <td>
                    <span className="student-department">
                      {student.department || "—"}
                    </span>
                  </td>

                  <td>{student.year || "—"}</td>

                  <td>{formatDate(student.joinedDate)}</td>

                  <td>
                    <span
                      className={`student-account-status ${student.status.toLowerCase()}`}
                    >
                      <span className="student-status-dot" />
                      {student.status}
                    </span>
                  </td>

                  <td>
                    <div className="student-row-actions">
                      <button
                        type="button"
                        className="student-view-button"
                        title="View student details"
                        aria-label={`View ${student.name}`}
                        onClick={() => setSelectedStudent(student)}
                      >
                        <Eye size={16} />
                      </button>

                      <button
                        type="button"
                        className="student-edit-button"
                        title="Edit student"
                        aria-label={`Edit ${student.name}`}
                        onClick={() => openEditModal(student)}
                      >
                        <Pencil size={16} />
                      </button>

                      <button
                        type="button"
                        className={
                          student.status === "ACTIVE"
                            ? "student-deactivate-button"
                            : "student-activate-button"
                        }
                        title={
                          student.status === "ACTIVE"
                            ? "Deactivate student"
                            : "Activate student"
                        }
                        aria-label={`Change status for ${student.name}`}
                        onClick={() => toggleStudentStatus(student)}
                      >
                        {student.status === "ACTIVE" ? (
                          <XCircle size={16} />
                        ) : (
                          <CheckCircle size={16} />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredStudents.length === 0 && (
                <tr>
                  <td colSpan="6" className="students-empty-state">
                    <Users size={32} />
                    <strong>No students found</strong>
                    <span>Try changing your search or status filter.</span>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {selectedStudent && (
        <div
          className="student-modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setSelectedStudent(null);
            }
          }}
        >
          <div
            className="student-detail-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="student-detail-title"
          >
            <div className="student-modal-header">
              <div>
                <h2 id="student-detail-title">Student Details</h2>
                <p>Student profile information</p>
              </div>

              <button
                type="button"
                className="student-modal-close"
                onClick={() => setSelectedStudent(null)}
                aria-label="Close student details"
              >
                <X size={19} />
              </button>
            </div>

            <div className="student-profile-summary">
              <div className="student-profile-avatar">
                {selectedStudent.name.charAt(0).toUpperCase()}
              </div>

              <h3>{selectedStudent.name}</h3>
              <span>{selectedStudent.id}</span>

              <span
                className={`student-account-status ${selectedStudent.status.toLowerCase()}`}
              >
                <span className="student-status-dot" />
                {selectedStudent.status}
              </span>
            </div>

            <div className="student-detail-list">
              <div>
                <span>Email Address</span>
                <strong>{selectedStudent.email}</strong>
              </div>

              <div>
                <span>Phone Number</span>
                <strong>{selectedStudent.phone || "Not provided"}</strong>
              </div>

              <div>
                <span>Department</span>
                <strong>{selectedStudent.department || "Not provided"}</strong>
              </div>

              <div>
                <span>Academic Year</span>
                <strong>{selectedStudent.year || "Not provided"}</strong>
              </div>

              <div>
                <span>Joined Date</span>
                <strong>{formatDate(selectedStudent.joinedDate)}</strong>
              </div>
            </div>

            <button
              type="button"
              className="student-modal-edit-button"
              onClick={() => {
                openEditModal(selectedStudent);
                setSelectedStudent(null);
              }}
            >
              <Pencil size={16} />
              Edit Student
            </button>
          </div>
        </div>
      )}

      {editingStudent && (
        <div
          className="student-modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setEditingStudent(null);
              setErrors({});
            }
          }}
        >
          <form
            className="student-edit-modal"
            onSubmit={handleUpdateStudent}
            noValidate
          >
            <div className="student-modal-header">
              <div>
                <h2>Edit Student</h2>
                <p>Update the student's profile information.</p>
              </div>

              <button
                type="button"
                className="student-modal-close"
                onClick={() => {
                  setEditingStudent(null);
                  setErrors({});
                }}
                aria-label="Close edit form"
              >
                <X size={19} />
              </button>
            </div>

            <div className="student-edit-grid">
              <div className="student-edit-field">
                <label htmlFor="editStudentName">Full Name *</label>
                <input
                  id="editStudentName"
                  name="name"
                  value={form.name}
                  onChange={handleFormChange}
                />
                {errors.name && (
                  <small className="student-field-error">
                    {errors.name}
                  </small>
                )}
              </div>

              <div className="student-edit-field">
                <label htmlFor="editStudentEmail">Email Address *</label>
                <input
                  id="editStudentEmail"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleFormChange}
                />
                {errors.email && (
                  <small className="student-field-error">
                    {errors.email}
                  </small>
                )}
              </div>

              <div className="student-edit-field">
                <label htmlFor="editStudentPhone">Phone Number</label>
                <input
                  id="editStudentPhone"
                  name="phone"
                  value={form.phone}
                  onChange={handleFormChange}
                />
                {errors.phone && (
                  <small className="student-field-error">
                    {errors.phone}
                  </small>
                )}
              </div>

              <div className="student-edit-field">
                <label htmlFor="editStudentDepartment">Department</label>
                <input
                  id="editStudentDepartment"
                  name="department"
                  value={form.department}
                  onChange={handleFormChange}
                />
              </div>

              <div className="student-edit-field">
                <label htmlFor="editStudentYear">Academic Year</label>
                <select
                  id="editStudentYear"
                  name="year"
                  value={form.year}
                  onChange={handleFormChange}
                >
                  <option value="">Select year</option>
                  <option value="1st Year">1st Year</option>
                  <option value="2nd Year">2nd Year</option>
                  <option value="3rd Year">3rd Year</option>
                  <option value="4th Year">4th Year</option>
                </select>
              </div>
            </div>

            <div className="student-edit-actions">
              <button
                type="button"
                className="student-edit-cancel"
                onClick={() => {
                  setEditingStudent(null);
                  setErrors({});
                }}
              >
                Cancel
              </button>

              <button type="submit" className="student-edit-save">
                <Save size={16} />
                Save Changes
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}