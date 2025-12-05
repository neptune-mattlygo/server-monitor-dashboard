import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

/**
 * GET /api/status/unsubscribe?token=xxx
 * Public endpoint - unsubscribe from status updates
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { error: 'Unsubscribe token is required' },
        { status: 400 }
      );
    }

    // Find client by unsubscribe token
    const { data: client, error: findError } = await supabaseAdmin
      .from('clients')
      .select('id, email, unsubscribed_at')
      .eq('unsubscribe_token', token)
      .single();

    if (findError || !client) {
      return NextResponse.json(
        { error: 'Invalid unsubscribe token' },
        { status: 400 }
      );
    }

    if (client.unsubscribed_at) {
      return NextResponse.json(
        { error: 'Email is already unsubscribed' },
        { status: 400 }
      );
    }

    // Update client as unsubscribed
    const { error: updateError } = await supabaseAdmin
      .from('clients')
      .update({
        unsubscribed_at: new Date().toISOString(),
      })
      .eq('id', client.id);

    if (updateError) {
      console.error('Error unsubscribing client:', updateError);
      return NextResponse.json(
        { error: 'Failed to unsubscribe' },
        { status: 500 }
      );
    }

    // Redirect to status page with success message
    return NextResponse.redirect(
      new URL(`/status?unsubscribed=true`, request.url)
    );
  } catch (error) {
    console.error('Error unsubscribing:', error);
    return NextResponse.json(
      { error: 'Failed to unsubscribe' },
      { status: 500 }
    );
  }
}
