-- Four Sigma Database Schema
-- Migration: 010_remove_distribution_tier
-- Description: Remove unused distribution_tier field from questions table
--
-- The distribution_tier field ('professional', 'contextual', 'mind_blowing')
-- was used for categorization but is not actively used in the application.
-- All questions are treated equally regardless of tier.

-- =====================
-- BACKUP (Optional - for safety)
-- =====================

-- Uncomment if you want to preserve the tier data
-- CREATE TABLE IF NOT EXISTS questions_tier_backup AS
-- SELECT id, question_text, distribution_tier FROM questions;

-- =====================
-- REMOVE FIELD
-- =====================

-- Remove the distribution_tier column
ALTER TABLE questions DROP COLUMN IF EXISTS distribution_tier;

-- =====================
-- VERIFY
-- =====================

-- Optional: Verify the column is gone
-- SELECT column_name
-- FROM information_schema.columns
-- WHERE table_name = 'questions'
-- AND column_name = 'distribution_tier';
-- Should return 0 rows

-- =====================
-- COMMENTS
-- =====================

COMMENT ON TABLE questions IS 'Question bank with prompts, answers, and metadata (updated - removed distribution_tier)';
