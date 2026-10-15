import React, { useMemo, useState } from "react";

import {
  Search,
  BookOpen,
  CalendarDays,
  Clock,
  AlertTriangle,
  CheckCircle2,
  IndianRupee,
  Bell,
  X,
  CalendarClock,
} from "lucide-react";

import "../../styles/due-dates.css";
const initialBooks = [];

function parseDate(dateString) {
  const [year, month, day] = dateString.split("-").map(Number);

  return new Date(year, month - 1, day);
}

function formatDate(dateString) {
  if (!dateString) return "—";

  return parseDate(dateString).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getDateDifference(startDate, endDate) {
  const millisecondsPerDay = 24 * 60 * 60 * 1000;

  return Math.round(
    (parseDate(endDate).getTime() - parseDate(startDate).getTime()) /
      millisecondsPerDay
  );
}

function getBorrowingStatus(book, today) {
  if (book.status === "Returned") {
    return "Returned";
  }

  const daysRemaining = getDateDifference(today, book.dueDate);

  if (daysRemaining < 0) {
    return "Overdue";
  }

  if (daysRemaining === 0) {
    return "Due Today";
  }

  if (daysRemaining <= 3) {
    return "Due Soon";
  }

  return "On Track";
}

function getFine(book, today) {
  if (book.status === "Returned") {
    return 0;
  }

  const daysLate = Math.max(
    0,
    getDateDifference(book.dueDate, today)
  );

  return daysLate * book.dailyFine;
}

export default function DueDates() {
  const [books, setBooks] = useState(() => {
    try {
      const saved = localStorage.getItem("libraspace_issued_books");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed
            .filter(
              (b) =>
                !b.email?.endsWith("@example.com") &&
                !String(b.id || "").startsWith("ISS-100") &&
                b.id !== 1001 &&
                b.id !== 1002 &&
                b.id !== 1003
            )
            .map((b, idx) => ({
              id: b.id || idx + 1,
              title: b.bookTitle || b.title || "Library Book",
              author: b.author || "Unknown Author",
              isbn: b.isbn || "—",
              issueDate: b.issueDate || new Date().toISOString().split("T")[0],
              dueDate: b.dueDate || new Date().toISOString().split("T")[0],
              dailyFine: 5,
              status: b.status === "RETURNED" ? "Returned" : "Borrowed",
              returnDate: b.returnDate || null,
            }));
        }
      }
    } catch {}
    return [];
  });

  const [search, setSearch] = useState("");

  const [filter, setFilter] = useState("All");

  const [message, setMessage] = useState("");  const today = new Date().toLocaleDateString("en-CA");

  const processedBooks = useMemo(() => {
    return books.map((book) => ({
      ...book,
      borrowingStatus: getBorrowingStatus(book, today),
      fineAmount: getFine(book, today),
      daysRemaining: getDateDifference(today, book.dueDate),
    }));
  }, [books, today]);

  const filteredBooks = processedBooks.filter((book) => {
    const query = search.trim().toLowerCase();

    const matchesSearch =
      !query ||
      book.title.toLowerCase().includes(query) ||
      book.author.toLowerCase().includes(query) ||
      book.isbn.includes(query);

    const matchesFilter =
      filter === "All" ||
      book.borrowingStatus === filter;

    return matchesSearch && matchesFilter;
  });

  const activeBooks = processedBooks.filter(
    (book) => book.status === "Borrowed"
  );

  const overdueBooks = activeBooks.filter(
    (book) => book.borrowingStatus === "Overdue"
  );

  const dueSoonBooks = activeBooks.filter(
    (book) =>
      book.borrowingStatus === "Due Soon" ||
      book.borrowingStatus === "Due Today"
  );

  const totalFine = activeBooks.reduce(
    (sum, book) => sum + book.fineAmount,
    0
  );

  function getStatusClass(status) {
    switch (status) {
      case "Returned":
        return "due-status-returned";

      case "Overdue":
        return "due-status-overdue";

      case "Due Today":
        return "due-status-today";

      case "Due Soon":
        return "due-status-soon";

      default:
        return "due-status-track";
    }
  }

  function getStatusIcon(status) {
    if (status === "Returned") {
      return <CheckCircle2 size={15} />;
    }

    if (status === "Overdue") {
      return <AlertTriangle size={15} />;
    }

    if (status === "Due Today" || status === "Due Soon") {
      return <Clock size={15} />;
    }

    return <CalendarDays size={15} />;
  }

  function handleReturn(book) {
    if (book.status === "Returned") {
      return;
    }

    const confirmed = window.confirm(
      `Mark "${book.title}" as returned?`
    );

    if (!confirmed) {
      return;
    }

    const returnDate = new Date().toLocaleDateString("en-CA");

    setBooks((previous) =>
      previous.map((item) =>
        item.id === book.id
          ? {
              ...item,
              status: "Returned",
              returnDate,
            }
          : item
      )
    );

    setMessage(
      `"${book.title}" was marked as returned.`
    );
  }

  return (
    <div className="due-dates-page">
      <section className="due-dates-header">
        <div>
          <span className="due-dates-eyebrow">
            <CalendarClock size={17} />
            STUDENT LIBRARY
          </span>

          <h1>Due Dates & Fines</h1>

          <p>
            Track your borrowing deadlines, identify overdue books,
            and review your estimated library fines.
          </p>
        </div>
      </section>
      {dueSoonBooks.length > 0 && (
        <div className="due-reminder-banner">
          <Bell size={22} />

          <div>
            <strong>Upcoming return deadlines</strong>

            <p>
              You have {dueSoonBooks.length} book
              {dueSoonBooks.length > 1 ? "s" : ""} due today
              or within the next three days. Please check the
              dates below.
            </p>
          </div>
        </div>
      )}

      {overdueBooks.length > 0 && (
        <div className="due-overdue-banner">
          <AlertTriangle size={22} />

          <div>
            <strong>Overdue books require attention</strong>

            <p>
              {overdueBooks.length} book
              {overdueBooks.length > 1 ? "s are" : " is"} past
              the return deadline. Please contact the librarian
              about returning the books.
            </p>
          </div>
        </div>
      )}
      <section className="due-dates-stats">
        <article className="due-stat-card">
          <div className="due-stat-icon due-stat-blue">
            <BookOpen size={22} />
          </div>

          <div>
            <span>Currently Borrowed</span>
            <h2>{activeBooks.length}</h2>
          </div>
        </article>

        <article className="due-stat-card">
          <div className="due-stat-icon due-stat-red">
            <AlertTriangle size={22} />
          </div>

          <div>
            <span>Overdue Books</span>
            <h2>{overdueBooks.length}</h2>
          </div>
        </article>

        <article className="due-stat-card">
          <div className="due-stat-icon due-stat-orange">
            <Clock size={22} />
          </div>

          <div>
            <span>Due Soon</span>
            <h2>{dueSoonBooks.length}</h2>
          </div>
        </article>

        <article className="due-stat-card">
          <div className="due-stat-icon due-stat-green">
            <IndianRupee size={22} />
          </div>

          <div>
            <span>Estimated Fine</span>
            <h2>₹{totalFine}</h2>
          </div>
        </article>
      </section>
      {message && (
        <div className="due-feedback" role="status">
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
      <section className="due-toolbar">
        <div className="due-search">
          <Search size={19} />

          <input
            type="search"
            placeholder="Search by book title, author, or ISBN..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            aria-label="Search borrowing records"
          />
        </div>

        <select
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
          aria-label="Filter borrowing records"
        >
          <option value="All">All Books</option>
          <option value="On Track">On Track</option>
          <option value="Due Soon">Due Soon</option>
          <option value="Due Today">Due Today</option>
          <option value="Overdue">Overdue</option>
          <option value="Returned">Returned</option>
        </select>
      </section>
      <section className="due-books-panel">
        <div className="due-panel-heading">
          <div>
            <h2>Borrowing Deadlines</h2>

            <p>
              Showing {filteredBooks.length} of {books.length} records
            </p>
          </div>
        </div>

        {filteredBooks.length > 0 ? (
          <div className="due-books-list">
            {filteredBooks.map((book) => (
              <article className="due-book-card" key={book.id}>
                <div className="due-book-icon">
                  <BookOpen size={25} />
                </div>

                <div className="due-book-info">
                  <h3>{book.title}</h3>

                  <p>{book.author}</p>

                  <span>ISBN: {book.isbn}</span>
                </div>

                <div className="due-book-dates">
                  <span>
                    <CalendarDays size={14} />
                    Issued: {formatDate(book.issueDate)}
                  </span>

                  <strong>
                    <Clock size={14} />
                    Due: {formatDate(book.dueDate)}
                  </strong>

                  {book.status === "Borrowed" && (
                    <small>
                      {book.daysRemaining < 0
                        ? `${Math.abs(book.daysRemaining)} day(s) overdue`
                        : book.daysRemaining === 0
                          ? "Return today"
                          : `${book.daysRemaining} day(s) remaining`}
                    </small>
                  )}

                  {book.status === "Returned" && (
                    <small>
                      Returned: {formatDate(book.returnDate)}
                    </small>
                  )}
                </div>

                <div className="due-book-actions">
                  <span
                    className={`due-status-badge ${getStatusClass(
                      book.borrowingStatus
                    )}`}
                  >
                    {getStatusIcon(book.borrowingStatus)}
                    {book.borrowingStatus}
                  </span>

                  <div className="due-fine-display">
                    <span>Estimated Fine</span>

                    <strong>₹{book.fineAmount}</strong>
                  </div>

                  {book.status === "Borrowed" && (
                    <button
                      type="button"
                      className="due-return-button"
                      onClick={() => handleReturn(book)}
                    >
                      Mark as Returned
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="due-empty-state">
            <CalendarDays size={40} />

            <h3>No borrowing records found</h3>

            <p>Try another search term or filter.</p>
          </div>
        )}
      </section>
      <section className="due-fine-policy">
        <div className="due-policy-icon">
          <IndianRupee size={22} />
        </div>

        <div>
          <h3>Library Fine Policy</h3>

          <p>
            The library calculates a late fine of ₹5 per overdue day from the due date until the book is returned.
          </p>

          <small>
            Fine payments and waiver requests can be processed with the librarian.
          </small>
        </div>
      </section>
    </div>
  );
}