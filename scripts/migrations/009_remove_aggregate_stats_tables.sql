-- Four Sigma Database Schema
-- Migration: 009_remove_aggregate_stats_tables
-- Description: Remove unused aggregate statistics tables
--
-- Tables being removed:
--   - user_period_stats (never populated, only in merge function)
--   - user_category_stats (queried but never displayed)
--
-- These tables were designed for pre-computed aggregates but are unused.
-- All statistics are computed in real-time from user_responses instead.

-- =====================
-- BACKUP TABLES (Optional - for safety)
-- =====================

-- Uncomment these if you want to keep backups before dropping
-- CREATE TABLE IF NOT EXISTS user_period_stats_backup AS SELECT * FROM user_period_stats;
-- CREATE TABLE IF NOT EXISTS user_category_stats_backup AS SELECT * FROM user_category_stats;

-- =====================
-- UPDATE MERGE FUNCTION
-- =====================

-- Update merge_anonymous_user to remove category_stats and period_stats transfer logic
-- Now only transfers user_responses and recalculates aggregates from source of truth
CREATE OR REPLACE FUNCTION merge_anonymous_user(
  p_anonymous_user_id UUID,
  p_authenticated_user_id UUID
) RETURNS void AS $$
BEGIN
  -- Transfer user responses (the source of truth for all statistics)
  UPDATE user_responses
  SET user_id = p_authenticated_user_id
  WHERE user_id = p_anonymous_user_id;

  -- Recalculate authenticated user's aggregate stats from responses
  -- This is the single source of truth approach
  WITH stats AS (
    SELECT
      COUNT(*) as games_played,
      COALESCE(SUM(score), 0) as total_score,
      COALESCE(AVG(score), 0) as average_score,
      COUNT(*) FILTER (WHERE captured = true) as questions_captured,
      MAX(score) as best_score
    FROM user_responses
    WHERE user_id = p_authenticated_user_id
  )
  UPDATE users
  SET
    games_played = stats.games_played,
    total_score = stats.total_score,
    average_score = stats.average_score,
    questions_captured = stats.questions_captured,
    calibration_rate = stats.questions_captured::NUMERIC / NULLIF(stats.games_played, 0),
    best_single_score = GREATEST(users.best_single_score, stats.best_score)
  FROM stats
  WHERE id = p_authenticated_user_id;

  -- Mark anonymous user as merged (keep for audit, release device_id)
  UPDATE users
  SET
    merged_from_user_id = p_authenticated_user_id,
    device_id = NULL,
    is_anonymous = TRUE
  WHERE id = p_anonymous_user_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION merge_anonymous_user IS 'Transfers user_responses from anonymous to authenticated user, recalculates stats from source of truth (updated - removed aggregate table transfers)';

-- =====================
-- DROP TABLES
-- =====================

-- Drop the unused aggregate statistics tables
DROP TABLE IF EXISTS user_category_stats;
DROP TABLE IF EXISTS user_period_stats;

-- =====================
-- VERIFY CLEANUP
-- =====================

-- Optional: Verify the tables are gone
-- SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;

-- =====================
-- COMMENTS
-- =====================

COMMENT ON SCHEMA public IS 'Migration 009: Removed 2 unused aggregate tables - user_period_stats, user_category_stats. All stats now computed from user_responses.';
