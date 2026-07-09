import { BookOpen } from 'lucide-react'
import NavBar from '@/app/components/NavBar'

const SECTIONS = [
  { num: '01', title: 'What the index measures', body: ['The CanPol Index measures local cost of living and housing rent burdens across Canadian federal electoral ridings.', 'By focusing on local-level salaries and rents rather than provincial or national aggregates, it highlights the economic realities faced by residents in different regions.'] },
  { num: '02', title: 'Sourcing Median Income', body: ['Local median individual employment income is sourced directly from Statistics Canada census subdivision logs.', 'These figures are updated to reflect recent estimates, providing an accurate baseline of median gross earnings in each riding.'] },
  { num: '03', title: 'Sourcing Median 1BR Rent', body: ['Monthly rental costs represent the median price of a standard 1BR apartment in the local market.', 'These figures are compiled from the Canada Mortgage and Housing Corporation (CMHC) annual rental market surveys.'] },
  { num: '04', title: 'Rent Burden Calculations', body: ['Rent Burden is calculated as: (Median Monthly 1BR Rent / Median Monthly Gross Income) * 100.', 'This is a currency-neutral percentage that reveals what portion of a median gross paycheck is consumed by housing costs. A burden of 30% or less is generally considered affordable.'] },
  { num: '05', title: 'Disposable Income Calculations', body: ['Disposable Income is computed as: Median Monthly Gross Income - Median Monthly 1BR Rent.', 'This reflects the remaining cash in CAD available to a median individual for all other living expenses (food, taxes, transportation, utilities, and savings).'] },
  { num: '06', title: 'Electoral Riding Mapping', body: ['To project this data onto Canada\'s federal electoral map, census subdivisions (CSDs) and census metropolitan areas (CMAs) are mapped directly to their corresponding riding boundaries.', 'For urban centers with multiple ridings, regional aggregates or weighted averages are applied. The index targets mapping all 343 federal ridings under the 2023 Representation Order.'] },
  { num: '07', title: 'Tax Bracket Pressures', body: ['Combined marginal tax brackets represent the combined federal and provincial income tax rate for the local median income tier.', 'This highlights how regional tax differences affect take-home purchasing power.'] },
  { num: '08', title: 'Infrastructure & Liveability', body: ['Safety, healthcare wait times, and high-speed internet connectivity parameters are included to evaluate regional quality of life.', 'These metrics are sourced from municipal records, provincial health reports, and speed-test aggregates.'] },
  { num: '09', title: 'Limitations', body: ['The index focuses specifically on a single individual earning a median wage and renting a 1BR apartment.', 'It does not replace comprehensive consumer basket surveys or account for households with multiple earners, families with children, or home ownership dynamics.'] },
]

export default function MethodologyPage() {
  return (
    <main style={{ fontFamily: 'var(--font-body)', background: 'var(--color-bg)', minHeight: '100vh', color: 'var(--color-text-1)' }}>
      <NavBar active="methodology" />

      <div style={{ maxWidth: 920, margin: '0 auto', padding: 'clamp(3rem,6vh,5rem) 2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '1.5rem' }}>
          <BookOpen size={14} color="var(--color-accent)" />
          <span style={{ fontSize: 11, letterSpacing: '2.5px', textTransform: 'uppercase', color: 'var(--color-text-3)', fontWeight: 600 }}>Methodology</span>
        </div>

        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(32px, 5vw, 56px)', fontWeight: 400, lineHeight: 1.05, letterSpacing: -1.5, color: 'var(--color-text-1)', margin: '0 0 1.5rem' }}>
          How the CanPol Index<br />is calculated.
        </h1>

        <p style={{ fontSize: 16, color: 'var(--color-text-2)', lineHeight: 1.7, maxWidth: 640, marginBottom: '3.5rem' }}>
          The index maps Statistics Canada income tables and CMHC housing rental databases directly onto Canadian federal ridings to compute rent burden, disposable income, and socio-economic standings.
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
