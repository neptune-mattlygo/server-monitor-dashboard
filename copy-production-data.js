const { createClient } = require('@supabase/supabase-js');

// Production Supabase
const prodSupabase = createClient(
  'https://kwwqylugttzcwgxoamdw.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt3d3F5bHVndHR6Y3dneG9hbWR3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDk0NjAzMCwiZXhwIjoyMDgwNTIyMDMwfQ.nsAO3w-sItLq2U33AsGKJWLfM-W9dvFyXxt5_Teqnl4'
);

// Local Supabase
const localSupabase = createClient(
  'http://127.0.0.1:54321',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'
);

async function copyServerEvents() {
  console.log('Fetching production server_events...');
  
  let allEvents = [];
  let page = 0;
  const pageSize = 1000;
  let hasMore = true;

  // Fetch all events in batches
  while (hasMore) {
    const { data, error } = await prodSupabase
      .from('server_events')
      .select('*')
      .order('created_at', { ascending: true })
      .range(page * pageSize, (page + 1) * pageSize - 1);

    if (error) {
      console.error('Error fetching from production:', error);
      break;
    }

    if (data && data.length > 0) {
      allEvents = allEvents.concat(data);
      console.log(`Fetched ${data.length} events (total: ${allEvents.length})`);
      page++;
      hasMore = data.length === pageSize;
    } else {
      hasMore = false;
    }
  }

  console.log(`\nTotal events fetched: ${allEvents.length}`);

  if (allEvents.length === 0) {
    console.log('No events to copy');
    return;
  }

  // Clear local server_events table first
  console.log('\nClearing local server_events table...');
  const { error: deleteError } = await localSupabase
    .from('server_events')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

  if (deleteError) {
    console.error('Error clearing local table:', deleteError);
  } else {
    console.log('Local table cleared');
  }

  // Insert in batches
  console.log('\nInserting events into local database...');
  const batchSize = 500;
  for (let i = 0; i < allEvents.length; i += batchSize) {
    const batch = allEvents.slice(i, i + batchSize);
    
    const { error: insertError } = await localSupabase
      .from('server_events')
      .insert(batch);

    if (insertError) {
      console.error(`Error inserting batch ${i / batchSize + 1}:`, insertError);
    } else {
      console.log(`Inserted batch ${i / batchSize + 1} (${batch.length} events)`);
    }
  }

  console.log('\n✅ Data copy complete!');
}

copyServerEvents().catch(console.error);
