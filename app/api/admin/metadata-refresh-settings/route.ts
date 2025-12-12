import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getCurrentUser } from '@/lib/auth/session';
import { isAdmin } from '@/lib/auth/permissions';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    if (!user || !isAdmin(user)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { data: settings, error } = await supabaseAdmin
      .from('metadata_refresh_settings')
      .select('*')
      .single();

    if (error) {
      console.error('Error fetching metadata refresh settings:', error);
      return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
    }

    return NextResponse.json({ settings });
  } catch (error) {
    console.error('Get metadata refresh settings error:', error);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    if (!user || !isAdmin(user)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const { refresh_interval_days, notification_emails, enabled } = body;

    // Validate input
    if (refresh_interval_days !== undefined && (refresh_interval_days < 1 || refresh_interval_days > 365)) {
      return NextResponse.json({ error: 'Refresh interval must be between 1 and 365 days' }, { status: 400 });
    }

    if (notification_emails !== undefined && !Array.isArray(notification_emails)) {
      return NextResponse.json({ error: 'Notification emails must be an array' }, { status: 400 });
    }

    // Validate email addresses
    if (notification_emails) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      for (const email of notification_emails) {
        if (!emailRegex.test(email)) {
          return NextResponse.json({ error: `Invalid email address: ${email}` }, { status: 400 });
        }
      }
    }

    const updateData: any = {};
    if (refresh_interval_days !== undefined) updateData.refresh_interval_days = refresh_interval_days;
    if (notification_emails !== undefined) updateData.notification_emails = notification_emails;
    if (enabled !== undefined) updateData.enabled = enabled;

    // First get the existing record to update
    const { data: existingSettings, error: fetchError } = await supabaseAdmin
      .from('metadata_refresh_settings')
      .select('id')
      .single();

    if (fetchError) {
      console.error('Error fetching existing settings:', fetchError);
      return NextResponse.json({ error: 'Failed to fetch existing settings' }, { status: 500 });
    }

    const { data: settings, error } = await supabaseAdmin
      .from('metadata_refresh_settings')
      .update(updateData)
      .eq('id', existingSettings.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating metadata refresh settings:', error);
      return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
    }

    return NextResponse.json({ settings, message: 'Settings updated successfully' });
  } catch (error) {
    console.error('Update metadata refresh settings error:', error);
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}