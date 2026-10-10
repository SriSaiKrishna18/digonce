'use client';
import dynamic from 'next/dynamic';
const MapView = dynamic(() => import('./MapView'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: 'var(--color-surface-secondary)' }}>
      <div className="text-[13px]" style={{ color: 'var(--color-text-tertiary)' }}>Loading map...</div>
    </div>
  ),
});
export default MapView;
