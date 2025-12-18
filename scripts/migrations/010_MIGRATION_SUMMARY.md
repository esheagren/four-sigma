# Migration 010 Summary - Remove distribution_tier

## What Was Done

✅ **Database Migration Created:**
- `scripts/migrations/010_remove_distribution_tier.sql`

✅ **Code Updated:**
- `scripts/seed/import-questions.ts` - Removed distribution_tier from CSV import
- `scripts/seed/populate-daily-questions.ts` - Removed tier filtering, now uses all active questions

## Change Details

### Field Removed

**From questions table:**
```sql
distribution_tier TEXT NOT NULL DEFAULT 'professional'
```

**Values that existed:**
- 'professional'
- 'contextual'
- 'mind_blowing'

### Why Remove It?

- ❌ Not used in the application
- ❌ Not displayed in UI
- ❌ Not used in question selection (except seed script)
- ✅ Simplifies schema
- ✅ Questions are treated equally

## Files Changed

### 1. Database Migration
**File:** `scripts/migrations/010_remove_distribution_tier.sql`

```sql
ALTER TABLE questions DROP COLUMN IF EXISTS distribution_tier;
```

### 2. Import Script
**File:** `scripts/seed/import-questions.ts`

**Before:**
```typescript
interface CSVRow {
  ...
  distribution_tier: string;  // ❌ Removed
  ...
}

await supabase.from('questions').insert({
  ...
  distribution_tier: row.distribution_tier,  // ❌ Removed
  ...
});
```

**After:**
```typescript
interface CSVRow {
  ...
  // distribution_tier removed
  ...
}

await supabase.from('questions').insert({
  ...
  // distribution_tier removed
  ...
});
```

### 3. Daily Questions Populate Script
**File:** `scripts/seed/populate-daily-questions.ts`

**Before:**
```typescript
async function fetchMindBlowingQuestions(): Promise<Question[]> {
  const { data, error } = await supabase
    .from('questions')
    .select('id, question_text')
    .eq('distribution_tier', 'mind_blowing')  // ❌ Tier filter
    .eq('is_active', true);
  ...
}
```

**After:**
```typescript
async function fetchActiveQuestions(): Promise<Question[]> {
  const { data, error } = await supabase
    .from('questions')
    .select('id, question_text')
    .eq('is_active', true);  // ✅ All active questions
  ...
}
```

## Migration Instructions

### To Deploy:

**Option 1: Supabase Dashboard**
1. Open Supabase Dashboard → SQL Editor
2. Copy contents of `scripts/migrations/010_remove_distribution_tier.sql`
3. Paste and click "Run"
4. Done! ✅

**Option 2: CLI**
```bash
psql "your-connection-string" < scripts/migrations/010_remove_distribution_tier.sql
```

### Verification:

```sql
-- Verify column is gone
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'questions'
AND column_name = 'distribution_tier';
-- Should return 0 rows

-- Verify questions table still works
SELECT id, question_text, question_type, is_active
FROM questions
LIMIT 5;
-- Should return questions without errors
```

## Impact Assessment

### Database Impact
- ✅ One column removed from questions table
- ✅ No foreign keys affected
- ✅ No indexes affected
- ✅ No triggers affected

### Application Impact
- ✅ **Zero impact** - field was not used in application code
- ✅ Questions queries continue to work unchanged
- ✅ getDailyQuestions() unaffected (uses daily_questions table)
- ✅ All APIs continue to function normally

### Seed Scripts Impact
- ⚠️ **import-questions.ts** - CSV imports will ignore distribution_tier column if present
- ⚠️ **populate-daily-questions.ts** - Now selects from all active questions (not just 'mind_blowing')

### Risk Level
**VERY LOW**
- Removing unused field only
- No application code references it
- Only seed scripts were using it
- Easy rollback if needed

## Post-Migration

### If You Have CSV Files with distribution_tier

Your CSV import script will ignore the column now. If your CSV files still have a `distribution_tier` column, that's fine - it just won't be imported.

**Option 1:** Leave CSV as-is (column will be ignored)
**Option 2:** Remove the column from your CSVs for cleaner imports

### Future Question Imports

When adding new questions, don't include `distribution_tier` field. Just use:
- `question_text`
- `answer_value`
- `answer_unit`
- `question_type`
- Other required fields

## Related Decisions

### Kept: daily_questions Table ✅

You decided to **keep** the `daily_questions` table because it provides:
- Date scheduling for questions
- Display order control (1st, 2nd, 3rd)
- Question reusability across days
- Editorial control over daily sets
- Theme support

See `daily_questions_refactor_analysis.md` for full analysis.

## Schema State

**After Migration 010:**
- **Tables:** 11 (unchanged from Migration 009)
- **questions table:** Simplified, one less field
- **Cleaner schema:** Removed unused categorization

**questions table now has:**
- ✅ id, question_text, answer_value (core data)
- ✅ fun_fact, answer_explanation, answer_context (enrichment)
- ✅ source_url, source_name, source_retrieved_at (attribution)
- ✅ question_type (e.g., 'mesofact')
- ✅ creation_source, created_by_user_id (provenance)
- ✅ unit_id (relationship to units table)
- ✅ is_active, timestamps (metadata)
- ❌ ~~distribution_tier~~ (removed)

## Summary

**Status:** ✅ Ready to deploy

**What:** Remove unused distribution_tier field
**Why:** Simplify schema, field not used
**Risk:** Very low (unused field)
**Time:** < 30 seconds
**Impact:** Zero user-facing changes

**Files to run:**
1. `scripts/migrations/010_remove_distribution_tier.sql` (database)

**Files already updated:**
1. `scripts/seed/import-questions.ts` ✅
2. `scripts/seed/populate-daily-questions.ts` ✅

---

**Ready to deploy!** This is a simple, safe cleanup migration.
