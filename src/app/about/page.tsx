import Link from 'next/link';

export default function AboutPage() {
  return (
    <div className="max-w-3xl mx-auto py-12 px-5">
      {/* Hero statement */}
      <div className="mb-12">
        <h1
          className="text-3xl font-bold tracking-tight mb-4"
          style={{ color: 'var(--color-text-primary)', lineHeight: '1.2' }}
        >
          Every year, Indian cities dig the same roads<br />
          <span style={{ color: 'var(--color-brand-600)' }}>three to five times.</span>
        </h1>
        <p className="text-[15px] leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
          Water department lays pipes. Telecom lays fibre. Power buries cables. Roads resurfaces.
          Each department works in isolation, and citizens bear the cost: disrupted traffic,
          wasted public money, and roads that never stay fixed.
        </p>
      </div>

      {/* The cost */}
      <div className="mb-12 py-8 px-6 rounded-md" style={{ backgroundColor: 'var(--color-surface-secondary)', border: '1px solid var(--color-border-default)' }}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
          <div>
            <div className="text-2xl font-bold" style={{ color: 'var(--color-danger)' }}>3&ndash;5x</div>
            <div className="text-[12px] mt-1" style={{ color: 'var(--color-text-secondary)' }}>
              The same road excavated per year in metro cities
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold" style={{ color: 'var(--color-danger)' }}>40%</div>
            <div className="text-[12px] mt-1" style={{ color: 'var(--color-text-secondary)' }}>
              Of road maintenance budget wasted on re-excavation
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold" style={{ color: 'var(--color-danger)' }}>0</div>
            <div className="text-[12px] mt-1" style={{ color: 'var(--color-text-secondary)' }}>
              Shared coordination systems between most departments
            </div>
          </div>
        </div>
        <p className="text-[11px] mt-4 text-center" style={{ color: 'var(--color-text-tertiary)' }}>
          Figures are representative estimates from municipal reports and news coverage, not from a controlled study.
        </p>
      </div>

      {/* What DigOnce does */}
      <div className="mb-12">
        <h2 className="text-[13px] font-medium mb-6" style={{ color: 'var(--color-text-tertiary)', letterSpacing: '0.04em' }}>
          WHAT DIGONCE DOES
        </h2>

        <div className="space-y-6">
          {[
            {
              title: 'Detects conflicts before ground is broken',
              desc: 'When a department registers new work, the engine checks all existing and planned works on the same road segments. Three rules fire: schedule overlap (blocking), moratorium violation (blocking), and merge opportunity (advisory).',
              ruleId: 'R1 + R2 + R3',
            },
            {
              title: 'Shows every excavation on one map',
              desc: 'All public works are plotted on a shared map using real road geometry from OpenStreetMap. Color-coded by status. Click any segment to see what is happening, who is responsible, and when.',
              ruleId: 'Map view',
            },
            {
              title: 'Holds departments accountable for delays',
              desc: 'Every delay must be recorded with a reason code. The delay ledger is public. Citizens can check in at work sites to verify activity. Three distinct citizen check-ins marks a work as community-verified.',
              ruleId: 'Transparency',
            },
            {
              title: 'Suggests merged work windows',
              desc: 'When two departments plan work on the same road within 90 days, the engine suggests combining them into a single excavation window. One dig instead of two.',
              ruleId: 'R3',
            },
          ].map((item) => (
            <div key={item.title} className="flex gap-4">
              <div
                className="flex-shrink-0 w-1 rounded-full"
                style={{ backgroundColor: 'var(--color-brand-500)' }}
              />
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-[14px] font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                    {item.title}
                  </h3>
                  <span
                    className="data-label px-1.5 py-0.5 rounded"
                    style={{ backgroundColor: 'var(--color-surface-secondary)', color: 'var(--color-text-tertiary)' }}
                  >
                    {item.ruleId}
                  </span>
                </div>
                <p className="text-[13px] leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                  {item.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Engine properties */}
      <div className="mb-12">
        <h2 className="text-[13px] font-medium mb-4" style={{ color: 'var(--color-text-tertiary)', letterSpacing: '0.04em' }}>
          ENGINE PROPERTIES
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Deterministic', desc: 'Same inputs, same output, always' },
            { label: 'Explainable', desc: 'Every conflict has a plain-language reason' },
            { label: 'Pure', desc: 'No database access in the engine' },
            { label: 'Tested', desc: '14 unit tests, all passing' },
          ].map((p) => (
            <div key={p.label} className="py-3 px-4 rounded-md" style={{ border: '1px solid var(--color-border-default)' }}>
              <div className="text-[13px] font-medium mb-0.5" style={{ color: 'var(--color-text-primary)' }}>{p.label}</div>
              <div className="text-[11px]" style={{ color: 'var(--color-text-tertiary)' }}>{p.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Honest framing */}
      <div
        className="mb-12 py-4 px-5 rounded-md"
        style={{ borderLeft: '3px solid var(--color-brand-500)', backgroundColor: 'var(--color-brand-50)' }}
      >
        <h3 className="text-[13px] font-semibold mb-1" style={{ color: 'var(--color-text-primary)' }}>
          Honest framing
        </h3>
        <p className="text-[13px] leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
          This is a 24-hour prototype built for Bits and Bytes 2026. The conflict rules are validated
          against synthetic ground truth, not real municipal data. The statistics above are representative
          estimates, not from a controlled study. Real-world deployment would require integration with
          actual department workflows, approval chains, and municipal IT systems.
        </p>
      </div>

      {/* CTA */}
      <div className="flex gap-3">
        <Link
          href="/"
          className="px-5 py-2.5 rounded-md text-[14px] font-medium transition-opacity hover:opacity-85"
          style={{ backgroundColor: 'var(--color-brand-600)', color: 'white' }}
        >
          View the map
        </Link>
        <Link
          href="/benchmark"
          className="nav-link px-5 py-2.5 rounded-md text-[14px] font-medium"
          style={{ border: '1px solid var(--color-border-default)' }}
        >
          Engine benchmark
        </Link>
        <Link
          href="/dept"
          className="nav-link px-5 py-2.5 rounded-md text-[14px] font-medium"
          style={{ border: '1px solid var(--color-border-default)' }}
        >
          Department portal
        </Link>
      </div>
    </div>
  );
}
