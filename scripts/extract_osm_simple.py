"""
DigOnce — OSM Road Segment Extractor v2
Uses a smaller bounding box and alternative Overpass server.
Zero dependencies — Python stdlib only.
"""

import urllib.request
import urllib.parse
import json
import os
import math

# Smaller area — Kancheepuram center (~1 km²)
SOUTH, WEST, NORTH, EAST = 12.830, 79.695, 12.840, 79.710

OUTPUT_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data")
OUTPUT_FILE = os.path.join(OUTPUT_DIR, "segments.geojson")

OVERPASS_QUERY = f"""
[out:json][timeout:25];
(
  way["highway"~"^(trunk|primary|secondary|tertiary|residential|unclassified)$"]
    ({SOUTH},{WEST},{NORTH},{EAST});
);
out body;
>;
out skel qt;
"""

# Try multiple Overpass servers
SERVERS = [
    "https://overpass.kumi.systems/api/interpreter",
    "https://overpass-api.de/api/interpreter",
    "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
]


def fetch_overpass():
    print("Fetching roads from Overpass API...")
    print(f"  Box: {SOUTH},{WEST} to {NORTH},{EAST}")

    data = urllib.parse.urlencode({"data": OVERPASS_QUERY}).encode("utf-8")

    for server in SERVERS:
        try:
            print(f"  Trying {server.split('/')[2]}...")
            req = urllib.request.Request(server, data=data)
            req.add_header("User-Agent", "DigOnce-Hackathon/1.0")
            with urllib.request.urlopen(req, timeout=30) as resp:
                result = json.loads(resp.read().decode("utf-8"))
            print("  Success!")
            return result
        except Exception as e:
            print(f"  Failed: {e}")
            continue

    raise RuntimeError("All Overpass servers failed")


def build_geojson(overpass_data):
    elements = overpass_data.get("elements", [])
    nodes = {}
    ways = []
    for el in elements:
        if el["type"] == "node":
            nodes[el["id"]] = (el["lon"], el["lat"])
        elif el["type"] == "way":
            ways.append(el)

    print(f"  {len(nodes)} nodes, {len(ways)} ways")

    features = []
    for way in ways:
        tags = way.get("tags", {})
        node_ids = way.get("nodes", [])
        coords = []
        for nid in node_ids:
            if nid in nodes:
                coords.append([round(nodes[nid][0], 6), round(nodes[nid][1], 6)])
        if len(coords) < 2:
            continue

        seg_id = f"seg_{way['id']}"
        name = tags.get("name", tags.get("name:en", None))

        total_len = 0
        for i in range(len(coords) - 1):
            dx = (coords[i+1][0] - coords[i][0]) * 111320 * math.cos(math.radians(coords[i][1]))
            dy = (coords[i+1][1] - coords[i][1]) * 110540
            total_len += math.sqrt(dx*dx + dy*dy)

        features.append({
            "type": "Feature",
            "id": seg_id,
            "properties": {
                "id": seg_id,
                "name": name,
                "ward": None,
                "length_m": round(total_len, 1),
                "osm_id": way["id"],
                "highway": tags.get("highway", "unknown"),
            },
            "geometry": {
                "type": "LineString",
                "coordinates": coords,
            },
        })

    return {"type": "FeatureCollection", "features": features}


def main():
    print("DigOnce — OSM Extractor v2\n")
    result = fetch_overpass()
    geojson = build_geojson(result)

    os.makedirs(OUTPUT_DIR, exist_ok=True)
    with open(OUTPUT_FILE, "w") as f:
        json.dump(geojson, f)

    n = len(geojson["features"])
    named = sum(1 for f in geojson["features"] if f["properties"]["name"])
    print(f"\n  {n} segments -> data/segments.geojson")
    print(f"  Named: {named}, Unnamed: {n - named}")
    for feat in geojson["features"][:5]:
        p = feat["properties"]
        print(f"    {p['id']}: {p['name'] or '(unnamed)'} [{p['highway']}] {p['length_m']}m")
    print("\nDone!")


if __name__ == "__main__":
    main()
