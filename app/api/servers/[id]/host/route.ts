import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getCurrentUser } from '@/lib/auth/session';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has permission to edit (admin or editor)
    if (user.role !== 'admin' && user.role !== 'editor') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { host_id } = await request.json();

    // Validate host_id if provided
    if (host_id) {
      const { data: host } = await supabaseAdmin
        .from('hosts')
        .select('id')
        .eq('id', host_id)
        .single();

      if (!host) {
        return NextResponse.json({ error: 'Host not found' }, { status: 404 });
      }
    }

    const { id } = await params;

    // Update the server's host
    const { data: server, error: updateError } = await supabaseAdmin
      .from('servers')
      .update({ host_id })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating server host:', updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // Create audit log
    await supabaseAdmin.from('audit_logs').insert({
      user_id: user.id,
      action: 'update',
      resource_type: 'server',
      resource_id: id,
      details: { field: 'host_id', new_value: host_id },
    });

    return NextResponse.json({ success: true, server });
  } catch (error) {
    console.error('Error in PATCH /api/servers/[id]/host:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
