import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DigOnce — Dig once. Know why. Hold on-time.",
  description: "Public works coordination engine for transparent, accountable infrastructure projects. CivicTech track — Bits and Bytes 2026.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 text-gray-900 antialiased">
        {/* Simulated data banner */}
        <div className="bg-amber-500 text-amber-950 text-center text-sm font-medium py-1.5 px-4">
          ⚠️ Simulated demo data — Road geometry from OpenStreetMap, works and departments are fictional
        </div>

        {/* Navigation */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
          <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
            <div className="flex items-center gap-6">
              <a href="/" className="text-lg font-bold text-orange-600 flex items-center gap-2">
                <span className="text-2xl">🚧</span>
                DigOnce
              </a>
              <a href="/" className="text-sm text-gray-600 hover:text-gray-900 hidden sm:inline">
                Map
              </a>
              <a href="/benchmark" className="text-sm text-gray-600 hover:text-gray-900 hidden sm:inline">
                Benchmark
              </a>
            </div>

            <div className="flex items-center gap-3">
              <a
                href="/dept"
                className="text-sm bg-orange-600 text-white px-3 py-1.5 rounded-md hover:bg-orange-700 transition"
              >
                Try as Department →
              </a>
            </div>
          </nav>
        </header>

        <main>{children}</main>

        {/* Footer with attribution */}
        <footer className="border-t border-gray-200 bg-white mt-auto py-4">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-xs text-gray-500 flex flex-wrap gap-x-4 gap-y-1">
            <span>© 2026 DigOnce — Bits and Bytes Hackathon, IIITDM Kancheepuram</span>
            <span>Road data © <a href="https://www.openstreetmap.org/copyright" className="underline" target="_blank" rel="noopener noreferrer">OpenStreetMap contributors</a></span>
            <span>Map tiles by <a href="https://openfreemap.org" className="underline" target="_blank" rel="noopener noreferrer">OpenFreeMap</a></span>
          </div>
        </footer>
      </body>
    </html>
  );
}
