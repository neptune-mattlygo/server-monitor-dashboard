import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';

/**
 * GET /api/auth/check
 * Check if user is authenticated
 */
export async function GET() {
  try {
    const user = await getCurrentUser();
    
    return NextResponse.json({
      authenticated: !!user,
      user: user ? {
        id: user.id,
        email: user.email,
        role: user.role,
        display_name: user.display_name,
      } : null,
    });
  } catch (error) {
    return NextResponse.json({
      authenticated: false,
      user: null,
    });
  }
}
