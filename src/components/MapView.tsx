'use client';

import { useEffect, useRef, useState } from 'react';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

interface MapProps {
  segments?: GeoJSON.FeatureCollection;
  works?: WorkWithSegments[];
  onSegmentClick?: (segmentId: string) => void;
  onWorkClick?: (workId: string) => void;
  center?: [number, number];
  zoom?: number;
  interactive?: boolean;
  onMapClick?: (lngLat: { lng: number; lat: number }) => void;
}

interface WorkWithSegments {
  id: string;
  title: string;
  status: string;
  type: string;
  department_name: string;
  segment_ids: string[];
  start_date: string;
  end_date: string;
}

const STATUS_COLORS: Record<string, string> = {
  planned: '#3B82F6',
  active: '#F59E0B',
  completed: '#10B981',
  delayed: '#EF4444',
  cancelled: '#6B7280',
  none: '#94a3b8',
};

export default function MapView({
  segments,
  works = [],
  onSegmentClick,
  onWorkClick,
  center = [79.7036, 12.8342],
  zoom = 15,
  interactive = true,
  onMapClick,
}: MapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
      center,
      zoom,
      attributionControl: {},
    });

    map.current.addControl(new maplibregl.NavigationControl(), 'top-right');

    map.current.on('load', () => {
      setMapLoaded(true);
    });

    if (onMapClick) {
      map.current.on('click', (e) => {
        onMapClick({ lng: e.lngLat.lng, lat: e.lngLat.lat });
      });
    }

    const resizeObserver = new ResizeObserver(() => {
      if (map.current) {
        map.current.resize();
      }
    });
    resizeObserver.observe(mapContainer.current);

    return () => {
      resizeObserver.disconnect();
      map.current?.remove();
      map.current = null;
    };
  }, []);

  useEffect(() => {
    if (!map.current || !mapLoaded || !segments) return;
    if (!segments.features || segments.features.length === 0) return;

    // Build segment -> work status mapping
    const segmentStatusMap = new Map<string, string>();
    const segmentWorkMap = new Map<string, { id: string; title: string }>();

    const statusPriority: Record<string, number> = {
      delayed: 4, active: 3, planned: 2, completed: 1, cancelled: 0,
    };

    for (const work of works) {
      if (!work.segment_ids) continue;
      for (const segId of work.segment_ids) {
        const current = segmentStatusMap.get(segId);
        if (!current || statusPriority[work.status] > (statusPriority[current] || 0)) {
          segmentStatusMap.set(segId, work.status);
          segmentWorkMap.set(segId, { id: work.id, title: work.title });
        }
      }
    }

    // Color each segment
    const coloredFeatures = segments.features.map(feature => {
      const segId = feature.properties?.id || feature.id;
      const status = segmentStatusMap.get(segId as string) || 'none';
      const workInfo = segmentWorkMap.get(segId as string);
      return {
        ...feature,
        properties: {
          ...feature.properties,
          status,
          color: STATUS_COLORS[status] || STATUS_COLORS.none,
          workId: workInfo?.id || null,
          workTitle: workInfo?.title || null,
        },
      };
    });

    const coloredCollection: GeoJSON.FeatureCollection = {
      type: 'FeatureCollection',
      features: coloredFeatures,
    };

    // Remove existing layers
    if (map.current.getLayer('segments-highlight')) map.current.removeLayer('segments-highlight');
    if (map.current.getLayer('segments-layer')) map.current.removeLayer('segments-layer');
    if (map.current.getSource('segments')) map.current.removeSource('segments');

    map.current.addSource('segments', {
      type: 'geojson',
      data: coloredCollection,
    });

    // Base segment lines — thicker, more visible
    map.current.addLayer({
      id: 'segments-layer',
      type: 'line',
      source: 'segments',
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: {
        'line-color': ['get', 'color'],
        'line-width': 5,
        'line-opacity': 0.85,
      },
    });

    // Hover highlight layer
    map.current.addLayer({
      id: 'segments-highlight',
      type: 'line',
      source: 'segments',
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: {
        'line-color': ['get', 'color'],
        'line-width': 10,
        'line-opacity': 0,
      },
    });

    // Click handler
    map.current.on('click', 'segments-layer', (e) => {
      if (e.features && e.features.length > 0) {
        const feature = e.features[0];
        const workId = feature.properties?.workId;
        const segId = feature.properties?.id;
        if (workId && onWorkClick) onWorkClick(workId);
        else if (segId && onSegmentClick) onSegmentClick(segId);
      }
    });

    // Cursor
    map.current.on('mouseenter', 'segments-layer', () => {
      if (map.current) map.current.getCanvas().style.cursor = 'pointer';
    });
    map.current.on('mouseleave', 'segments-layer', () => {
      if (map.current) map.current.getCanvas().style.cursor = '';
    });

    // Tooltip popup
    const popup = new maplibregl.Popup({ closeButton: false, closeOnClick: false, offset: 10 });
    map.current.on('mousemove', 'segments-layer', (e) => {
      if (e.features && e.features.length > 0 && map.current) {
        const f = e.features[0];
        const name = f.properties?.name || 'Unnamed road';
        const status = f.properties?.status || 'none';
        const workTitle = f.properties?.workTitle;
        const color = STATUS_COLORS[status] || STATUS_COLORS.none;
        let html = `<div style="font-family:DM Sans,system-ui;font-size:12px;line-height:1.4">
          <strong>${name}</strong><br/>
          <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${color};margin-right:4px;vertical-align:middle"></span>
          <span style="color:${color};font-weight:500">${status === 'none' ? 'No active works' : status}</span>`;
        if (workTitle) html += `<br/><span style="color:#666;font-size:11px">${workTitle}</span>`;
        html += `</div>`;
        popup.setLngLat(e.lngLat).setHTML(html).addTo(map.current);

        // Highlight on hover
        map.current.setPaintProperty('segments-highlight', 'line-opacity', [
          'case', ['==', ['get', 'id'], f.properties?.id || ''], 0.4, 0
        ]);
      }
    });
    map.current.on('mouseleave', 'segments-layer', () => {
      popup.remove();
      if (map.current) {
        map.current.setPaintProperty('segments-highlight', 'line-opacity', 0);
      }
    });

    // Auto-fit bounds to segment data
    const bounds = new maplibregl.LngLatBounds();
    let hasCoords = false;
    for (const feat of segments.features) {
      const coords = feat.geometry && 'coordinates' in feat.geometry ? feat.geometry.coordinates : null;
      if (coords && Array.isArray(coords)) {
        for (const c of coords as [number, number][]) {
          if (Array.isArray(c) && c.length >= 2) {
            bounds.extend(c as [number, number]);
            hasCoords = true;
          }
        }
      }
    }
    if (hasCoords) {
      try {
        map.current.fitBounds(bounds, { padding: 40, maxZoom: 16, duration: 800 });
      } catch (err) {
        console.warn('Map fitBounds failed (likely due to zero container size):', err);
      }
    }

  }, [mapLoaded, segments, works]);

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainer} className="w-full h-full" />

      {/* Legend */}
      <div
        className="absolute bottom-4 left-4 rounded-md p-3 text-[11px]"
        style={{
          backgroundColor: 'rgba(255,255,255,0.95)',
          border: '1px solid var(--color-border-default)',
          boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
        }}
      >
        <div className="font-medium mb-1.5" style={{ color: 'var(--color-text-primary)', fontSize: '12px' }}>
          Road Status
        </div>
        {Object.entries(STATUS_COLORS).map(([status, color]) => (
          <div key={status} className="flex items-center gap-2 py-0.5">
            <div className="w-4 h-[3px] rounded-full" style={{ backgroundColor: color }} />
            <span className="capitalize" style={{ color: status === 'none' ? 'var(--color-text-tertiary)' : 'var(--color-text-secondary)' }}>
              {status === 'none' ? 'No works' : status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
