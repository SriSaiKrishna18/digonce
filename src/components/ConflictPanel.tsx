import { Conflict } from '@/lib/engine';

interface ConflictPanelProps {
  conflicts: Conflict[];
  loading?: boolean;
  onAcceptSuggestion?: (conflict: Conflict) => void;
}

const severityStyles = {
  high: 'bg-red-50 border-red-300 text-red-800',
  medium: 'bg-yellow-50 border-yellow-300 text-yellow-800',
  info: 'bg-blue-50 border-blue-300 text-blue-800',
};

const severityIcons = {
  high: '🚫',
  medium: '⚠️',
  info: '💡',
};

const ruleLabels: Record<string, string> = {
  R1_OVERLAP: 'Schedule Overlap',
  R2_REPEAT_EXCAVATION: 'Moratorium Violation',
  R3_MERGE_OPPORTUNITY: 'Merge Opportunity',
};

export default function ConflictPanel({ conflicts, loading, onAcceptSuggestion }: ConflictPanelProps) {
  if (loading) {
    return (
      <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-gray-600" />
          Checking for conflicts...
        </div>
      </div>
    );
  }

  if (conflicts.length === 0) {
    return (
      <div className="border border-green-200 rounded-lg p-4 bg-green-50">
        <div className="flex items-center gap-2 text-sm text-green-700">
          ✅ No conflicts detected
        </div>
      </div>
    );
  }

  const highCount = conflicts.filter(c => c.severity === 'high').length;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-medium">
        <span className="text-red-600">
          {conflicts.length} conflict{conflicts.length > 1 ? 's' : ''} detected
        </span>
        {highCount > 0 && (
          <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
            {highCount} blocking
          </span>
        )}
      </div>

      {conflicts.map((conflict, idx) => (
        <div
          key={`${conflict.rule}-${conflict.segmentId}-${conflict.otherWorkId}-${idx}`}
          className={`border rounded-lg p-3 ${severityStyles[conflict.severity]}`}
        >
          <div className="flex items-start gap-2">
            <span className="text-lg flex-shrink-0">{severityIcons[conflict.severity]}</span>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold uppercase tracking-wide mb-1">
                {ruleLabels[conflict.rule] || conflict.rule}
              </div>
              <p className="text-sm">{conflict.explanation}</p>
              <p className="text-xs mt-1 opacity-75">
                Segment: {conflict.segmentId}
              </p>

              {conflict.suggestion && onAcceptSuggestion && (
                <div className="mt-2 pt-2 border-t border-current/10">
                  <p className="text-xs mb-1.5">{conflict.suggestion.text}</p>
                  <button
                    type="button"
                    onClick={() => onAcceptSuggestion(conflict)}
                    className="text-xs bg-white/80 hover:bg-white px-3 py-1 rounded-md border border-current/20 transition font-medium"
                  >
                    Accept merged window ({conflict.suggestion.start} → {conflict.suggestion.end})
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}

      {highCount > 0 && (
        <p className="text-xs text-red-600">
          High-severity conflicts must be justified with an override reason before saving.
        </p>
      )}
    </div>
  );
}
