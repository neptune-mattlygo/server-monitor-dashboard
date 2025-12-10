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
    
    console.log('Test endpoint calling:', cronUrl);
    console.log('CRON_SECRET available:', !!process.env.CRON_SECRET);
    
    const cronResponse = await fetch(cronUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.CRON_SECRET}`,
      },
    });

    console.log('Cron response status:', cronResponse.status);
    
    const result = await cronResponse.json();
    console.log('Cron response body:', result);

    if (!cronResponse.ok) {
      console.error('Test run failed with status:', cronResponse.status, result);
      return NextResponse.json({ 
        error: 'Test run failed',
        details: result 
      }, { status: cronResponse.status });
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Test backup monitoring check error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 });
  }
}
