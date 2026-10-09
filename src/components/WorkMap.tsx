'use client';

import dynamic from 'next/dynamic';

const MapView = dynamic(() => import('./MapView'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-gray-100 flex items-center justify-center">
      <div className="text-gray-500 text-sm">Loading map...</div>
    </div>
  ),
});

interface WorkMapProps {
  segments: any;
  works: any[];
  center?: [number, number];
}

export default function WorkMap({ segments, works, center = [79.7036, 12.8342] }: WorkMapProps) {
  return (
    <MapView
      segments={segments}
      works={works}
      center={center}
    />
  );
}
