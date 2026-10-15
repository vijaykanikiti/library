import React, { useMemo, useState } from "react";

import {
  Search,
  BookOpen,
  CalendarDays,
  Clock,
  CheckCircle2,
  XCircle,
  Clock3,
  X,
  BookmarkCheck,
  Bell,
} from "lucide-react";
import "../../styles/reservations.css";

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

export default function Reservations() {
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
  const [filter, setFilter] = useState("All");
  const [message, setMessage] = useState("");

  const [selectedReservation, setSelectedReservation] =
    useState(null);

  const filteredReservations = useMemo(() => {
    const query = search.trim().toLowerCase();

    return reservations.filter((reservation) => {
      const matchesSearch =
        !query ||
        reservation.title.toLowerCase().includes(query) ||
        reservation.author.toLowerCase().includes(query) ||
        reservation.isbn.includes(query);

      const matchesFilter =
        filter === "All" || reservation.status === filter;

      return matchesSearch && matchesFilter;
    });
  }, [reservations, search, filter]);

  const activeCount = reservations.filter(
    (item) =>
      item.status === "Waiting" ||
      item.status === "Ready for Pickup"
  ).length;

  const readyCount = reservations.filter(
    (item) => item.status === "Ready for Pickup"
  ).length;

  const cancelledCount = reservations.filter(
    (item) => item.status === "Cancelled"
  ).length;

  function handleCancel(reservation) {
    if (
      reservation.status !== "Waiting" &&
      reservation.status !== "Ready for Pickup"
    ) {
      setMessage("This reservation cannot be cancelled.");
      return;
    }

    const confirmed = window.confirm(
      `Cancel your reservation for "${reservation.title}"?`
    );

    if (!confirmed) return;

    setReservations((previous) =>
      previous.map((item) =>
        item.id === reservation.id
          ? { ...item, status: "Cancelled", queuePosition: 0 }
          : item
      )
    );

    setSelectedReservation(null);

    setMessage(
      `Your reservation for "${reservation.title}" has been cancelled.`
    );
  }

  function getStatusIcon(status) {
    if (status === "Ready for Pickup") {
      return <CheckCircle2 size={15} />;
    }

    if (status === "Cancelled") {
      return <XCircle size={15} />;
    }

    return <Clock3 size={15} />;
  }

  function getStatusClass(status) {
    if (status === "Ready for Pickup") {
      return "reservation-status-ready";
    }

    if (status === "Cancelled") {
      return "reservation-status-cancelled";
    }

    return "reservation-status-waiting";
  }

  return (
    <div className="reservations-page">
      <section className="reservations-header">
        <div>
          <span className="reservations-eyebrow">
            <BookmarkCheck size={17} />
            STUDENT LIBRARY
          </span>

          <h1>My Reservations</h1>

          <p>
            Keep track of reserved books and check when your
            favourite titles are ready for collection.
          </p>
        </div>
      </section>
      <section className="reservations-stats">
        <article className="reservation-stat-card">
          <div className="reservation-stat-icon reservation-purple">
            <BookmarkCheck size={22} />
          </div>

          <div>
            <span>Active Reservations</span>
            <h2>{activeCount}</h2>
          </div>
        </article>

        <article className="reservation-stat-card">
          <div className="reservation-stat-icon reservation-green">
            <CheckCircle2 size={22} />
          </div>

          <div>
            <span>Ready for Pickup</span>
            <h2>{readyCount}</h2>
          </div>
        </article>

        <article className="reservation-stat-card">
          <div className="reservation-stat-icon reservation-orange">
            <XCircle size={22} />
          </div>

          <div>
            <span>Cancelled</span>
            <h2>{cancelledCount}</h2>
          </div>
        </article>
      </section>
      {readyCount > 0 && (
        <div className="reservation-pickup-notice">
          <Bell size={21} />

          <div>
            <strong>Your reserved book is ready!</strong>

            <p>
              You have {readyCount} reservation
              {readyCount > 1 ? "s" : ""} ready for pickup.
              Check the details below for the expiry date.
            </p>
          </div>
        </div>
      )}
      {message && (
        <div className="reservation-message" role="status">
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
      <section className="reservations-toolbar">
        <div className="reservations-search">
          <Search size={19} />

          <input
            type="search"
            placeholder="Search by book title, author, or ISBN..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            aria-label="Search reservations"
          />
        </div>

        <select
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
          aria-label="Filter reservations"
        >
          <option value="All">All Reservations</option>
          <option value="Waiting">Waiting</option>
          <option value="Ready for Pickup">Ready for Pickup</option>
          <option value="Cancelled">Cancelled</option>
        </select>
      </section>
      <section className="reservations-panel">
        <div className="reservations-panel-heading">
          <div>
            <h2>Reservation History</h2>

            <p>
              Showing {filteredReservations.length} of{" "}
              {reservations.length} reservations
            </p>
          </div>
        </div>

        {filteredReservations.length > 0 ? (
          <div className="reservation-list">
            {filteredReservations.map((reservation) => (
              <article
                className="reservation-card"
                key={reservation.id}
              >
                <div className="reservation-book-icon">
                  <BookOpen size={25} />
                </div>

                <div className="reservation-book-information">
                  <h3>{reservation.title}</h3>

                  <p>{reservation.author}</p>

                  <span>ISBN: {reservation.isbn}</span>
                </div>

                <div className="reservation-date-information">
                  <span>
                    <CalendarDays size={14} />
                    Reserved:{" "}
                    {formatDate(reservation.reservationDate)}
                  </span>

                  <strong>
                    <Clock size={14} />
                    Expires: {formatDate(reservation.expiryDate)}
                  </strong>

                  {reservation.status === "Waiting" && (
                    <small>
                      Queue position: {reservation.queuePosition}
                    </small>
                  )}
                </div>

                <div className="reservation-actions">
                  <span
                    className={`reservation-status ${getStatusClass(
                      reservation.status
                    )}`}
                  >
                    {getStatusIcon(reservation.status)}
                    {reservation.status}
                  </span>

                  <button
                    type="button"
                    className="reservation-details-button"
                    onClick={() =>
                      setSelectedReservation(reservation)
                    }
                  >
                    View Details
                  </button>

                  {(reservation.status === "Waiting" ||
                    reservation.status === "Ready for Pickup") && (
                    <button
                      type="button"
                      className="reservation-cancel-button"
                      onClick={() => handleCancel(reservation)}
                    >
                      <X size={15} />
                      Cancel Reservation
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="reservations-empty">
            <BookmarkCheck size={40} />

            <h3>No reservations found</h3>

            <p>
              Try another search term or select a different filter.
            </p>
          </div>
        )}
      </section>


      {selectedReservation && (
        <div
          className="reservation-modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setSelectedReservation(null);
            }
          }}
        >
          <section
            className="reservation-details-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="reservation-details-title"
          >
            <div className="reservation-modal-heading">
              <div>
                <span>RESERVATION DETAILS</span>

                <h2 id="reservation-details-title">
                  {selectedReservation.title}
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setSelectedReservation(null)}
                aria-label="Close details"
              >
                <X size={20} />
              </button>
            </div>

            <p className="reservation-modal-author">
              {selectedReservation.author}
            </p>

            <div className="reservation-modal-grid">
              <div>
                <span>ISBN</span>
                <strong>{selectedReservation.isbn}</strong>
              </div>

              <div>
                <span>Status</span>
                <strong>{selectedReservation.status}</strong>
              </div>

              <div>
                <span>Reservation Date</span>
                <strong>
                  {formatDate(selectedReservation.reservationDate)}
                </strong>
              </div>

              <div>
                <span>Expiry Date</span>
                <strong>
                  {formatDate(selectedReservation.expiryDate)}
                </strong>
              </div>

              <div>
                <span>Queue Position</span>
                <strong>
                  {selectedReservation.queuePosition || "—"}
                </strong>
              </div>
            </div>

            {(selectedReservation.status === "Waiting" ||
              selectedReservation.status === "Ready for Pickup") && (
              <button
                type="button"
                className="reservation-modal-cancel"
                onClick={() => handleCancel(selectedReservation)}
              >
                Cancel Reservation
              </button>
            )}

            <button
              type="button"
              className="reservation-modal-close"
              onClick={() => setSelectedReservation(null)}
            >
              Close Details
            </button>
          </section>
        </div>
      )}
    </div>
  );
}