import { supabase } from '@/lib/supabase-admin'
import { notFound } from 'next/navigation'
import NavBar from '@/app/components/NavBar'

export const dynamic = 'force-dynamic'

type PageProps = { params: Promise<{ month: string }> }

type CitySnap = {
  city: string; country: string | null; region: string | null; flag: string | null
  price_cad: number | null; median_rent_1br_cad: number | null
  median_monthly_salary_cad: number | null; baseline_entry_count: number | null
  market_entry_count: number | null; data_quality_label: string | null
}

function burdenColor(pct: number) {
  if (pct <= 45) return '#3db870'
  if (pct <= 65) return '#c4890f'
  return '#c04030'
}

function barColor(price: number, max: number) {
  const p = price / max
  if (p < 0.15) return '#34a85a'
  if (p < 0.35) return '#5bbf7a'
  if (p < 0.60) return '#c4890f'
  if (p < 0.82) return '#d9682a'
  return '#b83418'
}

export default async function ReportPage({ params }: PageProps) {
  const { month } = await params

  const { data: report, error } = await supabase
    .from('monthly_reports')
    .select('*')
    .eq('month', month)
    .eq('is_published', true)
    .single()

  if (error || !report) notFound()

  const cities: CitySnap[] = Array.isArray(report.city_snapshot)
    ? report.city_snapshot.sort((a: CitySnap, b: CitySnap) =>
        Number(a.price_cad ?? 0) - Number(b.price_cad ?? 0))
    : []
  const rates: Record<string, number> = report.exchange_rates_snapshot ?? {}
  const maxPrice = cities.reduce((m, c) => Math.max(m, Number(c.price_cad ?? 0)), 0)
  const paragraphs = String(report.analysis).split('\n\n').filter(Boolean)
  const pubDate = new Date(report.published_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })

  const FONT = "'DM Sans', sans-serif"
  const DISP = "'DM Serif Display', serif"

  return (
    <main style={{ fontFamily: FONT, background: 'var(--color-bg)', minHeight: '100vh', color: 'var(--color-text-1)' }}>

      <NavBar active="reports" />

      {/* Header */}
      <section style={{ borderBottom: '0.5px solid var(--color-border)', padding: '3rem 2rem 2.5rem', maxWidth: 1100, margin: '0 auto' }}>
        <a href="/reports" style={{ fontSize: 12, color: 'var(--color-text-3)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 5, marginBottom: '1.5rem' }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15,18 9,12 15,6"/></svg>
          All reports
        </a>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '2rem' }}>
          <div>
            <p style={{ fontSize: 11, letterSpacing: '2.5px', textTransform: 'uppercase', color: 'var(--color-text-3)', margin: '0 0 0.5rem' }}>Fried Rice Index</p>
            <h1 style={{ fontFamily: DISP, fontSize: 'clamp(34px,5vw,56px)', fontWeight: 400, lineHeight: 1, letterSpacing: -1.5, margin: '0 0 0.5rem' }}>
              {report.title}
            </h1>
            {report.subtitle && (
              <p style={{ fontSize: 14, color: 'var(--color-text-3)', margin: '0 0 0.4rem' }}>{report.subtitle}</p>
            )}
            <p style={{ fontSize: 12, color: 'var(--color-text-3)', margin: 0 }}>Published {pubDate}</p>
          </div>
          <div style={{ display: 'flex', gap: '0.65rem' }}>
            <a href={`/api/reports/${report.month}/download`} download style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '.65rem 1.25rem', borderRadius: 8, background: 'var(--color-surface)', border: '0.5px solid var(--color-border)', color: 'var(--color-text-2)', textDecoration: 'none', fontSize: 13 }}>
              Download PDF
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7,10 12,15 17,10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            </a>
          </div>
        </div>

        {/* Key stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px,1fr))', gap: '1px', marginTop: '2.5rem', border: '0.5px solid var(--color-border)', borderRadius: 10, overflow: 'hidden' }}>
          {[
            { label: 'Cities', val: String(report.city_count) },
            { label: 'Cheapest', val: `CA$${Number(report.cheapest_price_cad).toFixed(2)}`, sub: report.cheapest_city },
            { label: 'Most expensive', val: `CA$${Number(report.priciest_price_cad).toFixed(2)}`, sub: report.priciest_city },
            { label: 'Price spread', val: `${report.spread_ratio}×` },
            { label: 'Avg baseline', val: `CA$${Number(report.avg_baseline_cad).toFixed(2)}` },
          ].map(s => (
            <div key={s.label} style={{ background: 'var(--color-surface)', padding: '1rem 1.5rem' }}>
              <p style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '1.3px', color: 'var(--color-text-3)', margin: '0 0 4px' }}>{s.label}</p>
              <p style={{ fontFamily: DISP, fontSize: 22, color: 'var(--color-accent)', margin: '0 0 2px', fontWeight: 400 }}>{s.val}</p>
              {s.sub && <p style={{ fontSize: 11, color: 'var(--color-text-3)', margin: 0 }}>{s.sub}</p>}
            </div>
          ))}
        </div>
      </section>

      {/* Analysis */}
      <section style={{ maxWidth: 720, margin: '0 auto', padding: '3.5rem 2rem' }}>
        {report.new_cities?.length > 0 && (
          <div style={{ marginBottom: '2rem', padding: '1rem 1.5rem', background: 'var(--color-surface)', border: '0.5px solid var(--color-border)', borderRadius: 8 }}>
            <p style={{ fontSize: 10, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--color-accent)', margin: '0 0 6px' }}>New this month</p>
            <p style={{ fontSize: 14, color: 'var(--color-text-1)', margin: 0 }}>{report.new_cities.join(' · ')}</p>
          </div>
        )}

        {paragraphs.map((para, i) => (
          <p key={i} style={{ fontSize: 16, color: i === 0 ? 'var(--color-text-1)' : 'var(--color-text-2)', lineHeight: 1.85, margin: '0 0 1.5rem', fontWeight: i === 0 ? 400 : 400 }}>
            {para}
          </p>
        ))}
      </section>

      {/* Exchange rates */}
      <section style={{ maxWidth: 1100, margin: '0 auto', padding: '0 2rem 3rem' }}>
        <div style={{ borderTop: '0.5px solid var(--color-border)', paddingTop: '2.5rem' }}>
          <p style={{ fontSize: 11, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--color-text-3)', margin: '0 0 1.25rem' }}>
            Exchange rates used — CAD per 1 unit of foreign currency
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem' }}>
            {Object.entries(rates).sort(([a], [b]) => a.localeCompare(b)).map(([cur, rate]) => (
              <div key={cur} style={{ background: 'var(--color-surface)', border: '0.5px solid var(--color-border)', borderRadius: 6, padding: '6px 12px', display: 'flex', gap: 8, alignItems: 'baseline' }}>
                <span style={{ fontSize: 12, color: 'var(--color-text-2)', fontWeight: 500 }}>{cur}</span>
                <span style={{ fontSize: 11, color: 'var(--color-text-3)' }}>{Number(rate).toFixed(4)}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* City data table */}
      <section style={{ maxWidth: 1100, margin: '0 auto', padding: '0 2rem 5rem' }}>
        <div style={{ borderTop: '0.5px solid var(--color-border)', paddingTop: '2.5rem' }}>
          <p style={{ fontSize: 11, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--color-text-3)', margin: '0 0 1.25rem' }}>
            City data snapshot — {report.city_count} cities, ranked cheapest to most expensive
          </p>

          <div style={{ background: 'var(--color-surface)', border: '0.5px solid var(--color-border)', borderRadius: 12, overflow: 'hidden' }}>
            {/* Header */}
            <div style={{ display: 'grid', gridTemplateColumns: '44px 2fr 0.85fr 1.3fr 0.75fr 0.8fr', gap: '0.75rem', padding: '0.7rem 1rem', borderBottom: '0.5px solid var(--color-border)', fontSize: 9, textTransform: 'uppercase', letterSpacing: '1.2px', color: 'var(--color-text-3)' }}>
              <div>#</div><div>City</div><div>Baseline</div><div>Relative</div><div>Rent burden</div><div>Quality</div>
            </div>

            {cities.map((city, index) => {
              const price = Number(city.price_cad ?? 0)
              const rent = Number(city.median_rent_1br_cad ?? 0)
              const salary = Number(city.median_monthly_salary_cad ?? 0)
              const burden = rent && salary ? Math.round((rent / salary) * 100) : null
              const isLast = index === cities.length - 1
              const priciest = cities[cities.length - 1]

              return (
                <div key={city.city} style={{ display: 'grid', gridTemplateColumns: '44px 2fr 0.85fr 1.3fr 0.75fr 0.8fr', gap: '0.75rem', padding: '0.8rem 1rem', borderBottom: isLast ? 'none' : '0.5px solid var(--color-border)', alignItems: 'center' }}>

                  <div style={{ fontSize: 12, color: 'var(--color-text-3)' }}>#{index + 1}</div>

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {city.flag && <span style={{ fontSize: 16, lineHeight: 1 }}>{city.flag}</span>}
                      <span style={{ fontFamily: DISP, fontSize: 17, color: 'var(--color-text-1)', fontWeight: 400 }}>{city.city}</span>
                    </div>
                    <p style={{ fontSize: 11, color: 'var(--color-text-3)', margin: '1px 0 0' }}>
                      {[city.region, city.country].filter(Boolean).join(' · ')}
                    </p>
                  </div>

                  <div style={{ fontFamily: DISP, fontSize: 17, color: 'var(--color-accent)', fontWeight: 400 }}>
                    CA${price.toFixed(2)}
                  </div>

                  <div>
                    <div style={{ height: 3, borderRadius: 2, background: 'var(--color-border)', overflow: 'hidden', maxWidth: 140 }}>
                      <div style={{ height: '100%', width: `${(price / maxPrice) * 100}%`, background: barColor(price, maxPrice), borderRadius: 2 }} />
                    </div>
                    <p style={{ fontSize: 10, color: 'var(--color-text-3)', margin: '3px 0 0' }}>
                      {city.city !== priciest.city && priciest.price_cad
                        ? `${(Number(priciest.price_cad) / price).toFixed(1)}× cheaper than ${priciest.city}` : city.city === priciest.city ? 'Most expensive' : ''}
                    </p>
                  </div>

                  <div>
                    {burden !== null ? (
                      <>
                        <span style={{ fontSize: 13, fontWeight: 500, color: burdenColor(burden) }}>{burden}%</span>
                        <p style={{ fontSize: 10, color: 'var(--color-text-3)', margin: '1px 0 0' }}>of salary</p>
                      </>
                    ) : <span style={{ fontSize: 13, color: 'var(--color-text-4)' }}>—</span>}
                  </div>

                  <div>
                    <span style={{ fontSize: 12, color: 'var(--color-text-2)' }}>{city.data_quality_label ?? '—'}</span>
                    <p style={{ fontSize: 10, color: 'var(--color-text-3)', margin: '1px 0 0' }}>{city.baseline_entry_count ?? '—'} BL</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>
    </main>
  )
}
