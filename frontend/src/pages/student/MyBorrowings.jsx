import React, { useMemo, useState } from "react";

import {
  Search,
  BookOpen,
  CalendarDays,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Eye,
  X,
  BookMarked,
} from "lucide-react";
import "../../styles/my-borrowings.css";

function getDateDifference(dateString) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const target = new Date(`${dateString}T00:00:00`);

  return Math.round(
    (target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );
}

function formatDate(dateString) {
  if (!dateString) return "—";

  return new Date(`${dateString}T00:00:00`).toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  );
}

function getCurrentStatus(book) {
  if (book.status === "Returned") {
    return "Returned";
  }

  return getDateDifference(book.dueDate) < 0
    ? "Overdue"
    : "Borrowed";
}

export default function MyBorrowings() {
  const [borrowings, setBorrowings] = useState(() => {
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
              status: b.status === "RETURNED" ? "Returned" : "Borrowed",
              returnDate: b.returnDate || null,
              renewalsUsed: b.renewalsUsed || 0,
              maxRenewals: 2,
            }));
        }
      }
    } catch {}
    return [];
  });
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [selectedBook, setSelectedBook] = useState(null);

  const [message, setMessage] = useState("");

  const enrichedBorrowings = useMemo(() => {
    return borrowings.map((book) => ({
      ...book,
      currentStatus: getCurrentStatus(book),
    }));
  }, [borrowings]);

  const filteredBorrowings = useMemo(() => {
    const query = search.trim().toLowerCase();

    return enrichedBorrowings.filter((book) => {
      const matchesSearch =
        !query ||
        book.title.toLowerCase().includes(query) ||
        book.author.toLowerCase().includes(query) ||
        book.isbn.includes(query);

      const matchesFilter =
        filter === "All" || book.currentStatus === filter;

      return matchesSearch && matchesFilter;
    });
  }, [enrichedBorrowings, search, filter]);

  const activeCount = enrichedBorrowings.filter(
    (book) => book.currentStatus === "Borrowed"
  ).length;

  const overdueCount = enrichedBorrowings.filter(
    (book) => book.currentStatus === "Overdue"
  ).length;

  const returnedCount = enrichedBorrowings.filter(
    (book) => book.currentStatus === "Returned"
  ).length;

  function handleRenew(book) {
    setMessage("");

    if (book.currentStatus === "Returned") {
      setMessage("Returned books cannot be renewed.");
      return;
    }

    if (book.currentStatus === "Overdue") {
      setMessage(
        "This book is overdue. Please contact the librarian about renewal."
      );
      return;
    }

    if (book.renewalsUsed >= book.maxRenewals) {
      setMessage("You have reached the renewal limit for this book.");
      return;
    }

    const newDueDate = new Date(`${book.dueDate}T00:00:00`);

    newDueDate.setDate(newDueDate.getDate() + 14);

    const updatedDueDate = [
      newDueDate.getFullYear(),
      String(newDueDate.getMonth() + 1).padStart(2, "0"),
      String(newDueDate.getDate()).padStart(2, "0"),
    ].join("-");

    setBorrowings((previous) =>
      previous.map((item) =>
        item.id === book.id
          ? {
              ...item,
              dueDate: updatedDueDate,
              renewalsUsed: item.renewalsUsed + 1,
            }
          : item
      )
    );

    setMessage(
      `"${book.title}" was renewed. The due date has been extended by 14 days.`
    );
  }

  return (
    <div className="my-borrowings-page">
      <section className="borrowings-header">
        <div>
          <span className="borrowings-eyebrow">
            <BookMarked size={17} />
            STUDENT LIBRARY
          </span>

          <h1>My Borrowings</h1>

          <p>
            Track your borrowed books, manage renewals, and stay on top
            of return dates.
          </p>
        </div>
      </section>
      <section className="borrowings-stats">
        <article className="borrowings-stat-card">
          <div className="borrowings-stat-icon borrowings-purple">
            <BookOpen size={23} />
          </div>

          <div>
            <span>Currently Borrowed</span>
            <h2>{activeCount}</h2>
          </div>
        </article>

        <article className="borrowings-stat-card">
          <div className="borrowings-stat-icon borrowings-orange">
            <AlertTriangle size={23} />
          </div>

          <div>
            <span>Overdue Books</span>
            <h2>{overdueCount}</h2>
          </div>
        </article>

        <article className="borrowings-stat-card">
          <div className="borrowings-stat-icon borrowings-green">
            <CheckCircle2 size={23} />
          </div>

          <div>
            <span>Returned Books</span>
            <h2>{returnedCount}</h2>
          </div>
        </article>
      </section>
      <section className="borrowings-toolbar">
        <div className="borrowings-search">
          <Search size={19} />

          <input
            type="search"
            placeholder="Search by title, author, or ISBN..."
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
          <option value="All">All Records</option>
          <option value="Borrowed">Currently Borrowed</option>
          <option value="Overdue">Overdue</option>
          <option value="Returned">Returned</option>
        </select>
      </section>
      {message && (
        <div className="borrowings-message" role="status">
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
      <section className="borrowings-panel">
        <div className="borrowings-panel-heading">
          <div>
            <h2>Borrowing Records</h2>

            <p>
              Showing {filteredBorrowings.length} of{" "}
              {borrowings.length} records
            </p>
          </div>
        </div>

        {filteredBorrowings.length > 0 ? (
          <div className="borrowings-record-list">
            {filteredBorrowings.map((book) => {
              const daysRemaining = getDateDifference(book.dueDate);

              return (
                <article
                  className="borrowing-record-card"
                  key={book.id}
                >
                  <div className="borrowing-book-icon">
                    <BookOpen size={25} />
                  </div>

                  <div className="borrowing-book-information">
                    <h3>{book.title}</h3>

                    <p>{book.author}</p>

                    <span className="borrowing-isbn">
                      ISBN: {book.isbn}
                    </span>
                  </div>

                  <div className="borrowing-date-information">
                    <span>
                      <CalendarDays size={14} />
                      Issued: {formatDate(book.issueDate)}
                    </span>

                    <strong>
                      <Clock size={14} />
                      Due: {formatDate(book.dueDate)}
                    </strong>

                    {book.currentStatus !== "Returned" && (
                      <small
                        className={
                          daysRemaining < 0
                            ? "borrowing-overdue-text"
                            : daysRemaining <= 3
                            ? "borrowing-due-soon-text"
                            : ""
                        }
                      >
                        {daysRemaining < 0
                          ? `${Math.abs(daysRemaining)} days overdue`
                          : daysRemaining === 0
                          ? "Due today"
                          : `${daysRemaining} days remaining`}
                      </small>
                    )}
                  </div>

                  <div className="borrowing-record-actions">
                    <span
                      className={`borrowing-status ${
                        book.currentStatus === "Returned"
                          ? "borrowing-status-returned"
                          : book.currentStatus === "Overdue"
                          ? "borrowing-status-overdue"
                          : "borrowing-status-active"
                      }`}
                    >
                      {book.currentStatus}
                    </span>

                    <button
                      type="button"
                      className="borrowing-details-button"
                      onClick={() => setSelectedBook(book)}
                    >
                      <Eye size={15} />
                      Details
                    </button>

                    {book.currentStatus !== "Returned" && (
                      <button
                        type="button"
                        className="borrowing-renew-button"
                        onClick={() => handleRenew(book)}
                      >
                        <RefreshCw size={15} />
                        Renew
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="borrowings-empty">
            <BookOpen size={40} />

            <h3>No borrowing records found</h3>

            <p>Try another search term or select a different filter.</p>
          </div>
        )}
      </section>


      {selectedBook && (
        <div
          className="borrowing-modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setSelectedBook(null);
            }
          }}
        >
          <section
            className="borrowing-details-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="borrowing-details-title"
          >
            <div className="borrowing-modal-heading">
              <div>
                <span>LOAN DETAILS</span>

                <h2 id="borrowing-details-title">
                  {selectedBook.title}
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setSelectedBook(null)}
                aria-label="Close details"
              >
                <X size={20} />
              </button>
            </div>

            <p className="borrowing-modal-author">
              {selectedBook.author}
            </p>

            <div className="borrowing-modal-grid">
              <div>
                <span>ISBN</span>
                <strong>{selectedBook.isbn}</strong>
              </div>

              <div>
                <span>Status</span>
                <strong>{selectedBook.currentStatus}</strong>
              </div>

              <div>
                <span>Issue Date</span>
                <strong>{formatDate(selectedBook.issueDate)}</strong>
              </div>

              <div>
                <span>Due Date</span>
                <strong>{formatDate(selectedBook.dueDate)}</strong>
              </div>

              {selectedBook.returnDate && (
                <div>
                  <span>Return Date</span>
                  <strong>
                    {formatDate(selectedBook.returnDate)}
                  </strong>
                </div>
              )}

              <div>
                <span>Renewals Used</span>
                <strong>
                  {selectedBook.renewalsUsed} /{" "}
                  {selectedBook.maxRenewals}
                </strong>
              </div>
            </div>

            <button
              type="button"
              className="borrowing-modal-close-button"
              onClick={() => setSelectedBook(null)}
            >
              Close Details
            </button>
          </section>
        </div>
      )}
    </div>
  );
}