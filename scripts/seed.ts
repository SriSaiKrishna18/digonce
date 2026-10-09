/**
 * DigOnce — Seed Script
 * Generates simulated works with planted conflicts for demo data.
 *
 * Usage: npx tsx scripts/seed.ts
 *
 * Requires: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY in .env.local
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// ─── Load env ───────────────────────────────────────────────────

const dotenvPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(dotenvPath)) {
  const envContent = fs.readFileSync(dotenvPath, 'utf-8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx > 0) {
        const key = trimmed.substring(0, eqIdx);
        const val = trimmed.substring(eqIdx + 1);
        process.env[key] = val;
      }
    }
  }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !serviceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ─── Helpers ────────────────────────────────────────────────────

function addDays(date: string, days: number): string {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ─── Department definitions ─────────────────────────────────────

const DEPARTMENTS = [
  'Water Board (demo)',
  'Roads Dept (demo)',
  'Drainage Dept (demo)',
  'Power Utility (demo)',
  'Telecom Cables (demo)',
];

// ─── Main seed function ─────────────────────────────────────────

async function seed() {
  console.log('🌱 DigOnce Seed Script');
  console.log('────────────────────────');

  // 1. Load segments from GeoJSON
  const geojsonPath = path.join(__dirname, '..', 'data', 'segments.geojson');
  if (!fs.existsSync(geojsonPath)) {
    console.error('❌ data/segments.geojson not found. Run extract_osm.py first.');
    process.exit(1);
  }

  const geojson = JSON.parse(fs.readFileSync(geojsonPath, 'utf-8'));
  const segmentFeatures = geojson.features;
  console.log(`📍 Loaded ${segmentFeatures.length} segments from GeoJSON`);

  // 2. Upsert segments into DB
  console.log('📦 Upserting segments...');
  const segmentRows = segmentFeatures.map((f: { properties: { id: string; name: string; ward: string; length_m: number }; geometry: object }) => ({
    id: f.properties.id,
    name: f.properties.name,
    ward: f.properties.ward,
    length_m: f.properties.length_m,
    geometry: f.geometry,
  }));

  // Insert in batches
  for (let i = 0; i < segmentRows.length; i += 50) {
    const batch = segmentRows.slice(i, i + 50);
    const { error } = await supabase.from('segments').upsert(batch, { onConflict: 'id' });
    if (error) {
      console.error(`  Segment batch ${i} error:`, error.message);
    }
  }
  console.log(`  ✅ ${segmentRows.length} segments upserted`);

  // 3. Create departments
  console.log('🏛️ Creating departments...');
  const deptIds: Record<string, string> = {};
  for (const name of DEPARTMENTS) {
    const { data, error } = await supabase
      .from('departments')
      .upsert({ name }, { onConflict: 'name' })
      .select('id')
      .single();
    if (error) {
      console.error(`  Dept "${name}" error:`, error.message);
    } else {
      deptIds[name] = data.id;
    }
  }
  console.log(`  ✅ ${Object.keys(deptIds).length} departments`);

  // Get segment IDs for planting conflicts
  const segIds = segmentFeatures.map((f: { properties: { id: string } }) => f.properties.id);

  // 4. Generate works with planted conflicts
  console.log('🚧 Generating works with planted conflicts...');

  interface WorkDef {
    title: string;
    purpose: string;
    department: string;
    type: string;
    status: string;
    segmentIds: string[];
    startDate: string;
    endDate: string;
    label?: string;
  }

  const works: WorkDef[] = [];
  const labels: { workIndex: number; label: string; rule?: string; relatedWorkIndex?: number }[] = [];
  let workIdx = 0;

  // ─── Planted R1: 5 overlaps ────────────────────────────────

  for (let i = 0; i < 5; i++) {
    const seg = segIds[i % segIds.length];
    const baseDate = addDays('2026-11-01', i * 15);

    // First work
    works.push({
      title: `${DEPARTMENTS[0]} - Pipe repair #${i + 1}`,
      purpose: 'Water pipeline maintenance and repair',
      department: DEPARTMENTS[0],
      type: 'pipeline',
      status: 'planned',
      segmentIds: [seg],
      startDate: baseDate,
      endDate: addDays(baseDate, 20),
    });
    labels.push({ workIndex: workIdx, label: 'R1_pair_A' });
    workIdx++;

    // Overlapping work from different dept
    works.push({
      title: `${DEPARTMENTS[1]} - Road widening #${i + 1}`,
      purpose: 'Road widening and improvement project',
      department: DEPARTMENTS[1],
      type: 'excavation',
      status: 'planned',
      segmentIds: [seg],
      startDate: addDays(baseDate, 10), // overlaps by 10 days
      endDate: addDays(baseDate, 35),
    });
    labels.push({ workIndex: workIdx, label: 'R1_pair_B', rule: 'R1_OVERLAP', relatedWorkIndex: workIdx - 1 });
    workIdx++;
  }

  // ─── Planted R2: 4 repeat excavations ──────────────────────

  for (let i = 0; i < 4; i++) {
    const seg = segIds[(10 + i) % segIds.length];

    // Resurfacing work (completed)
    works.push({
      title: `${DEPARTMENTS[1]} - Resurfacing #${i + 1}`,
      purpose: 'Road resurfacing after previous work',
      department: DEPARTMENTS[1],
      type: 'resurfacing',
      status: 'completed',
      segmentIds: [seg],
      startDate: addDays('2026-01-01', i * 30),
      endDate: addDays('2026-02-01', i * 30),
    });
    labels.push({ workIndex: workIdx, label: 'R2_resurfacing' });
    workIdx++;

    // Excavation work within moratorium
    works.push({
      title: `${DEPARTMENTS[2]} - Drainage dig #${i + 1}`,
      purpose: 'New drainage line installation',
      department: DEPARTMENTS[2],
      type: 'drainage',
      status: 'planned',
      segmentIds: [seg],
      startDate: addDays('2026-08-01', i * 20), // within 12 months
      endDate: addDays('2026-09-01', i * 20),
    });
    labels.push({ workIndex: workIdx, label: 'R2_violation', rule: 'R2_REPEAT_EXCAVATION', relatedWorkIndex: workIdx - 1 });
    workIdx++;
  }

  // ─── Planted R3: 4 merge opportunities ─────────────────────

  for (let i = 0; i < 4; i++) {
    const seg = segIds[(20 + i) % segIds.length];

    // First work
    works.push({
      title: `${DEPARTMENTS[3]} - Power line #${i + 1}`,
      purpose: 'Underground power cable installation',
      department: DEPARTMENTS[3],
      type: 'cable',
      status: 'planned',
      segmentIds: [seg],
      startDate: addDays('2026-11-01', i * 10),
      endDate: addDays('2026-11-20', i * 10),
    });
    labels.push({ workIndex: workIdx, label: 'R3_pair_A' });
    workIdx++;

    // Different dept, same segment, gap < 90 days
    works.push({
      title: `${DEPARTMENTS[4]} - Telecom conduit #${i + 1}`,
      purpose: 'Fiber optic cable conduit installation',
      department: DEPARTMENTS[4],
      type: 'cable',
      status: 'planned',
      segmentIds: [seg],
      startDate: addDays('2027-01-15', i * 10), // ~55 day gap
      endDate: addDays('2027-02-05', i * 10),
    });
    labels.push({ workIndex: workIdx, label: 'R3_pair_B', rule: 'R3_MERGE_OPPORTUNITY', relatedWorkIndex: workIdx - 1 });
    workIdx++;
  }

  // ─── Planted near-miss negatives: 6 ────────────────────────

  // Near-miss 1: Gap of exactly 91 days (no R3)
  const nmSeg1 = segIds[30 % segIds.length];
  works.push({
    title: `${DEPARTMENTS[0]} - Valve replacement`,
    purpose: 'Water valve replacement',
    department: DEPARTMENTS[0],
    type: 'pipeline',
    status: 'planned',
    segmentIds: [nmSeg1],
    startDate: '2026-11-01',
    endDate: '2026-11-15',
  });
  labels.push({ workIndex: workIdx, label: 'near_miss_91day_A' });
  workIdx++;

  works.push({
    title: `${DEPARTMENTS[3]} - Cable pull`,
    purpose: 'Power cable pull-through',
    department: DEPARTMENTS[3],
    type: 'cable',
    status: 'planned',
    segmentIds: [nmSeg1],
    startDate: '2027-02-15', // 91 day gap
    endDate: '2027-03-01',
  });
  labels.push({ workIndex: workIdx, label: 'near_miss_91day_B' });
  workIdx++;

  // Near-miss 2: Adjacent days (no R1)
  const nmSeg2 = segIds[31 % segIds.length];
  works.push({
    title: `${DEPARTMENTS[1]} - Surface patch`,
    purpose: 'Pothole patching',
    department: DEPARTMENTS[1],
    type: 'resurfacing',
    status: 'active',
    segmentIds: [nmSeg2],
    startDate: '2026-11-01',
    endDate: '2026-11-10',
  });
  labels.push({ workIndex: workIdx, label: 'near_miss_adjacent_A' });
  workIdx++;

  works.push({
    title: `${DEPARTMENTS[2]} - Drain cleaning`,
    purpose: 'Storm drain cleaning',
    department: DEPARTMENTS[2],
    type: 'drainage',
    status: 'planned',
    segmentIds: [nmSeg2],
    startDate: '2026-11-11', // day after
    endDate: '2026-11-25',
  });
  labels.push({ workIndex: workIdx, label: 'near_miss_adjacent_B' });
  workIdx++;

  // Near-miss 3: Different segment (no conflict)
  works.push({
    title: `${DEPARTMENTS[0]} - Main line`,
    purpose: 'Main water line extension',
    department: DEPARTMENTS[0],
    type: 'pipeline',
    status: 'planned',
    segmentIds: [segIds[32 % segIds.length]],
    startDate: '2026-11-05',
    endDate: '2026-11-20',
  });
  labels.push({ workIndex: workIdx, label: 'near_miss_diff_segment_A' });
  workIdx++;

  works.push({
    title: `${DEPARTMENTS[1]} - Resurfacing`,
    purpose: 'Road resurfacing',
    department: DEPARTMENTS[1],
    type: 'resurfacing',
    status: 'planned',
    segmentIds: [segIds[33 % segIds.length]], // different segment
    startDate: '2026-11-05',
    endDate: '2026-11-20',
  });
  labels.push({ workIndex: workIdx, label: 'near_miss_diff_segment_B' });
  workIdx++;

  // ─── Clean works (no conflicts expected) ───────────────────

  const cleanTypes = ['excavation', 'resurfacing', 'pipeline', 'drainage', 'cable', 'other'] as const;
  const cleanStatuses = ['planned', 'active', 'completed'] as const;

  for (let i = 0; i < 8; i++) {
    const seg = segIds[(40 + i * 3) % segIds.length];
    works.push({
      title: `${randomItem(DEPARTMENTS)} - Routine work #${i + 1}`,
      purpose: 'Routine maintenance and improvement',
      department: randomItem(DEPARTMENTS),
      type: randomItem([...cleanTypes]),
      status: randomItem([...cleanStatuses]),
      segmentIds: [seg],
      startDate: addDays('2027-03-01', i * 40),
      endDate: addDays('2027-03-20', i * 40),
    });
    labels.push({ workIndex: workIdx, label: 'clean' });
    workIdx++;
  }

  console.log(`  📝 ${works.length} works prepared (${labels.filter(l => l.rule).length} planted conflicts)`);

  // 5. Clear existing demo data
  console.log('🧹 Clearing existing demo data...');
  const { data: existingWorks } = await supabase.from('works').select('id').eq('is_demo', true);
  if (existingWorks && existingWorks.length > 0) {
    const ids = existingWorks.map(w => w.id);
    await supabase.from('checkins').delete().in('work_id', ids);
    await supabase.from('delay_events').delete().in('work_id', ids);
    await supabase.from('work_segments').delete().in('work_id', ids);
    await supabase.from('works').delete().eq('is_demo', true);
    console.log(`  Cleared ${existingWorks.length} existing demo works`);
  }

  // 6. Insert works and their segments
  console.log('💾 Inserting works...');
  const insertedWorkIds: string[] = [];

  for (const work of works) {
    const deptId = deptIds[work.department];
    if (!deptId) {
      console.error(`  Missing dept: ${work.department}`);
      continue;
    }

    const { data: inserted, error } = await supabase
      .from('works')
      .insert({
        title: work.title,
        purpose: work.purpose,
        department_id: deptId,
        type: work.type,
        status: work.status,
        start_date: work.startDate,
        end_date: work.endDate,
        original_end_date: work.endDate,
        is_demo: true,
      })
      .select('id')
      .single();

    if (error) {
      console.error(`  Work "${work.title}" error:`, error.message);
      insertedWorkIds.push('');
      continue;
    }

    insertedWorkIds.push(inserted.id);

    // Insert work-segments
    const segInserts = work.segmentIds.map(segId => ({
      work_id: inserted.id,
      segment_id: segId,
    }));
    const { error: segErr } = await supabase.from('work_segments').insert(segInserts);
    if (segErr) {
      console.error(`  Seg link error for "${work.title}":`, segErr.message);
    }
  }

  console.log(`  ✅ ${insertedWorkIds.filter(Boolean).length} works inserted`);

  // 7. Add delay history for some works
  console.log('⏰ Adding delay events...');
  const delayTargets = insertedWorkIds.slice(0, 4).filter(Boolean);
  const delayReasons = ['weather', 'material_shortage', 'permit_pending', 'contractor_issue'] as const;

  for (let i = 0; i < delayTargets.length; i++) {
    const work = works[i];
    const { error } = await supabase.from('delay_events').insert({
      work_id: delayTargets[i],
      old_end: work.endDate,
      new_end: addDays(work.endDate, 14),
      reason: delayReasons[i],
      note: `Delay due to ${delayReasons[i].replace('_', ' ')}`,
    });
    if (error) console.error(`  Delay event error:`, error.message);

    // Update the work's end date
    await supabase.from('works').update({
      end_date: addDays(work.endDate, 14),
      status: 'delayed',
    }).eq('id', delayTargets[i]);
  }
  console.log(`  ✅ ${delayTargets.length} delay events added`);

  // 8. Save seed labels
  console.log('📋 Saving seed labels...');
  const seedLabels = labels.map((l, idx) => ({
    ...l,
    workId: insertedWorkIds[l.workIndex] || null,
    workTitle: works[l.workIndex]?.title || null,
  }));

  const labelsPath = path.join(__dirname, '..', 'data', 'seed-labels.json');
  fs.writeFileSync(labelsPath, JSON.stringify(seedLabels, null, 2));
  console.log(`  ✅ Labels saved to data/seed-labels.json`);

  // 9. Summary
  console.log('\n────────────────────────');
  console.log('✅ Seed complete!');
  console.log(`   Segments: ${segmentRows.length}`);
  console.log(`   Departments: ${Object.keys(deptIds).length}`);
  console.log(`   Works: ${insertedWorkIds.filter(Boolean).length}`);
  console.log(`   Planted conflicts: R1×5, R2×4, R3×4`);
  console.log(`   Near-miss negatives: 6`);
  console.log(`   Delay events: ${delayTargets.length}`);
}

seed().catch(err => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
