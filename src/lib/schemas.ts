// DigOnce — Shared Zod Schemas
// Used for API validation and form validation

import { z } from 'zod';

// ─── Enums ──────────────────────────────────────────────────────

export const workTypeSchema = z.enum([
  'excavation', 'resurfacing', 'pipeline', 'drainage', 'cable', 'other',
]);

export const workStatusSchema = z.enum([
  'planned', 'active', 'completed', 'delayed', 'cancelled',
]);

export const delayReasonSchema = z.enum([
  'weather', 'material_shortage', 'permit_pending', 'utility_clash',
  'funding', 'contractor_issue', 'design_change', 'other',
]);

// ─── Conflict Check Request ─────────────────────────────────────

export const conflictCheckSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  type: workTypeSchema,
  departmentId: z.string().uuid('Invalid department ID'),
  segmentIds: z.array(z.string().min(1)).min(1, 'At least one segment is required'),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  editingWorkId: z.string().uuid().nullable().optional(),
}).refine(
  (data) => data.endDate >= data.startDate,
  { message: 'End date must be on or after start date', path: ['endDate'] },
);

export type ConflictCheckInput = z.infer<typeof conflictCheckSchema>;

// ─── Create Work ────────────────────────────────────────────────

export const createWorkSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  purpose: z.string().min(1, 'Purpose is required').max(1000),
  type: workTypeSchema,
  departmentId: z.string().uuid(),
  contractorName: z.string().max(200).optional(),
  segmentIds: z.array(z.string().min(1)).min(1, 'At least one segment is required'),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  overrideReason: z.string().max(500).optional(), // required if high-severity conflicts
}).refine(
  (data) => data.endDate >= data.startDate,
  { message: 'End date must be on or after start date', path: ['endDate'] },
);

export type CreateWorkInput = z.infer<typeof createWorkSchema>;

// ─── Delay Event ────────────────────────────────────────────────

export const delayEventSchema = z.object({
  workId: z.string().uuid(),
  newEnd: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  reason: delayReasonSchema,
  note: z.string().max(500).optional(),
});

export type DelayEventInput = z.infer<typeof delayEventSchema>;

// ─── Check-in ───────────────────────────────────────────────────

export const checkinSchema = z.object({
  workId: z.string().uuid(),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  mode: z.enum(['gps', 'demo_picker']),
  note: z.string().max(500).optional(),
});

export type CheckinInput = z.infer<typeof checkinSchema>;
