// POST /api/works — Create a new work
import { NextRequest, NextResponse } from 'next/server';
import { createWorkSchema } from '@/lib/schemas';
import { detectConflicts } from '@/lib/engine';
import { createServerClient } from '@/lib/supabase/server';
import type { Work } from '@/lib/engine';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = createWorkSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const {
      title, purpose, type, departmentId, contractorName,
      segmentIds, startDate, endDate, overrideReason,
    } = parsed.data;

    const supabase = createServerClient();

    // Re-run conflict detection server-side (never trust the client)
    const { data: workSegments } = await supabase
      .from('work_segments')
      .select('work_id, segment_id')
      .in('segment_id', segmentIds);

    const workIds = [...new Set((workSegments || []).map(ws => ws.work_id))];
    let existingWorks: Work[] = [];

    if (workIds.length > 0) {
      const { data: works } = await supabase
        .from('works')
        .select('id, title, department_id, type, status, start_date, end_date')
        .in('id', workIds)
        .neq('status', 'cancelled');

      existingWorks = (works || []).map(w => {
        const wSegIds = (workSegments || [])
          .filter(ws => ws.work_id === w.id)
          .map(ws => ws.segment_id);
        return {
          id: w.id,
          title: w.title,
          departmentId: w.department_id,
          type: w.type,
          status: w.status,
          segmentIds: wSegIds,
          startDate: w.start_date,
          endDate: w.end_date,
        } as Work;
      });
    }

    const candidate: Work = {
      id: 'new-candidate',
      title,
      departmentId,
      type,
      status: 'planned',
      segmentIds,
      startDate,
      endDate,
    };

    const conflicts = detectConflicts(candidate, existingWorks);
    const highSeverity = conflicts.filter(c => c.severity === 'high');

    // Block if high-severity conflicts and no override reason
    if (highSeverity.length > 0 && !overrideReason) {
      return NextResponse.json(
        {
          error: 'High-severity conflicts detected. Provide an override reason to proceed.',
          conflicts,
        },
        { status: 409 },
      );
    }

    // Get current user
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Insert the work
    const { data: newWork, error: insertError } = await supabase
      .from('works')
      .insert({
        title,
        purpose,
        type,
        department_id: departmentId,
        contractor_name: contractorName || null,
        status: 'planned',
        start_date: startDate,
        end_date: endDate,
        original_end_date: endDate,
        is_demo: false,
        created_by: user.id,
      })
      .select('id')
      .single();

    if (insertError) {
      return NextResponse.json({ error: 'Failed to create work', details: insertError.message }, { status: 500 });
    }

    // Insert work-segment relationships
    const segmentInserts = segmentIds.map(segId => ({
      work_id: newWork.id,
      segment_id: segId,
    }));

    const { error: segError } = await supabase
      .from('work_segments')
      .insert(segmentInserts);

    if (segError) {
      return NextResponse.json({ error: 'Failed to link segments', details: segError.message }, { status: 500 });
    }

    return NextResponse.json({
      work: newWork,
      conflicts,
      overrideApplied: highSeverity.length > 0,
    }, { status: 201 });
  } catch (err) {
    console.error('Create work error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
