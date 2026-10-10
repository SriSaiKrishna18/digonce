import { createServerClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import WorkMap from '@/components/WorkMap';
import { detectConflicts } from '@/lib/engine';

export const dynamic = 'force-dynamic';

const STATUS_STYLES: Record<string, { dot: string; label: string }> = {
  planned: { dot: '#3b82f6', label: 'Planned' },
  active: { dot: '#d97706', label: 'Active' },
  completed: { dot: '#16a34a', label: 'Completed' },
  delayed: { dot: '#dc2626', label: 'Delayed' },
  cancelled: { dot: '#9ca3af', label: 'Cancelled' },
};

export default async function WorkDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createServerClient();

  const { data: work } = await supabase
    .from('works')
    .select(`
      *,
      departments ( name ),
      work_segments ( segments ( id, name, geometry ) ),
      delay_events ( * ),
      checkins ( user_id, valid )
    `)
    .eq('id', id)
    .single();

  if (!work) notFound();

  // Build segments GeoJSON for map
  const segments = {
    type: 'FeatureCollection' as const,
    features: work.work_segments?.map((ws: any) => ({
      type: 'Feature' as const,
      geometry: ws.segments?.geometry,
      properties: { id: ws.segments?.id, name: ws.segments?.name },
    })).filter((f: any) => f.geometry) || [],
  };

  const segmentIds = work.work_segments?.map((ws: any) => ws.segments?.id).filter(Boolean) || [];

  // Check-in stats
  const validCheckins = work.checkins?.filter((c: any) => c.valid) || [];
  const distinctUsers = new Set(validCheckins.map((c: any) => c.user_id)).size;
  const isVerified = distinctUsers >= 3;

  const cfg = STATUS_STYLES[work.status] || STATUS_STYLES.planned;

  // Live conflict detection — run engine against all works on these segments
  let conflicts: any[] = [];
  try {
    const { data: allWorks } = await supabase
      .from('works')
      .select('id, title, type, status, department_id, start_date, end_date, work_segments ( segment_id )')
      .in('status', ['planned', 'active', 'delayed']);

    if (allWorks) {
      const engineWorks = allWorks.map((w: any) => ({
        id: w.id,
        title: w.title,
        type: w.type as any,
        status: w.status as any,
        departmentId: w.department_id,
        segmentIds: w.work_segments?.map((ws: any) => ws.segment_id) || [],
        startDate: w.start_date,
        endDate: w.end_date,
      }));
      const result = detectConflicts(
        {
          id: work.id,
          title: work.title,
          type: work.type as any,
          status: work.status as any,
          departmentId: work.department_id,
          segmentIds,
          startDate: work.start_date,
          endDate: work.end_date,
        },
        engineWorks,
      );
      conflicts = result;
    }
  } catch {
    // Engine errors are non-fatal
  }

  return (
    <div className="max-w-6xl mx-auto py-8 px-5">
      {/* Back link */}
      <Link href="/" className="nav-link text-[13px] inline-block mb-6">
        &larr; Back to map
      </Link>

      {/* Title + status */}
      <div className="flex items-start justify-between gap-4 mb-2">
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--color-text-primary)' }}>
          {work.title}
        </h1>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-medium"
            style={{ backgroundColor: `${cfg.dot}15`, color: cfg.dot }}
          >
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: cfg.dot }} />
            {cfg.label}
          </span>
          {isVerified && (
            <span
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-medium"
              style={{ backgroundColor: 'var(--color-success-bg)', color: 'var(--color-success)' }}
            >
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><circle cx="5" cy="5" r="4" stroke="currentColor" strokeWidth="1.5"/><path d="M3 5l1.5 1.5L7 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              Verified
            </span>
          )}
        </div>
      </div>
      <p className="text-[14px] mb-8" style={{ color: 'var(--color-text-secondary)' }}>{work.purpose}</p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left column — details + delays + conflicts */}
        <div className="lg:col-span-2 space-y-8">
          {/* Details grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Department', value: work.departments?.name || '-' },
              { label: 'Contractor', value: work.contractor_name || '-' },
              { label: 'Type', value: work.type, capitalize: true },
              { label: 'Dates', value: `${work.start_date} to ${work.end_date}`, mono: true },
            ].map(field => (
              <div key={field.label} className="py-3" style={{ borderBottom: '1px solid var(--color-border-default)' }}>
                <div className="text-[11px] font-medium mb-1" style={{ color: 'var(--color-text-tertiary)', letterSpacing: '0.04em' }}>
                  {field.label.toUpperCase()}
                </div>
                <div
                  className={`text-[13px] ${field.mono ? 'font-mono text-[12px]' : ''} ${field.capitalize ? 'capitalize' : ''}`}
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  {field.value}
                </div>
              </div>
            ))}
          </div>

          {/* Delay Ledger */}
          <div>
            <h2 className="text-[12px] font-medium mb-4" style={{ color: 'var(--color-text-tertiary)', letterSpacing: '0.04em' }}>
              DELAY LEDGER
            </h2>
            {work.delay_events && work.delay_events.length > 0 ? (
              <table className="w-full text-[13px] text-left">
                <thead>
                  <tr style={{ color: 'var(--color-text-tertiary)', borderBottom: '1px solid var(--color-border-default)' }}>
                    <th className="py-2 font-medium text-[11px]">DATE</th>
                    <th className="py-2 font-medium text-[11px]">EXTENSION</th>
                    <th className="py-2 font-medium text-[11px]">REASON</th>
                    <th className="py-2 font-medium text-[11px]">NOTE</th>
                  </tr>
                </thead>
                <tbody>
                  {work.delay_events.map((d: any) => (
                    <tr key={d.id} style={{ borderBottom: '1px solid var(--color-border-default)' }}>
                      <td className="py-2.5 font-mono text-[12px]">{d.created_at?.slice(0, 10)}</td>
                      <td className="py-2.5 font-mono text-[12px]">{d.old_end} &rarr; {d.new_end}</td>
                      <td className="py-2.5 capitalize">{d.reason?.replace(/_/g, ' ')}</td>
                      <td className="py-2.5" style={{ color: 'var(--color-text-secondary)' }}>{d.note || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-[13px]" style={{ color: 'var(--color-text-tertiary)' }}>No delays recorded.</p>
            )}
          </div>

          {/* Conflict Analysis — live engine results */}
          <div>
            <h2 className="text-[12px] font-medium mb-4" style={{ color: 'var(--color-text-tertiary)', letterSpacing: '0.04em' }}>
              CONFLICT ANALYSIS
            </h2>
            {conflicts.length === 0 ? (
              <div className="flex items-center gap-2.5 px-4 py-3 rounded-md" style={{ border: '1px solid #bbf7d0', backgroundColor: 'var(--color-success-bg)' }}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="6" stroke="var(--color-success)" strokeWidth="1.5"/><path d="M4.5 7L6 8.5L9.5 5" stroke="var(--color-success)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                <span className="text-[13px] font-medium" style={{ color: 'var(--color-success)' }}>No active conflicts</span>
              </div>
            ) : (
              <div className="space-y-2">
                {conflicts.map((c: any, i: number) => {
                  const isHigh = c.severity === 'high';
                  return (
                    <div
                      key={i}
                      className="px-4 py-3 rounded-md"
                      style={{
                        border: `1px solid ${isHigh ? '#fecaca' : c.severity === 'info' ? '#bfdbfe' : '#fde68a'}`,
                        backgroundColor: isHigh ? 'var(--color-danger-bg)' : c.severity === 'info' ? 'var(--color-info-bg)' : 'var(--color-warning-bg)',
                      }}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: isHigh ? 'var(--color-danger)' : c.severity === 'info' ? 'var(--color-info)' : 'var(--color-warning)' }} />
                        <span className="data-label" style={{ color: isHigh ? 'var(--color-danger)' : c.severity === 'info' ? 'var(--color-info)' : 'var(--color-warning)' }}>
                          {c.rule?.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <p className="text-[13px]" style={{ color: 'var(--color-text-primary)' }}>{c.explanation}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right column — map + check-ins */}
        <div className="space-y-6">
          <div className="rounded-md overflow-hidden" style={{ border: '1px solid var(--color-border-default)', height: '280px' }}>
            <WorkMap
              segments={segments}
              works={[{
                id: work.id, title: work.title, status: work.status, type: work.type,
                department_name: work.departments?.name,
                segment_ids: segmentIds,
                start_date: work.start_date, end_date: work.end_date,
              }]}
              center={[79.7036, 12.8342]}
            />
          </div>

          {/* Check-ins */}
          <div className="px-4 py-4 rounded-md" style={{ border: '1px solid var(--color-border-default)' }}>
            <h3 className="text-[12px] font-medium mb-3" style={{ color: 'var(--color-text-tertiary)', letterSpacing: '0.04em' }}>
              CITIZEN CHECK-INS
            </h3>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <div className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>{validCheckins.length}</div>
                <div className="text-[11px]" style={{ color: 'var(--color-text-tertiary)' }}>Valid check-ins</div>
              </div>
              <div>
                <div className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>{distinctUsers}</div>
                <div className="text-[11px]" style={{ color: 'var(--color-text-tertiary)' }}>Distinct users</div>
              </div>
            </div>
            <p className="text-[12px] mb-3" style={{ color: isVerified ? 'var(--color-success)' : 'var(--color-text-tertiary)' }}>
              {isVerified
                ? 'This work is citizen-verified.'
                : `${3 - distinctUsers} more distinct user(s) needed for verification.`}
            </p>
            <Link
              href={`/works/${work.id}/checkin`}
              className="block w-full text-center py-2.5 rounded-md text-[13px] font-medium transition-opacity hover:opacity-85"
              style={{ backgroundColor: 'var(--color-brand-600)', color: 'white' }}
            >
              Submit Check-in
            </Link>
          </div>

          {/* Segments list */}
          <div className="px-4 py-4 rounded-md" style={{ border: '1px solid var(--color-border-default)' }}>
            <h3 className="text-[12px] font-medium mb-3" style={{ color: 'var(--color-text-tertiary)', letterSpacing: '0.04em' }}>
              ROAD SEGMENTS ({segmentIds.length})
            </h3>
            <ul className="space-y-1">
              {work.work_segments?.map((ws: any) => (
                <li key={ws.segments?.id} className="text-[12px] flex items-center gap-2" style={{ color: 'var(--color-text-secondary)' }}>
                  <span className="w-1 h-1 rounded-full" style={{ backgroundColor: cfg.dot }} />
                  {ws.segments?.name || <span className="font-mono text-[11px]" style={{ color: 'var(--color-text-tertiary)' }}>{ws.segments?.id}</span>}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
