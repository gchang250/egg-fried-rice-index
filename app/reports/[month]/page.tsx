import { supabase } from '@/lib/supabase-admin'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import NavBar from '@/app/components/NavBar'
import {
  distributionStats,
  money,
  num,
  percentileRank,
  rentBurden,
  validPositive,
} from '@/lib/report-stats'

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

function legendColor(label: string) {
  if (label === 'Low quartile') return '#3db870'
  if (label === 'High quartile') return '#b83418'
  if (label === 'Mean marker') return 'var(--color-text-1)'
  if (label === 'IQR band') return '#e8d8bf'
  return 'var(--color-accent)'
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
  const baselinePrices = validPositive(cities.map((city) => city.price_cad))
  const rentBurdens = cities
    .map((city) => rentBurden(city))
    .filter((burden): burden is number => burden !== null && Number.isFinite(burden))
  const entryCounts = validPositive(cities.map((city) => city.market_entry_count ?? city.baseline_entry_count))
  const priceStats = distributionStats(baselinePrices)
  const burdenStats = distributionStats(rentBurdens)
  const entryStats = distributionStats(entryCounts)
  const topCities = [...cities]
    .filter((city) => Number(city.price_cad ?? 0) > 0)
    .slice(-12)
    .reverse()
  const statRows: Array<[string, string, string, string]> = [
    ['Sample size', String(priceStats.count), String(burdenStats.count), String(entryStats.count)],
    ['Mean', money(priceStats.mean), `${num(burdenStats.mean, 1)}%`, num(entryStats.mean, 1)],
    ['Median', money(priceStats.median), `${num(burdenStats.median, 1)}%`, num(entryStats.median, 1)],
    ['Min / max', `${money(priceStats.min)} / ${money(priceStats.max)}`, `${num(burdenStats.min, 1)}% / ${num(burdenStats.max, 1)}%`, `${num(entryStats.min, 0)} / ${num(entryStats.max, 0)}`],
    ['Range', money(priceStats.range), `${num(burdenStats.range, 1)} pts`, num(entryStats.range, 0)],
    ['Std dev', money(priceStats.stdDevSample), `${num(burdenStats.stdDevSample, 1)} pts`, num(entryStats.stdDevSample, 1)],
    ['Variance', num(priceStats.varianceSample, 3), num(burdenStats.varianceSample, 3), num(entryStats.varianceSample, 3)],
    ['Std error', money(priceStats.standardError), `${num(burdenStats.standardError, 1)} pts`, num(entryStats.standardError, 1)],
    ['Coefficient var.', `${num((priceStats.coefficientOfVariation ?? 0) * 100, 1)}%`, `${num((burdenStats.coefficientOfVariation ?? 0) * 100, 1)}%`, `${num((entryStats.coefficientOfVariation ?? 0) * 100, 1)}%`],
    ['Q1 / Q3', `${money(priceStats.q1)} / ${money(priceStats.q3)}`, `${num(burdenStats.q1, 1)}% / ${num(burdenStats.q3, 1)}%`, `${num(entryStats.q1, 1)} / ${num(entryStats.q3, 1)}`],
    ['IQR', money(priceStats.iqr), `${num(burdenStats.iqr, 1)} pts`, num(entryStats.iqr, 1)],
    ['P10 / P90', `${money(priceStats.p10)} / ${money(priceStats.p90)}`, `${num(burdenStats.p10, 1)}% / ${num(burdenStats.p90, 1)}%`, `${num(entryStats.p10, 1)} / ${num(entryStats.p90, 1)}`],
    ['P95', money(priceStats.p95), `${num(burdenStats.p95, 1)}%`, num(entryStats.p95, 1)],
    ['MAD', money(priceStats.mad), `${num(burdenStats.mad, 1)} pts`, num(entryStats.mad, 1)],
    ['Skewness', num(priceStats.skewness, 3), num(burdenStats.skewness, 3), num(entryStats.skewness, 3)],
    ['Excess kurtosis', num(priceStats.excessKurtosis, 3), num(burdenStats.excessKurtosis, 3), num(entryStats.excessKurtosis, 3)],
    ['5% trimmed mean', money(priceStats.trimmedMean5), `${num(burdenStats.trimmedMean5, 1)}%`, num(entryStats.trimmedMean5, 1)],
    ['95% CI', `${money(priceStats.ci95Low)} - ${money(priceStats.ci95High)}`, `${num(burdenStats.ci95Low, 1)}% - ${num(burdenStats.ci95High, 1)}%`, `${num(entryStats.ci95Low, 1)} - ${num(entryStats.ci95High, 1)}`],
    ['Outlier fences', `${money(priceStats.lowerOutlierFence)} / ${money(priceStats.upperOutlierFence)}`, `${num(burdenStats.lowerOutlierFence, 1)}% / ${num(burdenStats.upperOutlierFence, 1)}%`, `${num(entryStats.lowerOutlierFence, 1)} / ${num(entryStats.upperOutlierFence, 1)}`],
    ['Outlier count', String(priceStats.outlierCount), String(burdenStats.outlierCount), String(entryStats.outlierCount)],
  ]
  const distMin = priceStats.min ?? 0
  const distMax = priceStats.max ?? 1
  const distSpan = Math.max(distMax - distMin, 1)
  const distPos = (value: number | null) => value === null ? 0 : Math.max(0, Math.min(100, ((value - distMin) / distSpan) * 100))
  const q1Pos = distPos(priceStats.q1)
  const q3Pos = distPos(priceStats.q3)
  const medianPos = distPos(priceStats.median)
  const meanPos = distPos(priceStats.mean)
  const paragraphs = String(report.analysis).split('\n\n').filter(Boolean)
  const pubDate = new Date(report.published_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })

  const HIST_BINS = [
    { lo: 0,  hi: 3,        label: '0–3' },
    { lo: 3,  hi: 6,        label: '3–6' },
    { lo: 6,  hi: 9,        label: '6–9' },
    { lo: 9,  hi: 12,       label: '9–12' },
    { lo: 12, hi: 15,       label: '12–15' },
    { lo: 15, hi: 18,       label: '15–18' },
    { lo: 18, hi: 21,       label: '18–21' },
    { lo: 21, hi: Infinity, label: '21+' },
  ]
  const histBins = HIST_BINS.map(b => ({
    ...b,
    count: baselinePrices.filter(p => p >= b.lo && p < b.hi).length,
  }))
  const histMax = Math.max(...histBins.map(b => b.count), 1)

  const burdenByCity = cities
    .map(city => {
      const burden = rentBurden(city)
      return burden !== null ? { city: city.city, flag: city.flag, burden } : null
    })
    .filter((x): x is { city: string; flag: string | null; burden: number } => x !== null)
    .sort((a, b) => b.burden - a.burden)

  const regionPriceMap = new Map<string, number[]>()
  for (const city of cities) {
    if (!city.region || !city.price_cad) continue
    const arr = regionPriceMap.get(city.region) ?? []
    arr.push(Number(city.price_cad))
    regionPriceMap.set(city.region, arr)
  }
  const regionStats = [...regionPriceMap.entries()]
    .map(([name, prices]) => {
      const sorted = [...prices].sort((a, b) => a - b)
      const mid = Math.floor(sorted.length / 2)
      const med = sorted.length % 2 === 1 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
      return { name, count: sorted.length, min: sorted[0], max: sorted[sorted.length - 1], median: med }
    })
    .sort((a, b) => a.median - b.median)
  const regionMaxPrice = Math.max(...regionStats.map(r => r.max), 1)

  const FONT = "'DM Sans', sans-serif"
  const DISP = "'DM Serif Display', serif"

  return (
    <main style={{ fontFamily: FONT, background: 'var(--color-bg)', minHeight: '100vh', color: 'var(--color-text-1)' }}>

      <NavBar active="reports" />

      {/* Header */}
      <section style={{ borderBottom: '0.5px solid var(--color-border)', padding: '3rem 2rem 2.5rem', maxWidth: 1100, margin: '0 auto' }}>
        <Link href="/reports" style={{ fontSize: 12, color: 'var(--color-text-3)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 5, marginBottom: '1.5rem' }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15,18 9,12 15,6"/></svg>
          All reports
        </Link>

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

      {/* Visual analysis */}
      <section style={{ maxWidth: 1100, margin: '0 auto', padding: '0 2rem 3rem' }}>
        <div style={{ borderTop: '0.5px solid var(--color-border)', paddingTop: '2.5rem' }}>
          <p style={{ fontSize: 11, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--color-text-3)', margin: '0 0 1.25rem' }}>
            Visual analysis — distribution, legend, and price rank
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.8rem', marginBottom: '1.5rem' }}>
            {['Low quartile', 'Middle 50%', 'High quartile', 'Mean marker', 'IQR band'].map((label) => (
              <div key={label} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 11, color: 'var(--color-text-3)' }}>
                <span style={{ width: 10, height: 10, borderRadius: 2, background: legendColor(label), display: 'inline-block', border: label === 'Mean marker' ? '0.5px solid var(--color-border)' : 'none' }} />
                {label}
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(320px,1fr))', gap: '1.5rem', alignItems: 'start' }}>
            <div style={{ minWidth: 0 }}>
              <p style={{ fontSize: 10, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--color-accent)', margin: '0 0 1rem' }}>Baseline distribution</p>
              <div style={{ position: 'relative', height: 90, margin: '0 0 0.75rem' }}>
                <div style={{ position: 'absolute', left: 0, right: 0, top: 38, height: 7, borderRadius: 4, background: 'var(--color-border)' }} />
                <div style={{ position: 'absolute', left: `${q1Pos}%`, width: `${Math.max(q3Pos - q1Pos, 1)}%`, top: 31, height: 21, borderRadius: 4, background: '#e8d8bf' }} />
                <div style={{ position: 'absolute', left: `${medianPos}%`, top: 20, bottom: 22, width: 2, background: 'var(--color-accent)' }} />
                <div style={{ position: 'absolute', left: `${meanPos}%`, top: 20, bottom: 22, width: 1, background: 'var(--color-text-1)' }} />
                <div style={{ position: 'absolute', left: 0, bottom: 0, fontSize: 11, color: 'var(--color-text-3)' }}>{money(distMin)}</div>
                <div style={{ position: 'absolute', right: 0, bottom: 0, fontSize: 11, color: 'var(--color-text-3)' }}>{money(distMax)}</div>
                <div style={{ position: 'absolute', left: `max(0px, min(calc(${medianPos}% - 44px), calc(100% - 88px)))`, top: 0, width: 88, textAlign: 'center', fontSize: 11, color: 'var(--color-accent)' }}>Median {money(priceStats.median)}</div>
                <div style={{ position: 'absolute', left: `max(0px, min(calc(${meanPos}% - 36px), calc(100% - 72px)))`, top: 58, width: 72, textAlign: 'center', fontSize: 11, color: 'var(--color-text-2)' }}>Mean {money(priceStats.mean)}</div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,minmax(0,1fr))', gap: '1px', border: '0.5px solid var(--color-border)', borderRadius: 8, overflow: 'hidden' }}>
                {[
                  ['Q1', money(priceStats.q1)],
                  ['Q3', money(priceStats.q3)],
                  ['IQR', money(priceStats.iqr)],
                  ['Outliers', String(priceStats.outlierCount)],
                ].map(([label, value]) => (
                  <div key={label} style={{ background: 'var(--color-surface)', padding: '0.85rem' }}>
                    <p style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '1.2px', color: 'var(--color-text-3)', margin: '0 0 4px' }}>{label}</p>
                    <p style={{ fontFamily: DISP, fontSize: 18, color: 'var(--color-text-1)', margin: 0, fontWeight: 400 }}>{value}</p>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ minWidth: 0 }}>
              <p style={{ fontSize: 10, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--color-accent)', margin: '0 0 1rem' }}>Priciest baseline cities</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {topCities.map((city) => {
                  const price = Number(city.price_cad ?? 0)
                  const pct = maxPrice > 0 ? (price / maxPrice) * 100 : 0
                  return (
                    <div key={city.city} style={{ display: 'grid', gridTemplateColumns: '92px 1fr 62px', gap: 10, alignItems: 'center' }}>
                      <span style={{ fontSize: 11, color: 'var(--color-text-2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{city.city}</span>
                      <span style={{ height: 7, borderRadius: 4, background: 'var(--color-border)', overflow: 'hidden' }}>
                        <span style={{ display: 'block', width: `${pct}%`, height: '100%', borderRadius: 4, background: barColor(price, maxPrice) }} />
                      </span>
                      <span style={{ fontSize: 11, color: 'var(--color-accent)', textAlign: 'right' }}>CA${price.toFixed(2)}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Price histogram */}
      <section style={{ maxWidth: 1100, margin: '0 auto', padding: '0 2rem 3rem' }}>
        <div style={{ borderTop: '0.5px solid var(--color-border)', paddingTop: '2.5rem' }}>
          <p style={{ fontSize: 11, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--color-text-3)', margin: '0 0 1.25rem' }}>
            Price distribution histogram — cities per CA$3 bracket
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', alignItems: 'start' }}>
            <div style={{ minWidth: 0 }}>
              <p style={{ fontSize: 10, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--color-accent)', margin: '0 0 1rem' }}>Cities by baseline price range</p>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 110, marginBottom: 4 }}>
                {histBins.map((bin) => (
                  <div key={bin.label} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end', gap: 3 }}>
                    <span style={{ fontSize: 11, color: 'var(--color-text-3)', lineHeight: 1 }}>{bin.count > 0 ? bin.count : ''}</span>
                    <div style={{ width: '100%', height: `${(bin.count / histMax) * 82}px`, background: bin.count > 0 ? 'var(--color-accent)' : 'transparent', borderRadius: '2px 2px 0 0', minHeight: bin.count > 0 ? 3 : 0 }} />
                  </div>
                ))}
              </div>
              <div style={{ height: 1, background: 'var(--color-border)', marginBottom: 6 }} />
              <div style={{ display: 'flex', gap: 4 }}>
                {histBins.map((bin) => (
                  <div key={bin.label} style={{ flex: 1, textAlign: 'center', fontSize: 9, color: 'var(--color-text-3)', lineHeight: 1.3 }}>{bin.label}</div>
                ))}
              </div>
              <p style={{ fontSize: 10, color: 'var(--color-text-4, var(--color-text-3))', margin: '6px 0 0', opacity: 0.7 }}>CA$ per bowl</p>
            </div>
            <div style={{ minWidth: 0 }}>
              <p style={{ fontSize: 10, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--color-accent)', margin: '0 0 1rem' }}>Non-empty brackets</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1px', border: '0.5px solid var(--color-border)', borderRadius: 8, overflow: 'hidden' }}>
                {histBins.filter(b => b.count > 0).map((bin) => (
                  <div key={bin.label} style={{ background: 'var(--color-surface)', padding: '0.75rem 0.9rem' }}>
                    <p style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '1.2px', color: 'var(--color-text-3)', margin: '0 0 3px' }}>CA${bin.label}</p>
                    <p style={{ fontFamily: DISP, fontSize: 22, color: 'var(--color-accent)', margin: '0 0 1px', fontWeight: 400 }}>{bin.count}</p>
                    <p style={{ fontSize: 10, color: 'var(--color-text-3)', margin: 0 }}>{bin.count === 1 ? 'city' : 'cities'}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Rent burden */}
      {burdenByCity.length > 0 && (
        <section style={{ maxWidth: 1100, margin: '0 auto', padding: '0 2rem 3rem' }}>
          <div style={{ borderTop: '0.5px solid var(--color-border)', paddingTop: '2.5rem' }}>
            <p style={{ fontSize: 11, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--color-text-3)', margin: '0 0 0.4rem' }}>
              Rent burden — monthly rent as % of median salary
            </p>
            <p style={{ fontSize: 12, color: 'var(--color-text-3)', margin: '0 0 1.5rem' }}>
              {burdenByCity.length} cities with data · sorted highest to lowest
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '0.35rem 2.5rem' }}>
              {burdenByCity.map((item) => (
                <div key={item.city} style={{ display: 'grid', gridTemplateColumns: '96px 1fr 50px', gap: 8, alignItems: 'center' }}>
                  <span style={{ fontSize: 11, color: 'var(--color-text-2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.flag} {item.city}
                  </span>
                  <span style={{ height: 6, borderRadius: 3, background: 'var(--color-border)', overflow: 'hidden', display: 'block' }}>
                    <span style={{ display: 'block', width: `${Math.min(item.burden, 100)}%`, height: '100%', borderRadius: 3, background: burdenColor(item.burden) }} />
                  </span>
                  <span style={{ fontSize: 11, color: burdenColor(item.burden), textAlign: 'right', fontWeight: 500 }}>{Math.round(item.burden)}%</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Regional breakdown */}
      {regionStats.length > 0 && (
        <section style={{ maxWidth: 1100, margin: '0 auto', padding: '0 2rem 3rem' }}>
          <div style={{ borderTop: '0.5px solid var(--color-border)', paddingTop: '2.5rem' }}>
            <p style={{ fontSize: 11, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--color-text-3)', margin: '0 0 1.25rem' }}>
              Regional breakdown — baseline price range by region
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1px', background: 'var(--color-border)', border: '0.5px solid var(--color-border)', borderRadius: 10, overflow: 'hidden' }}>
              {regionStats.map((region) => (
                <div key={region.name} style={{ background: 'var(--color-surface)', padding: '1rem 1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.65rem' }}>
                    <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--color-text-1)' }}>{region.name}</span>
                    <span style={{ fontSize: 10, color: 'var(--color-text-3)' }}>{region.count} {region.count === 1 ? 'city' : 'cities'}</span>
                  </div>
                  <div style={{ position: 'relative', height: 5, background: 'var(--color-border)', borderRadius: 3, marginBottom: '0.65rem' }}>
                    <div style={{
                      position: 'absolute',
                      left: `${(region.min / regionMaxPrice) * 100}%`,
                      width: `${Math.max(((region.max - region.min) / regionMaxPrice) * 100, 1)}%`,
                      height: '100%',
                      background: 'var(--color-accent)',
                      borderRadius: 3,
                    }} />
                    <div style={{
                      position: 'absolute',
                      left: `${(region.median / regionMaxPrice) * 100}%`,
                      top: -3,
                      width: 2,
                      height: 11,
                      background: 'var(--color-text-1)',
                      borderRadius: 1,
                      transform: 'translateX(-1px)',
                    }} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
                    {([['Min', money(region.min)], ['Median', money(region.median)], ['Max', money(region.max)]] as [string, string][]).map(([label, value]) => (
                      <div key={label}>
                        <p style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '1.2px', color: 'var(--color-text-3)', margin: '0 0 2px' }}>{label}</p>
                        <p style={{ fontFamily: DISP, fontSize: 14, color: label === 'Median' ? 'var(--color-accent)' : 'var(--color-text-2)', margin: 0, fontWeight: 400 }}>{value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Statistical analysis */}
      <section style={{ maxWidth: 1100, margin: '0 auto', padding: '0 2rem 3rem' }}>
        <div style={{ borderTop: '0.5px solid var(--color-border)', paddingTop: '2.5rem' }}>
          <p style={{ fontSize: 11, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--color-text-3)', margin: '0 0 1.25rem' }}>
            Statistical analysis — baseline price, rent burden, and sample depth
          </p>
          <div style={{ border: '0.5px solid var(--color-border)', borderRadius: 10, overflowX: 'auto', background: 'var(--color-surface)' }}>
            <div style={{ minWidth: 720 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr 1fr', gap: '1px', background: 'var(--color-border)', fontSize: 9, textTransform: 'uppercase', letterSpacing: '1.2px', color: 'var(--color-text-3)' }}>
                {['Measure', 'Baseline price', 'Rent burden', 'Entry count'].map((h) => (
                  <div key={h} style={{ background: 'var(--color-surface)', padding: '0.7rem 0.9rem' }}>{h}</div>
                ))}
              </div>
              {statRows.map((row, i) => (
                <div key={row[0]} style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr 1fr', gap: '1px', background: 'var(--color-border)' }}>
                  {row.map((cell, ci) => (
                    <div key={`${row[0]}-${ci}`} style={{ background: i % 2 === 0 ? 'var(--color-bg)' : 'var(--color-surface)', padding: '0.65rem 0.9rem', fontSize: 12, color: ci === 1 ? 'var(--color-accent)' : ci === 0 ? 'var(--color-text-1)' : 'var(--color-text-2)', fontWeight: ci === 0 ? 500 : 400 }}>
                      {cell}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
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

          <div style={{ background: 'var(--color-surface)', border: '0.5px solid var(--color-border)', borderRadius: 12, overflowX: 'auto', overflowY: 'hidden' }}>
            {/* Header */}
            <div style={{ display: 'grid', gridTemplateColumns: '44px minmax(150px,2fr) 0.8fr 0.65fr 0.65fr 0.8fr 0.6fr 0.8fr', gap: '0.75rem', padding: '0.7rem 1rem', borderBottom: '0.5px solid var(--color-border)', fontSize: 9, textTransform: 'uppercase', letterSpacing: '1.2px', color: 'var(--color-text-3)', minWidth: 920 }}>
              <div>#</div><div>City</div><div>Baseline</div><div>Z-score</div><div>Pctile</div><div>Rent burden</div><div>Entries</div><div>Quality</div>
            </div>

            {cities.map((city, index) => {
              const price = Number(city.price_cad ?? 0)
              const rent = Number(city.median_rent_1br_cad ?? 0)
              const salary = Number(city.median_monthly_salary_cad ?? 0)
              const burden = rent && salary ? Math.round((rent / salary) * 100) : null
              const isLast = index === cities.length - 1
              const zScore = priceStats.stdDevSample && priceStats.mean !== null
                ? (price - priceStats.mean) / priceStats.stdDevSample
                : null
              const entries = Number(city.market_entry_count ?? city.baseline_entry_count ?? 0)

              return (
                <div key={city.city} style={{ display: 'grid', gridTemplateColumns: '44px minmax(150px,2fr) 0.8fr 0.65fr 0.65fr 0.8fr 0.6fr 0.8fr', gap: '0.75rem', padding: '0.8rem 1rem', borderBottom: isLast ? 'none' : '0.5px solid var(--color-border)', alignItems: 'center', minWidth: 920 }}>

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
                    <span style={{ fontSize: 13, color: 'var(--color-text-2)' }}>{zScore !== null ? zScore.toFixed(2) : '—'}</span>
                    <div style={{ height: 3, borderRadius: 2, background: 'var(--color-border)', overflow: 'hidden', maxWidth: 70, marginTop: 4 }}>
                      <div style={{ height: '100%', width: `${Math.min(100, Math.abs(zScore ?? 0) * 28)}%`, background: zScore !== null && zScore < 0 ? '#3db870' : 'var(--color-accent)', borderRadius: 2 }} />
                    </div>
                  </div>

                  <div>
                    <span style={{ fontSize: 13, color: 'var(--color-text-2)' }}>{percentileRank(index, cities.length)}</span>
                    <p style={{ fontSize: 10, color: 'var(--color-text-3)', margin: '1px 0 0' }}>pct</p>
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
                    <span style={{ fontSize: 13, color: 'var(--color-text-2)' }}>{entries || '—'}</span>
                    <p style={{ fontSize: 10, color: 'var(--color-text-3)', margin: '1px 0 0' }}>total</p>
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
