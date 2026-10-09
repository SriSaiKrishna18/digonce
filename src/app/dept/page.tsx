import { createServerClient } from '@/lib/supabase/server';
import DeptClient from '@/components/DeptClient';

export const dynamic = 'force-dynamic';

export default async function DeptPage() {
  const supabase = createServerClient();

  // For now, we render the login flow (client-side handles auth)
  // In a full implementation, we'd check auth server-side
  // But for the hackathon, the demo login flow is client-side

  // Fetch department's works (will be empty if not logged in, which is fine)
  const { data: works } = await supabase
    .from('works')
    .select(`
      id,
      title,
      type,
      status,
      start_date,
      end_date,
      original_end_date,
      departments ( name )
    `)
    .order('start_date', { ascending: false })
    .limit(50);

  return (
    <DeptClient isLoggedIn={false} departmentName={undefined}>
      <div className="space-y-4">
        {works && works.length > 0 ? (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dates</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {works.map((work: Record<string, unknown>) => (
                  <tr key={work.id as string} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium">{work.title as string}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 capitalize">{work.type as string}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={work.status as string} />
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {work.start_date as string} → {work.end_date as string}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <a href={`/works/${work.id}`} className="text-orange-600 hover:text-orange-700">
                        View →
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <div className="text-4xl mb-3">📋</div>
            <p>No works found. Create a new work project to get started.</p>
          </div>
        )}
      </div>
    </DeptClient>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    planned: 'bg-blue-100 text-blue-700',
    active: 'bg-amber-100 text-amber-700',
    completed: 'bg-green-100 text-green-700',
    delayed: 'bg-red-100 text-red-700',
    cancelled: 'bg-gray-100 text-gray-500',
  };

  return (
    <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full capitalize ${styles[status] || styles.planned}`}>
      {status}
    </span>
  );
}
