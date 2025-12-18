import { supabase } from './scripts/utils/supabase-client.js';

async function checkDomain() {
  const { data, error } = await supabase
    .from('domains')
    .select('name')
    .order('name');
  
  if (error) {
    console.error('Error:', error);
  } else {
    console.log('All domains in database:');
    data.forEach(d => console.log(`  - "${d.name}"`));
  }
  process.exit(0);
}

checkDomain();
