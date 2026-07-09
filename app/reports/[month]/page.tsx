import { supabase } from '@/lib/supabase-admin'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import NavBar from '@/app/components/NavBar'

export const dynamic = 'force-dynamic'

type PageProps = { params: Promise<{ month: string }> }

type CitySnap = {
  city: string; country: string | null; region: string | null; flag: string | null
  price_cad: number | null; median_rent_1br_cad: number | null
  median_monthly_salary_cad: number | null; baseline_entry_count: number | null
  market_entry_count: number | null; data_quality_label: string | null
}

const PROVINCE_NAMES: Record<string, string> = {
  ON: 'Ontario', BC: 'British Columbia', QC: 'Quebec', AB: 'Alberta',
  MB: 'Manitoba', SK: 'Saskatchewan', NS: 'Nova Scotia', NB: 'New Brunswick',
  NL: 'Newfoundland & Labrador', PE: 'Prince Edward Island', YT: 'Yukon',
  NT: 'Northwest Territories', NU: 'Nunavut'
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
    ? report.city_snapshot
    : []

  const rates: Record<string, number> = report.exchange_rates_snapshot ?? {}

  // 1. Highest Rent Cities
  const rentCities = [...cities]
    .filter(c => c.median_rent_1br_cad != null && c.median_rent_1br_cad > 0)
    .sort((a, b) => (b.median_rent_1br_cad ?? 0) - (a.median_rent_1br_cad ?? 0))
    .slice(0, 12)

  const maxRent = rentCities.length > 0 ? (rentCities[0].median_rent_1br_cad ?? 1) : 1

  // 2. Highest Rent Burden Cities
  const rentBurden = (city: CitySnap) => {
    if (!city.median_monthly_salary_cad || !city.median_rent_1br_cad) return 0
    return Math.round((city.median_rent_1br_cad / city.median_monthly_salary_cad) * 100)
  }

  const burdenCities = [...cities]
    .filter(c => c.median_monthly_salary_cad != null && c.median_rent_1br_cad != null && c.median_monthly_salary_cad > 0)
    .map(c => ({ ...c, burden: rentBurden(c) }))
    .sort((a, b) => b.burden - a.burden)
    .slice(0, 12)

  const maxBurden = burdenCities.length > 0 ? (burdenCities[0].burden ?? 1) : 1

  // 3. Disposable Income Cities
  const disposableCities = [...cities]
    .filter(c => c.median_monthly_salary_cad != null && c.median_rent_1br_cad != null)
    .map(c => ({ ...c, disposable: (c.median_monthly_salary_cad ?? 0) - (c.median_rent_1br_cad ?? 0) }))
    .sort((a, b) => b.disposable - a.disposable)

  const maxDisposable = disposableCities.length > 0 ? Math.max(...disposableCities.map(c => Math.abs(c.disposable)), 1) : 1

  const paragraphs = String(report.analysis).split('\n\n').filter(Boolean)
  const pubDate = new Date(report.published_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })

  const FONT = 'var(--font-body)'
  const DISP = 'var(--font-display)'

  return (
    <main style={{ fontFamily: FONT, background: 'var(--color-bg)', minHeight: '100vh', color: 'var(--color-text-1)' }}>
      <NavBar active="reports" />

      {/* Header section */}
      <section style={{ borderBottom: '0.5px solid var(--color-border)', padding: '3rem 2rem 2.5rem', maxWidth: 1100, margin: '0 auto' }}>
        <Link href="/reports" style={{ fontSize: 12, color: 'var(--color-text-3)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 5, marginBottom: '1.5rem' }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15,18 9,12 15,6"/></svg>
          All reports
        </Link>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '2rem' }}>
          <div>
            <p style={{ fontSize: 11, letterSpacing: '2.5px', textTransform: 'uppercase', color: 'var(--color-text-3)', margin: '0 0 0.5rem' }}>CanPol Index Report</p>
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
      </section>

      {/* Analysis text */}
      <section style={{ maxWidth: 1100, margin: '0 auto', padding: '3rem 2rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '3rem' }}>
          <div>
            <h2 style={{ fontFamily: DISP, fontSize: 26, margin: '0 0 1.25rem', color: 'var(--color-text-1)', fontWeight: 400 }}>Executive affortability study</h2>
            <div style={{ fontSize: 15, color: 'var(--color-text-2)', lineHeight: 1.7 }}>
              {paragraphs.map((p, idx) => (
                <p key={idx} style={{ margin: '0 0 1rem' }}>{p}</p>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
            {/* Highest Rent list */}
            <div>
              <h3 style={{ fontSize: 11, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--color-accent)', margin: '0 0 1rem', fontWeight: 600 }}>Highest typical monthly rent (1BR)</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {rentCities.map(city => {
                  const rent = city.median_rent_1br_cad ?? 0
                  const pct = (rent / maxRent) * 100
                  return (
                    <div key={city.city} style={{ display: 'grid', gridTemplateColumns: '100px 1fr 70px', gap: 10, alignItems: 'center' }}>
                      <span style={{ fontSize: 12, color: 'var(--color-text-2)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{city.city}</span>
                      <span style={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                        <span style={{ display: 'block', width: `${pct}%`, height: '100%', borderRadius: 3, background: 'var(--color-accent)' }} />
                      </span>
                      <span style={{ fontSize: 12, color: 'var(--color-text-1)', textAlign: 'right', fontWeight: 500 }}>${rent.toLocaleString()}/mo</span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Highest Rent Burden list */}
            <div>
              <h3 style={{ fontSize: 11, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--color-accent)', margin: '0 0 1rem', fontWeight: 600 }}>Highest Rent Burden Share</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {burdenCities.map(city => {
                  const pct = (city.burden / maxBurden) * 100
                  return (
                    <div key={city.city} style={{ display: 'grid', gridTemplateColumns: '100px 1fr 70px', gap: 10, alignItems: 'center' }}>
                      <span style={{ fontSize: 12, color: 'var(--color-text-2)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{city.city}</span>
                      <span style={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                        <span style={{ display: 'block', width: `${pct}%`, height: '100%', borderRadius: 3, background: city.burden > 50 ? 'var(--color-accent)' : 'var(--color-green)' }} />
                      </span>
                      <span style={{ fontSize: 12, color: 'var(--color-text-1)', textAlign: 'right', fontWeight: 500 }}>{city.burden}%</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Disposable Income after Rent */}
      {disposableCities.length > 0 && (
        <section style={{ maxWidth: 1100, margin: '0 auto', padding: '0 2rem 4rem' }}>
          <div style={{ borderTop: '0.5px solid var(--color-border)', paddingTop: '2.5rem' }}>
            <h3 style={{ fontSize: 11, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--color-text-3)', margin: '0 0 0.4rem', fontWeight: 600 }}>
              Monthly Disposable Income After Rent
            </h3>
            <p style={{ fontSize: 12, color: 'var(--color-text-3)', margin: '0 0 1.5rem' }}>
              Remaining monthly wage (salary − rent) in CAD. Negative values indicate rent exceeds the median local salary.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '0.5rem 2.5rem' }}>
              {disposableCities.map(item => {
                const isNeg = item.disposable < 0
                const barWidth = Math.min(Math.abs(item.disposable) / maxDisposable * 100, 100)
                const barColor = isNeg ? 'var(--color-accent)' : 'var(--color-green)'
                return (
                  <div key={item.city} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0', borderBottom: '0.5px solid rgba(255,255,255,0.03)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, width: 120 }}>
                      <span style={{ fontSize: 13 }}>{item.flag ?? '🇨🇦'}</span>
                      <span style={{ fontSize: 12.5, color: 'var(--color-text-2)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{item.city}</span>
                    </div>
                    <div style={{ flex: 1, height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden', margin: '0 12px' }}>
                      <div style={{ width: `${barWidth}%`, height: '100%', borderRadius: 3, background: barColor }} />
                    </div>
                    <span style={{ fontSize: 12.5, color: isNeg ? 'var(--color-accent)' : 'var(--color-text-1)', width: 70, textAlign: 'right', fontWeight: 500 }}>
                      {isNeg ? '-' : ''}${Math.abs(item.disposable).toLocaleString()}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </section>
      )}
    </main>
  )
}
