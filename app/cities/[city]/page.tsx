import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'

type PageProps = {
  params: Promise<{ city: string }>
}

type CityRow = {
  city: string
  country: string | null
  region: string | null
  flag: string | null
  population: string | null
  climate: string | null
  blurb: string | null
  price_cad: number | null
  price_source: string | null
  price_updated_at: string | null
  confidence_score: number | null
  baseline_median_cad: number | null
  market_average_cad: number | null
  market_min_cad: number | null
  market_max_cad: number | null
  market_entry_count: number | null
  baseline_entry_count: number | null
  premium_entry_count: number | null
  data_quality_label: string | null
  // Liveability metrics (added via migration v1)
  median_rent_1br_cad: number | null
  median_rent_local: number | null
  median_monthly_salary_cad: number | null
  median_monthly_salary_local: number | null
  tech_salary_cad: number | null
  tech_salary_local: number | null
  safety_index: number | null
  healthcare_index: number | null
  english_proficiency: string | null
  visa_ease: string | null
  avg_internet_mbps: number | null
  salary_data_source: string | null
  rent_data_source: string | null
}

type RestaurantRow = {
  id: string
  restaurant_name: string | null
  dish_name: string | null
  dish_category: string | null
  included_in_baseline: boolean | null
  tier: string | null
  local_price: number | null
  local_currency: string | null
  price_cad: number | null
  source_url: string | null
  confidence_score: number | null
  notes: string | null
  date_accessed: string | null
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

function fromSlug(slug: string) {
  return slug.split('-').filter(Boolean)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}

function fmt(n: number | null | undefined, prefix = 'CA$') {
  if (n == null || !Number.isFinite(n)) return '—'
  return `${prefix}${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function fmtLocal(price: number | null, currency: string | null) {
  if (price == null || !currency) return '—'
  const symbols: Record<string, string> = {
    CAD: 'CA$', USD: 'US$', SGD: 'S$', JPY: '¥', CNY: '¥', KRW: '₩', HKD: 'HK$',
  }
  const sym = symbols[currency] ?? `${currency} `
  const digits = ['JPY', 'KRW'].includes(currency) ? 0 : 2
  return `${sym}${price.toLocaleString(undefined, { minimumFractionDigits: digits, maximumFractionDigits: digits })}`
}

function bowls(amount: number | null, bowlPrice: number | null): string {
  if (!amount || !bowlPrice || bowlPrice === 0) return '—'
  const n = amount / bowlPrice
  if (n < 10) return n.toFixed(1)
  return Math.round(n).toLocaleString()
}

function fmtDate(s: string | null | undefined) {
  if (!s) return '—'
  return new Date(s).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

function fmtConf(v: number | null) {
  if (v == null) return '—'
  return `${Math.round(v <= 1 ? v * 100 : v)}%`
}

function fmtCat(v: string | null) {
  const map: Record<string, string> = {
    basic: 'Basic', vegetable: 'Vegetable', meat_based: 'Meat-based',
    seafood: 'Seafood', house_special: 'House special', premium: 'Premium',
  }
  return v ? (map[v] ?? v.replace(/_/g, ' ')) : '—'
}

function fmtTier(v: string | null) {
  const map: Record<string, string> = {
    low_tier: 'Budget', mid_tier: 'Mid-range', high_end: 'High-end', premium: 'Premium',
  }
  return v ? (map[v] ?? v.replace(/_/g, ' ')) : '—'
}

function median(vals: number[]) {
  if (!vals.length) return null
  const s = [...vals].sort((a, b) => a - b)
  const m = Math.floor(s.length / 2)
  return s.length % 2 === 1 ? s[m] : (s[m - 1] + s[m]) / 2
}

function avg(vals: number[]) {
  if (!vals.length) return null
  return vals.reduce((a, b) => a + b, 0) / vals.length
}

function stddev(vals: number[]) {
  if (vals.length < 2) return null
  const mean = vals.reduce((a, b) => a + b, 0) / vals.length
  return Math.sqrt(vals.reduce((s, v) => s + (v - mean) ** 2, 0) / (vals.length - 1))
}

// ── Score bar ─────────────────────────────────────────────────────────────────

function ScoreBar({ score, label }: { score: number | null; label: string }) {
  if (score == null) return <p style={metaValStyle}>—</p>
  const pct = Math.min(100, Math.max(0, score))
  const color = pct >= 70 ? '#2d7a4f' : pct >= 50 ? '#b5730a' : '#c0392b'
  const grade = pct >= 80 ? 'Excellent' : pct >= 65 ? 'Good' : pct >= 50 ? 'Moderate' : 'Below avg'
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <span style={{ ...metaValStyle, color }}>{score}</span>
        <span style={{ fontSize: 12, color: '#9b9b90' }}>/ 100</span>
        <span style={{ fontSize: 11, color, fontWeight: 500 }}>— {grade}</span>
      </div>
      <div style={{ height: 4, borderRadius: 4, background: '#e5e3da', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 4 }} />
      </div>
      <p style={{ fontSize: 11, color: '#9b9b90', margin: '4px 0 0' }}>{label}</p>
    </div>
  )
}

// ── Badge ─────────────────────────────────────────────────────────────────────

function Badge({ value }: { value: string | null }) {
  if (!value) return <span style={metaValStyle}>—</span>
  const styles: Record<string, React.CSSProperties> = {
    native: { background: '#eaf4ed', color: '#2d7a4f', border: '0.5px solid #c3e0cc' },
    high:   { background: '#eaf4ed', color: '#2d7a4f', border: '0.5px solid #c3e0cc' },
    medium: { background: '#fef8ec', color: '#b5730a', border: '0.5px solid #f0dca0' },
    low:    { background: '#fff0e8', color: '#c25e1e', border: '0.5px solid #f5cdb0' },
    easy:   { background: '#eaf4ed', color: '#2d7a4f', border: '0.5px solid #c3e0cc' },
    moderate:{ background: '#fef8ec', color: '#b5730a', border: '0.5px solid #f0dca0' },
    complex:{ background: '#fff0e8', color: '#c25e1e', border: '0.5px solid #f5cdb0' },
  }
  const s = styles[value] ?? { background: '#f5f5f2', color: '#6b6b64', border: '0.5px solid #e5e3da' }
  const labels: Record<string, string> = {
    native: 'Native', high: 'High', medium: 'Medium', low: 'Limited',
    easy: 'Easy', moderate: 'Moderate', complex: 'Complex',
  }
  return (
    <span style={{
      display: 'inline-block', padding: '3px 10px', borderRadius: 20,
      fontSize: 12, fontWeight: 500, ...s,
    }}>
      {labels[value] ?? value}
    </span>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function CityDetailPage({ params }: PageProps) {
  const { city: slug } = await params

  const { data: rows, error: cityErr } = await supabase
    .from('cities').select('*').order('city')
  if (cityErr) throw new Error(cityErr.message)

  const city = ((rows ?? []) as CityRow[]).find(r => slugify(r.city) === slug)
  if (!city) notFound()

  const { data: rData } = await supabase
    .from('restaurants').select('*')
    .eq('city', city.city).eq('approved', true).eq('active', true)
    .order('price_cad', { ascending: true })

  const restaurants = (rData ?? []) as RestaurantRow[]
  const blEntries  = restaurants.filter(r => r.included_in_baseline)
  const allPrices  = restaurants.map(r => r.price_cad).filter((p): p is number => p != null)
  const blPrices   = blEntries.map(r => r.price_cad).filter((p): p is number => p != null)

  const bowlPrice = city.price_cad ?? city.baseline_median_cad ?? median(blPrices)
  const mktAvg    = city.market_average_cad ?? avg(allPrices)
  const mktMin    = city.market_min_cad ?? (allPrices.length ? Math.min(...allPrices) : null)
  const mktMax    = city.market_max_cad ?? (allPrices.length ? Math.max(...allPrices) : null)
  const sd        = stddev(allPrices)

  const hasLiving = city.median_rent_1br_cad != null || city.median_monthly_salary_cad != null
  const hasLiveability = city.safety_index != null || city.healthcare_index != null

  const bowlsRent       = bowls(city.median_rent_1br_cad, bowlPrice)
  const bowlsSalary     = bowls(city.median_monthly_salary_cad, bowlPrice)
  const bowlsTechSalary = bowls(city.tech_salary_cad, bowlPrice)
  const bowlsAfterRent  = (city.median_monthly_salary_cad != null && city.median_rent_1br_cad != null && bowlPrice)
    ? bowls(city.median_monthly_salary_cad - city.median_rent_1br_cad, bowlPrice)
    : '—'
  const rentBurden = (city.median_rent_1br_cad != null && city.median_monthly_salary_cad != null && city.median_monthly_salary_cad > 0)
    ? `${Math.round((city.median_rent_1br_cad / city.median_monthly_salary_cad) * 100)}%`
    : '—'

  return (
    <main style={{ fontFamily: 'DM Sans, sans-serif', background: '#FAFAF8', minHeight: '100vh', color: '#1a1a18' }}>

      {/* ── Nav ───────────────────────────────────────────────────────────── */}
      <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', padding: '1.25rem 2.5rem', borderBottom: '0.5px solid #e5e3da', flexWrap: 'wrap' }}>
        <Link href="/" style={{ fontFamily: 'DM Serif Display, serif', fontSize: 18, color: '#1a1a18', textDecoration: 'none' }}>
          fried rice <span style={{ color: '#C25E1E' }}>index</span>
        </Link>
        <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
          {[['cities', '/cities'], ['submit', '/submit'], ['about', '/about'], ['methodology', '/methodology']].map(([l, h]) => (
            <Link key={h} href={h} style={{ fontSize: 13, color: '#6b6b64', textDecoration: 'none' }}>{l}</Link>
          ))}
        </div>
      </nav>

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section style={{ padding: '4rem 2.5rem 2rem', maxWidth: 1100, margin: '0 auto' }}>
        <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: '1.5px', textTransform: 'uppercase', color: '#C25E1E', margin: '0 0 1rem' }}>
          City profile
        </p>
        <h1 style={{ fontFamily: 'DM Serif Display, serif', fontSize: 58, lineHeight: 1.05, letterSpacing: -1.5, margin: '0 0 0.4rem' }}>
          {city.flag ? `${city.flag} ` : ''}{city.city}
        </h1>
        <p style={{ fontSize: 15, color: '#6b6b64', margin: '0 0 1.5rem' }}>
          {[city.region, city.country].filter(Boolean).join(', ')}
          {city.population ? ` · ${Number(city.population).toLocaleString()} people` : ''}
        </p>
        <p style={{ fontSize: 16, color: '#3a3a34', lineHeight: 1.75, maxWidth: 720, margin: '0 0 2.5rem' }}>
          {city.blurb ?? 'City context coming soon.'}
        </p>

        {/* ── The bowl price ──────────────────────────────────────────────── */}
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-start' }}>
          <div style={{ background: '#fff', border: '0.5px solid #e5e3da', borderRadius: 20, padding: '1.75rem 2rem', minWidth: 220 }}>
            <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: '1.2px', textTransform: 'uppercase', color: '#9b9b90', margin: '0 0 0.5rem' }}>
              Baseline fried rice
            </p>
            <p style={{ fontFamily: 'DM Serif Display, serif', fontSize: 48, color: '#C25E1E', margin: 0, lineHeight: 1 }}>
              {bowlPrice != null ? `CA$${bowlPrice.toFixed(2)}` : '—'}
            </p>
            <p style={{ fontSize: 13, color: '#9b9b90', margin: '0.5rem 0 0' }}>
              {city.data_quality_label ?? 'Pending'} · {city.baseline_entry_count ?? blEntries.length} sources
            </p>
          </div>

          <div style={{ background: '#fff', border: '0.5px solid #e5e3da', borderRadius: 20, padding: '1.75rem 2rem', minWidth: 180 }}>
            <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: '1.2px', textTransform: 'uppercase', color: '#9b9b90', margin: '0 0 0.5rem' }}>
              Market average
            </p>
            <p style={{ fontFamily: 'DM Serif Display, serif', fontSize: 48, color: '#1a1a18', margin: 0, lineHeight: 1 }}>
              {mktAvg != null ? `CA$${mktAvg.toFixed(2)}` : '—'}
            </p>
            <p style={{ fontSize: 13, color: '#9b9b90', margin: '0.5rem 0 0' }}>
              {city.market_entry_count ?? restaurants.length} entries tracked
            </p>
          </div>

          <div style={{ background: '#fff', border: '0.5px solid #e5e3da', borderRadius: 20, padding: '1.75rem 2rem', minWidth: 180 }}>
            <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: '1.2px', textTransform: 'uppercase', color: '#9b9b90', margin: '0 0 0.5rem' }}>
              Price range
            </p>
            <p style={{ fontFamily: 'DM Serif Display, serif', fontSize: 32, color: '#1a1a18', margin: 0, lineHeight: 1 }}>
              {mktMin != null && mktMax != null ? `CA$${mktMin.toFixed(0)}–${mktMax.toFixed(0)}` : '—'}
            </p>
            <p style={{ fontSize: 13, color: '#9b9b90', margin: '0.5rem 0 0' }}>
              {sd != null ? `±CA$${sd.toFixed(2)} std dev` : 'All approved entries'}
            </p>
          </div>
        </div>
      </section>

      {/* ── Living costs (bowls) ──────────────────────────────────────────── */}
      {hasLiving && (
        <section style={{ maxWidth: 1100, margin: '0 auto', padding: '0 2.5rem 2rem' }}>
          <div style={{ borderTop: '0.5px solid #e5e3da', paddingTop: '2rem' }}>
            <h2 style={h2Style}>
              What does it cost to live here?
            </h2>
            <p style={leadStyle}>
              Prices expressed in bowls of fried rice — a cross-currency unit of purchasing power.
              One bowl in {city.city} = <strong>{bowlPrice != null ? `CA$${bowlPrice.toFixed(2)}` : '—'}</strong>.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginTop: '1.25rem' }}>

              {city.median_rent_1br_cad != null && (
                <LivingCard
                  label="Monthly rent (1BR, city centre)"
                  bowlCount={bowlsRent}
                  cadAmount={fmt(city.median_rent_1br_cad)}
                  sub={city.rent_data_source ?? undefined}
                />
              )}

              {city.median_monthly_salary_cad != null && (
                <LivingCard
                  label="Median monthly salary"
                  bowlCount={bowlsSalary}
                  cadAmount={fmt(city.median_monthly_salary_cad)}
                  sub={city.salary_data_source ?? undefined}
                />
              )}

              {city.tech_salary_cad != null && (
                <LivingCard
                  label="Tech / knowledge worker salary"
                  bowlCount={bowlsTechSalary}
                  cadAmount={fmt(city.tech_salary_cad)}
                  sub="Median gross monthly"
                />
              )}

              {city.median_monthly_salary_cad != null && city.median_rent_1br_cad != null && (
                <LivingCard
                  label="Bowls left after rent"
                  bowlCount={bowlsAfterRent}
                  cadAmount={fmt(city.median_monthly_salary_cad - city.median_rent_1br_cad)}
                  sub={`Rent burden: ${rentBurden} of median salary`}
                  highlight
                />
              )}

            </div>
          </div>
        </section>
      )}

      {/* ── Liveability ───────────────────────────────────────────────────── */}
      {hasLiveability && (
        <section style={{ maxWidth: 1100, margin: '0 auto', padding: '0 2.5rem 2rem' }}>
          <div style={{ borderTop: '0.5px solid #e5e3da', paddingTop: '2rem' }}>
            <h2 style={h2Style}>Liveability</h2>
            <p style={leadStyle}>Key quality-of-life and practical indicators for international residents.</p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginTop: '1.25rem' }}>

              {city.safety_index != null && (
                <MetaCard label="Safety">
                  <ScoreBar score={city.safety_index} label="Numbeo Crime Index (inverted)" />
                </MetaCard>
              )}

              {city.healthcare_index != null && (
                <MetaCard label="Healthcare">
                  <ScoreBar score={city.healthcare_index} label="Numbeo Healthcare Index" />
                </MetaCard>
              )}

              {city.english_proficiency != null && (
                <MetaCard label="English">
                  <Badge value={city.english_proficiency} />
                  <p style={{ fontSize: 11, color: '#9b9b90', margin: '6px 0 0' }}>
                    {{
                      native: 'Official or de facto language',
                      high: 'Widely spoken in business and daily life',
                      medium: 'Basic communication manageable',
                      low: 'Significant language barrier',
                    }[city.english_proficiency] ?? ''}
                  </p>
                </MetaCard>
              )}

              {city.visa_ease != null && (
                <MetaCard label="Visa ease">
                  <Badge value={city.visa_ease} />
                  <p style={{ fontSize: 11, color: '#9b9b90', margin: '6px 0 0' }}>
                    {{
                      easy: 'Visa-free entry or straightforward pathways',
                      moderate: 'Visa required; work permit needs employer',
                      complex: 'Significant immigration requirements',
                    }[city.visa_ease] ?? ''}
                    {' '}(Western passport)
                  </p>
                </MetaCard>
              )}

              {city.avg_internet_mbps != null && (
                <MetaCard label="Internet speed">
                  <p style={metaValStyle}>{city.avg_internet_mbps} <span style={{ fontSize: 14, color: '#9b9b90' }}>Mbps</span></p>
                  <p style={{ fontSize: 11, color: '#9b9b90', margin: '4px 0 0' }}>
                    Median download · Ookla Speedtest
                    {city.avg_internet_mbps >= 200 ? ' — Excellent' : city.avg_internet_mbps >= 100 ? ' — Good' : ' — Average'}
                  </p>
                </MetaCard>
              )}

            </div>
          </div>
        </section>
      )}

      {/* ── Fried rice market ─────────────────────────────────────────────── */}
      <section style={{ maxWidth: 1100, margin: '0 auto', padding: '0 2.5rem 2rem' }}>
        <div style={{ borderTop: '0.5px solid #e5e3da', paddingTop: '2rem' }}>
          <h2 style={h2Style}>Fried rice market</h2>
          <p style={leadStyle}>
            All {restaurants.length} approved fried rice entries tracked in {city.city}.
            Baseline entries (basic + vegetable) set the index price.
          </p>
          <RestaurantTable rows={restaurants} bowlPrice={bowlPrice} />
        </div>
      </section>

      {/* ── Data notes ────────────────────────────────────────────────────── */}
      <section style={{ maxWidth: 1100, margin: '0 auto', padding: '0 2.5rem 3rem' }}>
        <div style={{ borderTop: '0.5px solid #e5e3da', paddingTop: '2rem' }}>
          <h2 style={h2Style}>Data notes</h2>
          <div style={{ background: '#fff', border: '0.5px solid #e5e3da', borderRadius: 16, padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {[
              ['Price source', city.price_source],
              ['Salary source', city.salary_data_source],
              ['Rent source', city.rent_data_source],
              ['Last updated', fmtDate(city.price_updated_at)],
              ['Confidence', fmtConf(city.confidence_score)],
              ['Climate', city.climate],
              ['Population', city.population ? Number(city.population).toLocaleString() : null],
            ].filter(([, v]) => v).map(([label, value]) => (
              <p key={label as string} style={{ fontSize: 13, color: '#3a3a34', margin: 0 }}>
                <span style={{ color: '#9b9b90', marginRight: 6 }}>{label}:</span>{value}
              </p>
            ))}
            <p style={{ fontSize: 13, color: '#9b9b90', margin: '0.5rem 0 0', lineHeight: 1.6 }}>
              Salary and rent figures represent median values for the metropolitan area.
              Liveability scores follow Numbeo methodology (0–100 scale).
              All values in CAD at May 2026 exchange rates.
            </p>
          </div>
        </div>
      </section>

    </main>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────

function LivingCard({
  label, bowlCount, cadAmount, sub, highlight = false,
}: {
  label: string; bowlCount: string; cadAmount: string; sub?: string; highlight?: boolean
}) {
  return (
    <div style={{
      background: highlight ? '#fff8f4' : '#fff',
      border: `0.5px solid ${highlight ? '#f5cdb0' : '#e5e3da'}`,
      borderRadius: 16, padding: '1.25rem',
    }}>
      <p style={{ fontSize: 10, fontWeight: 500, letterSpacing: '1.1px', textTransform: 'uppercase', color: '#9b9b90', margin: '0 0 0.5rem' }}>
        {label}
      </p>
      <p style={{ fontFamily: 'DM Serif Display, serif', fontSize: 36, color: highlight ? '#C25E1E' : '#1a1a18', margin: 0, lineHeight: 1 }}>
        {bowlCount} <span style={{ fontSize: 20 }}>🍚</span>
      </p>
      <p style={{ fontSize: 13, color: '#6b6b64', margin: '0.4rem 0 0' }}>{cadAmount} / month</p>
      {sub && <p style={{ fontSize: 11, color: '#9b9b90', margin: '0.25rem 0 0' }}>{sub}</p>}
    </div>
  )
}

function MetaCard({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ background: '#fff', border: '0.5px solid #e5e3da', borderRadius: 16, padding: '1.25rem' }}>
      <p style={{ fontSize: 10, fontWeight: 500, letterSpacing: '1.1px', textTransform: 'uppercase', color: '#9b9b90', margin: '0 0 0.75rem' }}>
        {label}
      </p>
      {children}
    </div>
  )
}

function RestaurantTable({ rows, bowlPrice }: { rows: RestaurantRow[]; bowlPrice: number | null }) {
  if (!rows.length) {
    return (
      <div style={{ background: '#fff', border: '0.5px solid #e5e3da', borderRadius: 16, padding: '1rem' }}>
        <p style={{ fontSize: 14, color: '#9b9b90', margin: 0 }}>No approved entries yet.</p>
      </div>
    )
  }
  return (
    <div style={{ background: '#fff', border: '0.5px solid #e5e3da', borderRadius: 16, overflowX: 'auto', marginTop: '1rem' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 800 }}>
        <thead>
          <tr>
            {['Restaurant', 'Dish', 'Category', 'Tier', 'Local price', 'CA$ price', 'In bowls 🍚', 'Baseline', 'Conf.', 'Source'].map(h => (
              <th key={h} style={{ textAlign: 'left', padding: '0.8rem 0.9rem', fontSize: 10, textTransform: 'uppercase', letterSpacing: '1px', color: '#9b9b90', borderBottom: '0.5px solid #e5e3da', whiteSpace: 'nowrap' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(row => (
            <tr key={row.id} style={{ background: row.included_in_baseline ? '#fdfcf9' : '#fff' }}>
              <td style={td}>{row.restaurant_name ?? '—'}</td>
              <td style={td}>{row.dish_name ?? '—'}</td>
              <td style={td}>{fmtCat(row.dish_category)}</td>
              <td style={td}>{fmtTier(row.tier)}</td>
              <td style={{ ...td, whiteSpace: 'nowrap' }}>{fmtLocal(row.local_price, row.local_currency)}</td>
              <td style={{ ...td, whiteSpace: 'nowrap', fontWeight: 500 }}>
                {row.price_cad != null ? `CA$${row.price_cad.toFixed(2)}` : '—'}
              </td>
              <td style={{ ...td, color: '#C25E1E', fontWeight: 500 }}>
                {row.price_cad != null && bowlPrice ? `${(row.price_cad / bowlPrice).toFixed(1)}` : '—'}
              </td>
              <td style={td}>
                {row.included_in_baseline
                  ? <span style={{ color: '#2d7a4f', fontWeight: 500 }}>Yes</span>
                  : <span style={{ color: '#9b9b90' }}>No</span>}
              </td>
              <td style={td}>{fmtConf(row.confidence_score)}</td>
              <td style={td}>
                {row.source_url
                  ? <a href={row.source_url} target="_blank" rel="noreferrer" style={{ color: '#C25E1E', textDecoration: 'none', fontSize: 12 }}>View ↗</a>
                  : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────────

const h2Style: React.CSSProperties = {
  fontFamily: 'DM Serif Display, serif',
  fontSize: 30, letterSpacing: -0.5, margin: '0 0 0.4rem',
}

const leadStyle: React.CSSProperties = {
  fontSize: 14, color: '#6b6b64', lineHeight: 1.6, margin: '0 0 0', maxWidth: 700,
}

const metaValStyle: React.CSSProperties = {
  fontFamily: 'DM Serif Display, serif', fontSize: 28, color: '#1a1a18', margin: 0,
}

const td: React.CSSProperties = {
  padding: '0.8rem 0.9rem', fontSize: 13, color: '#3a3a34',
  borderBottom: '0.5px solid #f0ede6', verticalAlign: 'top',
}
