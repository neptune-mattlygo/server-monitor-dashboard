import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getCurrentUser } from '@/lib/auth/session';
import { isAdmin } from '@/lib/auth/permissions';

export const dynamic = 'force-dynamic';

// GET /api/admin/regions - List all regions
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !isAdmin(user)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const supabase = supabaseAdmin;
    const { data: regions, error } = await supabase
      .from('regions')
      .select('*')
      .order('display_order', { ascending: true });

    if (error) {
      console.error('Error fetching regions:', error);
      return NextResponse.json({ error: 'Failed to fetch regions' }, { status: 500 });
    }

    // Get server counts for each region
    const regionsWithCount = await Promise.all(
      (regions || []).map(async (region) => {
        const { count } = await supabase
          .from('servers')
          .select('*', { count: 'exact', head: true })
          .eq('region_id', region.id);
        return { ...region, server_count: count || 0 };
      })
    );

    return NextResponse.json({ regions: regionsWithCount });
  } catch (error) {
    console.error('Error in GET /api/admin/regions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/admin/regions - Create new region
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !isAdmin(user)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const { name, slug, description, display_order, is_active } = body;

    if (!name || !slug) {
      return NextResponse.json({ error: 'Name and slug are required' }, { status: 400 });
    }

    // Generate slug from name if not provided
    const finalSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

    const supabase = supabaseAdmin;
    const { data: region, error } = await supabase
      .from('regions')
      .insert({
        name,
        slug: finalSlug,
        description,
        display_order: display_order ?? 0,
        is_active: is_active ?? true,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating region:', error);
      if (error.code === '23505') {
        return NextResponse.json({ error: 'Region name or slug already exists' }, { status: 409 });
      }
      return NextResponse.json({ error: 'Failed to create region' }, { status: 500 });
    }

    return NextResponse.json({ region }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/admin/regions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
