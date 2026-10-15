import React, { useEffect, useMemo, useState } from "react";

import {
  Search,
  Star,
  BookOpen,
  MessageSquareText,
  Pencil,
  Trash2,
  X,
  Send,
  CheckCircle2,
  UserRound,
} from "lucide-react";

import "../../styles/book-reviews.css";

const initialBooks = [];
const initialReviews = [];

function formatDate(dateString) {
  return new Date(`${dateString}T00:00:00`).toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  );
}

function RatingStars({ rating, interactive = false, onRate }) {
  return (
    <div
      className={`book-review-stars ${
        interactive ? "book-review-stars-interactive" : ""
      }`}
      aria-label={`${rating} out of 5 stars`}
    >
      {[1, 2, 3, 4, 5].map((star) =>
        interactive ? (
          <button
            key={star}
            type="button"
            className={
              star <= rating
                ? "book-review-star-active"
                : "book-review-star-inactive"
            }
            onClick={() => onRate(star)}
            aria-label={`Rate ${star} out of 5`}
          >
            <Star
              size={24}
              fill={star <= rating ? "currentColor" : "none"}
            />
          </button>
        ) : (
          <span
            key={star}
            className={
              star <= rating
                ? "book-review-star-active"
                : "book-review-star-inactive"
            }
          >
            <Star
              size={15}
              fill={star <= rating ? "currentColor" : "none"}
            />
          </span>
        )
      )}
    </div>
  );
}

export default function BookReviews() {
  const [books] = useState(() => {
    try {
      const saved = localStorage.getItem("libraspace_books");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return [];
  });
  const [reviews, setReviews] = useState(() => {
    try {
      const saved = localStorage.getItem("libraspace_reviews");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return [];
  });

  useEffect(() => {
    localStorage.setItem("libraspace_reviews", JSON.stringify(reviews));
  }, [reviews]);

  const [search, setSearch] = useState("");
  const [selectedBookId, setSelectedBookId] = useState("all");

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");

  const [editingReviewId, setEditingReviewId] = useState(null);
  const [message, setMessage] = useState("");

  const filteredBooks = useMemo(() => {
    const query = search.trim().toLowerCase();

    return books.filter((book) => {
      const matchesSearch =
        !query ||
        book.title.toLowerCase().includes(query) ||
        book.author.toLowerCase().includes(query) ||
        book.category.toLowerCase().includes(query);

      const matchesSelected =
        selectedBookId === "all" ||
        String(book.id) === selectedBookId;

      return matchesSearch && matchesSelected;
    });
  }, [books, search, selectedBookId]);

  const visibleReviews = useMemo(() => {
    const bookIds = filteredBooks.map((book) => book.id);

    return reviews.filter((review) => bookIds.includes(review.bookId));
  }, [reviews, filteredBooks]);

  const myReviews = reviews.filter((review) => review.mine).length;

  const overallAverage = reviews.length
    ? (
        reviews.reduce((sum, review) => sum + review.rating, 0) /
        reviews.length
      ).toFixed(1)
    : "0.0";

  function getBook(bookId) {
    return books.find((book) => book.id === bookId);
  }

  function resetForm() {
    setRating(0);
    setComment("");
    setEditingReviewId(null);
  }

  function handleSubmit(event) {
    event.preventDefault();

    if (selectedBookId === "all") {
      setMessage("Please select a specific book before submitting a review.");
      return;
    }

    if (rating < 1 || rating > 5) {
      setMessage("Please select a rating from 1 to 5 stars.");
      return;
    }

    if (!comment.trim()) {
      setMessage("Please write a review before submitting.");
      return;
    }

    if (comment.trim().length < 10) {
      setMessage("Your review must contain at least 10 characters.");
      return;
    }

    if (comment.trim().length > 1000) {
      setMessage("Your review cannot exceed 1000 characters.");
      return;
    }

    const bookId = Number(selectedBookId);

    if (editingReviewId !== null) {
      setReviews((previous) =>
        previous.map((review) =>
          review.id === editingReviewId
            ? {
                ...review,
                rating,
                comment: comment.trim(),
                date: new Date().toISOString().slice(0, 10),
              }
            : review
        )
      );

      setMessage("Your review has been updated.");
    } else {
      const existingReview = reviews.find(
        (review) => review.bookId === bookId && review.mine
      );

      if (existingReview) {
        setMessage(
          "You already reviewed this book. Edit your existing review instead."
        );
        return;
      }

      const currentUser = (() => {
        try {
          return JSON.parse(localStorage.getItem("user"));
        } catch {
          return null;
        }
      })();

      setReviews((previous) => [
        {
          id: Date.now(),
          bookId,
          studentName: currentUser?.name || "Library Student",
          rating,
          comment: comment.trim(),
          date: new Date().toISOString().slice(0, 10),
          mine: true,
        },
        ...previous,
      ]);

      setMessage("Your review has been added successfully.");
    }

    resetForm();
  }

  function startEditing(review) {
    setSelectedBookId(String(review.bookId));
    setRating(review.rating);
    setComment(review.comment);
    setEditingReviewId(review.id);
    setMessage("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function deleteReview(review) {
    if (!review.mine) return;

    const confirmed = window.confirm(
      "Are you sure you want to delete your review?"
    );

    if (!confirmed) return;

    setReviews((previous) =>
      previous.filter((item) => item.id !== review.id)
    );

    if (editingReviewId === review.id) {
      resetForm();
    }

    setMessage("Your review has been deleted.");
  }

  return (
    <div className="book-reviews-page">
      <section className="book-reviews-header">
        <div>
          <span className="book-reviews-eyebrow">
            <MessageSquareText size={17} />
            STUDENT LIBRARY
          </span>

          <h1>Book Reviews & Ratings</h1>

          <p>
            Share your reading experience, rate books, and help
            other students discover their next favourite book.
          </p>
        </div>
      </section>
      <section className="book-reviews-stats">
        <article className="book-review-stat">
          <div className="book-review-stat-icon review-purple">
            <BookOpen size={22} />
          </div>

          <div>
            <span>Books Listed</span>
            <h2>{books.length}</h2>
          </div>
        </article>

        <article className="book-review-stat">
          <div className="book-review-stat-icon review-yellow">
            <Star size={22} />
          </div>

          <div>
            <span>Average Submitted Rating</span>
            <h2>{overallAverage} / 5</h2>
          </div>
        </article>

        <article className="book-review-stat">
          <div className="book-review-stat-icon review-green">
            <MessageSquareText size={22} />
          </div>

          <div>
            <span>All Reviews</span>
            <h2>{reviews.length}</h2>
          </div>
        </article>

        <article className="book-review-stat">
          <div className="book-review-stat-icon review-blue">
            <UserRound size={22} />
          </div>

          <div>
            <span>My Reviews</span>
            <h2>{myReviews}</h2>
          </div>
        </article>
      </section>
      {message && (
        <div className="book-review-message" role="status">
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
      <section className="book-review-form-panel">
        <div className="book-review-panel-heading">
          <div>
            <h2>
              {editingReviewId !== null
                ? "Edit Your Review"
                : "Write a Review"}
            </h2>

            <p>
              Select a book, choose a star rating, and share your opinion.
            </p>
          </div>

          <Pencil size={21} />
        </div>

        <form onSubmit={handleSubmit}>
          <div className="book-review-form-fields">
            <div className="book-review-field">
              <label htmlFor="reviewBook">Select Book</label>

              <select
                id="reviewBook"
                value={selectedBookId}
                onChange={(event) => {
                  setSelectedBookId(event.target.value);
                  setMessage("");
                }}
                required
              >
                <option value="all">Choose a book</option>

                {books.map((book) => (
                  <option key={book.id} value={book.id}>
                    {book.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="book-review-field">
              <label>Your Rating</label>

              <RatingStars
                rating={rating}
                interactive
                onRate={setRating}
              />

              <span className="book-review-rating-hint">
                {rating === 0
                  ? "Select your rating"
                  : `${rating} out of 5 stars`}
              </span>
            </div>

            <div className="book-review-field book-review-field-full">
              <label htmlFor="reviewComment">Your Review</label>

              <textarea
                id="reviewComment"
                value={comment}
                onChange={(event) => {
                  setComment(event.target.value);
                  setMessage("");
                }}
                placeholder="What did you think about this book?"
                rows={4}
                maxLength={1000}
                required
              />

              <span className="book-review-character-count">
                {comment.length}/1000 characters
              </span>
            </div>
          </div>

          <div className="book-review-form-actions">
            {editingReviewId !== null && (
              <button
                type="button"
                className="book-review-cancel-button"
                onClick={() => {
                  resetForm();
                  setMessage("");
                }}
              >
                <X size={16} />
                Cancel Edit
              </button>
            )}

            <button
              type="submit"
              className="book-review-submit-button"
            >
              <Send size={16} />

              {editingReviewId !== null
                ? "Update Review"
                : "Submit Review"}
            </button>
          </div>
        </form>
      </section>
      <section className="book-review-browse">
        <div className="book-review-browse-heading">
          <div>
            <h2>Explore Book Reviews</h2>

            <p>Find books and read other students' reviews.</p>
          </div>
        </div>

        <div className="book-review-toolbar">
          <div className="book-review-search">
            <Search size={18} />

            <input
              type="search"
              placeholder="Search title, author, or category..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              aria-label="Search books"
            />
          </div>

          <select
            value={selectedBookId}
            onChange={(event) => setSelectedBookId(event.target.value)}
            aria-label="Filter reviews by book"
          >
            <option value="all">All Books</option>

            {books.map((book) => (
              <option key={book.id} value={book.id}>
                {book.title}
              </option>
            ))}
          </select>
        </div>

        <div className="book-review-layout">
          <div className="book-review-book-list">
            {filteredBooks.map((book) => {
              const bookReviews = reviews.filter(
                (review) => review.bookId === book.id
              );

              const average = bookReviews.length
                ? (
                    bookReviews.reduce(
                      (sum, review) => sum + review.rating,
                      0
                    ) / bookReviews.length
                  ).toFixed(1)
                : "—";

              return (
                <article
                  className={`book-review-book-card ${
                    selectedBookId === String(book.id)
                      ? "book-review-book-card-selected"
                      : ""
                  }`}
                  key={book.id}
                >
                  <div className="book-review-book-icon">
                    <BookOpen size={25} />
                  </div>

                  <div className="book-review-book-info">
                    <h3>{book.title}</h3>

                    <p>{book.author}</p>

                    <span>{book.category}</span>

                    <div className="book-review-book-rating">
                      <Star size={15} fill="currentColor" />

                      <strong>{average}</strong>

                      <span>
                        {bookReviews.length} review
                        {bookReviews.length !== 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="book-review-view-button"
                    onClick={() =>
                      setSelectedBookId(String(book.id))
                    }
                  >
                    View Reviews
                  </button>
                </article>
              );
            })}

            {filteredBooks.length === 0 && (
              <div className="book-review-empty">
                <BookOpen size={36} />

                <h3>No books found</h3>

                <p>Try another search term.</p>
              </div>
            )}
          </div>
          <aside className="book-review-review-panel">
            <h3>
              <MessageSquareText size={19} />
              Student Reviews
            </h3>

            <p className="book-review-review-count">
              {visibleReviews.length} review{visibleReviews.length !== 1 ? "s" : ""}
            </p>

            {visibleReviews.length > 0 ? (
              visibleReviews.map((review) => {
                const book = getBook(review.bookId);

                return (
                  <article
                    className="book-review-review-card"
                    key={review.id}
                  >
                    <div className="book-review-review-user">
                      <div className="book-review-user-avatar">
                        {review.studentName
                          .split(" ")
                          .map((part) => part[0])
                          .join("")
                          .slice(0, 2)
                          .toUpperCase()}
                      </div>

                      <div>
                        <strong>{review.studentName}</strong>

                        <span>{formatDate(review.date)}</span>
                      </div>
                    </div>

                    <div className="book-review-reviewed-title">
                      {book?.title}
                    </div>

                    <RatingStars rating={review.rating} />

                    <p className="book-review-comment">
                      {review.comment}
                    </p>

                    {review.mine && (
                      <div className="book-review-review-actions">
                        <button
                          type="button"
                          onClick={() => startEditing(review)}
                        >
                          <Pencil size={14} />
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() => deleteReview(review)}
                        >
                          <Trash2 size={14} />
                          Delete
                        </button>
                      </div>
                    )}
                  </article>
                );
              })
            ) : (
              <div className="book-review-empty">
                <MessageSquareText size={32} />

                <p>No reviews found for the selected books.</p>
              </div>
            )}
          </aside>
        </div>
      </section>
    </div>
  );
}