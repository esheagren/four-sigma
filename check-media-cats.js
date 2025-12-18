import { supabase } from './scripts/utils/supabase-client.js';

async function checkCats() {
  // Get the domain ID
  const { data: domain } = await supabase
    .from('domains')
    .select('id, name')
    .eq('name', 'Media, Sports & Culture')
    .single();
  
  console.log('Domain:', domain);
  
  // Get categories for this domain
  const { data: cats } = await supabase
    .from('categories')
    .select('name')
    .eq('domain_id', domain.id)
    .order('name');
  
  console.log('\nCategories for Media, Sports & Culture:');
  if (cats && cats.length > 0) {
    cats.forEach(c => console.log(`  - "${c.name}"`));
  } else {
    console.log('  (none found)');
  }
  
  process.exit(0);
}

checkCats();
