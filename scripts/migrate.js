const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  try {
    console.log('Running migration to add region_id to hosts...');
    
    // Execute the SQL directly
    const { data, error } = await supabase.rpc('exec_sql', {
      query: `
        ALTER TABLE hosts 
        ADD COLUMN IF NOT EXISTS region_id UUID REFERENCES regions(id) ON DELETE SET NULL;
        
        CREATE INDEX IF NOT EXISTS idx_hosts_region_id ON hosts(region_id);
      `
    });
    
    if (error) {
      console.error('Migration error:', error);
      process.exit(1);
    }
    
    console.log('✓ Migration completed successfully!');
    console.log('Please restart your development server.');
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

runMigration();
