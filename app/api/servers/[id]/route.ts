import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getCurrentUser } from '@/lib/auth/session';
import { canView, canUpdate, canDelete } from '@/lib/auth/permissions';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    
    if (!user || !canView(user, 'server')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const { data: server, error } = await supabaseAdmin
      .from('servers')
      .select('*, hosts(id, name, location)')
      .eq('id', id)
      .single();

    if (error || !server) {
      return NextResponse.json({ error: 'Server not found' }, { status: 404 });
    }

    return NextResponse.json({ server });
  } catch (error) {
    console.error('Get server error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch server' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    
    if (!user || !canUpdate(user, 'server')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { name, host_id, server_type, ip_address, current_status, metadata } = body;

    // Get the current server state for comparison
    const { data: currentServer } = await supabaseAdmin
      .from('servers')
      .select('current_status, name')
      .eq('id', id)
      .single();

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (host_id !== undefined) updateData.host_id = host_id;
    if (server_type !== undefined) updateData.server_type = server_type;
    if (ip_address !== undefined) updateData.ip_address = ip_address;
    if (current_status !== undefined) {
      updateData.current_status = current_status;
      updateData.last_status_change = new Date().toISOString();
    }
    if (metadata !== undefined) updateData.metadata = metadata;

    const { data: server, error } = await supabaseAdmin
      .from('servers')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Log event if status was manually changed
    if (current_status !== undefined && currentServer && current_status !== currentServer.current_status) {
      await supabaseAdmin.from('server_events').insert({
        server_id: id,
        event_type: 'status_change',
        event_source: 'manual',
        old_status: currentServer.current_status,
        new_status: current_status,
        status: current_status,
        message: `Status manually changed from ${currentServer.current_status} to ${current_status}`,
        payload: {
          changed_by: user.id,
          changed_by_email: user.email,
          changed_at: new Date().toISOString(),
        },
      });
    }

    return NextResponse.json({ server });
  } catch (error) {
    console.error('Update server error:', error);
    return NextResponse.json(
      { error: 'Failed to update server' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    
    if (!user || !canDelete(user, 'server')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { id } = await params;

    const { error } = await supabaseAdmin
      .from('servers')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete server error:', error);
    return NextResponse.json(
      { error: 'Failed to delete server' },
      { status: 500 }
    );
  }
}
