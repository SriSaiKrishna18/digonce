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

  return (<div className="max-w-6xl mx-auto px-5 py-12"><div className="mb-12"><h1 className="text-2xl font-semibold tracking-tight mb-2" style={{ color: "var(--color-text-primary)" }}>Works Timeline</h1><p className="text-[14px]" style={{ color: "var(--color-text-secondary)" }}>Visualizing overlapping excavations.</p></div><div className="relative overflow-x-auto min-h-[400px]"><div className="min-w-[800px] relative"><div className="flex justify-between text-[11px] pb-4 mb-4 font-mono uppercase tracking-widest" style={{ color: "var(--color-text-tertiary)", borderBottom: "1px solid var(--color-border-default)" }}><span>{new Date(minDate).toLocaleDateString()}</span><span>{new Date(maxDate).toLocaleDateString()}</span></div><div className="space-y-3 relative pt-4">{works.map((w) => {const start = new Date(w.start_date).getTime(); const end = new Date(w.end_date).getTime(); const leftPerc = Math.max(0, ((start - minDate) / totalRange) * 100); const widthPerc = Math.max(0.5, ((end - start) / totalRange) * 100); const color = getStatusColor(w.status); let hasOverlap = false; for (const pair of overlapPairs) { if (pair.includes(w.id)) hasOverlap = true; } return (<div key={w.id} className="relative h-7 group"><div className="absolute h-full flex items-center px-3 text-[12px] font-medium transition-all" style={{ left: `${leftPerc}%`, width: `${widthPerc}%`, backgroundColor: `${color}15`, borderLeft: `3px solid ${color}`, color: "var(--color-text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{w.title}</div>{hasOverlap && (<div className="absolute top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-red-500" style={{ left: `calc(${leftPerc}% - 8px)` }} title="Conflicts with another scheduled work"/>)}</div>);})}</div></div></div></div>);}
