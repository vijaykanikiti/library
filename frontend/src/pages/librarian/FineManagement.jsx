import React, { useMemo, useState } from "react";
import {
  IndianRupee,
  Search,
  CheckCircle2,
  Clock,
  Receipt,
  UserRound,
  BookOpen,
  CalendarDays,
  X,
  CreditCard,
  History,
} from "lucide-react";

import "../../styles/fine-management.css";

const FINE_STORAGE_KEY = "libraspace_fines";
const ISSUE_STORAGE_KEY = "libraspace_issued_books";
const FINE_PER_DAY = 5;

function loadFines() {
  try {
    const stored = localStorage.getItem(FINE_STORAGE_KEY);
    if (!stored) return [];

    const parsed = JSON.parse(stored);
    if (Array.isArray(parsed)) {
      return parsed.filter(
        (f) => !String(f.id || "").startsWith("FINE-100")
      );
    }
  } catch (error) {
    console.error("Unable to load fine records:", error);
  }
  return [];
}

function loadIssuedBooks() {
  try {
    const stored = localStorage.getItem(ISSUE_STORAGE_KEY);
    const parsed = stored ? JSON.parse(stored) : [];

    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error("Unable to load issued books:", error);
    return [];
  }
}

function calculateFine(book) {
  if (!book.dueDate) return 0;

  const dueDate = new Date(`${book.dueDate}T00:00:00`);
  const endDate = book.returnedDate
    ? new Date(`${book.returnedDate}T00:00:00`)
    : new Date();

  endDate.setHours(0, 0, 0, 0);

  if (Number.isNaN(dueDate.getTime())) return 0;

  const daysLate = Math.max(
    0,
    Math.floor((endDate.getTime() - dueDate.getTime()) / 86400000)
  );

  return daysLate * FINE_PER_DAY;
}

function createFineRecords(issuedBooks) {
  return issuedBooks
    .filter((book) => {
      const status = String(book.status || "").toUpperCase();

      return (
        (status === "ISSUED" || status === "RETURNED") &&
        calculateFine(book) > 0
      );
    })
    .map((book) => ({
      id: `FINE-${book.id}`,
      issueId: book.id,
      studentId: book.studentId || "N/A",
      studentName: book.studentName || "Unknown Student",
      bookTitle: book.bookTitle || "Untitled Book",
      dueDate: book.dueDate,
      returnedDate: book.returnedDate || "",
      amount: calculateFine(book),
      status: "PENDING",
      createdDate: new Date().toISOString().slice(0, 10),
      paidDate: "",
    }));
}

export default function FineManagement() {
  const [fines, setFines] = useState(() => {
    const storedFines = loadFines();
    const issuedBooks = loadIssuedBooks();

    if (localStorage.getItem(FINE_STORAGE_KEY) !== null) {
      return storedFines;
    }

    const generatedFines = createFineRecords(issuedBooks);

    return generatedFines.length > 0 ? generatedFines : storedFines;
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [notice, setNotice] = useState("");
  const [selectedFine, setSelectedFine] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const saveFines = (updatedFines) => {
    setFines(updatedFines);
    localStorage.setItem(FINE_STORAGE_KEY, JSON.stringify(updatedFines));
  };

  const filteredFines = useMemo(() => {
    const search = searchTerm.toLowerCase();

    return fines.filter((fine) => {
      const matchesSearch =
        String(fine.studentName || "").toLowerCase().includes(search) ||
        String(fine.studentId || "").toLowerCase().includes(search) ||
        String(fine.bookTitle || "").toLowerCase().includes(search) ||
        String(fine.id || "").toLowerCase().includes(search);

      const matchesStatus =
        statusFilter === "ALL" || fine.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [fines, searchTerm, statusFilter]);

  const pendingFines = fines.filter(
    (fine) => fine.status === "PENDING"
  );

  const paidFines = fines.filter((fine) => fine.status === "PAID");

  const pendingAmount = pendingFines.reduce(
    (total, fine) => total + Number(fine.amount || 0),
    0
  );

  const collectedAmount = paidFines.reduce(
    (total, fine) => total + Number(fine.amount || 0),
    0
  );

  const totalAmount = fines.reduce(
    (total, fine) => total + Number(fine.amount || 0),
    0
  );

  const confirmPayment = () => {
    if (!selectedFine) return;

    const updatedFines = fines.map((fine) =>
      fine.id === selectedFine.id
        ? {
            ...fine,
            status: "PAID",
            paidDate: new Date().toISOString().slice(0, 10),
          }
        : fine
    );

    saveFines(updatedFines);
    setShowPaymentModal(false);
    setSelectedFine(null);
    setNotice("Fine marked as paid successfully.");
  };

  return (
    <div className="fine-management-page">
      <header className="fine-page-header">
        <div>
          <span className="fine-eyebrow">
            <Receipt size={16} />
            FINANCIAL OVERVIEW
          </span>

          <h1>Fine Management</h1>

          <p>
            Track overdue fines, outstanding balances, and recorded payments.
          </p>
        </div>

        <div className="fine-header-icon">
          <IndianRupee size={29} />
        </div>
      </header>

      {notice && (
        <div className="fine-notice" role="status">
          <CheckCircle2 size={18} />
          <span>{notice}</span>

          <button
            type="button"
            aria-label="Close notification"
            onClick={() => setNotice("")}
          >
            <X size={17} />
          </button>
        </div>
      )}

      <section className="fine-stats-grid">
        <div className="fine-stat-card">
          <div className="fine-stat-icon purple">
            <Receipt size={22} />
          </div>

          <div>
            <span>Total Fine Amount</span>
            <strong>₹{totalAmount.toLocaleString("en-IN")}</strong>
            <small>{fines.length} fine records</small>
          </div>
        </div>

        <div className="fine-stat-card">
          <div className="fine-stat-icon orange">
            <Clock size={22} />
          </div>

          <div>
            <span>Pending Fines</span>
            <strong>₹{pendingAmount.toLocaleString("en-IN")}</strong>
            <small>{pendingFines.length} unpaid records</small>
          </div>
        </div>

        <div className="fine-stat-card">
          <div className="fine-stat-icon green">
            <CheckCircle2 size={22} />
          </div>

          <div>
            <span>Collected Fines</span>
            <strong>₹{collectedAmount.toLocaleString("en-IN")}</strong>
            <small>{paidFines.length} paid records</small>
          </div>
        </div>
      </section>

      <section className="fine-records-card">
        <div className="fine-records-header">
          <div>
            <h2>Fine Records</h2>
            <p>Search, review, and update fine payment statuses.</p>
          </div>

          <span className="fine-count-badge">
            {filteredFines.length} records
          </span>
        </div>

        <div className="fine-toolbar">
          <div className="fine-search-box">
            <Search size={19} />

            <input
              type="search"
              placeholder="Search student, book, or fine ID..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </div>

          <select
            className="fine-status-filter"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            aria-label="Filter fines by payment status"
          >
            <option value="ALL">All Payments</option>
            <option value="PENDING">Pending</option>
            <option value="PAID">Paid</option>
          </select>
        </div>

        {filteredFines.length === 0 ? (
          <div className="fine-empty-state">
            <Receipt size={42} />
            <h3>No fine records found</h3>
            <p>Try changing your search or payment-status filter.</p>
          </div>
        ) : (
          <div className="fine-table-wrapper">
            <table className="fine-table">
              <thead>
                <tr>
                  <th>Fine / Student</th>
                  <th>Book Details</th>
                  <th>Due Date</th>
                  <th>Fine Amount</th>
                  <th>Payment Status</th>
                  <th>Payment Date</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {filteredFines.map((fine) => (
                  <tr key={fine.id}>
                    <td>
                      <div className="fine-student-cell">
                        <div className="fine-student-avatar">
                          <UserRound size={19} />
                        </div>

                        <div>
                          <strong>{fine.studentName}</strong>
                          <span>{fine.studentId}</span>
                          <small>{fine.id}</small>
                        </div>
                      </div>
                    </td>

                    <td>
                      <div className="fine-book-cell">
                        <BookOpen size={18} />
                        <span>{fine.bookTitle}</span>
                      </div>
                    </td>

                    <td>
                      <span className="fine-date">
                        <CalendarDays size={14} />
                        {fine.dueDate || "N/A"}
                      </span>
                    </td>

                    <td>
                      <strong className="fine-amount">
                        ₹{Number(fine.amount || 0).toLocaleString("en-IN")}
                      </strong>
                    </td>

                    <td>
                      <span
                        className={`fine-status-badge ${
                          fine.status === "PAID" ? "paid" : "pending"
                        }`}
                      >
                        {fine.status === "PAID" ? (
                          <CheckCircle2 size={14} />
                        ) : (
                          <Clock size={14} />
                        )}

                        {fine.status}
                      </span>
                    </td>

                    <td>
                      <span className="fine-date">
                        {fine.paidDate || "—"}
                      </span>
                    </td>

                    <td>
                      {fine.status === "PENDING" ? (
                        <button
                          type="button"
                          className="fine-pay-button"
                          onClick={() => {
                            setSelectedFine(fine);
                            setShowPaymentModal(true);
                          }}
                        >
                          <CreditCard size={15} />
                          Mark Paid
                        </button>
                      ) : (
                        <span className="fine-completed-label">
                          <History size={15} />
                          Completed
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="fine-footer-note">
          <Receipt size={16} />

          <span>
            Payment statuses are stored locally in your browser. Marking a fine
            as paid records the status only; it does not process a real payment.
          </span>
        </div>
      </section>

      {showPaymentModal && selectedFine && (
        <div
          className="fine-modal-overlay"
          onClick={() => setShowPaymentModal(false)}
        >
          <div
            className="fine-confirm-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="fine-confirm-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="fine-modal-icon">
              <CreditCard size={25} />
            </div>

            <h2 id="fine-confirm-title">Confirm Fine Payment</h2>

            <p>
              Mark the fine for <strong>{selectedFine.studentName}</strong> as
              paid?
            </p>

            <div className="fine-payment-summary">
              <span>Book</span>
              <strong>{selectedFine.bookTitle}</strong>

              <span>Fine Amount</span>
              <strong>
                ₹{Number(selectedFine.amount || 0).toLocaleString("en-IN")}
              </strong>
            </div>

            <div className="fine-modal-actions">
              <button
                type="button"
                className="fine-cancel-button"
                onClick={() => {
                  setShowPaymentModal(false);
                  setSelectedFine(null);
                }}
              >
                Cancel
              </button>

              <button
                type="button"
                className="fine-confirm-button"
                onClick={confirmPayment}
              >
                <CheckCircle2 size={17} />
                Confirm Payment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
