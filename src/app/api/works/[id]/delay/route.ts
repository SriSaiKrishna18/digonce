// POST /api/works/[id]/delay — Extend work end date with mandatory reason
import { NextRequest, NextResponse } from 'next/server';
import { delayEventSchema } from '@/lib/schemas';
import { createServerClient } from '@/lib/supabase/server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: workId } = await params;
    const body = await request.json();
    const parsed = delayEventSchema.safeParse({ ...body, workId });

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { newEnd, reason, note } = parsed.data;
    const supabase = await createServerClient();

    // Get current work
    const { data: work, error: workError } = await supabase
      .from('works')
      .select('id, end_date, status, department_id')
      .eq('id', workId)
      .single();

    if (workError || !work) {
      return NextResponse.json({ error: 'Work not found' }, { status: 404 });
    }

    // New end date must be after current end date
    if (newEnd <= work.end_date) {
      return NextResponse.json(
        { error: 'New end date must be after current end date' },
        { status: 400 },
      );
    }

    // Insert delay event
    const { error: delayError } = await supabase
      .from('delay_events')
      .insert({
        work_id: workId,
        old_end: work.end_date,
        new_end: newEnd,
        reason,
        note: note || null,
      });

    if (delayError) {
      return NextResponse.json({ error: 'Failed to record delay', details: delayError.message }, { status: 500 });
    }

    // Update the work's end date and status
    const { error: updateError } = await supabase
      .from('works')
      .update({
        end_date: newEnd,
        status: 'delayed',
      })
      .eq('id', workId);

    if (updateError) {
      return NextResponse.json({ error: 'Failed to update work', details: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, newEndDate: newEnd });
  } catch (err) {
    console.error('Delay work error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
