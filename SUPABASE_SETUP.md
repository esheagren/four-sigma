# Supabase Setup Guide for Four Sigma

This guide walks you through setting up Supabase for Four Sigma and importing your first questions.

## Prerequisites

- A Supabase account (free tier works fine)
- Node.js and npm installed
- CSV file with researched questions

## Step 1: Create Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign in or create an account
3. Click "New Project"
4. Fill in:
   - **Project name**: four-sigma (or your choice)
   - **Database password**: Generate a strong password (save it!)
   - **Region**: Choose closest to your users
   - **Pricing plan**: Free (for development)
5. Click "Create new project"
6. Wait 2-3 minutes for provisioning

## Step 2: Get API Credentials

1. In your Supabase project, go to **Settings** → **API**
2. You'll see:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public** key: Long string starting with `eyJ...`
   - **service_role secret** key: Another long string starting with `eyJ...`
3. Keep this page open - you'll need these values

## Step 3: Configure Environment Variables

1. In your `four-sigma` directory, create a `.env` file:
   ```bash
   cp env.example .env
   ```

2. Edit `.env` and add your Supabase credentials:
   ```env
   SUPABASE_URL=https://xxxxx.supabase.co
   SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

3. **Important**: Never commit `.env` to git (it's already in `.gitignore`)

## Step 4: Install Dependencies

```bash
npm install
```

This installs the Supabase client library and other dependencies.

## Step 5: Create Database Schema

### Option A: Using Supabase Dashboard (Recommended for first time)

1. Go to your Supabase project → **SQL Editor**
2. Click "New query"
3. Open `scripts/migrations/001_initial_schema.sql` in your code editor
4. Copy the entire SQL file
5. Paste into Supabase SQL Editor
6. Click **Run** (or press Cmd/Ctrl + Enter)
7. Wait for "Success. No rows returned"

### Option B: Using Supabase CLI (Advanced)

If you have Supabase CLI installed:
```bash
supabase db push
```

### Verify Schema Creation

1. Go to **Database** → **Tables** in Supabase dashboard
2. You should see 16 tables:
   - `users`
   - `user_category_stats`
   - `user_period_stats`
   - `achievements`
   - `user_achievements`
   - `domains`
   - `categories`
   - `subcategories`
   - `units`
   - `questions`
   - `question_subcategories`
   - `question_edits`
   - `question_flags`
   - `daily_questions`
   - `user_responses`
   - `leaderboard_snapshots`

## Step 6: Import Questions

### Test with Dry Run First

```bash
npm run import-questions -- --file ../questions/3-researched/1-generated-questions.csv --dry-run
```

This shows what would happen without actually modifying the database.

Expected output:
```
🚀 Four Sigma Question Import
================================
📁 File: ../questions/3-researched/1-generated-questions.csv
🏃 Mode: DRY RUN

📖 Parsing CSV...
   Found 50 questions

📥 Importing questions...

✅ [DRY RUN] Would create question: "What is the current US federal funds rate?..."
...

📊 Import Summary
================================
Units:         15 created, 0 reused
Domains:       5 created, 0 reused
Categories:    12 created, 0 reused
Subcategories: 23 created, 0 reused
Questions:     50 created, 0 skipped
Junction:      75 records created

✨ Import complete!
```

### Run Actual Import

If the dry run looks good, run the real import:

```bash
npm run import-questions -- --file ../questions/3-researched/1-generated-questions.csv
```

This will:
- Create units, domains, categories, and subcategories
- Insert all 50 questions
- Link questions to their subcategories
- Print a detailed summary

## Step 7: Verify Import

### Check in Supabase Dashboard

1. Go to **Database** → **Table Editor**
2. Click on `questions` table
3. You should see your imported questions
4. Check other tables:
   - `units` - Should have entries like "percentage", "billion USD"
   - `domains` - Should have "Economics & Business", "Technology & Computing", etc.
   - `categories` - Should have category names
   - `subcategories` - Should have subcategory names
   - `question_subcategories` - Should have junction records

### Run a Test Query

In SQL Editor, try:
```sql
SELECT
  q.question_text,
  q.answer_value,
  u.name as unit,
  d.name as domain,
  c.name as category
FROM questions q
LEFT JOIN units u ON q.unit_id = u.id
LEFT JOIN question_subcategories qs ON q.id = qs.question_id
LEFT JOIN subcategories s ON qs.subcategory_id = s.id
LEFT JOIN categories c ON s.category_id = c.id
LEFT JOIN domains d ON c.domain_id = d.id
WHERE qs.is_primary = true
LIMIT 10;
```

You should see 10 questions with their metadata.

## Step 8: Import Additional Question Batches

When you generate more questions:

1. Save CSV to `questions/3-researched/2-generated-questions.csv`
2. Run import:
   ```bash
   npm run import-questions -- --file ../questions/3-researched/2-generated-questions.csv
   ```
3. The script will:
   - **Reuse** existing units/domains/categories/subcategories
   - **Skip** duplicate questions
   - **Create** only new questions
4. Output shows what was created vs reused

Example second import:
```
📊 Import Summary
================================
Units:         2 created, 48 reused    ← Mostly reusing existing
Domains:       0 created, 50 reused    ← All existing domains
Categories:    1 created, 49 reused
Subcategories: 3 created, 47 reused
Questions:     45 created, 5 skipped   ← 5 were duplicates
Junction:      67 records created

✨ Import complete!
```

## Troubleshooting

### Connection Issues

**Error**: "Missing Supabase credentials"
- **Fix**: Check your `.env` file exists and has correct values

**Error**: "Supabase connection test failed"
- **Fix**: Verify your project URL and API keys are correct
- **Fix**: Check your Supabase project is active (not paused)

### Import Issues

**Error**: "Failed to create unit/domain/category"
- **Fix**: Make sure you ran the migration SQL (Step 5)
- **Fix**: Check Supabase logs for detailed error

**Duplicate questions**
- **Expected**: The script automatically skips duplicates
- Shows: `⏭️  Skipping duplicate: "question text..."`

### Performance

- First import: ~30-60 seconds for 50 questions
- Subsequent imports: Faster (reuses existing data)
- Large batches (500+ questions): 3-5 minutes

## Next Steps

After successful import:

1. **Test queries** in Supabase dashboard
2. **Update frontend** to fetch from Supabase instead of mock data
3. **Set up Row Level Security (RLS)** policies for production
4. **Create indexes** for performance (if needed)
5. **Set up Supabase Auth** for user system

## Security Notes

### For Development
- Using `SUPABASE_SERVICE_ROLE_KEY` bypasses RLS (Row Level Security)
- This is fine for import scripts and development
- Keep this key **secret** and **never** expose to frontend

### For Production
- Enable RLS on all tables
- Create appropriate policies
- Frontend should use `SUPABASE_ANON_KEY` only
- Service role key only in backend/scripts

## Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Four Sigma Data Model](../.claude/skills/data-modeling/reference.md)
- [Scripts README](scripts/README.md)
- [SQL Migration File](scripts/migrations/001_initial_schema.sql)
