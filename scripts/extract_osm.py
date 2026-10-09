"""
DigOnce — OSM Road Segment Extractor
Extracts road segments for a given area using osmnx, splits at intersections,
and outputs GeoJSON LineStrings with stable IDs.

Usage:
    pip install osmnx
    python scripts/extract_osm.py

Output: data/segments.geojson
"""

import osmnx as ox
import json
import os

# ─── Configuration ───────────────────────────────────────────────

# Kancheepuram town center (~2 km²)
PLACE = "Kancheepuram, Tamil Nadu, India"
# Alternative: use a bounding box for more control
# BBOX = (12.845, 12.825, 79.720, 79.690)  # (north, south, east, west)

NETWORK_TYPE = "drive"  # drivable roads
TARGET_SEGMENTS = (300, 800)  # aim for this range

OUTPUT_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")
OUTPUT_FILE = os.path.join(OUTPUT_DIR, "segments.geojson")


def extract_segments():
    print(f"📍 Fetching road network for: {PLACE}")

    # Download the road network
    G = ox.graph_from_place(PLACE, network_type=NETWORK_TYPE)

    # Simplify and project
    G = ox.simplify_graph(G)

    print(f"   Graph: {len(G.nodes)} nodes, {len(G.edges)} edges")

    # Convert to GeoDataFrame
    edges = ox.graph_to_gdfs(G, nodes=False)

    # Reset index to get u, v, key columns
    edges = edges.reset_index()

    print(f"   Raw edges: {len(edges)}")

    # If too many segments, sample
    if len(edges) > TARGET_SEGMENTS[1]:
        edges = edges.sample(n=TARGET_SEGMENTS[1], random_state=42)
        print(f"   Sampled to {len(edges)} segments")

    # Build GeoJSON features
    features = []
    for idx, row in edges.iterrows():
        # Create stable ID from OSM way ID + index
        osmid = row.get("osmid", idx)
        if isinstance(osmid, list):
            osmid = osmid[0]

        seg_id = f"seg_{osmid}_{idx}"

        # Get road name
        name = row.get("name", None)
        if isinstance(name, list):
            name = name[0]
        if name is None or (isinstance(name, float) and str(name) == "nan"):
            name = None

        # Get length
        length_m = round(row.get("length", 0), 1)

        # Convert geometry to GeoJSON
        geom = row.geometry
        coords = list(geom.coords)

        # Ensure coordinates are [lng, lat] (osmnx uses this by default)
        feature = {
            "type": "Feature",
            "id": seg_id,
            "properties": {
                "id": seg_id,
                "name": name,
                "ward": None,  # Can be enriched later
                "length_m": length_m,
            },
            "geometry": {
                "type": "LineString",
                "coordinates": [[round(c[0], 6), round(c[1], 6)] for c in coords],
            },
        }
        features.append(feature)

    # Build FeatureCollection
    geojson = {
        "type": "FeatureCollection",
        "features": features,
    }

    # Write output
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    with open(OUTPUT_FILE, "w") as f:
        json.dump(geojson, f, indent=2)

    print(f"\n✅ Wrote {len(features)} segments to {OUTPUT_FILE}")
    print(f"   Segment count is {'within' if TARGET_SEGMENTS[0] <= len(features) <= TARGET_SEGMENTS[1] else 'outside'} target range {TARGET_SEGMENTS}")

    # Print a few sample segment IDs for the seed script
    print("\n📋 Sample segment IDs:")
    for f_item in features[:10]:
        print(f"   {f_item['properties']['id']}: {f_item['properties']['name'] or 'unnamed'} ({f_item['properties']['length_m']}m)")


if __name__ == "__main__":
    extract_segments()
