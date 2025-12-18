#!/usr/bin/env node

/**
 * Import Questions Script
 *
 * Imports questions from CSV files into Supabase database.
 * Handles:
 * - Creating units, domains, categories, subcategories (with smart deduplication)
 * - Inserting questions with proper foreign keys
 * - Creating question_subcategories junction records
 * - Skipping duplicate questions
 *
 * Usage:
 *   npm run import-questions -- --file ../questions/3-researched/1-generated-questions.csv
 *   npm run import-questions -- --file ../questions/3-researched/1-generated-questions.csv --dry-run
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { supabase, testConnection } from '../utils/supabase-client.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface CSVRow {
  question_text: string;
  answer_value: string;
  answer_unit: string;
  question_type: string;
  domain: string;
  category: string;
  subcategory: string;
  source_url: string;
  source_name: string;
  source_retrieved_at: string;
  answer_context?: string;
}

interface ImportStats {
  unitsCreated: number;
  unitsReused: number;
  domainsCreated: number;
  domainsReused: number;
  categoriesCreated: number;
  categoriesReused: number;
  subcategoriesCreated: number;
  subcategoriesReused: number;
  questionsCreated: number;
  questionsSkipped: number;
  junctionRecordsCreated: number;
  errors: string[];
}

// Cache for UUIDs to avoid repeated lookups
const uuidCache = {
  units: new Map<string, string>(),
  domains: new Map<string, string>(),
  categories: new Map<string, string>(),
  subcategories: new Map<string, string>(),
};

const stats: ImportStats = {
  unitsCreated: 0,
  unitsReused: 0,
  domainsCreated: 0,
  domainsReused: 0,
  categoriesCreated: 0,
  categoriesReused: 0,
  subcategoriesCreated: 0,
  subcategoriesReused: 0,
  questionsCreated: 0,
  questionsSkipped: 0,
  junctionRecordsCreated: 0,
  errors: [],
};

/**
 * Parse a single CSV line, handling quoted fields with commas
 */
function parseCSVLine(line: string): string[] {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      // Check for escaped quote ""
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++; // Skip next quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      values.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  // Don't forget the last value
  values.push(current.trim());

  return values;
}

/**
 * Parse CSV file
 */
function parseCSV(filePath: string): CSVRow[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n').filter(line => line.trim());

  if (lines.length < 2) {
    throw new Error('CSV file is empty or has no data rows');
  }

  const headers = parseCSVLine(lines[0]);
  const rows: CSVRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);

    if (values.length !== headers.length) {
      console.warn(`⚠️  Skipping malformed row ${i + 1} (got ${values.length} columns, expected ${headers.length})`);
      continue;
    }

    const row: any = {};
    headers.forEach((header, index) => {
      row[header.trim()] = values[index].replace(/^"|"$/g, '');
    });

    rows.push(row as CSVRow);
  }

  return rows;
}

/**
 * Find or create a unit
 */
async function findOrCreateUnit(unitName: string, dryRun: boolean): Promise<string> {
  // Check cache first
  if (uuidCache.units.has(unitName)) {
    stats.unitsReused++;
    return uuidCache.units.get(unitName)!;
  }

  // Check database
  const { data: existing } = await supabase
    .from('units')
    .select('id')
    .eq('name', unitName)
    .single();

  if (existing) {
    uuidCache.units.set(unitName, existing.id);
    stats.unitsReused++;
    return existing.id;
  }

  // Create new unit
  if (dryRun) {
    const dryRunId = `dry-run-unit-${unitName}`;
    uuidCache.units.set(unitName, dryRunId);
    stats.unitsCreated++;
    return dryRunId;
  }

  const { data: newUnit, error } = await supabase
    .from('units')
    .insert({
      name: unitName,
      symbol: null,
      description: null,
      display_format: 'number',
      decimal_places: 2,
      prefix_symbol: false,
      is_active: true,
    })
    .select('id')
    .single();

  if (error) {
    stats.errors.push(`Failed to create unit "${unitName}": ${error.message}`);
    throw error;
  }

  uuidCache.units.set(unitName, newUnit.id);
  stats.unitsCreated++;
  return newUnit.id;
}

/**
 * Generate slug from name
 */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Find or create a domain
 */
async function findOrCreateDomain(domainName: string, dryRun: boolean): Promise<string> {
  if (uuidCache.domains.has(domainName)) {
    stats.domainsReused++;
    return uuidCache.domains.get(domainName)!;
  }

  const slug = slugify(domainName);
  const { data: existing } = await supabase
    .from('domains')
    .select('id')
    .eq('slug', slug)
    .single();

  if (existing) {
    uuidCache.domains.set(domainName, existing.id);
    stats.domainsReused++;
    return existing.id;
  }

  if (dryRun) {
    const dryRunId = `dry-run-domain-${domainName}`;
    uuidCache.domains.set(domainName, dryRunId);
    stats.domainsCreated++;
    return dryRunId;
  }

  const { data: newDomain, error } = await supabase
    .from('domains')
    .insert({
      name: domainName,
      slug,
      description: null,
      icon_name: null,
      color: null,
      display_order: 0,
      is_active: true,
    })
    .select('id')
    .single();

  if (error) {
    stats.errors.push(`Failed to create domain "${domainName}": ${error.message}`);
    throw error;
  }

  uuidCache.domains.set(domainName, newDomain.id);
  stats.domainsCreated++;
  return newDomain.id;
}

/**
 * Find or create a category
 */
async function findOrCreateCategory(
  categoryName: string,
  domainId: string,
  dryRun: boolean
): Promise<string> {
  const cacheKey = `${domainId}:${categoryName}`;
  if (uuidCache.categories.has(cacheKey)) {
    stats.categoriesReused++;
    return uuidCache.categories.get(cacheKey)!;
  }

  const slug = slugify(categoryName);
  const { data: existing } = await supabase
    .from('categories')
    .select('id')
    .eq('slug', slug)
    .eq('domain_id', domainId)
    .single();

  if (existing) {
    uuidCache.categories.set(cacheKey, existing.id);
    stats.categoriesReused++;
    return existing.id;
  }

  if (dryRun) {
    const dryRunId = `dry-run-category-${categoryName}`;
    uuidCache.categories.set(cacheKey, dryRunId);
    stats.categoriesCreated++;
    return dryRunId;
  }

  const { data: newCategory, error } = await supabase
    .from('categories')
    .insert({
      domain_id: domainId,
      name: categoryName,
      slug,
      description: null,
      display_order: 0,
      is_active: true,
    })
    .select('id')
    .single();

  if (error) {
    stats.errors.push(`Failed to create category "${categoryName}": ${error.message}`);
    throw error;
  }

  uuidCache.categories.set(cacheKey, newCategory.id);
  stats.categoriesCreated++;
  return newCategory.id;
}

/**
 * Find or create a subcategory
 */
async function findOrCreateSubcategory(
  subcategoryName: string,
  categoryId: string,
  categoryName: string,
  dryRun: boolean
): Promise<string> {
  const cacheKey = `${categoryId}:${subcategoryName}`;
  if (uuidCache.subcategories.has(cacheKey)) {
    stats.subcategoriesReused++;
    return uuidCache.subcategories.get(cacheKey)!;
  }

  // Make slug globally unique by prefixing with category name
  const slug = slugify(`${categoryName}-${subcategoryName}`);
  const { data: existing } = await supabase
    .from('subcategories')
    .select('id')
    .eq('name', subcategoryName)
    .eq('category_id', categoryId)
    .single();

  if (existing) {
    uuidCache.subcategories.set(cacheKey, existing.id);
    stats.subcategoriesReused++;
    return existing.id;
  }

  if (dryRun) {
    const dryRunId = `dry-run-subcategory-${subcategoryName}`;
    uuidCache.subcategories.set(cacheKey, dryRunId);
    stats.subcategoriesCreated++;
    return dryRunId;
  }

  const { data: newSubcategory, error } = await supabase
    .from('subcategories')
    .insert({
      category_id: categoryId,
      name: subcategoryName,
      slug,
      description: null,
      display_order: 0,
      is_active: true,
    })
    .select('id')
    .single();

  if (error) {
    stats.errors.push(`Failed to create subcategory "${subcategoryName}": ${error.message}`);
    throw error;
  }

  uuidCache.subcategories.set(cacheKey, newSubcategory.id);
  stats.subcategoriesCreated++;
  return newSubcategory.id;
}

/**
 * Import a single question
 */
async function importQuestion(row: CSVRow, dryRun: boolean): Promise<void> {
  try {
    // Check if question already exists
    const { data: existing } = await supabase
      .from('questions')
      .select('id')
      .eq('question_text', row.question_text)
      .single();

    if (existing) {
      console.log(`⏭️  Skipping duplicate: "${row.question_text.substring(0, 50)}..."`);
      stats.questionsSkipped++;
      return;
    }

    // 1. Find or create unit
    const unitId = await findOrCreateUnit(row.answer_unit, dryRun);

    // 2. Find or create domain → category → subcategories
    const domainId = await findOrCreateDomain(row.domain, dryRun);
    const categoryId = await findOrCreateCategory(row.category, domainId, dryRun);

    // Parse semicolon-separated subcategories
    const subcategoryNames = row.subcategory
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    const subcategoryIds: string[] = [];
    for (const subcategoryName of subcategoryNames) {
      const subcategoryId = await findOrCreateSubcategory(
        subcategoryName,
        categoryId,
        row.category,
        dryRun
      );
      subcategoryIds.push(subcategoryId);
    }

    // 3. Insert question
    if (dryRun) {
      console.log(`✅ [DRY RUN] Would create question: "${row.question_text.substring(0, 50)}..."`);
      stats.questionsCreated++;
      stats.junctionRecordsCreated += subcategoryIds.length;
      return;
    }

    const { data: newQuestion, error: questionError } = await supabase
      .from('questions')
      .insert({
        unit_id: unitId,
        question_text: row.question_text,
        answer_value: parseFloat(row.answer_value),
        source_url: row.source_url,
        source_name: row.source_name,
        source_retrieved_at: row.source_retrieved_at || null,
        question_type: row.question_type,
        creation_source: 'automated',
        created_by_user_id: null,
        is_active: true,
        answer_context: row.answer_context || null,
      })
      .select('id')
      .single();

    if (questionError) {
      stats.errors.push(`Failed to create question "${row.question_text}": ${questionError.message}`);
      throw questionError;
    }

    // 4. Create junction records
    const junctionRecords = subcategoryIds.map((subcategoryId, index) => ({
      question_id: newQuestion.id,
      subcategory_id: subcategoryId,
      is_primary: index === 0, // First subcategory is primary
    }));

    const { error: junctionError } = await supabase
      .from('question_subcategories')
      .insert(junctionRecords);

    if (junctionError) {
      stats.errors.push(`Failed to create junction records for "${row.question_text}": ${junctionError.message}`);
      throw junctionError;
    }

    console.log(`✅ Created question: "${row.question_text.substring(0, 50)}..."`);
    stats.questionsCreated++;
    stats.junctionRecordsCreated += subcategoryIds.length;

  } catch (error: any) {
    console.error(`❌ Error importing question: ${error.message}`);
    stats.errors.push(`Question "${row.question_text}": ${error.message}`);
  }
}

/**
 * Main import function
 */
async function main() {
  const args = process.argv.slice(2);
  const fileIndex = args.indexOf('--file');
  const dryRun = args.includes('--dry-run');

  if (fileIndex === -1 || !args[fileIndex + 1]) {
    console.error('❌ Missing required --file argument');
    console.error('Usage: npm run import-questions -- --file <path-to-csv> [--dry-run]');
    process.exit(1);
  }

  const filePath = path.resolve(__dirname, '../..', args[fileIndex + 1]);

  if (!fs.existsSync(filePath)) {
    console.error(`❌ File not found: ${filePath}`);
    process.exit(1);
  }

  console.log('\n🚀 Four Sigma Question Import');
  console.log('================================');
  console.log(`📁 File: ${filePath}`);
  console.log(`🏃 Mode: ${dryRun ? 'DRY RUN' : 'LIVE'}`);
  console.log('');

  // Test connection
  if (!dryRun) {
    const connected = await testConnection();
    if (!connected) {
      process.exit(1);
    }
  }

  // Parse CSV
  console.log('📖 Parsing CSV...');
  const rows = parseCSV(filePath);
  console.log(`   Found ${rows.length} questions\n`);

  // Import questions
  console.log('📥 Importing questions...\n');
  for (const row of rows) {
    await importQuestion(row, dryRun);
  }

  // Print summary
  console.log('\n📊 Import Summary');
  console.log('================================');
  console.log(`Units:         ${stats.unitsCreated} created, ${stats.unitsReused} reused`);
  console.log(`Domains:       ${stats.domainsCreated} created, ${stats.domainsReused} reused`);
  console.log(`Categories:    ${stats.categoriesCreated} created, ${stats.categoriesReused} reused`);
  console.log(`Subcategories: ${stats.subcategoriesCreated} created, ${stats.subcategoriesReused} reused`);
  console.log(`Questions:     ${stats.questionsCreated} created, ${stats.questionsSkipped} skipped`);
  console.log(`Junction:      ${stats.junctionRecordsCreated} records created`);

  if (stats.errors.length > 0) {
    console.log(`\n⚠️  Errors: ${stats.errors.length}`);
    stats.errors.forEach(err => console.log(`   - ${err}`));
  }

  console.log('\n✨ Import complete!\n');
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
