import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET() {
  try {
    // Add region_id column to hosts table
    const { error: alterError } = await supabaseAdmin
      .from('hosts')
      .select('region_id')
      .limit(1);
    
    if (alterError && alterError.code === 'PGRST116') {
      // Column doesn't exist, we need to add it via raw SQL
      // Since we can't execute DDL directly, return instructions
      return NextResponse.json({ 
        error: 'Migration needs to be run manually',
        instructions: `
Please run this SQL in your Supabase SQL Editor (http://127.0.0.1:54323):

ALTER TABLE hosts 
ADD COLUMN region_id UUID REFERENCES regions(id) ON DELETE SET NULL;

CREATE INDEX idx_hosts_region_id ON hosts(region_id);
        `
      }, { status: 400 });
    }
    
    // Check if column exists
    return NextResponse.json({ 
      success: true, 
      message: 'Column region_id already exists in hosts table' 
    });
    
  } catch (err) {
    console.error('Error checking migration:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
