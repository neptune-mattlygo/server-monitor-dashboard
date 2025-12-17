import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getCurrentUser } from '@/lib/auth/session';
import {
  parseUptimeRobotWebhook,
} from '@/lib/webhooks/parsers';
import {
  validateUptimeRobotWebhook,
  isRateLimited,
} from '@/lib/webhooks/validators';
import type { UptimeRobotPayload } from '@/lib/webhooks/types';

export async function POST(request: NextRequest) {
  try {
    // Check rate limiting
    const clientIp = request.headers.get('x-forwarded-for') || 'unknown';
    if (isRateLimited(`uptimerobot:${clientIp}`)) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429 }
      );
    }

    // Validate webhook secret
    const secret = request.headers.get('x-webhook-secret');
    const expectedSecret = process.env.WEBHOOK_SECRET_UPTIMEROBOT;

    if (!expectedSecret || !validateUptimeRobotWebhook(secret, expectedSecret)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse webhook payload
    const payload: UptimeRobotPayload = await request.json();
    
    // Log incoming payload for debugging
    console.log('UptimeRobot webhook received:', {
      hasEmailBody: !!payload.emailBody,
      hasEmailSubject: !!payload.emailSubject,
      hasMonitorID: !!payload.monitorID,
    });
    
    const parsedData = parseUptimeRobotWebhook(payload);

    // Find or create server by name
    const { data: existingServer } = await supabaseAdmin
      .from('servers')
      .select('id')
      .eq('name', parsedData.serverName)
      .single();

    let serverId: string;

    if (existingServer) {
      serverId = existingServer.id;

      // Update server status
      await supabaseAdmin
        .from('servers')
        .update({
          current_status: parsedData.status,
          last_status_change: new Date().toISOString(),
        })
        .eq('id', serverId);
    } else {
      // Create new server if it doesn't exist
      const { data: newServer } = await supabaseAdmin
        .from('servers')
        .insert({
          name: parsedData.serverName,
          current_status: parsedData.status,
          server_type: 'web',
          metadata: parsedData.metadata || {},
        })
        .select('id')
        .single();

      serverId = newServer!.id;
    }

    // Log server event
    await supabaseAdmin.from('server_events').insert({
      server_id: serverId,
      event_type: parsedData.eventType,
      event_source: 'uptimerobot',
      status: parsedData.status,
      message: parsedData.message,
      payload: payload as any,
    });

    return NextResponse.json({ success: true, serverId });
  } catch (error) {
    console.error('UptimeRobot webhook error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
