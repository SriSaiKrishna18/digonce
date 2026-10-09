'use client';

import { useState } from 'react';

interface CheckinFormProps {
  workId: string;
  workTitle: string;
  authToken?: string;
}

export default function CheckinForm({ workId, workTitle, authToken }: CheckinFormProps) {
  const [mode, setMode] = useState<'gps' | 'demo_picker'>('demo_picker');
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);

  async function getGPSLocation() {
    setGpsLoading(true);
    setError(null);
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
        });
      });
      setLat(position.coords.latitude);
      setLng(position.coords.longitude);
      setMode('gps');
    } catch (err: any) {
      setError('Could not get GPS location. Using demo picker instead.');
      setMode('demo_picker');
    } finally {
      setGpsLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (lat === null || lng === null) {
      setError('Please set a location first');
      return;
    }

    setSubmitting(true);
    setError(null);
    setResult(null);

    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }

      const res = await fetch(`/api/works/${workId}/checkins`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ lat, lng, mode, note: note || undefined }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Check-in failed');
        return;
      }

      setResult(data);
    } catch {
      setError('Network error');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-lg mx-auto">
      <h2 className="text-xl font-bold mb-1">Check In</h2>
      <p className="text-sm text-gray-600 mb-4">
        Confirm that work is happening at: <strong>{workTitle}</strong>
      </p>

      {result ? (
        <div className="space-y-4">
          <div className={`p-4 rounded-lg ${result.geofence.valid ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
            <div className="text-lg font-semibold mb-1">
              {result.geofence.valid ? '✅ Valid Check-in!' : '❌ Too far from the work site'}
            </div>
            <p className="text-sm">
              Distance to nearest segment: <strong>{result.geofence.distanceM}m</strong>
              {' '}(threshold: {result.geofence.thresholdM}m)
            </p>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-medium mb-2">Verification Status</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>Valid check-ins: <strong>{result.verification.totalValidCheckins}</strong></div>
              <div>Distinct users: <strong>{result.verification.distinctUsers}</strong></div>
              <div className="col-span-2">
                {result.verification.isVerified ? (
                  <span className="text-green-700 font-medium">🎉 This work is citizen-verified!</span>
                ) : (
                  <span className="text-gray-600">
                    Need {result.verification.requiredUsers - result.verification.distinctUsers} more user(s) for verification
                  </span>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={() => { setResult(null); setLat(null); setLng(null); }}
            className="w-full bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200 transition"
          >
            Submit Another Check-in
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
            <div className="flex gap-2 mb-2">
              <button
                type="button"
                onClick={getGPSLocation}
                disabled={gpsLoading}
                className="flex-1 bg-blue-600 text-white py-2 px-3 rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50 transition"
              >
                {gpsLoading ? '📡 Getting GPS...' : '📍 Use My GPS'}
              </button>
              <button
                type="button"
                onClick={() => {
                  // Demo: set location near Kancheepuram center
                  setLat(12.8342 + (Math.random() - 0.5) * 0.002);
                  setLng(79.7036 + (Math.random() - 0.5) * 0.002);
                  setMode('demo_picker');
                }}
                className="flex-1 bg-gray-100 text-gray-700 py-2 px-3 rounded-lg text-sm hover:bg-gray-200 transition"
              >
                📌 Demo Location
              </button>
            </div>
            {lat !== null && lng !== null && (
              <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                📍 {lat.toFixed(6)}, {lng.toFixed(6)}
                <span className="ml-2 text-gray-400">({mode === 'gps' ? 'GPS' : 'Demo picker'})</span>
              </div>
            )}
          </div>

          {/* Note */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Note (optional)</label>
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              rows={2}
              maxLength={500}
              placeholder="What did you observe at the site?"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || lat === null || lng === null}
            className="w-full bg-orange-600 text-white py-3 rounded-lg font-medium hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {submitting ? 'Submitting...' : 'Submit Check-in'}
          </button>

          <p className="text-xs text-gray-400 text-center">
            {mode === 'demo_picker' && '⚠️ Using simulated location for demo purposes'}
          </p>
        </form>
      )}
    </div>
  );
}
