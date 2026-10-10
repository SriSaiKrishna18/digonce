import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DigOnce — Public Works Coordination Engine",
  description:
    "Prevent repeated road excavation. Detect scheduling conflicts across departments. Hold timelines accountable with citizen check-ins.",
  keywords: ["civic tech", "public works", "road excavation", "coordination", "conflict detection", "municipality"],
  authors: [{ name: "Sri Sai Krishna" }],
  openGraph: {
    title: "DigOnce — Dig the road once. Know why. Hold on-time.",
    description: "A coordination engine that detects scheduling conflicts before departments break ground. Built for Bits and Bytes 2026, IIITDM Kancheepuram.",
    type: "website",
    locale: "en_IN",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col">
        {/* Data provenance banner */}
        <div
          className="text-center text-[11px] tracking-wide py-1.5 px-4"
          style={{
            backgroundColor: "var(--color-warning-bg)",
            color: "var(--color-warning)",
            borderBottom: "1px solid #e5d8b8",
          }}
        >
          Simulated data for demonstration — Road geometry from OpenStreetMap.
          Departments and works are fictional.
        </div>

        {/* Navigation */}
        <header
          className="sticky top-0 z-50"
          style={{
            backgroundColor: "var(--color-surface-primary)",
            borderBottom: "1px solid var(--color-border-default)",
          }}
        >
          <nav className="max-w-6xl mx-auto px-5 h-14 flex items-center justify-between">
            <div className="flex items-center gap-8">
              <a href="/" className="flex items-center gap-2.5" aria-label="DigOnce home">
                <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
                  <rect x="1" y="1" width="9" height="9" rx="1" fill="#c2410c" />
                  <rect x="12" y="1" width="9" height="9" rx="1" fill="#ea6d1f" opacity="0.6" />
                  <rect x="1" y="12" width="9" height="9" rx="1" fill="#ea6d1f" opacity="0.6" />
                  <rect x="12" y="12" width="9" height="9" rx="1" fill="#c2410c" />
                </svg>
                <span className="text-[15px] font-semibold tracking-tight" style={{ color: "var(--color-text-primary)" }}>
                  DigOnce
                </span>
              </a>

              <div className="hidden md:flex items-center gap-1">
                <a href="/" className="nav-link px-3 py-1.5 text-[13px] font-medium rounded-md">
                  Map
                </a>
                <a href="/about" className="nav-link px-3 py-1.5 text-[13px] font-medium rounded-md">
                  About
                </a>
                <a href="/savings" className="nav-link px-3 py-1.5 text-[13px] font-medium rounded-md">
                  Savings
                </a>
                <a href="/timeline" className="nav-link px-3 py-1.5 text-[13px] font-medium rounded-md">
                  Timeline
                </a>
                <a href="/benchmark" className="nav-link px-3 py-1.5 text-[13px] font-medium rounded-md">
                  Benchmark
                </a>
              </div>
            </div>

            <a href="/dept" className="nav-btn-dark text-[13px] font-medium px-4 py-2 rounded-md">
              Department Portal
            </a>
          </nav>
        </header>

        <main className="flex-1">{children}</main>

        <footer className="py-5" style={{ borderTop: "1px solid var(--color-border-default)" }}>
          <div
            className="max-w-6xl mx-auto px-5 flex flex-wrap gap-x-6 gap-y-1 text-[11px]"
            style={{ color: "var(--color-text-tertiary)" }}
          >
            <span>DigOnce — Bits and Bytes 2026, IIITDM Kancheepuram</span>
            <span>
              Road data ©{" "}
              <a href="https://www.openstreetmap.org/copyright" className="underline underline-offset-2" target="_blank" rel="noopener noreferrer">
                OpenStreetMap contributors
              </a>
            </span>
            <span>
              Tiles by{" "}
              <a href="https://openfreemap.org" className="underline underline-offset-2" target="_blank" rel="noopener noreferrer">
                OpenFreeMap
              </a>
            </span>
          </div>
        </footer>
      </body>
    </html>
  );
}
