import React from "react";
import { Link, useOutletContext } from "react-router-dom";

import {
  BookOpen,
  BookMarked,
  Clock,
  CalendarDays,
  ArrowRight,
  Search,
  Star,
  CircleAlert,
  CheckCircle2,
  TrendingUp,
} from "lucide-react";

import "../../styles/dashboard.css";
import DashboardThemeSwitcher from "../../components/DashboardThemeSwitcher";

export default function StudentDashboard() {
  const { user } = useOutletContext();

  const userEmail = (user?.email || "").toLowerCase().trim();

  const firstName =
    user?.displayName?.trim().split(/\s+/)[0] ||
    user?.name?.trim().split(/\s+/)[0] ||
    userEmail.split("@")[0] ||
    "Student";

  const [stats, setStats] = React.useState({
    borrowed: 0,
    reading: 0,
    dueSoon: 0,
    reservations: 0,
  });

  const [myBorrowedBooks, setMyBorrowedBooks] = React.useState([]);
  const [catalogBooks, setCatalogBooks] = React.useState([]);

  React.useEffect(() => {
    let issued = [];
    let reservations = [];
    let books = [];

    try {
      const iData = localStorage.getItem("libraspace_issued_books");
      if (iData) {
        const parsed = JSON.parse(iData);
        if (Array.isArray(parsed)) {
          issued = parsed.filter(
            (b) =>
              !b.email?.endsWith("@example.com") &&
              !String(b.id || "").startsWith("ISS-100") &&
              b.id !== 1001 &&
              b.id !== 1002 &&
              b.id !== 1003
          );
        }
      }
    } catch {}

    try {
      const rData = localStorage.getItem("libraspace_reservations");
      if (rData) {
        const parsed = JSON.parse(rData);
        if (Array.isArray(parsed)) {
          reservations = parsed.filter(
            (r) =>
              !r.email?.endsWith("@example.com") &&
              !String(r.id || "").startsWith("RES00")
          );
        }
      }
    } catch {}

    try {
      const bData = localStorage.getItem("libraspace_books");
      if (bData) {
        const parsed = JSON.parse(bData);
        if (Array.isArray(parsed)) books = parsed;
      }
    } catch {}

    const myIssues = userEmail
      ? issued.filter((i) => (i.email || "").toLowerCase().trim() === userEmail)
      : issued;

    const myActive = myIssues.filter((i) => (i.status || "").toUpperCase() === "ISSUED");

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dueSoonCount = myActive.filter((b) => {
      if (!b.dueDate) return false;
      const due = new Date(`${b.dueDate}T00:00:00`);
      if (Number.isNaN(due.getTime())) return false;
      const diffDays = Math.ceil((due - today) / (1000 * 60 * 60 * 24));
      return diffDays >= 0 && diffDays <= 3;
    }).length;

    const myRes = userEmail
      ? reservations.filter((r) => (r.email || "").toLowerCase().trim() === userEmail)
      : reservations;

    setStats({
      borrowed: myIssues.length,
      reading: myActive.length,
      dueSoon: dueSoonCount,
      reservations: myRes.length,
    });

    const formattedBorrowed = myActive.map((b, idx) => {
      let progress = 50;
      let status = "On Track";
      if (b.dueDate) {
        const due = new Date(`${b.dueDate}T00:00:00`);
        const diffDays = Math.ceil((due - today) / (1000 * 60 * 60 * 24));
        if (diffDays <= 3 && diffDays >= 0) {
          status = "Due Soon";
          progress = 85;
        } else if (diffDays < 0) {
          status = "Overdue";
          progress = 100;
        }
      }
      return {
        id: b.id || idx + 1,
        title: b.bookTitle || b.title || "Library Book",
        author: b.author || "Unknown Author",
        issuedDate: b.issueDate || "Recent",
        dueDate: b.dueDate || "—",
        progress,
        status,
      };
    });

    setMyBorrowedBooks(formattedBorrowed);

    const colors = ["popular-book-one", "popular-book-two", "popular-book-three"];
    const pop = books.slice(0, 3).map((b, idx) => ({
      id: b.id || idx + 1,
      title: b.title || "Book",
      author: b.author || "Author",
      category: b.category || "General",
      rating: b.rating || "4.8",
      symbol: (b.title ? b.title.charAt(0) : "B").toUpperCase(),
      color: colors[idx % colors.length],
    }));

    setCatalogBooks(pop);
  }, [userEmail]);

  const statistics = [
    {
      title: "Books Borrowed",
      value: String(stats.borrowed).padStart(2, "0"),
      description: "Total books borrowed",
      icon: BookOpen,
      className: "stat-purple",
    },
    {
      title: "Currently Reading",
      value: String(stats.reading).padStart(2, "0"),
      description: "Books in your possession",
      icon: BookMarked,
      className: "stat-blue",
    },
    {
      title: "Due Soon",
      value: String(stats.dueSoon).padStart(2, "0"),
      description: "Return within 3 days",
      icon: Clock,
      className: "stat-orange",
    },
    {
      title: "Reservations",
      value: String(stats.reservations).padStart(2, "0"),
      description: "Books reserved",
      icon: CalendarDays,
      className: "stat-green",
    },
  ];

  return (
    <div className="student-dashboard">
      <section className="dashboard-hero">
        <div className="dashboard-hero-content">
          <span className="dashboard-hero-badge">
            <TrendingUp size={15} />
            YOUR LEARNING JOURNEY
          </span>

          <h1>
            Welcome back, {firstName}! 👋
          </h1>

          <p>
            Every page you read brings you one step closer
            to your next big discovery.
          </p>

          <Link
            to="/dashboard/books"
            className="dashboard-hero-button"
          >
            <Search size={18} />
            Discover Books
            <ArrowRight size={17} />
          </Link>
        </div>

        <div className="dashboard-hero-decoration">
          <BookOpen size={105} strokeWidth={1.2} />
        </div>
      </section>
      <section className="dashboard-stats-grid">
        {statistics.map((stat) => {
          const Icon = stat.icon;

          return (
            <article className="dashboard-stat-card" key={stat.title}>
              <div className={`dashboard-stat-icon ${stat.className}`}>
                <Icon size={23} />
              </div>

              <div className="dashboard-stat-details">
                <span>{stat.title}</span>

                <h2>{stat.value}</h2>

                <p>{stat.description}</p>
              </div>
            </article>
          );
        })}
      </section>
      <section className="dashboard-panel">
        <div className="dashboard-panel-heading">
          <div>
            <h2>My Borrowed Books</h2>

            <p>
              Track the books you are currently reading.
            </p>
          </div>

          <Link to="/dashboard/my-books">
            View All
            <ArrowRight size={16} />
          </Link>
        </div>

        <div className="borrowed-books-list">
          {myBorrowedBooks.length > 0 ? (
            myBorrowedBooks.map((book) => (
              <article className="borrowed-book-row" key={book.id}>
                <div className="borrowed-book-icon">
                  <BookOpen size={23} />
                </div>

                <div className="borrowed-book-info">
                  <h3>{book.title}</h3>

                  <p>{book.author}</p>

                  <div className="reading-progress">
                    <div className="reading-progress-track">
                      <div
                        className="reading-progress-value"
                        style={{ width: `${book.progress}%` }}
                      />
                    </div>

                    <span>{book.progress}%</span>
                  </div>
                </div>

                <div className="borrowed-book-dates">
                  <span>Issued: {book.issuedDate}</span>
                  <strong>Due: {book.dueDate}</strong>
                </div>

                <span
                  className={`borrow-status ${
                    book.status === "Due Soon"
                      ? "borrow-status-warning"
                      : "borrow-status-success"
                  }`}
                >
                  {book.status === "Due Soon" ? (
                    <CircleAlert size={14} />
                  ) : (
                    <CheckCircle2 size={14} />
                  )}

                  {book.status}
                </span>
              </article>
            ))
          ) : (
            <div style={{ padding: "24px", textAlign: "center", color: "var(--text-secondary)" }}>
              No active borrowings. Explore the collection to find your next read!
            </div>
          )}
        </div>
      </section>
      <section className="dashboard-panel popular-panel">
        <div className="dashboard-panel-heading">
          <div>
            <h2>Popular Books</h2>

            <p>
              Discover books readers love.
            </p>
          </div>

          <Link to="/dashboard/books">
            Browse Library
            <ArrowRight size={16} />
          </Link>
        </div>

        <div className="popular-books-grid">
          {catalogBooks.length > 0 ? (
            catalogBooks.map((book) => (
              <article className="popular-book-card" key={book.id}>
                <div className={`popular-book-cover ${book.color}`}>
                  <span>{book.symbol}</span>
                  <BookOpen size={27} />
                </div>

                <div className="popular-book-information">
                  <span>{book.category}</span>

                  <h3>{book.title}</h3>

                  <p>{book.author}</p>

                  <div className="popular-book-rating">
                    <Star size={15} fill="currentColor" />
                    {book.rating}
                  </div>
                </div>
              </article>
            ))
          ) : (
            <div style={{ padding: "24px", textAlign: "center", color: "var(--text-secondary)", gridColumn: "1 / -1" }}>
              No books in library catalog yet.
            </div>
          )}
        </div>
      </section>
      <section className="dashboard-quick-actions">
        <Link to="/dashboard/books" className="quick-action-card">
          <div className="quick-action-icon">
            <Search size={23} />
          </div>

          <div>
            <h3>Find a Book</h3>
            <p>Search the library collection.</p>
          </div>

          <ArrowRight size={18} />
        </Link>

        <Link
          to="/dashboard/reservations"
          className="quick-action-card"
        >
          <div className="quick-action-icon">
            <CalendarDays size={23} />
          </div>

          <div>
            <h3>My Reservations</h3>
            <p>Check your reserved books.</p>
          </div>

          <ArrowRight size={18} />
        </Link>

        <Link
          to="/dashboard/history"
          className="quick-action-card"
        >
          <div className="quick-action-icon">
            <Clock size={23} />
          </div>

          <div>
            <h3>Reading History</h3>
            <p>Review your borrowing activity.</p>
          </div>

          <ArrowRight size={18} />
        </Link>
      </section>
    </div>
  );
}