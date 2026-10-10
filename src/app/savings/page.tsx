import { createServerClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function SavingsPage() {
  const supabase = await createServerClient();
  const { data: works } = await supabase.from('works').select('id, title, type, status, start_date, end_date, department_id, work_segments(segment_id), departments(name)');

  let mergeOpportunities = 0;
  let totalSavingsLakhs = 0;
  let daysDisruptionAvoided = 0;
  let co2SavedTonnes = 0;

  const segmentToWorks = new Map();
  if (works) {
    works.forEach(work => {
      // Handle the case where work_segments is an array of objects
      const segments = Array.isArray(work.work_segments) ? work.work_segments : [work.work_segments].filter(Boolean);
      segments.forEach((ws: any) => {
        const segId = ws.segment_id;
        if (!segmentToWorks.has(segId)) {
          segmentToWorks.set(segId, []);
        }
        segmentToWorks.get(segId).push(work);
      });
    });
  }

  const opportunitiesList: any[] = [];
  const processedPairs = new Set();

  segmentToWorks.forEach((segmentWorks, segId) => {
    for (let i = 0; i < segmentWorks.length; i++) {
      for (let j = i + 1; j < segmentWorks.length; j++) {
        const w1 = segmentWorks[i];
        const w2 = segmentWorks[j];
        if (w1.department_id !== w2.department_id) {
          const d1 = new Date(w1.start_date);
          const d2 = new Date(w2.start_date);
          const diffDays = Math.abs((d1.getTime() - d2.getTime()) / (1000 * 3600 * 24));
          if (diffDays <= 90) {
            const pairId = [w1.id, w2.id].sort().join('-');
            if (!processedPairs.has(pairId)) {
              processedPairs.add(pairId);
              mergeOpportunities++;
              // 8 lakhs/km (excavation) + 3 lakhs/km (resurfacing) = 11 lakhs/km. 200m = 0.2km => 2.2 lakhs.
              const savings = 2.2;
              totalSavingsLakhs += savings;
              daysDisruptionAvoided += 15;
              co2SavedTonnes += 2.5;

              opportunitiesList.push({
                w1,
                w2,
                segId,
                savings,
                diffDays: Math.round(diffDays)
              });
            }
          }
        }
      }
    }
  });

  return (
    <div className="max-w-6xl mx-auto px-5 py-10" style={{ fontFamily: 'var(--font-dm-sans)' }}>
      <div className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight mb-2" style={{ color: 'var(--color-text-primary)' }}>Cost Savings Estimate</h1>
        <p className="text-[15px]" style={{ color: 'var(--color-text-secondary)' }}>What coordinated planning could save this municipality</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="p-6 rounded-lg" style={{ backgroundColor: 'var(--color-surface-secondary)', border: '1px solid var(--color-border-default)' }}>
          <div className="text-[13px] font-medium mb-2 uppercase tracking-wider" style={{ color: 'var(--color-text-tertiary)' }}>Total Savings</div>
          <div className="text-4xl font-semibold font-mono" style={{ color: 'var(--color-brand-600)' }}>₹{totalSavingsLakhs.toFixed(2)} lakhs</div>
        </div>
        <div className="p-6 rounded-lg" style={{ backgroundColor: 'var(--color-surface-secondary)', border: '1px solid var(--color-border-default)' }}>
          <div className="text-[13px] font-medium mb-2 uppercase tracking-wider" style={{ color: 'var(--color-text-tertiary)' }}>Disruption Avoided</div>
          <div className="text-4xl font-semibold font-mono" style={{ color: 'var(--color-brand-600)' }}>{daysDisruptionAvoided} days</div>
        </div>
        <div className="p-6 rounded-lg" style={{ backgroundColor: 'var(--color-surface-secondary)', border: '1px solid var(--color-border-default)' }}>
          <div className="text-[13px] font-medium mb-2 uppercase tracking-wider" style={{ color: 'var(--color-text-tertiary)' }}>CO2 Reduced</div>
          <div className="text-4xl font-semibold font-mono" style={{ color: 'var(--color-brand-600)' }}>{co2SavedTonnes.toFixed(1)} tonnes</div>
        </div>
      </div>

      <div className="mb-10">
        <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--color-text-primary)' }}>Detected Merge Opportunities</h2>
        <div className="overflow-x-auto rounded-lg" style={{ border: '1px solid var(--color-border-default)' }}>
          <table className="w-full text-left border-collapse text-[13px]">
            <thead>
              <tr style={{ backgroundColor: 'var(--color-surface-secondary)', borderBottom: '1px solid var(--color-border-default)' }}>
                <th className="px-4 py-3 font-medium text-gray-500">Segment ID</th>
                <th className="px-4 py-3 font-medium text-gray-500">Work 1</th>
                <th className="px-4 py-3 font-medium text-gray-500">Work 2</th>
                <th className="px-4 py-3 font-medium text-gray-500">Gap (Days)</th>
                <th className="px-4 py-3 font-medium text-gray-500 text-right">Est. Savings</th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {opportunitiesList.map((opp, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid var(--color-border-default)' }}>
                  <td className="px-4 py-3 font-mono">{opp.segId}</td>
                  <td className="px-4 py-3">
                    <div className="font-medium" style={{ color: 'var(--color-text-primary)' }}>{opp.w1.title}</div>
                    <div style={{ color: 'var(--color-text-tertiary)' }}>{opp.w1.departments?.name}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium" style={{ color: 'var(--color-text-primary)' }}>{opp.w2.title}</div>
                    <div style={{ color: 'var(--color-text-tertiary)' }}>{opp.w2.departments?.name}</div>
                  </td>
                  <td className="px-4 py-3 font-mono">{opp.diffDays}</td>
                  <td className="px-4 py-3 font-mono text-right" style={{ color: 'var(--color-brand-600)' }}>₹{opp.savings.toFixed(1)}L</td>
                </tr>
              ))}
              {opportunitiesList.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center" style={{ color: 'var(--color-text-tertiary)' }}>
                    No merge opportunities detected within a 90-day window.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="p-4 rounded-md text-[13px]" style={{ backgroundColor: 'var(--color-surface-secondary)', borderLeft: '4px solid var(--color-border-default)', color: 'var(--color-text-secondary)' }}>
        <strong>Note:</strong> These estimates use simplified cost models. Real savings depend on road width, depth, traffic volume, and local contractor rates.
      </div>
    </div>
  );
}
