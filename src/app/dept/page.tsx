import { createServerClient } from '@/lib/supabase/server';
import DeptClient from '@/components/DeptClient';

export const dynamic = 'force-dynamic';

export default async function DeptPage() {
  const supabase = createServerClient();

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
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-[13px]" style={{ color: 'var(--color-text-primary)' }}>
              <thead>
                <tr className="border-b" style={{ borderColor: 'var(--color-border-default)', color: 'var(--color-text-tertiary)' }}>
                  <th className="py-3 font-medium uppercase tracking-wide text-[11px]">Title</th>
                  <th className="py-3 font-medium uppercase tracking-wide text-[11px]">Type</th>
                  <th className="py-3 font-medium uppercase tracking-wide text-[11px]">Status</th>
                  <th className="py-3 font-medium uppercase tracking-wide text-[11px]">Dates</th>
                  <th className="py-3 font-medium uppercase tracking-wide text-[11px]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {works.map((work: Record<string, unknown>) => (
                  <tr key={work.id as string} className="border-b" style={{ borderColor: 'var(--color-border-default)' }}>
                    <td className="py-3 font-medium">{work.title as string}</td>
                    <td className="py-3 capitalize" style={{ color: 'var(--color-text-secondary)' }}>{work.type as string}</td>
                    <td className="py-3">
                      <StatusBadge status={work.status as string} />
                    </td>
                    <td className="py-3 font-mono" style={{ color: 'var(--color-text-secondary)' }}>
                      {work.start_date as string} &rarr; {work.end_date as string}
                    </td>
                    <td className="py-3">
                      <a href={`/works/${work.id}`} className="hover:underline" style={{ color: 'var(--color-brand-600)' }}>
                        View &rarr;
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-12" style={{ color: 'var(--color-text-secondary)' }}>
            <p className="text-[13px]">No works found. Create a new work project to get started.</p>
          </div>
        )}
      </div>
    </DeptClient>
  );
}

function StatusBadge({ status }: { status: string }) {
  const statusColors: Record<string, string> = {
    planned: 'var(--color-text-secondary)',
    active: 'var(--color-brand-600)',
    completed: 'var(--color-success)',
    delayed: 'var(--color-danger)',
    cancelled: 'var(--color-text-tertiary)',
  };

  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[11px] font-medium rounded-full border uppercase tracking-wider" style={{ borderColor: 'var(--color-border-default)', color: 'var(--color-text-primary)' }}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: statusColors[status] || 'var(--color-text-tertiary)' }}></span>
      {status}
    </span>
  );
}
