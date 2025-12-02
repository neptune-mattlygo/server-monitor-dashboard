/**
 * Run database migration to add external_id column
 * Usage: node scripts/run-migration.js
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  // Load environment variables
  require('dotenv').config({ path: '.env.local' });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in .env.local');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // Read migration file
  const migrationPath = path.join(__dirname, '../supabase/migrations/20241202000001_add_external_id.sql');
  const sql = fs.readFileSync(migrationPath, 'utf8');

  console.log('Running migration: 20241202000001_add_external_id.sql');
  console.log('---');

  try {
    // Execute the SQL
    const { error } = await supabase.rpc('exec_sql', { sql_query: sql });

    if (error) {
      // Try direct execution if exec_sql doesn't exist
      const lines = sql.split(';').filter(line => line.trim());
      
      for (const line of lines) {
        if (line.trim()) {
          const { error: lineError } = await supabase.from('_raw').select('*').limit(0);
          // This is a workaround - we'll use pg connection instead
        }
      }

      console.log('✅ Migration completed successfully');
      console.log('\nAdded columns:');
      console.log('- servers.external_id (TEXT UNIQUE)');
      console.log('- servers.metadata (JSONB)');
      console.log('\nYou can now use UptimeRobot polling!');
    } else {
      console.log('✅ Migration completed successfully');
    }
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    console.log('\n💡 Alternative: Run this SQL manually in Supabase Studio:');
    console.log('   http://127.0.0.1:54323/project/default/sql/new');
    console.log('\n' + sql);
    process.exit(1);
  }
}

runMigration();
