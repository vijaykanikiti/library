import React, { useMemo, useState } from "react";

import {
  Search,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Clock,
  Star,
  Eye,
  X,
  History,
  BookMarked,
} from "lucide-react";

import "../../styles/borrowing-history.css";

const initialHistory = [];

function formatDate(dateString) {
  if (!dateString) return "Not returned";

  return new Date(`${dateString}T00:00:00`).toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  );
}

export default function BorrowingHistory() {
  const [history, setHistory] = useState(() => {
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
              returnDate: b.returnDate || (b.status === "RETURNED" ? new Date().toISOString().split("T")[0] : null),
              status: b.status === "RETURNED" ? "Returned" : "Borrowed",
              rating: 5,
              fine: 0,
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

  const filteredHistory = useMemo(() => {
    const query = search.trim().toLowerCase();

    return history.filter((book) => {
      const matchesSearch =
        !query ||
        book.title.toLowerCase().includes(query) ||
        book.author.toLowerCase().includes(query) ||
        book.isbn.includes(query);

      const matchesFilter =
        filter === "All" || book.status === filter;

      return matchesSearch && matchesFilter;
    });
  }, [history, search, filter]);

  const totalBorrowed = history.length;

  const returnedCount = history.filter(
    (book) => book.status === "Returned"
  ).length;

  const currentlyBorrowed = history.filter(
    (book) => book.status === "Borrowed"
  ).length;

  const totalFines = history.reduce(
    (total, book) => total + book.fine,
    0
  );

  function submitRating(book, rating) {
    if (book.status !== "Returned") {
      setMessage("You can rate a book after returning it.");
      return;
    }

    setHistory((previous) =>
      previous.map((item) =>
        item.id === book.id
          ? { ...item, rating }
          : item
      )
    );

    setSelectedBook((previous) =>
      previous && previous.id === book.id
        ? { ...previous, rating }
        : previous
    );

    setMessage(`Your rating for "${book.title}" has been saved.`);
  }

  return (
    <div className="borrowing-history-page">
      <section className="history-header">
        <div>
          <span className="history-eyebrow">
            <History size={17} />
            STUDENT LIBRARY
          </span>

          <h1>Borrowing History</h1>

          <p>
            Review your reading journey and keep track of your
            previous and current borrowing records.
          </p>
        </div>
      </section>
      <section className="history-stats">
        <article className="history-stat-card">
          <div className="history-stat-icon history-purple">
            <BookOpen size={22} />
          </div>

          <div>
            <span>Total Records</span>
            <h2>{totalBorrowed}</h2>
          </div>
        </article>

        <article className="history-stat-card">
          <div className="history-stat-icon history-green">
            <CheckCircle2 size={22} />
          </div>

          <div>
            <span>Books Returned</span>
            <h2>{returnedCount}</h2>
          </div>
        </article>

        <article className="history-stat-card">
          <div className="history-stat-icon history-orange">
            <Clock size={22} />
          </div>

          <div>
            <span>Currently Borrowed</span>
            <h2>{currentlyBorrowed}</h2>
          </div>
        </article>

        <article className="history-stat-card">
          <div className="history-stat-icon history-red">
            <BookMarked size={22} />
          </div>

          <div>
            <span>Total Fines</span>
            <h2>₹{totalFines}</h2>
          </div>
        </article>
      </section>
      {message && (
        <div className="history-message" role="status">
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
      <section className="history-toolbar">
        <div className="history-search">
          <Search size={19} />

          <input
            type="search"
            placeholder="Search by title, author, or ISBN..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            aria-label="Search borrowing history"
          />
        </div>

        <select
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
          aria-label="Filter borrowing history"
        >
          <option value="All">All Records</option>
          <option value="Returned">Returned Books</option>
          <option value="Borrowed">Currently Borrowed</option>
        </select>
      </section>
      <section className="history-panel">
        <div className="history-panel-heading">
          <div>
            <h2>Your Reading Records</h2>

            <p>
              Showing {filteredHistory.length} of {history.length} records
            </p>
          </div>
        </div>

        {filteredHistory.length > 0 ? (
          <div className="history-list">
            {filteredHistory.map((book) => (
              <article className="history-card" key={book.id}>
                <div className="history-book-icon">
                  <BookOpen size={25} />
                </div>

                <div className="history-book-info">
                  <h3>{book.title}</h3>

                  <p>{book.author}</p>

                  <span>ISBN: {book.isbn}</span>

                  {book.status === "Returned" && (
                    <div className="history-rating">
                      <span>Your rating:</span>

                      <div aria-label={`${book.rating} out of 5 stars`}>
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            size={14}
                            fill={
                              star <= book.rating
                                ? "currentColor"
                                : "none"
                            }
                            className={
                              star <= book.rating
                                ? "history-star-active"
                                : "history-star-inactive"
                            }
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="history-dates">
                  <span>
                    <CalendarDays size={14} />
                    Issued: {formatDate(book.issueDate)}
                  </span>

                  <strong>
                    <CheckCircle2 size={14} />
                    Returned: {formatDate(book.returnDate)}
                  </strong>
                </div>

                <div className="history-actions">
                  <span
                    className={`history-status ${
                      book.status === "Returned"
                        ? "history-status-returned"
                        : "history-status-borrowed"
                    }`}
                  >
                    {book.status === "Returned"
                      ? "Returned"
                      : "Currently Borrowed"}
                  </span>

                  <button
                    type="button"
                    className="history-details-button"
                    onClick={() => setSelectedBook(book)}
                  >
                    <Eye size={15} />
                    Details
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="history-empty">
            <History size={40} />

            <h3>No borrowing records found</h3>

            <p>Try a different search term or filter.</p>
          </div>
        )}
      </section>


      {selectedBook && (
        <div
          className="history-modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setSelectedBook(null);
            }
          }}
        >
          <section
            className="history-details-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="history-details-title"
          >
            <div className="history-modal-heading">
              <div>
                <span>BORROWING DETAILS</span>

                <h2 id="history-details-title">
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

            <p className="history-modal-author">
              {selectedBook.author}
            </p>

            <div className="history-modal-grid">
              <div>
                <span>ISBN</span>
                <strong>{selectedBook.isbn}</strong>
              </div>

              <div>
                <span>Status</span>
                <strong>{selectedBook.status}</strong>
              </div>

              <div>
                <span>Issue Date</span>
                <strong>{formatDate(selectedBook.issueDate)}</strong>
              </div>

              <div>
                <span>Return Date</span>
                <strong>{formatDate(selectedBook.returnDate)}</strong>
              </div>

              <div>
                <span>Fine Amount</span>
                <strong>₹{selectedBook.fine}</strong>
              </div>
            </div>

            {selectedBook.status === "Returned" && (
              <div className="history-rating-editor">
                <span>Rate this book</span>

                <div>
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <button
                      key={rating}
                      type="button"
                      aria-label={`Rate ${rating} stars`}
                      onClick={() =>
                        submitRating(selectedBook, rating)
                      }
                    >
                      <Star
                        size={23}
                        fill={
                          rating <= selectedBook.rating
                            ? "currentColor"
                            : "none"
                        }
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}

            <button
              type="button"
              className="history-modal-close"
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