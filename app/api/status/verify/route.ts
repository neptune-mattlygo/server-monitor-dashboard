import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { sendSubscriptionConfirmation } from '@/lib/email/service';

export const dynamic = 'force-dynamic';

/**
 * GET /api/status/verify?token=xxx
 * Public endpoint - verify email subscription
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { error: 'Verification token is required' },
        { status: 400 }
      );
    }

    // Find client by verification token
    const { data: client, error: findError } = await supabaseAdmin
      .from('clients')
      .select('id, email, name, is_verified, unsubscribe_token')
      .eq('verification_token', token)
      .single();

    if (findError || !client) {
      return NextResponse.json(
        { error: 'Invalid or expired verification token' },
        { status: 400 }
      );
    }

    if (client.is_verified) {
      return NextResponse.json(
        { error: 'Email is already verified' },
        { status: 400 }
      );
    }

    // Update client as verified
    const { error: updateError } = await supabaseAdmin
      .from('clients')
      .update({
        is_verified: true,
        verified_at: new Date().toISOString(),
      })
      .eq('id', client.id);

    if (updateError) {
      console.error('Error verifying client:', updateError);
      return NextResponse.json(
        { error: 'Failed to verify email' },
        { status: 500 }
      );
    }

    // Send confirmation email
    const { data: config } = await supabaseAdmin
      .from('status_page_config')
      .select('company_name')
      .single();

    const statusPageUrl = `${request.nextUrl.origin}/status`;
    const unsubscribeUrl = `${request.nextUrl.origin}/status/unsubscribe?token=${client.unsubscribe_token}`;

    await sendSubscriptionConfirmation(
      client.email,
      config?.company_name || 'Server Monitor',
      statusPageUrl,
      unsubscribeUrl
    );

    // Redirect to status page with success message
    return NextResponse.redirect(
      new URL(`/status?verified=true`, request.url)
    );
  } catch (error) {
    console.error('Error verifying email:', error);
    return NextResponse.json(
      { error: 'Failed to verify email' },
      { status: 500 }
    );
  }
}
