// DigOnce Conflict Engine — Core Detection Logic
// Pure functions, fully unit-tested, no database access

import {
  Work,
  Conflict,
  EngineConfig,
  DEFAULT_ENGINE_CONFIG,
  RuleId,
  WorkType,
} from './types';

// ─── Date Helpers ───────────────────────────────────────────────

/** Parse ISO date string to Date at midnight UTC */
function parseDate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

/** Difference in calendar days (b - a) */
function diffDays(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

/** Add months to a date */
function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  result.setUTCMonth(result.getUTCMonth() + months);
  return result;
}

/** Format Date back to ISO date string */
function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

// ─── Range Helpers ──────────────────────────────────────────────

/** Check if two inclusive date ranges overlap.
 *  [aStart, aEnd] overlaps [bStart, bEnd] iff aStart <= bEnd AND bStart <= aEnd.
 *  Adjacent days (end on day X, start on day X+1) do NOT overlap. */
function rangesOverlap(
  aStart: string, aEnd: string,
  bStart: string, bEnd: string,
): boolean {
  const a0 = parseDate(aStart);
  const a1 = parseDate(aEnd);
  const b0 = parseDate(bStart);
  const b1 = parseDate(bEnd);
  return a0 <= b1 && b0 <= a1;
}

/** Calculate the gap in days between two non-overlapping ranges.
 *  Returns the number of days between the end of the earlier range
 *  and the start of the later range. Negative means overlap. */
function gapDays(
  aStart: string, aEnd: string,
  bStart: string, bEnd: string,
): number {
  const a1 = parseDate(aEnd);
  const b0 = parseDate(bStart);
  const b1 = parseDate(bEnd);
  const a0 = parseDate(aStart);

  // Determine which range comes first
  if (a0 <= b0) {
    return diffDays(a1, b0) - 1; // -1 because end date is inclusive
  } else {
    return diffDays(b1, a0) - 1;
  }
}

// ─── Work Type Helpers ──────────────────────────────────────────

const EXCAVATION_TYPES: WorkType[] = ['excavation', 'pipeline', 'drainage', 'cable'];

function isExcavationType(type: WorkType): boolean {
  return EXCAVATION_TYPES.includes(type);
}

// ─── Rule Implementations ───────────────────────────────────────

/** R1: Same segment, date ranges overlap, different work */
function checkR1Overlap(
  candidate: Work,
  existing: Work,
  segmentId: string,
): Conflict | null {
  if (!rangesOverlap(candidate.startDate, candidate.endDate, existing.startDate, existing.endDate)) {
    return null;
  }

  return {
    rule: 'R1_OVERLAP',
    severity: 'high',
    segmentId,
    otherWorkId: existing.id,
    explanation: `${existing.title} already has work on this road from ${existing.startDate} to ${existing.endDate}.`,
  };
}

/** R2: Candidate is excavation-type work on a segment where
 *  resurfacing ended less than moratoriumMonths before candidate start */
function checkR2RepeatExcavation(
  candidate: Work,
  existing: Work,
  segmentId: string,
  cfg: EngineConfig,
): Conflict | null {
  // Candidate must be excavation-type
  if (!isExcavationType(candidate.type)) {
    return null;
  }

  // Existing must be resurfacing
  if (existing.type !== 'resurfacing') {
    return null;
  }

  // Existing must be completed or at least have an end date in the past
  // (we check the rule regardless of status, as planned resurfacing also matters)
  const resurfacingEnd = parseDate(existing.endDate);
  const candidateStart = parseDate(candidate.startDate);
  const moratoriumEnd = addMonths(resurfacingEnd, cfg.moratoriumMonths);

  // If candidate starts before moratorium ends, it's a violation
  if (candidateStart < moratoriumEnd) {
    return {
      rule: 'R2_REPEAT_EXCAVATION',
      severity: 'high',
      segmentId,
      otherWorkId: existing.id,
      explanation: `This road was resurfaced on ${existing.endDate}. Excavating within ${cfg.moratoriumMonths} months is blocked unless justified.`,
    };
  }

  return null;
}

/** R3: Same segment, different department, gap ≤ mergeWindowDays, no overlap */
function checkR3MergeOpportunity(
  candidate: Work,
  existing: Work,
  segmentId: string,
  cfg: EngineConfig,
): Conflict | null {
  // Must be different departments
  if (candidate.departmentId === existing.departmentId) {
    return null;
  }

  // Must NOT overlap (R1 handles overlaps)
  if (rangesOverlap(candidate.startDate, candidate.endDate, existing.startDate, existing.endDate)) {
    return null;
  }

  const gap = gapDays(
    candidate.startDate, candidate.endDate,
    existing.startDate, existing.endDate,
  );

  if (gap < 0 || gap > cfg.mergeWindowDays) {
    return null;
  }

  // Calculate a suggested merged window
  const allDates = [
    parseDate(candidate.startDate),
    parseDate(candidate.endDate),
    parseDate(existing.startDate),
    parseDate(existing.endDate),
  ];
  const mergedStart = formatDate(new Date(Math.min(...allDates.map(d => d.getTime()))));
  const mergedEnd = formatDate(new Date(Math.max(...allDates.map(d => d.getTime()))));

  return {
    rule: 'R3_MERGE_OPPORTUNITY',
    severity: 'info',
    segmentId,
    otherWorkId: existing.id,
    explanation: `${existing.title} works here ${gap} days later. Propose a joint window to dig once.`,
    suggestion: {
      start: mergedStart,
      end: mergedEnd,
      text: `Propose a joint window ${mergedStart} to ${mergedEnd} to dig once.`,
    },
  };
}

// ─── Main Engine Function ───────────────────────────────────────

/**
 * Detect conflicts between a candidate work and existing works.
 *
 * Rules:
 * - Date ranges are inclusive. A work ending day X and another starting day X+1 do NOT overlap.
 * - Only non-cancelled works are compared.
 * - When editing, the candidate itself (by ID) is excluded.
 * - Output is sorted by severity (high > medium > info) then by segment ID for determinism.
 */
export function detectConflicts(
  candidate: Work,
  existing: Work[],
  cfg: EngineConfig = DEFAULT_ENGINE_CONFIG,
): Conflict[] {
  const conflicts: Conflict[] = [];

  // Filter out cancelled works and the candidate itself (for editing)
  const activeWorks = existing.filter(
    w => w.status !== 'cancelled' && w.id !== candidate.id,
  );

  for (const segmentId of candidate.segmentIds) {
    // Find all active works on this segment
    const worksOnSegment = activeWorks.filter(w => w.segmentIds.includes(segmentId));

    for (const other of worksOnSegment) {
      // Check R1: Overlap
      const r1 = checkR1Overlap(candidate, other, segmentId);
      if (r1) conflicts.push(r1);

      // Check R2: Repeat excavation after resurfacing
      const r2 = checkR2RepeatExcavation(candidate, other, segmentId, cfg);
      if (r2) conflicts.push(r2);

      // Check R3: Merge opportunity (only if no overlap)
      if (!r1) {
        const r3 = checkR3MergeOpportunity(candidate, other, segmentId, cfg);
        if (r3) conflicts.push(r3);
      }
    }
  }

  // Sort: severity order (high > medium > info), then segment ID for determinism
  const severityOrder: Record<string, number> = { high: 0, medium: 1, info: 2 };
  conflicts.sort((a, b) => {
    const sevDiff = severityOrder[a.severity] - severityOrder[b.severity];
    if (sevDiff !== 0) return sevDiff;
    return a.segmentId.localeCompare(b.segmentId);
  });

  return conflicts;
}
