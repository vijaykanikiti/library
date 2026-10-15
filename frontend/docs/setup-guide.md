# Library Management System - Setup Guide

A complete guide for configuring, building, and running the Library Management System locally or in production.

---

## 1. Prerequisites

Ensure the following tools are installed on your machine:
- **Java**: OpenJDK 17 or higher (`java -version`)
- **Maven**: Version 3.8 or higher (`mvn -version`)
- **Node.js**: Version 18 LTS or higher (`node -v`)
- **npm**: Version 9 or higher (`npm -v`)
- **MySQL**: Version 8.0 or higher (`mysql --version`)

---

## 2. Database Setup

1. Start your local MySQL service:
   ```bash
   # On macOS via Homebrew:
   brew services start mysql
   ```

2. Log into MySQL client and create the database:
   ```sql
   CREATE DATABASE IF NOT EXISTS library_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```

3. Import the initial schema and default configuration:
   ```bash
   mysql -u root -p library_db < database/schema.sql
   ```

---

## 3. Backend Setup (Spring Boot)

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Configure environment variables:
   Copy `.env.example` to `.env` or set environment variables:
   ```bash
   export DB_HOST=localhost
   export DB_PORT=3306
   export DB_NAME=library_db
   export DB_USERNAME=root
   export DB_PASSWORD=your_mysql_password
   export JWT_SECRET=your_secure_256_bit_secret_key_here_minimum_32_characters
   export SPRING_MAIL_HOST=smtp.gmail.com
   export SPRING_MAIL_PORT=587
   export SPRING_MAIL_USERNAME=your-email@gmail.com
   export SPRING_MAIL_PASSWORD=your-app-password
   export APP_MAIL_DEV_MODE=true
   ```

3. Build and test the backend:
   ```bash
   mvn clean compile
   mvn test
   ```

4. Run the application:
   ```bash
   mvn spring-boot:run
   ```
   The backend server will start on port `8080`.

---

## 4. Frontend Setup (React + Vite)

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Configure frontend environment variables:
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
   Ensure `VITE_API_BASE_URL` points to your backend:
   ```env
   VITE_API_BASE_URL=http://localhost:8080/api
   VITE_WS_URL=http://localhost:8080/ws
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```
   Open your browser at `http://localhost:5173`.

5. Build for production:
   ```bash
   npm run build
   ```

---

## 5. Security & Verification Checklist

- [ ] All database queries run through Spring Data JPA repositories with parameterized queries.
- [ ] Passwords stored using BCrypt one-way hashing.
- [ ] OTP codes hashed with BCrypt and enforced with expiration and attempt caps.
- [ ] Role-based access control enforces Admin, Librarian, and Student privileges.
- [ ] Public registration restricted to Student role.
- [ ] No hardcoded administrator credentials or production secrets.
