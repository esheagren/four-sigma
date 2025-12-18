-- Migration 012: Add usage_type column to questions table
-- Purpose: Categorize questions by their intended use (daily, challenge, special)
-- Date: 2025-12-18

-- Add usage_type column with default value
ALTER TABLE questions
ADD COLUMN usage_type TEXT NOT NULL DEFAULT 'daily';

-- Add constraint to validate allowed values
ALTER TABLE questions
ADD CONSTRAINT check_usage_type
CHECK (usage_type IN ('daily', 'challenge', 'special'));

-- Update existing questions to 'daily'
-- (Should be automatic with DEFAULT, but explicit for safety)
UPDATE questions
SET usage_type = 'daily'
WHERE usage_type IS NULL OR usage_type = '';

-- Add helpful comment
COMMENT ON COLUMN questions.usage_type IS
'Indicates how the question is used: daily (daily game), challenge (special challenges), special (events/featured)';
