// Sync local servers to production (clearing 97k+ auto-created servers)
const { createClient } = require('@supabase/supabase-js');
const { execSync } = require('child_process');
require('dotenv').config({ path: '.env.production' });

const prodUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const prodKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!prodUrl || !prodKey) {
  console.error('Missing production Supabase credentials in .env.production');
  process.exit(1);
}

const supabase = createClient(prodUrl, prodKey, {
  auth: { persistSession: false }
});

async function syncServers() {
  try {
    // Step 1: Get local servers
    console.log('📥 Exporting local servers...');
    const localServersSQL = execSync(
      'docker exec -i supabase_db_server-monitor psql -U postgres -d postgres -t -A -F"," -c "SELECT id, name, host_id, server_type, ip_address, current_status, last_status_change, metadata::text, created_at, updated_at, external_id, url, last_check_at, response_time_ms, region_id, bucket FROM servers;"',
      { encoding: 'utf8' }
    );

    const localServers = localServersSQL.trim().split('\n').map(line => {
      const [id, name, host_id, server_type, ip_address, current_status, last_status_change, metadata, created_at, updated_at, external_id, url, last_check_at, response_time_ms, region_id, bucket] = line.split(',');
      return {
        id,
        name,
        host_id: host_id === '\\N' ? null : host_id,
        server_type,
        ip_address: ip_address === '\\N' ? null : ip_address,
        current_status,
        last_status_change,
        metadata: metadata === '\\N' ? null : JSON.parse(metadata),
        created_at,
        updated_at,
        external_id: external_id === '\\N' ? null : external_id,
        url: url === '\\N' ? null : url,
        last_check_at: last_check_at === '\\N' ? null : last_check_at,
        response_time_ms: response_time_ms === '\\N' ? null : parseInt(response_time_ms),
        region_id: region_id === '\\N' ? null : region_id,
        bucket: bucket === '\\N' ? null : bucket,
      };
    });

    console.log(`Found ${localServers.length} local servers`);

    // Step 2: Check production count
    const { count: prodCount } = await supabase
      .from('servers')
      .select('*', { count: 'exact', head: true });

    console.log(`\n⚠️  Production has ${prodCount} servers`);
    console.log('⚠️  This will DELETE all production servers and replace with local servers');
    console.log('\nProceeding in 3 seconds... (Ctrl+C to cancel)');
    
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Step 3: Clear production servers (CASCADE will clear events too)
    console.log('\n🗑️  Clearing production servers...');
    const { error: deleteError } = await supabase
      .from('servers')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

    if (deleteError) {
      console.error('Error clearing servers:', deleteError);
      process.exit(1);
    }

    // Step 4: Insert local servers
    console.log(`\n📤 Inserting ${localServers.length} local servers to production...`);
    const { error: insertError } = await supabase
      .from('servers')
      .insert(localServers);

    if (insertError) {
      console.error('Error inserting servers:', insertError);
      process.exit(1);
    }

    // Step 5: Verify
    const { count: newCount } = await supabase
      .from('servers')
      .select('*', { count: 'exact', head: true });

    console.log(`\n✅ Success! Production now has ${newCount} servers`);

  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

syncServers();
