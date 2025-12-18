-- Four Sigma Database Schema
-- Migration: 008_remove_unused_tables_ROLLBACK
-- Description: Rollback migration to restore the 5 removed tables
--
-- WARNING: This will recreate the table structures but NOT restore any data
-- If you created backups, you'll need to restore from those separately

-- =====================
-- RECREATE TABLES
-- =====================

-- Achievements system
CREATE TABLE IF NOT EXISTS achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon_name TEXT,
  achievement_category TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  achievement_id UUID NOT NULL,
  earned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB,

  UNIQUE(user_id, achievement_id)
);

-- Leaderboard snapshots
CREATE TABLE IF NOT EXISTS leaderboard_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  period_type TEXT NOT NULL,
  period_start DATE NOT NULL,
  user_id UUID NOT NULL,
  rank INTEGER NOT NULL,
  score NUMERIC NOT NULL,
  games_played INTEGER NOT NULL,
  calibration_rate NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(period_type, period_start, user_id)
);

-- Question moderation
CREATE TABLE IF NOT EXISTS question_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL,
  user_id UUID NOT NULL,
  flagged_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  flag_reason TEXT NOT NULL DEFAULT 'incorrect',

  is_resolved BOOLEAN NOT NULL DEFAULT FALSE,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID,
  resolution_notes TEXT,

  UNIQUE(question_id, user_id)
);

CREATE TABLE IF NOT EXISTS question_edits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL,
  submitted_by_user_id UUID NOT NULL,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  field_name TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT,

  requires_review BOOLEAN NOT NULL DEFAULT TRUE,
  edit_status TEXT NOT NULL DEFAULT 'pending',

  reviewed_by_user_id UUID,
  reviewed_at TIMESTAMPTZ,
  rejection_reason TEXT,

  creator_notified_at TIMESTAMPTZ,
  creator_viewed_at TIMESTAMPTZ
);

-- =====================
-- RECREATE FOREIGN KEYS
-- =====================

-- User achievements
ALTER TABLE user_achievements ADD CONSTRAINT fk_user_achievements_user
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE user_achievements ADD CONSTRAINT fk_user_achievements_achievement
  FOREIGN KEY (achievement_id) REFERENCES achievements(id) ON DELETE CASCADE;

-- Leaderboard snapshots
ALTER TABLE leaderboard_snapshots ADD CONSTRAINT fk_leaderboard_snapshots_user
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Question flags
ALTER TABLE question_flags ADD CONSTRAINT fk_question_flags_question
  FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE;
ALTER TABLE question_flags ADD CONSTRAINT fk_question_flags_user
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE question_flags ADD CONSTRAINT fk_question_flags_resolver
  FOREIGN KEY (resolved_by) REFERENCES users(id) ON DELETE SET NULL;

-- Question edits
ALTER TABLE question_edits ADD CONSTRAINT fk_question_edits_question
  FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE;
ALTER TABLE question_edits ADD CONSTRAINT fk_question_edits_submitter
  FOREIGN KEY (submitted_by_user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE question_edits ADD CONSTRAINT fk_question_edits_reviewer
  FOREIGN KEY (reviewed_by_user_id) REFERENCES users(id) ON DELETE SET NULL;

-- =====================
-- RECREATE INDEXES
-- =====================

CREATE INDEX IF NOT EXISTS idx_leaderboard_snapshots_lookup
  ON leaderboard_snapshots(period_type, period_start, rank);

-- =====================
-- RESTORE MERGE FUNCTION (with achievements)
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

-- =====================
-- RESTORE FROM BACKUPS (if available)
-- =====================

-- Uncomment and modify these if you created backups
-- INSERT INTO achievements SELECT * FROM achievements_backup;
-- INSERT INTO user_achievements SELECT * FROM user_achievements_backup;
-- INSERT INTO leaderboard_snapshots SELECT * FROM leaderboard_snapshots_backup;
-- INSERT INTO question_flags SELECT * FROM question_flags_backup;
-- INSERT INTO question_edits SELECT * FROM question_edits_backup;
