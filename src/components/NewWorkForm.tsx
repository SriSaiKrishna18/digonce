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
  { value: 'cable', label: 'Cable laying' },
  { value: 'other', label: 'Other' },
];

const inputStyle = {
  border: '1px solid var(--color-border-default)',
  backgroundColor: 'var(--color-surface-secondary)',
  color: 'var(--color-text-primary)',
};

const labelStyle = {
  color: 'var(--color-text-secondary)',
};

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
      // silent
    } finally {
      setConflictsLoading(false);
    }
  }, [title, type, departmentId, selectedSegments, startDate, endDate]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(checkConflicts, 500);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [checkConflicts]);

  function handleAcceptSuggestion(conflict: Conflict) {
    if (conflict.suggestion) {
      setStartDate(conflict.suggestion.start);
      setEndDate(conflict.suggestion.end);
    }
  }

  function toggleSegment(segId: string) {
    setSelectedSegments(prev =>
      prev.includes(segId) ? prev.filter(id => id !== segId) : [...prev, segId]
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
          title, purpose, type, departmentId,
          contractorName: contractorName || undefined,
          segmentIds: selectedSegments,
          startDate, endDate,
          overrideReason: overrideReason || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 409) {
          setError('Blocking conflicts detected. Provide an override reason or adjust dates.');
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
    <form onSubmit={handleSubmit} className="max-w-5xl mx-auto py-8 px-5">
      {/* Header */}
      <div className="mb-8">
        <a
          href="/dept"
          className="text-[13px] transition-colors"
          style={{ color: 'var(--color-text-tertiary)' }}
          onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-text-primary)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-text-tertiary)')}
        >
          ← Back to Dashboard
        </a>
        <h1
          className="text-xl font-semibold tracking-tight mt-3 mb-1"
          style={{ color: 'var(--color-text-primary)' }}
        >
          Register New Work
        </h1>
        <p className="text-[13px]" style={{ color: 'var(--color-text-tertiary)' }}>
          Department: {departmentName}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Form fields — 3 cols */}
        <div className="lg:col-span-3 space-y-6">
          {/* Title */}
          <div>
            <label className="block text-[12px] font-medium mb-1.5" style={labelStyle}>
              Project title
            </label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              required
              maxLength={200}
              placeholder="e.g. Water pipeline replacement — MG Road Phase 2"
              className="w-full px-3 py-2.5 text-[14px] rounded-md"
              style={inputStyle}
            />
          </div>

          {/* Purpose */}
          <div>
            <label className="block text-[12px] font-medium mb-1.5" style={labelStyle}>
              Purpose
            </label>
            <textarea
              value={purpose}
              onChange={e => setPurpose(e.target.value)}
              required
              maxLength={1000}
              rows={3}
              placeholder="What work is being done and why?"
              className="w-full px-3 py-2.5 text-[14px] rounded-md resize-y"
              style={inputStyle}
            />
          </div>

          {/* Type + Contractor — side by side */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[12px] font-medium mb-1.5" style={labelStyle}>
                Work type
              </label>
              <select
                value={type}
                onChange={e => setType(e.target.value)}
                className="w-full px-3 py-2.5 text-[14px] rounded-md"
                style={inputStyle}
              >
                {WORK_TYPES.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[12px] font-medium mb-1.5" style={labelStyle}>
                Contractor
                <span className="font-normal ml-1" style={{ color: 'var(--color-text-tertiary)' }}>optional</span>
              </label>
              <input
                type="text"
                value={contractorName}
                onChange={e => setContractorName(e.target.value)}
                maxLength={200}
                className="w-full px-3 py-2.5 text-[14px] rounded-md"
                style={inputStyle}
              />
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[12px] font-medium mb-1.5" style={labelStyle}>Start date</label>
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                required
                className="w-full px-3 py-2.5 text-[14px] rounded-md font-mono"
                style={inputStyle}
              />
            </div>
            <div>
              <label className="block text-[12px] font-medium mb-1.5" style={labelStyle}>End date</label>
              <input
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                required
                min={startDate}
                className="w-full px-3 py-2.5 text-[14px] rounded-md font-mono"
                style={inputStyle}
              />
            </div>
          </div>

          {/* Segment selection */}
          <div>
            <label className="block text-[12px] font-medium mb-1.5" style={labelStyle}>
              Road segments
              <span className="font-mono ml-2" style={{ color: 'var(--color-text-tertiary)' }}>
                {selectedSegments.length} selected
              </span>
            </label>
            <input
              type="text"
              placeholder="Filter segments…"
              value={segmentSearch}
              onChange={e => setSegmentSearch(e.target.value)}
              className="w-full px-3 py-2 text-[13px] rounded-md mb-2"
              style={inputStyle}
            />
            <div
              className="rounded-md max-h-44 overflow-y-auto"
              style={{ border: '1px solid var(--color-border-default)' }}
            >
              {filteredSegments.slice(0, 80).map(seg => (
                <label
                  key={seg.id}
                  className="flex items-center gap-2.5 px-3 py-2 text-[13px] cursor-pointer transition-colors"
                  style={{
                    borderBottom: '1px solid var(--color-border-default)',
                    backgroundColor: selectedSegments.includes(seg.id) ? 'var(--color-brand-50)' : 'transparent',
                  }}
                  onMouseEnter={e => {
                    if (!selectedSegments.includes(seg.id))
                      e.currentTarget.style.backgroundColor = 'var(--color-surface-secondary)';
                  }}
                  onMouseLeave={e => {
                    if (!selectedSegments.includes(seg.id))
                      e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <input
                    type="checkbox"
                    checked={selectedSegments.includes(seg.id)}
                    onChange={() => toggleSegment(seg.id)}
                    className="rounded"
                    style={{ accentColor: 'var(--color-brand-600)' }}
                  />
                  <span className="truncate" style={{ color: 'var(--color-text-primary)' }}>
                    {seg.name || <span className="font-mono text-[11px]" style={{ color: 'var(--color-text-tertiary)' }}>{seg.id}</span>}
                  </span>
                  {seg.ward && (
                    <span className="text-[11px] ml-auto flex-shrink-0" style={{ color: 'var(--color-text-tertiary)' }}>
                      {seg.ward}
                    </span>
                  )}
                </label>
              ))}
              {filteredSegments.length === 0 && (
                <p className="text-center py-6 text-[13px]" style={{ color: 'var(--color-text-tertiary)' }}>
                  No segments found
                </p>
              )}
            </div>
          </div>

          {/* Override reason */}
          {highConflicts.length > 0 && (
            <div>
              <label className="block text-[12px] font-medium mb-1.5" style={{ color: 'var(--color-danger)' }}>
                Override reason (required)
              </label>
              <textarea
                value={overrideReason}
                onChange={e => setOverrideReason(e.target.value)}
                rows={2}
                placeholder="Justify why this work should proceed despite blocking conflicts…"
                className="w-full px-3 py-2.5 text-[14px] rounded-md resize-y"
                style={{ ...inputStyle, borderColor: '#fecaca' }}
              />
            </div>
          )}

          {/* Error */}
          {error && (
            <div
              className="px-4 py-3 rounded-md text-[13px]"
              style={{ backgroundColor: 'var(--color-danger-bg)', color: 'var(--color-danger)', border: '1px solid #fecaca' }}
            >
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting || !title || !purpose || !selectedSegments.length || !startDate || !endDate || (highConflicts.length > 0 && !overrideReason)}
            className="w-full py-3 rounded-md text-[14px] font-medium transition-opacity disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90"
            style={{
              backgroundColor: 'var(--color-brand-600)',
              color: 'white',
            }}
          >
            {submitting ? 'Registering…' : 'Register Work'}
          </button>
        </div>

        {/* Conflict sidebar — 2 cols */}
        <div className="lg:col-span-2">
          <div className="lg:sticky lg:top-24">
            <h3
              className="text-[12px] font-medium mb-3"
              style={{ color: 'var(--color-text-tertiary)', letterSpacing: '0.04em' }}
            >
              LIVE CONFLICT CHECK
            </h3>
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
