'use client';

import { useEffect, useRef, useState } from 'react';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

interface MapProps {
  segments?: GeoJSON.FeatureCollection;
  works?: WorkWithSegments[];
  onSegmentClick?: (segmentId: string) => void;
  onWorkClick?: (workId: string) => void;
  center?: [number, number]; // [lng, lat]
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
  planned: '#3B82F6',    // blue
  active: '#F59E0B',     // amber
  completed: '#10B981',  // green
  delayed: '#EF4444',    // red
  cancelled: '#6B7280',  // gray
  none: '#9CA3AF',       // light gray (no work)
};

export default function MapView({
  segments,
  works = [],
  onSegmentClick,
  onWorkClick,
  center = [79.7036, 12.8342], // Kancheepuram default
  zoom = 14,
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
      style: 'https://tiles.openfreemap.org/styles/liberty',
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

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, []);

  // Add segments and work coloring when data loads
  useEffect(() => {
    if (!map.current || !mapLoaded || !segments) return;

    // Build a map of segment ID → work status (use highest priority status)
    const segmentStatusMap = new Map<string, string>();
    const segmentWorkMap = new Map<string, string>();

    const statusPriority: Record<string, number> = {
      delayed: 4,
      active: 3,
      planned: 2,
      completed: 1,
      cancelled: 0,
    };

    for (const work of works) {
      for (const segId of work.segment_ids) {
        const current = segmentStatusMap.get(segId);
        if (!current || statusPriority[work.status] > (statusPriority[current] || 0)) {
          segmentStatusMap.set(segId, work.status);
          segmentWorkMap.set(segId, work.id);
        }
      }
    }

    // Color each segment feature
    const coloredFeatures = segments.features.map(feature => {
      const segId = feature.properties?.id || feature.id;
      const status = segmentStatusMap.get(segId as string) || 'none';
      const workId = segmentWorkMap.get(segId as string) || null;
      return {
        ...feature,
        properties: {
          ...feature.properties,
          status,
          color: STATUS_COLORS[status] || STATUS_COLORS.none,
          workId,
        },
      };
    });

    const coloredCollection: GeoJSON.FeatureCollection = {
      type: 'FeatureCollection',
      features: coloredFeatures,
    };

    // Remove existing layer/source if present
    if (map.current.getLayer('segments-layer')) {
      map.current.removeLayer('segments-layer');
    }
    if (map.current.getLayer('segments-highlight')) {
      map.current.removeLayer('segments-highlight');
    }
    if (map.current.getSource('segments')) {
      map.current.removeSource('segments');
    }

    map.current.addSource('segments', {
      type: 'geojson',
      data: coloredCollection,
    });

    map.current.addLayer({
      id: 'segments-layer',
      type: 'line',
      source: 'segments',
      layout: {
        'line-cap': 'round',
        'line-join': 'round',
      },
      paint: {
        'line-color': ['get', 'color'],
        'line-width': 4,
        'line-opacity': 0.8,
      },
    });

    // Highlight on hover
    map.current.addLayer({
      id: 'segments-highlight',
      type: 'line',
      source: 'segments',
      layout: {
        'line-cap': 'round',
        'line-join': 'round',
      },
      paint: {
        'line-color': ['get', 'color'],
        'line-width': 8,
        'line-opacity': 0,
      },
    });

    // Click handler
    map.current.on('click', 'segments-layer', (e) => {
      if (e.features && e.features.length > 0) {
        const feature = e.features[0];
        const segId = feature.properties?.id;
        const workId = feature.properties?.workId;
        if (workId && onWorkClick) {
          onWorkClick(workId);
        } else if (segId && onSegmentClick) {
          onSegmentClick(segId);
        }
      }
    });

    // Cursor change on hover
    map.current.on('mouseenter', 'segments-layer', () => {
      if (map.current) map.current.getCanvas().style.cursor = 'pointer';
    });
    map.current.on('mouseleave', 'segments-layer', () => {
      if (map.current) map.current.getCanvas().style.cursor = '';
    });

    // Popup on hover
    const popup = new maplibregl.Popup({
      closeButton: false,
      closeOnClick: false,
    });

    map.current.on('mousemove', 'segments-layer', (e) => {
      if (e.features && e.features.length > 0 && map.current) {
        const feature = e.features[0];
        const name = feature.properties?.name || 'Unnamed road';
        const status = feature.properties?.status || 'none';
        const html = `
          <div class="text-sm">
            <strong>${name}</strong><br/>
            Status: <span style="color:${STATUS_COLORS[status]}">${status === 'none' ? 'No works' : status}</span>
          </div>
        `;
        popup.setLngLat(e.lngLat).setHTML(html).addTo(map.current);
      }
    });

    map.current.on('mouseleave', 'segments-layer', () => {
      popup.remove();
    });
  }, [mapLoaded, segments, works]);

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainer} className="w-full h-full" />

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur rounded-lg shadow-lg p-3 text-xs">
        <div className="font-semibold mb-1.5">Road Status</div>
        {Object.entries(STATUS_COLORS).filter(([k]) => k !== 'none').map(([status, color]) => (
          <div key={status} className="flex items-center gap-2 py-0.5">
            <div className="w-4 h-1 rounded-full" style={{ backgroundColor: color }} />
            <span className="capitalize">{status}</span>
          </div>
        ))}
        <div className="flex items-center gap-2 py-0.5">
          <div className="w-4 h-1 rounded-full bg-gray-300" />
          <span>No works</span>
        </div>
      </div>
    </div>
  );
}
