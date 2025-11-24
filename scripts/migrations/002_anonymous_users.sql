-- Four Sigma Database Schema
-- Migration: 002_anonymous_users
-- Description: Add device-based anonymous user support with optional authentication

-- =====================
-- MODIFY USERS TABLE
-- =====================

-- Allow anonymous users without email
ALTER TABLE users ALTER COLUMN email DROP NOT NULL;

-- Add columns for device/auth tracking
ALTER TABLE users ADD COLUMN device_id TEXT;
ALTER TABLE users ADD COLUMN auth_id UUID;
ALTER TABLE users ADD COLUMN is_anonymous BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE users ADD COLUMN merged_from_user_id UUID;

-- Uniqueness constraints (partial indexes for non-null values)
CREATE UNIQUE INDEX idx_users_device_id ON users(device_id) WHERE device_id IS NOT NULL;
CREATE UNIQUE INDEX idx_users_auth_id ON users(auth_id) WHERE auth_id IS NOT NULL;

-- Add foreign key for merge tracking
ALTER TABLE users ADD CONSTRAINT fk_users_merged_from
  FOREIGN KEY (merged_from_user_id) REFERENCES users(id) ON DELETE SET NULL;

-- =====================
-- COMMENTS
-- =====================

COMMENT ON COLUMN users.device_id IS 'UUID stored in localStorage for anonymous device tracking';
COMMENT ON COLUMN users.auth_id IS 'Links to Supabase Auth user.id for authenticated users';
COMMENT ON COLUMN users.is_anonymous IS 'True for device-only users, false for authenticated users';
COMMENT ON COLUMN users.merged_from_user_id IS 'Original anonymous user_id before merge, for audit trail';

-- =====================
-- MERGE FUNCTION
-- =====================

-- Function to merge an anonymous user's data into an authenticated user
CREATE OR REPLACE FUNCTION merge_anonymous_user(
  p_anonymous_user_id UUID,
  p_authenticated_user_id UUID
) RETURNS void AS $$
BEGIN
  -- Transfer user responses
  UPDATE user_responses
  SET user_id = p_authenticated_user_id
  WHERE user_id = p_anonymous_user_id;

  -- Transfer achievements (ignore duplicates)
  INSERT INTO user_achievements (user_id, achievement_id, earned_at, metadata)
  SELECT p_authenticated_user_id, achievement_id, earned_at, metadata
  FROM user_achievements
  WHERE user_id = p_anonymous_user_id
  ON CONFLICT (user_id, achievement_id) DO NOTHING;

  DELETE FROM user_achievements WHERE user_id = p_anonymous_user_id;

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
