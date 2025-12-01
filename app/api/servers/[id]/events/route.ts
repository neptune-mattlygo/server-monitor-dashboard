import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getCurrentUser } from '@/lib/auth/session';
import { canView } from '@/lib/auth/permissions';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    
    if (!user || !canView(user, 'event')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const { searchParams } = new URL(request.url);

    // Get query parameters for filtering
    const eventType = searchParams.get('type');
    const eventSource = searchParams.get('source');
    const status = searchParams.get('status');
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const sort = searchParams.get('sort') || 'created_at';
    const order = searchParams.get('order') || 'desc';

    // Build query
    let query = supabaseAdmin
      .from('server_events')
      .select('*', { count: 'exact' })
      .eq('server_id', id);

    // Apply filters
    if (eventType) {
      query = query.eq('event_type', eventType);
    }
    if (eventSource) {
      query = query.eq('event_source', eventSource);
    }
    if (status) {
      query = query.eq('status', status);
    }
    if (from) {
      query = query.gte('created_at', from);
    }
    if (to) {
      query = query.lte('created_at', to);
    }

    // Apply sorting and pagination
    query = query.order(sort, { ascending: order === 'asc' });
    query = query.range(offset, offset + limit - 1);

    const { data: events, error, count } = await query;

    if (error) {
      throw error;
    }

    return NextResponse.json({
      events,
      pagination: {
        total: count || 0,
        limit,
        offset,
        hasMore: (count || 0) > offset + limit,
      },
    });
  } catch (error) {
    console.error('Get server events error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch server events' },
      { status: 500 }
    );
  }
}
