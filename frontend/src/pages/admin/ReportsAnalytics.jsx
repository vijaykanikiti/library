import React, { useMemo } from "react";
import {
  BarChart3,
  BookOpen,
  BookCheck,
  Clock,
  Wallet,
  CalendarDays,
  Download,
  TrendingUp,
  FileText,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import "../../styles/admin-reports.css";

const STORAGE_KEYS = {
  books: "libraspace_books",
  issued: "libraspace_issued_books",
  reservations: "libraspace_reservations",
  fines: "libraspace_fines",
};

function readArray(key) {
  try {
    const value = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function getStatus(record) {
  return String(
    record?.status ||
      record?.bookingStatus ||
      record?.issueStatus ||
      ""
  ).toUpperCase();
}

function getNumber(record, keys) {
  for (const key of keys) {
    if (record?.[key] !== undefined && record?.[key] !== null) {
      const value = Number(record[key]);
      if (Number.isFinite(value)) return value;
    }
  }

  return 0;
}

function isReturned(record) {
  return getStatus(record) === "RETURNED" || Boolean(record?.returned);
}

function isIssued(record) {
  return ["ISSUED", "OVERDUE", "BORROWED"].includes(getStatus(record));
}

function isOverdue(record) {
  if (isReturned(record)) return false;

  if (getStatus(record) === "OVERDUE") return true;

  const dueDate =
    record?.dueDate || record?.returnDate || record?.due_date;

  if (!dueDate || !isIssued(record)) return false;

  const parsed = new Date(dueDate);
  if (Number.isNaN(parsed.getTime())) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  parsed.setHours(0, 0, 0, 0);

  return parsed < today;
}

function currency(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value);
}

export default function ReportsAnalytics() {
  const report = useMemo(() => {
    const books = readArray(STORAGE_KEYS.books);
    const issuedRecords = readArray(STORAGE_KEYS.issued);
    const reservations = readArray(STORAGE_KEYS.reservations);
    const fines = readArray(STORAGE_KEYS.fines);

    const totalTitles = books.length;

    const totalCopies = books.reduce(
      (sum, book) =>
        sum +
        getNumber(book, [
          "totalCopies",
          "totalQuantity",
          "quantity",
          "copies",
        ]),
      0
    );

    const availableCopies = books.reduce(
      (sum, book) =>
        sum +
        getNumber(book, [
          "availableCopies",
          "availableQuantity",
          "available",
        ]),
      0
    );

    const issued = issuedRecords.filter(isIssued);
    const returned = issuedRecords.filter(isReturned);
    const overdue = issuedRecords.filter(isOverdue);

    const paidFines = fines
      .filter((fine) => getStatus(fine) === "PAID")
      .reduce(
        (sum, fine) =>
          sum +
          getNumber(fine, ["amount", "fineAmount", "fine", "totalFine"]),
        0
      );

    const outstandingFines = fines
      .filter(
        (fine) =>
          !["PAID", "CANCELLED"].includes(getStatus(fine))
      )
      .reduce(
        (sum, fine) =>
          sum +
          getNumber(fine, ["amount", "fineAmount", "fine", "totalFine"]),
        0
      );

    const reservationCounts = {
      pending: reservations.filter((item) =>
        ["PENDING", "REQUESTED"].includes(getStatus(item))
      ).length,
      approved: reservations.filter((item) =>
        ["APPROVED", "CONFIRMED"].includes(getStatus(item))
      ).length,
      rejected: reservations.filter((item) =>
        ["REJECTED", "CANCELLED"].includes(getStatus(item))
      ).length,
    };

    const borrowingBars = [
      { label: "Issued", value: issued.length },
      { label: "Returned", value: returned.length },
      { label: "Overdue", value: overdue.length },
    ];

    const maxBorrowing = Math.max(
      ...borrowingBars.map((item) => item.value),
      1
    );

    return {
      generatedAt: new Date().toLocaleString(),
      totalTitles,
      totalCopies,
      availableCopies,
      issuedCount: issued.length,
      returnedCount: returned.length,
      overdueCount: overdue.length,
      paidFines,
      outstandingFines,
      reservationCounts,
      borrowingBars,
      maxBorrowing,
      books,
      issuedRecords,
      reservations,
      fines,
    };
  }, []);

  const downloadCSV = () => {
    const rows = [
      ["LibraSpace - Library Reports"],
      ["Report generated", report.generatedAt],
      [],
      ["Inventory Statistics", "Value"],
      ["Total book titles", report.totalTitles],
      ["Total copies", report.totalCopies],
      ["Available copies", report.availableCopies],
      [],
      ["Borrowing Statistics", "Value"],
      ["Currently issued records", report.issuedCount],
      ["Returned records", report.returnedCount],
      ["Overdue records", report.overdueCount],
      [],
      ["Fine Statistics", "Amount (INR)"],
      ["Paid fines", report.paidFines],
      ["Outstanding fines", report.outstandingFines],
      [],
      ["Reservation Statistics", "Count"],
      ["Pending reservations", report.reservationCounts.pending],
      ["Approved reservations", report.reservationCounts.approved],
      ["Rejected reservations", report.reservationCounts.rejected],
    ];

    const escapeCSV = (value) => {
      const text = String(value ?? "");
      return `"${text.replace(/"/g, '""')}"`;
    };

    const csv = rows
      .map((row) => row.map(escapeCSV).join(","))
      .join("\r\n");

    const blob = new Blob(["\uFEFF", csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "libraspace-library-report.csv";

    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);
  };

  const summaryCards = [
    {
      title: "Book Titles",
      value: report.totalTitles,
      detail: `${report.totalCopies} total copies`,
      icon: BookOpen,
      color: "blue",
    },
    {
      title: "Available Copies",
      value: report.availableCopies,
      detail: "Ready for borrowing",
      icon: BookCheck,
      color: "green",
    },
    {
      title: "Currently Issued",
      value: report.issuedCount,
      detail: "Active borrowing records",
      icon: TrendingUp,
      color: "purple",
    },
    {
      title: "Overdue Books",
      value: report.overdueCount,
      detail: "Require follow-up",
      icon: AlertTriangle,
      color: "red",
    },
    {
      title: "Paid Fines",
      value: currency(report.paidFines),
      detail: "Recorded paid amounts",
      icon: CheckCircle2,
      color: "green",
    },
    {
      title: "Outstanding Fines",
      value: currency(report.outstandingFines),
      detail: "Unpaid fine records",
      icon: Wallet,
      color: "orange",
    },
  ];

  return (
    <div className="admin-reports-page">
      <header className="admin-reports-header">
        <div>
          <span className="admin-reports-eyebrow">
            ADMINISTRATION
          </span>
          <h1>Reports & Analytics</h1>
          <p>
            Review library performance, borrowing activity, reservations,
            and fines.
          </p>
        </div>

        <button
          type="button"
          className="admin-reports-export"
          onClick={downloadCSV}
        >
          <Download size={18} />
          Export CSV
        </button>
      </header>

      <section className="admin-reports-generated">
        <FileText size={18} />
        <span>
          Report generated on: <strong>{report.generatedAt}</strong>
        </span>
      </section>

      <section className="admin-reports-summary">
        {summaryCards.map((card) => {
          const CardIcon = card.icon;

          return (
            <article className="admin-report-card" key={card.title}>
              <div className={`admin-report-icon ${card.color}`}>
                <CardIcon size={22} />
              </div>

              <div>
                <span>{card.title}</span>
                <h2>{card.value}</h2>
                <p>{card.detail}</p>
              </div>
            </article>
          );
        })}
      </section>

      <section className="admin-reports-content">
        <article className="admin-report-panel">
          <div className="admin-report-panel-header">
            <div>
              <h2>Borrowing Activity</h2>
              <p>Summary of available borrowing records</p>
            </div>
            <BarChart3 size={22} />
          </div>

          <div className="admin-report-chart">
            {report.borrowingBars.map((item) => {
              const width =
                item.value === 0
                  ? 0
                  : Math.max(
                      5,
                      (item.value / report.maxBorrowing) * 100
                    );

              return (
                <div className="admin-report-bar-row" key={item.label}>
                  <div className="admin-report-bar-label">
                    <span>{item.label}</span>
                    <strong>{item.value}</strong>
                  </div>

                  <div className="admin-report-bar-track">
                    <div
                      className={`admin-report-bar-fill ${item.label.toLowerCase()}`}
                      style={{ width: `${width}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <p className="admin-report-note">
            These figures represent records saved in this browser, not a
            complete historical database report.
          </p>
        </article>

        <article className="admin-report-panel">
          <div className="admin-report-panel-header">
            <div>
              <h2>Reservation Summary</h2>
              <p>Current reservation statuses</p>
            </div>
            <CalendarDays size={22} />
          </div>

          <div className="admin-reservation-stat">
            <span className="reservation-status-dot pending" />
            <span>Pending</span>
            <strong>{report.reservationCounts.pending}</strong>
          </div>

          <div className="admin-reservation-stat">
            <span className="reservation-status-dot approved" />
            <span>Approved</span>
            <strong>{report.reservationCounts.approved}</strong>
          </div>

          <div className="admin-reservation-stat">
            <span className="reservation-status-dot rejected" />
            <span>Rejected</span>
            <strong>{report.reservationCounts.rejected}</strong>
          </div>

          <div className="admin-report-reservation-total">
            <CalendarDays size={18} />
            <span>Total reservations</span>
            <strong>
              {report.reservationCounts.pending +
                report.reservationCounts.approved +
                report.reservationCounts.rejected}
            </strong>
          </div>
        </article>
      </section>

      <section className="admin-report-inventory">
        <div className="admin-report-panel-header">
          <div>
            <h2>Book Inventory Report</h2>
            <p>Inventory data currently saved in the browser</p>
          </div>
          <BookOpen size={22} />
        </div>

        <div className="admin-inventory-table-wrapper">
          <table className="admin-inventory-table">
            <thead>
              <tr>
                <th>Book Title</th>
                <th>Author</th>
                <th>Category</th>
                <th>Total Copies</th>
                <th>Available Copies</th>
              </tr>
            </thead>

            <tbody>
              {report.books.length > 0 ? (
                report.books.map((book, index) => (
                  <tr key={book.id ?? book.isbn ?? index}>
                    <td>
                      <div className="admin-inventory-title">
                        <div>
                          <BookOpen size={17} />
                        </div>
                        <strong>
                          {book.title || book.bookTitle || "Untitled Book"}
                        </strong>
                      </div>
                    </td>

                    <td>{book.author || "—"}</td>
                    <td>{book.category || "—"}</td>
                    <td>
                      {getNumber(book, [
                        "totalCopies",
                        "totalQuantity",
                        "quantity",
                        "copies",
                      ])}
                    </td>
                    <td>
                      {getNumber(book, [
                        "availableCopies",
                        "availableQuantity",
                        "available",
                      ])}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5">
                    <div className="admin-report-empty">
                      <BookOpen size={28} />
                      <strong>No inventory records found</strong>
                      <span>
                        Add books using the Librarian section to populate this
                        report.
                      </span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="admin-reports-footer">
        <Clock size={19} />
        <p>
          <strong>Report information:</strong> All statistics are calculated
          from locally stored frontend records. Data may be incomplete until
          the application is connected to Spring Boot and MySQL.
        </p>
      </section>
    </div>
  );
}