import { NextResponse } from 'next/server';

/**
 * Check if Azure AD is properly configured
 * Used by login page to conditionally show Azure AD button
 */
export async function GET() {
  const isConfigured = 
    process.env.AZURE_AD_CLIENT_ID && 
    process.env.AZURE_AD_CLIENT_SECRET && 
    process.env.AZURE_AD_TENANT_ID &&
    process.env.AZURE_AD_CLIENT_ID !== 'your_client_id_here' &&
    process.env.AZURE_AD_CLIENT_SECRET !== 'your_client_secret_here' &&
    process.env.AZURE_AD_TENANT_ID !== 'your_tenant_id_here';

  return NextResponse.json({ enabled: isConfigured });
}
