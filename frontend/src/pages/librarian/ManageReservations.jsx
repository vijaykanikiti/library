import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Search,
  CalendarDays,
  BookOpen,
  UserRound,
  CheckCircle,
  XCircle,
  Clock,
  BookmarkCheck,
  Filter,
  RotateCcw,
} from "lucide-react";

import "../../styles/manage-reservations.css";

const formatDate = (dateString) => {
  if (!dateString) return "—";

  return new Date(`${dateString}T00:00:00`).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

export default function ManageReservations() {
  const navigate = useNavigate();

  const [reservations, setReservations] = useState(() => {
    try {
      const saved = localStorage.getItem("libraspace_reservations");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.filter(
            (r) =>
              !r.email?.endsWith("@example.com") &&
              !String(r.id || "").startsWith("RES00")
          );
        }
      }
    } catch {}
    return [];
  });

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [confirmation, setConfirmation] = useState(null);
  const [message, setMessage] = useState("");

  const updateReservation = (reservationId, newStatus) => {
    const updatedReservations = reservations.map((reservation) =>
      reservation.id === reservationId
        ? {
            ...reservation,
            status: newStatus,
            updatedAt: new Date().toISOString(),
          }
        : reservation
    );

    setReservations(updatedReservations);

    localStorage.setItem(
      "libraspace_reservations",
      JSON.stringify(updatedReservations)
    );

    setMessage(
      `Reservation ${reservationId} has been ${newStatus.toLowerCase()}.`
    );

    setConfirmation(null);
  };

  const filteredReservations = reservations.filter((reservation) => {
    const query = search.toLowerCase();

    const matchesSearch =
      String(reservation.id || "").toLowerCase().includes(query) ||
      String(reservation.studentId || "").toLowerCase().includes(query) ||
      String(reservation.studentName || "").toLowerCase().includes(query) ||
      String(reservation.email || "").toLowerCase().includes(query) ||
      String(reservation.bookTitle || "").toLowerCase().includes(query);

    const matchesStatus =
      statusFilter === "ALL" || reservation.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const pendingCount = reservations.filter(
    (reservation) => reservation.status === "PENDING"
  ).length;

  const approvedCount = reservations.filter(
    (reservation) => reservation.status === "APPROVED"
  ).length;

  const rejectedCount = reservations.filter(
    (reservation) => reservation.status === "REJECTED"
  ).length;

  const handleReset = () => {
    setSearch("");
    setStatusFilter("ALL");
    setMessage("");
  };

  return (
    <div className="manage-reservations-page">
      <header className="reservations-page-header">
        <div>
          <button
            type="button"
            className="reservations-back-button"
            onClick={() => navigate("/librarian/dashboard")}
          >
            <ArrowLeft size={17} />
            Back to Dashboard
          </button>

          <div className="reservations-heading-row">
            <div className="reservations-heading-icon">
              <BookmarkCheck size={27} />
            </div>

            <div>
              <h1>Manage Reservations</h1>
              <p>
                Review student requests and manage book reservations.
              </p>
            </div>
          </div>
        </div>

        <div className="reservations-header-badge">
          <BookOpen size={18} />
          Reservation Center
        </div>
      </header>

      {message && (
        <div className="reservations-message" role="status">
          <CheckCircle size={19} />
          <span>{message}</span>

          <button
            type="button"
            onClick={() => setMessage("")}
            aria-label="Dismiss message"
          >
            ×
          </button>
        </div>
      )}

      <section className="reservations-stats">
        <article className="reservation-stat-card">
          <div className="reservation-stat-icon pending">
            <Clock size={22} />
          </div>

          <div>
            <p>Pending Requests</p>
            <h2>{pendingCount}</h2>
          </div>
        </article>

        <article className="reservation-stat-card">
          <div className="reservation-stat-icon approved">
            <CheckCircle size={22} />
          </div>

          <div>
            <p>Approved</p>
            <h2>{approvedCount}</h2>
          </div>
        </article>

        <article className="reservation-stat-card">
          <div className="reservation-stat-icon rejected">
            <XCircle size={22} />
          </div>

          <div>
            <p>Rejected</p>
            <h2>{rejectedCount}</h2>
          </div>
        </article>
      </section>

      <section className="reservations-table-card">
        <div className="reservations-toolbar">
          <div className="reservations-search">
            <Search size={19} />

            <input
              type="text"
              placeholder="Search student, book, or reservation ID..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              aria-label="Search reservations"
            />
          </div>

          <div className="reservations-filter-wrapper">
            <Filter size={17} />

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              aria-label="Filter by reservation status"
            >
              <option value="ALL">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>

          <button
            type="button"
            className="reservations-reset-button"
            onClick={handleReset}
            title="Reset search and filters"
          >
            <RotateCcw size={16} />
            Reset
          </button>
        </div>

        <div className="reservations-table-heading">
          <div>
            <h2>Reservation Requests</h2>
            <p>
              Showing {filteredReservations.length} of {reservations.length}{" "}
              reservations
            </p>
          </div>
        </div>

        <div className="reservations-table-wrapper">
          <table className="reservations-table">
            <thead>
              <tr>
                <th>Reservation ID</th>
                <th>Student</th>
                <th>Book Details</th>
                <th>Request Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredReservations.map((reservation) => (
                <tr key={reservation.id}>
                  <td>
                    <span className="reservation-id">
                      {reservation.id}
                    </span>
                  </td>

                  <td>
                    <div className="reservation-student-cell">
                      <div className="reservation-avatar">
                        <UserRound size={18} />
                      </div>

                      <div>
                        <strong>{reservation.studentName}</strong>
                        <small>{reservation.studentId}</small>
                        <small>{reservation.email}</small>
                      </div>
                    </div>
                  </td>

                  <td>
                    <div className="reservation-book-cell">
                      <strong>{reservation.bookTitle}</strong>
                      <small>{reservation.author}</small>
                    </div>
                  </td>

                  <td>
                    <span className="reservation-date">
                      <CalendarDays size={14} />
                      {formatDate(reservation.reservationDate)}
                    </span>
                  </td>

                  <td>
                    <span
                      className={`reservation-status ${reservation.status.toLowerCase()}`}
                    >
                      {reservation.status === "PENDING" && (
                        <Clock size={13} />
                      )}

                      {reservation.status === "APPROVED" && (
                        <CheckCircle size={13} />
                      )}

                      {reservation.status === "REJECTED" && (
                        <XCircle size={13} />
                      )}

                      {reservation.status}
                    </span>
                  </td>

                  <td>
                    {reservation.status === "PENDING" ? (
                      <div className="reservation-actions">
                        <button
                          type="button"
                          className="reservation-approve-button"
                          onClick={() =>
                            setConfirmation({
                              reservation,
                              status: "APPROVED",
                            })
                          }
                        >
                          <CheckCircle size={15} />
                          Approve
                        </button>

                        <button
                          type="button"
                          className="reservation-reject-button"
                          onClick={() =>
                            setConfirmation({
                              reservation,
                              status: "REJECTED",
                            })
                          }
                        >
                          <XCircle size={15} />
                          Reject
                        </button>
                      </div>
                    ) : (
                      <span className="reservation-completed-label">
                        {reservation.status === "APPROVED"
                          ? "Processed"
                          : "Declined"}
                      </span>
                    )}
                  </td>
                </tr>
              ))}

              {filteredReservations.length === 0 && (
                <tr>
                  <td colSpan="6" className="reservations-empty-state">
                    <BookmarkCheck size={32} />
                    <strong>No reservations found</strong>
                    <span>Try changing your search or status filter.</span>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {confirmation && (
        <div
          className="reservation-modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setConfirmation(null);
            }
          }}
        >
          <div
            className="reservation-confirm-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="reservation-confirm-title"
          >
            <div
              className={`reservation-modal-icon ${confirmation.status.toLowerCase()}`}
            >
              {confirmation.status === "APPROVED" ? (
                <CheckCircle size={26} />
              ) : (
                <XCircle size={26} />
              )}
            </div>

            <h2 id="reservation-confirm-title">
              {confirmation.status === "APPROVED"
                ? "Approve Reservation?"
                : "Reject Reservation?"}
            </h2>

            <p>
              Are you sure you want to{" "}
              {confirmation.status.toLowerCase()} the reservation for{" "}
              <strong>{confirmation.reservation.bookTitle}</strong> requested
              by <strong>{confirmation.reservation.studentName}</strong>?
            </p>

            <div className="reservation-modal-actions">
              <button
                type="button"
                className="reservation-modal-cancel"
                onClick={() => setConfirmation(null)}
              >
                Cancel
              </button>

              <button
                type="button"
                className={
                  confirmation.status === "APPROVED"
                    ? "reservation-modal-approve"
                    : "reservation-modal-reject"
                }
                onClick={() =>
                  updateReservation(
                    confirmation.reservation.id,
                    confirmation.status
                  )
                }
              >
                {confirmation.status === "APPROVED"
                  ? "Confirm Approval"
                  : "Confirm Rejection"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}