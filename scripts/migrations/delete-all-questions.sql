-- Delete All Questions Script
-- This script removes all questions and their relationships from the database
-- Run this in your Supabase SQL Editor

-- Step 1: Delete all junction table records first (due to foreign key constraints)
DELETE FROM public.question_subcategories;

-- Step 2: Delete all questions
DELETE FROM public.questions;

-- Step 3: Verify deletion
SELECT
  (SELECT COUNT(*) FROM public.questions) as questions_count,
  (SELECT COUNT(*) FROM public.question_subcategories) as junction_count;

-- Expected result: Both counts should be 0
