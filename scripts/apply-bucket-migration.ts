import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

async function applyMigration() {
  // Use service role key for admin access
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in environment variables');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // Read migration file
  const migrationPath = path.join(
    __dirname,
    '..',
    'supabase',
    'migrations',
    '20241210000000_add_bucket_to_servers.sql'
  );

  console.log('Reading migration file:', migrationPath);
  const sql = fs.readFileSync(migrationPath, 'utf-8');

  console.log('Applying migration...');
  console.log('SQL:', sql);

  try {
    // Execute each statement separately
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    for (const statement of statements) {
      console.log('\nExecuting:', statement.substring(0, 100) + '...');
      const { data, error } = await supabase.rpc('exec_sql', {
        sql_query: statement + ';'
      });

      if (error) {
        // Try direct query if RPC doesn't exist
        const { error: directError } = await supabase
          .from('servers')
          .select('bucket')
          .limit(1);
        
        if (directError && directError.code === '42703') {
          // Column doesn't exist, need to run migration manually
          console.error('\n⚠️  Cannot apply migration automatically.');
          console.error('Please run this SQL in Supabase SQL Editor:');
          console.error('\n' + sql);
          process.exit(1);
        }
        
        if (error.message.includes('already exists')) {
          console.log('✓ Already applied (column or index exists)');
        } else {
          console.error('Error:', error);
          throw error;
        }
      } else {
        console.log('✓ Success');
      }
    }

    // Verify column exists
    const { data, error } = await supabase
      .from('servers')
      .select('bucket')
      .limit(1);

    if (error) {
      console.error('\n❌ Migration may not have applied correctly');
      console.error('Error checking bucket column:', error);
      console.error('\nPlease run this SQL manually in Supabase SQL Editor:');
      console.error('\n' + sql);
      process.exit(1);
    }

    console.log('\n✅ Migration applied successfully!');
    console.log('The "bucket" column is now available in the servers table.');
    
  } catch (err) {
    console.error('\n❌ Error applying migration:', err);
    console.error('\nPlease run this SQL manually in Supabase SQL Editor:');
    console.error('\n' + sql);
    process.exit(1);
  }
}

applyMigration();
