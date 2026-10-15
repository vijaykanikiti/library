import { Link } from "react-router-dom";
import {
  LibraryBig,
  ArrowLeft,
  BookOpen,
  BookMarked,
  Clock3,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import ThemeToggle from "../components/ThemeToggle";
import "../styles/auth.css";
const currentYear = new Date().getFullYear();
export default function AuthLayout({ children }) {
  return (
    <main className="auth-page">
      <section className="auth-specs-panel">
        <div className="specs-container">
          <header className="specs-top-brand">
            <Link to="/" className="specs-brand-link">
              <span className="specs-brand-icon">
                <LibraryBig size={24} />
              </span>
              <div className="specs-brand-text">
                <strong>LibraSpace</strong>
                <small>ACADEMIC LIBRARY SYSTEM</small>
              </div>
            </Link>
          </header>

          <div className="specs-center-content">
            <div className="specs-badge">
              <Sparkles size={13} />
              <span>SYSTEM SPECIFICATIONS</span>
            </div>

            <h1 className="specs-headline">
              A world of books.
              <br />
              <span>A lifetime of ideas.</span>
            </h1>

            <p className="specs-summary">
              A centralized digital library platform designed for students and
              librarians to streamline cataloging, borrowing, renewals, and fine
              management.
            </p>

            <div className="specs-features-grid">
              <div className="specs-feature-card">
                <span className="specs-feature-icon">
                  <BookOpen size={18} />
                </span>
                <div>
                  <h4>Catalog &amp; Stock Tracking</h4>
                  <p>
                    Search books by title, author, ISBN or category with real-time
                    copy availability.
                  </p>
                </div>
              </div>
              <div className="specs-feature-card">
                <span className="specs-feature-icon">
                  <BookMarked size={18} />
                </span>
                <div>
                  <h4>Circulation &amp; Waitlist Holds</h4>
                  <p>
                    14-day borrowing cycle, easy renewals, and automated waitlist
                    reservations.
                  </p>
                </div>
              </div>

              <div className="specs-feature-card">
                <span className="specs-feature-icon">
                  <Clock3 size={18} />
                </span>
                <div>
                  <h4>Due Dates &amp; Automated Fines</h4>
                  <p>
                    Automatic late fee calculation at standard daily rates with
                    payment tracking.
                  </p>
                </div>
              </div>

              <div className="specs-feature-card">
                <span className="specs-feature-icon">
                  <ShieldCheck size={18} />
                </span>
                <div>
                  <h4>Role-Based Access</h4>
                  <p>
                    Dedicated dashboard portals for Administrators, Librarians,
                    and Students.
                  </p>
                </div>
              </div>
            </div>

            <div className="specs-metrics-bar">
              <div className="specs-metric">
                <strong>3 Roles</strong>
                <small>Admin · Staff · Student</small>
              </div>
              <div className="specs-metric">
                <strong>14 Days</strong>
                <small>Standard Loan Period</small>
              </div>
              <div className="specs-metric">
                <strong>₹5 / day</strong>
                <small>Late Fine Policy</small>
              </div>
            </div>
          </div>

          <footer className="specs-bottom-footer">
            <p>© {currentYear} LibraSpace · Academic Library Management Portal</p>
          </footer>
        </div>
      </section>

      <section className="auth-form-panel">
        <header className="auth-form-topbar">
          <Link to="/" className="auth-home-btn">
            <ArrowLeft size={15} />
            <span>Back to Home</span>
          </Link>

          <div className="auth-form-actions">
            <ThemeToggle />
          </div>
        </header>

        <div className="auth-form-center">
          <div className="auth-form-box">{children}</div>
        </div>

        <footer className="auth-form-footer">
          <p>
            Secure library authentication ·{" "}
            <Link to="/privacy-policy">Privacy Policy</Link> ·{" "}
            <Link to="/terms-and-conditions">Terms & Conditions</Link>
          </p>
        </footer>
      </section>
    </main>
  );
}