-- Four Sigma Database Schema
-- Migration: 008_remove_unused_tables
-- Description: Remove unused feature tables and update merge function
--
-- Tables being removed:
--   - achievements (feature not implemented)
--   - user_achievements (feature not implemented)
--   - leaderboard_snapshots (redundant with user_period_stats)
--   - question_flags (feature not implemented)
--   - question_edits (feature not implemented)

-- =====================
-- BACKUP TABLES (Optional - for safety)
-- =====================

-- Uncomment these if you want to keep backups before dropping
-- CREATE TABLE IF NOT EXISTS achievements_backup AS SELECT * FROM achievements;
-- CREATE TABLE IF NOT EXISTS user_achievements_backup AS SELECT * FROM user_achievements;
-- CREATE TABLE IF NOT EXISTS leaderboard_snapshots_backup AS SELECT * FROM leaderboard_snapshots;
-- CREATE TABLE IF NOT EXISTS question_flags_backup AS SELECT * FROM question_flags;
-- CREATE TABLE IF NOT EXISTS question_edits_backup AS SELECT * FROM question_edits;

-- =====================
-- UPDATE MERGE FUNCTION
-- =====================

-- Update merge_anonymous_user to remove user_achievements transfer logic
CREATE OR REPLACE FUNCTION merge_anonymous_user(
  p_anonymous_user_id UUID,
  p_authenticated_user_id UUID
) RETURNS void AS $$
BEGIN
  -- Transfer user responses
  UPDATE user_responses
  SET user_id = p_authenticated_user_id
  WHERE user_id = p_anonymous_user_id;

  -- Transfer category stats (merge if both exist)
  INSERT INTO user_category_stats (
    user_id, subcategory_id, questions_answered, questions_captured,
    total_score, average_score, calibration_rate, last_answered_at
  )
  SELECT
    p_authenticated_user_id, subcategory_id, questions_answered, questions_captured,
    total_score, average_score, calibration_rate, last_answered_at
  FROM user_category_stats
  WHERE user_id = p_anonymous_user_id
  ON CONFLICT (user_id, subcategory_id) DO UPDATE SET
    questions_answered = user_category_stats.questions_answered + EXCLUDED.questions_answered,
    questions_captured = user_category_stats.questions_captured + EXCLUDED.questions_captured,
    total_score = user_category_stats.total_score + EXCLUDED.total_score,
    average_score = (user_category_stats.total_score + EXCLUDED.total_score) /
                    NULLIF(user_category_stats.questions_answered + EXCLUDED.questions_answered, 0),
    calibration_rate = (user_category_stats.questions_captured + EXCLUDED.questions_captured)::NUMERIC /
                       NULLIF(user_category_stats.questions_answered + EXCLUDED.questions_answered, 0),
    last_answered_at = GREATEST(user_category_stats.last_answered_at, EXCLUDED.last_answered_at);

  DELETE FROM user_category_stats WHERE user_id = p_anonymous_user_id;

  -- Transfer period stats (similar merge logic)
  INSERT INTO user_period_stats (
    user_id, period_type, period_start, score, games_played,
    questions_captured, calibration_rate
  )
  SELECT
    p_authenticated_user_id, period_type, period_start, score, games_played,
    questions_captured, calibration_rate
  FROM user_period_stats
  WHERE user_id = p_anonymous_user_id
  ON CONFLICT (user_id, period_type, period_start) DO UPDATE SET
    score = user_period_stats.score + EXCLUDED.score,
    games_played = user_period_stats.games_played + EXCLUDED.games_played,
    questions_captured = user_period_stats.questions_captured + EXCLUDED.questions_captured,
    calibration_rate = (user_period_stats.questions_captured + EXCLUDED.questions_captured)::NUMERIC /
                       NULLIF(user_period_stats.games_played + EXCLUDED.games_played, 0);

  DELETE FROM user_period_stats WHERE user_id = p_anonymous_user_id;

  -- Recalculate authenticated user's aggregate stats from responses
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

COMMENT ON FUNCTION merge_anonymous_user IS 'Transfers all data from anonymous user to authenticated user, recalculates stats (updated - achievements removed)';

-- =====================
-- DROP TABLES
-- =====================

-- Drop dependent tables first (those with foreign keys to parent tables)
DROP TABLE IF EXISTS user_achievements;
DROP TABLE IF EXISTS leaderboard_snapshots;
DROP TABLE IF EXISTS question_flags;
DROP TABLE IF EXISTS question_edits;

-- Drop parent tables
DROP TABLE IF EXISTS achievements;

-- =====================
-- VERIFY CLEANUP
-- =====================

-- Optional: Verify the tables are gone
-- SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;

-- =====================
-- COMMENTS
-- =====================

COMMENT ON SCHEMA public IS 'Migration 008: Removed 5 unused tables - achievements, user_achievements, leaderboard_snapshots, question_flags, question_edits';
