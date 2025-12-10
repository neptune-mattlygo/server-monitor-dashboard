import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public routes
  const publicRoutes = [
    '/api/auth/azure/login',
    '/api/auth/azure/callback',
    '/api/auth/local/login',
    '/api/auth/local/signup',
    '/auth/error',
    '/login',
    '/status', // Public status page
    '/api/status', // Public status API
  ];

  // Webhook routes (validated internally)
  const webhookRoutes = [
    '/api/webhooks/uptimerobot',
    '/api/webhooks/filemaker',
    '/api/webhooks/backup',
    '/api/webhooks/aws-s3',
    '/api/polling/uptimerobot', // UptimeRobot polling endpoint (cron job)
    '/api/cron/backup-check', // Backup monitoring cron endpoint
  ];

  // Allow public and webhook routes without authentication
  if (
    publicRoutes.some((route) => pathname.startsWith(route)) ||
    webhookRoutes.some((route) => pathname.startsWith(route))
  ) {
    return NextResponse.next();
  }

  // Check authentication for protected routes
  const user = await getCurrentUser();

  if (!user) {
    // Redirect to login for unauthenticated users
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // User is authenticated, allow access
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*|public).*)',
  ],
};
