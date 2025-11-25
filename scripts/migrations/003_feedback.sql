-- Four Sigma Database Schema
-- Migration: 003_feedback
-- Description: Add feedback table for user feedback submissions

-- =====================
-- FEEDBACK TABLE
-- =====================

CREATE TABLE feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  feedback_text text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  user_agent text,
  page_url text
);

-- Indexes for querying
CREATE INDEX idx_feedback_user_id ON feedback(user_id);
CREATE INDEX idx_feedback_created_at ON feedback(created_at DESC);

-- =====================
-- COMMENTS
-- =====================

COMMENT ON TABLE feedback IS 'User-submitted feedback, supports both anonymous and authenticated submissions';
COMMENT ON COLUMN feedback.user_id IS 'Foreign key to users, null if submitted anonymously';
COMMENT ON COLUMN feedback.feedback_text IS 'The feedback content submitted by the user';
COMMENT ON COLUMN feedback.user_agent IS 'Browser user agent string for debugging context';
COMMENT ON COLUMN feedback.page_url IS 'URL where the feedback was submitted from';
