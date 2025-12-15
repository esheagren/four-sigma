-- Four Sigma Database Schema
-- Migration: 007_username_auth
-- Description: Rename display_name to username for username-only signup flow

-- =====================
-- RENAME COLUMN
-- =====================

-- Rename display_name to username
ALTER TABLE users RENAME COLUMN display_name TO username;

-- =====================
-- ADD UNIQUE CONSTRAINT
-- =====================

-- Add case-insensitive unique index on username
-- Exclude 'Guest Player' (default for anonymous users) from uniqueness check
CREATE UNIQUE INDEX idx_users_username_lower
  ON users(LOWER(username))
  WHERE username IS NOT NULL
    AND username != 'Guest Player';

-- =====================
-- ADD EMAIL VERIFICATION
-- =====================

-- Track whether email has been verified (for future magic link flow)
ALTER TABLE users ADD COLUMN email_verified BOOLEAN NOT NULL DEFAULT FALSE;

-- =====================
-- COMMENTS
-- =====================

COMMENT ON COLUMN users.username IS 'Unique username for account identification (case-insensitive). Guest Player is the default for anonymous users.';
COMMENT ON COLUMN users.email_verified IS 'True if email has been verified. Required for account recovery.';
