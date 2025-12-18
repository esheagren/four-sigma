#!/usr/bin/env node

/**
 * Reset and Re-import Questions Script
 *
 * This script:
 * 1. Deletes all existing questions and junction records
 * 2. Re-imports questions from the 5-uploaded folder
 *
 * Usage:
 *   npm run reset-and-reimport
 */

import { supabase, testConnection } from './utils/supabase-client.js';
import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function deleteAllQuestions() {
  console.log('🗑️  Deleting all existing questions...\n');

  // Step 1: Delete junction records
  const { error: junctionError, count: junctionCount } = await supabase
    .from('question_subcategories')
    .delete()
    .neq('question_id', '00000000-0000-0000-0000-000000000000'); // Delete all

  if (junctionError) {
    console.error('❌ Error deleting junction records:', junctionError);
    throw junctionError;
  }

  console.log(`   ✓ Deleted junction records`);

  // Step 2: Delete questions
  const { error: questionsError, count: questionsCount } = await supabase
    .from('questions')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

  if (questionsError) {
    console.error('❌ Error deleting questions:', questionsError);
    throw questionsError;
  }

  console.log(`   ✓ Deleted questions\n`);

  // Step 3: Verify deletion
  const { count: remainingQuestions } = await supabase
    .from('questions')
    .select('*', { count: 'exact', head: true });

  const { count: remainingJunctions } = await supabase
    .from('question_subcategories')
    .select('*', { count: 'exact', head: true });

  console.log('📊 Deletion Summary:');
  console.log(`   Questions remaining: ${remainingQuestions || 0}`);
  console.log(`   Junction records remaining: ${remainingJunctions || 0}\n`);

  if (remainingQuestions !== 0 || remainingJunctions !== 0) {
    throw new Error('Deletion incomplete - some records remain');
  }
}

async function reimportQuestions() {
  console.log('📥 Re-importing questions from 5-uploaded folder...\n');

  const uploadedPath = path.resolve(__dirname, '../../questions/5-uploaded/1-researched-questions.csv');

  try {
    execSync(
      `npm run import-questions -- --file ${uploadedPath}`,
      {
        cwd: path.resolve(__dirname, '..'),
        stdio: 'inherit'
      }
    );
  } catch (error) {
    console.error('❌ Error during import:', error);
    throw error;
  }
}

async function main() {
  console.log('\n🔄 Reset and Re-import Questions');
  console.log('================================\n');

  // Test connection
  const connected = await testConnection();
  if (!connected) {
    process.exit(1);
  }

  console.log('');

  try {
    // Step 1: Delete all questions
    await deleteAllQuestions();

    // Step 2: Re-import from uploaded folder
    await reimportQuestions();

    console.log('\n✨ Reset and re-import complete!\n');

  } catch (error) {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  }
}

main();
