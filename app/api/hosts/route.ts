import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getCurrentUser } from '@/lib/auth/session';

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: hosts, error } = await supabaseAdmin
      .from('hosts')
      .select('*')
      .order('name');

    if (error) {
      console.error('Error fetching hosts:', error);
      return NextResponse.json({ error: 'Failed to fetch hosts' }, { status: 500 });
    }

    return NextResponse.json(hosts);
  } catch (error) {
    console.error('Error in GET /api/hosts:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admins and editors can create hosts
    if (!['admin', 'editor'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { name, location, provider } = body;

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const { data: host, error } = await supabaseAdmin
      .from('hosts')
      .insert({
        name,
        location,
        provider,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating host:', error);
      return NextResponse.json({ 
        error: 'Failed to create host',
        details: error.message,
        code: error.code 
      }, { status: 500 });
    }

    return NextResponse.json(host, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/hosts:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
