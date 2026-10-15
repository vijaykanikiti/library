USE library_db;

-- Seed Categories
INSERT INTO categories (name, description) VALUES
  ('Technology', 'Programming, AI and computing'),
  ('Science', 'Discover the world around you'),
  ('Education', 'Learn something new every day'),
  ('Literature', 'Stories, novels and poetry'),
  ('Personal Growth', 'Build better habits and skills'),
  ('Health & Wellness', 'Explore healthy living')
ON DUPLICATE KEY UPDATE description = VALUES(description);
