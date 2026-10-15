import React, { useMemo } from "react";
import {
  BookOpen,
  BookCheck,
  BookCopy,
  Clock,
  CalendarDays,
  Wallet,
  ArrowUpRight,
  Library,
  Users,
  RotateCcw,
  AlertTriangle,
  ClipboardList,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import "../../styles/library-overview.css";

const STORAGE_KEYS = {
  books: "libraspace_books",
  issued: "libraspace_issued_books",
  reservations: "libraspace_reservations",
  fines: "libraspace_fines",
};

function readLocalData(key) {
  try {
    const value = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function getNumber(record, possibleKeys) {
  for (const key of possibleKeys) {
    const value = Number(record?.[key]);

    if (record?.[key] !== undefined && Number.isFinite(value)) {
      return value;
    }
  }

  return 0;
}

function getStatus(record) {
  return String(
    record?.status ||
      record?.bookingStatus ||
      record?.issueStatus ||
      ""
  ).toUpperCase();
}

function isReturned(record) {
  return (
    getStatus(record) === "RETURNED" ||
    Boolean(record?.returned)
  );
}

function isIssued(record) {
  const status = getStatus(record);

  return (
    status === "ISSUED" ||
    status === "OVERDUE" ||
    status === "BORROWED"
  );
}

function isOverdue(record) {
  if (isReturned(record)) return false;

  const status = getStatus(record);

  if (status === "OVERDUE") return true;

  const dueDate =
    record?.dueDate ||
    record?.returnDate ||
    record?.due_date;

  if (!dueDate) return false;

  const parsedDate = new Date(dueDate);

  if (Number.isNaN(parsedDate.getTime())) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  parsedDate.setHours(0, 0, 0, 0);

  return parsedDate < today && isIssued(record);
}

function formatCurrency(amount) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(amount);
}

export default function LibraryOverview() {
  const navigate = useNavigate();

  const data = useMemo(() => {
    const books = readLocalData(STORAGE_KEYS.books);
    const issuedRecords = readLocalData(STORAGE_KEYS.issued);
    const reservations = readLocalData(STORAGE_KEYS.reservations);
    const fines = readLocalData(STORAGE_KEYS.fines);

    const totalTitles = books.length;

    const totalCopies = books.reduce(
      (total, book) =>
        total +
        getNumber(book, [
          "totalCopies",
          "totalQuantity",
          "quantity",
          "copies",
        ]),
      0
    );

    const availableCopies = books.reduce(
      (total, book) =>
        total +
        getNumber(book, [
          "availableCopies",
          "availableQuantity",
          "available",
        ]),
      0
    );

    const returnedRecords = issuedRecords.filter(isReturned);
    const issuedOnly = issuedRecords.filter(isIssued);
    const overdueRecords = issuedRecords.filter(isOverdue);

    const pendingReservations = reservations.filter((reservation) =>
      ["PENDING", "REQUESTED"].includes(getStatus(reservation))
    );

    const outstandingFines = fines
      .filter((fine) => {
        const status = getStatus(fine);
        return !["PAID", "CANCELLED"].includes(status);
      })
      .reduce(
        (total, fine) =>
          total +
          getNumber(fine, ["amount", "fineAmount", "fine", "totalFine"]),
        0
      );

    return {
      totalTitles,
      totalCopies,
      availableCopies,
      issuedCount: issuedOnly.length,
      returnedCount: returnedRecords.length,
      overdueCount: overdueRecords.length,
      reservationCount: reservations.length,
      pendingReservations: pendingReservations.length,
      outstandingFines,
      recentIssues: issuedRecords.slice(-5).reverse(),
    };
  }, []);

  const metrics = [
    {
      label: "Book Titles",
      value: data.totalTitles,
      description: "Titles in inventory",
      icon: BookOpen,
      color: "blue",
    },
    {
      label: "Total Copies",
      value: data.totalCopies,
      description: "Copies recorded",
      icon: BookCopy,
      color: "purple",
    },
    {
      label: "Available Copies",
      value: data.availableCopies,
      description: "Ready for borrowing",
      icon: BookCheck,
      color: "green",
    },
    {
      label: "Currently Issued",
      value: data.issuedCount,
      description: "Active borrowing records",
      icon: ClipboardList,
      color: "orange",
    },
    {
      label: "Overdue Books",
      value: data.overdueCount,
      description: "Require follow-up",
      icon: AlertTriangle,
      color: "red",
    },
    {
      label: "Outstanding Fines",
      value: formatCurrency(data.outstandingFines),
      description: "Unpaid fine records",
      icon: Wallet,
      color: "pink",
    },
  ];

  const quickLinks = [
    {
      title: "Manage Books",
      description: "Review and update book inventory",
      icon: BookOpen,
      path: "/librarian/books",
    },
    {
      title: "Borrowing Records",
      description: "Review issued and returned books",
      icon: RotateCcw,
      path: "/librarian/returns",
    },
    {
      title: "Reservations",
      description: "Review reservation requests",
      icon: CalendarDays,
      path: "/librarian/reservations",
    },
    {
      title: "Fine Management",
      description: "Review fines and payment status",
      icon: Wallet,
      path: "/librarian/fines",
    },
    {
      title: "Overdue Books",
      description: "Review overdue borrowing records",
      icon: Clock,
      path: "/librarian/overdue",
    },
    {
      title: "Library Reports",
      description: "Open library activity reports",
      icon: Library,
      path: "/librarian/reports",
    },
  ];

  return (
    <div className="library-overview-page">
      <header className="library-overview-header">
        <div>
          <span className="library-overview-eyebrow">
            ADMINISTRATION
          </span>
          <h1>Library Overview</h1>
          <p>
            Monitor inventory, borrowing, reservations, and outstanding fines.
          </p>
        </div>

        <button
          className="library-overview-refresh"
          type="button"
          onClick={() => window.location.reload()}
        >
          <RotateCcw size={17} />
          Refresh Data
        </button>
      </header>

      <section className="library-overview-banner">
        <div className="library-overview-banner-icon">
          <Library size={30} />
        </div>

        <div>
          <h2>Library at a glance</h2>
          <p>
            Review the current records available in your local frontend.
          </p>
        </div>

        <div className="library-overview-banner-stat">
          <span>Total Titles</span>
          <strong>{data.totalTitles}</strong>
        </div>
      </section>

      <section className="library-overview-metrics">
        {metrics.map((metric) => {
          const MetricIcon = metric.icon;

          return (
            <article className="library-overview-metric" key={metric.label}>
              <div
                className={`library-metric-icon ${metric.color}`}
              >
                <MetricIcon size={22} />
              </div>

              <div className="library-metric-content">
                <span>{metric.label}</span>
                <h2>{metric.value}</h2>
                <p>{metric.description}</p>
              </div>
            </article>
          );
        })}
      </section>

      <section className="library-overview-secondary">
        <article className="library-overview-panel">
          <div className="library-overview-panel-header">
            <div>
              <h2>Borrowing Summary</h2>
              <p>Current borrowing record overview</p>
            </div>
            <BookOpen size={21} />
          </div>

          <div className="library-summary-row">
            <span>
              <BookCopy size={17} />
              Issued records
            </span>
            <strong>{data.issuedCount}</strong>
          </div>

          <div className="library-summary-row">
            <span>
              <RotateCcw size={17} />
              Returned records
            </span>
            <strong>{data.returnedCount}</strong>
          </div>

          <div className="library-summary-row">
            <span>
              <AlertTriangle size={17} />
              Overdue records
            </span>
            <strong>{data.overdueCount}</strong>
          </div>

          <div className="library-summary-row">
            <span>
              <CalendarDays size={17} />
              Pending reservations
            </span>
            <strong>{data.pendingReservations}</strong>
          </div>

          <div className="library-summary-row">
            <span>
              <ClipboardList size={17} />
              All reservations
            </span>
            <strong>{data.reservationCount}</strong>
          </div>
        </article>

        <article className="library-overview-panel">
          <div className="library-overview-panel-header">
            <div>
              <h2>Recent Borrowing Records</h2>
              <p>Latest records available in local storage</p>
            </div>
            <Clock size={21} />
          </div>

          {data.recentIssues.length > 0 ? (
            <div className="library-recent-list">
              {data.recentIssues.map((record, index) => (
                <div
                  className="library-recent-item"
                  key={record.id ?? record.issueId ?? index}
                >
                  <div className="library-recent-icon">
                    <BookOpen size={18} />
                  </div>

                  <div className="library-recent-info">
                    <strong>
                      {record.bookTitle ||
                        record.title ||
                        record.bookName ||
                        "Book record"}
                    </strong>
                    <span>
                      {record.studentName ||
                        record.memberName ||
                        record.userName ||
                        "Student not specified"}
                    </span>
                  </div>

                  <span
                    className={`library-recent-status ${
                      isReturned(record)
                        ? "returned"
                        : isOverdue(record)
                          ? "overdue"
                          : "issued"
                    }`}
                  >
                    {isReturned(record)
                      ? "Returned"
                      : isOverdue(record)
                        ? "Overdue"
                        : "Issued"}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="library-overview-empty">
              <BookOpen size={30} />
              <strong>No borrowing records found</strong>
              <span>Records will appear here when available.</span>
            </div>
          )}
        </article>
      </section>

      <section className="library-overview-quick-section">
        <div className="library-overview-section-heading">
          <div>
            <h2>Library Operations</h2>
            <p>Open a relevant page to review library activity.</p>
          </div>
          <Users size={22} />
        </div>

        <div className="library-overview-quick-grid">
          {quickLinks.map((link) => {
            const LinkIcon = link.icon;

            return (
              <button
                type="button"
                className="library-overview-quick-link"
                key={link.title}
                onClick={() => navigate(link.path)}
              >
                <div className="library-quick-icon">
                  <LinkIcon size={21} />
                </div>

                <div>
                  <strong>{link.title}</strong>
                  <span>{link.description}</span>
                </div>

                <ArrowUpRight size={18} />
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}