import { Link } from "react-router-dom";
import { ArrowLeft, ShieldCheck, Clock, Mail, LibraryBig } from "lucide-react";
import ThemeToggle from "../components/ThemeToggle";
import "../styles/legal.css";

export default function PrivacyPolicy() {
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
            <ShieldCheck size={14} />
            <span>Privacy &amp; Data Protection</span>
          </div>
          <h1>Privacy Policy</h1>
          <div className="legal-updated">
            <Clock size={14} />
            <span>Last Updated: October 14, 2026</span>
          </div>
        </header>

        <article className="legal-card">
          <section className="legal-section">
            <h2>1. Information We Collect</h2>
            <p>
              To provide effective library management and circulation services, LibraSpace collects
              the following personal and academic details when you register and interact with our system:
            </p>
            <ul>
              <li>
                <strong>Identity Information:</strong> Full name, role (Student, Librarian, or Administrator), and student/staff ID number.
              </li>
              <li>
                <strong>Contact Information:</strong> Valid email address and optional phone number for overdue and reservation notices.
              </li>
              <li>
                <strong>Borrowing Records:</strong> History of issued books, due dates, renewal timestamps, active reservations, and fine balances.
              </li>
              <li>
                <strong>Authentication Credentials:</strong> Passwords stored using secure hashing mechanisms, and Google account tokens for OAuth sign-ins.
              </li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>2. How We Use Your Data</h2>
            <p>Your information is used strictly to operate library operations, including:</p>
            <ul>
              <li>Processing book checkouts, returns, renewals, and waitlist allocations.</li>
              <li>Calculating accurate due dates and automatic late return charges.</li>
              <li>Delivering automated notifications, hold alerts, and account recovery instructions.</li>
              <li>Compiling anonymized library analytics such as popular titles and circulation trends.</li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>3. How Your Data Is Stored &amp; Protected</h2>
            <p>
              LibraSpace implements modern security practices to protect your data against unauthorized access,
              disclosure, alteration, or loss. User credentials and borrowing records are securely saved in
              encrypted databases with industry-standard TLS encryption during transmission. Access is protected
              through role-based authentication tokens.
            </p>
          </section>

          <section className="legal-section">
            <h2>4. Who Can See Your Information</h2>
            <p>Access to personal library records is strictly restricted by role:</p>
            <ul>
              <li>
                <strong>Students:</strong> Can only view their own profile, currently borrowed books, loan history, and outstanding fines.
              </li>
              <li>
                <strong>Librarians:</strong> Can view borrowing records, return dates, and contact emails to assist with circulation and book returns.
              </li>
              <li>
                <strong>Administrators:</strong> Have system-level oversight to manage student accounts, catalog inventory, and library settings.
              </li>
            </ul>
            <p>We do not sell, rent, or share personal user data with third-party advertising entities.</p>
          </section>

          <section className="legal-section">
            <h2>5. Your Rights &amp; Choices</h2>
            <p>As a registered member of LibraSpace, you have the right to:</p>
            <ul>
              <li>View and update your personal contact information via your Dashboard profile settings.</li>
              <li>Request an export of your complete circulation and fine history.</li>
              <li>Request account closure upon returning all borrowed materials and resolving outstanding fines.</li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>6. Contact Us</h2>
            <p>
              If you have any questions, concerns, or requests regarding this Privacy Policy or your personal data,
              please contact our library support team:
            </p>
            <div className="legal-callout">
              <p>
                <Mail size={16} style={{ verticalAlign: "middle", marginRight: "8px" }} />
                Email: <a href="mailto:support@libraspace.com">support@libraspace.com</a>
                <br />
                Office: LibraSpace Academic Library Helpdesk
              </p>
            </div>
          </section>
        </article>

        <footer className="legal-footer-nav">
          <p>
            Read our <Link to="/terms-and-conditions">Terms &amp; Conditions</Link> for borrowing rules and guidelines.
          </p>
        </footer>
      </main>
    </div>
  );
}
