import { supabase } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

type Report = {
  month: string
  title: string
  subtitle: string | null
  city_count: number
  new_cities: string[]
  analysis: string
  cheapest_city: string | null
  cheapest_price_cad: number | null
  priciest_city: string | null
  priciest_price_cad: number | null
  spread_ratio: number | null
  published_at: string
}

function fmt(n: number | null) {
  if (!n) return '—'
  return `CA$${n.toFixed(2)}`
}

function excerpt(text: string, len = 220) {
  return text.length <= len ? text : text.slice(0, len).trimEnd() + '…'
}

export default async function ReportsPage() {
  const { data, error } = await supabase
    .from('monthly_reports')
    .select('month,title,subtitle,city_count,new_cities,analysis,cheapest_city,cheapest_price_cad,priciest_city,priciest_price_cad,spread_ratio,published_at')
    .eq('is_published', true)
    .order('month', { ascending: false })

  const reports = error ? [] : (data ?? []) as Report[]

  const FONT = "'DM Sans', sans-serif"
  const DISP = "'DM Serif Display', serif"

  return (
    <main style={{ fontFamily: FONT, background: 'var(--color-bg)', minHeight: '100vh', color: 'var(--color-text-1)' }}>

      <nav style={{ position: 'sticky', top: 0, zIndex: 50, height: 52, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 2rem', background: 'rgba(9,13,10,.92)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', borderBottom: '0.5px solid var(--color-border)' }}>
        <a href="/" style={{ fontFamily: DISP, fontSize: 16, fontStyle: 'italic', letterSpacing: -.2, color: 'var(--color-text-1)', textDecoration: 'none' }}>
          fried rice <span style={{ color: 'var(--color-accent)', fontStyle: 'normal' }}>index</span>
        </a>
        <div style={{ display: 'flex', gap: '1.75rem' }}>
          {[['cities', '/cities'], ['reports', '/reports'], ['submit', '/submit'], ['about', '/about'], ['methodology', '/methodology']].map(([l, h]) => (
            <a key={h} href={h} style={{ fontSize: 13, textDecoration: 'none', color: l === 'reports' ? 'var(--color-text-1)' : 'var(--color-text-3)', borderBottom: l === 'reports' ? '0.5px solid var(--color-accent)' : 'none', paddingBottom: l === 'reports' ? 1 : 0 }}>{l}</a>
          ))}
        </div>
      </nav>

      <section style={{ maxWidth: 1100, margin: '0 auto', padding: '3rem 2rem 5rem' }}>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '0.75rem' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/></svg>
          <span style={{ fontSize: 11, letterSpacing: '2.5px', textTransform: 'uppercase', color: 'var(--color-text-3)' }}>Monthly Reports</span>
        </div>

        <h1 style={{ fontFamily: DISP, fontSize: 44, fontWeight: 400, lineHeight: 1.05, letterSpacing: -1, margin: '0 0 0.75rem', color: 'var(--color-text-1)' }}>
          Index reports.
        </h1>
        <p style={{ fontSize: 15, color: 'var(--color-text-2)', lineHeight: 1.65, maxWidth: 540, margin: '0 0 3rem' }}>
          Monthly snapshots of all city data — with exchange rates, full baselines, and written analysis. Published on the first Monday of each month. Five new cities added monthly from July 2026.
        </p>

        {reports.length === 0 ? (
          <p style={{ color: 'var(--color-text-3)', fontSize: 14 }}>No reports published yet.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', border: '0.5px solid var(--color-border)', borderRadius: 12, overflow: 'hidden' }}>
            {reports.map((r, i) => {
              const date = new Date(r.published_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
              const isLast = i === reports.length - 1
              return (
                <div key={r.month} style={{ background: 'var(--color-surface)', padding: '2rem', borderBottom: isLast ? 'none' : '0.5px solid var(--color-border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '2rem', flexWrap: 'wrap' }}>

                    <div style={{ flex: 1, minWidth: 280 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '0.6rem' }}>
                        <span style={{ fontFamily: DISP, fontSize: 22, color: 'var(--color-text-1)', fontWeight: 400 }}>{r.title}</span>
                        {r.subtitle && (
                          <span style={{ fontSize: 11, color: 'var(--color-text-3)', border: '0.5px solid var(--color-border)', borderRadius: 4, padding: '2px 7px' }}>{r.subtitle}</span>
                        )}
                      </div>
                      <p style={{ fontSize: 12, color: 'var(--color-text-3)', margin: '0 0 1rem' }}>Published {date}</p>
                      <p style={{ fontSize: 13, color: 'var(--color-text-2)', lineHeight: 1.7, margin: '0 0 1.25rem', maxWidth: 540 }}>
                        {excerpt(r.analysis)}
                      </p>

                      <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                        <div>
                          <p style={{ fontSize: 9, letterSpacing: '1.3px', textTransform: 'uppercase', color: 'var(--color-text-3)', margin: '0 0 3px' }}>Cities</p>
                          <p style={{ fontFamily: DISP, fontSize: 20, color: 'var(--color-text-1)', margin: 0, fontWeight: 400 }}>{r.city_count}</p>
                        </div>
                        <div>
                          <p style={{ fontSize: 9, letterSpacing: '1.3px', textTransform: 'uppercase', color: 'var(--color-text-3)', margin: '0 0 3px' }}>Cheapest</p>
                          <p style={{ fontFamily: DISP, fontSize: 20, color: '#3db870', margin: 0, fontWeight: 400 }}>{fmt(r.cheapest_price_cad)}</p>
                        </div>
                        <div>
                          <p style={{ fontSize: 9, letterSpacing: '1.3px', textTransform: 'uppercase', color: 'var(--color-text-3)', margin: '0 0 3px' }}>Priciest</p>
                          <p style={{ fontFamily: DISP, fontSize: 20, color: 'var(--color-text-1)', margin: 0, fontWeight: 400 }}>{fmt(r.priciest_price_cad)}</p>
                        </div>
                        <div>
                          <p style={{ fontSize: 9, letterSpacing: '1.3px', textTransform: 'uppercase', color: 'var(--color-text-3)', margin: '0 0 3px' }}>Spread</p>
                          <p style={{ fontFamily: DISP, fontSize: 20, color: 'var(--color-accent)', margin: 0, fontWeight: 400 }}>{r.spread_ratio}×</p>
                        </div>
                        {r.new_cities.length > 0 && (
                          <div>
                            <p style={{ fontSize: 9, letterSpacing: '1.3px', textTransform: 'uppercase', color: 'var(--color-text-3)', margin: '0 0 3px' }}>New cities</p>
                            <p style={{ fontSize: 13, color: 'var(--color-text-2)', margin: 0 }}>{r.new_cities.join(', ')}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', flexShrink: 0 }}>
                      <a href={`/reports/${r.month}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '.65rem 1.25rem', borderRadius: 8, background: 'var(--color-accent)', color: '#fff', textDecoration: 'none', fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap' }}>
                        Read report
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9,18 15,12 9,6"/></svg>
                      </a>
                      <a href={`/api/reports/${r.month}/download`} download style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '.65rem 1.25rem', borderRadius: 8, border: '0.5px solid var(--color-border)', color: 'var(--color-text-2)', textDecoration: 'none', fontSize: 13, whiteSpace: 'nowrap', background: 'var(--color-bg)' }}>
                        Download CSV
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7,10 12,15 17,10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                      </a>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        <div style={{ marginTop: '4rem', paddingTop: '2rem', borderTop: '0.5px solid var(--color-border)' }}>
          <p style={{ fontSize: 12, color: 'var(--color-text-3)', lineHeight: 1.7, maxWidth: 480 }}>
            Reports include a full data snapshot as of publication date, exchange rates used for that month's calculations, and a written analysis of notable findings. CSV downloads contain all city data, restaurant-level entries, and rate documentation.
          </p>
        </div>
      </section>
    </main>
  )
}
