import React, { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Search,
  Clock,
  IndianRupee,
  RotateCcw,
  Bell,
  BookOpen,
  CalendarDays,
  UserRound,
  CheckCircle2,
  X,
} from "lucide-react";

import "../../styles/overdue-books.css";

const STORAGE_KEY = "libraspace_issued_books";
const FINE_PER_DAY = 5;

function getStoredBooks() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];

    const parsed = JSON.parse(stored);
    if (Array.isArray(parsed)) {
      return parsed.filter(
        (b) =>
          !b.email?.endsWith("@example.com") &&
          !String(b.id || "").startsWith("ISS-100")
      );
    }
  } catch (error) {
    console.error("Unable to read issued books:", error);
  }
  return [];
}

function getDaysOverdue(dueDate) {
  if (!dueDate) return 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const due = new Date(`${dueDate}T00:00:00`);

  if (Number.isNaN(due.getTime())) return 0;

  return Math.max(
    0,
    Math.floor((today.getTime() - due.getTime()) / 86400000)
  );
}

export default function OverdueBooks() {
  const [issuedBooks, setIssuedBooks] = useState(getStoredBooks);
  const [searchTerm, setSearchTerm] = useState("");
  const [notice, setNotice] = useState("");
  const [selectedBook, setSelectedBook] = useState(null);
  const [showReturnModal, setShowReturnModal] = useState(false);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(issuedBooks));
  }, [issuedBooks]);

  const overdueBooks = useMemo(() => {
    return issuedBooks.filter((book) => {
      const isIssued = String(book.status).toUpperCase() === "ISSUED";
      const daysOverdue = getDaysOverdue(book.dueDate);

      const search = searchTerm.toLowerCase();

      const matchesSearch =
        String(book.studentName || "").toLowerCase().includes(search) ||
        String(book.studentId || "").toLowerCase().includes(search) ||
        String(book.bookTitle || "").toLowerCase().includes(search) ||
        String(book.id || "").toLowerCase().includes(search);

      return isIssued && daysOverdue > 0 && matchesSearch;
    });
  }, [issuedBooks, searchTerm]);

  const totalFine = overdueBooks.reduce(
    (total, book) => total + getDaysOverdue(book.dueDate) * FINE_PER_DAY,
    0
  );

  const handleReturn = () => {
    if (!selectedBook) return;

    const updatedBooks = issuedBooks.map((book) =>
      book.id === selectedBook.id
        ? {
            ...book,
            status: "RETURNED",
            returnedDate: new Date().toISOString().slice(0, 10),
          }
        : book
    );

    setIssuedBooks(updatedBooks);
    setShowReturnModal(false);
    setSelectedBook(null);
    setNotice("Book marked as returned successfully.");
  };

  const handleReminder = (book) => {
    setNotice(
      `Reminder prepared for ${book.studentName || "the student"}. Email delivery is not configured yet.`
    );
  };

  return (
    <div className="overdue-page">
      <div className="overdue-header">
        <div>
          <div className="overdue-eyebrow">
            <AlertTriangle size={16} />
            LIBRARY CIRCULATION
          </div>

          <h1>Overdue Books</h1>

          <p>
            Track late returns, review estimated fines, and manage outstanding
            books.
          </p>
        </div>

        <div className="overdue-header-icon">
          <Clock size={30} />
        </div>
      </div>

      {notice && (
        <div className="overdue-notice" role="status">
          <CheckCircle2 size={18} />
          <span>{notice}</span>
          <button
            type="button"
            aria-label="Dismiss notification"
            onClick={() => setNotice("")}
          >
            <X size={17} />
          </button>
        </div>
      )}

      <div className="overdue-stats">
        <div className="overdue-stat-card">
          <div className="overdue-stat-icon red">
            <AlertTriangle size={21} />
          </div>
          <div>
            <span>Overdue Books</span>
            <strong>{overdueBooks.length}</strong>
            <small>Awaiting return</small>
          </div>
        </div>

        <div className="overdue-stat-card">
          <div className="overdue-stat-icon orange">
            <IndianRupee size={21} />
          </div>
          <div>
            <span>Estimated Fines</span>
            <strong>₹{totalFine.toLocaleString("en-IN")}</strong>
            <small>₹{FINE_PER_DAY} per overdue day</small>
          </div>
        </div>

        <div className="overdue-stat-card">
          <div className="overdue-stat-icon blue">
            <CalendarDays size={21} />
          </div>
          <div>
            <span>Longest Overdue</span>
            <strong>
              {overdueBooks.length
                ? Math.max(
                    ...overdueBooks.map((book) =>
                      getDaysOverdue(book.dueDate)
                    )
                  )
                : 0}{" "}
              days
            </strong>
            <small>Days past due date</small>
          </div>
        </div>
      </div>

      <section className="overdue-content-card">
        <div className="overdue-section-heading">
          <div>
            <h2>Overdue Records</h2>
            <p>Search students and books that have not been returned on time.</p>
          </div>

          <span className="overdue-record-count">
            {overdueBooks.length} records
          </span>
        </div>

        <div className="overdue-search">
          <Search size={19} />
          <input
            type="search"
            placeholder="Search by student, student ID, book, or issue ID..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
        </div>

        {overdueBooks.length === 0 ? (
          <div className="overdue-empty">
            <CheckCircle2 size={42} />
            <h3>No overdue books found</h3>
            <p>
              There are no overdue records matching your search.
            </p>
          </div>
        ) : (
          <div className="overdue-table-wrapper">
            <table className="overdue-table">
              <thead>
                <tr>
                  <th>Book Details</th>
                  <th>Student</th>
                  <th>Due Date</th>
                  <th>Late By</th>
                  <th>Estimated Fine</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {overdueBooks.map((book) => {
                  const daysLate = getDaysOverdue(book.dueDate);
                  const fine = daysLate * FINE_PER_DAY;

                  return (
                    <tr key={book.id}>
                      <td>
                        <div className="overdue-book-cell">
                          <div className="overdue-book-icon">
                            <BookOpen size={20} />
                          </div>
                          <div>
                            <strong>{book.bookTitle || "Untitled book"}</strong>
                            <span>{book.author || "Author not available"}</span>
                            <small>Issue ID: {book.id}</small>
                          </div>
                        </div>
                      </td>

                      <td>
                        <div className="overdue-student-cell">
                          <div className="overdue-student-icon">
                            <UserRound size={18} />
                          </div>
                          <div>
                            <strong>{book.studentName || "Unknown student"}</strong>
                            <span>{book.studentId || "No student ID"}</span>
                          </div>
                        </div>
                      </td>

                      <td>
                        <span className="overdue-date">
                          {book.dueDate || "Not available"}
                        </span>
                      </td>

                      <td>
                        <span className="overdue-late-badge">
                          {daysLate} {daysLate === 1 ? "day" : "days"}
                        </span>
                      </td>

                      <td>
                        <strong className="overdue-fine">
                          ₹{fine.toLocaleString("en-IN")}
                        </strong>
                      </td>

                      <td>
                        <div className="overdue-actions">
                          <button
                            type="button"
                            className="overdue-remind-button"
                            onClick={() => handleReminder(book)}
                            title="Prepare reminder"
                          >
                            <Bell size={16} />
                            Remind
                          </button>

                          <button
                            type="button"
                            className="overdue-return-button"
                            onClick={() => {
                              setSelectedBook(book);
                              setShowReturnModal(true);
                            }}
                            title="Mark book as returned"
                          >
                            <RotateCcw size={16} />
                            Return
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="overdue-footnote">
          <AlertTriangle size={16} />
          <span>
            Fine amounts are estimates calculated at ₹{FINE_PER_DAY} per
            overdue day. Actual fine collection is not connected to a payment
            system.
          </span>
        </div>
      </section>

      {showReturnModal && selectedBook && (
        <div
          className="overdue-modal-overlay"
          onClick={() => setShowReturnModal(false)}
        >
          <div
            className="overdue-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="return-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="overdue-modal-icon">
              <RotateCcw size={25} />
            </div>

            <h2 id="return-modal-title">Confirm Book Return</h2>

            <p>
              Mark <strong>{selectedBook.bookTitle}</strong> as returned by{" "}
              <strong>{selectedBook.studentName}</strong>?
            </p>

            <div className="overdue-modal-actions">
              <button
                type="button"
                className="overdue-cancel-button"
                onClick={() => {
                  setShowReturnModal(false);
                  setSelectedBook(null);
                }}
              >
                Cancel
              </button>

              <button
                type="button"
                className="overdue-confirm-button"
                onClick={handleReturn}
              >
                Confirm Return
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}