import { Link } from "react-router-dom";
import { ArrowLeft, FileText, Clock, Mail, LibraryBig } from "lucide-react";
import ThemeToggle from "../components/ThemeToggle";
import "../styles/legal.css";

export default function TermsAndConditions() {
  return (
    <div className="legal-page">
      <header className="legal-topbar">
        <div className="legal-topbar-inner">
          <Link to="/" className="legal-back-link">
            <ArrowLeft size={16} />
            <span>Back to Home</span>
          </Link>

          <Link to="/" className="legal-brand-mini">
            <LibraryBig size={20} />
            <span>LibraSpace</span>
          </Link>

          <ThemeToggle />
        </div>
      </header>

      <main className="legal-container">
        <header className="legal-intro-header">
          <div className="legal-badge">
            <FileText size={14} />
            <span>Borrowing Rules &amp; Agreement</span>
          </div>
          <h1>Terms &amp; Conditions</h1>
          <div className="legal-updated">
            <Clock size={14} />
            <span>Last Updated: October 14, 2026</span>
          </div>
        </header>

        <article className="legal-card">
          <section className="legal-section">
            <h2>1. Account Use &amp; Responsibilities</h2>
            <p>
              By accessing LibraSpace, you agree to provide accurate registration information and
              maintain the confidentiality of your login credentials. Each account is personal and
              non-transferable. You are responsible for all library transactions, borrowed books,
              and fines accumulated under your account.
            </p>
          </section>

          <section className="legal-section">
            <h2>2. Circulation &amp; Borrowing Rules</h2>
            <p>To ensure fair access to resources for all students and faculty, borrowing is governed by the following rules:</p>
            <ul>
              <li>
                <strong>Loan Period:</strong> Books are issued for a standard duration of <strong>14 days</strong> from the date of checkout.
              </li>
              <li>
                <strong>Renewals:</strong> A book may be renewed once for an additional 14 days, provided no other student has placed an active hold on the title.
              </li>
              <li>
                <strong>Reservations &amp; Holds:</strong> If a desired title is currently issued, you may place a waitlist reservation. When the book is returned, you will be notified and given 48 hours to collect it.
              </li>
              <li>
                <strong>Borrowing Limits:</strong> Students may borrow a maximum of 4 titles concurrently. Staff and faculty limits may vary based on departmental guidelines.
              </li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>3. Late Fines &amp; Overdue Policy</h2>
            <p>
              Books must be returned or renewed on or before the specified due date. Late returns incur
              an automated fine of <strong>₹5 per day</strong> per overdue book. Fines accumulate daily
              until the item is officially checked back into the library catalog.
            </p>
          </section>

          <section className="legal-section">
            <h2>4. Lost or Damaged Materials</h2>
            <p>
              Borrowers are expected to keep library materials in good condition. If a book is damaged,
              marked, torn, or lost while checked out to you, you will be liable for the full replacement cost
              of the book plus a standard administrative processing charge.
            </p>
          </section>

          <section className="legal-section">
            <h2>5. Account Suspension &amp; Clearance</h2>
            <p>
              Borrowing privileges may be temporarily suspended if an account has books overdue by more than
              14 days or unpaid fines exceeding ₹150. Full library privileges are restored immediately upon
              returning the books and clearing the outstanding balance. Graduating students must receive
              library clearance by resolving all records prior to diploma issuance.
            </p>
          </section>

          <section className="legal-section">
            <h2>6. Changes to Terms</h2>
            <p>
              LibraSpace reserves the right to revise loan periods, fine rates, and borrowing rules to meet
              academic requirements. Any modifications will be updated on this page with an updated revision date.
              Continued use of the library portal constitutes acceptance of the modified terms.
            </p>
          </section>

          <section className="legal-section">
            <h2>7. Contact &amp; Inquiries</h2>
            <p>
              If you have questions regarding loan extensions, fee discrepancies, or account status, please reach out to us:
            </p>
            <div className="legal-callout">
              <p>
                <Mail size={16} style={{ verticalAlign: "middle", marginRight: "8px" }} />
                Support Email: <a href="mailto:support@libraspace.com">support@libraspace.com</a>
                <br />
                Circulation Desk: Academic Central Library
              </p>
            </div>
          </section>
        </article>

        <footer className="legal-footer-nav">
          <p>
            Review our <Link to="/privacy-policy">Privacy Policy</Link> to learn how we protect your personal information.
          </p>
        </footer>
      </main>
    </div>
  );
}
