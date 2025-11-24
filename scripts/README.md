# Four Sigma Database Scripts

This directory contains scripts for database migrations and data seeding.

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the project root with your Supabase credentials:

```env
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Use SERVICE_ROLE_KEY for scripts that need to bypass RLS
# Use ANON_KEY for regular application access
```

**Where to find these:**
1. Go to your Supabase project dashboard
2. Click on "Settings" → "API"
3. Copy:
   - Project URL → `SUPABASE_URL`
   - `anon` `public` key → `SUPABASE_ANON_KEY`
   - `service_role` `secret` key → `SUPABASE_SERVICE_ROLE_KEY`

### 3. Create Database Schema

Run the migration SQL in your Supabase dashboard:

1. Go to Supabase dashboard → SQL Editor
2. Copy the contents of `scripts/migrations/001_initial_schema.sql`
3. Paste and run the SQL
4. Verify all 16 tables were created

Or if using Supabase CLI:
```bash
npm run db:migrate
```

## Importing Questions

### Basic Usage

Import questions from a CSV file:

```bash
npm run import-questions -- --file ../questions/3-researched/1-generated-questions.csv
```

### Dry Run Mode

Test the import without writing to the database:

```bash
npm run import-questions -- --file ../questions/3-researched/1-generated-questions.csv --dry-run
```

This will:
- Show what would be created
- Print statistics
- Not modify the database

### How It Works

The import script:

1. **Parses CSV** - Reads the question data from CSV file
2. **Creates/Reuses Entities** - For each question:
   - Finds or creates the `unit` (e.g., "percentage", "billion USD")
   - Finds or creates the `domain` → `category` → `subcategory` hierarchy
   - Caches UUIDs to avoid duplicate lookups
3. **Inserts Questions** - Creates question records with proper foreign keys
4. **Creates Junctions** - Links questions to subcategories (many-to-many)
5. **Skips Duplicates** - Won't re-import questions that already exist

### CSV Format Expected

The script expects CSV files with these columns:

- `question_text` - The question
- `answer_value` - Numeric answer
- `answer_unit` - Unit of measurement (text)
- `question_type` - "mesofact" or "constant"
- `distribution_tier` - "professional", "contextual", or "mind_blowing"
- `domain` - Top-level domain (text)
- `category` - Category within domain (text)
- `subcategory` - Semicolon-separated subcategories (text)
- `source_url` - Source URL
- `source_name` - Source name
- `source_retrieved_at` - Date (YYYY-MM-DD)
- `answer_explanation` - Detailed explanation

### Example Output

```
🚀 Four Sigma Question Import
================================
📁 File: ../questions/3-researched/1-generated-questions.csv
🏃 Mode: LIVE

✅ Supabase connection successful

📖 Parsing CSV...
   Found 50 questions

📥 Importing questions...

✅ Created question: "What is the current US federal funds rate?..."
✅ Created question: "What percentage of global electricity generation..."
⏭️  Skipping duplicate: "What is the current US federal funds rate?..."

📊 Import Summary
================================
Units:         15 created, 35 reused
Domains:       5 created, 45 reused
Categories:    12 created, 38 reused
Subcategories: 23 created, 27 reused
Questions:     48 created, 2 skipped
Junction:      72 records created

✨ Import complete!
```

## Directory Structure

```
scripts/
├── migrations/          # SQL migration files
│   └── 001_initial_schema.sql
├── seed/               # Data seeding scripts
│   └── import-questions.ts
└── utils/              # Shared utilities
    └── supabase-client.ts
```

## Workflow for New Question Batches

1. Generate questions using question-generation skill
2. Research answers using question-research skill
3. Questions saved to `questions/3-researched/N-generated-questions.csv`
4. Run import script:
   ```bash
   npm run import-questions -- --file ../questions/3-researched/N-generated-questions.csv
   ```
5. Script creates/reuses categories and inserts new questions
6. Questions now available in Supabase!

## Troubleshooting

### "Missing Supabase credentials"

Make sure your `.env` file exists and contains valid credentials.

### "Supabase connection test failed"

- Check your `SUPABASE_URL` is correct
- Verify your API keys are valid
- Ensure your IP is allowed (if RLS enabled)
- Check Supabase project is running

### "Failed to create unit/domain/category"

- Verify the database schema was created
- Check for unique constraint violations
- Review Supabase logs for detailed errors

### Malformed CSV rows

The script uses a simple CSV parser. If you have commas in your data:
- Make sure values are properly quoted
- Or use a more robust CSV library (csv-parse, papaparse)
