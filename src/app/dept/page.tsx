import { createServerClient } from '@/lib/supabase/server';
import DeptClient from '@/components/DeptClient';

export const dynamic = 'force-dynamic';

const STATUS_CONFIG: Record<string, { label: string; dot: string }> = {
  planned: { label: 'Planned', dot: '#3b82f6' },
  active: { label: 'Active', dot: '#d97706' },
  completed: { label: 'Completed', dot: '#16a34a' },
  delayed: { label: 'Delayed', dot: '#dc2626' },
  cancelled: { label: 'Cancelled', dot: '#9ca3af' },
};

export default async function DeptPage() {
  const supabase = await createServerClient();

  // Check auth
  const { data: { user } } = await supabase.auth.getUser();
  const isLoggedIn = !!user;
  const userEmail = user?.email || undefined;

  // Fetch works if logged in
  let works: any[] = [];
  if (isLoggedIn) {
    const { data } = await supabase
      .from('works')
      .select(`
        id, title, status, type, start_date, end_date,
        departments ( name )
      `)
      .order('created_at', { ascending: false });
    works = data || [];
  }

  const worksList = isLoggedIn ? (
    works.length === 0 ? (
      <div className="py-12 text-center" style={{ color: 'var(--color-text-tertiary)' }}>
        <p className="text-[14px] mb-2" style={{ color: 'var(--color-text-secondary)' }}>No works registered yet</p>
        <p className="text-[13px]">Click "Register New Work" to get started.</p>
      </div>
    ) : (
      <div style={{ borderTop: '1px solid var(--color-border-default)' }}>
        {/* Table header */}
        <div
          className="grid grid-cols-12 gap-4 px-4 py-2.5 text-[11px] font-medium"
          style={{ color: 'var(--color-text-tertiary)', letterSpacing: '0.04em', borderBottom: '1px solid var(--color-border-default)' }}
        >
          <div className="col-span-4">TITLE</div>
          <div className="col-span-2">DEPARTMENT</div>
          <div className="col-span-2">TYPE</div>
          <div className="col-span-2">DATES</div>
          <div className="col-span-2 text-right">STATUS</div>
        </div>

        {/* Table rows */}
        {works.map((w: any) => {
          const cfg = STATUS_CONFIG[w.status] || STATUS_CONFIG.planned;
          return (
            <a
              key={w.id}
              href={`/works/${w.id}`}
              className="grid grid-cols-12 gap-4 px-4 py-3 text-[13px] transition-colors hover:bg-[var(--color-surface-secondary)]"
              style={{ borderBottom: '1px solid var(--color-border-default)' }}
            >
              <div className="col-span-4 font-medium truncate" style={{ color: 'var(--color-text-primary)' }}>
                {w.title}
              </div>
              <div className="col-span-2 truncate" style={{ color: 'var(--color-text-secondary)' }}>
                {w.departments?.name || '-'}
              </div>
              <div className="col-span-2 capitalize" style={{ color: 'var(--color-text-secondary)' }}>
                {w.type}
              </div>
              <div className="col-span-2 font-mono text-[11px] tabular-nums" style={{ color: 'var(--color-text-tertiary)' }}>
                {w.start_date}
              </div>
              <div className="col-span-2 text-right">
                <span
                  className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-medium"
                  style={{ backgroundColor: `${cfg.dot}15`, color: cfg.dot }}
                >
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: cfg.dot }} />
                  {cfg.label}
                </span>
              </div>
            </a>
          );
        })}
      </div>
    )
  ) : null;

  return (
    <DeptClient isLoggedIn={isLoggedIn} userEmail={userEmail}>
      {worksList}
    </DeptClient>
  );
}
