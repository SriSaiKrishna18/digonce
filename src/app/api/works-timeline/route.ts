import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  // Import and await createServerClient
  const { createServerClient } = await import('@/lib/supabase/server');
  const supabase = await createServerClient();
  
  const { data } = await supabase
    .from('works')
    .select('id, title, status, type, start_date, end_date, department_id, departments(name), work_segments(segment_id)');
  
  return NextResponse.json(data || []);
}
