-- Cleanup Script: Delete all test users and associated data
-- WARNING: This will permanently delete ALL user data. Only run on test/development databases.

-- Start transaction for safety
BEGIN;

-- 1. Clear the circular reference: users.best_single_score_response_id -> user_responses
UPDATE users SET best_single_score_response_id = NULL;

-- 2. Clear self-reference: users.merged_from_user_id -> users
UPDATE users SET merged_from_user_id = NULL;

-- 3. Delete feedback (references users)
DELETE FROM feedback;

-- 4. Delete user_responses (references users and questions)
DELETE FROM user_responses;

-- 5. Clear questions.created_by_user_id (set to NULL instead of deleting questions)
UPDATE questions SET created_by_user_id = NULL WHERE created_by_user_id IS NOT NULL;

-- 6. Delete all users
DELETE FROM users;

-- Verify deletion
SELECT 'Users deleted: ' || COUNT(*) as result FROM users;
SELECT 'User responses deleted: ' || COUNT(*) as result FROM user_responses;
SELECT 'Feedback deleted: ' || COUNT(*) as result FROM feedback;

COMMIT;

-- Output success message
SELECT 'All test users and associated data have been deleted successfully.' as status;
