export default function BenchmarkPage() {
  return (
    <div className="max-w-4xl mx-auto py-12 px-4 space-y-12" style={{ color: 'var(--color-text-primary)' }}>
      <div>
        <h1 className="text-3xl font-bold mb-4">Engine Benchmark</h1>
        <p className="text-[15px]" style={{ color: 'var(--color-text-secondary)' }}>
          Conflict engine validation against synthetic ground truth. This page outlines the rules, the benchmark performance on our synthetic dataset, and the underlying properties of the detection engine.
        </p>
      </div>

      <section>
        <h2 className="text-[15px] font-semibold mb-4 border-b pb-2 uppercase tracking-wide" style={{ borderColor: 'var(--color-border-default)' }}>Conflict Rules</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-[13px] text-left">
            <thead>
              <tr className="border-b" style={{ borderColor: 'var(--color-border-default)', color: 'var(--color-text-tertiary)' }}>
                <th className="py-2 font-medium">Rule</th>
                <th className="py-2 font-medium">Trigger</th>
                <th className="py-2 font-medium">Severity</th>
                <th className="py-2 font-medium">Output</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b" style={{ borderColor: 'var(--color-border-default)' }}>
                <td className="py-3 font-mono text-[11px]">R1_OVERLAP</td>
                <td className="py-3">Same segment, overlapping date ranges</td>
                <td className="py-3"><span className="px-2 py-0.5 rounded-full text-[11px] font-medium border uppercase" style={{ borderColor: 'var(--color-border-default)', color: 'var(--color-danger)' }}>high</span></td>
                <td className="py-3" style={{ color: 'var(--color-text-secondary)' }}>Names conflicting work and dates</td>
              </tr>
              <tr className="border-b" style={{ borderColor: 'var(--color-border-default)' }}>
                <td className="py-3 font-mono text-[11px]">R2_REPEAT_EXCAVATION</td>
                <td className="py-3">Excavation-type work on a segment resurfaced within moratorium (12 months)</td>
                <td className="py-3"><span className="px-2 py-0.5 rounded-full text-[11px] font-medium border uppercase" style={{ borderColor: 'var(--color-border-default)', color: 'var(--color-danger)' }}>high</span></td>
                <td className="py-3" style={{ color: 'var(--color-text-secondary)' }}>Identifies resurfacing date and moratorium period</td>
              </tr>
              <tr className="border-b" style={{ borderColor: 'var(--color-border-default)' }}>
                <td className="py-3 font-mono text-[11px]">R3_MERGE_OPPORTUNITY</td>
                <td className="py-3">Different department, same segment, gap ≤ 90 days, no overlap</td>
                <td className="py-3"><span className="px-2 py-0.5 rounded-full text-[11px] font-medium border uppercase" style={{ borderColor: 'var(--color-border-default)', color: 'var(--color-success)' }}>info</span></td>
                <td className="py-3" style={{ color: 'var(--color-text-secondary)' }}>Suggests merged work window</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="text-[15px] font-semibold mb-4 border-b pb-2 uppercase tracking-wide" style={{ borderColor: 'var(--color-border-default)' }}>Synthetic Benchmark Results</h2>
        <p className="text-[13px] mb-6" style={{ color: 'var(--color-text-secondary)' }}>
          The synthetic dataset contains 5 schedule overlaps, 4 moratorium violations, 4 merge opportunities, and 6 near-miss negatives.
        </p>

        <blockquote className="pl-4 py-2 border-l-4 text-[13px] italic" style={{ borderColor: 'var(--color-brand-600)', color: 'var(--color-text-secondary)', backgroundColor: 'var(--color-surface-secondary)' }}>
          <strong style={{ color: 'var(--color-text-primary)' }}>Honest framing:</strong> This benchmark validates that the engine correctly
          implements its rules against synthetic ground truth constructed by the same team.
          It does <strong>not</strong> demonstrate real-world detection accuracy. Real-world
          validation would require actual municipal works data with independent labeling.
        </blockquote>
      </section>

      <section>
        <h2 className="text-[15px] font-semibold mb-4 border-b pb-2 uppercase tracking-wide" style={{ borderColor: 'var(--color-border-default)' }}>Unit Tests</h2>
        <p className="text-[13px] mb-3" style={{ color: 'var(--color-text-secondary)' }}>
          The engine has 14 unit tests covering all rules, boundary conditions,
          self-exclusion, multi-segment conflicts, and output determinism.
        </p>
        <div className="p-4 rounded-md font-mono text-[11px] overflow-x-auto" style={{ backgroundColor: '#111827', color: '#10b981' }}>
          <pre>{`$ npm test

 ✓ src/lib/engine/detectConflicts.test.ts (14 tests)

 Test Files  1 passed (1)
      Tests  14 passed (14)`}</pre>
        </div>
      </section>

      <section>
        <h2 className="text-[15px] font-semibold mb-4 border-b pb-2 uppercase tracking-wide" style={{ borderColor: 'var(--color-border-default)' }}>Engine Properties</h2>
        <ul className="space-y-3 text-[13px]">
          <li className="flex items-start gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--color-success)', flexShrink: 0, marginTop: '2px' }}>
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
            <span><strong>Deterministic:</strong> Same inputs always produce the same conflicts in the same order</span>
          </li>
          <li className="flex items-start gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--color-success)', flexShrink: 0, marginTop: '2px' }}>
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
            <span><strong>Explainable:</strong> Every conflict has a plain-language explanation and rule ID</span>
          </li>
          <li className="flex items-start gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--color-success)', flexShrink: 0, marginTop: '2px' }}>
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
            <span><strong>Pure:</strong> No database access — takes works in, returns conflicts out</span>
          </li>
          <li className="flex items-start gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--color-success)', flexShrink: 0, marginTop: '2px' }}>
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
            <span><strong>Tested:</strong> 14 unit tests including boundary conditions and edge cases</span>
          </li>
          <li className="flex items-start gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--color-success)', flexShrink: 0, marginTop: '2px' }}>
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
            <span><strong>Server-validated:</strong> Conflicts are re-checked server-side before saving, never trusting the client</span>
          </li>
        </ul>
      </section>
    </div>
  );
}
