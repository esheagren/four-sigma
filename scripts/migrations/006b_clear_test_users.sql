-- Four Sigma Database
-- Script: Clear Test Users
-- Description: Remove all test users and related data before migration
-- WARNING: This will delete ALL user data!

-- =====================
-- CLEAR USER DATA
-- =====================

-- Feedback (has SET NULL on delete, but let's clear it anyway)
DELETE FROM feedback;

-- User responses (cascades from users, but explicit is clearer)
DELETE FROM user_responses;

-- User category stats
DELETE FROM user_category_stats;

-- User period stats
DELETE FROM user_period_stats;

-- User achievements
DELETE FROM user_achievements;

-- Leaderboard snapshots
DELETE FROM leaderboard_snapshots;

-- Game sessions (if exists)
DELETE FROM game_sessions WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'game_sessions');

-- Question flags (user submitted)
DELETE FROM question_flags;

-- Question submissions
DELETE FROM question_submissions;

-- Finally, delete all users
DELETE FROM users;

-- =====================
-- VERIFY CLEANUP
-- =====================
-- Run these to confirm deletion:
-- SELECT COUNT(*) FROM users;
-- SELECT COUNT(*) FROM user_responses;

-- =====================
-- NOTES
-- =====================
-- This does NOT delete Supabase Auth users.
-- To clear those, go to Supabase Dashboard > Authentication > Users
-- and delete them manually, or use the Auth Admin API.
--
-- After running this, run 007_username_auth.sql to apply the migration.

