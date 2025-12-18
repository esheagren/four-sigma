-- Migration: Add session tracking for progressive account claim
-- This enables the two-step onboarding:
-- 1. Username claim (first visit)
-- 2. Account claim with email + password (every 3 sessions)

-- Add session tracking columns
ALTER TABLE users ADD COLUMN session_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN username_claimed_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN account_claimed_at TIMESTAMPTZ;

-- Add index for performance on session count queries
CREATE INDEX idx_users_session_count ON users(session_count);

-- Add comments for clarity
COMMENT ON COLUMN users.session_count IS 'Number of completed game sessions - used to trigger claim account prompts every 3 sessions';
COMMENT ON COLUMN users.username_claimed_at IS 'Timestamp when user first claimed their username (username-only account)';
COMMENT ON COLUMN users.account_claimed_at IS 'Timestamp when user claimed full account with email + password';

-- Logic for showing "Claim Account" modal:
-- Show when: session_count % 3 == 0 AND session_count > 0 AND account_claimed_at IS NULL
