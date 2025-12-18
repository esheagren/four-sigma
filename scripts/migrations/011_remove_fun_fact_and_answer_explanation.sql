-- Four Sigma Database Schema
-- Migration: 011_remove_fun_fact_and_answer_explanation
-- Description: Remove unused fun_fact and answer_explanation fields from questions table
--
-- These fields are not displayed in the application UI and add unnecessary
-- complexity to the schema. Question context is provided through source
-- attribution instead.

-- =====================
-- BACKUP (Optional - for safety)
-- =====================

-- Uncomment if you want to preserve this data
-- CREATE TABLE IF NOT EXISTS questions_explanations_backup AS
-- SELECT id, question_text, fun_fact, answer_explanation FROM questions;

-- =====================
-- REMOVE FIELDS
-- =====================

-- Remove the fun_fact column
ALTER TABLE questions DROP COLUMN IF EXISTS fun_fact;

-- Remove the answer_explanation column
ALTER TABLE questions DROP COLUMN IF EXISTS answer_explanation;

-- =====================
-- VERIFY
-- =====================

-- Optional: Verify the columns are gone
-- SELECT column_name
-- FROM information_schema.columns
-- WHERE table_name = 'questions'
-- AND column_name IN ('fun_fact', 'answer_explanation');
-- Should return 0 rows

-- =====================
-- COMMENTS
-- =====================

COMMENT ON TABLE questions IS 'Question bank with prompts, answers, and metadata (updated - removed fun_fact and answer_explanation)';
