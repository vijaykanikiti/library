import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";

import {
  ArrowRight,
  Search,
  BookOpen,
  Users,
  Clock,
  Star,
  LibraryBig,
  BookMarked,
  GraduationCap,
  FlaskConical,
  Code,
  Heart,
  BookText,
  Sparkles,
  ShieldCheck,
  CalendarCheck,
} from "lucide-react";

import Navbar from "../components/Navbar";
import "../styles/home.css";

const categories = [
  {
    name: "Technology",
    description: "Programming, AI and computing",
    icon: Code,
    count: "120+",
  },
  {
    name: "Science",
    description: "Discover the world around you",
    icon: FlaskConical,
    count: "95+",
  },
  {
    name: "Education",
    description: "Learn something new every day",
    icon: GraduationCap,
    count: "150+",
  },
  {
    name: "Literature",
    description: "Stories, novels and poetry",
    icon: BookText,
    count: "200+",
  },
  {
    name: "Personal Growth",
    description: "Build better habits and skills",
    icon: Sparkles,
    count: "80+",
  },
  {
    name: "Health & Wellness",
    description: "Explore healthy living",
    icon: Heart,
    count: "70+",
  },
];

const initialBooks = [];

const features = [
  {
    icon: Search,
    title: "Easy Book Discovery",
    description:
      "Find books by title, author, ISBN or category with convenient search.",
  },
  {
    icon: CalendarCheck,
    title: "Smart Borrowing",
    description:
      "Keep track of issue dates, due dates, reservations and renewals.",
  },
  {
    icon: ShieldCheck,
    title: "Personal Library",
    description:
      "Access your borrowing history and manage your library profile.",
  },
];

export default function Home() {
  const [searchTerm, setSearchTerm] = useState("");

  const [books] = useState(() => {
    try {
      const saved = localStorage.getItem("libraspace_books");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((b, idx) => ({
            id: b.id || idx + 1,
            title: b.title,
            author: b.author,
            category: b.category,
            rating: 4.8,
            color: idx % 3 === 0 ? "#dce8db" : idx % 3 === 1 ? "#f5e2cb" : "#e7dff6",
            symbol: b.title ? b.title[0] : "✦",
            available: b.availableCopies !== undefined ? b.availableCopies > 0 : true,
          }));
        }
      }
    } catch {}
    return initialBooks;
  });

  const [stats] = useState(() => {
    let booksCount = 0;
    let membersCount = 0;
    try {
      const b = JSON.parse(localStorage.getItem("libraspace_books") || "[]");
      if (Array.isArray(b)) booksCount = b.length;
    } catch {}
    try {
      const s = JSON.parse(localStorage.getItem("libraspace_students") || "[]");
      const u = JSON.parse(localStorage.getItem("users") || "[]");
      membersCount = Math.max(Array.isArray(s) ? s.length : 0, Array.isArray(u) ? u.length : 0);
    } catch {}
    return {
      books: booksCount > 0 ? `${booksCount}+` : "0",
      members: membersCount > 0 ? `${membersCount}+` : "0",
    };
  });

  const filteredBooks = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    if (!query) return books;

    return books.filter((book) =>
      [
        book.title,
        book.author,
        book.category,
      ].some((value) => value.toLowerCase().includes(query))
    );
  }, [searchTerm]);

  return (
    <>
      <Navbar />

      <main>
        {/* HERO SECTION */}
        <section className="hero-section">
          <div className="hero-container">
            <div className="hero-content">
              <div className="hero-badge">
                <Sparkles size={16} />
                A smarter way to discover books
              </div>

              <h1>
                Every great journey
                <br />
                begins with a <span>book.</span>
              </h1>

              <p>
                Explore knowledge, discover new ideas and manage
                your borrowing experience in one simple library
                platform.
              </p>

              <div className="hero-buttons">
                <Link to="/register" className="hero-primary">
                  Get Started
                  <ArrowRight size={19} />
                </Link>

                <a href="#featured" className="hero-secondary">
                  <BookOpen size={19} />
                  Explore Books
                </a>
              </div>

              <div className="hero-trust">
                <div className="trust-icon">
                  <Users size={20} />
                </div>

                <div>
                  <strong>Knowledge for everyone</strong>
                  <span>Discover. Read. Grow.</span>
                </div>
              </div>
            </div>

            <div className="hero-visual">
              <div className="floating-label label-top">
                <Sparkles size={18} />
                Discover something new
              </div>

              <div className="hero-book-display">
                <div className="hero-book hero-book-one">
                  <div className="book-decoration">✦</div>
                  <div className="book-cover-title">
                    THE ART
                    <br />
                    OF LEARNING
                  </div>
                  <div className="book-cover-subtitle">
                    A WORLD OF KNOWLEDGE
                  </div>
                </div>

                <div className="hero-book hero-book-two">
                  <div className="book-decoration">∞</div>
                  <div className="book-cover-title">
                    EXPLORE
                    <br />
                    THE UNIVERSE
                  </div>
                  <div className="book-cover-subtitle">
                    SCIENCE & DISCOVERY
                  </div>
                </div>

                <div className="hero-book hero-book-three">
                  <div className="book-decoration">✺</div>
                  <div className="book-cover-title">
                    STORIES
                    <br />
                    THAT INSPIRE
                  </div>
                  <div className="book-cover-subtitle">
                    IMAGINATION HAS NO LIMITS
                  </div>
                </div>
              </div>

              <div className="floating-label label-bottom">
                <BookMarked size={19} />
                Your next favourite book awaits
              </div>
            </div>
          </div>
        </section>

        {/* STATISTICS */}
        <section className="stats-section">
          <div className="stats-container">
            <div className="stat-item">
              <LibraryBig size={27} />
              <div>
                <h3>{stats.books}</h3>
                <p>Book Collection</p>
              </div>
            </div>

            <div className="stat-item">
              <Users size={27} />
              <div>
                <h3>{stats.members}</h3>
                <p>Library Members</p>
              </div>
            </div>

            <div className="stat-item">
              <BookOpen size={27} />
              <div>
                <h3>6+</h3>
                <p>Book Categories</p>
              </div>
            </div>

            <div className="stat-item">
              <Clock size={27} />
              <div>
                <h3>24/7</h3>
                <p>Browse Anytime</p>
              </div>
            </div>
          </div>
        </section>

        {/* CATEGORIES */}
        <section className="home-section" id="categories">
          <div className="section-heading">
            <div>
              <span className="section-eyebrow">
                EXPLORE YOUR INTERESTS
              </span>

              <h2>Browse by category</h2>

              <p>
                Find your next great read from our curated
                collection of subjects.
              </p>
            </div>

            <a href="#featured" className="text-link">
              Explore collection
              <ArrowRight size={17} />
            </a>
          </div>

          <div className="category-grid">
            {categories.map((category) => {
              const Icon = category.icon;

              return (
                <button
                  type="button"
                  key={category.name}
                  className="category-card"
                  onClick={() => {
                    setSearchTerm(category.name);

                    document
                      .getElementById("featured")
                      ?.scrollIntoView({ behavior: "smooth" });
                  }}
                >
                  <div className="category-icon">
                    <Icon size={26} />
                  </div>

                  <div className="category-information">
                    <h3>{category.name}</h3>
                    <p>{category.description}</p>
                    <span>{category.count} books</span>
                  </div>

                  <ArrowRight
                    size={18}
                    className="category-arrow"
                  />
                </button>
              );
            })}
          </div>
        </section>

        {/* FEATURED BOOKS */}
        <section className="home-section featured-section" id="featured">
          <div className="section-heading">
            <div>
              <span className="section-eyebrow">
                FIND YOUR NEXT READ
              </span>

              <h2>Featured books</h2>

              <p>
                Discover popular selections from our library collection.
              </p>
            </div>
          </div>

          <div className="book-search">
            <Search size={21} />

            <input
              type="search"
              placeholder="Search by title, author or category..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              aria-label="Search featured books"
            />

            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
              >
                Clear
              </button>
            )}
          </div>

          <div className="book-grid">
            {filteredBooks.length > 0 ? (
              filteredBooks.map((book) => (
                <article className="book-card" key={book.id}>
                  <div
                    className="book-art"
                    style={{ "--book-color": book.color }}
                  >
                    <div className="book-art-inner">
                      <span className="book-art-symbol">
                        {book.symbol}
                      </span>

                      <h3>{book.title}</h3>

                      <span className="book-art-author">
                        {book.author}
                      </span>
                    </div>
                  </div>

                  <div className="book-card-content">
                    <span className="book-category">
                      {book.category}
                    </span>

                    <h3>{book.title}</h3>

                    <p>by {book.author}</p>

                    <div className="book-card-bottom">
                      <span className="book-rating">
                        <Star size={15} fill="currentColor" />
                        {book.rating}
                      </span>

                      <span
                        className={`availability ${
                          book.available ? "available" : "unavailable"
                        }`}
                      >
                        {book.available
                          ? "Available"
                          : "Currently issued"}
                      </span>
                    </div>

                    <Link
                      to="/login"
                      className="book-action"
                    >
                      View Details
                      <ArrowRight size={16} />
                    </Link>
                  </div>
                </article>
              ))
            ) : (
              <div className="empty-books">
                <BookOpen size={35} />

                <h3>No matching books found</h3>

                <p>
                  Try another title, author or category.
                </p>
              </div>
            )}
          </div>

          <div className="featured-footer">
            <Link to="/login" className="browse-all-button">
              Browse Library
              <ArrowRight size={18} />
            </Link>
          </div>
        </section>

        {/* FEATURES */}
        <section className="home-section features-section" id="about">
          <div className="features-heading">
            <span className="section-eyebrow">
              THE LIBRARY EXPERIENCE
            </span>

            <h2>Everything you need in one place</h2>

            <p>
              Simple tools to help students and librarians
              manage everyday library activities.
            </p>
          </div>

          <div className="features-grid">
            {features.map((feature) => {
              const Icon = feature.icon;

              return (
                <article className="feature-card" key={feature.title}>
                  <div className="feature-icon">
                    <Icon size={27} />
                  </div>

                  <h3>{feature.title}</h3>

                  <p>{feature.description}</p>
                </article>
              );
            })}
          </div>
        </section>

        {/* CALL TO ACTION */}
        <section className="cta-section">
          <div className="cta-content">
            <span>YOUR NEXT CHAPTER STARTS HERE</span>

            <h2>Ready to explore a world of knowledge?</h2>

            <p>
              Create your account and begin discovering books
              that inspire your next big idea.
            </p>

            <Link to="/register" className="cta-button">
              Join LibraSpace
              <ArrowRight size={19} />
            </Link>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="library-footer">
        <div className="footer-container">
          <div className="footer-brand">
            <Link to="/" className="library-brand">
              <span className="brand-icon">
                <LibraryBig size={25} />
              </span>

              <span>
                <strong>LibraSpace</strong>
                <small>Your world of knowledge</small>
              </span>
            </Link>

            <p>
              Connecting readers with knowledge through a
              simple and accessible library experience.
            </p>

            <div className="footer-social-links" aria-label="Social media channels">
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="footer-social-btn"
                title="GitHub"
                aria-label="Follow LibraSpace on GitHub"
              >
                <i className="bi bi-github"></i>
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                className="footer-social-btn"
                title="LinkedIn"
                aria-label="Connect with LibraSpace on LinkedIn"
              >
                <i className="bi bi-linkedin"></i>
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="footer-social-btn"
                title="Twitter / X"
                aria-label="Follow LibraSpace on Twitter / X"
              >
                <i className="bi bi-twitter-x"></i>
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="footer-social-btn"
                title="Instagram"
                aria-label="Follow LibraSpace on Instagram"
              >
                <i className="bi bi-instagram"></i>
              </a>
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noopener noreferrer"
                className="footer-social-btn"
                title="YouTube"
                aria-label="Subscribe to LibraSpace on YouTube"
              >
                <i className="bi bi-youtube"></i>
              </a>
              <a
                href="https://discord.com"
                target="_blank"
                rel="noopener noreferrer"
                className="footer-social-btn"
                title="Discord"
                aria-label="Join LibraSpace on Discord"
              >
                <i className="bi bi-discord"></i>
              </a>
            </div>
          </div>

          <div className="footer-column">
            <h3>Explore</h3>
            <a href="#categories">Categories</a>
            <a href="#featured">Featured Books</a>
            <a href="#about">Our Features</a>
          </div>

          <div className="footer-column">
            <h3>Account</h3>
            <Link to="/login">Login</Link>
            <Link to="/register">Register</Link>
            <Link to="/login">My Library</Link>
          </div>

          <div className="footer-column">
            <h3>Information</h3>
            <a href="#about">About Us</a>
            <a href="mailto:gopalkrishnagopal6363@gmail.com">Contact Support</a>
            <Link to="/privacy-policy">Privacy Policy</Link>
            <Link to="/terms-and-conditions">Terms & Conditions</Link>
          </div>

          <div className="footer-column">
            <h3>Community</h3>
            <a href="https://github.com" target="_blank" rel="noopener noreferrer">
              <i className="bi bi-github"></i> GitHub Code
            </a>
            <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer">
              <i className="bi bi-linkedin"></i> LinkedIn
            </a>
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer">
              <i className="bi bi-twitter-x"></i> Twitter / X
            </a>
            <a href="https://discord.com" target="_blank" rel="noopener noreferrer">
              <i className="bi bi-discord"></i> Discord Community
            </a>
          </div>
        </div>

        <div className="footer-bottom">
          <p>
            © {new Date().getFullYear()} LibraSpace. All rights
            reserved.
          </p>

          <div className="footer-bottom-social">
            <span>Connect with us:</span>
            <div className="footer-bottom-icons">
              <a href="https://github.com" target="_blank" rel="noopener noreferrer" aria-label="GitHub"><i className="bi bi-github"></i></a>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn"><i className="bi bi-linkedin"></i></a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" aria-label="Twitter"><i className="bi bi-twitter-x"></i></a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram"><i className="bi bi-instagram"></i></a>
              <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" aria-label="YouTube"><i className="bi bi-youtube"></i></a>
              <a href="https://discord.com" target="_blank" rel="noopener noreferrer" aria-label="Discord"><i className="bi bi-discord"></i></a>
            </div>
          </div>

          <p>Built for readers, learners and knowledge seekers.</p>
        </div>
      </footer>
    </>
  );
}