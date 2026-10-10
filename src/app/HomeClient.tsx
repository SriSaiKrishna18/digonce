'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import MapView from '@/components/MapViewDynamic';
import Link from 'next/link';

const STATUS_CONFIG: Record<string, { label: string; dot: string; bg: string; text: string }> = {
  planned: { label: 'Planned', dot: '#3b82f6', bg: 'rgb(239 246 255)', text: '#1e40af' },
  active: { label: 'Active', dot: '#d97706', bg: 'rgb(255 251 235)', text: '#92400e' },
  completed: { label: 'Completed', dot: '#16a34a', bg: 'rgb(240 253 244)', text: '#166534' },
  delayed: { label: 'Delayed', dot: '#dc2626', bg: 'rgb(254 242 242)', text: '#991b1b' },
  cancelled: { label: 'Cancelled', dot: '#9ca3af', bg: 'rgb(249 250 251)', text: '#6b7280' },
};

export default function HomeClient({ segments, works }: { segments: any; works: any[] }) {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const departments = useMemo(() => {
    return Array.from(new Set(works.map(w => w.department_name).filter(Boolean))).sort();
  }, [works]);

  const filteredWorks = useMemo(() => {
    return works.filter(w => {
      if (statusFilter && w.status !== statusFilter) return false;
      if (deptFilter && w.department_name !== deptFilter) return false;
      if (searchTerm && !w.title.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      return true;
    });
  }, [works, statusFilter, deptFilter, searchTerm]);

  const stats = useMemo(() => ({
    total: works.length,
    active: works.filter(w => w.status === 'active').length,
    delayed: works.filter(w => w.status === 'delayed').length,
    planned: works.filter(w => w.status === 'planned').length,
  }), [works]);

  return (
    <div className="flex flex-col lg:flex-row" style={{ height: 'calc(100vh - 5.5rem)' }}>
      {/* Map — dominant visual */}
      <div className="flex-1 relative w-full" style={{ minHeight: '500px' }}>
        <MapView
          segments={segments}
          works={filteredWorks}
          onWorkClick={(id: string) => router.push(`/works/${id}`)}
          center={[79.7036, 12.8342]}
        />
      </div>

      {/* Sidebar — data panel */}
      <aside
        className="w-full lg:w-[380px] flex flex-col overflow-hidden"
        style={{
          borderLeft: '1px solid var(--color-border-default)',
          backgroundColor: 'var(--color-surface-primary)',
        }}
      >
        {/* Stats row — compact, data-forward */}
        <div
          className="px-5 py-4"
          style={{ borderBottom: '1px solid var(--color-border-default)' }}
        >
          <div className="flex items-baseline justify-between mb-3">
            <h2 className="text-[15px] font-semibold" style={{ color: 'var(--color-text-primary)' }}>
              Public Works
            </h2>
            <span className="text-[12px] font-mono" style={{ color: 'var(--color-text-tertiary)' }}>
              {filteredWorks.length} of {works.length}
            </span>
          </div>

          <div className="grid grid-cols-4 gap-2">
            {[
              { label: 'Total', value: stats.total, color: 'var(--color-text-primary)' },
              { label: 'Active', value: stats.active, color: '#d97706' },
              { label: 'Delayed', value: stats.delayed, color: '#dc2626' },
              { label: 'Planned', value: stats.planned, color: '#3b82f6' },
            ].map(s => (
              <div key={s.label} className="text-center">
                <div className="text-lg font-semibold" style={{ color: s.color }}>{s.value}</div>
                <div className="text-[10px] font-medium" style={{ color: 'var(--color-text-tertiary)' }}>
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Filters */}
        <div
          className="px-5 py-3 space-y-2"
          style={{ borderBottom: '1px solid var(--color-border-default)' }}
        >
          <input
            type="text"
            placeholder="Search works..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 text-[13px] rounded-md transition-colors"
            style={{
              border: '1px solid var(--color-border-default)',
              backgroundColor: 'var(--color-surface-secondary)',
              color: 'var(--color-text-primary)',
            }}
          />
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="flex-1 px-2 py-1.5 text-[12px] rounded-md"
              style={{
                border: '1px solid var(--color-border-default)',
                backgroundColor: 'var(--color-surface-secondary)',
                color: 'var(--color-text-secondary)',
              }}
            >
              <option value="">All statuses</option>
              {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
            <select
              value={deptFilter}
              onChange={e => setDeptFilter(e.target.value)}
              className="flex-1 px-2 py-1.5 text-[12px] rounded-md"
              style={{
                border: '1px solid var(--color-border-default)',
                backgroundColor: 'var(--color-surface-secondary)',
                color: 'var(--color-text-secondary)',
              }}
            >
              <option value="">All departments</option>
              {departments.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Work list */}
        <div className="flex-1 overflow-y-auto">
          {filteredWorks.length === 0 ? (
            <div className="px-5 py-12 text-center" style={{ color: 'var(--color-text-tertiary)' }}>
              <p className="text-[13px]">No works match the current filters.</p>
            </div>
          ) : (
            <ul>
              {filteredWorks.map((w, i) => {
                const cfg = STATUS_CONFIG[w.status] || STATUS_CONFIG.planned;
                return (
                  <li key={w.id}>
                    <Link
                      href={`/works/${w.id}`}
                      className="block px-5 py-3.5 transition-colors"
                      style={{
                        borderBottom: '1px solid var(--color-border-default)',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--color-surface-secondary)')}
                      onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      {/* Title row */}
                      <div className="flex items-start justify-between gap-3 mb-1">
                        <h3
                          className="text-[13px] font-medium leading-snug"
                          style={{ color: 'var(--color-text-primary)' }}
                        >
                          {w.title}
                        </h3>
                        <span
                          className="flex-shrink-0 inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-medium whitespace-nowrap"
                          style={{ backgroundColor: cfg.bg, color: cfg.text }}
                        >
                          <span
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ backgroundColor: cfg.dot }}
                          />
                          {cfg.label}
                        </span>
                      </div>

                      {/* Meta row */}
                      <div className="flex items-center gap-3 text-[11px]" style={{ color: 'var(--color-text-tertiary)' }}>
                        <span>{w.department_name || 'Unknown dept'}</span>
                        <span>·</span>
                        <span className="font-mono tabular-nums">
                          {w.start_date} → {w.end_date}
                        </span>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </aside>
    </div>
  );
}
