-- Four Sigma Database Schema
-- Migration: 001_initial_schema
-- Description: Creates all tables, indexes, and foreign keys for Four Sigma application

-- =====================
-- ENABLE UUID EXTENSION
-- =====================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================
-- USER SYSTEM
-- =====================

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_played_at TIMESTAMPTZ,
  timezone TEXT NOT NULL DEFAULT 'UTC',

  -- Denormalized performance aggregates
  total_score NUMERIC NOT NULL DEFAULT 0,
  average_score NUMERIC NOT NULL DEFAULT 0,
  weekly_score NUMERIC NOT NULL DEFAULT 0,
  weekly_score_week_start DATE,
  games_played INTEGER NOT NULL DEFAULT 0,

  -- Calibration tracking
  questions_captured INTEGER NOT NULL DEFAULT 0,
  calibration_rate NUMERIC NOT NULL DEFAULT 0,

  -- Streak tracking
  current_streak INTEGER NOT NULL DEFAULT 0,
  best_streak INTEGER NOT NULL DEFAULT 0,

  -- Personal records
  best_single_score NUMERIC NOT NULL DEFAULT 0,
  best_single_score_response_id UUID
);

CREATE TABLE user_category_stats (
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

CREATE TABLE user_period_stats (
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

CREATE INDEX idx_user_period_stats_lookup ON user_period_stats(period_type, period_start, rank);

-- =====================
-- ACHIEVEMENT SYSTEM
-- =====================

CREATE TABLE achievements (
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

CREATE TABLE user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  achievement_id UUID NOT NULL,
  earned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB,

  UNIQUE(user_id, achievement_id)
);

-- =====================
-- CATEGORY HIERARCHY
-- =====================

CREATE TABLE domains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  icon_name TEXT,
  color TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain_id UUID NOT NULL,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE subcategories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE
);

-- =====================
-- UNITS SYSTEM
-- =====================

CREATE TABLE units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  symbol TEXT,
  description TEXT,
  display_format TEXT,
  decimal_places INTEGER NOT NULL DEFAULT 0,
  prefix_symbol BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE
);

-- =====================
-- QUESTIONS SYSTEM
-- =====================

CREATE TABLE questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id UUID,

  -- Core content
  question_text TEXT NOT NULL,
  answer_value NUMERIC NOT NULL,
  fun_fact TEXT,
  answer_explanation TEXT,

  -- Source verification
  source_url TEXT,
  source_name TEXT,
  source_retrieved_at DATE,

  -- Classification
  question_type TEXT NOT NULL DEFAULT 'mesofact',
  distribution_tier TEXT NOT NULL DEFAULT 'professional',

  -- Creation origin
  creation_source TEXT NOT NULL DEFAULT 'automated',
  created_by_user_id UUID,

  -- Status
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  answer_updated_at TIMESTAMPTZ
);

-- Junction table: questions can have multiple subcategories
CREATE TABLE question_subcategories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL,
  subcategory_id UUID NOT NULL,
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(question_id, subcategory_id)
);

-- Edit history for questions (user-submitted corrections)
CREATE TABLE question_edits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL,
  submitted_by_user_id UUID NOT NULL,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- What was changed
  field_name TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT,

  -- Review workflow
  requires_review BOOLEAN NOT NULL DEFAULT TRUE,
  edit_status TEXT NOT NULL DEFAULT 'pending',

  -- Review details (null if auto-accepted)
  reviewed_by_user_id UUID,
  reviewed_at TIMESTAMPTZ,
  rejection_reason TEXT,

  -- Notification tracking (for user-created questions)
  creator_notified_at TIMESTAMPTZ,
  creator_viewed_at TIMESTAMPTZ
);

-- Flags for incorrect questions (separate from edits)
CREATE TABLE question_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL,
  user_id UUID NOT NULL,
  flagged_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  flag_reason TEXT NOT NULL DEFAULT 'incorrect',

  -- Resolution
  is_resolved BOOLEAN NOT NULL DEFAULT FALSE,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID,
  resolution_notes TEXT,

  UNIQUE(question_id, user_id)
);

-- =====================
-- DAILY QUESTIONS
-- =====================

CREATE TABLE daily_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL,
  date DATE NOT NULL,
  display_order INTEGER NOT NULL,
  theme TEXT,
  is_published BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(date, display_order),
  UNIQUE(date, question_id)
);

-- =====================
-- USER RESPONSES
-- =====================

CREATE TABLE user_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  question_id UUID NOT NULL,
  daily_question_id UUID,

  -- User's answer - the raw data for all statistics
  lower_bound NUMERIC NOT NULL,
  upper_bound NUMERIC NOT NULL,

  -- Computed results
  score NUMERIC NOT NULL,
  captured BOOLEAN NOT NULL,

  -- Context for analytics
  answer_value_at_response NUMERIC NOT NULL,
  scoring_algorithm_version TEXT NOT NULL DEFAULT 'v1',
  time_to_answer_ms INTEGER,
  device_type TEXT,

  answered_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_user_responses_user_question ON user_responses(user_id, question_id);
CREATE INDEX idx_user_responses_question_time ON user_responses(question_id, answered_at);
CREATE INDEX idx_user_responses_user_time ON user_responses(user_id, answered_at);
CREATE UNIQUE INDEX idx_user_responses_daily ON user_responses(user_id, daily_question_id) WHERE daily_question_id IS NOT NULL;

-- =====================
-- LEADERBOARDS
-- =====================

CREATE TABLE leaderboard_snapshots (
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

CREATE INDEX idx_leaderboard_snapshots_lookup ON leaderboard_snapshots(period_type, period_start, rank);

-- =====================
-- FOREIGN KEY CONSTRAINTS
-- =====================

-- Users
ALTER TABLE users ADD CONSTRAINT fk_users_best_response
  FOREIGN KEY (best_single_score_response_id) REFERENCES user_responses(id);

-- User category stats
ALTER TABLE user_category_stats ADD CONSTRAINT fk_user_category_stats_user
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE user_category_stats ADD CONSTRAINT fk_user_category_stats_subcategory
  FOREIGN KEY (subcategory_id) REFERENCES subcategories(id) ON DELETE CASCADE;

-- User period stats
ALTER TABLE user_period_stats ADD CONSTRAINT fk_user_period_stats_user
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- User achievements
ALTER TABLE user_achievements ADD CONSTRAINT fk_user_achievements_user
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE user_achievements ADD CONSTRAINT fk_user_achievements_achievement
  FOREIGN KEY (achievement_id) REFERENCES achievements(id) ON DELETE CASCADE;

-- Categories
ALTER TABLE categories ADD CONSTRAINT fk_categories_domain
  FOREIGN KEY (domain_id) REFERENCES domains(id) ON DELETE CASCADE;

-- Subcategories
ALTER TABLE subcategories ADD CONSTRAINT fk_subcategories_category
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE;

-- Questions
ALTER TABLE questions ADD CONSTRAINT fk_questions_unit
  FOREIGN KEY (unit_id) REFERENCES units(id) ON DELETE SET NULL;
ALTER TABLE questions ADD CONSTRAINT fk_questions_creator
  FOREIGN KEY (created_by_user_id) REFERENCES users(id) ON DELETE SET NULL;

-- Question subcategories
ALTER TABLE question_subcategories ADD CONSTRAINT fk_question_subcategories_question
  FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE;
ALTER TABLE question_subcategories ADD CONSTRAINT fk_question_subcategories_subcategory
  FOREIGN KEY (subcategory_id) REFERENCES subcategories(id) ON DELETE CASCADE;

-- Question edits
ALTER TABLE question_edits ADD CONSTRAINT fk_question_edits_question
  FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE;
ALTER TABLE question_edits ADD CONSTRAINT fk_question_edits_submitter
  FOREIGN KEY (submitted_by_user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE question_edits ADD CONSTRAINT fk_question_edits_reviewer
  FOREIGN KEY (reviewed_by_user_id) REFERENCES users(id) ON DELETE SET NULL;

-- Question flags
ALTER TABLE question_flags ADD CONSTRAINT fk_question_flags_question
  FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE;
ALTER TABLE question_flags ADD CONSTRAINT fk_question_flags_user
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE question_flags ADD CONSTRAINT fk_question_flags_resolver
  FOREIGN KEY (resolved_by) REFERENCES users(id) ON DELETE SET NULL;

-- Daily questions
ALTER TABLE daily_questions ADD CONSTRAINT fk_daily_questions_question
  FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE;

-- User responses
ALTER TABLE user_responses ADD CONSTRAINT fk_user_responses_user
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE user_responses ADD CONSTRAINT fk_user_responses_question
  FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE;
ALTER TABLE user_responses ADD CONSTRAINT fk_user_responses_daily_question
  FOREIGN KEY (daily_question_id) REFERENCES daily_questions(id) ON DELETE SET NULL;

-- Leaderboard snapshots
ALTER TABLE leaderboard_snapshots ADD CONSTRAINT fk_leaderboard_snapshots_user
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- =====================
-- COMMENTS
-- =====================

COMMENT ON TABLE users IS 'Core user accounts with denormalized performance aggregates';
COMMENT ON TABLE questions IS 'Question content with source verification and classification';
COMMENT ON TABLE user_responses IS 'Raw response data - source of truth for all analytics';
COMMENT ON TABLE question_subcategories IS 'Many-to-many junction: questions can belong to multiple subcategories';
COMMENT ON COLUMN questions.answer_explanation IS 'Detailed explanation including data sources, assumptions, and calculations';
