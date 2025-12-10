import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { isAdmin } from '@/lib/auth/permissions';

export const dynamic = 'force-dynamic';

/**
 * POST - Run a test backup monitoring check (manual trigger)
 * Reuses the same logic as the cron job but bypasses the cron secret check
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !isAdmin(user)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Make internal request to the cron endpoint with the secret
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const cronUrl = `${baseUrl}/api/cron/backup-check`;
    const authHeader = `Bearer ${process.env.CRON_SECRET}`;
    
    console.log('Test endpoint calling:', cronUrl);
    console.log('CRON_SECRET available:', !!process.env.CRON_SECRET);
    console.log('Auth header (first 20 chars):', authHeader.substring(0, 20));
    console.log('Auth header length:', authHeader.length);
    
    const cronResponse = await fetch(cronUrl, {
      method: 'GET',
      headers: {
        'Authorization': authHeader,
      },
    });

    console.log('Cron response status:', cronResponse.status);
    
    const result = await cronResponse.json();
    console.log('Cron response body:', result);

    if (!cronResponse.ok) {
      console.error('Test run failed with status:', cronResponse.status, result);
      
      // Provide more helpful error message for 401
      let errorDetails = result;
      if (cronResponse.status === 401) {
        errorDetails = {
          ...result,
          hint: 'The CRON_SECRET environment variable may not be set correctly in production. Please verify it matches in Vercel settings.'
        };
      }
      
      return NextResponse.json({ 
        error: 'Test run failed',
        details: errorDetails,
        status_code: cronResponse.status
      }, { status: cronResponse.status });
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Test backup monitoring check error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}
