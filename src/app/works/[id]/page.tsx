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
    planned: 'bg-blue-100 text-blue-800',
    active: 'bg-amber-100 text-amber-800',
    completed: 'bg-green-100 text-green-800',
    delayed: 'bg-red-100 text-red-800',
    cancelled: 'bg-gray-100 text-gray-800'
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
      <div>
        <Link href="/" className="text-blue-600 hover:underline mb-4 inline-block">&larr; Back to Home</Link>
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold">{work.title}</h1>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[work.status] || 'bg-gray-100'}`}>
            {work.status}
          </span>
          {isVerified && (
            <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 border border-green-200 flex items-center gap-1">
              ✓ Verified
            </span>
          )}
        </div>
        <p className="text-gray-600 mt-2 text-lg">{work.purpose}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
            <h2 className="text-xl font-semibold mb-4">Details</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="block text-sm text-gray-500">Department</span>
                <span className="font-medium">{work.departments?.name}</span>
              </div>
              <div>
                <span className="block text-sm text-gray-500">Contractor</span>
                <span className="font-medium">{work.contractor_name}</span>
              </div>
              <div>
                <span className="block text-sm text-gray-500">Type</span>
                <span className="font-medium">{work.type}</span>
              </div>
              <div>
                <span className="block text-sm text-gray-500">Dates</span>
                <span className="font-medium">
                  {new Date(work.start_date).toLocaleDateString()} - {new Date(work.end_date).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
            <h2 className="text-xl font-semibold mb-4">Timeline & Delays</h2>
            {work.delay_events && work.delay_events.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm text-left text-gray-600">
                  <thead className="bg-gray-50 text-gray-700 uppercase">
                    <tr>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Extension</th>
                      <th className="px-4 py-3">Reason</th>
                      <th className="px-4 py-3">Note</th>
                    </tr>
                  </thead>
                  <tbody>
                    {work.delay_events.map((delay: any) => (
                      <tr key={delay.id} className="border-b">
                        <td className="px-4 py-3">{new Date(delay.created_at).toLocaleDateString()}</td>
                        <td className="px-4 py-3">
                          {new Date(delay.old_end).toLocaleDateString()} &rarr; {new Date(delay.new_end).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3">{delay.reason}</td>
                        <td className="px-4 py-3">{delay.note}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500">No delays recorded.</p>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="h-[300px] rounded-lg overflow-hidden border border-gray-200 shadow">
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

          <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
            <h2 className="text-xl font-semibold mb-4">Citizen Check-ins</h2>
            <div className="mb-4">
              <div className="text-3xl font-bold">{validCheckins.length}</div>
              <div className="text-sm text-gray-500">Valid check-ins</div>
              <div className="text-sm text-gray-500 mt-1">From {distinctUsers} distinct users</div>
            </div>
            
            <Link 
              href={`/works/${work.id}/checkin`}
              className="block w-full text-center bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded transition-colors"
            >
              Submit Check-in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
