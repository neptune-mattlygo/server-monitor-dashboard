import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { parseBackupWebhook } from '@/lib/webhooks/parsers';
import { validateBackupWebhook, isRateLimited } from '@/lib/webhooks/validators';
import type { BackupPayload } from '@/lib/webhooks/types';

export async function POST(request: NextRequest) {
  try {
    // Check rate limiting
    const clientIp = request.headers.get('x-forwarded-for') || 'unknown';
    if (isRateLimited(`backup:${clientIp}`)) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    // Validate webhook secret
    const secret = request.headers.get('x-webhook-secret');
    const expectedSecret = process.env.WEBHOOK_SECRET_BACKUP;

    if (!expectedSecret || !validateBackupWebhook(secret, expectedSecret)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse webhook payload
    const payload: BackupPayload = await request.json();
    const parsedData = parseBackupWebhook(payload);

    // Find server by name
    const { data: server } = await supabaseAdmin
      .from('servers')
      .select('id')
      .eq('name', parsedData.serverName)
      .single();

    if (!server) {
      return NextResponse.json({ error: 'Server not found' }, { status: 404 });
    }

    // Log server event
    await supabaseAdmin.from('server_events').insert({
      server_id: server.id,
      event_type: parsedData.eventType,
      event_source: 'backup_system',
      status: parsedData.status,
      message: parsedData.message,
      payload: payload as any,
    });

    return NextResponse.json({ success: true, serverId: server.id });
  } catch (error) {
    console.error('Backup webhook error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
