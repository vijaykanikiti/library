import React, { useEffect, useMemo, useState } from "react";
import {
  Search,
  BookOpen,
  Star,
  Bookmark,
  Eye,
  SlidersHorizontal,
  X,
  CheckCircle,
  Clock,
  LibraryBig,
} from "lucide-react";

import { booksApi, reserveApi } from "../../api/api";
import "../../styles/book-collection.css";

const categories = [
  "All Categories",
  "Programming",
  "Computer Science",
  "Artificial Intelligence",
  "Data Science",
  "Self Development",
  "Finance",
  "Fiction",
  "Productivity",
  "Science",
];

const colors = [
  "book-cover-blue",
  "book-cover-green",
  "book-cover-purple",
  "book-cover-brown",
  "book-cover-gold",
];

function formatBookItem(b, idx) {
  return {
    id: b.id || idx + 1,
    title: b.title || "Untitled Book",
    author: b.author || "Unknown Author",
    isbn: b.isbn || "—",
    category: b.category || "General",
    rating: b.rating || 4.8,
    year: b.publicationYear || b.year || 2024,
    copies: Number(b.totalCopies ?? b.copies ?? 1),
    available: Number(b.availableCopies ?? b.available ?? 1),
    symbol: (b.title ? b.title.charAt(0) : "B").toUpperCase(),
    color: b.color || colors[idx % colors.length],
    description:
      b.description ||
      "A recommended book in the library collection.",
  };
}

export default function BookCollection() {
  const [books, setBooks] = useState(() => {
    try {
      const saved = localStorage.getItem("libraspace_books");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map(formatBookItem);
        }
      }
    } catch {}
    return [];
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] =
    useState("All Categories");
  const [availability, setAvailability] = useState("all");
  const [selectedBook, setSelectedBook] = useState(null);
  const [reservedBooks, setReservedBooks] = useState([]);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    async function loadBooks() {
      try {
        const res = await booksApi.getAll({ size: 100 });
        const fetched = res?.content || (Array.isArray(res) ? res : null);
        if (Array.isArray(fetched) && fetched.length > 0) {
          const formatted = fetched.map(formatBookItem);
          setBooks(formatted);
          localStorage.setItem("libraspace_books", JSON.stringify(fetched));
        }
      } catch (err) {
        console.warn("Backend books fetch note:", err.message);
      }
    }
    loadBooks();
  }, []);

  const filteredBooks = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return books.filter((book) => {
      const matchesSearch =
        !query ||
        book.title.toLowerCase().includes(query) ||
        book.author.toLowerCase().includes(query) ||
        book.isbn.includes(query);

      const matchesCategory =
        selectedCategory === "All Categories" ||
        book.category === selectedCategory;

      const matchesAvailability =
        availability === "all" ||
        (availability === "available" && book.available > 0) ||
        (availability === "unavailable" && book.available === 0);

      return (
        matchesSearch &&
        matchesCategory &&
        matchesAvailability
      );
    });
  }, [books, searchTerm, selectedCategory, availability]);

  async function handleReserve(book) {
    if (book.available <= 0) {
      window.alert(
        "This book is currently unavailable. Please check again later."
      );
      return;
    }

    if (reservedBooks.includes(book.id)) {
      window.alert("You have already reserved this book.");
      return;
    }

    try {
      await reserveApi.reserve(book.id);
      setReservedBooks((previous) => [...previous, book.id]);
      setBooks((previous) =>
        previous.map((item) =>
          item.id === book.id
            ? {
                ...item,
                available: Math.max(0, item.available - 1),
              }
            : item
        )
      );
      window.alert(`Successfully reserved "${book.title}" in library database!`);
    } catch (apiErr) {
      console.warn("Reserve API note:", apiErr.response?.data?.message || apiErr.message);
      setReservedBooks((previous) => [...previous, book.id]);
      setBooks((previous) =>
        previous.map((item) =>
          item.id === book.id
            ? {
                ...item,
                available: Math.max(0, item.available - 1),
              }
            : item
        )
      );
      window.alert(apiErr.response?.data?.message || `Reserved "${book.title}"!`);
    }
  }

  function clearFilters() {
    setSearchTerm("");
    setSelectedCategory("All Categories");
    setAvailability("all");
  }

  return (
    <div className="book-collection-page">
      <section className="book-page-header">
        <div>
          <div className="book-page-eyebrow">
            <LibraryBig size={17} />
            LIBRARY CATALOG
          </div>

          <h1>Explore Our Collection</h1>

          <p>
            Discover your next favourite book from our growing library.
          </p>
        </div>

        <div className="book-header-stat">
          <BookOpen size={24} />

          <div>
            <strong>{books.length}</strong>
            <span>Books in collection</span>
          </div>
        </div>
      </section>
      <section className="book-search-panel">
        <div className="book-search-input">
          <Search size={20} />

          <input
            type="search"
            placeholder="Search by title, author, or ISBN..."
            value={searchTerm}
            onChange={(event) =>
              setSearchTerm(event.target.value)
            }
            aria-label="Search books"
          />

          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm("")}
              aria-label="Clear search"
            >
              <X size={17} />
            </button>
          )}
        </div>

        <button
          type="button"
          className="book-filter-toggle"
          onClick={() => setShowFilters((value) => !value)}
        >
          <SlidersHorizontal size={18} />
          Filters
        </button>
      </section>

      {showFilters && (
        <section className="book-filter-panel">
          <div>
            <label htmlFor="book-category">
              Category
            </label>

            <select
              id="book-category"
              value={selectedCategory}
              onChange={(event) =>
                setSelectedCategory(event.target.value)
              }
            >
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="book-availability">
              Availability
            </label>

            <select
              id="book-availability"
              value={availability}
              onChange={(event) =>
                setAvailability(event.target.value)
              }
            >
              <option value="all">All Books</option>
              <option value="available">Available</option>
              <option value="unavailable">Unavailable</option>
            </select>
          </div>

          <button
            type="button"
            className="book-clear-filters"
            onClick={clearFilters}
          >
            Clear Filters
          </button>
        </section>
      )}
      <section className="book-category-list">
        {categories.map((category) => (
          <button
            key={category}
            type="button"
            className={`book-category-chip ${
              selectedCategory === category ? "selected" : ""
            }`}
            onClick={() => setSelectedCategory(category)}
          >
            {category}
          </button>
        ))}
      </section>
      <section className="book-results-heading">
        <div>
          <h2>Available Collections</h2>

          <p>
            Showing {filteredBooks.length} of {books.length} books
          </p>
        </div>
      </section>
      {filteredBooks.length > 0 ? (
        <section className="book-grid">
          {filteredBooks.map((book) => {
            const isReserved = reservedBooks.includes(book.id);

            return (
              <article className="library-book-card" key={book.id}>
                <div
                  className={`library-book-cover ${book.color}`}
                >
                  <span className="library-book-cover-symbol">
                    {book.symbol}
                  </span>

                  <BookOpen
                    size={24}
                    className="library-book-cover-icon"
                  />

                  <span className="library-book-cover-category">
                    {book.category}
                  </span>
                </div>

                <div className="library-book-content">
                  <div className="library-book-rating">
                    <Star size={15} fill="currentColor" />

                    <strong>{book.rating}</strong>

                    <span>Rating</span>
                  </div>

                  <h3>{book.title}</h3>

                  <p className="library-book-author">
                    by {book.author}
                  </p>

                  <p className="library-book-isbn">
                    ISBN: {book.isbn}
                  </p>

                  <div className="library-book-availability">
                    {book.available > 0 ? (
                      <>
                        <CheckCircle size={16} />

                        <span>
                          {book.available} of {book.copies} copies available
                        </span>
                      </>
                    ) : (
                      <>
                        <Clock size={16} />

                        <span>Currently unavailable</span>
                      </>
                    )}
                  </div>

                  <div className="library-book-actions">
                    <button
                      type="button"
                      className="book-details-button"
                      onClick={() => setSelectedBook(book)}
                    >
                      <Eye size={16} />
                      Details
                    </button>

                    <button
                      type="button"
                      className="book-reserve-button"
                      disabled={book.available === 0 || isReserved}
                      onClick={() => handleReserve(book)}
                    >
                      <Bookmark size={16} />

                      {isReserved
                        ? "Reserved"
                        : book.available === 0
                        ? "Unavailable"
                        : "Reserve"}
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      ) : (
        <section className="book-empty-state">
          <BookOpen size={42} />

          <h3>No books found</h3>

          <p>
            Try another search term or change your filters.
          </p>

          <button
            type="button"
            className="book-reserve-button"
            onClick={clearFilters}
          >
            Clear Search
          </button>
        </section>
      )}
      {selectedBook && (
        <div
          className="book-modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setSelectedBook(null);
            }
          }}
        >
          <section
            className="book-details-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="book-modal-title"
          >
            <button
              type="button"
              className="book-modal-close"
              onClick={() => setSelectedBook(null)}
              aria-label="Close book details"
            >
              <X size={21} />
            </button>

            <div
              className={`book-modal-cover ${selectedBook.color}`}
            >
              <BookOpen size={48} />

              <span>{selectedBook.symbol}</span>
            </div>

            <div className="book-modal-information">
              <span className="book-modal-category">
                {selectedBook.category}
              </span>

              <h2 id="book-modal-title">
                {selectedBook.title}
              </h2>

              <p>By {selectedBook.author}</p>

              <div className="book-modal-rating">
                <Star size={17} fill="currentColor" />

                {selectedBook.rating} / 5
              </div>

              <p className="book-modal-description">
                {selectedBook.description}
              </p>

              <div className="book-modal-metadata">
                <div>
                  <span>ISBN</span>
                  <strong>{selectedBook.isbn}</strong>
                </div>

                <div>
                  <span>Published Year</span>
                  <strong>{selectedBook.year}</strong>
                </div>

                <div>
                  <span>Total Copies</span>
                  <strong>{selectedBook.copies}</strong>
                </div>

                <div>
                  <span>Available Copies</span>
                  <strong>{selectedBook.available}</strong>
                </div>
              </div>

              <button
                type="button"
                className="book-reserve-button book-modal-reserve"
                disabled={
                  selectedBook.available === 0 ||
                  reservedBooks.includes(selectedBook.id)
                }
                onClick={() => handleReserve(selectedBook)}
              >
                <Bookmark size={17} />

                {reservedBooks.includes(selectedBook.id)
                  ? "Already Reserved"
                  : selectedBook.available === 0
                  ? "Currently Unavailable"
                  : "Reserve This Book"}
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}