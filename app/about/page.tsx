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
      "Rent values are calculated using a hybrid approach that integrates the most recent Statistics Canada Census figures, CMHC rental market surveys from the nearest polled city, and active listing data to capture the current local housing market. For ridings that do not have their own CMHC surveys or active market listings, we estimate values using the closest surveyed center or the inflation-adjusted Census baseline."
    ],
  },
  {
    title: 'Taxation & disposable income model',
    body: [
      "All median salary figures reported on the website represent gross (before-tax) income. To estimate realistic purchasing power, the index calculates estimated net disposable income by subtracting progressive federal and provincial income taxes, CPP/QPP contributions, and Employment Insurance (EI) deductions.",
      "Note that municipal income taxes do not exist in Canada. Municipal property taxes are property-owner levies generally factored directly into CMHC rents. While we model federal and provincial taxes, other household costs (such as food, transport, and childcare) are not subtracted from disposable income and vary by household."
    ],
  },
  {
    title: 'Index averages vs. general renter statistics',
    body: [
      "You may notice that our calculated average rent burdens (~28% for single individuals and ~23% for families) are lower than some news reports or studies citing average renter burdens of 40% or more. This is due to differences in definitions.",
      "First, our denominator is the median income of all residents (including homeowners and retirees), which is higher than the median income of tenant households specifically. Second, our standard rent burden metric divides rent by gross (pre-tax) income; calculating against net take-home pay yields much higher burdens. Finally, we baseline strictly against 1-bedroom apartments rather than larger, more expensive multi-bedroom rentals."
    ],
  },
]

export default function AboutPage() {
  return (
    <main style={{ fontFamily: 'var(--font-body)', background: 'var(--color-bg)', minHeight: '100vh', color: 'var(--color-text-1)' }}>
      <NavBar active="about" />

      <div style={{ maxWidth: 800, margin: '0 auto', padding: 'clamp(3rem,6vh,5rem) 24px' }}>
        <h1 style={{ fontSize: 'clamp(32px, 4.4vw, 52px)', fontWeight: 600, lineHeight: 1.1, letterSpacing: '-.03em', color: 'var(--color-text-1)', margin: '0 0 1.25rem' }}>
          Local wages, local rents.
        </h1>

        <p style={{ fontSize: 19, color: 'var(--color-text-2)', lineHeight: 1.6, maxWidth: '58ch', marginBottom: '3.5rem' }}>
          The CanPol Index tracks cost of living, regional tax bracket pressure, and housing rent burdens across Canada's geographic federal ridings to study local purchasing power.
        </p>

        {/* Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 1, background: 'var(--color-border)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', marginBottom: '4rem' }}>
          {CARDS.map(card => (
            <div key={card.title} style={{ background: 'var(--color-surface)', padding: '2rem' }}>
              <h2 style={{ fontSize: 20, color: 'var(--color-text-1)', margin: '0 0 .85rem', fontWeight: 600, letterSpacing: '-.015em' }}>{card.title}</h2>
              {card.body.map((p, j) => (
                <p key={j} style={{ fontSize: 15.5, color: 'var(--color-text-2)', lineHeight: 1.7, margin: j < card.body.length - 1 ? '0 0 0.85rem' : 0 }}>{p}</p>
              ))}
            </div>
          ))}
        </div>

        <div style={{ marginBottom: '4rem' }}>
          <h2 style={{ fontSize: 26, color: 'var(--color-text-1)', margin: '0 0 .75rem', fontWeight: 600, letterSpacing: '-.02em' }}>
            What the index measures
          </h2>
          <p style={{ fontSize: 15.5, color: 'var(--color-text-2)', lineHeight: 1.7, marginBottom: '2rem', maxWidth: '58ch' }}>
            The index evaluates local economic realities through three primary, non-overlapping pillars.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
            {[
              ['Housing burden', 'Real Statistics Canada median income compared against rent estimates using a hybrid model of Census data, CMHC nearest-city surveys, and active local listings.'],
              ['Take-home pay', 'Median gross pay is a Statistics Canada figure. "Take-home" and "left after tax & rent" apply an estimate of 2026 federal and provincial income tax, CPP and EI for a single individual — an approximation, not tax advice.'],
              ['Represented party', 'Real Elections Canada results from the 2025 general election: the actual elected candidate and party per riding.'],
              ['Safety quality', 'Real Statistics Canada Crime Severity Index data for safety (applied by nearest surveyed metro).'],
              ['Taxation parameters', 'All salary baselines are gross (before-tax). Net disposable income estimates subtract progressive federal and provincial taxes, CPP/QPP and EI. There is no municipal income tax in Canada; municipal property taxes are property-owner levies factored directly into CMHC rents. Other non-housing household expenses (e.g. utilities, food, transport) are not subtracted.'],
            ].map(([title, body]) => (
              <div key={title} style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: '1.5rem' }}>
                <h3 style={{ fontSize: 16, fontWeight: 600, margin: '0 0 .5rem', color: 'var(--color-text-1)' }}>{title}</h3>
                <p style={{ fontSize: 14, color: 'var(--color-text-2)', lineHeight: 1.6, margin: 0 }}>{body}</p>
              </div>
            ))}
          </div>
        </div>

        <a href="/cities" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '11px 22px', borderRadius: 980, border: '1px solid var(--color-ink)', background: 'var(--color-ink)', color: 'var(--color-ink-fg)', textDecoration: 'none', fontSize: 15, fontWeight: 500 }}>
          Browse ridings
        </a>
      </div>
    </main>
  )
}
