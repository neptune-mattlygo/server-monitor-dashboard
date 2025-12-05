import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getCurrentUser } from '@/lib/auth/session';
import { isAdmin } from '@/lib/auth/permissions';

export const dynamic = 'force-dynamic';

// GET /api/admin/config - Get status page configuration
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !isAdmin(user)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { data: config, error } = await supabaseAdmin
      .from('status_page_config')
      .select('*')
      .single();

    if (error) {
      console.error('Error fetching config:', error);
      return NextResponse.json({ error: 'Failed to fetch configuration' }, { status: 500 });
    }

    return NextResponse.json({ config });
  } catch (error) {
    console.error('Error in GET /api/admin/config:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/admin/config - Update status page configuration
export async function PATCH(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !isAdmin(user)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const {
      company_name,
      logo_url,
      primary_color,
      favicon_url,
      custom_domain,
      support_email,
      support_url,
      twitter_handle,
      show_uptime_percentage,
    } = body;

    const updateData: any = {};
    if (company_name !== undefined) updateData.company_name = company_name;
    if (logo_url !== undefined) updateData.logo_url = logo_url;
    if (primary_color !== undefined) updateData.primary_color = primary_color;
    if (favicon_url !== undefined) updateData.favicon_url = favicon_url;
    if (custom_domain !== undefined) updateData.custom_domain = custom_domain;
    if (support_email !== undefined) updateData.support_email = support_email;
    if (support_url !== undefined) updateData.support_url = support_url;
    if (twitter_handle !== undefined) updateData.twitter_handle = twitter_handle;
    if (show_uptime_percentage !== undefined) updateData.show_uptime_percentage = show_uptime_percentage;

    // Get the existing config ID
    const { data: existing } = await supabaseAdmin
      .from('status_page_config')
      .select('id')
      .single();

    const { data: config, error } = await supabaseAdmin
      .from('status_page_config')
      .update(updateData)
      .eq('id', existing?.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating config:', error);
      return NextResponse.json({ error: 'Failed to update configuration' }, { status: 500 });
    }

    return NextResponse.json({ config });
  } catch (error) {
    console.error('Error in PATCH /api/admin/config:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
