# Migration 008: Remove Unused Tables

## Overview

This migration removes 5 unused database tables from the Four Sigma schema:
- `achievements` - Achievement feature never implemented
- `user_achievements` - User achievement tracking
- `leaderboard_snapshots` - Redundant historical leaderboard data
- `question_flags` - Community moderation feature not implemented
- `question_edits` - Community editing feature not implemented

**Impact:**
- 28% reduction in table count (18 → 13 tables)
- Simpler schema and easier maintenance
- No impact on user-facing features (none of these tables are used)
- Faster database backups and migrations

## Pre-Migration Checklist

- [ ] Verify you have database admin access
- [ ] Confirm no custom code uses these tables
- [ ] Have database backup available
- [ ] Ready to deploy updated code (if needed)

## Migration Steps

### Option 1: Run via Supabase Dashboard (Recommended)

1. **Login to Supabase Dashboard**
   - Go to your project
   - Navigate to SQL Editor

2. **Create Backups (Optional but recommended)**
   ```sql
   CREATE TABLE achievements_backup AS SELECT * FROM achievements;
   CREATE TABLE user_achievements_backup AS SELECT * FROM user_achievements;
   CREATE TABLE leaderboard_snapshots_backup AS SELECT * FROM leaderboard_snapshots;
   CREATE TABLE question_flags_backup AS SELECT * FROM question_flags;
   CREATE TABLE question_edits_backup AS SELECT * FROM question_edits;
   ```

3. **Run the Migration**
   - Copy the contents of `008_remove_unused_tables.sql`
   - Paste into SQL Editor
   - Review the SQL
   - Click "Run"

4. **Verify Success**
   ```sql
   -- Should show 13 tables (down from 18)
   SELECT tablename
   FROM pg_tables
   WHERE schemaname = 'public'
   ORDER BY tablename;
   ```

### Option 2: Run via psql CLI

```bash
# Connect to your database
psql "postgresql://postgres:[YOUR-PASSWORD]@[YOUR-PROJECT-REF].supabase.co:5432/postgres"

# Run the migration
\i scripts/migrations/008_remove_unused_tables.sql

# Verify
\dt
```

## What Changed

### Tables Removed
1. **achievements** - Empty table for badge system
2. **user_achievements** - Empty junction table
3. **leaderboard_snapshots** - Duplicate of user_period_stats data
4. **question_flags** - Unused moderation table
5. **question_edits** - Unused editing workflow table

### Function Updated
The `merge_anonymous_user()` function was updated to remove the achievements transfer logic (lines 51-57 from migration 002).

**Before:**
```sql
-- Transfer achievements (ignore duplicates)
INSERT INTO user_achievements (user_id, achievement_id, earned_at, metadata)
SELECT p_authenticated_user_id, achievement_id, earned_at, metadata
FROM user_achievements
WHERE user_id = p_anonymous_user_id
ON CONFLICT (user_id, achievement_id) DO NOTHING;

DELETE FROM user_achievements WHERE user_id = p_anonymous_user_id;
```

**After:**
This section is removed entirely.

## Rollback Plan

If you need to restore the tables:

1. **Run the rollback migration:**
   ```bash
   psql "..." < scripts/migrations/008_remove_unused_tables_ROLLBACK.sql
   ```

2. **Restore data from backups (if created):**
   ```sql
   INSERT INTO achievements SELECT * FROM achievements_backup;
   INSERT INTO user_achievements SELECT * FROM user_achievements_backup;
   INSERT INTO leaderboard_snapshots SELECT * FROM leaderboard_snapshots_backup;
   INSERT INTO question_flags SELECT * FROM question_flags_backup;
   INSERT INTO question_edits SELECT * FROM question_edits_backup;
   ```

## Verification Tests

After migration, verify:

### 1. Game Session Still Works
```bash
# Test creating a game session
curl -X POST https://your-domain.com/api/session/start \
  -H "Content-Type: application/json" \
  -H "X-Device-Id: test-device-123"
```

### 2. User Merge Still Works
```sql
-- Create a test anonymous user
INSERT INTO users (email, username, is_anonymous, device_id)
VALUES (NULL, 'test_anon', TRUE, 'test-merge-device')
RETURNING id;

-- Create a test authenticated user
INSERT INTO users (email, username, is_anonymous)
VALUES ('test@example.com', 'test_auth', FALSE)
RETURNING id;

-- Test merge (use the returned IDs)
SELECT merge_anonymous_user('[anon-id]', '[auth-id]');

-- Verify no errors occurred
```

### 3. Schema Integrity
```sql
-- Check for orphaned foreign keys
SELECT
  conname AS constraint_name,
  conrelid::regclass AS table_name,
  confrelid::regclass AS referenced_table
FROM pg_constraint
WHERE confrelid::regclass::text IN (
  'achievements', 'user_achievements', 'leaderboard_snapshots',
  'question_flags', 'question_edits'
);
-- Should return 0 rows
```

## Post-Migration Tasks

- [ ] Update any internal documentation referencing these tables
- [ ] Remove backup tables after confirming migration success (after 1 week):
  ```sql
  DROP TABLE IF EXISTS achievements_backup;
  DROP TABLE IF EXISTS user_achievements_backup;
  DROP TABLE IF EXISTS leaderboard_snapshots_backup;
  DROP TABLE IF EXISTS question_flags_backup;
  DROP TABLE IF EXISTS question_edits_backup;
  ```

## Expected Results

**Before Migration:**
- 18 tables in schema
- merge_anonymous_user references user_achievements

**After Migration:**
- 13 tables in schema
- merge_anonymous_user updated (achievements section removed)
- All user-facing functionality preserved
- No code changes required (none of these tables were used in code)

## Support

If you encounter any issues:
1. Check Supabase logs for errors
2. Verify no custom queries reference dropped tables
3. Run the rollback migration if needed
4. Restore from backups if data was important

## Timeline

Estimated migration time: **< 1 minute**

The actual DROP TABLE commands execute instantly since these tables are either empty or have minimal data.
