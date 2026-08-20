-- Postgres (Neon) schema — equivalent of database/abdul_wahab_portfolio.sql (MySQL).
-- Run once against your Neon database; server.js also creates these tables lazily.

CREATE TABLE IF NOT EXISTS messages (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL,
  subject VARCHAR(150),
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS messages_created_at_idx ON messages (created_at DESC);

CREATE TABLE IF NOT EXISTS projects (
  id SERIAL PRIMARY KEY,
  title VARCHAR(150) NOT NULL,
  description TEXT,
  technologies VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed projects (safe to re-run).
INSERT INTO projects (title, description, technologies)
SELECT 'Personal Portfolio',
       'Responsive portfolio with modern UI, animations, gallery and contact form.',
       'HTML, CSS, JavaScript, Express, Postgres'
WHERE NOT EXISTS (SELECT 1 FROM projects WHERE title = 'Personal Portfolio');

INSERT INTO projects (title, description, technologies)
SELECT 'Full Stack Web Application',
       'Full-stack application concept with front-end, back-end and database connectivity.',
       'JavaScript, Express, Postgres'
WHERE NOT EXISTS (SELECT 1 FROM projects WHERE title = 'Full Stack Web Application');

INSERT INTO projects (title, description, technologies)
SELECT 'Computer Support Solution',
       'Practical computer software and hardware support concept.',
       'Software, Hardware'
WHERE NOT EXISTS (SELECT 1 FROM projects WHERE title = 'Computer Support Solution');

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'admin',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed user (safe to re-run). Password: Wahab123
INSERT INTO users (email, password_hash, role)
VALUES ('abdulwahabkhan1137@gmail.com',
        '$2a$10$z/18w9ZYNGWCbhvE9BZAi.7ClPI4FiWWmVRr/ep6TylSjpitAlOyi',
        'admin')
ON CONFLICT (email) DO NOTHING;
