import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { parseAWSS3Webhook } from '@/lib/webhooks/parsers';
import { isRateLimited } from '@/lib/webhooks/validators';
import type { AWSS3Payload } from '@/lib/webhooks/types';

export async function POST(request: NextRequest) {
  try {
    // Check rate limiting
    const clientIp = request.headers.get('x-forwarded-for') || 'unknown';
    if (isRateLimited(`aws-s3:${clientIp}`)) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    // Validate URL token parameter for security (instead of headers which SNS doesn't support)
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    const expectedToken = process.env.WEBHOOK_SECRET_AWS_S3;
    
    if (!expectedToken || token !== expectedToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const rawBody = await request.text();
    let payload: AWSS3Payload;
    
    try {
      payload = JSON.parse(rawBody);
    } catch (error) {
      return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
    }

    // Parse webhook payload
    const parsedData = parseAWSS3Webhook(payload);
    const bucketName = parsedData.metadata?.bucket || parsedData.serverName;

    // Handle test/subscription confirmation notifications without valid bucket
    // These will be logged to server_events without a server_id for review
    if (!bucketName || bucketName === 'unknown' || bucketName === 'test-bucket') {
      await supabaseAdmin.from('server_events').insert({
        server_id: null,
        event_type: 'sns_test',
        event_source: 'aws_s3',
        status: 'info',
        message: 'SNS subscription confirmation or test notification received',
        payload: payload as any,
      });

      return NextResponse.json({ 
        success: true, 
        message: 'Test notification logged for review' 
      });
    }

    // Find server by bucket field
    const { data: server } = await supabaseAdmin
      .from('servers')
      .select('id')
      .eq('bucket', bucketName)
      .single();

    if (!server) {
      // Create new server for this S3 bucket
      const { data: newServer } = await supabaseAdmin
        .from('servers')
        .insert({
          name: parsedData.serverName,
          bucket: bucketName,
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
        backup_event_type: parsedData.backupEventType,
        backup_database: parsedData.backupDatabase,
        backup_file_key: parsedData.backupFileKey,
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
      backup_event_type: parsedData.backupEventType,
      backup_database: parsedData.backupDatabase,
      backup_file_key: parsedData.backupFileKey,
    });

    return NextResponse.json({ success: true, serverId: server.id });
  } catch (error) {
    console.error('AWS S3 webhook error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
