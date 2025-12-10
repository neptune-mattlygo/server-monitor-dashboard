import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getCurrentUser } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

/**
 * GET - Fetch recent backup monitoring check results
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch recent results (last 10)
    const { data: results, error: resultsError } = await supabaseAdmin
      .from('backup_monitoring_results')
      .select('*')
      .order('check_run_at', { ascending: false })
      .limit(10);

    if (resultsError) {
      console.error('Failed to fetch monitoring results:', resultsError);
      return NextResponse.json({ 
        error: 'Failed to fetch results',
        details: resultsError 
      }, { status: 500 });
    }

    return NextResponse.json({ results: results || [] });
  } catch (error: any) {
    console.error('GET backup monitoring results error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 });
  }
}
