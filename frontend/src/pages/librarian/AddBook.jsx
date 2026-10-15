import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BookOpen,
  ArrowLeft,
  Save,
  RotateCcw,
  CheckCircle,
} from "lucide-react";

import { booksApi } from "../../api/api";
import "../../styles/add-book.css";

const initialForm = {
  title: "",
  author: "",
  isbn: "",
  category: "",
  publisher: "",
  publicationYear: "",
  totalCopies: "1",
  shelfLocation: "",
  description: "",
};

export default function AddBook() {
  const navigate = useNavigate();

  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState("");

  const categories = [
    "Computer Science",
    "Artificial Intelligence",
    "Data Science",
    "Programming",
    "Database Management",
    "Networking",
    "Mathematics",
    "Science",
    "Literature",
    "History",
    "Other",
  ];

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    setErrors((previous) => ({
      ...previous,
      [name]: "",
    }));

    setSuccessMessage("");
  };

  const validateForm = () => {
    const newErrors = {};

    if (!form.title.trim()) {
      newErrors.title = "Please enter the book title.";
    }

    if (!form.author.trim()) {
      newErrors.author = "Please enter the author name.";
    }

    if (!form.isbn.trim()) {
      newErrors.isbn = "Please enter the ISBN number.";
    }

    if (!form.category) {
      newErrors.category = "Please select a category.";
    }

    if (
      !form.totalCopies ||
      !Number.isInteger(Number(form.totalCopies)) ||
      Number(form.totalCopies) < 1
    ) {
      newErrors.totalCopies = "Enter at least one copy.";
    }

    if (
      form.publicationYear &&
      (
        !Number.isInteger(Number(form.publicationYear)) ||
        Number(form.publicationYear) < 1000 ||
        Number(form.publicationYear) > new Date().getFullYear()
      )
    ) {
      newErrors.publicationYear = "Enter a valid publication year.";
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      await booksApi.create({
        title: form.title.trim(),
        author: form.author.trim(),
        isbn: form.isbn.trim(),
        category: form.category,
        publisher: form.publisher?.trim() || "Independent",
        publicationYear: form.publicationYear ? Number(form.publicationYear) : new Date().getFullYear(),
        totalCopies: Number(form.totalCopies),
        availableCopies: Number(form.totalCopies),
        shelfLocation: form.shelfLocation?.trim() || "Main Shelf",
        description: form.description?.trim() || "",
      });

      setSuccessMessage("Book successfully saved to library database!");
      setForm(initialForm);
      setErrors({});
    } catch (apiError) {
      console.warn("Backend API note, falling back to local storage:", apiError);
      const savedBooks = JSON.parse(
        localStorage.getItem("libraspace_books") || "[]"
      );

      const duplicateISBN = savedBooks.some(
        (book) =>
          String(book.isbn || "").trim().toLowerCase() ===
          form.isbn.trim().toLowerCase()
      );

      if (duplicateISBN) {
        setErrors({
          isbn: "A book with this ISBN already exists.",
        });
        return;
      }

      const newBook = {
        id: Date.now(),
        title: form.title.trim(),
        author: form.author.trim(),
        isbn: form.isbn.trim(),
        category: form.category,
        publisher: form.publisher.trim(),
        publicationYear: form.publicationYear,
        totalCopies: Number(form.totalCopies),
        availableCopies: Number(form.totalCopies),
        shelfLocation: form.shelfLocation.trim(),
        description: form.description.trim(),
        createdAt: new Date().toISOString(),
      };

      localStorage.setItem(
        "libraspace_books",
        JSON.stringify([...savedBooks, newBook])
      );

      setSuccessMessage("Book details saved successfully!");
      setForm(initialForm);
      setErrors({});
    }
  };

  const handleReset = () => {
    setForm(initialForm);
    setErrors({});
    setSuccessMessage("");
  };

  return (
    <div className="add-book-page">
      <div className="add-book-header">
        <div className="add-book-heading">
          <button
            type="button"
            className="add-book-back-button"
            onClick={() => navigate("/librarian/books")}
          >
            <ArrowLeft size={18} />
            Back to Manage Books
          </button>

          <div className="add-book-title-row">
            <div className="add-book-title-icon">
              <BookOpen size={28} />
            </div>

            <div>
              <h1>Add New Book</h1>
              <p>Add a new book to your library catalog.</p>
            </div>
          </div>
        </div>

        <div className="add-book-header-badge">
          <BookOpen size={17} />
          Library Catalog
        </div>
      </div>

      {successMessage && (
        <div className="add-book-success" role="status">
          <CheckCircle size={20} />
          <span>{successMessage}</span>
        </div>
      )}

      <form className="add-book-form" onSubmit={handleSubmit} noValidate>
        <div className="add-book-section-heading">
          <h2>Book Information</h2>
          <p>Fields marked with * are required.</p>
        </div>

        <div className="add-book-form-grid">
          <div className="add-book-field">
            <label htmlFor="title">Book Title *</label>
            <input
              id="title"
              name="title"
              value={form.title}
              onChange={handleChange}
              placeholder="Enter book title"
              aria-invalid={Boolean(errors.title)}
            />
            {errors.title && (
              <span className="add-book-error">{errors.title}</span>
            )}
          </div>

          <div className="add-book-field">
            <label htmlFor="author">Author Name *</label>
            <input
              id="author"
              name="author"
              value={form.author}
              onChange={handleChange}
              placeholder="Enter author name"
              aria-invalid={Boolean(errors.author)}
            />
            {errors.author && (
              <span className="add-book-error">{errors.author}</span>
            )}
          </div>

          <div className="add-book-field">
            <label htmlFor="isbn">ISBN Number *</label>
            <input
              id="isbn"
              name="isbn"
              value={form.isbn}
              onChange={handleChange}
              placeholder="Enter ISBN number"
              aria-invalid={Boolean(errors.isbn)}
            />
            {errors.isbn && (
              <span className="add-book-error">{errors.isbn}</span>
            )}
          </div>

          <div className="add-book-field">
            <label htmlFor="category">Category *</label>
            <select
              id="category"
              name="category"
              value={form.category}
              onChange={handleChange}
              aria-invalid={Boolean(errors.category)}
            >
              <option value="">Select category</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
            {errors.category && (
              <span className="add-book-error">{errors.category}</span>
            )}
          </div>

          <div className="add-book-field">
            <label htmlFor="publisher">Publisher</label>
            <input
              id="publisher"
              name="publisher"
              value={form.publisher}
              onChange={handleChange}
              placeholder="Enter publisher name"
            />
          </div>

          <div className="add-book-field">
            <label htmlFor="publicationYear">Publication Year</label>
            <input
              id="publicationYear"
              name="publicationYear"
              type="number"
              min="1000"
              max={new Date().getFullYear()}
              value={form.publicationYear}
              onChange={handleChange}
              placeholder="e.g. 2024"
              aria-invalid={Boolean(errors.publicationYear)}
            />
            {errors.publicationYear && (
              <span className="add-book-error">
                {errors.publicationYear}
              </span>
            )}
          </div>

          <div className="add-book-field">
            <label htmlFor="totalCopies">Total Copies *</label>
            <input
              id="totalCopies"
              name="totalCopies"
              type="number"
              min="1"
              step="1"
              value={form.totalCopies}
              onChange={handleChange}
              aria-invalid={Boolean(errors.totalCopies)}
            />
            {errors.totalCopies && (
              <span className="add-book-error">{errors.totalCopies}</span>
            )}
          </div>

          <div className="add-book-field">
            <label htmlFor="shelfLocation">Shelf Location</label>
            <input
              id="shelfLocation"
              name="shelfLocation"
              value={form.shelfLocation}
              onChange={handleChange}
              placeholder="e.g. Block A, Shelf 03"
            />
          </div>

          <div className="add-book-field add-book-field-full">
            <label htmlFor="description">Book Description</label>
            <textarea
              id="description"
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Enter a short description of the book"
              rows="5"
            />
          </div>
        </div>

        <div className="add-book-form-footer">
          <button
            type="button"
            className="add-book-reset-button"
            onClick={handleReset}
          >
            <RotateCcw size={17} />
            Reset
          </button>

          <div className="add-book-footer-actions">
            <button
              type="button"
              className="add-book-cancel-button"
              onClick={() => navigate("/librarian/books")}
            >
              Cancel
            </button>

            <button type="submit" className="add-book-submit-button">
              <Save size={18} />
              Save Book
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}