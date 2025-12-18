#!/usr/bin/env node

import { supabase, testConnection } from './utils/supabase-client.js';

async function verifyQuestions() {
  console.log('🔍 Verifying uploaded questions...\n');

  const connected = await testConnection();
  if (!connected) {
    process.exit(1);
  }

  // Get all questions ordered by created_at
  const { data: questions, error } = await supabase
    .from('questions')
    .select(`
      id,
      question_text,
      answer_value,
      answer_context,
      units (name, symbol),
      created_at
    `)
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) {
    console.error('❌ Error fetching questions:', error);
    process.exit(1);
  }

  console.log(`✅ Found ${questions?.length || 0} recent questions:\n`);

  questions?.forEach((q, i) => {
    const unit = q.units ? `${q.units.symbol || q.units.name}` : 'N/A';
    console.log(`${i + 1}. ${q.question_text.substring(0, 60)}...`);
    console.log(`   Answer: ${q.answer_value} ${unit}`);
    console.log(`   Context: ${q.answer_context ? 'Yes ✓' : 'No ✗'}`);
    console.log(`   Created: ${new Date(q.created_at).toLocaleString()}\n`);
  });

  console.log('✨ Verification complete!\n');
}

verifyQuestions().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
