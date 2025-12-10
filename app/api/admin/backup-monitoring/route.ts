import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getCurrentUser } from '@/lib/auth/session';
import { isAdmin } from '@/lib/auth/permissions';

export const dynamic = 'force-dynamic';

/**
 * GET - Fetch backup monitoring configuration
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !isAdmin(user)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Fetch configuration
    const { data: config, error: configError } = await supabaseAdmin
      .from('backup_monitoring_config')
      .select('*')
      .single();

    if (configError) {
      console.error('Failed to fetch backup monitoring config:', configError);
      return NextResponse.json({ 
        error: 'Failed to fetch configuration',
        details: configError 
      }, { status: 500 });
    }

    return NextResponse.json({ config });
  } catch (error: any) {
    console.error('GET backup monitoring config error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 });
  }
}

/**
 * PUT - Update backup monitoring configuration
 */
export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !isAdmin(user)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Parse request body
    const body = await request.json();
    const { is_enabled, threshold_hours, email_recipients } = body;

    // Validate inputs
    if (typeof is_enabled !== 'boolean') {
      return NextResponse.json({ error: 'is_enabled must be a boolean' }, { status: 400 });
    }

    if (threshold_hours && (threshold_hours < 1 || threshold_hours > 168)) {
      return NextResponse.json({ 
        error: 'threshold_hours must be between 1 and 168' 
      }, { status: 400 });
    }

    if (email_recipients && !Array.isArray(email_recipients)) {
      return NextResponse.json({ 
        error: 'email_recipients must be an array' 
      }, { status: 400 });
    }

    // Get current config
    const { data: currentConfig } = await supabaseAdmin
      .from('backup_monitoring_config')
      .select('id')
      .single();

    if (!currentConfig) {
      return NextResponse.json({ error: 'Configuration not found' }, { status: 404 });
    }

    // Update configuration
    const { data: updatedConfig, error: updateError } = await supabaseAdmin
      .from('backup_monitoring_config')
      .update({
        is_enabled,
        threshold_hours,
        email_recipients,
        updated_at: new Date().toISOString(),
      })
      .eq('id', currentConfig.id)
      .select()
      .single();

    if (updateError) {
      console.error('Failed to update backup monitoring config:', updateError);
      return NextResponse.json({ 
        error: 'Failed to update configuration',
        details: updateError 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      config: updatedConfig 
    });
  } catch (error: any) {
    console.error('PUT backup monitoring config error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 });
  }
}
