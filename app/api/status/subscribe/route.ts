import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { sendVerificationEmail } from '@/lib/email/service';
import { randomBytes } from 'crypto';

export const dynamic = 'force-dynamic';

/**
 * POST /api/status/subscribe
 * Public endpoint - subscribe to status updates
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, company } = body;

    if (!name || !email) {
      return NextResponse.json(
        { error: 'Name and email are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }

    // Check if email already exists
    const { data: existing } = await supabaseAdmin
      .from('clients')
      .select('id, is_verified, unsubscribed_at')
      .eq('email', email)
      .single();

    if (existing) {
      if (existing.unsubscribed_at) {
        return NextResponse.json(
          { error: 'This email has unsubscribed. Please contact support to resubscribe.' },
          { status: 400 }
        );
      }

      if (existing.is_verified) {
        return NextResponse.json(
          { error: 'This email is already subscribed' },
          { status: 400 }
        );
      }

      // Resend verification email
      const { data: client } = await supabaseAdmin
        .from('clients')
        .select('verification_token')
        .eq('id', existing.id)
        .single();

      if (client?.verification_token) {
        const { data: config } = await supabaseAdmin
          .from('status_page_config')
          .select('company_name')
          .single();

        const verificationUrl = `${request.nextUrl.origin}/status/verify?token=${client.verification_token}`;

        await sendVerificationEmail(email, {
          recipientName: name,
          verificationUrl,
          companyName: config?.company_name || 'Server Monitor',
        });
      }

      return NextResponse.json({
        message: 'Verification email resent',
      });
    }

    // Generate tokens
    const verificationToken = randomBytes(32).toString('hex');
    const unsubscribeToken = randomBytes(32).toString('hex');

    // Create new client
    const { data: newClient, error: createError } = await supabaseAdmin
      .from('clients')
      .insert({
        name,
        email,
        company,
        verification_token: verificationToken,
        unsubscribe_token: unsubscribeToken,
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating client:', createError);
      return NextResponse.json(
        { error: 'Failed to create subscription' },
        { status: 500 }
      );
    }

    // Create default subscription (all servers, notify on down and degraded)
    await supabaseAdmin
      .from('client_subscriptions')
      .insert({
        client_id: newClient.id,
        subscription_type: 'all_servers',
        notify_on_status: ['down', 'degraded'],
      });

    // Send verification email
    const { data: config } = await supabaseAdmin
      .from('status_page_config')
      .select('company_name')
      .single();

    const verificationUrl = `${request.nextUrl.origin}/status/verify?token=${verificationToken}`;

    const emailResult = await sendVerificationEmail(email, {
      recipientName: name,
      verificationUrl,
      companyName: config?.company_name || 'Server Monitor',
    });

    if (!emailResult.success) {
      console.error('Failed to send verification email:', emailResult.error);
      // Don't fail the request, just log the error
    }

    return NextResponse.json({
      message: 'Please check your email to verify your subscription',
    });
  } catch (error) {
    console.error('Error subscribing:', error);
    return NextResponse.json(
      { error: 'Failed to subscribe' },
      { status: 500 }
    );
  }
}
