'use client';

import dynamic from 'next/dynamic';

// Dynamically import MapView to avoid SSR issues with maplibre-gl
const MapView = dynamic(() => import('./MapView'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-gray-100 flex items-center justify-center">
      <div className="text-gray-500 text-sm">Loading map...</div>
    </div>
  ),
});

export default MapView;
