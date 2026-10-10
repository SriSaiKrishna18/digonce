"""
DigOnce — Seed data into Supabase via REST API
Uses the publishable key + direct REST API calls.
Zero npm/node dependencies needed.
"""
import urllib.request
import json
import os
import uuid
import random
from datetime import datetime, timedelta

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
GEOJSON = os.path.join(BASE, "data", "segments.geojson")

SUPABASE_URL = "https://scyahhlxzuccsyhsmbmh.supabase.co"
SUPABASE_KEY = "sb_publishable_PJuxMi7TLoVmRx4QRae1Lg_cGF5Py8g"

random.seed(42)

def api_post(table, data, upsert=False):
    url = f"{SUPABASE_URL}/rest/v1/{table}"
    body = json.dumps(data).encode("utf-8")
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "resolution=merge-duplicates" if upsert else "return=minimal",
    }
    req = urllib.request.Request(url, data=body, headers=headers, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            return resp.status
    except urllib.error.HTTPError as e:
        body = e.read().decode()
        print(f"  ERROR {e.code}: {body[:200]}")
        return e.code

def uid():
    return str(uuid.uuid4())

def main():
    print("DigOnce - Seeding Supabase\n")

    # Load segments
    with open(GEOJSON) as f:
        geo = json.load(f)
    features = geo["features"]
    print(f"1. Loading {len(features)} segments...")

    # Seed departments
    depts = [
        {"id": "dept_water", "name": "Water Supply & Sewerage"},
        {"id": "dept_roads", "name": "Roads & Bridges"},
        {"id": "dept_power", "name": "Electricity & Power"},
        {"id": "dept_telecom", "name": "Telecom & Fibre"},
        {"id": "dept_gas", "name": "Gas Pipeline Authority"},
    ]
    print(f"2. Inserting {len(depts)} departments...")
    for d in depts:
        status = api_post("departments", d, upsert=True)
        if status not in (200, 201, 204, 409):
            print(f"   Failed dept {d['id']}: {status}")

    # Seed segments (batch of 30)
    print(f"3. Inserting {len(features)} segments (batched)...")
    seg_rows = []
    for feat in features:
        p = feat["properties"]
        seg_rows.append({
            "id": p["id"],
            "name": p.get("name"),
            "ward": p.get("ward"),
            "geometry": feat["geometry"],
        })

    BATCH = 30
    for i in range(0, len(seg_rows), BATCH):
        batch = seg_rows[i:i+BATCH]
        status = api_post("segments", batch, upsert=True)
        print(f"   Batch {i//BATCH + 1}: {len(batch)} rows -> {status}")

    # Seed works
    seg_ids = [f["properties"]["id"] for f in features]
    named_segs = [f["properties"]["id"] for f in features if f["properties"].get("name")]
    if len(named_segs) < 10:
        named_segs = seg_ids[:20]

    today = datetime(2026, 10, 10)
    works = []

    # R1 OVERLAP pair 1
    overlap_seg = named_segs[0]
    w1_id, w2_id = uid(), uid()
    works.append({"id": w1_id, "title": "Water main replacement - Phase 1", "purpose": "Water pipeline replacement on main road",
                  "department_id": "dept_water", "type": "pipeline", "status": "active",
                  "start_date": (today - timedelta(days=10)).strftime("%Y-%m-%d"),
                  "end_date": (today + timedelta(days=20)).strftime("%Y-%m-%d"),
                  "original_end_date": (today + timedelta(days=20)).strftime("%Y-%m-%d"),
                  "contractor_name": "ABC Contractors", "is_demo": True, "_segs": [overlap_seg]})
    works.append({"id": w2_id, "title": "Road resurfacing after monsoon damage", "purpose": "Resurfacing damaged road surface",
                  "department_id": "dept_roads", "type": "resurfacing", "status": "planned",
                  "start_date": (today + timedelta(days=5)).strftime("%Y-%m-%d"),
                  "end_date": (today + timedelta(days=35)).strftime("%Y-%m-%d"),
                  "original_end_date": (today + timedelta(days=35)).strftime("%Y-%m-%d"),
                  "contractor_name": "XYZ Roads Ltd", "is_demo": True, "_segs": [overlap_seg]})

    # R1 OVERLAP pair 2
    overlap_seg2 = named_segs[1]
    w3_id, w4_id = uid(), uid()
    works.append({"id": w3_id, "title": "Fibre optic cable laying - East corridor", "purpose": "High-speed internet backbone",
                  "department_id": "dept_telecom", "type": "cable", "status": "active",
                  "start_date": (today - timedelta(days=5)).strftime("%Y-%m-%d"),
                  "end_date": (today + timedelta(days=30)).strftime("%Y-%m-%d"),
                  "original_end_date": (today + timedelta(days=30)).strftime("%Y-%m-%d"),
                  "contractor_name": "NetConnect India", "is_demo": True, "_segs": [overlap_seg2]})
    works.append({"id": w4_id, "title": "Gas pipeline extension", "purpose": "Natural gas supply expansion",
                  "department_id": "dept_gas", "type": "pipeline", "status": "planned",
                  "start_date": (today + timedelta(days=15)).strftime("%Y-%m-%d"),
                  "end_date": (today + timedelta(days=45)).strftime("%Y-%m-%d"),
                  "original_end_date": (today + timedelta(days=45)).strftime("%Y-%m-%d"),
                  "contractor_name": "Gas Authority", "is_demo": True, "_segs": [overlap_seg2]})

    # R2 REPEAT EXCAVATION
    morat_seg = named_segs[2]
    w5_id, w6_id = uid(), uid()
    works.append({"id": w5_id, "title": "Sewer line installation", "purpose": "New sewer connection",
                  "department_id": "dept_water", "type": "excavation", "status": "completed",
                  "start_date": (today - timedelta(days=90)).strftime("%Y-%m-%d"),
                  "end_date": (today - timedelta(days=60)).strftime("%Y-%m-%d"),
                  "original_end_date": (today - timedelta(days=60)).strftime("%Y-%m-%d"),
                  "contractor_name": "Drainage Corp", "is_demo": True, "_segs": [morat_seg]})
    works.append({"id": w6_id, "title": "Road resurfacing - post sewer work", "purpose": "Restore road surface",
                  "department_id": "dept_roads", "type": "resurfacing", "status": "planned",
                  "start_date": (today - timedelta(days=55)).strftime("%Y-%m-%d"),
                  "end_date": (today - timedelta(days=40)).strftime("%Y-%m-%d"),
                  "original_end_date": (today - timedelta(days=40)).strftime("%Y-%m-%d"),
                  "contractor_name": "Roads Division", "is_demo": True, "_segs": [morat_seg]})

    # R3 MERGE OPPORTUNITY
    merge_seg = named_segs[3]
    w7_id, w8_id = uid(), uid()
    works.append({"id": w7_id, "title": "Water pipe maintenance", "purpose": "Routine maintenance of water pipes",
                  "department_id": "dept_water", "type": "pipeline", "status": "planned",
                  "start_date": (today + timedelta(days=40)).strftime("%Y-%m-%d"),
                  "end_date": (today + timedelta(days=55)).strftime("%Y-%m-%d"),
                  "original_end_date": (today + timedelta(days=55)).strftime("%Y-%m-%d"),
                  "is_demo": True, "_segs": [merge_seg]})
    works.append({"id": w8_id, "title": "Power cable undergrounding", "purpose": "Moving overhead cables underground",
                  "department_id": "dept_power", "type": "cable", "status": "planned",
                  "start_date": (today + timedelta(days=70)).strftime("%Y-%m-%d"),
                  "end_date": (today + timedelta(days=90)).strftime("%Y-%m-%d"),
                  "original_end_date": (today + timedelta(days=90)).strftime("%Y-%m-%d"),
                  "contractor_name": "ElectraCorp", "is_demo": True, "_segs": [merge_seg]})

    # Filler works
    dept_ids = [d["id"] for d in depts]
    for i in range(20):
        dept_id = random.choice(dept_ids)
        wtype = random.choice(["excavation", "resurfacing", "pipeline", "drainage", "cable"])
        status = random.choice(["planned", "active", "completed", "delayed", "planned", "active"])
        start = today + timedelta(days=random.randint(-60, 60))
        dur = random.randint(10, 45)
        end = start + timedelta(dur)
        orig_end = end if status != "delayed" else end - timedelta(days=random.randint(5, 15))
        segs = random.sample(seg_ids[:50], k=random.randint(1, 3))
        contractor = random.choice(["Metro Infra", "CivicBuild", "RoadMaster", "AquaTech", "GridWorks", None])
        w = {"id": uid(), "title": f"Infrastructure work #{i+1}", "purpose": f"Scheduled {wtype} work",
             "department_id": dept_id, "type": wtype, "status": status,
             "start_date": start.strftime("%Y-%m-%d"), "end_date": end.strftime("%Y-%m-%d"),
             "original_end_date": orig_end.strftime("%Y-%m-%d"),
             "is_demo": True, "_segs": segs}
        if contractor:
            w["contractor_name"] = contractor
        works.append(w)

    print(f"4. Inserting {len(works)} works...")
    work_segments = []
    delay_events = []
    for w in works:
        segs = w.pop("_segs")
        for s in segs:
            work_segments.append({"work_id": w["id"], "segment_id": s})
        if w["status"] == "delayed":
            delay_events.append({
                "id": uid(), "work_id": w["id"],
                "old_end": w["original_end_date"], "new_end": w["end_date"],
                "reason": random.choice(["weather", "material_shortage", "permit_pending", "utility_clash"]),
                "note": "Delay recorded for demo",
            })
        status = api_post("works", w, upsert=True)
        if status not in (200, 201, 204, 409):
            print(f"   Failed work {w['id']}: {status}")

    print(f"5. Inserting {len(work_segments)} work-segment links...")
    for i in range(0, len(work_segments), BATCH):
        batch = work_segments[i:i+BATCH]
        status = api_post("work_segments", batch, upsert=True)
        print(f"   Batch {i//BATCH + 1}: {len(batch)} -> {status}")

    if delay_events:
        print(f"6. Inserting {len(delay_events)} delay events...")
        for de in delay_events:
            api_post("delay_events", de, upsert=True)

    print("\nDone! Data seeded into Supabase.")

if __name__ == "__main__":
    main()
