"""
Generate SQL seed file with proper UUIDs.
Output: data/seed.sql — paste into Supabase SQL Editor.
"""
import json, os, uuid, random
from datetime import datetime, timedelta

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
GEOJSON = os.path.join(BASE, "data", "segments.geojson")
OUTPUT = os.path.join(BASE, "data", "seed.sql")
random.seed(42)

def uid(): return str(uuid.uuid4())

# Fixed UUIDs for departments (reproducible)
DEPT_UUIDS = {
    "Water Supply & Sewerage": "a1111111-1111-1111-1111-111111111111",
    "Roads & Bridges": "a2222222-2222-2222-2222-222222222222",
    "Electricity & Power": "a3333333-3333-3333-3333-333333333333",
    "Telecom & Fibre": "a4444444-4444-4444-4444-444444444444",
    "Gas Pipeline Authority": "a5555555-5555-5555-5555-555555555555",
}

def esc(s):
    return s.replace("'", "''") if s else s

def main():
    with open(GEOJSON) as f:
        geo = json.load(f)
    features = geo["features"]

    lines = [
        "-- DigOnce Seed Data (auto-generated)",
        "-- Paste into Supabase SQL Editor, click Run",
        "",
        "-- Departments",
    ]
    for name, did in DEPT_UUIDS.items():
        lines.append(f"INSERT INTO departments (id, name) VALUES ('{did}', '{esc(name)}') ON CONFLICT (id) DO NOTHING;")
    lines.append("")

    # Segments
    lines.append("-- Road Segments (" + str(len(features)) + " from OpenStreetMap)")
    for feat in features:
        p = feat["properties"]
        sid = esc(p["id"])
        name_val = f"'{esc(p['name'])}'" if p.get("name") else "NULL"
        ward_val = f"'{esc(p['ward'])}'" if p.get("ward") else "NULL"
        geom = json.dumps(feat["geometry"]).replace("'", "''")
        lines.append(f"INSERT INTO segments (id, name, ward, geometry) VALUES ('{sid}', {name_val}, {ward_val}, '{geom}'::jsonb) ON CONFLICT (id) DO NOTHING;")
    lines.append("")

    # Works
    seg_ids = [f["properties"]["id"] for f in features]
    named_segs = [f["properties"]["id"] for f in features if f["properties"].get("name")]
    if len(named_segs) < 10:
        named_segs = seg_ids[:20]

    today = datetime(2026, 10, 10)
    dept_list = list(DEPT_UUIDS.items())
    dept_water = DEPT_UUIDS["Water Supply & Sewerage"]
    dept_roads = DEPT_UUIDS["Roads & Bridges"]
    dept_power = DEPT_UUIDS["Electricity & Power"]
    dept_telecom = DEPT_UUIDS["Telecom & Fibre"]
    dept_gas = DEPT_UUIDS["Gas Pipeline Authority"]

    works = []  # (id, title, purpose, dept_uuid, type, status, start, end, orig_end, contractor, is_demo, [segs])

    # R1 OVERLAP pair 1
    s = named_segs[0]
    w1, w2 = uid(), uid()
    works.append((w1, "Water main replacement - Phase 1", "Pipeline replacement on main road", dept_water, "pipeline", "active",
                  (today-timedelta(10)).isoformat()[:10], (today+timedelta(20)).isoformat()[:10], (today+timedelta(20)).isoformat()[:10], "ABC Contractors", [s]))
    works.append((w2, "Road resurfacing after monsoon", "Resurfacing damaged surface", dept_roads, "resurfacing", "planned",
                  (today+timedelta(5)).isoformat()[:10], (today+timedelta(35)).isoformat()[:10], (today+timedelta(35)).isoformat()[:10], "XYZ Roads", [s]))

    # R1 OVERLAP pair 2
    s2 = named_segs[1]
    w3, w4 = uid(), uid()
    works.append((w3, "Fibre optic cable - East corridor", "Internet backbone", dept_telecom, "cable", "active",
                  (today-timedelta(5)).isoformat()[:10], (today+timedelta(30)).isoformat()[:10], (today+timedelta(30)).isoformat()[:10], "NetConnect", [s2]))
    works.append((w4, "Gas pipeline extension", "Natural gas expansion", dept_gas, "pipeline", "planned",
                  (today+timedelta(15)).isoformat()[:10], (today+timedelta(45)).isoformat()[:10], (today+timedelta(45)).isoformat()[:10], "GasAuth", [s2]))

    # R2 REPEAT EXCAVATION
    s3 = named_segs[2]
    w5, w6 = uid(), uid()
    works.append((w5, "Sewer line installation", "New sewer connection", dept_water, "excavation", "completed",
                  (today-timedelta(90)).isoformat()[:10], (today-timedelta(60)).isoformat()[:10], (today-timedelta(60)).isoformat()[:10], "Drainage Corp", [s3]))
    works.append((w6, "Road resurfacing - post sewer", "Restore road surface", dept_roads, "resurfacing", "planned",
                  (today-timedelta(55)).isoformat()[:10], (today-timedelta(40)).isoformat()[:10], (today-timedelta(40)).isoformat()[:10], "Roads Div", [s3]))

    # R3 MERGE OPPORTUNITY
    s4 = named_segs[3]
    w7, w8 = uid(), uid()
    works.append((w7, "Water pipe maintenance", "Routine pipe maintenance", dept_water, "pipeline", "planned",
                  (today+timedelta(40)).isoformat()[:10], (today+timedelta(55)).isoformat()[:10], (today+timedelta(55)).isoformat()[:10], None, [s4]))
    works.append((w8, "Power cable undergrounding", "Moving cables underground", dept_power, "cable", "planned",
                  (today+timedelta(70)).isoformat()[:10], (today+timedelta(90)).isoformat()[:10], (today+timedelta(90)).isoformat()[:10], "ElectraCorp", [s4]))

    # Filler
    for i in range(20):
        dept_name, dept_id = random.choice(dept_list)
        wtype = random.choice(["excavation", "resurfacing", "pipeline", "drainage", "cable"])
        status = random.choice(["planned", "active", "completed", "delayed", "planned", "active"])
        start = today + timedelta(days=random.randint(-60, 60))
        end = start + timedelta(random.randint(10, 45))
        orig_end = end if status != "delayed" else end - timedelta(days=random.randint(5, 15))
        segs = random.sample(seg_ids[:50], k=random.randint(1, 3))
        contractor = random.choice(["Metro Infra", "CivicBuild", "RoadMaster", "AquaTech", "GridWorks", None])
        works.append((uid(), f"Infrastructure work #{i+1}", f"Scheduled {wtype} work", dept_id, wtype, status,
                      start.isoformat()[:10], end.isoformat()[:10], orig_end.isoformat()[:10], contractor, segs))

    lines.append(f"-- Works ({len(works)} total, with planted conflicts)")
    for w in works:
        wid, title, purpose, dept_id, wtype, status, start, end, orig_end, contractor, segs = w
        c_val = f"'{esc(contractor)}'" if contractor else "NULL"
        lines.append(
            f"INSERT INTO works (id, title, purpose, department_id, type, status, start_date, end_date, original_end_date, contractor_name, is_demo) "
            f"VALUES ('{wid}', '{esc(title)}', '{esc(purpose)}', '{dept_id}', '{wtype}', '{status}', '{start}', '{end}', '{orig_end}', {c_val}, true) "
            f"ON CONFLICT (id) DO NOTHING;"
        )
    lines.append("")

    lines.append("-- Work-Segment links")
    for w in works:
        wid = w[0]
        segs = w[10]
        for sid in segs:
            lines.append(f"INSERT INTO work_segments (work_id, segment_id) VALUES ('{wid}', '{sid}') ON CONFLICT DO NOTHING;")
    lines.append("")

    lines.append("-- Delay events")
    for w in works:
        if w[5] == "delayed":
            reason = random.choice(["weather", "material_shortage", "permit_pending", "utility_clash"])
            lines.append(
                f"INSERT INTO delay_events (id, work_id, old_end, new_end, reason, note) "
                f"VALUES ('{uid()}', '{w[0]}', '{w[8]}', '{w[7]}', '{reason}', 'Delay recorded for demo') "
                f"ON CONFLICT (id) DO NOTHING;"
            )
    lines.append("")
    lines.append("-- Done!")

    os.makedirs(os.path.dirname(OUTPUT), exist_ok=True)
    with open(OUTPUT, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))

    print(f"Generated {len(lines)} lines -> data/seed.sql")
    print(f"  {len(DEPT_UUIDS)} departments, {len(features)} segments, {len(works)} works")
    print(f"\nPaste data/seed.sql into Supabase SQL Editor and click Run.")

if __name__ == "__main__":
    main()
