import { BookOpen } from 'lucide-react'
import NavBar from '@/app/components/NavBar'

const SECTIONS = [
  { num: '01', title: 'What the index measures', body: ['CanPol Index compares local rent against local income across all 343 Canadian federal ridings. Rent burden is the share of monthly income a one-bedroom rental consumes. Disposable income is what is left over after paying that rent.'] },
  { num: '02', title: "What's real", body: ['Riding boundaries and centroids come from Elections Canada. Median income comes from Statistics Canada\'s 2021 Census Profile, tabulated at the exact riding level. Represented party, population, and registered electors come from Elections Canada\'s official 2025 election results. Rent is CMHC\'s 2025 survey data, applied by each riding\'s nearest surveyed metro area (CMHC does not survey every riding individually). The safety score is Statistics Canada\'s Crime Severity Index, also applied by nearest surveyed area.'] },
  { num: '03', title: "What's still estimated", body: ['Healthcare wait times and internet speed have no real per-riding source yet and remain illustrative. French-language share and the tax-bracket label are rough, zone-level estimates rather than riding-specific measurements.'] },
  { num: '04', title: 'How the numbers work', body: ['Rent burden = monthly rent ÷ monthly income. Disposable income = monthly income minus monthly rent. Income is gross (before tax), so disposable income runs a bit high, best read as a relative comparison between ridings rather than an exact budget.', 'The Family Homeowner profile scales rent to 1.65x and swaps in median employment income instead of total income, a modelling assumption, not a separate measurement.'] },
  { num: '05', title: 'Limitations', body: ['The index models one situation: a single earner renting a one-bedroom unit. It doesn\'t capture families, multiple earners, or ownership costs. Rent is assigned by nearest surveyed metro rather than measured per riding, and address search matches to the nearest riding centroid rather than an exact legal boundary.'] },
]

export default function MethodologyPage() {
  return (
    <main style={{ fontFamily: 'var(--font-body)', background: 'var(--color-bg)', minHeight: '100vh', color: 'var(--color-text-1)' }}>
      <NavBar active="methodology" />

      <div style={{ maxWidth: 820, margin: '0 auto', padding: 'clamp(3rem,6vh,5rem) 2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '1.5rem' }}>
          <BookOpen size={14} color="var(--color-accent)" />
          <span style={{ fontSize: 11, letterSpacing: '2.5px', textTransform: 'uppercase', color: 'var(--color-text-3)', fontWeight: 600 }}>Methodology</span>
        </div>

        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(32px, 5vw, 56px)', fontWeight: 400, lineHeight: 1.05, letterSpacing: -1.5, color: 'var(--color-text-1)', margin: '0 0 1.5rem' }}>
          How the CanPol Index<br />is calculated.
        </h1>

        <p style={{ fontSize: 16, color: 'var(--color-text-2)', lineHeight: 1.7, maxWidth: 620, marginBottom: '3.5rem' }}>
          Boundaries, income, rent, represented party, population, and safety are real government data. Healthcare wait times and internet speed are still estimates.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', border: '0.5px solid var(--color-border)', borderRadius: 12, overflow: 'hidden' }}>
          {SECTIONS.map(s => (
            <div key={s.num} style={{ background: 'var(--color-surface)', padding: '1.75rem 2rem', display: 'flex', gap: '1.5rem' }}>
              <span style={{ fontSize: 11, color: 'var(--color-text-3)', fontVariantNumeric: 'tabular-nums', flexShrink: 0, paddingTop: 3, fontFamily: 'var(--font-mono)' }}>{s.num}</span>
              <div>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 20, color: 'var(--color-text-1)', margin: '0 0 0.75rem', fontWeight: 400 }}>{s.title}</h2>
                {s.body.map((p, i) => (
                  <p key={i} style={{ fontSize: 14, color: 'var(--color-text-2)', lineHeight: 1.75, margin: i < s.body.length - 1 ? '0 0 0.7rem' : 0 }}>{p}</p>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
