'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import ConflictPanel from '@/components/ConflictPanel';
import type { Conflict } from '@/lib/engine';

interface Segment {
  id: string;
  name: string | null;
  ward: string | null;
}

interface NewWorkFormProps {
  segments: Segment[];
  departmentId: string;
  departmentName: string;
  authToken: string;
}

const WORK_TYPES = [
  { value: 'excavation', label: 'Excavation' },
  { value: 'resurfacing', label: 'Resurfacing' },
  { value: 'pipeline', label: 'Pipeline' },
  { value: 'drainage', label: 'Drainage' },
  { value: 'cable', label: 'Cable' },
  { value: 'other', label: 'Other' },
];

export default function NewWorkForm({ segments, departmentId, departmentName, authToken }: NewWorkFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [purpose, setPurpose] = useState('');
  const [type, setType] = useState('excavation');
  const [contractorName, setContractorName] = useState('');
  const [selectedSegments, setSelectedSegments] = useState<string[]>([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [overrideReason, setOverrideReason] = useState('');
  const [segmentSearch, setSegmentSearch] = useState('');

  const [conflicts, setConflicts] = useState<Conflict[]>([]);
  const [conflictsLoading, setConflictsLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Debounced conflict check
  const checkConflicts = useCallback(async () => {
    if (!selectedSegments.length || !startDate || !endDate || !type || !departmentId) {
      setConflicts([]);
      return;
    }

    setConflictsLoading(true);
    try {
      const res = await fetch('/api/conflicts/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title || 'Untitled',
          type,
          departmentId,
          segmentIds: selectedSegments,
          startDate,
          endDate,
          editingWorkId: null,
        }),
      });
      const data = await res.json();
      setConflicts(data.conflicts || []);
    } catch {
      console.error('Conflict check failed');
    } finally {
      setConflictsLoading(false);
    }
  }, [title, type, departmentId, selectedSegments, startDate, endDate]);

  // Auto-check conflicts on form change (debounced)
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(checkConflicts, 500);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [checkConflicts]);

  function handleAcceptSuggestion(conflict: Conflict) {
    if (conflict.suggestion) {
      setStartDate(conflict.suggestion.start);
      setEndDate(conflict.suggestion.end);
    }
  }

  function toggleSegment(segId: string) {
    setSelectedSegments(prev =>
      prev.includes(segId)
        ? prev.filter(id => id !== segId)
        : [...prev, segId]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch('/api/works', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          title,
          purpose,
          type,
          departmentId,
          contractorName: contractorName || undefined,
          segmentIds: selectedSegments,
          startDate,
          endDate,
          overrideReason: overrideReason || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 409) {
          setError('High-severity conflicts detected. Provide an override reason or adjust dates.');
          setConflicts(data.conflicts || []);
        } else {
          setError(data.error || 'Failed to create work');
        }
        return;
      }

      router.push(`/works/${data.work.id}`);
    } catch {
      setError('Network error');
    } finally {
      setSubmitting(false);
    }
  }

  const highConflicts = conflicts.filter(c => c.severity === 'high');
  const filteredSegments = segments.filter(s =>
    !segmentSearch ||
    (s.name && s.name.toLowerCase().includes(segmentSearch.toLowerCase())) ||
    s.id.toLowerCase().includes(segmentSearch.toLowerCase())
  );

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto py-6 px-4">
      <div className="mb-6">
        <a href="/dept" className="text-sm text-gray-500 hover:text-gray-700">← Back to Dashboard</a>
        <h1 className="text-2xl font-bold mt-2">Register New Work Project</h1>
        <p className="text-sm text-gray-600">Department: {departmentName}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main form */}
        <div className="lg:col-span-2 space-y-5">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Project Title *</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              required
              maxLength={200}
              placeholder="e.g. Water pipeline replacement — Phase 2"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            />
          </div>

          {/* Purpose */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Purpose / Description *</label>
            <textarea
              value={purpose}
              onChange={e => setPurpose(e.target.value)}
              required
              maxLength={1000}
              rows={3}
              placeholder="What work is being done and why?"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Work Type *</label>
              <select
                value={type}
                onChange={e => setType(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              >
                {WORK_TYPES.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>

            {/* Contractor */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contractor Name</label>
              <input
                type="text"
                value={contractorName}
                onChange={e => setContractorName(e.target.value)}
                maxLength={200}
                placeholder="Optional"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Start Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date *</label>
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>

            {/* End Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date *</label>
              <input
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                required
                min={startDate}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>
          </div>

          {/* Segment selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Road Segments * ({selectedSegments.length} selected)
            </label>
            <input
              type="text"
              placeholder="Search segments by name or ID..."
              value={segmentSearch}
              onChange={e => setSegmentSearch(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            />
            <div className="border border-gray-200 rounded-lg max-h-48 overflow-y-auto">
              {filteredSegments.slice(0, 100).map(seg => (
                <label
                  key={seg.id}
                  className={`flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-0 ${
                    selectedSegments.includes(seg.id) ? 'bg-orange-50' : ''
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedSegments.includes(seg.id)}
                    onChange={() => toggleSegment(seg.id)}
                    className="rounded text-orange-600 focus:ring-orange-500"
                  />
                  <span className="truncate">
                    {seg.name || seg.id}
                    {seg.ward && <span className="text-gray-400 ml-1">({seg.ward})</span>}
                  </span>
                </label>
              ))}
              {filteredSegments.length === 0 && (
                <p className="text-center py-4 text-sm text-gray-400">No segments found</p>
              )}
            </div>
          </div>

          {/* Override reason (shown if high conflicts) */}
          {highConflicts.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-red-700 mb-1">
                Override Reason (required for high-severity conflicts)
              </label>
              <textarea
                value={overrideReason}
                onChange={e => setOverrideReason(e.target.value)}
                rows={2}
                placeholder="Justify why this work should proceed despite conflicts..."
                className="w-full border border-red-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500"
              />
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || !title || !purpose || !selectedSegments.length || !startDate || !endDate || (highConflicts.length > 0 && !overrideReason)}
            className="w-full bg-orange-600 text-white py-3 rounded-lg font-medium hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition text-lg"
          >
            {submitting ? 'Creating...' : 'Register Work Project'}
          </button>
        </div>

        {/* Conflict panel (sidebar) */}
        <div className="lg:col-span-1">
          <div className="sticky top-20">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">⚡ Live Conflict Check</h3>
            <ConflictPanel
              conflicts={conflicts}
              loading={conflictsLoading}
              onAcceptSuggestion={handleAcceptSuggestion}
            />
          </div>
        </div>
      </div>
    </form>
  );
}
