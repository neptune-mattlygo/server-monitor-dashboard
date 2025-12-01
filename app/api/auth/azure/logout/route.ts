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

    // Clear session cookie
    await clearSessionCookie();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Failed to logout' },
      { status: 500 }
    );
  }
}
