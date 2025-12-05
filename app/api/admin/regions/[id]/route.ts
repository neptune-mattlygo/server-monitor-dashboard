import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getCurrentUser } from '@/lib/auth/session';
import { isAdmin } from '@/lib/auth/permissions';

export const dynamic = 'force-dynamic';

// PATCH /api/admin/regions/[id] - Update region
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user || !isAdmin(user)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const { name, slug, description, display_order, is_active } = body;

    const supabase = supabaseAdmin;
    const { data: region, error } = await supabase
      .from('regions')
      .update({
        ...(name !== undefined && { name }),
        ...(slug !== undefined && { slug }),
        ...(description !== undefined && { description }),
        ...(display_order !== undefined && { display_order }),
        ...(is_active !== undefined && { is_active }),
      })
      .eq('id', params.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating region:', error);
      if (error.code === '23505') {
        return NextResponse.json({ error: 'Region name or slug already exists' }, { status: 409 });
      }
      return NextResponse.json({ error: 'Failed to update region' }, { status: 500 });
    }

    return NextResponse.json({ region });
  } catch (error) {
    console.error('Error in PATCH /api/admin/regions/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/admin/regions/[id] - Delete region
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user || !isAdmin(user)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const supabase = supabaseAdmin;
    
    // Check if region has servers
    const { count } = await supabase
      .from('servers')
      .select('*', { count: 'exact', head: true })
      .eq('region_id', params.id);

    if (count && count > 0) {
      return NextResponse.json(
        { error: `Cannot delete region with ${count} server(s). Please reassign or remove servers first.` },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('regions')
      .delete()
      .eq('id', params.id);

    if (error) {
      console.error('Error deleting region:', error);
      return NextResponse.json({ error: 'Failed to delete region' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/admin/regions/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
