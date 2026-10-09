export default function BenchmarkPage() {
  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-2">🔬 Engine Benchmark</h1>
      <p className="text-gray-600 mb-6">
        Conflict engine validation against synthetic ground truth.
      </p>

      {/* Engine rules */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Conflict Rules</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-700">Rule</th>
                <th className="px-4 py-3 text-left font-medium text-gray-700">Trigger</th>
                <th className="px-4 py-3 text-left font-medium text-gray-700">Severity</th>
                <th className="px-4 py-3 text-left font-medium text-gray-700">Output</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              <tr>
                <td className="px-4 py-3 font-mono text-xs">R1_OVERLAP</td>
                <td className="px-4 py-3">Same segment, overlapping date ranges</td>
                <td className="px-4 py-3"><span className="bg-red-100 text-red-700 px-2 py-0.5 rounded-full text-xs">high</span></td>
                <td className="px-4 py-3 text-gray-600">Names conflicting work and dates</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-mono text-xs">R2_REPEAT_EXCAVATION</td>
                <td className="px-4 py-3">Excavation-type work on a segment resurfaced within moratorium (12 months)</td>
                <td className="px-4 py-3"><span className="bg-red-100 text-red-700 px-2 py-0.5 rounded-full text-xs">high</span></td>
                <td className="px-4 py-3 text-gray-600">Identifies resurfacing date and moratorium period</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-mono text-xs">R3_MERGE_OPPORTUNITY</td>
                <td className="px-4 py-3">Different department, same segment, gap ≤ 90 days, no overlap</td>
                <td className="px-4 py-3"><span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs">info</span></td>
                <td className="px-4 py-3 text-gray-600">Suggests merged work window</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Synthetic benchmark */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Synthetic Benchmark Results</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="bg-red-50 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-red-700">5</div>
            <div className="text-xs text-red-600">R1 Overlaps Planted</div>
          </div>
          <div className="bg-red-50 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-red-700">4</div>
            <div className="text-xs text-red-600">R2 Moratorium Violations</div>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-blue-700">4</div>
            <div className="text-xs text-blue-600">R3 Merge Opportunities</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-green-700">6</div>
            <div className="text-xs text-green-600">Near-Miss Negatives</div>
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm">
          <strong>Honest framing:</strong> This benchmark validates that the engine correctly
          implements its rules against synthetic ground truth constructed by the same team.
          It does <strong>not</strong> demonstrate real-world detection accuracy. Real-world
          validation would require actual municipal works data with independent labeling.
        </div>
      </div>

      {/* Unit tests */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Unit Tests</h2>
        <p className="text-sm text-gray-600 mb-3">
          The engine has 14 unit tests covering all rules, boundary conditions,
          self-exclusion, multi-segment conflicts, and output determinism.
        </p>
        <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-xs overflow-x-auto">
          <pre>{`$ npm test

 ✓ src/lib/engine/detectConflicts.test.ts (14 tests)

 Test Files  1 passed (1)
      Tests  14 passed (14)`}</pre>
        </div>
      </div>

      {/* Engine properties */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Engine Properties</h2>
        <ul className="space-y-2 text-sm text-gray-700">
          <li className="flex items-start gap-2">
            <span className="text-green-600">✓</span>
            <span><strong>Deterministic:</strong> Same inputs always produce the same conflicts in the same order</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-600">✓</span>
            <span><strong>Explainable:</strong> Every conflict has a plain-language explanation and rule ID</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-600">✓</span>
            <span><strong>Pure:</strong> No database access — takes works in, returns conflicts out</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-600">✓</span>
            <span><strong>Tested:</strong> 14 unit tests including boundary conditions and edge cases</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-600">✓</span>
            <span><strong>Server-validated:</strong> Conflicts are re-checked server-side before saving, never trusting the client</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
