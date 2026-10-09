// DigOnce — Geo Helpers
// Geofence validation using Turf.js

import * as turf from '@turf/turf';

interface LineStringGeometry {
  type: 'LineString';
  coordinates: [number, number][];
}

/**
 * Calculate the distance in meters from a point to the nearest point on a segment polyline.
 * Uses Turf.js nearestPointOnLine.
 */
export function distanceToSegment(
  lat: number,
  lng: number,
  segmentGeometry: LineStringGeometry,
): number {
  const point = turf.point([lng, lat]);
  const line = turf.lineString(segmentGeometry.coordinates);
  const nearest = turf.nearestPointOnLine(line, point, { units: 'meters' });
  return nearest.properties.dist ?? Infinity;
}

/**
 * Check if a location is within the geofence threshold of a segment.
 * Default threshold: 50 meters.
 */
export function isWithinGeofence(
  lat: number,
  lng: number,
  segmentGeometry: LineStringGeometry,
  thresholdMeters: number = 50,
): { valid: boolean; distanceM: number } {
  const distanceM = distanceToSegment(lat, lng, segmentGeometry);
  return {
    valid: distanceM <= thresholdMeters,
    distanceM: Math.round(distanceM * 100) / 100,
  };
}

/**
 * Given multiple segment geometries (for a work that spans multiple segments),
 * find the minimum distance to any segment.
 */
export function minDistanceToSegments(
  lat: number,
  lng: number,
  segmentGeometries: LineStringGeometry[],
): { valid: boolean; distanceM: number; closestSegmentIndex: number } {
  let minDist = Infinity;
  let closestIdx = 0;

  segmentGeometries.forEach((geom, idx) => {
    const dist = distanceToSegment(lat, lng, geom);
    if (dist < minDist) {
      minDist = dist;
      closestIdx = idx;
    }
  });

  return {
    valid: minDist <= 50,
    distanceM: Math.round(minDist * 100) / 100,
    closestSegmentIndex: closestIdx,
  };
}
