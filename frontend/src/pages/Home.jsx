import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { booksApi } from "../services/api";
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
import { SocialLinksRow } from "../components/SocialLinks";
import "../styles/home.css";

const currentYear = new Date().getFullYear();

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

const books = [
  {
    id: 1,
    title: "Clean Code",
    author: "Robert C. Martin",
    category: "Technology",
    rating: 4.8,
    color: "#dce8db",
    symbol: "</>",
    available: true,
  },
  {
    id: 2,
    title: "Atomic Habits",
    author: "James Clear",
    category: "Personal Growth",
    rating: 4.9,
    color: "#f5e2cb",
    symbol: "A",
    available: true,
  },
  {
    id: 3,
    title: "The Alchemist",
    author: "Paulo Coelho",
    category: "Literature",
    rating: 4.7,
    color: "#e7dff6",
    symbol: "✦",
    available: false,
  },
  {
    id: 4,
    title: "A Brief History of Time",
    author: "Stephen Hawking",
    category: "Science",
    rating: 4.8,
    color: "#dceaf7",
    symbol: "∞",
    available: true,
  },
];

const features = [
  {
    icon: Search,
    title: "Easy Book Discovery",
    description: "Find books by title, author, ISBN or category with convenient search.",
  },
  {
    icon: CalendarCheck,
    title: "Smart Borrowing",
    description: "Keep track of issue dates, due dates, reservations and renewals.",
  },
  {
    icon: ShieldCheck,
    title: "Personal Library",
    description: "Access your borrowing history and manage your library profile.",
  },
];

export default function Home() {
  const [searchTerm, setSearchTerm] = useState("");
  const [bookList, setBookList] = useState(books);

  useEffect(() => {
    booksApi
      .getAll()
      .then((data) => {
        const fetched = data?.content || data;
        if (Array.isArray(fetched) && fetched.length > 0) {
          const mapped = fetched.map((b, idx) => ({
            id: b.id,
            title: b.title,
            author: b.author,
            category: b.category,
            rating: b.rating || 4.8,
            color: ["#dce8db", "#f5e2cb", "#e7dff6", "#dceaf7"][idx % 4],
            symbol: b.title.charAt(0),
            available: b.availableCopies > 0,
          }));
          setBookList(mapped);
        }
      })
      .catch(() => {});
  }, []);

  const filteredBooks = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return bookList;
    return bookList.filter((book) =>
      [book.title, book.author, book.category].some((value) =>
        value.toLowerCase().includes(query)
      )
    );
  }, [searchTerm, bookList]);

  return (
    <>
      <Navbar />

      <main>
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
                Explore knowledge, discover new ideas and manage your borrowing
                experience in one simple library platform.
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
                  <div className="book-cover-subtitle">A WORLD OF KNOWLEDGE</div>
                </div>

                <div className="hero-book hero-book-two">
                  <div className="book-decoration">∞</div>
                  <div className="book-cover-title">
                    EXPLORE
                    <br />
                    THE UNIVERSE
                  </div>
                  <div className="book-cover-subtitle">SCIENCE & DISCOVERY</div>
                </div>

                <div className="hero-book hero-book-three">
                  <div className="book-decoration">✺</div>
                  <div className="book-cover-title">
                    STORIES
                    <br />
                    THAT INSPIRE
                  </div>
                  <div className="book-cover-subtitle">IMAGINATION HAS NO LIMITS</div>
                </div>
              </div>

              <div className="floating-label label-bottom">
                <BookMarked size={19} />
                Your next favourite book awaits
              </div>
            </div>
          </div>
        </section>

        <section className="stats-section">
          <div className="stats-container">
            <div className="stat-item">
              <LibraryBig size={27} />
              <div>
                <h3>1,000+</h3>
                <p>Book Collection</p>
              </div>
            </div>

            <div className="stat-item">
              <Users size={27} />
              <div>
                <h3>500+</h3>
                <p>Library Members</p>
              </div>
            </div>

            <div className="stat-item">
              <BookOpen size={27} />
              <div>
                <h3>25+</h3>
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

        <section className="home-section" id="categories">
          <div className="section-heading">
            <div>
              <span className="section-eyebrow">EXPLORE YOUR INTERESTS</span>
              <h2>Browse by category</h2>
              <p>Find your next great read from our curated collection of subjects.</p>
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
                    document.getElementById("featured")?.scrollIntoView({ behavior: "smooth" });
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
                  <ArrowRight size={18} className="category-arrow" />
                </button>
              );
            })}
          </div>
        </section>

        <section className="home-section featured-section" id="featured">
          <div className="section-heading">
            <div>
              <span className="section-eyebrow">FIND YOUR NEXT READ</span>
              <h2>Featured books</h2>
              <p>Discover popular selections from our library collection.</p>
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
              <button type="button" onClick={() => setSearchTerm("")}>
                Clear
              </button>
            )}
          </div>

          <div className="book-grid">
            {filteredBooks.length > 0 ? (
              filteredBooks.map((book) => (
                <article className="book-card" key={book.id}>
                  <div className="book-art" style={{ "--book-color": book.color }}>
                    <div className="book-art-inner">
                      <span className="book-art-symbol">{book.symbol}</span>
                      <h3>{book.title}</h3>
                      <span className="book-art-author">{book.author}</span>
                    </div>
                  </div>

                  <div className="book-card-content">
                    <span className="book-category">{book.category}</span>
                    <h3>{book.title}</h3>
                    <p>by {book.author}</p>
                    <div className="book-card-bottom">
                      <span className="book-rating">
                        <Star size={15} fill="currentColor" />
                        {book.rating}
                      </span>
                      <span className={`availability ${book.available ? "available" : "unavailable"}`}>
                        {book.available ? "Available" : "Currently issued"}
                      </span>
                    </div>

                    <Link to="/login" className="book-action">
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
                <p>Try another title, author or category.</p>
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

        <section className="home-section features-section" id="about">
          <div className="features-heading">
            <span className="section-eyebrow">THE LIBRARY EXPERIENCE</span>
            <h2>Everything you need in one place</h2>
            <p>Simple tools to help students and librarians manage everyday library activities.</p>
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

        <section className="cta-section">
          <div className="cta-content">
            <span>YOUR NEXT CHAPTER STARTS HERE</span>
            <h2>Ready to explore a world of knowledge?</h2>
            <p>Create your account and begin discovering books that inspire your next big idea.</p>
            <Link to="/register" className="cta-button">
              Join LibraSpace
              <ArrowRight size={19} />
            </Link>
          </div>
        </section>
      </main>

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
            <p>Connecting readers with knowledge through a simple and accessible library experience.</p>
            <div className="footer-social-wrapper" style={{ marginTop: "20px" }}>
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.8px",
                  color: "var(--text-secondary)",
                  display: "block",
                  marginBottom: "12px",
                }}
              >
                Follow LibraSpace
              </span>
              <SocialLinksRow size="sm" />
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
            <a href="mailto:library@example.com">Contact</a>
            <Link to="/privacy-policy">Privacy Policy</Link>
            <Link to="/terms-and-conditions">Terms & Conditions</Link>
          </div>
        </div>

        <div className="footer-bottom">
          <p>© {currentYear} LibraSpace. All rights reserved.</p>
          <p>Built for readers, learners and knowledge seekers.</p>
        </div>
      </footer>
    </>
  );
}