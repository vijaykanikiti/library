import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  BookOpen,
  Users,
  UserCog,
  BookMarked,
  AlertTriangle,
  IndianRupee,
  TrendingUp,
  ArrowRight,
  Activity,
  CalendarDays,
  CheckCircle2,
  Clock,
  Settings,
  ShieldCheck,
  BarChart3,
} from "lucide-react";

import "../../styles/admin-dashboard.css";

const STORAGE_KEYS = {
  books: "libraspace_books",
  students: "libraspace_students",
  issuedBooks: "libraspace_issued_books",
  fines: "libraspace_fines",
  reservations: "libraspace_reservations",
};

function readStorage(key) {
  try {
    const data = localStorage.getItem(key);
    const parsed = data ? JSON.parse(data) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error(`Unable to read ${key}:`, error);
    return [];
  }
}

function getDaysOverdue(dueDate) {
  if (!dueDate) return 0;

  const due = new Date(`${dueDate}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (Number.isNaN(due.getTime())) return 0;

  return Math.max(
    0,
    Math.floor((today.getTime() - due.getTime()) / 86400000)
  );
}

function formatDate(dateString) {
  if (!dateString) return "—";

  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) return dateString;

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function AdminDashboard() {
  const navigate = useNavigate();

  const books = useMemo(() => readStorage(STORAGE_KEYS.books), []);
  const students = useMemo(() => readStorage(STORAGE_KEYS.students), []);
  const issuedBooks = useMemo(
    () => readStorage(STORAGE_KEYS.issuedBooks),
    []
  );
  const fines = useMemo(() => readStorage(STORAGE_KEYS.fines), []);
  const reservations = useMemo(
    () => readStorage(STORAGE_KEYS.reservations),
    []
  );

  const currentIssues = issuedBooks.filter(
    (book) => String(book.status).toUpperCase() === "ISSUED"
  );

  const returnedBooks = issuedBooks.filter(
    (book) => String(book.status).toUpperCase() === "RETURNED"
  );

  const overdueBooks = currentIssues.filter(
    (book) => getDaysOverdue(book.dueDate) > 0
  );

  const totalCopies = books.reduce(
    (total, book) => total + Number(book.totalCopies || 0),
    0
  );

  const availableCopies = books.reduce(
    (total, book) => total + Number(book.availableCopies || 0),
    0
  );

  const pendingFines = fines.filter(
    (fine) => String(fine.status).toUpperCase() === "PENDING"
  );

  const paidFines = fines.filter(
    (fine) => String(fine.status).toUpperCase() === "PAID"
  );

  const pendingFineAmount = pendingFines.reduce(
    (total, fine) => total + Number(fine.amount || 0),
    0
  );

  const collectedFineAmount = paidFines.reduce(
    (total, fine) => total + Number(fine.amount || 0),
    0
  );

  const pendingReservations = reservations.filter(
    (reservation) =>
      String(reservation.status).toUpperCase() === "PENDING"
  );

  const recentActivities = useMemo(() => {
    const issueActivities = issuedBooks.map((book) => ({
      id: `issue-${book.id}`,
      title: book.bookTitle || book.title || "Book record",
      description:
        String(book.status).toUpperCase() === "RETURNED"
          ? `${book.studentName || "A student"} returned a book`
          : `${book.studentName || "A student"} borrowed a book`,
      date: book.returnedDate || book.issueDate || book.createdDate || "",
      type:
        String(book.status).toUpperCase() === "RETURNED"
          ? "returned"
          : "issued",
    }));

    const reservationActivities = reservations.map((reservation) => ({
      id: `reservation-${reservation.id}`,
      title: reservation.bookTitle || "Book reservation",
      description: `${reservation.studentName || "A student"} — reservation ${
        String(reservation.status || "created").toLowerCase()
      }`,
      date: reservation.createdDate || reservation.reservationDate || "",
      type: "reservation",
    }));

    return [...issueActivities, ...reservationActivities]
      .sort((a, b) => {
        return String(b.date).localeCompare(String(a.date));
      })
      .slice(0, 5);
  }, [issuedBooks, reservations]);

  const stats = [
    {
      title: "Book Titles",
      value: books.length,
      detail: `${totalCopies.toLocaleString("en-IN")} total copies`,
      icon: BookOpen,
      color: "purple",
      path: "/librarian/books",
    },
    {
      title: "Registered Students",
      value: students.length,
      detail: "Student records",
      icon: Users,
      color: "blue",
      path: "/librarian/students",
    },
    {
      title: "Books Issued",
      value: currentIssues.length,
      detail: `${returnedBooks.length} returned records`,
      icon: BookMarked,
      color: "orange",
      path: "/librarian/returns",
    },
    {
      title: "Overdue Books",
      value: overdueBooks.length,
      detail: "Require attention",
      icon: AlertTriangle,
      color: "red",
      path: "/librarian/overdue",
    },
    {
      title: "Available Copies",
      value: availableCopies,
      detail: "Ready to borrow",
      icon: CheckCircle2,
      color: "green",
      path: "/librarian/books",
    },
    {
      title: "Pending Fines",
      value: `₹${pendingFineAmount.toLocaleString("en-IN")}`,
      detail: `${pendingFines.length} unpaid records`,
      icon: IndianRupee,
      color: "yellow",
      path: "/librarian/fines",
    },
  ];

  const quickActions = [
    {
      title: "User Management",
      description: "View student and librarian records",
      icon: Users,
      path: "/admin/users",
    },
    {
      title: "Role Management",
      description: "Manage application user roles",
      icon: ShieldCheck,
      path: "/admin/roles",
    },
    {
      title: "Library Overview",
      description: "Monitor books and borrowing activity",
      icon: BookOpen,
      path: "/admin/library",
    },
    {
      title: "Reports & Analytics",
      description: "Review library performance",
      icon: BarChart3,
      path: "/admin/reports",
    },
    {
      title: "System Settings",
      description: "Configure library rules",
      icon: Settings,
      path: "/admin/settings",
    },
  ];

  return (
    <div className="admin-dashboard">
      <header className="admin-dashboard-header">
        <div>
          <span className="admin-dashboard-eyebrow">
            <ShieldCheck size={16} />
            ADMINISTRATION
          </span>

          <h1>Admin Dashboard</h1>

          <p>
            Monitor library operations, user activity, and overall performance.
          </p>
        </div>

        <div className="admin-dashboard-header-badge">
          <ShieldCheck size={19} />
          <span>Administrator</span>
        </div>
      </header>

      <section className="admin-welcome-card">
        <div className="admin-welcome-content">
          <span>LIBRASPACE CONTROL CENTER</span>

          <h2>Welcome to your Admin Dashboard</h2>

          <p>
            Review your library statistics and manage important administrative
            activities from one place.
          </p>
        </div>

        <div className="admin-welcome-icon">
          <ShieldCheck size={55} />
        </div>
      </section>

      <section className="admin-section">
        <div className="admin-section-heading">
          <div>
            <h2>Library Overview</h2>
            <p>Summary of current library records.</p>
          </div>

          <span className="admin-live-badge">
            <span />
            Local Data
          </span>
        </div>

        <div className="admin-stats-grid">
          {stats.map((stat) => {
            const Icon = stat.icon;

            return (
              <button
                type="button"
                className="admin-stat-card"
                key={stat.title}
                onClick={() => navigate(stat.path)}
              >
                <div className={`admin-stat-icon ${stat.color}`}>
                  <Icon size={23} />
                </div>

                <div className="admin-stat-content">
                  <span>{stat.title}</span>
                  <strong>{stat.value}</strong>
                  <small>{stat.detail}</small>
                </div>

                <ArrowRight className="admin-stat-arrow" size={17} />
              </button>
            );
          })}
        </div>
      </section>

      <section className="admin-middle-grid">
        <div className="admin-panel">
          <div className="admin-panel-heading">
            <div>
              <h2>Fine Collection</h2>
              <p>Current fine payment summary.</p>
            </div>

            <IndianRupee size={21} />
          </div>

          <div className="admin-fine-total">
            <span>Total Collected</span>
            <strong>
              ₹{collectedFineAmount.toLocaleString("en-IN")}
            </strong>
          </div>

          <div className="admin-fine-progress">
            <div
              style={{
                width: `${
                  collectedFineAmount + pendingFineAmount > 0
                    ? (collectedFineAmount /
                        (collectedFineAmount + pendingFineAmount)) *
                      100
                    : 0
                }%`,
              }}
            />
          </div>

          <div className="admin-fine-legend">
            <div>
              <span className="admin-legend-dot collected" />
              <span>Collected</span>
              <strong>
                ₹{collectedFineAmount.toLocaleString("en-IN")}
              </strong>
            </div>

            <div>
              <span className="admin-legend-dot pending" />
              <span>Pending</span>
              <strong>₹{pendingFineAmount.toLocaleString("en-IN")}</strong>
            </div>
          </div>

          <button
            type="button"
            className="admin-text-link"
            onClick={() => navigate("/librarian/fines")}
          >
            View Fine Management <ArrowRight size={16} />
          </button>
        </div>

        <div className="admin-panel">
          <div className="admin-panel-heading">
            <div>
              <h2>Borrowing Status</h2>
              <p>Overview of recorded borrowing activity.</p>
            </div>

            <Activity size={21} />
          </div>

          <div className="admin-borrowing-row">
            <div className="admin-borrowing-icon issued">
              <BookMarked size={18} />
            </div>

            <div>
              <strong>Currently Issued</strong>
              <span>Books with students</span>
            </div>

            <b>{currentIssues.length}</b>
          </div>

          <div className="admin-borrowing-row">
            <div className="admin-borrowing-icon returned">
              <CheckCircle2 size={18} />
            </div>

            <div>
              <strong>Returned Books</strong>
              <span>Recorded returns</span>
            </div>

            <b>{returnedBooks.length}</b>
          </div>

          <div className="admin-borrowing-row">
            <div className="admin-borrowing-icon overdue">
              <AlertTriangle size={18} />
            </div>

            <div>
              <strong>Overdue Books</strong>
              <span>Past the due date</span>
            </div>

            <b>{overdueBooks.length}</b>
          </div>

          <button
            type="button"
            className="admin-text-link"
            onClick={() => navigate("/librarian/overdue")}
          >
            Review Overdue Books <ArrowRight size={16} />
          </button>
        </div>
      </section>

      <section className="admin-section">
        <div className="admin-section-heading">
          <div>
            <h2>Administrative Actions</h2>
            <p>Shortcuts to essential admin functions.</p>
          </div>
        </div>

        <div className="admin-quick-actions">
          {quickActions.map((action) => {
            const Icon = action.icon;

            return (
              <button
                type="button"
                className="admin-action-card"
                key={action.title}
                onClick={() => navigate(action.path)}
              >
                <div className="admin-action-icon">
                  <Icon size={22} />
                </div>

                <div>
                  <strong>{action.title}</strong>
                  <span>{action.description}</span>
                </div>

                <ArrowRight size={17} className="admin-action-arrow" />
              </button>
            );
          })}
        </div>
      </section>

      <section className="admin-panel admin-activity-panel">
        <div className="admin-panel-heading">
          <div>
            <h2>Recent Library Activities</h2>
            <p>Latest available issue and reservation records.</p>
          </div>

          <CalendarDays size={21} />
        </div>

        {recentActivities.length === 0 ? (
          <div className="admin-empty-state">
            <Activity size={34} />
            <h3>No recent activities</h3>
            <p>Activities will appear here when records are available.</p>
          </div>
        ) : (
          <div className="admin-activity-list">
            {recentActivities.map((activity) => (
              <div className="admin-activity-item" key={activity.id}>
                <div
                  className={`admin-activity-icon ${activity.type}`}
                >
                  {activity.type === "returned" ? (
                    <CheckCircle2 size={18} />
                  ) : activity.type === "reservation" ? (
                    <CalendarDays size={18} />
                  ) : (
                    <BookOpen size={18} />
                  )}
                </div>

                <div className="admin-activity-details">
                  <strong>{activity.description}</strong>
                  <span>{activity.title}</span>
                </div>

                <time>{formatDate(activity.date)}</time>
              </div>
            ))}
          </div>
        )}
      </section>

      <footer className="admin-dashboard-footer">
        <Clock size={15} />
        <span>
          Dashboard statistics reflect the browser records available when this
          page loads.
        </span>
      </footer>
    </div>
  );
}