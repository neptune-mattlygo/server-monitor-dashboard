import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { isAdmin } from '@/lib/auth/permissions';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

/**
 * POST - Suppress file size alerts for a specific backup file
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !isAdmin(user)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const { event_id, suppressed } = body;

    if (!event_id) {
      return NextResponse.json({ error: 'event_id is required' }, { status: 400 });
    }

    // Update the server event to suppress/enable alerts
    const { data, error } = await supabaseAdmin
      .from('server_events')
      .update({ backup_file_size_alert_suppressed: suppressed === true })
      .eq('id', event_id)
      .select('id, backup_database, backup_file_size')
      .single();

    if (error) {
      console.error('Failed to update alert suppression:', error);
      return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      event: data,
      message: suppressed 
        ? `Alerts suppressed for ${data.backup_database}`
        : `Alerts enabled for ${data.backup_database}`
    });
  } catch (error: any) {
    console.error('Alert suppression error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * GET - Get list of backup events with small files
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !isAdmin(user)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const SMALL_FILE_THRESHOLD = 1 * 1024 * 1024; // 1MB

    // Get recent backup events with small files
    const { data, error } = await supabaseAdmin
      .from('server_events')
      .select(`
        id,
        created_at,
        backup_database,
        backup_file_size,
        backup_file_size_alert_suppressed,
        server:servers(id, name)
      `)
      .eq('event_type', 'backup')
      .ilike('backup_database', '%.fmp12')
      .lt('backup_file_size', SMALL_FILE_THRESHOLD)
      .not('backup_file_size', 'is', null)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      console.error('Failed to fetch small file events:', error);
      return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      events: data,
      threshold_mb: SMALL_FILE_THRESHOLD / (1024 * 1024)
    });
  } catch (error: any) {
    console.error('Get small files error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
