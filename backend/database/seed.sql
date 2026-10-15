-- ==========================================================
-- LibraSpace Library Management System - Seed Data Script
-- Populates initial categories, settings, users, and books
-- ==========================================================

USE library_db;

-- 1. Seed Categories
INSERT INTO categories (name, description) VALUES
  ('Technology', 'Programming, AI and computing'),
  ('Science', 'Discover the world around you'),
  ('Education', 'Learn something new every day'),
  ('Literature', 'Stories, novels and poetry'),
  ('Personal Growth', 'Build better habits and skills'),
  ('Health & Wellness', 'Explore healthy living')
ON DUPLICATE KEY UPDATE description = VALUES(description);

-- 2. Seed System Configuration Policies
INSERT INTO library_settings (setting_key, setting_value, description) VALUES
  ('borrowing_period_days', '14', 'Default loan duration in days'),
  ('loan_limit_count', '3', 'Max active borrowed books per student'),
  ('fine_rate_per_day', '5.00', 'Fine charged per overdue day (currency units)'),
  ('grace_period_days', '1', 'Grace period before fines start accumulating'),
  ('max_fine_per_loan', '200.00', 'Maximum fine cap per single loan'),
  ('pickup_expiry_hours', '48', 'Hours reserved book is held when available'),
  ('max_renewals', '2', 'Maximum times a loan can be renewed')
ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value), description = VALUES(description);

-- 3. Seed Default System Users
-- Default password for all seed accounts is: krish4318
-- BCrypt hash: $2a$10$79oTkZx2nT9DMam8s.i0gO73wRccWXJaGHRB.fjckrQFnyFZbjvwe
INSERT INTO users (name, email, password, role, active) VALUES
  ('System Administrator', 'admin@library.com', '$2a$10$79oTkZx2nT9DMam8s.i0gO73wRccWXJaGHRB.fjckrQFnyFZbjvwe', 'ADMIN', 1),
  ('Gopal Krishna (Admin)', 'gopalkrishnagopal6363@gmail.com', '$2a$10$79oTkZx2nT9DMam8s.i0gO73wRccWXJaGHRB.fjckrQFnyFZbjvwe', 'ADMIN', 1),
  ('Gopal Krishna (Student)', 'ckrishna2354@gmail.com', '$2a$10$79oTkZx2nT9DMam8s.i0gO73wRccWXJaGHRB.fjckrQFnyFZbjvwe', 'STUDENT', 1)
ON DUPLICATE KEY UPDATE password = VALUES(password), role = VALUES(role), active = VALUES(active);

-- 4. Seed Core Catalog Books
INSERT INTO books (title, author, isbn, category, publisher, publication_year, description, shelf_location, total_copies, available_copies) VALUES
  ('Clean Code', 'Robert C. Martin', '978-0132350884', 'Technology', 'Prentice Hall', 2008, 'A Handbook of Agile Software Craftsmanship', 'Shelf A-1', 5, 4),
  ('Atomic Habits', 'James Clear', '978-0735211292', 'Personal Growth', 'Avery', 2018, 'An Easy & Proven Way to Build Good Habits & Break Bad Ones', 'Shelf B-2', 6, 6),
  ('The Alchemist', 'Paulo Coelho', '978-0062315007', 'Literature', 'HarperOne', 1988, 'A magical fable about following your dream', 'Shelf C-3', 4, 2),
  ('A Brief History of Time', 'Stephen Hawking', '978-0553380163', 'Science', 'Bantam Books', 1988, 'From the Big Bang to Black Holes', 'Shelf D-4', 3, 3),
  ('Introduction to Algorithms', 'Thomas H. Cormen', '978-0262033848', 'Technology', 'MIT Press', 2009, 'Comprehensive reference for modern computer algorithms', 'Shelf A-2', 4, 3),
  ('Deep Work', 'Cal Newport', '978-1455586691', 'Personal Growth', 'Grand Central Publishing', 2016, 'Rules for Focused Success in a Distracted World', 'Shelf B-1', 5, 5)
ON DUPLICATE KEY UPDATE total_copies = VALUES(total_copies), available_copies = VALUES(available_copies);
