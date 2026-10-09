'use client';

import type { Conflict } from '@/lib/engine';

interface ConflictPanelProps {
  conflicts: Conflict[];
  loading?: boolean;
  onAcceptSuggestion?: (conflict: Conflict) => void;
}

const SEVERITY_STYLES: Record<string, { border: string; bg: string; label: string; dot: string }> = {
  high: {
    border: '1px solid #fecaca',
    bg: 'var(--color-danger-bg)',
    label: 'Blocking',
    dot: 'var(--color-danger)',
  },
  medium: {
    border: '1px solid #fde68a',
    bg: 'var(--color-warning-bg)',
    label: 'Warning',
    dot: 'var(--color-warning)',
  },
  info: {
    border: '1px solid #bfdbfe',
    bg: 'var(--color-info-bg)',
    label: 'Suggestion',
    dot: 'var(--color-info)',
  },
};

const RULE_LABELS: Record<string, string> = {
  R1_OVERLAP: 'Schedule Overlap',
  R2_REPEAT_EXCAVATION: 'Moratorium Violation',
  R3_MERGE_OPPORTUNITY: 'Merge Opportunity',
};

export default function ConflictPanel({ conflicts, loading, onAcceptSuggestion }: ConflictPanelProps) {
  if (loading) {
    return (
      <div
        className="rounded-md px-4 py-3"
        style={{ border: '1px solid var(--color-border-default)', backgroundColor: 'var(--color-surface-secondary)' }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="w-3.5 h-3.5 rounded-full animate-spin"
            style={{ border: '2px solid var(--color-border-default)', borderTopColor: 'var(--color-text-tertiary)' }}
          />
          <span className="text-[13px]" style={{ color: 'var(--color-text-tertiary)' }}>
            Checking for conflicts…
          </span>
        </div>
      </div>
    );
  }

  if (conflicts.length === 0) {
    return (
      <div
        className="rounded-md px-4 py-3"
        style={{ border: '1px solid #bbf7d0', backgroundColor: 'var(--color-success-bg)' }}
      >
        <div className="flex items-center gap-2.5">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <circle cx="7" cy="7" r="6" stroke="var(--color-success)" strokeWidth="1.5" />
            <path d="M4.5 7L6 8.5L9.5 5" stroke="var(--color-success)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="text-[13px] font-medium" style={{ color: 'var(--color-success)' }}>
            No conflicts detected
          </span>
        </div>
      </div>
    );
  }

  const highCount = conflicts.filter(c => c.severity === 'high').length;

  return (
    <div className="space-y-2.5">
      {/* Summary */}
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-medium" style={{ color: 'var(--color-text-primary)' }}>
          {conflicts.length} conflict{conflicts.length !== 1 ? 's' : ''} found
        </span>
        {highCount > 0 && (
          <span
            className="data-label px-2 py-0.5 rounded"
            style={{ backgroundColor: 'var(--color-danger-bg)', color: 'var(--color-danger)' }}
          >
            {highCount} blocking
          </span>
        )}
      </div>

      {/* Conflict list */}
      {conflicts.map((conflict, idx) => {
        const style = SEVERITY_STYLES[conflict.severity] || SEVERITY_STYLES.info;
        return (
          <div
            key={`${conflict.rule}-${conflict.segmentId}-${idx}`}
            className="rounded-md px-4 py-3"
            style={{ border: style.border, backgroundColor: style.bg }}
          >
            {/* Rule header */}
            <div className="flex items-center gap-2 mb-1.5">
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: style.dot }} />
              <span className="data-label" style={{ color: style.dot }}>
                {RULE_LABELS[conflict.rule] || conflict.rule}
              </span>
              <span className="data-label" style={{ color: 'var(--color-text-tertiary)' }}>
                · {style.label}
              </span>
            </div>

            {/* Explanation */}
            <p className="text-[13px] leading-relaxed mb-1" style={{ color: 'var(--color-text-primary)' }}>
              {conflict.explanation}
            </p>

            {/* Segment ID */}
            <p className="text-[11px] font-mono" style={{ color: 'var(--color-text-tertiary)' }}>
              Segment: {conflict.segmentId}
            </p>

            {/* Merge suggestion */}
            {conflict.suggestion && onAcceptSuggestion && (
              <div
                className="mt-2.5 pt-2.5"
                style={{ borderTop: `1px solid ${style.dot}22` }}
              >
                <p className="text-[12px] mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                  {conflict.suggestion.text}
                </p>
                <button
                  type="button"
                  onClick={() => onAcceptSuggestion(conflict)}
                  className="text-[12px] font-medium px-3 py-1.5 rounded-md transition-opacity hover:opacity-80"
                  style={{
                    backgroundColor: 'white',
                    color: style.dot,
                    border: `1px solid ${style.dot}33`,
                  }}
                >
                  Accept: {conflict.suggestion.start} → {conflict.suggestion.end}
                </button>
              </div>
            )}
          </div>
        );
      })}

      {highCount > 0 && (
        <p className="text-[11px]" style={{ color: 'var(--color-danger)' }}>
          Blocking conflicts require an override reason before this work can be saved.
        </p>
      )}
    </div>
  );
}
