// POST /api/works/[id]/checkins — Citizen check-in with geofence validation
import { NextRequest, NextResponse } from 'next/server';
import { checkinSchema } from '@/lib/schemas';
import { createServerClient } from '@/lib/supabase/server';
import { minDistanceToSegments } from '@/lib/geo';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: workId } = await params;
    const body = await request.json();
    const parsed = checkinSchema.safeParse({ ...body, workId });

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { lat, lng, mode, note } = parsed.data;
    const supabase = await createServerClient();

    // Get auth user
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    let userId: string;
    if (token) {
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);
      if (authError || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      userId = user.id;
    } else {
      // Try anonymous sign-in for citizens
      const { data: anonData, error: anonError } = await supabase.auth.signInAnonymously();
      if (anonError || !anonData.user) {
        return NextResponse.json({ error: 'Authentication failed' }, { status: 401 });
      }
      userId = anonData.user.id;
    }

    // Get the work's segments with geometry
    const { data: workSegments, error: wsError } = await supabase
      .from('work_segments')
      .select('segment_id')
      .eq('work_id', workId);

    if (wsError || !workSegments?.length) {
      return NextResponse.json({ error: 'Work not found or has no segments' }, { status: 404 });
    }

    const segmentIds = workSegments.map(ws => ws.segment_id);
    const { data: segments, error: segError } = await supabase
      .from('segments')
      .select('id, geometry')
      .in('id', segmentIds);

    if (segError || !segments?.length) {
      return NextResponse.json({ error: 'Segments not found' }, { status: 404 });
    }

    // Compute distance to nearest segment
    const geometries = segments.map(s => s.geometry);
    const result = minDistanceToSegments(lat, lng, geometries);

    // Insert check-in
    const { data: checkin, error: insertError } = await supabase
      .from('checkins')
      .insert({
        work_id: workId,
        user_id: userId,
        lat,
        lng,
        distance_m: result.distanceM,
        valid: result.valid,
        mode,
        note: note || null,
      })
      .select('id, valid, distance_m, created_at')
      .single();

    if (insertError) {
      return NextResponse.json({ error: 'Failed to save check-in', details: insertError.message }, { status: 500 });
    }

    // Count valid check-ins for verification badge
    const { count } = await supabase
      .from('checkins')
      .select('user_id', { count: 'exact' })
      .eq('work_id', workId)
      .eq('valid', true);

    // Count distinct users (approximate — get all then unique)
    const { data: validCheckins } = await supabase
      .from('checkins')
      .select('user_id')
      .eq('work_id', workId)
      .eq('valid', true);

    const distinctUsers = new Set((validCheckins || []).map(c => c.user_id)).size;
    const isVerified = distinctUsers >= 3;

    return NextResponse.json({
      checkin,
      geofence: {
        distanceM: result.distanceM,
        valid: result.valid,
        thresholdM: 50,
      },
      verification: {
        totalValidCheckins: count || 0,
        distinctUsers,
        isVerified,
        requiredUsers: 3,
      },
    }, { status: 201 });
  } catch (err) {
    console.error('Check-in error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
