# Database Schema & Setup Guide

This directory contains the database definition for the **Library Management System** running on MySQL 8.0+.

## Database Overview

- **Database Name**: `library_db`
- **Character Set**: `utf8mb4`
- **Collation**: `utf8mb4_unicode_ci`

## Setup & Initialization

### 1. Create the Database
Ensure your MySQL server is running and log in to the MySQL command line client:
```bash
mysql -u root -p
```

Execute the database creation and schema script:
```sql
CREATE DATABASE IF NOT EXISTS library_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 2. Apply Schema
Run the schema script directly from your terminal:
```bash
mysql -u root -p library_db < database/schema.sql
```

Alternatively, in your MySQL client:
```sql
USE library_db;
SOURCE database/schema.sql;
```

## Schema Entities & Relationships

| Table Name | Description | Key Constraints & Indexes |
|------------|-------------|----------------------------|
| `users` | Library users (ADMIN, LIBRARIAN, STUDENT) | Unique index on `email`, role and status indexes |
| `categories` | Book genre & topic taxonomy | Unique index on `name` |
| `books` | Catalog of library book titles and copy counts | Unique index on `isbn`, FK to `categories(id)` |
| `loans` | Book borrow and circulation transactions | FKs to `books`, `users` (borrower), `users` (issuer) |
| `reservations` | Hold queue for currently unavailable books | Queue ordering index `(book_id, status, queue_order)` |
| `fines` | Overdue fee records linked to loans | Unique 1:1 FK to `loans`, status index |
| `reviews` | User ratings and reviews for books | Composite unique key `(book_id, user_id)` |
| `notifications` | In-app user notifications | Composite index `(user_id, is_read, created_at)` |
| `library_settings` | System-wide configuration policies | Unique index on `setting_key` |
| `audit_logs` | Immutable audit trail of critical actions | Indexed on `user_id`, `created_at` |
| `otp_challenges` | Hashed 2FA verification tokens | Indexed on `email`, `created_at` |
| `password_reset_tokens` | Secure password recovery tokens | Unique `token_hash`, indexed on `email`, `expiry_time` |

## Data Integrity Guarantees

- **No Negative Stock**: Book loan and return operations are wrapped in transactions enforcing `available_copies >= 0`.
- **Unique ISBNs & Emails**: Natural keys are protected by unique constraints.
- **Cascading & Restrict Foreign Keys**: Critical records (books on active loans) use `ON DELETE RESTRICT` to protect audit trails.
- **Hashed Security Tokens**: OTP codes and password reset tokens are stored as one-way BCrypt hashes.
