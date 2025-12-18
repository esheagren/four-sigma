import { supabase } from './utils/supabase-client.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { parse } from 'csv-parse/sync';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface CSVRow {
  question_text: string;
  domain: string;
  category: string;
  subcategory: string;
  answer_unit: string;
  answer_value: string;
  answer_found: string;
  source_url: string;
  source_name: string;
  source_retrieved_at: string;
  answer_context: string;
}

interface TaxonomyCache {
  units: Map<string, string>;
  domains: Map<string, string>;
  categories: Map<string, { id: string; domain_id: string }>;
  subcategories: Map<string, string>;
}

interface UploadResult {
  success: number;
  skipped: number;
  failed: number;
  errors: Array<{ row: number; question: string; error: string }>;
}

const QUESTIONS_DIR = path.resolve(__dirname, '../../questions');
const INPUT_DIR = path.join(QUESTIONS_DIR, '4-researched');
const OUTPUT_DIR = path.join(QUESTIONS_DIR, '5-uploaded');
const ERROR_LOG_DIR = path.join(QUESTIONS_DIR, 'errors');

// Cache for taxonomy lookups
let taxonomyCache: TaxonomyCache | null = null;

async function loadTaxonomyCache(): Promise<TaxonomyCache> {
  console.log('📚 Loading taxonomy cache...');

  const cache: TaxonomyCache = {
    units: new Map(),
    domains: new Map(),
    categories: new Map(),
    subcategories: new Map(),
  };

  // Load units
  const { data: units, error: unitsError } = await supabase
    .from('units')
    .select('id, name, symbol');

  if (unitsError) {
    console.error('❌ Error loading units:', unitsError);
    throw unitsError;
  }

  units?.forEach((unit: any) => {
    // Map by both name and symbol
    cache.units.set(unit.name.toLowerCase(), unit.id);
    if (unit.symbol) {
      cache.units.set(unit.symbol.toLowerCase(), unit.id);
    }
  });
  console.log(`  ✅ Loaded ${units?.length || 0} units`);

  // Load domains
  const { data: domains, error: domainsError } = await supabase
    .from('domains')
    .select('id, name');

  if (domainsError) {
    console.error('❌ Error loading domains:', domainsError);
    throw domainsError;
  }

  domains?.forEach((domain: any) => {
    cache.domains.set(domain.name.toLowerCase(), domain.id);
  });
  console.log(`  ✅ Loaded ${domains?.length || 0} domains`);

  // Load categories
  const { data: categories, error: categoriesError } = await supabase
    .from('categories')
    .select('id, name, domain_id');

  if (categoriesError) {
    console.error('❌ Error loading categories:', categoriesError);
    throw categoriesError;
  }

  categories?.forEach((category: any) => {
    cache.categories.set(category.name.toLowerCase(), {
      id: category.id,
      domain_id: category.domain_id,
    });
  });
  console.log(`  ✅ Loaded ${categories?.length || 0} categories`);

  // Load subcategories
  const { data: subcategories, error: subcategoriesError } = await supabase
    .from('subcategories')
    .select('id, name, category_id');

  if (subcategoriesError) {
    console.error('❌ Error loading subcategories:', subcategoriesError);
    throw subcategoriesError;
  }

  subcategories?.forEach((subcategory: any) => {
    cache.subcategories.set(subcategory.name.toLowerCase(), subcategory.id);
  });
  console.log(`  ✅ Loaded ${subcategories?.length || 0} subcategories`);

  return cache;
}

function validateRow(row: CSVRow, rowIndex: number): { valid: boolean; error?: string } {
  // Skip rows where answer was not found (answer_found = false)
  if (row.answer_found && row.answer_found.toLowerCase() === 'false') {
    return { valid: false, error: 'No valid answer found (answer_found is false)' };
  }

  // Skip rows with empty answer_value
  if (!row.answer_value || row.answer_value.trim() === '') {
    return { valid: false, error: 'Missing answer_value' };
  }

  // Skip rows with empty source_url
  if (!row.source_url || row.source_url.trim() === '') {
    return { valid: false, error: 'Missing source URL' };
  }

  // Validate required fields
  if (!row.question_text || row.question_text.trim() === '') {
    return { valid: false, error: 'Missing question text' };
  }

  // Validate answer_value is numeric
  const answerValue = parseFloat(row.answer_value);
  if (isNaN(answerValue)) {
    return { valid: false, error: `Invalid numeric answer: ${row.answer_value}` };
  }

  // Validate date format
  if (row.source_retrieved_at && !isValidDate(row.source_retrieved_at)) {
    return { valid: false, error: `Invalid date format: ${row.source_retrieved_at}` };
  }

  return { valid: true };
}

function isValidDate(dateString: string): boolean {
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime());
}

async function getOrCreateUnit(unitText: string, cache: TaxonomyCache): Promise<string | null> {
  if (!unitText || unitText.trim() === '') {
    return null;
  }

  const unitKey = unitText.toLowerCase().trim();

  // Check cache first
  if (cache.units.has(unitKey)) {
    return cache.units.get(unitKey)!;
  }

  // Unit not found - create it
  console.log(`  ⚠️  Creating new unit: ${unitText}`);
  const { data, error } = await supabase
    .from('units')
    .insert({ name: unitText, symbol: unitText })
    .select('id')
    .single();

  if (error) {
    console.error(`  ❌ Error creating unit "${unitText}":`, error);
    return null;
  }

  // Add to cache
  cache.units.set(unitKey, data.id);
  return data.id;
}

async function mapTaxonomy(
  row: CSVRow,
  cache: TaxonomyCache
): Promise<{
  unit_id: string | null;
  domain_id: string | null;
  category_id: string | null;
  subcategory_ids: string[];
  errors: string[];
}> {
  const errors: string[] = [];

  // Map unit
  const unit_id = await getOrCreateUnit(row.answer_unit, cache);
  if (row.answer_unit && !unit_id) {
    errors.push(`Failed to map or create unit: ${row.answer_unit}`);
  }

  // Map domain
  const domain_id = cache.domains.get(row.domain.toLowerCase()) || null;
  if (!domain_id) {
    errors.push(`Domain not found: ${row.domain}`);
  }

  // Map category
  const categoryData = cache.categories.get(row.category.toLowerCase());
  const category_id = categoryData?.id || null;
  if (!category_id) {
    errors.push(`Category not found: ${row.category}`);
  }

  // Map subcategories (semicolon separated)
  const subcategory_ids: string[] = [];
  if (row.subcategory) {
    const subcategoryNames = row.subcategory.split(';').map(s => s.trim());
    for (const name of subcategoryNames) {
      const subcategory_id = cache.subcategories.get(name.toLowerCase());
      if (subcategory_id) {
        subcategory_ids.push(subcategory_id);
      } else {
        errors.push(`Subcategory not found: ${name}`);
      }
    }
  }

  return { unit_id, domain_id, category_id, subcategory_ids, errors };
}

async function insertQuestion(
  row: CSVRow,
  taxonomy: {
    unit_id: string | null;
    subcategory_ids: string[];
  }
): Promise<{ success: boolean; error?: string; question_id?: string }> {
  // Insert question
  const { data: question, error: questionError } = await supabase
    .from('questions')
    .insert({
      unit_id: taxonomy.unit_id,
      question_text: row.question_text,
      answer_value: parseFloat(row.answer_value),
      source_url: row.source_url,
      source_name: row.source_name,
      source_retrieved_at: row.source_retrieved_at || null,
      question_type: 'mesofact',
      usage_type: 'daily',
      creation_source: 'automated',
      created_by_user_id: null,
      is_active: true,
      answer_updated_at: row.source_retrieved_at || null,
      answer_context: row.answer_context || null,
    })
    .select('id')
    .single();

  if (questionError) {
    return { success: false, error: questionError.message };
  }

  const question_id = question.id;

  // Insert question-subcategory relationships
  if (taxonomy.subcategory_ids.length > 0) {
    const relationships = taxonomy.subcategory_ids.map(subcategory_id => ({
      question_id,
      subcategory_id,
    }));

    const { error: relationError } = await supabase
      .from('question_subcategories')
      .insert(relationships);

    if (relationError) {
      console.warn(`  ⚠️  Warning: Failed to insert subcategory relationships for question ${question_id}`);
    }
  }

  return { success: true, question_id };
}

async function processCSV(filePath: string): Promise<UploadResult> {
  console.log(`\n📄 Processing file: ${path.basename(filePath)}`);

  const result: UploadResult = {
    success: 0,
    skipped: 0,
    failed: 0,
    errors: [],
  };

  // Read CSV file
  const fileContent = fs.readFileSync(filePath, 'utf-8');
  const rows: CSVRow[] = parse(fileContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });

  console.log(`  Found ${rows.length} rows to process`);

  // Ensure taxonomy cache is loaded
  if (!taxonomyCache) {
    taxonomyCache = await loadTaxonomyCache();
  }

  // Process each row
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = i + 2; // +2 because CSV is 1-indexed and has header

    // Validate row
    const validation = validateRow(row, rowNum);
    if (!validation.valid) {
      console.log(`  ⏭️  Row ${rowNum}: Skipped - ${validation.error}`);
      result.skipped++;
      continue;
    }

    // Map taxonomy
    const taxonomy = await mapTaxonomy(row, taxonomyCache);
    if (taxonomy.errors.length > 0) {
      console.error(`  ❌ Row ${rowNum}: Taxonomy mapping errors:`);
      taxonomy.errors.forEach(err => console.error(`     - ${err}`));
      result.failed++;
      result.errors.push({
        row: rowNum,
        question: row.question_text.substring(0, 80),
        error: taxonomy.errors.join('; '),
      });
      continue;
    }

    // Insert question
    const insertResult = await insertQuestion(row, taxonomy);
    if (!insertResult.success) {
      console.error(`  ❌ Row ${rowNum}: Insert failed - ${insertResult.error}`);
      result.failed++;
      result.errors.push({
        row: rowNum,
        question: row.question_text.substring(0, 80),
        error: insertResult.error || 'Unknown error',
      });
    } else {
      console.log(`  ✅ Row ${rowNum}: Successfully inserted question ${insertResult.question_id}`);
      result.success++;
    }
  }

  return result;
}

async function saveErrorLog(filename: string, result: UploadResult): Promise<void> {
  if (result.errors.length === 0) {
    return;
  }

  // Ensure error log directory exists
  if (!fs.existsSync(ERROR_LOG_DIR)) {
    fs.mkdirSync(ERROR_LOG_DIR, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const errorLogPath = path.join(ERROR_LOG_DIR, `${filename}-errors-${timestamp}.json`);

  fs.writeFileSync(errorLogPath, JSON.stringify(result.errors, null, 2));
  console.log(`\n📝 Error log saved to: ${errorLogPath}`);
}

async function archiveSuccessfulUpload(filePath: string): Promise<void> {
  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const filename = path.basename(filePath);
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const archivePath = path.join(OUTPUT_DIR, `${timestamp}-${filename}`);

  fs.renameSync(filePath, archivePath);
  console.log(`\n📦 Archived to: ${archivePath}`);
}

async function main() {
  console.log('🚀 Four Sigma Question Upload Script\n');

  // Check if input directory exists
  if (!fs.existsSync(INPUT_DIR)) {
    console.error(`❌ Input directory not found: ${INPUT_DIR}`);
    process.exit(1);
  }

  // Find all CSV files in input directory
  const files = fs.readdirSync(INPUT_DIR).filter(f => f.endsWith('.csv'));

  if (files.length === 0) {
    console.log('ℹ️  No CSV files found in input directory');
    return;
  }

  console.log(`Found ${files.length} CSV file(s) to process`);

  // Process each file
  for (const file of files) {
    const filePath = path.join(INPUT_DIR, file);

    try {
      const result = await processCSV(filePath);

      // Print summary
      console.log('\n📊 Upload Summary:');
      console.log(`  ✅ Success: ${result.success}`);
      console.log(`  ⏭️  Skipped: ${result.skipped}`);
      console.log(`  ❌ Failed: ${result.failed}`);

      // Save error log if there were errors
      await saveErrorLog(file, result);

      // Archive file if there were successful uploads
      if (result.success > 0) {
        await archiveSuccessfulUpload(filePath);
      } else {
        console.log('\n⚠️  No successful uploads - file not archived');
      }
    } catch (error) {
      console.error(`\n❌ Fatal error processing ${file}:`, error);
    }
  }

  console.log('\n✨ Upload process complete!');
}

main().catch(console.error);
