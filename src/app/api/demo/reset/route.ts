// POST /api/demo/reset — Reset demo data to seeded state
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    // Verify reset secret (prevent public abuse)
    const body = await request.json().catch(() => ({}));
    const secret = body.secret || request.headers.get('x-reset-secret');

    if (secret !== process.env.DEMO_RESET_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createAdminClient();

    // Delete only demo data (is_demo = true)
    // Order matters due to foreign keys

    // 1. Delete check-ins for demo works
    const { data: demoWorks } = await supabase
      .from('works')
      .select('id')
      .eq('is_demo', true);

    const demoWorkIds = (demoWorks || []).map(w => w.id);

    if (demoWorkIds.length > 0) {
      await supabase.from('checkins').delete().in('work_id', demoWorkIds);
      await supabase.from('delay_events').delete().in('work_id', demoWorkIds);
      await supabase.from('work_segments').delete().in('work_id', demoWorkIds);
      await supabase.from('works').delete().eq('is_demo', true);
    }

    // Also delete non-demo works created during demo play (optional cleanup)
    // Keep segments and departments — they're reference data

    return NextResponse.json({
      success: true,
      message: 'Demo data cleared. Run the seed script to regenerate.',
      deletedWorks: demoWorkIds.length,
    });
  } catch (err) {
    console.error('Demo reset error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
