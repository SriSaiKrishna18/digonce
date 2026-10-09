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
    } catch {
      setError('Could not get GPS location.');
      setMode('demo_picker');
    } finally {
      setGpsLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (lat === null || lng === null) {
      setError('Set a location first.');
      return;
    }
    setSubmitting(true);
    setError(null);
    setResult(null);
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (authToken) headers['Authorization'] = `Bearer ${authToken}`;
      const res = await fetch(`/api/works/${workId}/checkins`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ lat, lng, mode, note: note || undefined }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Check-in failed'); return; }
      setResult(data);
    } catch {
      setError('Network error');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-md mx-auto">
      <h2
        className="text-lg font-semibold tracking-tight mb-1"
        style={{ color: 'var(--color-text-primary)' }}
      >
        Check In
      </h2>
      <p className="text-[13px] mb-6" style={{ color: 'var(--color-text-secondary)' }}>
        Confirm activity at: <strong>{workTitle}</strong>
      </p>

      {result ? (
        <div className="space-y-4">
          {/* Geofence result */}
          <div
            className="rounded-md px-4 py-3"
            style={{
              border: `1px solid ${result.geofence.valid ? '#bbf7d0' : '#fecaca'}`,
              backgroundColor: result.geofence.valid ? 'var(--color-success-bg)' : 'var(--color-danger-bg)',
            }}
          >
            <div className="flex items-center gap-2 mb-1">
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: result.geofence.valid ? 'var(--color-success)' : 'var(--color-danger)' }}
              />
              <span
                className="text-[14px] font-medium"
                style={{ color: result.geofence.valid ? 'var(--color-success)' : 'var(--color-danger)' }}
              >
                {result.geofence.valid ? 'Valid check-in' : 'Outside geofence'}
              </span>
            </div>
            <p className="text-[12px]" style={{ color: 'var(--color-text-secondary)' }}>
              Distance: <span className="font-mono">{result.geofence.distanceM}m</span>
              {' · '}Threshold: <span className="font-mono">{result.geofence.thresholdM}m</span>
            </p>
          </div>

          {/* Verification status */}
          <div
            className="rounded-md px-4 py-3"
            style={{ border: '1px solid var(--color-border-default)', backgroundColor: 'var(--color-surface-secondary)' }}
          >
            <div className="text-[12px] font-medium mb-2" style={{ color: 'var(--color-text-tertiary)', letterSpacing: '0.04em' }}>
              VERIFICATION STATUS
            </div>
            <div className="grid grid-cols-2 gap-2 text-[13px]" style={{ color: 'var(--color-text-primary)' }}>
              <div>Valid check-ins: <span className="font-mono font-medium">{result.verification.totalValidCheckins}</span></div>
              <div>Distinct users: <span className="font-mono font-medium">{result.verification.distinctUsers}</span></div>
            </div>
            <p className="text-[12px] mt-2" style={{ color: result.verification.isVerified ? 'var(--color-success)' : 'var(--color-text-tertiary)' }}>
              {result.verification.isVerified
                ? 'This work is citizen-verified.'
                : `${result.verification.requiredUsers - result.verification.distinctUsers} more user(s) needed for verification.`
              }
            </p>
          </div>

          <button
            onClick={() => { setResult(null); setLat(null); setLng(null); }}
            className="w-full py-2.5 rounded-md text-[13px] font-medium transition-colors"
            style={{
              border: '1px solid var(--color-border-default)',
              color: 'var(--color-text-secondary)',
              backgroundColor: 'transparent',
            }}
          >
            Submit another check-in
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Location */}
          <div>
            <label className="block text-[12px] font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>
              Location
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={getGPSLocation}
                disabled={gpsLoading}
                className="py-2.5 rounded-md text-[13px] font-medium transition-opacity hover:opacity-85 disabled:opacity-50"
                style={{
                  backgroundColor: 'var(--color-surface-inverse)',
                  color: 'var(--color-text-inverse)',
                }}
              >
                {gpsLoading ? 'Getting GPS…' : 'Use GPS'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setLat(12.8342 + (Math.random() - 0.5) * 0.002);
                  setLng(79.7036 + (Math.random() - 0.5) * 0.002);
                  setMode('demo_picker');
                }}
                className="py-2.5 rounded-md text-[13px] font-medium transition-colors"
                style={{
                  border: '1px solid var(--color-border-default)',
                  color: 'var(--color-text-secondary)',
                  backgroundColor: 'transparent',
                }}
              >
                Demo location
              </button>
            </div>
            {lat !== null && lng !== null && (
              <div
                className="mt-2 px-3 py-2 rounded-md text-[11px] font-mono"
                style={{ backgroundColor: 'var(--color-surface-secondary)', color: 'var(--color-text-tertiary)' }}
              >
                {lat.toFixed(6)}, {lng.toFixed(6)} · {mode === 'gps' ? 'GPS' : 'Demo'}
              </div>
            )}
          </div>

          {/* Note */}
          <div>
            <label className="block text-[12px] font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
              Note <span className="font-normal" style={{ color: 'var(--color-text-tertiary)' }}>optional</span>
            </label>
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              rows={2}
              maxLength={500}
              placeholder="What did you observe?"
              className="w-full px-3 py-2.5 text-[13px] rounded-md resize-y"
              style={{
                border: '1px solid var(--color-border-default)',
                backgroundColor: 'var(--color-surface-secondary)',
                color: 'var(--color-text-primary)',
              }}
            />
          </div>

          {error && (
            <div
              className="px-4 py-3 rounded-md text-[13px]"
              style={{ backgroundColor: 'var(--color-danger-bg)', color: 'var(--color-danger)', border: '1px solid #fecaca' }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || lat === null || lng === null}
            className="w-full py-3 rounded-md text-[14px] font-medium transition-opacity disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90"
            style={{ backgroundColor: 'var(--color-brand-600)', color: 'white' }}
          >
            {submitting ? 'Submitting…' : 'Submit Check-in'}
          </button>

          {mode === 'demo_picker' && lat !== null && (
            <p className="text-[11px] text-center" style={{ color: 'var(--color-text-tertiary)' }}>
              Using simulated location for demo purposes.
            </p>
          )}
        </form>
      )}
    </div>
  );
}
