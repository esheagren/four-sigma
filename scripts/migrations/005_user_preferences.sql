-- Migration: Add theme_preference column to users table
-- This allows users to persist their selected visual theme

ALTER TABLE users ADD COLUMN IF NOT EXISTS theme_preference TEXT DEFAULT 'default';

COMMENT ON COLUMN users.theme_preference IS 'User selected theme ID (e.g., default, dark, midnight)';
