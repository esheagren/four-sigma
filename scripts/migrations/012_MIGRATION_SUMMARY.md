# Migration 012: Add usage_type Column

## Date
2025-12-18

## Purpose
Add a `usage_type` field to the questions table to categorize questions by their intended use. This enables different question pools for daily games, special challenges, and featured content.

## Changes Made

### Schema Changes
- Added `usage_type` column to `questions` table
  - Type: TEXT
  - Constraint: NOT NULL
  - Default: 'daily'
  - CHECK constraint: must be one of ('daily', 'challenge', 'special')

### Data Changes
- Updated all existing questions to have `usage_type = 'daily'`
- Added column comment for documentation

## Rationale

The existing `question_type` field (value: 'mesofact') describes what kind of question it is, while the new `usage_type` field describes how/where the question should be used in the application:

- **daily**: Questions that appear in the daily rotation
- **challenge**: Reserved for future challenge mode
- **special**: Reserved for special events or featured content

This separation allows questions to have both a classification (mesofact) and a usage context (daily/challenge/special).

## Impact

### Database
- New column added to questions table
- All existing questions marked as 'daily'
- No breaking changes to existing queries

### Application Code
The following files were updated to support the new field:

1. **populate-daily-questions.ts**: Now filters by `usage_type = 'daily'`
2. **upload-questions.ts**: Sets `usage_type = 'daily'` for new questions

### API
- No API changes required
- TypeScript interfaces unchanged (usage_type is database-only field)

## Verification

After running this migration, verify:

```sql
-- Check column exists with correct default
SELECT column_name, column_default, is_nullable, data_type
FROM information_schema.columns
WHERE table_name = 'questions' AND column_name = 'usage_type';

-- Check constraint exists
SELECT constraint_name, check_clause
FROM information_schema.check_constraints
WHERE constraint_name = 'check_usage_type';

-- Verify all existing questions have 'daily'
SELECT usage_type, COUNT(*)
FROM questions
GROUP BY usage_type;
```

Expected results:
- Column exists with DEFAULT 'daily', NOT NULL
- Check constraint allows only: 'daily', 'challenge', 'special'
- All existing questions show `usage_type = 'daily'`

## Rollback

If rollback is needed:

```sql
-- Remove constraint first
ALTER TABLE questions DROP CONSTRAINT IF EXISTS check_usage_type;

-- Remove column
ALTER TABLE questions DROP COLUMN IF EXISTS usage_type;
```

**Warning**: Rollback will require reverting code changes in populate-daily-questions.ts and upload-questions.ts.

## Future Extensions

This migration enables:

1. **Challenge Mode**: Questions marked with `usage_type = 'challenge'`
2. **Special Events**: Questions marked with `usage_type = 'special'`
3. **Mixed Modes**: Ability to query different question pools
4. **Analytics**: Track engagement by usage type

## Notes

- Migration must be run before deploying updated populate-daily-questions.ts
- Backward compatible: Existing queries continue to work
- No downtime required
