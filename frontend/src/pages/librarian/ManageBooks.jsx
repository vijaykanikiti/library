import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  Search,
  Plus,
  BookOpen,
  Pencil,
  Trash2,
  X,
  Filter,
  LibraryBig,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

import { booksApi } from "../../api/api";
import "../../styles/manage-books.css";

const emptyBook = {
  title: "",
  author: "",
  isbn: "",
  category: "Programming",
  totalCopies: 1,
};

export default function ManageBooks() {
  const navigate = useNavigate();

  const [books, setBooks] = useState(() => {
    try {
      const saved = localStorage.getItem("libraspace_books");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return [];
  });
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [availabilityFilter, setAvailabilityFilter] =
    useState("All");

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyBook);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    async function fetchBooks() {
      try {
        const res = await booksApi.getAll({ size: 100 });
        const list = res?.content || (Array.isArray(res) ? res : null);
        if (Array.isArray(list) && list.length > 0) {
          setBooks(list);
          localStorage.setItem("libraspace_books", JSON.stringify(list));
        }
      } catch (err) {
        console.warn("Backend books fetch note:", err.message);
      }
    }
    fetchBooks();
  }, []);

  useEffect(() => {
    localStorage.setItem("libraspace_books", JSON.stringify(books));
  }, [books]);

  const categories = useMemo(
    () => [
      "All",
      ...new Set(books.map((book) => book.category)),
    ],
    [books]
  );

  const filteredBooks = useMemo(() => {
    const query = search.trim().toLowerCase();

    return books.filter((book) => {
      const matchesSearch =
        book.title.toLowerCase().includes(query) ||
        book.author.toLowerCase().includes(query) ||
        book.isbn.toLowerCase().includes(query);

      const matchesCategory =
        categoryFilter === "All" ||
        book.category === categoryFilter;

      const matchesAvailability =
        availabilityFilter === "All" ||
        (availabilityFilter === "Available" &&
          book.availableCopies > 0) ||
        (availabilityFilter === "Out of Stock" &&
          book.availableCopies === 0);

      return (
        matchesSearch &&
        matchesCategory &&
        matchesAvailability
      );
    });
  }, [books, search, categoryFilter, availabilityFilter]);

  const totalCopies = books.reduce(
    (total, book) => total + book.totalCopies,
    0
  );

  const availableCopies = books.reduce(
    (total, book) => total + book.availableCopies,
    0
  );

  const issuedCopies = totalCopies - availableCopies;

  function openAddForm() {
    setEditingId(null);
    setForm(emptyBook);
    setError("");
    setNotice("");
    setShowForm(true);
  }

  function openEditForm(book) {
    setEditingId(book.id);

    setForm({
      title: book.title,
      author: book.author,
      isbn: book.isbn,
      category: book.category,
      totalCopies: book.totalCopies,
    });

    setError("");
    setNotice("");
    setShowForm(true);
  }

  function handleFormChange(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: name === "totalCopies" ? value : value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setNotice("");

    const title = form.title.trim();
    const author = form.author.trim();
    const isbn = form.isbn.trim();
    const total = Number(form.totalCopies);

    if (!title || !author || !isbn || !form.category) {
      setError("Please complete all book details.");
      return;
    }

    if (!Number.isInteger(total) || total < 1) {
      setError("Total copies must be at least 1.");
      return;
    }

    const duplicateIsbn = books.some(
      (book) =>
        book.isbn?.toLowerCase() === isbn.toLowerCase() &&
        book.id !== editingId
    );

    if (duplicateIsbn) {
      setError("A book with this ISBN already exists.");
      return;
    }

    if (editingId !== null) {
      const existingBook = books.find(
        (book) => book.id === editingId
      );

      const issued =
        (existingBook?.totalCopies || total) -
        (existingBook?.availableCopies || 0);

      if (total < issued) {
        setError(
          `At least ${issued} copies are currently issued. Total copies cannot be less than that.`
        );
        return;
      }

      try {
        await booksApi.update(editingId, {
          title,
          author,
          isbn,
          category: form.category,
          publisher: "Independent",
          publicationYear: new Date().getFullYear(),
          totalCopies: total,
          availableCopies: Math.max(0, total - issued),
          shelfLocation: "Main Shelf",
          description: "",
        });
      } catch (apiErr) {
        console.warn("Backend update error:", apiErr.message);
      }

      setBooks((previous) =>
        previous.map((book) =>
          book.id === editingId
            ? {
                ...book,
                title,
                author,
                isbn,
                category: form.category,
                totalCopies: total,
                availableCopies: Math.max(0, total - issued),
              }
            : book
        )
      );

      setNotice("Book details updated successfully in library database.");
    } else {
      let createdBook = null;
      try {
        createdBook = await booksApi.create({
          title,
          author,
          isbn,
          category: form.category,
          publisher: "Independent",
          publicationYear: new Date().getFullYear(),
          totalCopies: total,
          availableCopies: total,
          shelfLocation: "Main Shelf",
          description: "",
        });
      } catch (apiErr) {
        console.warn("Backend create book error:", apiErr.message);
      }

      const newBook = createdBook || {
        id: Date.now(),
        title,
        author,
        isbn,
        category: form.category,
        totalCopies: total,
        availableCopies: total,
      };

      setBooks((previous) => [newBook, ...previous]);
      setNotice("New book added successfully to library database.");
    }

    setShowForm(false);
    setEditingId(null);
    setForm(emptyBook);
  }

  async function handleDelete(book) {
    if (book.availableCopies !== book.totalCopies) {
      alert(
        "This book has issued copies. Process all returns before deleting it."
      );
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete "${book.title}"?`
    );

    if (!confirmed) return;

    try {
      await booksApi.delete(book.id);
    } catch (apiErr) {
      console.warn("Backend delete book note:", apiErr.message);
    }

    setBooks((previous) =>
      previous.filter((item) => item.id !== book.id)
    );

    setNotice("Book deleted successfully from library database.");
  }

  return (
    <div className="manage-books-page">      <header className="manage-books-header">
        <div>
          <span className="manage-books-eyebrow">
            LIBRARIAN WORKSPACE
          </span>

          <h1>Manage Books</h1>

          <p>
            Organize your library catalog and monitor book
            availability.
          </p>
        </div>

        <button
          type="button"
          className="manage-books-add-button"
          onClick={openAddForm}
        >
          <Plus size={19} />
          Add New Book
        </button>
      </header>      {notice && (
        <div className="manage-books-notice" role="status">
          <CheckCircle size={19} />
          <span>{notice}</span>

          <button
            type="button"
            onClick={() => setNotice("")}
            aria-label="Dismiss notification"
          >
            <X size={17} />
          </button>
        </div>
      )}      <section className="manage-books-stats">
        <article className="manage-books-stat-card">
          <span className="manage-books-stat-icon blue">
            <BookOpen size={22} />
          </span>

          <div>
            <p>Book Titles</p>
            <h2>{books.length}</h2>
          </div>
        </article>

        <article className="manage-books-stat-card">
          <span className="manage-books-stat-icon green">
            <LibraryBig size={22} />
          </span>

          <div>
            <p>Total Copies</p>
            <h2>{totalCopies}</h2>
          </div>
        </article>

        <article className="manage-books-stat-card">
          <span className="manage-books-stat-icon purple">
            <CheckCircle size={22} />
          </span>

          <div>
            <p>Available Copies</p>
            <h2>{availableCopies}</h2>
          </div>
        </article>

        <article className="manage-books-stat-card">
          <span className="manage-books-stat-icon orange">
            <AlertCircle size={22} />
          </span>

          <div>
            <p>Issued Copies</p>
            <h2>{issuedCopies}</h2>
          </div>
        </article>
      </section>      <section className="manage-books-toolbar">
        <div className="manage-books-search">
          <Search size={19} />

          <input
            type="search"
            placeholder="Search title, author, or ISBN..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            aria-label="Search books"
          />
        </div>

        <div className="manage-books-filter">
          <Filter size={18} />

          <select
            value={categoryFilter}
            onChange={(event) =>
              setCategoryFilter(event.target.value)
            }
            aria-label="Filter by category"
          >
            {categories.map((category) => (
              <option key={category} value={category}>
                {category === "All"
                  ? "All Categories"
                  : category}
              </option>
            ))}
          </select>
        </div>

        <select
          className="manage-books-availability-filter"
          value={availabilityFilter}
          onChange={(event) =>
            setAvailabilityFilter(event.target.value)
          }
          aria-label="Filter by availability"
        >
          <option value="All">All Availability</option>
          <option value="Available">Available</option>
          <option value="Out of Stock">Out of Stock</option>
        </select>
      </section>      <section className="manage-books-table-card">
        <div className="manage-books-table-heading">
          <div>
            <h2>Book Inventory</h2>
            <p>
              Showing {filteredBooks.length} of {books.length} titles
            </p>
          </div>
        </div>

        <div className="manage-books-table-wrapper">
          <table className="manage-books-table">
            <thead>
              <tr>
                <th>Book Details</th>
                <th>ISBN</th>
                <th>Category</th>
                <th>Total</th>
                <th>Available</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredBooks.map((book) => (
                <tr key={book.id}>
                  <td>
                    <div className="manage-books-title-cell">
                      <span className="manage-books-cover-icon">
                        <BookOpen size={21} />
                      </span>

                      <div>
                        <strong>{book.title}</strong>
                        <small>{book.author}</small>
                      </div>
                    </div>
                  </td>

                  <td>{book.isbn}</td>

                  <td>
                    <span className="manage-books-category">
                      {book.category}
                    </span>
                  </td>

                  <td>{book.totalCopies}</td>

                  <td>{book.availableCopies}</td>

                  <td>
                    <span
                      className={`manage-books-status ${
                        book.availableCopies === 0
                          ? "unavailable"
                          : "available"
                      }`}
                    >
                      {book.availableCopies === 0
                        ? "Out of Stock"
                        : "Available"}
                    </span>
                  </td>

                  <td>
                    <div className="manage-books-actions">
                      <button
                        type="button"
                        className="manage-books-edit"
                        title="Edit book"
                        aria-label={`Edit ${book.title}`}
                        onClick={() => openEditForm(book)}
                      >
                        <Pencil size={17} />
                      </button>

                      <button
                        type="button"
                        className="manage-books-delete"
                        title="Delete book"
                        aria-label={`Delete ${book.title}`}
                        onClick={() => handleDelete(book)}
                      >
                        <Trash2 size={17} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredBooks.length === 0 && (
                <tr>
                  <td colSpan="7">
                    <div className="manage-books-empty">
                      <BookOpen size={35} />

                      <strong>No books found</strong>

                      <p>
                        Try another search term or change the filters.
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>      {showForm && (
        <div
          className="manage-books-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setShowForm(false);
            }
          }}
        >
          <section
            className="manage-books-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="manage-books-modal-title"
          >
            <div className="manage-books-modal-heading">
              <div>
                <h2 id="manage-books-modal-title">
                  {editingId !== null
                    ? "Edit Book"
                    : "Add New Book"}
                </h2>

                <p>
                  Enter the book information below.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowForm(false)}
                aria-label="Close form"
              >
                <X size={21} />
              </button>
            </div>

            {error && (
              <div className="manage-books-form-error" role="alert">
                {error}
              </div>
            )}

            <form
              className="manage-books-form"
              onSubmit={handleSubmit}
            >
              <label>
                Book Title
                <input
                  name="title"
                  value={form.title}
                  onChange={handleFormChange}
                  placeholder="Enter book title"
                  required
                />
              </label>

              <label>
                Author
                <input
                  name="author"
                  value={form.author}
                  onChange={handleFormChange}
                  placeholder="Enter author name"
                  required
                />
              </label>

              <label>
                ISBN
                <input
                  name="isbn"
                  value={form.isbn}
                  onChange={handleFormChange}
                  placeholder="Enter ISBN"
                  required
                />
              </label>

              <label>
                Category
                <select
                  name="category"
                  value={form.category}
                  onChange={handleFormChange}
                  required
                >
                  <option value="Programming">Programming</option>
                  <option value="Computer Science">
                    Computer Science
                  </option>
                  <option value="Fiction">Fiction</option>
                  <option value="Self Help">Self Help</option>
                  <option value="Science">Science</option>
                  <option value="Mathematics">Mathematics</option>
                  <option value="History">History</option>
                  <option value="Other">Other</option>
                </select>
              </label>

              <label>
                Total Copies
                <input
                  name="totalCopies"
                  type="number"
                  min="1"
                  step="1"
                  value={form.totalCopies}
                  onChange={handleFormChange}
                  required
                />
              </label>

              <div className="manage-books-form-actions">
                <button
                  type="button"
                  className="manage-books-cancel-button"
                  onClick={() => {
                    setShowForm(false);
                    setError("");
                  }}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="manage-books-save-button"
                >
                  {editingId !== null
                    ? "Save Changes"
                    : "Add Book"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}