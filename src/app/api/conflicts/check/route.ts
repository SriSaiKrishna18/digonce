// POST /api/conflicts/check — Dry-run conflict detection
// Takes candidate work data, returns conflicts without saving

import { NextRequest, NextResponse } from 'next/server';
import { conflictCheckSchema } from '@/lib/schemas';
import { detectConflicts } from '@/lib/engine';
import { createServerClient } from '@/lib/supabase/server';
import type { Work } from '@/lib/engine';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const parsed = conflictCheckSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { title, type, departmentId, segmentIds, startDate, endDate, editingWorkId } = parsed.data;

    // Fetch all active works on the candidate's segments
    const supabase = createServerClient();
    const { data: workSegments, error: wsError } = await supabase
      .from('work_segments')
      .select('work_id, segment_id')
      .in('segment_id', segmentIds);

    if (wsError) {
      return NextResponse.json({ error: 'Database error', details: wsError.message }, { status: 500 });
    }

    // Get unique work IDs
    const workIds = [...new Set((workSegments || []).map(ws => ws.work_id))];

    let existingWorks: Work[] = [];

    if (workIds.length > 0) {
      // Fetch the works
      const { data: works, error: worksError } = await supabase
        .from('works')
        .select('id, title, department_id, type, status, start_date, end_date')
        .in('id', workIds)
        .neq('status', 'cancelled');

      if (worksError) {
        return NextResponse.json({ error: 'Database error', details: worksError.message }, { status: 500 });
      }

      // Build Work objects with their segment IDs
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

    // Build the candidate Work object
    const candidate: Work = {
      id: editingWorkId || 'new-candidate',
      title,
      departmentId,
      type,
      status: 'planned',
      segmentIds,
      startDate,
      endDate,
    };

    // Run the engine
    const conflicts = detectConflicts(candidate, existingWorks);

    return NextResponse.json({ conflicts });
  } catch (err) {
    console.error('Conflict check error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
