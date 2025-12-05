import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getCurrentUser } from '@/lib/auth/session';
import { isAdmin } from '@/lib/auth/permissions';

export const dynamic = 'force-dynamic';

// GET /api/admin/clients - List clients with filters
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !isAdmin(user)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const filter = searchParams.get('filter'); // verified, unverified, unsubscribed, all

    let query = supabaseAdmin
      .from('clients')
      .select(`
        *,
        client_subscriptions (
          id,
          subscription_type,
          notify_on_status
        )
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (filter === 'verified') {
      query = query.eq('is_verified', true).is('unsubscribed_at', null);
    } else if (filter === 'unverified') {
      query = query.eq('is_verified', false);
    } else if (filter === 'unsubscribed') {
      query = query.not('unsubscribed_at', 'is', null);
    }

    const { data: clients, error, count } = await query;

    if (error) {
      console.error('Error fetching clients:', error);
      return NextResponse.json({ error: 'Failed to fetch clients' }, { status: 500 });
    }

    return NextResponse.json({ clients, total: count, limit, offset });
  } catch (error) {
    console.error('Error in GET /api/admin/clients:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
