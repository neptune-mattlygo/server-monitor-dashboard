import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getCurrentUser } from '@/lib/auth/session';
import { isAdmin } from '@/lib/auth/permissions';

export const dynamic = 'force-dynamic';

// POST /api/admin/incidents/[id]/updates - Add incident update
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || !isAdmin(user)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { id } = await params;

    const body = await request.json();
    const { message, update_type } = body;

    if (!message || !update_type) {
      return NextResponse.json(
        { error: 'Message and update_type are required' },
        { status: 400 }
      );
    }

    const { data: update, error } = await supabaseAdmin
      .from('incident_updates')
      .insert({
        incident_id: id,
        message,
        update_type,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating incident update:', error);
      return NextResponse.json({ error: 'Failed to create update' }, { status: 500 });
    }

    // If update type is 'resolved', update incident status
    if (update_type === 'resolved') {
      await supabaseAdmin
        .from('status_incidents')
        .update({
          status: 'resolved',
          resolved_at: new Date().toISOString(),
        })
        .eq('id', id);
    }

    return NextResponse.json({ update }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/admin/incidents/[id]/updates:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
