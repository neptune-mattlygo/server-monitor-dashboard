import { NextRequest, NextResponse } from 'next/server';
import {
  getSessionCookie,
  deleteSession,
  clearSessionCookie,
  logAuditEvent,
} from '@/lib/auth/session';

export async function POST(request: NextRequest) {
  try {
    const sessionId = await getSessionCookie();

    if (sessionId) {
      // Log audit event before deleting session
      await logAuditEvent(null, 'logout', 'session', sessionId, {});

      // Delete session from database
      await deleteSession(sessionId);
    }

    // Clear session cookie and redirect to logout page
    await clearSessionCookie();

    return NextResponse.redirect(new URL('/logout', request.url));
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Failed to logout' },
      { status: 500 }
    );
  }
}
