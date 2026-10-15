import React, { useMemo, useState } from "react";
import {
  BarChart3,
  BookOpen,
  Users,
  BookMarked,
  RotateCcw,
  TrendingUp,
  Search,
  CalendarDays,
  IndianRupee,
  AlertTriangle,
  CheckCircle2,
  Download,
  FileText,
} from "lucide-react";

import "../../styles/library-reports.css";

const BOOKS_KEY = "libraspace_books";
const ISSUED_KEY = "libraspace_issued_books";
const STUDENTS_KEY = "libraspace_students";
const FINES_KEY = "libraspace_fines";

function readStorage(key) {
  try {
    const value = localStorage.getItem(key);
    const parsed = value ? JSON.parse(value) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error(`Unable to read ${key}:`, error);
    return [];
  }
}

function getDateString(date) {
  return date.toISOString().slice(0, 10);
}

function formatDate(dateString) {
  if (!dateString) return "—";

  const date = new Date(`${dateString}T00:00:00`);

  if (Number.isNaN(date.getTime())) return dateString;

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
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

function getIssuedBookTitle(book) {
  return book.bookTitle || book.title || "Untitled Book";
}

export default function LibraryReports() {
  const [books] = useState(() => readStorage(BOOKS_KEY));
  const [issuedBooks] = useState(() => readStorage(ISSUED_KEY));
  const [students] = useState(() => readStorage(STUDENTS_KEY));
  const [fines] = useState(() => readStorage(FINES_KEY));

  const today = getDateString(new Date());
  const firstDayOfMonth = getDateString(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  );

  const [startDate, setStartDate] = useState(firstDayOfMonth);
  const [endDate, setEndDate] = useState(today);
  const [searchTerm, setSearchTerm] = useState("");
  const [notice, setNotice] = useState("");

  const filteredRecords = useMemo(() => {
    return issuedBooks.filter((record) => {
      const recordDate = record.issueDate || record.createdDate || "";

      const afterStart = !startDate || recordDate >= startDate;
      const beforeEnd = !endDate || recordDate <= endDate;

      const search = searchTerm.toLowerCase();

      const matchesSearch =
        getIssuedBookTitle(record).toLowerCase().includes(search) ||
        String(record.studentName || "").toLowerCase().includes(search) ||
        String(record.studentId || "").toLowerCase().includes(search) ||
        String(record.id || "").toLowerCase().includes(search);

      return afterStart && beforeEnd && matchesSearch;
    });
  }, [issuedBooks, startDate, endDate, searchTerm]);

  const issuedCount = filteredRecords.filter(
    (record) => String(record.status).toUpperCase() === "ISSUED"
  ).length;

  const returnedCount = filteredRecords.filter(
    (record) => String(record.status).toUpperCase() === "RETURNED"
  ).length;

  const overdueRecords = filteredRecords.filter(
    (record) =>
      String(record.status).toUpperCase() === "ISSUED" &&
      getDaysOverdue(record.dueDate) > 0
  );

  const pendingFines = fines.filter(
    (fine) => String(fine.status).toUpperCase() === "PENDING"
  );

  const paidFines = fines.filter(
    (fine) => String(fine.status).toUpperCase() === "PAID"
  );

  const pendingFineAmount = pendingFines.reduce(
    (sum, fine) => sum + Number(fine.amount || 0),
    0
  );

  const collectedFineAmount = paidFines.reduce(
    (sum, fine) => sum + Number(fine.amount || 0),
    0
  );

  const totalCopies = books.reduce(
    (sum, book) => sum + Number(book.totalCopies || 0),
    0
  );

  const availableCopies = books.reduce(
    (sum, book) => sum + Number(book.availableCopies || 0),
    0
  );

  const popularBooks = useMemo(() => {
    const counts = {};

    filteredRecords.forEach((record) => {
      const title = getIssuedBookTitle(record);

      if (title !== "Untitled Book") {
        counts[title] = (counts[title] || 0) + 1;
      }
    });

    return Object.entries(counts)
      .map(([title, count]) => ({ title, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [filteredRecords]);

  const maximumPopularCount = Math.max(
    1,
    ...popularBooks.map((book) => book.count)
  );

  const exportCSV = () => {
    const rows = [
      [
        "Issue ID",
        "Student Name",
        "Student ID",
        "Book Title",
        "Issue Date",
        "Due Date",
        "Returned Date",
        "Status",
      ],
      ...filteredRecords.map((record) => [
        record.id || "",
        record.studentName || "",
        record.studentId || "",
        getIssuedBookTitle(record),
        record.issueDate || "",
        record.dueDate || "",
        record.returnedDate || "",
        record.status || "",
      ]),
    ];

    const escapeCSV = (value) =>
      `"${String(value ?? "").replace(/"/g, '""')}"`;

    const csv = rows.map((row) => row.map(escapeCSV).join(",")).join("\r\n");

    const blob = new Blob(["\uFEFF", csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `libraspace-report-${today}.csv`;

    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);

    setNotice("Report exported successfully.");
  };

  const resetFilters = () => {
    setStartDate(firstDayOfMonth);
    setEndDate(today);
    setSearchTerm("");
  };

  return (
    <div className="library-reports-page">
      <header className="library-reports-header">
        <div>
          <span className="library-reports-eyebrow">
            <BarChart3 size={16} />
            LIBRARY INSIGHTS
          </span>

          <h1>Reports & Analytics</h1>

          <p>
            Monitor book circulation, student activity, overdue books, and
            library fines.
          </p>
        </div>

        <button
          type="button"
          className="library-export-button"
          onClick={exportCSV}
        >
          <Download size={18} />
          Export CSV
        </button>
      </header>

      {notice && (
        <div className="library-reports-notice" role="status">
          <CheckCircle2 size={18} />
          <span>{notice}</span>
          <button type="button" onClick={() => setNotice("")}>
            ×
          </button>
        </div>
      )}

      <section className="library-report-stats">
        <div className="library-report-stat">
          <div className="library-report-stat-icon purple">
            <BookOpen size={22} />
          </div>

          <div>
            <span>Book Titles</span>
            <strong>{books.length}</strong>
            <small>{totalCopies.toLocaleString("en-IN")} total copies</small>
          </div>
        </div>

        <div className="library-report-stat">
          <div className="library-report-stat-icon blue">
            <BookMarked size={22} />
          </div>

          <div>
            <span>Available Copies</span>
            <strong>{availableCopies.toLocaleString("en-IN")}</strong>
            <small>Ready to borrow</small>
          </div>
        </div>

        <div className="library-report-stat">
          <div className="library-report-stat-icon orange">
            <RotateCcw size={22} />
          </div>

          <div>
            <span>Currently Issued</span>
            <strong>{issuedCount}</strong>
            <small>Within selected dates</small>
          </div>
        </div>

        <div className="library-report-stat">
          <div className="library-report-stat-icon green">
            <Users size={22} />
          </div>

          <div>
            <span>Registered Students</span>
            <strong>{students.length}</strong>
            <small>Student records</small>
          </div>
        </div>
      </section>

      <section className="library-report-filters">
        <div className="library-report-filter-heading">
          <div>
            <h2>
              <CalendarDays size={19} />
              Report Filters
            </h2>

            <p>Select a date range and search borrowing records.</p>
          </div>

          <button
            type="button"
            className="library-reset-button"
            onClick={resetFilters}
          >
            Reset Filters
          </button>
        </div>

        <div className="library-filter-controls">
          <label>
            Start Date
            <input
              type="date"
              value={startDate}
              max={endDate || undefined}
              onChange={(event) => setStartDate(event.target.value)}
            />
          </label>

          <label>
            End Date
            <input
              type="date"
              value={endDate}
              min={startDate || undefined}
              max={today}
              onChange={(event) => setEndDate(event.target.value)}
            />
          </label>

          <label className="library-report-search">
            Search Records
            <div>
              <Search size={18} />
              <input
                type="search"
                placeholder="Search book or student..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </div>
          </label>
        </div>
      </section>

      <section className="library-report-summary-grid">
        <div className="library-report-summary-card">
          <div className="library-summary-heading">
            <span>Borrowing Summary</span>
            <FileText size={19} />
          </div>

          <div className="library-summary-row">
            <span>Records in selected range</span>
            <strong>{filteredRecords.length}</strong>
          </div>

          <div className="library-summary-row">
            <span>Currently issued</span>
            <strong>{issuedCount}</strong>
          </div>

          <div className="library-summary-row">
            <span>Returned</span>
            <strong>{returnedCount}</strong>
          </div>

          <div className="library-summary-row">
            <span>Overdue</span>
            <strong className="library-danger-text">
              {overdueRecords.length}
            </strong>
          </div>
        </div>

        <div className="library-report-summary-card">
          <div className="library-summary-heading">
            <span>Fine Summary</span>
            <IndianRupee size={19} />
          </div>

          <div className="library-summary-row">
            <span>Pending fines</span>
            <strong>₹{pendingFineAmount.toLocaleString("en-IN")}</strong>
          </div>

          <div className="library-summary-row">
            <span>Collected fines</span>
            <strong className="library-success-text">
              ₹{collectedFineAmount.toLocaleString("en-IN")}
            </strong>
          </div>

          <div className="library-summary-row">
            <span>Pending records</span>
            <strong>{pendingFines.length}</strong>
          </div>

          <div className="library-summary-row">
            <span>Paid records</span>
            <strong>{paidFines.length}</strong>
          </div>
        </div>
      </section>

      <section className="library-popular-books-card">
        <div className="library-popular-heading">
          <div>
            <h2>
              <TrendingUp size={21} />
              Most Borrowed Books
            </h2>

            <p>Ranked by borrowing records within the selected date range.</p>
          </div>
        </div>

        {popularBooks.length === 0 ? (
          <div className="library-report-empty">
            <BookOpen size={35} />
            <h3>No borrowing data available</h3>
            <p>Issue records will appear here when they match your filters.</p>
          </div>
        ) : (
          <div className="library-popular-list">
            {popularBooks.map((book, index) => (
              <div className="library-popular-row" key={book.title}>
                <div className="library-popular-rank">{index + 1}</div>

                <div className="library-popular-details">
                  <strong>{book.title}</strong>

                  <div className="library-popular-progress">
                    <div
                      style={{
                        width: `${(book.count / maximumPopularCount) * 100}%`,
                      }}
                    />
                  </div>
                </div>

                <span className="library-popular-count">
                  {book.count} {book.count === 1 ? "issue" : "issues"}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="library-report-records-card">
        <div className="library-report-records-heading">
          <div>
            <h2>Borrowing Records</h2>
            <p>Details of books issued and returned during the selected period.</p>
          </div>

          <span>{filteredRecords.length} records</span>
        </div>

        {filteredRecords.length === 0 ? (
          <div className="library-report-empty">
            <FileText size={35} />
            <h3>No records found</h3>
            <p>Try changing the dates or search term.</p>
          </div>
        ) : (
          <div className="library-report-table-wrapper">
            <table className="library-report-table">
              <thead>
                <tr>
                  <th>Issue ID</th>
                  <th>Book</th>
                  <th>Student</th>
                  <th>Issue Date</th>
                  <th>Due Date</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {filteredRecords.map((record, index) => {
                  const status = String(record.status || "UNKNOWN").toUpperCase();

                  return (
                    <tr key={record.id || `${record.studentId}-${index}`}>
                      <td>{record.id || "—"}</td>

                      <td>
                        <div className="library-report-book-cell">
                          <BookOpen size={17} />
                          <span>{getIssuedBookTitle(record)}</span>
                        </div>
                      </td>

                      <td>
                        <div className="library-report-student-cell">
                          <strong>{record.studentName || "Unknown"}</strong>
                          <span>{record.studentId || "—"}</span>
                        </div>
                      </td>

                      <td>{formatDate(record.issueDate)}</td>

                      <td>{formatDate(record.dueDate)}</td>

                      <td>
                        <span
                          className={`library-report-status ${status.toLowerCase()}`}
                        >
                          {status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="library-report-bottom-note">
          <AlertTriangle size={16} />
          <span>
            Reports use the records currently available in your browser's
            localStorage. They are not yet connected to the database.
          </span>
        </div>
      </section>
    </div>
  );
}