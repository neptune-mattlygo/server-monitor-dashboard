import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getCurrentUser } from '@/lib/auth/session';
import { canCreate, canView } from '@/lib/auth/permissions';

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
    const { name, host_id, server_type, ip_address, current_status, metadata } = body;

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const { data: server, error } = await supabaseAdmin
      .from('servers')
      .insert({
        name,
        host_id: host_id || null,
        server_type: server_type || null,
        ip_address: ip_address || null,
        current_status: current_status || 'up',
        metadata: metadata || {},
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
