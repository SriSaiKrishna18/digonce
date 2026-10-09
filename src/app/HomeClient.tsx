'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import MapView from '@/components/MapViewDynamic';
import Link from 'next/link';

export default function HomeClient({ segments, works }: { segments: any, works: any[] }) {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  
  const filteredWorks = useMemo(() => {
    return works.filter(w => {
      if (statusFilter && w.status !== statusFilter) return false;
      if (deptFilter && w.department_name !== deptFilter) return false;
      return true;
    });
  }, [works, statusFilter, deptFilter]);

  const stats = {
    total: works.length,
    active: works.filter(w => w.status === 'active').length,
    delayed: works.filter(w => w.status === 'delayed').length,
    conflicts: 0 // placeholder
  };

  return (
    <div className="flex flex-col md:flex-row w-full h-[calc(100vh-5rem)]">
      <div className="w-full md:w-2/3 h-[60%] md:h-full">
        <MapView 
          segments={segments} 
          works={filteredWorks} 
          onWorkClick={(id: string) => router.push(`/works/${id}`)}
          center={[79.7036, 12.8342]}
        />
      </div>
      <div className="w-full md:w-1/3 h-[40%] md:h-full flex flex-col bg-white border-l border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-xl font-bold mb-4">Works Dashboard</h2>
          <div className="grid grid-cols-2 gap-2 mb-4 text-sm">
            <div className="bg-blue-50 p-2 rounded">Total: {stats.total}</div>
            <div className="bg-amber-50 p-2 rounded">Active: {stats.active}</div>
            <div className="bg-red-50 p-2 rounded">Delayed: {stats.delayed}</div>
            <div className="bg-orange-50 p-2 rounded">Conflicts: {stats.conflicts}</div>
          </div>
          <div className="space-y-2">
            <select 
              className="w-full p-2 border rounded text-sm"
              value={statusFilter} 
              onChange={e => setStatusFilter(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="planned">Planned</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="delayed">Delayed</option>
            </select>
            <select 
              className="w-full p-2 border rounded text-sm"
              value={deptFilter} 
              onChange={e => setDeptFilter(e.target.value)}
            >
              <option value="">All Departments</option>
              {Array.from(new Set(works.map(w => w.department_name))).filter(Boolean).map(dept => (
                <option key={dept as string} value={dept as string}>{dept as string}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {filteredWorks.map(w => (
            <Link href={`/works/${w.id}`} key={w.id} className="block border p-3 rounded hover:bg-gray-50 transition-colors">
              <div className="font-semibold">{w.title}</div>
              <div className="text-sm text-gray-600">{w.department_name}</div>
              <div className="flex justify-between mt-2 text-xs">
                <span className={`px-2 py-1 rounded-full ${w.status === 'completed' ? 'bg-green-100 text-green-800' : w.status === 'active' ? 'bg-amber-100 text-amber-800' : w.status === 'delayed' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}`}>
                  {w.status}
                </span>
                <span>{new Date(w.start_date).toLocaleDateString()} - {new Date(w.end_date).toLocaleDateString()}</span>
              </div>
            </Link>
          ))}
          {filteredWorks.length === 0 && (
            <div className="text-gray-500 text-center py-4">No works found matching filters.</div>
          )}
        </div>
      </div>
    </div>
  );
}
