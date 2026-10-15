# Library Management System (Frontend-Only)

A web-based frontend application for managing library operations, including book inventory, circulation, member history, and fines.

> **Note**: This application is entirely frontend-only. It runs on plain HTML, CSS, and vanilla JavaScript without any backend server or external frameworks. All data is managed using the browser's `localStorage` and pre-populated with sample records from `js/data.js`.

---

## 1. Folder Structure

```
library/
  index.html            # Login page
  register.html         # User registration
  admin.html            # Admin dashboard
  librarian.html        # Librarian dashboard
  student.html          # Student dashboard
  books.html            # Catalog, search, add/edit/delete
  book.html             # Book details, reviews, waitlist hold
  issue.html            # Issue and return books
  members.html          # Registered members list
  history.html          # Borrowing records history
  fines.html            # Due date tracking and fine calculation
  reports.html          # Issued, returned, and overdue reports
  css/
    style.css           # Shared styles and responsive layout
  js/
    data.js             # Initial sample books, users, and loans
    auth.js             # Session, role checking, and shared layout
    app.js              # Core calculations (fines, issue, return)
  README.md
```

---

## 2. Default System Accounts

| Role | Email | Password | Name |
|---|---|---|---|
| **Admin** | `admin@library.com` | `admin123` | Admin User |
| **Librarian** | `librarian@library.com` | `lib123` | Chief Librarian |
| **Student** | `gopal@library.com` | `student123` | Gopal Krishna |

---

## 3. Role Access Matrix

| Page | Admin | Librarian | Student |
|---|:---:|:---:|:---:|
| `admin.html` | Yes | - | - |
| `librarian.html` | Yes | Yes | - |
| `student.html` | Yes | Yes | Yes |
| `books.html` (View) | Yes | Yes | Yes |
| `books.html` (Add/Edit/Delete) | Yes | Yes | - |
| `book.html` (Reviews, Reserve) | Yes | Yes | Yes |
| `issue.html` (Issue & Return) | Yes | Yes | - |
| `members.html` | Yes | - | - |
| `history.html` | All | All | Own Only |
| `fines.html` | All | All | Own Only |
| `reports.html` | Yes | Yes | - |

---

## 4. Key Features

1. **Role-Based Authentication**: Automatic redirect upon login to the corresponding dashboard. Pages are blocked if the role is not allowed.
2. **Book Catalog**: Search by title, author, or ISBN. Filter by category and stock availability.
3. **Inventory Management**: Add, edit, and delete books for staff roles.
4. **Circulation**: Issue books for up to 14 days, return books, and renew active loans.
5. **Due Date & Fines**: Automatic calculation of overdue fines (`days late * rate per day`). Configurable fine policy rate.
6. **Waitlist Holds**: FIFO reservations when book copies are out of stock.
7. **Reviews & Ratings**: 1-5 star member ratings and comments per book.
8. **Responsive UI**: Collapsible sidebar menu for mobile and tablet devices, horizontally scrollable tables.

---

## 5. How to Run

1. Open `library/index.html` directly in any modern browser (Google Chrome, Safari, Edge, Firefox).
2. No installation, build step, or server is required.
