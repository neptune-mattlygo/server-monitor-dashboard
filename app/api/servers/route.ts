import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getCurrentUser } from '@/lib/auth/session';
import { canCreate, canView } from '@/lib/auth/permissions';
import { encrypt } from '@/lib/crypto';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    if (!user || !canView(user, 'server')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const hostId = searchParams.get('host_id');

    let query = supabaseAdmin
      .from('servers')
      .select('*, hosts(id, name, location)');

    if (hostId) {
      query = query.eq('host_id', hostId);
    }

    const { data: servers, error } = await query.order('name');

    if (error) {
      throw error;
    }

    return NextResponse.json({ servers });
  } catch (error) {
    console.error('Get servers error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch servers' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    if (!user || !canCreate(user, 'server')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const { 
      name, 
      host_id, 
      current_status, 
      metadata, 
      bucket, 
      fmserver_name, 
      admin_url, 
      admin_username, 
      admin_password,
      backup_monitoring_excluded,
      backup_monitoring_disabled_reason,
      backup_monitoring_review_date
    } = body;

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    // Validate backup monitoring exclusion fields
    if (backup_monitoring_excluded) {
      if (!backup_monitoring_disabled_reason?.trim()) {
        return NextResponse.json(
          { error: 'Reason for disabling backup monitoring is required' },
          { status: 400 }
        );
      }
      if (!backup_monitoring_review_date) {
        return NextResponse.json(
          { error: 'Review date is required when backup monitoring is disabled' },
          { status: 400 }
        );
      }
    }

    const { data: server, error } = await supabaseAdmin
      .from('servers')
      .insert({
        name,
        host_id: host_id || null,
        current_status: current_status || 'up',
        metadata: metadata || {},
        bucket: bucket || null,
        fmserver_name: fmserver_name || null,
        admin_url: admin_url || null,
        admin_username: admin_username || null,
        admin_password: admin_password ? encrypt(admin_password) : null,
        backup_monitoring_excluded: backup_monitoring_excluded || false,
        backup_monitoring_disabled_reason: backup_monitoring_excluded ? backup_monitoring_disabled_reason : null,
        backup_monitoring_review_date: backup_monitoring_excluded ? backup_monitoring_review_date : null,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({ server }, { status: 201 });
  } catch (error) {
    console.error('Create server error:', error);
    return NextResponse.json(
      { error: 'Failed to create server' },
      { status: 500 }
    );
  }
}
