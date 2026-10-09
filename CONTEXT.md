# DigOnce — Context File (paste at the start of each AI session)

## Project Goal
Public-works coordination engine for Indian municipalities. Detects scheduling conflicts
(overlap, repeat excavation, merge opportunities) on road segments. CivicTech hackathon entry.

## Stack
- Next.js 16 App Router + TypeScript
- Supabase (Postgres + RLS + Auth + Storage)
- MapLibre GL JS + OpenFreeMap tiles (keyless)
- Turf.js for geofence math
- Zod for validation
- Vitest for engine tests
- Tailwind CSS for styling
- Deployed on Vercel

## Key Rules
- Keep the project runnable after every change
- Engine is a pure TypeScript module — no DB access
- All conflict decisions are deterministic and explainable
- Simulated data is always clearly labeled
- Server-side re-validation of conflicts before saving
- RLS enforces access control at the DB level

## Engine Spec
See: src/lib/engine/types.ts and src/lib/engine/detectConflicts.ts
Rules: R1_OVERLAP, R2_REPEAT_EXCAVATION, R3_MERGE_OPPORTUNITY
Tests: src/lib/engine/detectConflicts.test.ts (14 tests, all passing)

## Schema
See: supabase/migrations/001_schema.sql
Tables: departments, profiles, segments, works, work_segments, delay_events, checkins

## Routes
- GET / — Public map with works
- GET /works/[id] — Work detail with delay ledger and check-ins
- GET /dept — Department dashboard
- GET /dept/new — New work form with live conflict panel
- POST /api/conflicts/check — Dry-run conflict detection
- POST /api/works — Create work (re-runs engine server-side)
- POST /api/works/[id]/delay — Extend end date (requires reason)
- POST /api/works/[id]/checkins — Citizen check-in (geofence)
- POST /api/demo/login — One-click demo login
- POST /api/demo/reset — Reset demo data
- GET /benchmark — Engine benchmark report
