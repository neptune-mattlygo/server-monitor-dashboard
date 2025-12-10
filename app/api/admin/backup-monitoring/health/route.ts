import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { isAdmin } from '@/lib/auth/permissions';

export const dynamic = 'force-dynamic';

/**
 * GET - Health check for backup monitoring configuration
 * Returns status of required environment variables and services
 */
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || !isAdmin(user)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const health = {
      environment_variables: {
        CRON_SECRET: !!process.env.CRON_SECRET,
        RESEND_API_KEY: !!process.env.RESEND_API_KEY,
        STATUS_PAGE_FROM_EMAIL: !!process.env.STATUS_PAGE_FROM_EMAIL,
        STATUS_PAGE_FROM_NAME: !!process.env.STATUS_PAGE_FROM_NAME,
        NEXT_PUBLIC_APP_URL: !!process.env.NEXT_PUBLIC_APP_URL,
        NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      },
      values: {
        NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
        STATUS_PAGE_FROM_EMAIL: process.env.STATUS_PAGE_FROM_EMAIL,
        STATUS_PAGE_FROM_NAME: process.env.STATUS_PAGE_FROM_NAME,
      },
    };

    const missingVars = Object.entries(health.environment_variables)
      .filter(([_, exists]) => !exists)
      .map(([name]) => name);

    return NextResponse.json({
      success: true,
      healthy: missingVars.length === 0,
      missing_variables: missingVars,
      ...health,
    });
  } catch (error: any) {
    console.error('Health check error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 });
  }
}
