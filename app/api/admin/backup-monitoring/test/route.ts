import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { isAdmin } from '@/lib/auth/permissions';
import { performBackupCheck } from '@/lib/backup-monitoring/check';

export const dynamic = 'force-dynamic';

/**
 * POST - Run a test backup monitoring check (manual trigger)
 * Directly calls the backup check logic, bypassing the cron endpoint
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !isAdmin(user)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    console.log('Test endpoint: Running backup check...');
    
    const result = await performBackupCheck();
    
    console.log('Test endpoint: Check completed', result);

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
