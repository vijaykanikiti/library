import React from "react";
import { useNavigate } from "react-router-dom";

import {
  BookOpen,
  BookMarked,
  Users,
  Clock,
  TrendingUp,
  ArrowRight,
  PlusCircle,
  ClipboardList,
  RotateCcw,
  LibraryBig,
  Activity,
} from "lucide-react";

import { sanitizeUserList } from "../../utils/auth";
import ThemeToggle from "../../components/ThemeToggle";

import "../../styles/librarian-dashboard.css";

const quickActions = [
  {
    title: "Add New Book",
    description: "Add a book to the catalog",
    icon: PlusCircle,
    path: "/librarian/books/add",
  },
  {
    title: "Issue a Book",
    description: "Issue a book to a student",
    icon: BookMarked,
    path: "/librarian/issue-book",
  },
  {
    title: "Process Return",
    description: "Record a returned book",
    icon: RotateCcw,
    path: "/librarian/returns",
  },
  {
    title: "Manage Books",
    description: "View and update inventory",
    icon: ClipboardList,
    path: "/librarian/books",
  },
];

export default function LibrarianDashboard() {
  const navigate = useNavigate();

  const [metrics, setMetrics] = React.useState({
    totalBooks: 0,
    availableBooks: 0,
    issuedBooks: 0,
    registeredStudents: 0,
    overdueBooks: 0,
  });

  const [activities, setActivities] = React.useState([]);

  React.useEffect(() => {
    let books = [];
    let issued = [];
    let studentsCount = 0;

    try {
      const bData = localStorage.getItem("libraspace_books");
      if (bData) {
        const parsed = JSON.parse(bData);
        if (Array.isArray(parsed)) books = parsed;
      }
    } catch {}

    try {
      const iData = localStorage.getItem("libraspace_issued_books");
      if (iData) {
        const parsed = JSON.parse(iData);
        if (Array.isArray(parsed)) {
          issued = parsed.filter(
            (item) =>
              !item.email?.endsWith("@example.com") &&
              !String(item.id || "").startsWith("ISS-100") &&
              item.id !== 1001 &&
              item.id !== 1002 &&
              item.id !== 1003
          );
        }
      }
    } catch {}

    try {
      const sData = localStorage.getItem("libraspace_students");
      const uData = localStorage.getItem("users");
      const sList = [];
      if (sData) {
        const parsed = JSON.parse(sData);
        if (Array.isArray(parsed)) sList.push(...sanitizeUserList(parsed));
      }
      if (uData) {
        const parsed = JSON.parse(uData);
        if (Array.isArray(parsed)) {
          sanitizeUserList(parsed).forEach((u) => {
            if (
              (u.role || "").toLowerCase() === "student" &&
              !sList.some((s) => s.email?.toLowerCase() === u.email?.toLowerCase())
            ) {
              sList.push(u);
            }
          });
        }
      }
      studentsCount = sList.length;
    } catch {}

    const totalCopies = books.reduce((sum, b) => sum + (Number(b.totalCopies) || 1), 0);
    const availCopies = books.reduce((sum, b) => sum + (Number(b.availableCopies) || 0), 0);
    const activeIssues = issued.filter((i) => (i.status || "").toUpperCase() === "ISSUED");

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const overdueCount = activeIssues.filter((i) => {
      if (!i.dueDate) return false;
      const due = new Date(`${i.dueDate}T00:00:00`);
      return !Number.isNaN(due.getTime()) && due < today;
    }).length;

    setMetrics({
      totalBooks: totalCopies,
      availableBooks: availCopies,
      issuedBooks: activeIssues.length,
      registeredStudents: studentsCount,
      overdueBooks: overdueCount,
    });

    const recent = issued.slice(-5).reverse().map((rec, idx) => ({
      id: rec.id || idx,
      title: rec.status === "RETURNED" ? "Book returned" : "Book issued",
      description: `${rec.studentName || "Student"} - ${rec.bookTitle || "Book"}`,
      time: rec.issueDate || "Recent",
      type: rec.status === "RETURNED" ? "return" : "issue",
    }));

    setActivities(recent);
  }, []);

  const statistics = [
    {
      title: "Total Books",
      value: metrics.totalBooks.toLocaleString("en-IN"),
      description: "Books in the library",
      icon: BookOpen,
      color: "blue",
    },
    {
      title: "Available Books",
      value: metrics.availableBooks.toLocaleString("en-IN"),
      description: "Ready for borrowing",
      icon: LibraryBig,
      color: "green",
    },
    {
      title: "Issued Books",
      value: metrics.issuedBooks.toLocaleString("en-IN"),
      description: "Currently borrowed",
      icon: BookMarked,
      color: "purple",
    },
    {
      title: "Registered Students",
      value: metrics.registeredStudents.toLocaleString("en-IN"),
      description: "Library members",
      icon: Users,
      color: "orange",
    },
    {
      title: "Overdue Books",
      value: metrics.overdueBooks.toLocaleString("en-IN"),
      description: "Require attention",
      icon: Clock,
      color: "red",
    },
  ];



  return (
    <div className="librarian-dashboard">
      <header className="librarian-dashboard-header">
        <div className="librarian-header-welcome">
          <span className="librarian-eyebrow">
            LIBRARY MANAGEMENT
          </span>

          <h1>Good day, Librarian! 👋</h1>

          <p>
            Here's an overview of your library operations.
          </p>
        </div>
        <div className="librarian-header-actions">
          <ThemeToggle />

          <div className="librarian-header-badge">
            <LibraryBig size={20} />
            <span>Librarian Workspace</span>
          </div>
        </div>
      </header>
      <section className="librarian-stats-grid">
        {statistics.map((stat) => {
          const Icon = stat.icon;

          return (
            <article
              className="librarian-stat-card"
              key={stat.title}
            >
              <div className="librarian-stat-top">
                <span
                  className={`librarian-stat-icon ${stat.color}`}
                >
                  <Icon size={23} />
                </span>

                <TrendingUp
                  size={18}
                  className="librarian-stat-trend"
                />
              </div>

              <p className="librarian-stat-title">
                {stat.title}
              </p>

              <h2>{stat.value}</h2>

              <span className="librarian-stat-description">
                {stat.description}
              </span>
            </article>
          );
        })}
      </section>
      <section className="librarian-section">
        <div className="librarian-section-heading">
          <div>
            <h2>Quick Actions</h2>
            <p>Common library management tasks</p>
          </div>

          <Activity size={22} />
        </div>

        <div className="librarian-actions-grid">
          {quickActions.map((action) => {
            const Icon = action.icon;

            return (
              <button
                type="button"
                className="librarian-action-card"
                key={action.title}
                onClick={() => navigate(action.path)}
              >
                <span className="librarian-action-icon">
                  <Icon size={24} />
                </span>

                <span className="librarian-action-content">
                  <strong>{action.title}</strong>
                  <small>{action.description}</small>
                </span>

                <ArrowRight size={19} />
              </button>
            );
          })}
        </div>
      </section>
      <section className="librarian-section">
        <div className="librarian-section-heading">
          <div>
            <h2>Recent Activities</h2>
            <p>Recent library operations</p>
          </div>

          <Clock size={22} />
        </div>

        <div className="librarian-activity-list">
          {activities.length > 0 ? (
            activities.map((activity) => (
              <article
                className="librarian-activity-item"
                key={activity.id}
              >
                <span
                  className={`librarian-activity-icon ${activity.type}`}
                >
                  {activity.type === "issue" && (
                    <BookMarked size={19} />
                  )}

                  {activity.type === "return" && (
                    <RotateCcw size={19} />
                  )}

                  {activity.type === "member" && (
                    <Users size={19} />
                  )}

                  {activity.type === "overdue" && (
                    <Clock size={19} />
                  )}
                </span>

                <div className="librarian-activity-content">
                  <strong>{activity.title}</strong>

                  <p>{activity.description}</p>
                </div>

                <time>{activity.time}</time>
              </article>
            ))
          ) : (
            <div style={{ textAlign: "center", padding: "28px", color: "var(--text-secondary)" }}>
              No recent library activity recorded yet.
            </div>
          )}
        </div>
      </section>
      <div className="librarian-dashboard-note">
        <LibraryBig size={20} />

        <p>
          Keep your catalog organized and help students
          discover their next favorite book.
        </p>
      </div>
    </div>
  );
}