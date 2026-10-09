// DigOnce Conflict Engine — Unit Tests
// All 10 required tests from the spec, plus extras

import { describe, it, expect } from 'vitest';
import { detectConflicts } from './detectConflicts';
import { Work, EngineConfig } from './types';

const defaultConfig: EngineConfig = { moratoriumMonths: 12, mergeWindowDays: 90 };

// ─── Helper to create works ─────────────────────────────────────

function makeWork(overrides: Partial<Work> & { id: string }): Work {
  return {
    title: 'Test Work',
    departmentId: 'dept-a',
    type: 'excavation',
    status: 'planned',
    segmentIds: ['seg_1'],
    startDate: '2026-11-01',
    endDate: '2026-11-30',
    ...overrides,
  };
}

// ─── Test 1: Overlapping ranges on one segment → one R1 ────────

describe('R1: Overlap detection', () => {
  it('Test 1: overlapping ranges on one segment → one R1', () => {
    const candidate = makeWork({
      id: 'new',
      startDate: '2026-11-10',
      endDate: '2026-11-25',
    });
    const existing = [
      makeWork({
        id: 'existing-1',
        departmentId: 'dept-b',
        startDate: '2026-11-05',
        endDate: '2026-11-20',
      }),
    ];

    const conflicts = detectConflicts(candidate, existing, defaultConfig);
    expect(conflicts).toHaveLength(1);
    expect(conflicts[0].rule).toBe('R1_OVERLAP');
    expect(conflicts[0].segmentId).toBe('seg_1');
    expect(conflicts[0].otherWorkId).toBe('existing-1');
  });

  // ─── Test 2: Adjacent days → no R1 ────────────────────────────

  it('Test 2: adjacent days (end 10 Nov, start 11 Nov) → no R1', () => {
    const candidate = makeWork({
      id: 'new',
      startDate: '2026-11-11',
      endDate: '2026-11-25',
    });
    const existing = [
      makeWork({
        id: 'existing-1',
        departmentId: 'dept-b',
        startDate: '2026-11-01',
        endDate: '2026-11-10',
      }),
    ];

    const conflicts = detectConflicts(candidate, existing, defaultConfig);
    const r1s = conflicts.filter(c => c.rule === 'R1_OVERLAP');
    expect(r1s).toHaveLength(0);
  });

  // ─── Test 3: Same dates, different segments → no conflict ─────

  it('Test 3: same dates, different segments → no conflict', () => {
    const candidate = makeWork({
      id: 'new',
      segmentIds: ['seg_1'],
      startDate: '2026-11-05',
      endDate: '2026-11-20',
    });
    const existing = [
      makeWork({
        id: 'existing-1',
        departmentId: 'dept-b',
        segmentIds: ['seg_2'],
        startDate: '2026-11-05',
        endDate: '2026-11-20',
      }),
    ];

    const conflicts = detectConflicts(candidate, existing, defaultConfig);
    expect(conflicts).toHaveLength(0);
  });
});

// ─── R2: Repeat excavation ──────────────────────────────────────

describe('R2: Repeat excavation', () => {
  // ─── Test 4a: Excavation 11 months after resurfacing → R2 ────

  it('Test 4a: excavation 11 months after resurfacing → R2', () => {
    const candidate = makeWork({
      id: 'new',
      type: 'pipeline',
      startDate: '2026-06-01',
      endDate: '2026-06-30',
    });
    const existing = [
      makeWork({
        id: 'existing-resurface',
        departmentId: 'dept-b',
        type: 'resurfacing',
        status: 'completed',
        startDate: '2025-06-01',
        endDate: '2025-07-14', // ~11 months before candidate start
      }),
    ];

    const conflicts = detectConflicts(candidate, existing, defaultConfig);
    const r2s = conflicts.filter(c => c.rule === 'R2_REPEAT_EXCAVATION');
    expect(r2s).toHaveLength(1);
    expect(r2s[0].segmentId).toBe('seg_1');
  });

  // ─── Test 4b: Excavation 13 months after resurfacing → none ──

  it('Test 4b: excavation 13 months after resurfacing → no R2', () => {
    const candidate = makeWork({
      id: 'new',
      type: 'excavation',
      startDate: '2026-09-01',
      endDate: '2026-09-30',
    });
    const existing = [
      makeWork({
        id: 'existing-resurface',
        departmentId: 'dept-b',
        type: 'resurfacing',
        status: 'completed',
        startDate: '2025-06-01',
        endDate: '2025-07-14', // ~14 months before candidate start
      }),
    ];

    const conflicts = detectConflicts(candidate, existing, defaultConfig);
    const r2s = conflicts.filter(c => c.rule === 'R2_REPEAT_EXCAVATION');
    expect(r2s).toHaveLength(0);
  });

  // ─── Test 5: Resurfacing after excavation → no R2 ────────────

  it('Test 5: resurfacing after excavation → no R2', () => {
    const candidate = makeWork({
      id: 'new',
      type: 'resurfacing', // candidate is resurfacing, not excavation
      startDate: '2026-06-01',
      endDate: '2026-06-30',
    });
    const existing = [
      makeWork({
        id: 'existing-excavation',
        departmentId: 'dept-b',
        type: 'excavation',
        status: 'completed',
        startDate: '2026-03-01',
        endDate: '2026-03-15',
      }),
    ];

    const conflicts = detectConflicts(candidate, existing, defaultConfig);
    const r2s = conflicts.filter(c => c.rule === 'R2_REPEAT_EXCAVATION');
    expect(r2s).toHaveLength(0);
  });
});

// ─── R3: Merge opportunity ──────────────────────────────────────

describe('R3: Merge opportunity', () => {
  // ─── Test 6a: Gap of 89 days → R3 ────────────────────────────

  it('Test 6a: gap of 89 days between works → R3', () => {
    const candidate = makeWork({
      id: 'new',
      departmentId: 'dept-a',
      startDate: '2026-11-01',
      endDate: '2026-11-15',
    });
    const existing = [
      makeWork({
        id: 'existing-1',
        departmentId: 'dept-b', // different department
        startDate: '2027-02-13', // 89 days gap from Nov 15
        endDate: '2027-03-15',
      }),
    ];

    const conflicts = detectConflicts(candidate, existing, defaultConfig);
    const r3s = conflicts.filter(c => c.rule === 'R3_MERGE_OPPORTUNITY');
    expect(r3s).toHaveLength(1);
    expect(r3s[0].suggestion).toBeDefined();
  });

  // ─── Test 6b: Gap of 91 days → no R3 ─────────────────────────

  it('Test 6b: gap of 91 days → no R3', () => {
    const candidate = makeWork({
      id: 'new',
      departmentId: 'dept-a',
      startDate: '2026-11-01',
      endDate: '2026-11-15',
    });
    const existing = [
      makeWork({
        id: 'existing-1',
        departmentId: 'dept-b',
        startDate: '2027-02-15', // 91 days gap from Nov 15
        endDate: '2027-03-15',
      }),
    ];

    const conflicts = detectConflicts(candidate, existing, defaultConfig);
    const r3s = conflicts.filter(c => c.rule === 'R3_MERGE_OPPORTUNITY');
    expect(r3s).toHaveLength(0);
  });

  // ─── Test 7: Same department gap within window → no R3 ────────

  it('Test 7: same department gap within merge window → no R3', () => {
    const candidate = makeWork({
      id: 'new',
      departmentId: 'dept-a',
      startDate: '2026-11-01',
      endDate: '2026-11-15',
    });
    const existing = [
      makeWork({
        id: 'existing-1',
        departmentId: 'dept-a', // SAME department
        startDate: '2026-12-01',
        endDate: '2026-12-15',
      }),
    ];

    const conflicts = detectConflicts(candidate, existing, defaultConfig);
    const r3s = conflicts.filter(c => c.rule === 'R3_MERGE_OPPORTUNITY');
    expect(r3s).toHaveLength(0);
  });
});

// ─── Multi-segment and self-exclusion tests ─────────────────────

describe('Multi-segment and editing', () => {
  // ─── Test 8: Candidate spanning several segments with conflicts on two → two conflicts

  it('Test 8: candidate on multiple segments with conflicts on two → two conflicts', () => {
    const candidate = makeWork({
      id: 'new',
      segmentIds: ['seg_1', 'seg_2', 'seg_3'],
      startDate: '2026-11-05',
      endDate: '2026-11-20',
    });
    const existing = [
      makeWork({
        id: 'existing-1',
        departmentId: 'dept-b',
        segmentIds: ['seg_1'],
        startDate: '2026-11-10',
        endDate: '2026-11-25',
      }),
      makeWork({
        id: 'existing-2',
        departmentId: 'dept-c',
        segmentIds: ['seg_3'],
        startDate: '2026-11-01',
        endDate: '2026-11-15',
      }),
      // No conflict on seg_2
    ];

    const conflicts = detectConflicts(candidate, existing, defaultConfig);
    const r1s = conflicts.filter(c => c.rule === 'R1_OVERLAP');
    expect(r1s).toHaveLength(2);
    expect(r1s.map(c => c.segmentId).sort()).toEqual(['seg_1', 'seg_3']);
  });

  // ─── Test 9: Editing a work does not conflict with itself ─────

  it('Test 9: editing an existing work does not conflict with itself', () => {
    const candidate = makeWork({
      id: 'work-123', // same ID as existing
      startDate: '2026-11-05',
      endDate: '2026-11-20',
    });
    const existing = [
      makeWork({
        id: 'work-123', // SAME work being edited
        departmentId: 'dept-a',
        startDate: '2026-11-05',
        endDate: '2026-11-20',
      }),
    ];

    const conflicts = detectConflicts(candidate, existing, defaultConfig);
    expect(conflicts).toHaveLength(0);
  });
});

// ─── Determinism test ───────────────────────────────────────────

describe('Output determinism', () => {
  // ─── Test 10: Output order is deterministic across input orderings

  it('Test 10: output order is deterministic regardless of input order', () => {
    const candidate = makeWork({
      id: 'new',
      segmentIds: ['seg_3', 'seg_1', 'seg_2'],
      startDate: '2026-11-05',
      endDate: '2026-11-20',
    });

    const existingA = [
      makeWork({ id: 'e1', departmentId: 'dept-b', segmentIds: ['seg_1'], startDate: '2026-11-10', endDate: '2026-11-25' }),
      makeWork({ id: 'e2', departmentId: 'dept-c', segmentIds: ['seg_3'], startDate: '2026-11-01', endDate: '2026-11-15' }),
      makeWork({ id: 'e3', departmentId: 'dept-d', segmentIds: ['seg_2'], startDate: '2026-11-08', endDate: '2026-11-22' }),
    ];

    const existingB = [
      makeWork({ id: 'e3', departmentId: 'dept-d', segmentIds: ['seg_2'], startDate: '2026-11-08', endDate: '2026-11-22' }),
      makeWork({ id: 'e1', departmentId: 'dept-b', segmentIds: ['seg_1'], startDate: '2026-11-10', endDate: '2026-11-25' }),
      makeWork({ id: 'e2', departmentId: 'dept-c', segmentIds: ['seg_3'], startDate: '2026-11-01', endDate: '2026-11-15' }),
    ];

    const conflictsA = detectConflicts(candidate, existingA, defaultConfig);
    const conflictsB = detectConflicts(candidate, existingB, defaultConfig);

    expect(conflictsA).toEqual(conflictsB);
  });
});

// ─── Edge case: cancelled works are ignored ─────────────────────

describe('Edge cases', () => {
  it('cancelled works are ignored', () => {
    const candidate = makeWork({
      id: 'new',
      startDate: '2026-11-05',
      endDate: '2026-11-20',
    });
    const existing = [
      makeWork({
        id: 'existing-cancelled',
        departmentId: 'dept-b',
        status: 'cancelled',
        startDate: '2026-11-10',
        endDate: '2026-11-25',
      }),
    ];

    const conflicts = detectConflicts(candidate, existing, defaultConfig);
    expect(conflicts).toHaveLength(0);
  });

  it('empty existing works → no conflicts', () => {
    const candidate = makeWork({ id: 'new' });
    const conflicts = detectConflicts(candidate, [], defaultConfig);
    expect(conflicts).toHaveLength(0);
  });
});
