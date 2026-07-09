import { Info, ArrowRight } from 'lucide-react'
import NavBar from '@/app/components/NavBar'

const CARDS = [
  {
    title: 'Why this exists',
    body: [
      "Cost of living is often described through abstract national macroeconomic metrics: CPI, average wage baskets, or national housing reports. While valuable, these national figures hide significant local realities.",
      "The CanPol Index evaluates these pressures at the level of individual communities and federal ridings. By comparing local median wages against CMHC rental data, we highlight the true socio-economic pressures that citizens face in their daily lives."
    ],
  },
  {
    title: 'What the index does',
    body: [
      "It compiles median 1BR rental costs and median individual monthly salaries directly for major communities representing Canada's federal ridings.",
      "By calculating the exact Rent Burden (the percentage of local wages spent on a single housing unit), the index provides a pure, currency-neutral indicator of regional affordability and discretionary purchasing power."
    ],
  },
  {
    title: 'Sourcing & Rigor',
    body: [
      "The index does not use speculative estimates or ad-hoc data. All values are sourced directly from Statistics Canada census logs, Canada Mortgage and Housing Corporation (CMHC) market profiles, and official provincial tax schedules.",
      "Liveability indicators (safety, healthcare wait times, internet speeds) are pulled from standardized community surveys to ensure consistent comparative integrity."
    ],
  },
  {
    title: 'Where the project is going',
    body: [
      "The CanPol Index is expanding to map cost of living and tax pressures across all 343 Canadian federal electoral ridings under the 2023 Representation Order.",
      "Our goal is to build a completely open-source, community-audited economic atlas that provides voters and researchers with local economic clarity."
    ],
  },
]

export default function AboutPage() {
  return (
    <main style={{ fontFamily: 'var(--font-body)', background: 'var(--color-bg)', minHeight: '100vh', color: 'var(--color-text-1)' }}>
      <NavBar active="about" />

      <div style={{ maxWidth: 860, margin: '0 auto', padding: 'clamp(3rem,6vh,5rem) 2rem' }}>
        {/* Eyebrow */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '1.5rem' }}>
          <Info size={14} color="var(--color-accent)" />
          <span style={{ fontSize: 11, letterSpacing: '2.5px', textTransform: 'uppercase', color: 'var(--color-text-3)', fontWeight: 600 }}>About</span>
        </div>

        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(32px, 5vw, 56px)', fontWeight: 400, lineHeight: 1.05, letterSpacing: -1.5, color: 'var(--color-text-1)', margin: '0 0 1.5rem' }}>
          Local wages, local rents.<br />Socio-economic clarity across Canadian ridings.
        </h1>

        <p style={{ fontSize: 16, color: 'var(--color-text-2)', lineHeight: 1.7, maxWidth: 640, marginBottom: '3.5rem' }}>
          The CanPol Index tracks cost of living, regional tax bracket pressure, and housing rent burdens across Canada's geographic federal ridings to study local purchasing power.
        </p>

        {/* Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', border: '0.5px solid var(--color-border)', borderRadius: 12, overflow: 'hidden', marginBottom: '3rem' }}>
          {CARDS.map((card, i) => (
            <div key={card.title} style={{ background: 'var(--color-surface)', padding: '2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '1rem' }}>
                <span style={{ fontSize: 11, color: 'var(--color-text-3)', fontVariantNumeric: 'tabular-nums', fontFamily: 'var(--font-mono)' }}>0{i + 1}</span>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, color: 'var(--color-text-1)', margin: 0, fontWeight: 400 }}>{card.title}</h2>
              </div>
              {card.body.map((p, j) => (
                <p key={j} style={{ fontSize: 15, color: 'var(--color-text-2)', lineHeight: 1.75, margin: j < card.body.length - 1 ? '0 0 0.85rem' : 0 }}>{p}</p>
              ))}
            </div>
          ))}
        </div>

        {/* The Pillars of CanPol Index */}
        <div style={{ marginTop: '4rem', marginBottom: '4rem' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 28, color: 'var(--color-text-1)', marginBottom: '1.5rem', fontWeight: 400 }}>
            The Core Index Pillars
          </h2>
          <p style={{ fontSize: 15, color: 'var(--color-text-2)', lineHeight: 1.7, marginBottom: '2rem' }}>
            The index evaluates local economic realities through three primary, non-overlapping pillars:
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem' }}>
            <div style={{ background: 'var(--color-surface)', border: '0.5px solid var(--color-border)', borderRadius: 12, padding: '1.5rem' }}>
              <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: '0.5rem', color: 'var(--color-accent)' }}>01. Housing Burden</h3>
              <p style={{ fontSize: 13, color: 'var(--color-text-2)', lineHeight: 1.6, margin: 0 }}>
                Compares local median gross wages to median 1BR rental costs. Sourced directly from CMHC housing market reports.
              </p>
            </div>
            <div style={{ background: 'var(--color-surface)', border: '0.5px solid var(--color-border)', borderRadius: 12, padding: '1.5rem' }}>
              <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: '0.5rem', color: 'var(--color-accent)' }}>02. Income & Taxes</h3>
              <p style={{ fontSize: 13, color: 'var(--color-text-2)', lineHeight: 1.6, margin: 0 }}>
                Maps local median wages and provincial marginal combined tax rates, highlighting regional taxation differences.
              </p>
            </div>
            <div style={{ background: 'var(--color-surface)', border: '0.5px solid var(--color-border)', borderRadius: 12, padding: '1.5rem' }}>
              <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: '0.5rem', color: 'var(--color-accent)' }}>03. Infrastructure Quality</h3>
              <p style={{ fontSize: 13, color: 'var(--color-text-2)', lineHeight: 1.6, margin: 0 }}>
                Evaluates liveability factors including safety indices, average healthcare wait times, and high-speed internet connectivity.
              </p>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <a href="/methodology" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '.7rem 1.4rem', borderRadius: 8, background: 'var(--color-accent)', color: '#fff', textDecoration: 'none', fontSize: 14, fontWeight: 600 }}>
            Read the methodology <ArrowRight size={14} />
          </a>
          <a href="/cities" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '.7rem 1.4rem', borderRadius: 8, border: '0.5px solid var(--color-border)', color: 'var(--color-text-2)', textDecoration: 'none', fontSize: 14, fontWeight: 600, background: 'rgba(255,255,255,0.02)' }}>
            Browse ridings
          </a>
        </div>
      </div>
    </main>
  )
}
