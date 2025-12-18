-- Four Sigma Database Schema
-- Migration: 009_remove_aggregate_stats_tables_ROLLBACK
-- Description: Rollback migration to restore user_period_stats and user_category_stats
--
-- WARNING: This will recreate the table structures but NOT restore any data
-- If you created backups, you'll need to restore from those separately

-- =====================
-- RECREATE TABLES
-- =====================

-- User category statistics
CREATE TABLE IF NOT EXISTS user_category_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  subcategory_id UUID NOT NULL,
  questions_answered INTEGER NOT NULL DEFAULT 0,
  questions_captured INTEGER NOT NULL DEFAULT 0,
  total_score NUMERIC NOT NULL DEFAULT 0,
  average_score NUMERIC NOT NULL DEFAULT 0,
  calibration_rate NUMERIC NOT NULL DEFAULT 0,
  last_answered_at TIMESTAMPTZ,

  UNIQUE(user_id, subcategory_id)
);

-- User period statistics
CREATE TABLE IF NOT EXISTS user_period_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  period_type TEXT NOT NULL,
  period_start DATE NOT NULL,
  score NUMERIC NOT NULL,
  games_played INTEGER NOT NULL,
  questions_captured INTEGER NOT NULL DEFAULT 0,
  calibration_rate NUMERIC NOT NULL DEFAULT 0,
  rank INTEGER,
  percentile NUMERIC,
  total_participants INTEGER,

  UNIQUE(user_id, period_type, period_start)
);

-- =====================
-- RECREATE FOREIGN KEYS
-- =====================

-- User category stats
ALTER TABLE user_category_stats ADD CONSTRAINT fk_user_category_stats_user
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE user_category_stats ADD CONSTRAINT fk_user_category_stats_subcategory
  FOREIGN KEY (subcategory_id) REFERENCES subcategories(id) ON DELETE CASCADE;

-- User period stats
ALTER TABLE user_period_stats ADD CONSTRAINT fk_user_period_stats_user
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- =====================
-- RECREATE INDEXES
-- =====================

CREATE INDEX IF NOT EXISTS idx_user_period_stats_lookup
  ON user_period_stats(period_type, period_start, rank);

-- =====================
-- RESTORE MERGE FUNCTION (with category_stats and period_stats)
-- =====================

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

COMMENT ON FUNCTION merge_anonymous_user IS 'Transfers all data from anonymous user to authenticated user, recalculates stats';

-- =====================
-- RESTORE FROM BACKUPS (if available)
-- =====================

-- Uncomment and modify these if you created backups
-- INSERT INTO user_period_stats SELECT * FROM user_period_stats_backup;
-- INSERT INTO user_category_stats SELECT * FROM user_category_stats_backup;
