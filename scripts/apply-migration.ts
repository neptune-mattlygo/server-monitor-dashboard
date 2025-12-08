import { supabaseAdmin } from '../lib/supabase';

async function applyMigration() {
  try {
    console.log('Applying migration to add region_id to hosts table...');
    
    // Add region_id column to hosts
    const { error: alterError } = await supabaseAdmin.rpc('exec_sql', {
      sql: `
        ALTER TABLE hosts 
        ADD COLUMN IF NOT EXISTS region_id UUID REFERENCES regions(id) ON DELETE SET NULL;
      `
    });
    
    if (alterError) {
      console.error('Error adding column:', alterError);
    } else {
      console.log('✓ Column added successfully');
    }
    
    // Create index
    const { error: indexError } = await supabaseAdmin.rpc('exec_sql', {
      sql: `
        CREATE INDEX IF NOT EXISTS idx_hosts_region_id ON hosts(region_id);
      `
    });
    
    if (indexError) {
      console.error('Error creating index:', indexError);
    } else {
      console.log('✓ Index created successfully');
    }
    
    console.log('Migration complete!');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

applyMigration();
