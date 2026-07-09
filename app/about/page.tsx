import { Info, ArrowRight } from 'lucide-react'
import NavBar from '@/app/components/NavBar'

const CARDS = [
  {
    title: 'Why this exists',
    body: [
      "Cost of living is often described through abstract national macroeconomic metrics: CPI, average wage baskets, or national housing reports. While valuable, these national figures hide significant local realities.",
      "The CanPol Index evaluates these pressures at the level of individual federal ridings instead of provincial or national averages, to illustrate how differently housing burden can land depending on where you live."
    ],
  },
  {
    title: 'What the index does',
    body: [
      "For all 343 federal ridings, it compares a real median 1BR rental cost against each riding's real median individual monthly income.",
      "By calculating the resulting Rent Burden (the percentage of income spent on a single housing unit), the index provides a currency-neutral view of relative regional affordability and discretionary purchasing power."
    ],
  },
  {
    title: 'Data status',
    body: [
      "Riding boundaries, median income, represented party, population, registered electors, and the safety score are all real, sourced government data from Elections Canada and Statistics Canada.",
      "Rent is real CMHC 2025 survey data applied by nearest surveyed metro, since CMHC surveys metro areas rather than individual ridings. Healthcare-wait and internet-speed figures remain synthetic, see the methodology page for the full breakdown."
    ],
  },
  {
    title: 'Where the project is going',
    body: [
      "All 343 Canadian federal electoral ridings under the 2023 Representation Order are mapped with real boundaries, real income, real rent, real 2025 election results, and a real safety score.",
      "The next step is finding a real per-riding source for the two indicators still synthetic: healthcare wait times and internet speed."
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
            The index evaluates local economic realities through three primary, non-overlapping pillars.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem' }}>
            <div style={{ background: 'var(--color-surface)', border: '0.5px solid var(--color-border)', borderRadius: 12, padding: '1.5rem' }}>
              <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: '0.5rem', color: 'var(--color-accent)' }}>01. Housing Burden</h3>
              <p style={{ fontSize: 13, color: 'var(--color-text-2)', lineHeight: 1.6, margin: 0 }}>
                Real Statistics Canada median income compared against real CMHC 1BR rent (applied by nearest surveyed metro).
              </p>
            </div>
            <div style={{ background: 'var(--color-surface)', border: '0.5px solid var(--color-border)', borderRadius: 12, padding: '1.5rem' }}>
              <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: '0.5rem', color: 'var(--color-accent)' }}>02. Represented Party</h3>
              <p style={{ fontSize: 13, color: 'var(--color-text-2)', lineHeight: 1.6, margin: 0 }}>
                Real Elections Canada results from the 2025 general election: the actual elected candidate and party per riding.
              </p>
            </div>
            <div style={{ background: 'var(--color-surface)', border: '0.5px solid var(--color-border)', borderRadius: 12, padding: '1.5rem' }}>
              <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: '0.5rem', color: 'var(--color-accent)' }}>03. Infrastructure Quality</h3>
              <p style={{ fontSize: 13, color: 'var(--color-text-2)', lineHeight: 1.6, margin: 0 }}>
                Real Statistics Canada crime severity data for safety. Healthcare wait times and internet connectivity are still modelled, pending a real per-riding source.
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
