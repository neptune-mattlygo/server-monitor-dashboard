import { NextRequest, NextResponse } from 'next/server';
import { getAuthUrl } from '@/lib/auth/azure-client';
import { logAuditEvent } from '@/lib/auth/session';

export async function POST(request: NextRequest) {
  try {
    // Get authorization URL from Azure AD
    const authUrl = await getAuthUrl();
    
    return NextResponse.json({ url: authUrl });
  } catch (error) {
    console.error('Azure AD login error:', error);
    return NextResponse.json(
      { error: 'Failed to initiate login' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get authorization URL from Azure AD
    const authUrl = await getAuthUrl();
    
    // Redirect to Azure AD login
    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error('Azure AD login error:', error);
    return NextResponse.redirect('/auth/error?error=login_failed');
  }
}
