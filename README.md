# DigOnce — Dig the road once. Know why. Hold on-time.

## The Problem
Across Indian municipalities, roads are repeatedly dug up by uncoordinated departments—often destroying freshly paved surfaces. The lack of a shared planning system wastes taxpayer money, creates perpetual traffic chaos, and causes severe infrastructure fatigue.

## Our Solution
DigOnce is a unified public works coordination engine for municipal departments. It intelligently detects geographical and temporal scheduling conflicts before they happen. By enforcing mandatory coordination and public accountability, DigOnce ensures that roads are dug once, fixed properly, and tracked transparently.

## Key Features
* **Conflict Detection Engine:** Real-time spatial and temporal overlap analysis based on 3 core rules.
* **Live Map:** Interactive geospatial visualization of all municipal projects.
* **Department Portal:** Secure dashboard for filing and managing excavation requests.
* **Citizen Check-ins:** Public transparency tools for tracking delays and road statuses.
* **Delay Accountability Ledger:** Publicly visible ledger mandating reasons for project delays.
* **Merge Suggestions:** Automated recommendations for departments to share trenches and combine work schedules.

## Architecture
The system is built on a modern stack comprising **Next.js**, **Supabase**, **MapLibre**, and **Turf.js**. The conflict detection engine operates on pure TypeScript and is fully deterministic, ensuring consistent spatial evaluations with no AI in the critical decision path.

## Conflict Rules

| Rule ID | Trigger | Severity |
| :--- | :--- | :--- |
| `OVERLAP` | Two projects cover the same geography at the same time. | High |
| `MORATORIUM` | Work requested on a road that was recently paved. | Critical |
| `MERGE` | Two projects are near each other around the same time. | Suggestion |

## Tech Stack

| Category | Technology |
| :--- | :--- |
| Frontend | Next.js (App Router), React, Tailwind CSS |
| Backend | Next.js API Routes, Supabase (PostgreSQL) |
| Maps & Geospatial | MapLibre GL JS, Turf.js |
| Authentication | Supabase Auth |
| Deployment | Vercel (Frontend), Supabase (Database) |

## Screenshots
*(screenshots will be added)*

## Getting Started
1. Clone the repository
2. Run `npm install`
3. Create a `.env.local` file with your Supabase credentials
4. Run migrations using Supabase CLI
5. Seed the database
6. Start the development server with `npm run dev`

## Engine Testing
The conflict detection engine is fully tested with 14/14 unit tests passing, ensuring robust spatial and temporal evaluation logic.

## Data Attribution
Map data provided by OpenStreetMap (ODbL) and OpenFreeMap tiles.

## Team
Solo build by Sri for Bits and Bytes 2026, IIITDM Kancheepuram.

## Honest Framing
This is a 24-hour prototype. The conflict rules are validated against synthetic ground truth, not real municipal data. Real-world deployment would require integration with actual department workflows and legacy systems.
