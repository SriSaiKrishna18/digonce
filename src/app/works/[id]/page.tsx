import { createServerClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import WorkMap from '@/components/WorkMap';

export const dynamic = 'force-dynamic';
export default async function WorkDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createServerClient();
  
  // Fetch work details
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

  if (!work) {
    notFound();
  }

  // Process data
  const segments = {
    type: 'FeatureCollection',
    features: work.work_segments?.map((ws: any) => ({
      type: 'Feature',
      geometry: ws.segments?.geometry,
      properties: {
        id: ws.segments?.id,
        name: ws.segments?.name,
      }
    })) || []
  };

  const validCheckins = work.checkins?.filter((c: any) => c.valid) || [];
  const distinctUsers = new Set(validCheckins.map((c: any) => c.user_id)).size;
  const isVerified = distinctUsers >= 3;

  const statusColors: Record<string, string> = {
    planned: 'var(--color-text-secondary)',
    active: 'var(--color-brand-600)',
    completed: 'var(--color-success)',
    delayed: 'var(--color-danger)',
    cancelled: 'var(--color-text-tertiary)'
  };

  return (
    <div style={{ color: 'var(--color-text-primary)' }} className="max-w-7xl mx-auto p-4 md:p-6 space-y-8">
      <div>
        <Link href="/" style={{ color: 'var(--color-text-secondary)' }} className="hover:underline mb-4 inline-block text-[13px]">&larr; Back to Home</Link>
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold">{work.title}</h1>
          <span className="px-2 py-1 rounded-full text-[11px] font-medium border uppercase tracking-wider flex items-center gap-1.5" style={{ borderColor: 'var(--color-border-default)', color: 'var(--color-text-primary)' }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: statusColors[work.status] || 'var(--color-text-tertiary)' }}></span>
            {work.status}
          </span>
          {isVerified && (
            <span className="px-2 py-1 rounded-full text-[11px] font-medium border uppercase tracking-wider flex items-center gap-1.5" style={{ borderColor: 'var(--color-border-default)', color: 'var(--color-success)' }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'var(--color-success)' }}></span>
              Verified
            </span>
          )}
        </div>
        <p style={{ color: 'var(--color-text-secondary)' }} className="mt-2 text-[15px]">{work.purpose}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-10">
          <div>
            <h2 className="text-[15px] font-semibold mb-4 border-b pb-2 uppercase tracking-wide" style={{ borderColor: 'var(--color-border-default)', color: 'var(--color-text-primary)' }}>Details</h2>
            <div className="grid grid-cols-2 gap-y-4 gap-x-6">
              <div className="border-b pb-2" style={{ borderColor: 'var(--color-border-default)' }}>
                <span className="block text-[11px] uppercase tracking-wide mb-1" style={{ color: 'var(--color-text-tertiary)' }}>Department</span>
                <span className="text-[13px]">{work.departments?.name}</span>
              </div>
              <div className="border-b pb-2" style={{ borderColor: 'var(--color-border-default)' }}>
                <span className="block text-[11px] uppercase tracking-wide mb-1" style={{ color: 'var(--color-text-tertiary)' }}>Contractor</span>
                <span className="text-[13px]">{work.contractor_name}</span>
              </div>
              <div className="border-b pb-2" style={{ borderColor: 'var(--color-border-default)' }}>
                <span className="block text-[11px] uppercase tracking-wide mb-1" style={{ color: 'var(--color-text-tertiary)' }}>Type</span>
                <span className="text-[13px] capitalize">{work.type}</span>
              </div>
              <div className="border-b pb-2" style={{ borderColor: 'var(--color-border-default)' }}>
                <span className="block text-[11px] uppercase tracking-wide mb-1" style={{ color: 'var(--color-text-tertiary)' }}>Dates</span>
                <span className="text-[13px] font-mono">
                  {new Date(work.start_date).toLocaleDateString()} - {new Date(work.end_date).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-[15px] font-semibold mb-4 border-b pb-2 uppercase tracking-wide" style={{ borderColor: 'var(--color-border-default)', color: 'var(--color-text-primary)' }}>Timeline & Delays</h2>
            {work.delay_events && work.delay_events.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full text-[13px] text-left">
                  <thead>
                    <tr style={{ color: 'var(--color-text-tertiary)', borderColor: 'var(--color-border-default)' }} className="border-b">
                      <th className="py-2 font-medium">Date</th>
                      <th className="py-2 font-medium">Extension</th>
                      <th className="py-2 font-medium">Reason</th>
                      <th className="py-2 font-medium">Note</th>
                    </tr>
                  </thead>
                  <tbody>
                    {work.delay_events.map((delay: any) => (
                      <tr key={delay.id} className="border-b" style={{ borderColor: 'var(--color-border-default)' }}>
                        <td className="py-2 font-mono">{new Date(delay.created_at).toLocaleDateString()}</td>
                        <td className="py-2 font-mono">
                          {new Date(delay.old_end).toLocaleDateString()} &rarr; {new Date(delay.new_end).toLocaleDateString()}
                        </td>
                        <td className="py-2 capitalize">{delay.reason?.replace(/_/g, ' ')}</td>
                        <td className="py-2" style={{ color: 'var(--color-text-secondary)' }}>{delay.note}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-[13px]" style={{ color: 'var(--color-text-secondary)' }}>No delays recorded.</p>
            )}
          </div>
        </div>

        <div className="space-y-8">
          <div className="w-full h-[280px] border" style={{ borderColor: 'var(--color-border-default)' }}>
            <WorkMap 
              segments={segments} 
              works={[{
                id: work.id,
                title: work.title,
                status: work.status,
                type: work.type,
                department_name: work.departments?.name,
                segment_ids: work.work_segments?.map((ws: any) => ws.segments?.id).filter(Boolean) || [],
                start_date: work.start_date,
                end_date: work.end_date
              }]}
              center={[79.7036, 12.8342]}
            />
          </div>

          <div>
            <h2 className="text-[15px] font-semibold mb-4 border-b pb-2 uppercase tracking-wide" style={{ borderColor: 'var(--color-border-default)', color: 'var(--color-text-primary)' }}>Citizen Check-ins</h2>
            <div className="mb-4 text-[13px]" style={{ color: 'var(--color-text-secondary)' }}>
              There are <strong style={{ color: 'var(--color-text-primary)' }}>{validCheckins.length} valid check-ins</strong> from {distinctUsers} distinct users. 
              {isVerified ? ' This work is verified by the community.' : ' Needs more check-ins for verification.'}
            </div>
            
            <Link 
              href={`/works/${work.id}/checkin`}
              className="block w-full text-center text-[13px] font-medium py-2 px-4 border transition-colors"
              style={{ 
                borderColor: 'var(--color-border-default)',
                color: 'var(--color-text-primary)',
                backgroundColor: 'var(--color-surface-primary)'
              }}
            >
              Submit Check-in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
