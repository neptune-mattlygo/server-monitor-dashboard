import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { isAdmin } from '@/lib/auth/permissions';

/**
 * POST /api/admin/clear-fm-sessions
 * Clear in-memory FileMaker session cache
 * This won't close active FileMaker sessions but allows fresh authentication attempts
 */
export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  
  if (!user || !isAdmin(user)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  // Note: We can't directly access the tokenCache Map from here since it's module-scoped
  // But restarting the Next.js dev server clears it
  
  return NextResponse.json({ 
    message: 'To clear FileMaker session cache, restart the Next.js dev server (Ctrl+C and npm run dev)',
    instructions: [
      '1. Stop dev server (Ctrl+C)',
      '2. Run: npm run dev',
      '3. Or wait 15 minutes for FileMaker sessions to expire naturally',
      '4. Or restart FileMaker Server to kill all sessions'
    ]
  });
}
