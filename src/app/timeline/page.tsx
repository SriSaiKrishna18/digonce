'use client';

import { useEffect, useState } from 'react';

type Work = {
  id: string;
  title: string;
  status: string;
  type: string;
  start_date: string;
  end_date: string;
  department_id: string;
  departments: { name: string };
  work_segments: { segment_id: string }[];
};

export default function TimelinePage() {
  const [works, setWorks] = useState<Work[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchWorks() {
      try {
        const res = await fetch('/api/works-timeline');
        const data = await res.json();
        setWorks(data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchWorks();
  }, []);

  if (loading) {
    return <div className="p-10 max-w-6xl mx-auto text-[13px]" style={{ color: 'var(--color-text-secondary)' }}>Loading timeline...</div>;
  }

  // Calculate min and max dates
  let minDate = new Date().getTime();
  let maxDate = new Date().getTime();

  if (works.length > 0) {
    minDate = Math.min(...works.map(w => new Date(w.start_date).getTime()));
    maxDate = Math.max(...works.map(w => new Date(w.end_date).getTime()));
  }

  // Add 10% padding
  const range = Math.max(maxDate - minDate, 86400000); // minimum 1 day
  minDate -= range * 0.1;
  maxDate += range * 0.1;
  const totalRange = maxDate - minDate;

  // Find overlapping segments
  const segmentToWorks = new Map<string, Work[]>();
  works.forEach(w => {
    const segments = Array.isArray(w.work_segments) ? w.work_segments : [w.work_segments].filter(Boolean);
    segments.forEach((ws: any) => {
      const segId = ws.segment_id;
      if (!segmentToWorks.has(segId)) segmentToWorks.set(segId, []);
      segmentToWorks.get(segId)!.push(w);
    });
  });

  const overlapPairs = new Set<string>();
  segmentToWorks.forEach(segmentWorks => {
    for (let i = 0; i < segmentWorks.length; i++) {
      for (let j = i + 1; j < segmentWorks.length; j++) {
        const w1 = segmentWorks[i];
        const w2 = segmentWorks[j];
        if (w1.id === w2.id) continue;
        
        // simple overlap check: d1_start <= d2_end && d1_end >= d2_start
        const s1 = new Date(w1.start_date).getTime();
        const e1 = new Date(w1.end_date).getTime();
        const s2 = new Date(w2.start_date).getTime();
        const e2 = new Date(w2.end_date).getTime();
        if (s1 <= e2 && e1 >= s2) {
           overlapPairs.add([w1.id, w2.id].sort().join('-'));
        }
      }
    }
  });

  function getStatusColor(status: string) {
    switch (status?.toLowerCase()) {
      case 'planned': return '#3b82f6';
      case 'active': return '#f59e0b';
      case 'delayed': return '#ef4444';
      case 'completed': return '#22c55e';
      default: return '#9ca3af';
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-5 py-10" style={{ fontFamily: 'var(--font-dm-sans)' }}>
      <div className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight mb-2" style={{ color: 'var(--color-text-primary)' }}>Works Timeline</h1>
        <p className="text-[15px]" style={{ color: 'var(--color-text-secondary)' }}>Visualizing overlapping excavations and coordination opportunities.</p>
      </div>

      <div className="relative rounded-lg p-6 overflow-x-auto min-h-[400px]" style={{ backgroundColor: 'var(--color-surface-secondary)', border: '1px solid var(--color-border-default)' }}>
        <div className="min-w-[800px] relative">
          {/* Axis */}
          <div className="absolute top-0 bottom-0 left-0 w-px" style={{ backgroundColor: 'var(--color-border-default)' }} />
          <div className="absolute top-0 bottom-0 right-0 w-px" style={{ backgroundColor: 'var(--color-border-default)' }} />
          <div className="flex justify-between text-[11px] pb-2 mb-4 font-mono" style={{ color: 'var(--color-text-tertiary)', borderBottom: '1px solid var(--color-border-default)' }}>
            <span>{new Date(minDate).toLocaleDateString()}</span>
            <span>{new Date(minDate + totalRange / 2).toLocaleDateString()}</span>
            <span>{new Date(maxDate).toLocaleDateString()}</span>
          </div>

          {/* Works */}
          <div className="space-y-4 relative pt-2">
            {works.map(work => {
              const start = new Date(work.start_date).getTime();
              const end = new Date(work.end_date).getTime();
              const left = ((start - minDate) / totalRange) * 100;
              const width = Math.max(((end - start) / totalRange) * 100, 0.5); // minimum width
              
              // check if overlapping
              const isOverlapping = Array.from(overlapPairs).some(pair => pair.includes(work.id));

              return (
                <div key={work.id} className="relative h-12">
                  <div 
                    className="absolute h-8 rounded-md opacity-80 flex items-center px-2 cursor-pointer hover:opacity-100 transition-opacity whitespace-nowrap overflow-hidden"
                    style={{ left: `${left}%`, width: `${width}%`, backgroundColor: getStatusColor(work.status) }}
                    title={`${work.title} (${work.departments?.name})`}
                  >
                    <span className="text-white text-[11px] font-medium truncate">{work.title}</span>
                  </div>
                  {isOverlapping && (
                    <div 
                      className="absolute w-4 h-4 rounded-full flex items-center justify-center text-white text-[9px] font-bold z-10"
                      style={{ left: `${left}%`, top: '-4px', transform: 'translateX(-50%)', backgroundColor: '#dc2626', border: '1px solid white' }}
                      title="Overlap detected on same road segment!"
                    >
                      !
                    </div>
                  )}
                </div>
              );
            })}
            
            {works.length === 0 && (
               <div className="text-center py-10 text-[13px]" style={{ color: 'var(--color-text-tertiary)' }}>No works found</div>
            )}
          </div>
        </div>
      </div>
      
      <div className="mt-6 flex gap-4 text-[11px] uppercase tracking-wider font-medium" style={{ color: 'var(--color-text-tertiary)' }}>
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm" style={{ backgroundColor: '#3b82f6' }}></div> Planned</div>
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm" style={{ backgroundColor: '#f59e0b' }}></div> Active</div>
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm" style={{ backgroundColor: '#ef4444' }}></div> Delayed</div>
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm" style={{ backgroundColor: '#22c55e' }}></div> Completed</div>
      </div>
    </div>
  );
}
