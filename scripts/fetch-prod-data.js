#!/usr/bin/env node

/**
 * Fetches production data from Supabase and generates a seed.sql file
 * Usage: node scripts/fetch-prod-data.js
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.production' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Missing Supabase credentials in .env.production');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fetchAllData(table, orderBy = 'id') {
  console.log(`Fetching ${table}...`);
  const { data, error } = await supabase
    .from(table)
    .select('*')
    .order(orderBy);
  
  if (error) {
    console.error(`Error fetching ${table}:`, error);
    return [];
  }
  
  console.log(`  ✓ Fetched ${data.length} rows from ${table}`);
  return data;
}

function escapeValue(value) {
  if (value === null || value === undefined) {
    return 'NULL';
  }
  if (typeof value === 'boolean') {
    return value ? 'true' : 'false';
  }
  if (typeof value === 'number') {
    return value;
  }
  if (typeof value === 'object') {
    return `'${JSON.stringify(value).replace(/'/g, "''")}'::jsonb`;
  }
  // String - escape single quotes
  return `'${String(value).replace(/'/g, "''")}'`;
}

function generateInsertSQL(table, rows) {
  if (rows.length === 0) return '';
  
  const columns = Object.keys(rows[0]);
  let sql = `\n-- ${table}\n`;
  
  for (const row of rows) {
    const values = columns.map(col => escapeValue(row[col])).join(', ');
    sql += `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${values});\n`;
  }
  
  return sql;
}

async function main() {
  console.log('Connecting to production Supabase...\n');
  
  // Fetch all tables
  const hosts = await fetchAllData('hosts', 'id');
  const servers = await fetchAllData('servers', 'id');
  const serverEvents = await fetchAllData('server_events', 'created_at');
  const userProfiles = await fetchAllData('profiles', 'id');
  const auditLog = await fetchAllData('audit_logs', 'created_at');
  
  console.log('\nGenerating seed.sql...');
  
  let seedSQL = `-- Production data export
-- Generated: ${new Date().toISOString()}
-- 
-- This file contains production data for local development
-- Run 'npx supabase db reset' to apply this seed data

-- Disable triggers and constraints for faster inserts
SET session_replication_role = replica;

-- Clear existing data
TRUNCATE hosts, servers, server_events, profiles, audit_logs CASCADE;
`;

  // Generate INSERT statements
  seedSQL += generateInsertSQL('hosts', hosts);
  seedSQL += generateInsertSQL('servers', servers);
  seedSQL += generateInsertSQL('server_events', serverEvents);
  seedSQL += generateInsertSQL('profiles', userProfiles);
  seedSQL += generateInsertSQL('audit_logs', auditLog);
  
  seedSQL += `\n-- Re-enable triggers and constraints
SET session_replication_role = DEFAULT;
`;

  // Write to file
  const seedPath = path.join(__dirname, '..', 'supabase', 'seed.sql');
  fs.writeFileSync(seedPath, seedSQL);
  
  console.log(`\n✓ Seed file created: ${seedPath}`);
  console.log('\nTo apply this seed data to your local database, run:');
  console.log('  npx supabase db reset');
}

main().catch(console.error);
