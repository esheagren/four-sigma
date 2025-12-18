#!/usr/bin/env node

import { supabase, testConnection } from './utils/supabase-client.js';

async function checkTodayQuestions() {
  console.log('\n🔍 Checking today\'s questions...\n');

  const connected = await testConnection();
  if (!connected) {
    process.exit(1);
  }

  const today = new Date().toISOString().split('T')[0];
  console.log(`Date: ${today}\n`);

  const { data, error } = await supabase
    .from('daily_questions')
    .select(`
      id,
      display_order,
      is_published,
      questions!inner (
        id,
        question_text,
        answer_value,
        units (name)
      )
    `)
    .eq('date', today)
    .order('display_order');

  if (error) {
    console.error('❌ Error fetching daily questions:', error);
    process.exit(1);
  }

  if (!data || data.length === 0) {
    console.log('❌ No questions found for today!');
    process.exit(1);
  }

  console.log(`✅ Found ${data.length} questions for today:\n`);

  data.forEach((dq: any, i: number) => {
    const q = dq.questions;
    const unit = q.units?.name || 'N/A';
    console.log(`${i + 1}. ${q.question_text}`);
    console.log(`   Answer: ${q.answer_value} ${unit}`);
    console.log(`   Published: ${dq.is_published ? 'Yes' : 'No'}\n`);
  });

  console.log('✨ Ready to play!\n');
}

checkTodayQuestions();
