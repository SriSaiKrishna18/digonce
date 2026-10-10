import urllib.request, json

URL = "https://scyahhlxzuccsyhsmbmh.supabase.co"
KEY = "sb_publishable_PJuxMi7TLoVmRx4QRae1Lg_cGF5Py8g"

def get(table, select="*", limit=5):
    req = urllib.request.Request(
        f"{URL}/rest/v1/{table}?select={select}&limit={limit}",
        headers={"apikey": KEY, "Authorization": f"Bearer {KEY}"}
    )
    with urllib.request.urlopen(req) as r:
        return json.loads(r.read())

print("=== Departments ===")
depts = get("departments", "id,name", 10)
print(f"  Count: {len(depts)}")
for d in depts:
    print(f"  {d['name']}")

print("\n=== Segments ===")
segs = get("segments", "id,name", 5)
print(f"  Sample: {len(segs)} shown")
for s in segs:
    print(f"  {s['id']}: {s.get('name', '(unnamed)')}")

print("\n=== Works ===")
works = get("works", "id,title,status,type", 10)
print(f"  Count: {len(works)}")
for w in works:
    print(f"  [{w['status']}] {w['title']}")

print("\nAll good!" if depts and segs and works else "\nSOMETHING MISSING!")
