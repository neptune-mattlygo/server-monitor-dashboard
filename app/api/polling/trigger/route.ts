import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';

/**
 * Manual trigger for UptimeRobot polling
 * Only accessible to admin users via the dashboard
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admins can manually trigger polling
    if (user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get polling secret
    const pollingSecret = process.env.POLLING_SECRET;
    
    if (!pollingSecret) {
      return NextResponse.json(
        { error: 'Polling not configured' },
        { status: 503 }
      );
    }

    // Trigger the polling endpoint
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/polling/uptimerobot`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${pollingSecret}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Polling failed', details: data },
        { status: response.status }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Polling triggered successfully',
      result: data,
    });
  } catch (error) {
    console.error('Failed to trigger polling:', error);
    return NextResponse.json(
      { 
        error: 'Failed to trigger polling',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
