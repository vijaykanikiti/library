# API Endpoints Specification

This document details the RESTful and WebSocket API endpoints for the Library Management System.

All protected API endpoints require an `Authorization: Bearer <JWT_TOKEN>` header.

---

## 1. Authentication Endpoints (`/api/auth`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | Public | Register student account with name, email, password, and phone |
| `POST` | `/api/auth/login` | Public | Validate email & password; triggers 6-digit OTP email challenge |
| `POST` | `/api/auth/verify-otp` | Public | Verify OTP challenge; returns JWT token and user profile on success |
| `POST` | `/api/auth/resend-otp` | Public | Request a fresh OTP (enforces 60-second cooldown) |
| `POST` | `/api/auth/forgot-password` | Public | Request password reset token to registered email |
| `POST` | `/api/auth/reset-password` | Public | Reset password using verified token |
| `GET` | `/api/auth/me` | Authenticated | Fetch current authenticated user profile |
| `POST` | `/api/auth/logout` | Authenticated | Invalidate client session and audit logout |

---

## 2. Book Catalog Endpoints (`/api/books`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/books` | Public | Search and page book catalog with category, search query filters |
| `GET` | `/api/books/{id}` | Public | Get detailed book record by ID with category and reviews |
| `POST` | `/api/books` | Admin, Librarian | Add a new book title to catalog |
| `PUT` | `/api/books/{id}` | Admin, Librarian | Update book information, copy count, or location |
| `DELETE` | `/api/books/{id}` | Admin, Librarian | Remove a book title (blocked if active loans exist) |
| `GET` | `/api/books/categories` | Public | Retrieve list of all book categories |

---

## 3. Circulation & Loan Endpoints (`/api/loans`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/loans` | Admin, Librarian | List and search all circulation loans with status filtering |
| `GET` | `/api/loans/my` | Authenticated | List all active and past loans for current student |
| `POST` | `/api/loans/issue` | Admin, Librarian | Issue book copy to member; decrements stock |
| `POST` | `/api/loans/{id}/return` | Admin, Librarian | Check in book; calculates overdue fines and restores stock |
| `POST` | `/api/loans/{id}/renew` | Authenticated | Renew loan due date if within permitted renewal limit |

---

## 4. Reservation Queue Endpoints (`/api/reservations`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/reservations` | Admin, Librarian | List active hold queues across books |
| `GET` | `/api/reservations/my` | Authenticated | List current student's queue positions and ready pickups |
| `POST` | `/api/reservations` | Authenticated | Place hold on book with zero available copies |
| `DELETE` | `/api/reservations/{id}` | Authenticated | Cancel an existing reservation |

---

## 5. Fine Management Endpoints (`/api/fines`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/fines` | Admin, Librarian | List and search all library fines |
| `GET` | `/api/fines/my` | Authenticated | List current student's outstanding and paid fines |
| `POST` | `/api/fines/{id}/record-payment` | Admin, Librarian | Record cash/online payment with reference code |

---

## 6. Review Endpoints (`/api/reviews`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/reviews/book/{bookId}` | Public | List reviews and star ratings for a book |
| `POST` | `/api/reviews` | Authenticated | Submit rating (1-5) and comment for a book |

---

## 7. Notification Endpoints (`/api/notifications`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/notifications` | Authenticated | Fetch notifications for current user |
| `PUT` | `/api/notifications/{id}/read` | Authenticated | Mark individual notification as read |
| `PUT` | `/api/notifications/read-all` | Authenticated | Mark all notifications as read |

---

## 8. Reports & Administration (`/api/reports`, `/api/admin`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/reports/dashboard` | Admin, Librarian | Aggregated metrics: book copies, active loans, overdue fines |
| `GET` | `/api/admin/users` | Admin | List and search all registered users |
| `PUT` | `/api/admin/users/{id}/role` | Admin | Update user role (`ADMIN`, `LIBRARIAN`, `STUDENT`) |
| `PUT` | `/api/admin/users/{id}/status` | Admin | Activate or suspend user account |
| `GET` | `/api/admin/settings` | Admin | Get system policies (loan duration, fine rates, limits) |
| `PUT` | `/api/admin/settings` | Admin | Update system configuration values |

---

## 9. Real-Time WebSocket / STOMP (`/ws`)

- **Handshake Endpoint**: `/ws` (SockJS fallback enabled)
- **Destination Topic**: `/user/queue/notifications`
- **Authentication**: JWT token passed during STOMP CONNECT header or URL query parameter.
