import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  BookOpen,
  Search,
  UserRound,
  CalendarDays,
  CheckCircle,
  RotateCcw,
  ClipboardCheck,
} from "lucide-react";

import { sanitizeUserList } from "../../utils/auth";
import "../../styles/issue-book.css";

export default function IssueBook() {
  const navigate = useNavigate();

  const [studentSearch, setStudentSearch] = useState("");
  const [bookSearch, setBookSearch] = useState("");
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedBook, setSelectedBook] = useState(null);

  const [issueDate, setIssueDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  const [dueDate, setDueDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() + 14);
    return date.toISOString().split("T")[0];
  });

  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState("");

  const studentsList = useMemo(() => {
    const list = [];
    try {
      const saved = localStorage.getItem("libraspace_students");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) list.push(...sanitizeUserList(parsed));
      }
    } catch {}

    try {
      const savedUsers = localStorage.getItem("users");
      if (savedUsers) {
        const parsed = JSON.parse(savedUsers);
        if (Array.isArray(parsed)) {
          const clean = sanitizeUserList(parsed);
          clean.forEach((u) => {
            if (
              (u.role || "").toLowerCase() === "student" &&
              !list.some((s) => s.email?.toLowerCase() === u.email?.toLowerCase())
            ) {
              list.push({
                id: "STU" + String(u.id || Date.now()).slice(-4),
                name: u.name || u.email.split("@")[0],
                email: u.email,
                department: u.department || "General Studies",
              });
            }
          });
        }
      }
    } catch {}
    return list;
  }, []);

  const booksList = useMemo(() => {
    try {
      const saved = localStorage.getItem("libraspace_books");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return [];
  }, []);

  const filteredStudents = studentsList.filter((student) => {
    const query = studentSearch.toLowerCase();

    return (
      (student.id || "").toLowerCase().includes(query) ||
      (student.name || "").toLowerCase().includes(query) ||
      (student.email || "").toLowerCase().includes(query)
    );
  });

  const filteredBooks = booksList.filter((book) => {
    const query = bookSearch.toLowerCase();

    return (
      (book.title || "").toLowerCase().includes(query) ||
      (book.author || "").toLowerCase().includes(query) ||
      String(book.id || "").toLowerCase().includes(query) ||
      String(book.isbn || "").toLowerCase().includes(query)
    );
  });

  const selectStudent = (student) => {
    setSelectedStudent(student);
    setStudentSearch("");
    setErrors((previous) => ({
      ...previous,
      student: "",
    }));
    setSuccessMessage("");
  };

  const selectBook = (book) => {
    if (book.availableCopies < 1) {
      setErrors((previous) => ({
        ...previous,
        book: "This book is currently unavailable.",
      }));
      return;
    }

    setSelectedBook(book);
    setBookSearch("");

    setErrors((previous) => ({
      ...previous,
      book: "",
    }));

    setSuccessMessage("");
  };

  const handleReset = () => {
    setStudentSearch("");
    setBookSearch("");
    setSelectedStudent(null);
    setSelectedBook(null);
    setErrors({});
    setSuccessMessage("");

    setIssueDate(new Date().toISOString().split("T")[0]);

    const date = new Date();
    date.setDate(date.getDate() + 14);
    setDueDate(date.toISOString().split("T")[0]);
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const newErrors = {};

    if (!selectedStudent) {
      newErrors.student = "Please select a student.";
    }

    if (!selectedBook) {
      newErrors.book = "Please select an available book.";
    }

    if (!issueDate) {
      newErrors.issueDate = "Please select the issue date.";
    }

    if (!dueDate) {
      newErrors.dueDate = "Please select the due date.";
    }

    if (issueDate && dueDate && dueDate <= issueDate) {
      newErrors.dueDate = "The due date must be after the issue date.";
    }

    if (
      selectedBook &&
      selectedBook.availableCopies < 1
    ) {
      newErrors.book = "This book is currently unavailable.";
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      return;
    }

    const existingRecords = JSON.parse(
      localStorage.getItem("libraspace_issued_books") || "[]"
    );

    const issueRecord = {
      id: Date.now(),
      studentId: selectedStudent.id,
      studentName: selectedStudent.name,
      studentEmail: selectedStudent.email,
      bookId: selectedBook.id,
      bookTitle: selectedBook.title,
      author: selectedBook.author,
      issueDate,
      dueDate,
      status: "ISSUED",
      createdAt: new Date().toISOString(),
    };

    localStorage.setItem(
      "libraspace_issued_books",
      JSON.stringify([...existingRecords, issueRecord])
    );

    setSuccessMessage(
      `Successfully issued "${selectedBook.title}" to ${selectedStudent.name}.`
    );

    setSelectedStudent(null);
    setSelectedBook(null);
    setStudentSearch("");
    setBookSearch("");
    setErrors({});
  };

  return (
    <div className="issue-book-page">
      <header className="issue-book-header">
        <div>
          <button
            type="button"
            className="issue-back-button"
            onClick={() => navigate("/librarian/dashboard")}
          >
            <ArrowLeft size={17} />
            Back to Dashboard
          </button>

          <div className="issue-title-row">
            <div className="issue-title-icon">
              <BookOpen size={28} />
            </div>

            <div>
              <h1>Issue a Book</h1>
              <p>Assign a library book to a registered student.</p>
            </div>
          </div>
        </div>

        <div className="issue-header-badge">
          <ClipboardCheck size={18} />
          Book Circulation
        </div>
      </header>

      {successMessage && (
        <div className="issue-success-message" role="status">
          <CheckCircle size={20} />
          <span>{successMessage}</span>
        </div>
      )}

      <form className="issue-book-form" onSubmit={handleSubmit} noValidate>
        <section className="issue-section">
          <div className="issue-section-heading">
            <div className="issue-section-icon">
              <UserRound size={21} />
            </div>

            <div>
              <h2>Select Student</h2>
              <p>Search using the student's ID, name, or email.</p>
            </div>
          </div>

          <div className="issue-search-wrapper">
            <Search size={19} />

            <input
              type="text"
              value={studentSearch}
              onChange={(event) => setStudentSearch(event.target.value)}
              placeholder="Search students..."
              aria-label="Search students"
            />
          </div>

          {!selectedStudent && studentSearch && (
            <div className="issue-search-results">
              {filteredStudents.length > 0 ? (
                filteredStudents.map((student) => (
                  <button
                    type="button"
                    key={student.id}
                    className="issue-search-result"
                    onClick={() => selectStudent(student)}
                  >
                    <span className="issue-result-avatar">
                      {student.name.charAt(0)}
                    </span>

                    <span className="issue-result-details">
                      <strong>{student.name}</strong>
                      <small>
                        {student.id} · {student.email}
                      </small>
                      <small>{student.department}</small>
                    </span>
                  </button>
                ))
              ) : (
                <p className="issue-empty-results">
                  No matching students found.
                </p>
              )}
            </div>
          )}

          {selectedStudent && (
            <div className="issue-selected-card">
              <div className="issue-selected-icon">
                <UserRound size={22} />
              </div>

              <div className="issue-selected-details">
                <strong>{selectedStudent.name}</strong>
                <span>{selectedStudent.id}</span>
                <span>{selectedStudent.email}</span>
                <small>{selectedStudent.department}</small>
              </div>

              <button
                type="button"
                className="issue-change-button"
                onClick={() => setSelectedStudent(null)}
              >
                Change
              </button>
            </div>
          )}

          {errors.student && (
            <p className="issue-error">{errors.student}</p>
          )}
        </section>

        <section className="issue-section">
          <div className="issue-section-heading">
            <div className="issue-section-icon">
              <BookOpen size={21} />
            </div>

            <div>
              <h2>Select Book</h2>
              <p>Only books with available copies can be issued.</p>
            </div>
          </div>

          <div className="issue-search-wrapper">
            <Search size={19} />

            <input
              type="text"
              value={bookSearch}
              onChange={(event) => setBookSearch(event.target.value)}
              placeholder="Search by book title, author, or ID..."
              aria-label="Search books"
            />
          </div>

          {!selectedBook && bookSearch && (
            <div className="issue-search-results">
              {filteredBooks.length > 0 ? (
                filteredBooks.map((book) => (
                  <button
                    type="button"
                    key={book.id}
                    className="issue-search-result"
                    disabled={book.availableCopies < 1}
                    onClick={() => selectBook(book)}
                  >
                    <span className="issue-result-avatar">
                      <BookOpen size={20} />
                    </span>

                    <span className="issue-result-details">
                      <strong>{book.title}</strong>
                      <small>{book.author}</small>
                      <small>{book.id}</small>
                    </span>

                    <span
                      className={
                        book.availableCopies > 0
                          ? "issue-stock available"
                          : "issue-stock unavailable"
                      }
                    >
                      {book.availableCopies > 0
                        ? `${book.availableCopies} available`
                        : "Unavailable"}
                    </span>
                  </button>
                ))
              ) : (
                <p className="issue-empty-results">
                  No matching books found.
                </p>
              )}
            </div>
          )}

          {selectedBook && (
            <div className="issue-selected-card">
              <div className="issue-selected-icon">
                <BookOpen size={22} />
              </div>

              <div className="issue-selected-details">
                <strong>{selectedBook.title}</strong>
                <span>{selectedBook.author}</span>
                <span>{selectedBook.id}</span>
                <small>
                  {selectedBook.availableCopies} copies available
                </small>
              </div>

              <button
                type="button"
                className="issue-change-button"
                onClick={() => setSelectedBook(null)}
              >
                Change
              </button>
            </div>
          )}

          {errors.book && <p className="issue-error">{errors.book}</p>}
        </section>

        <section className="issue-section">
          <div className="issue-section-heading">
            <div className="issue-section-icon">
              <CalendarDays size={21} />
            </div>

            <div>
              <h2>Issue & Return Dates</h2>
              <p>Choose when the book is issued and when it is due.</p>
            </div>
          </div>

          <div className="issue-date-grid">
            <div className="issue-field">
              <label htmlFor="issueDate">Issue Date *</label>
              <input
                id="issueDate"
                type="date"
                value={issueDate}
                onChange={(event) => setIssueDate(event.target.value)}
              />

              {errors.issueDate && (
                <p className="issue-error">{errors.issueDate}</p>
              )}
            </div>

            <div className="issue-field">
              <label htmlFor="dueDate">Due Date *</label>
              <input
                id="dueDate"
                type="date"
                min={issueDate || undefined}
                value={dueDate}
                onChange={(event) => setDueDate(event.target.value)}
              />

              {errors.dueDate && (
                <p className="issue-error">{errors.dueDate}</p>
              )}
            </div>
          </div>
        </section>

        <div className="issue-form-footer">
          <button
            type="button"
            className="issue-reset-button"
            onClick={handleReset}
          >
            <RotateCcw size={17} />
            Reset Form
          </button>

          <button type="submit" className="issue-submit-button">
            <CheckCircle size={18} />
            Issue Book
          </button>
        </div>
      </form>
    </div>
  );
}