import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getCurrentUser } from '@/lib/auth/session';
import { isAdmin } from '@/lib/auth/permissions';
import { decrypt, encrypt } from '@/lib/crypto';
import { fetchAllSettings, updateSetting, updateEmailSettings, FileMakerApiError } from '@/lib/filemaker/api-client';
import { z } from 'zod';

/**
 * GET /api/servers/[id]/fm-settings
 * Fetch FileMaker Server settings
 * Admin-only endpoint
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    
    if (!user || !isAdmin(user)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { id: serverId } = await params;

    // Get server with credentials and current settings
    const { data: server, error: serverError } = await supabaseAdmin
      .from('servers')
      .select('id, name, admin_url, admin_username, admin_password, fm_settings, fm_settings_updated_at, fm_settings_updated_by, fm_settings_error')
      .eq('id', serverId)
      .single();

    if (serverError || !server) {
      return NextResponse.json({ error: 'Server not found' }, { status: 404 });
    }

    if (!server.admin_url || !server.admin_username || !server.admin_password) {
      return NextResponse.json({ 
        error: 'Server credentials not configured. Please add admin URL, username, and password first.',
        settings: server.fm_settings,
        lastUpdated: server.fm_settings_updated_at,
        updatedBy: server.fm_settings_updated_by,
        lastError: server.fm_settings_error,
      }, { status: 400 });
    }

    // Decrypt credentials
    let username: string;
    let password: string;
    try {
      username = server.admin_username;
      password = decrypt(server.admin_password);
    } catch (error) {
      return NextResponse.json({ 
        error: 'Failed to decrypt credentials',
        settings: server.fm_settings,
        lastUpdated: server.fm_settings_updated_at,
        updatedBy: server.fm_settings_updated_by,
      }, { status: 500 });
    }

    // Fetch settings from FileMaker Server
    try {
      const settings = await fetchAllSettings(
        serverId,
        server.admin_url,
        username,
        password
      );

      // Get SMTP password if it exists and decrypt it
      const { data: smtpData } = await supabaseAdmin
        .from('servers')
        .select('fm_smtp_password')
        .eq('id', serverId)
        .single();

      let smtpPassword = '';
      if (smtpData?.fm_smtp_password) {
        try {
          smtpPassword = decrypt(smtpData.fm_smtp_password);
        } catch {
          // Ignore decrypt errors for password
        }
      }

      // Update database with fetched settings
      // Note: Don't store SMTP password in fm_settings - it's stored separately encrypted
      const { error: updateError } = await supabaseAdmin
        .from('servers')
        .update({
          fm_settings: settings,
          fm_settings_updated_at: new Date().toISOString(),
          fm_settings_updated_by: user.id,
          fm_settings_error: null,
        })
        .eq('id', serverId);

      if (updateError) {
        console.error('Failed to update settings in database:', updateError);
      }

      // Return settings with password masked
      const settingsWithMaskedPassword = {
        ...settings,
        email: {
          ...settings.email,
          // Don't return actual password, just indicate if one is set
        }
      };

      return NextResponse.json({
        settings: settingsWithMaskedPassword,
        hasSmtpPassword: !!smtpPassword,
        lastUpdated: new Date().toISOString(),
        updatedBy: user.id,
      });

    } catch (error) {
      const errorMessage = error instanceof FileMakerApiError 
        ? error.message 
        : 'Failed to fetch settings from FileMaker Server';
      
      // Store error in database
      await supabaseAdmin
        .from('servers')
        .update({
          fm_settings_error: errorMessage,
        })
        .eq('id', serverId);

      return NextResponse.json({ 
        error: errorMessage,
        settings: server.fm_settings,
        lastUpdated: server.fm_settings_updated_at,
        updatedBy: server.fm_settings_updated_by,
        lastError: errorMessage,
      }, { status: error instanceof FileMakerApiError ? error.code || 500 : 500 });
    }

  } catch (error) {
    console.error('Error in GET /api/servers/[id]/fm-settings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/servers/[id]/fm-settings
 * Update a single FileMaker Server setting
 * Admin-only endpoint
 */

const updateSettingSchema = z.object({
  category: z.enum(['general', 'webPublishing', 'security', 'email']),
  settingKey: z.string(),
  value: z.unknown(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    
    if (!user || !isAdmin(user)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { id: serverId } = await params;
    const body = await request.json();

    // Validate request body
    const validation = updateSettingSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ 
        error: 'Invalid request body',
        details: validation.error.errors,
      }, { status: 400 });
    }

    const { category, settingKey, value } = validation.data;

    // Get server with credentials and current settings
    const { data: server, error: serverError } = await supabaseAdmin
      .from('servers')
      .select('id, name, admin_url, admin_username, admin_password, fm_settings, fm_settings_updated_by, fm_smtp_password')
      .eq('id', serverId)
      .single();

    if (serverError || !server) {
      return NextResponse.json({ error: 'Server not found' }, { status: 404 });
    }

    if (!server.admin_url || !server.admin_username || !server.admin_password) {
      return NextResponse.json({ 
        error: 'Server credentials not configured.',
      }, { status: 400 });
    }

    // Decrypt credentials
    let username: string;
    let password: string;
    try {
      username = server.admin_username;
      password = decrypt(server.admin_password);
    } catch (error) {
      return NextResponse.json({ 
        error: 'Failed to decrypt credentials',
      }, { status: 500 });
    }

    // Get current settings for old value tracking
    const oldSettings = server.fm_settings || {};
    const oldValue = oldSettings[category]?.[settingKey];

    try {
      // Special handling for email settings (requires SMTP password)
      if (category === 'email') {
        // Fetch current settings to merge with update
        const currentSettings = await fetchAllSettings(
          serverId,
          server.admin_url,
          username,
          password
        );

        // Get or decrypt SMTP password
        let smtpPassword = '';
        if (settingKey === 'smtpPassword') {
          // User is updating the password
          smtpPassword = value as string;
        } else {
          // Use existing password
          if (server.fm_smtp_password) {
            try {
              smtpPassword = decrypt(server.fm_smtp_password);
            } catch {
              return NextResponse.json({ 
                error: 'Failed to decrypt SMTP password. Please re-enter SMTP password.',
              }, { status: 500 });
            }
          }
        }

        // Update the specific field in email settings
        const updatedEmailSettings = {
          ...currentSettings.email,
          [settingKey]: settingKey === 'smtpPassword' ? value : value,
        };

        // Update all email settings (FileMaker API requires all fields)
        await updateEmailSettings(
          serverId,
          server.admin_url,
          username,
          password,
          updatedEmailSettings,
          smtpPassword
        );

        // If SMTP password was updated, encrypt and store it
        if (settingKey === 'smtpPassword') {
          const encryptedPassword = encrypt(smtpPassword);
          await supabaseAdmin
            .from('servers')
            .update({ fm_smtp_password: encryptedPassword })
            .eq('id', serverId);
        }

      } else {
        // Update single setting for non-email categories
        await updateSetting(
          serverId,
          server.admin_url,
          username,
          password,
          category,
          settingKey,
          value
        );
      }

      // Refetch all settings to get latest state
      const updatedSettings = await fetchAllSettings(
        serverId,
        server.admin_url,
        username,
        password
      );

      // Check for concurrent updates
      const concurrentUpdateWarning = server.fm_settings_updated_by && 
        server.fm_settings_updated_by !== user.id;

      // Update database with new settings
      await supabaseAdmin
        .from('servers')
        .update({
          fm_settings: updatedSettings,
          fm_settings_updated_at: new Date().toISOString(),
          fm_settings_updated_by: user.id,
          fm_settings_error: null,
        })
        .eq('id', serverId);

      // Log setting change to audit trail
      await supabaseAdmin
        .from('server_events')
        .insert({
          server_id: serverId,
          event_type: 'setting_change',
          event_source: 'admin_console',
          status: 'info',
          message: `${category}.${settingKey} changed by ${user.email}`,
          payload: {
            category,
            settingKey,
            oldValue,
            newValue: value,
            changedByEmail: user.email,
            changedById: user.id,
          },
        });

      return NextResponse.json({
        success: true,
        settings: updatedSettings,
        concurrentUpdateWarning,
        lastUpdated: new Date().toISOString(),
        updatedBy: user.id,
      });

    } catch (error) {
      const errorMessage = error instanceof FileMakerApiError 
        ? error.message 
        : 'Failed to update setting on FileMaker Server';

      // Log failed update attempt
      await supabaseAdmin
        .from('server_events')
        .insert({
          server_id: serverId,
          event_type: 'setting_change',
          event_source: 'admin_console',
          status: 'error',
          message: `Failed to update ${category}.${settingKey}: ${errorMessage}`,
          payload: {
            category,
            settingKey,
            attemptedValue: value,
            error: errorMessage,
            changedByEmail: user.email,
          },
        });

      return NextResponse.json({ 
        error: errorMessage,
      }, { status: error instanceof FileMakerApiError ? error.code || 500 : 500 });
    }

  } catch (error) {
    console.error('Error in PATCH /api/servers/[id]/fm-settings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
