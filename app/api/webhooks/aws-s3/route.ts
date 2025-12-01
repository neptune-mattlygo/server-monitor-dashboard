import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { parseAWSS3Webhook } from '@/lib/webhooks/parsers';
import { validateAWSS3Webhook, isRateLimited } from '@/lib/webhooks/validators';
import type { AWSS3Payload } from '@/lib/webhooks/types';

export async function POST(request: NextRequest) {
  try {
    // Check rate limiting
    const clientIp = request.headers.get('x-forwarded-for') || 'unknown';
    if (isRateLimited(`aws-s3:${clientIp}`)) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    // Validate webhook signature
    const signature = request.headers.get('x-amz-sns-message-signature') || 
                     request.headers.get('x-webhook-secret');
    const expectedSecret = process.env.WEBHOOK_SECRET_AWS_S3;
    
    const rawBody = await request.text();
    let payload: AWSS3Payload;
    
    try {
      payload = JSON.parse(rawBody);
    } catch (error) {
      return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
    }

    if (!expectedSecret || !validateAWSS3Webhook(payload, signature, expectedSecret)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse webhook payload
    const parsedData = parseAWSS3Webhook(payload);

    // Find server by name (bucket name)
    const { data: server } = await supabaseAdmin
      .from('servers')
      .select('id')
      .eq('name', parsedData.serverName)
      .single();

    if (!server) {
      // Create new server for this S3 bucket
      const { data: newServer } = await supabaseAdmin
        .from('servers')
        .insert({
          name: parsedData.serverName,
          current_status: 'up',
          server_type: 'storage',
          metadata: { source: 'aws_s3', ...parsedData.metadata },
        })
        .select('id')
        .single();

      if (!newServer) {
        return NextResponse.json({ error: 'Failed to create server' }, { status: 500 });
      }

      // Log server event
      await supabaseAdmin.from('server_events').insert({
        server_id: newServer.id,
        event_type: parsedData.eventType,
        event_source: 'aws_s3',
        status: parsedData.status,
        message: parsedData.message,
        payload: payload as any,
      });

      return NextResponse.json({ success: true, serverId: newServer.id });
    }

    // Log server event for existing server
    await supabaseAdmin.from('server_events').insert({
      server_id: server.id,
      event_type: parsedData.eventType,
      event_source: 'aws_s3',
      status: parsedData.status,
      message: parsedData.message,
      payload: payload as any,
    });

    return NextResponse.json({ success: true, serverId: server.id });
  } catch (error) {
    console.error('AWS S3 webhook error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
