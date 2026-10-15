import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Search,
  RotateCcw,
  BookOpen,
  UserRound,
  CalendarDays,
  CheckCircle,
  Clock,
  IndianRupee,
  AlertTriangle,
} from "lucide-react";

import "../../styles/book-returns.css";

const FINE_PER_DAY = 5;

const formatDate = (dateString) => {
  if (!dateString) return "—";

  return new Date(`${dateString}T00:00:00`).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const getDaysOverdue = (dueDate) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const due = new Date(`${dueDate}T00:00:00`);
  const difference = Math.floor((today - due) / (1000 * 60 * 60 * 24));

  return Math.max(0, difference);
};

export default function BookReturns() {
  const navigate = useNavigate();

  const [records, setRecords] = useState(() => {
    try {
      const saved = localStorage.getItem("libraspace_issued_books");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.filter(
            (r) =>
              !r.email?.endsWith("@example.com") &&
              !String(r.id || "").startsWith("ISS-100") &&
              r.id !== 1001 &&
              r.id !== 1002 &&
              r.id !== 1003
          );
        }
      }
    } catch {}
    return [];
  });

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [returnedRecord, setReturnedRecord] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const activeRecords = records.filter(
    (record) => record.status === "ISSUED"
  );

  const filteredRecords = activeRecords.filter((record) => {
    const query = search.toLowerCase();

    const matchesSearch =
      String(record.studentId || "").toLowerCase().includes(query) ||
      String(record.studentName || "").toLowerCase().includes(query) ||
      String(record.bookTitle || "").toLowerCase().includes(query) ||
      String(record.bookId || "").toLowerCase().includes(query);

    const daysOverdue = getDaysOverdue(record.dueDate);

    const matchesFilter =
      filter === "ALL" ||
      (filter === "OVERDUE" && daysOverdue > 0) ||
      (filter === "ON_TIME" && daysOverdue === 0);

    return matchesSearch && matchesFilter;
  });

  const overdueCount = activeRecords.filter(
    (record) => getDaysOverdue(record.dueDate) > 0
  ).length;

  const totalFine = activeRecords.reduce((total, record) => {
    return total + getDaysOverdue(record.dueDate) * FINE_PER_DAY;
  }, 0);

  const handleReturn = (record) => {
    setReturnedRecord(record);
    setSuccessMessage("");
    setErrorMessage("");
  };

  const confirmReturn = () => {
    if (!returnedRecord) return;

    const returnedAt = new Date().toISOString();

    const updatedRecords = records.map((record) =>
      record.id === returnedRecord.id
        ? {
            ...record,
            status: "RETURNED",
            returnedAt,
            fine:
              getDaysOverdue(record.dueDate) * FINE_PER_DAY,
          }
        : record
    );

    setRecords(updatedRecords);

    localStorage.setItem(
      "libraspace_issued_books",
      JSON.stringify(updatedRecords)
    );

    setSuccessMessage(
      `"${returnedRecord.bookTitle}" has been marked as returned.`
    );

    setReturnedRecord(null);
    setErrorMessage("");
  };

  const cancelReturn = () => {
    setReturnedRecord(null);
  };

  return (
    <div className="book-returns-page">
      <header className="book-returns-header">
        <div>
          <button
            className="returns-back-button"
            type="button"
            onClick={() => navigate("/librarian/dashboard")}
          >
            <ArrowLeft size={17} />
            Back to Dashboard
          </button>

          <h1>Book Returns</h1>
          <p>Manage issued books, overdue items, and return records.</p>
        </div>

        <div className="returns-header-icon">
          <RotateCcw size={27} />
        </div>
      </header>

      {successMessage && (
        <div className="returns-success" role="status">
          <CheckCircle size={20} />
          {successMessage}
        </div>
      )}

      {errorMessage && (
        <div className="returns-error-message" role="alert">
          <AlertTriangle size={20} />
          {errorMessage}
        </div>
      )}

      <section className="returns-stats-grid">
        <article className="returns-stat-card">
          <div className="returns-stat-icon total">
            <BookOpen size={22} />
          </div>
          <div>
            <p>Currently Issued</p>
            <h2>{activeRecords.length}</h2>
          </div>
        </article>

        <article className="returns-stat-card">
          <div className="returns-stat-icon overdue">
            <Clock size={22} />
          </div>
          <div>
            <p>Overdue Books</p>
            <h2>{overdueCount}</h2>
          </div>
        </article>

        <article className="returns-stat-card">
          <div className="returns-stat-icon fine">
            <IndianRupee size={22} />
          </div>
          <div>
            <p>Potential Late Fines</p>
            <h2>₹{totalFine}</h2>
          </div>
        </article>
      </section>

      <section className="returns-table-card">
        <div className="returns-toolbar">
          <div className="returns-search">
            <Search size={19} />
            <input
              type="text"
              placeholder="Search student or book..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          <select
            className="returns-filter"
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
            aria-label="Filter issued books"
          >
            <option value="ALL">All Issued Books</option>
            <option value="OVERDUE">Overdue Only</option>
            <option value="ON_TIME">Not Overdue</option>
          </select>
        </div>

        <div className="returns-table-heading">
          <div>
            <h2>Issued Book Records</h2>
            <p>
              Showing {filteredRecords.length} of {activeRecords.length} active
              records
            </p>
          </div>
        </div>

        <div className="returns-table-wrapper">
          <table className="returns-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Book Details</th>
                <th>Issue Date</th>
                <th>Due Date</th>
                <th>Fine</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {filteredRecords.map((record) => {
                const daysOverdue = getDaysOverdue(record.dueDate);
                const fine = daysOverdue * FINE_PER_DAY;

                return (
                  <tr key={record.id}>
                    <td>
                      <div className="returns-student-cell">
                        <div className="returns-avatar">
                          <UserRound size={18} />
                        </div>
                        <div>
                          <strong>{record.studentName}</strong>
                          <small>{record.studentId}</small>
                        </div>
                      </div>
                    </td>

                    <td>
                      <div className="returns-book-cell">
                        <strong>{record.bookTitle}</strong>
                        <small>{record.author || record.bookId}</small>
                      </div>
                    </td>

                    <td>
                      <span className="returns-date">
                        <CalendarDays size={14} />
                        {formatDate(record.issueDate)}
                      </span>
                    </td>

                    <td>
                      <span
                        className={
                          daysOverdue > 0
                            ? "returns-date overdue-date"
                            : "returns-date"
                        }
                      >
                        {formatDate(record.dueDate)}
                      </span>
                    </td>

                    <td>
                      <strong
                        className={
                          fine > 0 ? "returns-fine overdue-fine" : "returns-fine"
                        }
                      >
                        ₹{fine}
                      </strong>
                    </td>

                    <td>
                      <span
                        className={
                          daysOverdue > 0
                            ? "returns-status overdue-status"
                            : "returns-status ontime-status"
                        }
                      >
                        {daysOverdue > 0 ? "Overdue" : "On Time"}
                      </span>
                    </td>

                    <td>
                      <button
                        type="button"
                        className="returns-action-button"
                        onClick={() => handleReturn(record)}
                      >
                        <CheckCircle size={15} />
                        Return
                      </button>
                    </td>
                  </tr>
                );
              })}

              {filteredRecords.length === 0 && (
                <tr>
                  <td colSpan="7" className="returns-empty-state">
                    <BookOpen size={30} />
                    <strong>No issued books found</strong>
                    <span>
                      Try changing your search or filter.
                    </span>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {returnedRecord && (
        <div
          className="returns-modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              cancelReturn();
            }
          }}
        >
          <div
            className="returns-confirm-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="return-modal-title"
          >
            <div className="returns-modal-icon">
              <RotateCcw size={25} />
            </div>

            <h2 id="return-modal-title">Confirm Book Return</h2>

            <p>
              Are you sure you want to mark{" "}
              <strong>{returnedRecord.bookTitle}</strong> as returned by{" "}
              <strong>{returnedRecord.studentName}</strong>?
            </p>

            <div className="returns-modal-details">
              <div>
                <span>Due date</span>
                <strong>{formatDate(returnedRecord.dueDate)}</strong>
              </div>

              <div>
                <span>Days overdue</span>
                <strong>{getDaysOverdue(returnedRecord.dueDate)}</strong>
              </div>

              <div>
                <span>Late fine</span>
                <strong>
                  ₹{getDaysOverdue(returnedRecord.dueDate) * FINE_PER_DAY}
                </strong>
              </div>
            </div>

            <p className="returns-modal-note">
              The system calculates a fine of ₹{FINE_PER_DAY} per overdue day.
              Confirming marks the book as returned.
            </p>

            <div className="returns-modal-actions">
              <button
                type="button"
                className="returns-cancel-button"
                onClick={cancelReturn}
              >
                Cancel
              </button>

              <button
                type="button"
                className="returns-confirm-button"
                onClick={confirmReturn}
              >
                <CheckCircle size={17} />
                Confirm Return
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}