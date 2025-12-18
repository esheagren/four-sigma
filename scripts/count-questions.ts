#!/usr/bin/env node

import { supabase, testConnection } from './utils/supabase-client.js';

async function countQuestions() {
  console.log('\n🔢 Counting questions...\n');

  const connected = await testConnection();
  if (!connected) {
    process.exit(1);
  }

  const { count, error } = await supabase
    .from('questions')
    .select('*', { count: 'exact', head: true });

  if (error) {
    console.error('❌ Error counting questions:', error);
    process.exit(1);
  }

  console.log(`📊 Total Questions in Database: ${count}\n`);
}

countQuestions();
