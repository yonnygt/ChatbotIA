-- ============================================
-- ButcherAI — Auth & Pricing Migration
-- ============================================

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  email         VARCHAR(255) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  name          VARCHAR(255) NOT NULL,
  role          VARCHAR(20) NOT NULL DEFAULT 'cliente',
  created_at    TIMESTAMP DEFAULT NOW()
);

-- Sessions table
CREATE TABLE IF NOT EXISTS sessions (
  id          SERIAL PRIMARY KEY,
  token       VARCHAR(255) NOT NULL UNIQUE,
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at  TIMESTAMP NOT NULL,
  created_at  TIMESTAMP DEFAULT NOW()
);

-- Exchange rates table
CREATE TABLE IF NOT EXISTS exchange_rates (
  id          SERIAL PRIMARY KEY,
  currency    VARCHAR(10) NOT NULL DEFAULT 'USD',
  rate_ves    NUMERIC(20,4) NOT NULL,
  source      VARCHAR(50) DEFAULT 'BCV',
  fetched_at  TIMESTAMP DEFAULT NOW()
);

-- Add price_ves column to products
ALTER TABLE products ADD COLUMN IF NOT EXISTS price_ves NUMERIC(20,4);

-- Seed admin user (password: admin123 — bcrypt hash)
INSERT INTO users (email, password_hash, name, role)
VALUES ('admin@butcherai.com', '$2a$10$rQZKOe4C0Y5xPGD9xU8QWeG6e5sNBdYpKq8vA5sWz8ZjLmJFhBqLW', 'Administrador', 'admin')
ON CONFLICT (email) DO NOTHING;
