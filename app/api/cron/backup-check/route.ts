import { NextRequest, NextResponse } from 'next/server';
import { performBackupCheck } from '@/lib/backup-monitoring/check';

export const dynamic = 'force-dynamic';

/**
 * Cron job endpoint for checking backup freshness
 * Called via Vercel Cron or manual trigger
 */
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret for security
    const authHeader = request.headers.get('authorization');
    const expectedAuth = `Bearer ${process.env.CRON_SECRET}`;
    
    console.log('Cron endpoint called');
    
    if (authHeader !== expectedAuth) {
      console.error('Cron endpoint: Unauthorized access attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Call the shared backup check logic
    const result = await performBackupCheck();
    return NextResponse.json(result);

  } catch (error: any) {
    console.error('Backup monitoring check failed:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}
