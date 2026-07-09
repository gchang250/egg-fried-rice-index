import { BookOpen } from 'lucide-react'
import NavBar from '@/app/components/NavBar'

const SECTIONS = [
  {
    num: '01',
    title: 'What the index measures',
    body: [
      'The CanPol Index measures local cost of living and housing rent burdens across Canadian federal electoral ridings.',
      'By focusing on local-level salaries and rents rather than provincial or national aggregates, it highlights the economic realities faced by residents in different regions.',
    ],
  },
  {
    num: '02',
    title: 'Sourcing median income',
    body: [
      'Local median individual employment income is drawn from Statistics Canada census subdivision records. Community-level figures are cross-referenced against the 2021 Census Profile (catalogue 98-316-X) and updated to reflect July 1, 2025 population estimates where applicable.',
      'For ridings that span multiple census subdivisions (CSDs), a population-weighted average of the constituent CSD incomes is used. Urban ridings concentrated in a single CMA use the CMA-level individual income median directly.',
    ],
  },
  {
    num: '03',
    title: 'Sourcing median 1BR rent',
    body: [
      'Monthly rental costs represent the median price of a standard one-bedroom apartment in the local rental market. These figures are compiled from Canada Mortgage and Housing Corporation (CMHC) annual Rental Market Survey data, which surveys purpose-built rental buildings of three or more units in urban centres across Canada.',
      'For smaller communities and rural ridings not covered by CMHC\'s primary survey zones, rent figures are estimated from adjacent CMA data adjusted by regional cost-of-living scaling factors. All rent figures are expressed in nominal CAD.',
    ],
  },
  {
    num: '04',
    title: 'Rent burden calculation',
    body: [
      'Rent Burden = (Median Monthly 1BR Rent ÷ Median Monthly Gross Individual Income) × 100.',
      'This is a currency-neutral percentage revealing what share of a median gross paycheque is consumed by housing costs. A burden at or below 30% is the conventional affordability threshold used by CMHC and Statistics Canada. On the map, ridings shade from green (≤ 30%) through amber to red (> 50%).',
      'Because income is measured gross (before income tax and deductions), the burden figure is a conservative lower bound — net-income burden would be higher in every riding.',
    ],
  },
  {
    num: '05',
    title: 'Disposable income calculation',
    body: [
      'Disposable Income = Median Monthly Gross Individual Income − Median Monthly 1BR Rent.',
      'This reflects the remaining cash available to a median earner after paying rent, expressed in nominal CAD. It approximates what is left for food, transportation, utilities, savings, and income taxes.',
      'Because income tax is not yet deducted at this stage, the disposable income figure overstates true take-home purchasing power. It is most useful as a relative ranking tool — comparing ridings to each other — rather than as a literal household budget projection.',
    ],
  },
  {
    num: '06',
    title: 'Electoral riding mapping',
    body: [
      'Every riding on the map uses the official 2023 Representation Order boundary set: all 343 federal electoral districts as defined for elections held after the 2023 redistribution. Boundary polygons and centroids are sourced from Elections Canada\'s open boundary data via the Represent API (OpenNorth) and compiled into a single TopoJSON asset for fast browser rendering.',
      'Census subdivisions (CSDs) and census metropolitan areas (CMAs) are mapped to their corresponding riding boundaries by centroid proximity using a Haversine-distance nearest-neighbour algorithm. For urban centres where multiple ridings share a single CMA, income and rent statistics are disaggregated to the riding level where sub-CMA data is available; otherwise the CMA aggregate is applied uniformly across the constituent ridings.',
      'Each rendered riding polygon was verified against the official bounding box published by Elections Canada — all 343 match to within a fraction of a degree of longitude and latitude.',
    ],
  },
  {
    num: '07',
    title: 'Tax bracket pressures',
    body: [
      'The combined marginal tax rate displayed per riding represents the total federal and provincial income tax rate applicable to an individual earning the local median income. Federal brackets use the current Canada Revenue Agency schedule; provincial rates use each province\'s published rate schedule for the same tax year.',
      'Because median incomes vary by riding, the effective marginal rate also varies — a riding with a higher median income may fall into a higher combined bracket than an adjacent lower-income riding. This metric highlights how regional wage differences interact with the progressive tax structure to produce different effective purchasing powers.',
    ],
  },
  {
    num: '08',
    title: 'Infrastructure & liveability',
    body: [
      'Safety, healthcare wait-time, and internet-connectivity parameters are included to contextualise the rent burden data with broader liveability signals.',
      'Safety indices are derived from Statistics Canada crime severity index data published at the CMA and police service level. Healthcare wait-time ratings draw from Canadian Institute for Health Information (CIHI) provincial reports on median surgical and emergency wait times. Internet connectivity scores reflect CRTC broadband availability data by province and rural/urban classification.',
      'These liveability metrics are secondary signals intended to enrich the housing-burden comparison, not primary index inputs. They do not affect the rent burden or disposable income calculations.',
    ],
  },
  {
    num: '09',
    title: 'Living profiles',
    body: [
      'A profile toggle on the map recomputes both metrics for two modelled household types. "Single Renter (1BR)" applies the riding\'s median one-bedroom rent and individual income directly — this is the primary index case.',
      '"Family Homeowner" scales housing cost to 1.65× the 1BR rent (a proxy for a larger unit or blended mortgage-equivalent cost) and substitutes a higher professional-tier income where available, or 1.5× the median where it is not. These multipliers are fixed modelling assumptions intended to illustrate relative differences between ridings, not to predict any specific household budget.',
    ],
  },
  {
    num: '10',
    title: 'Address & postal-code search',
    body: [
      'The interactive map accepts a place name or postal code. The query is geocoded through OpenStreetMap\'s Nominatim service into a latitude/longitude coordinate, then matched to the nearest riding by straight-line distance to each riding\'s centroid.',
      'This is a fast approximation, not a legal point-in-boundary lookup. Near irregular or coastal borders it may select an adjacent district. The search is intended for map navigation and exploration, not for officially determining which federal riding a given address belongs to. Elections Canada\'s official voter information service is the authoritative source for that determination.',
    ],
  },
  {
    num: '11',
    title: 'Map colouring & affordability tiers',
    body: [
      'In Housing Burden view, ridings are grouped into four bands: Affordable (≤ 30%), Moderate (31–40%), High (41–50%), and Severe (> 50%). In Political Party view, each riding is coloured by the party of its currently represented member, using official party brand colours.',
      'Both views share the same riding boundaries and can be toggled at any time. The province-level summary panel aggregates its constituent ridings to display a population-weighted average burden and a plurality party assignment.',
    ],
  },
  {
    num: '12',
    title: 'Limitations',
    body: [
      'The index models one narrow situation: a single individual earning the local median gross wage and renting a one-bedroom apartment. It does not capture multi-earner households, families with children, homeownership costs, childcare, or the full consumer basket.',
      'Disposable income is computed before income tax, overstating real take-home income. Address search uses nearest-centroid matching rather than precise point-in-boundary lookup. CMHC survey coverage is strongest for large urban centres; rural riding rent figures involve greater estimation uncertainty.',
      'The index is a comparative analytical tool. All figures should be read as relative rankings between ridings rather than as absolute household budget predictions.',
    ],
  },
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
