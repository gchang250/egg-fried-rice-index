'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import NavBar from '@/app/components/NavBar'

export type HistoryPoint = {
  month: string
  date: string
  price_cad: number
}

// ── Types (exported so page.tsx can import them) ──────────────────────────────

export type CityRow = {
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

export type RestaurantRow = {
  id: string
  restaurant_name: string | null
  dish_name: string | null
  dish_category: string | null
  included_in_baseline: boolean | null
  tier: string | null
  local_price: number | null
  local_currency: string | null
  price_cad: number | null
  confidence_score: number | null
  notes: string | null
  date_accessed: string | null
}

// ── Currency data ─────────────────────────────────────────────────────────────
// Rates = units of foreign currency per 1 CAD.
// Derived from the seed-script exchange rates so that converting price_cad back
// to a city's local currency returns the original local price (no rounding drift).
// Seed rates (X_TO_CAD) → display rate = 1 / X_TO_CAD.
export const RATES: Record<string, number> = {
  // Americas
  CAD: 1,       USD: 0.719,  // 1/1.39
  MXN: 13.89,   // 1/0.072
  BRL: 3.6,     ARS: 909,    // 1/0.0011
  COP: 3100,
  // Europe
  GBP: 0.568,   // 1/1.76
  EUR: 0.663,   // 1/1.51
  CHF: 0.66,    RUB: 66.7,  // 1/0.015
  TRY: 27.0,    // 1/0.037
  // East Asia
  JPY: 115.1,   // 1/0.00869
  CNY: 4.926,   // 1/0.203
  HKD: 5.72,    // 1/0.1748
  SGD: 0.926,   // 1/1.08
  KRW: 1099,    // 1/0.00091
  TWD: 23.4,
  // South Asia
  INR: 60.6,    // 1/0.0165
  PKR: 277.8,   // 1/0.0036
  // Oceania
  AUD: 1.136,   // 1/0.88
  NZD: 1.23,
  // Middle East / Africa
  AED: 2.639,   // 1/0.379
  SAR: 2.703,   // 1/0.370
  QAR: 2.66,    KWD: 0.225,
  EGP: 35.71,   // 1/0.028
  ZAR: 13.2,
}

export const SYMBOLS: Record<string, string> = {
  CAD: 'CA$', USD: 'US$', EUR: '€',  GBP: '£',   CHF: 'Fr',
  AUD: 'AU$', NZD: 'NZ$', JPY: '¥',  CNY: '¥',   HKD: 'HK$',
  SGD: 'S$',  KRW: '₩',   TWD: 'NT$',INR: '₹',   PKR: '₨',
  MXN: 'MX$', BRL: 'R$',  ARS: 'AR$',COP: 'COP ',
  AED: 'AED ',SAR: 'SAR ', QAR: 'QAR ',KWD: 'KD ',
  TRY: '₺',   EGP: 'E£',  RUB: '₽',  ZAR: 'R',
}

const CURRENCY_GROUPS = [
  { label: 'Americas',     codes: ['CAD','USD','MXN','BRL','ARS','COP'] },
  { label: 'Europe',       codes: ['GBP','EUR','CHF','RUB','TRY'] },
  { label: 'East Asia',    codes: ['JPY','CNY','HKD','SGD','KRW','TWD'] },
  { label: 'South Asia',   codes: ['INR','PKR'] },
  { label: 'Oceania',      codes: ['AUD','NZD'] },
  { label: 'Middle East',  codes: ['AED','SAR','QAR','KWD','EGP'] },
  { label: 'Africa',       codes: ['ZAR'] },
]

// ── Helpers ───────────────────────────────────────────────────────────────────

function convert(cadAmount: number | null | undefined, currency: string, ratesDict: Record<string, number> = RATES): string {
  if (cadAmount == null || !Number.isFinite(cadAmount)) return '-'
  const rate = ratesDict[currency] ?? RATES[currency] ?? 1
  const sym  = SYMBOLS[currency] ?? `${currency} `
  const val  = cadAmount * rate
  // Large amounts (¥, ₩, ₨, ARS…) get 0 decimals; small amounts get 2
  const digits = val >= 100 ? 0 : 2
  return `${sym}${val.toLocaleString(undefined, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })}`
}

function fmtLocal(price: number | null, currency: string | null): string {
  if (price == null || !currency) return '-'
  const sym    = SYMBOLS[currency] ?? `${currency} `
  const digits = price >= 100 ? 0 : 2
  return `${sym}${price.toLocaleString(undefined, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })}`
}

function bowls(amount: number | null, bowlPrice: number | null): string {
  if (!amount || !bowlPrice || bowlPrice === 0) return '-'
  const n = amount / bowlPrice
  return n < 10 ? n.toFixed(1) : Math.round(n).toLocaleString()
}

function fmtDate(s: string | null | undefined) {
  if (!s) return '-'
  return new Date(s).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

function ensureProtocol(url: string): string {
  if (url.startsWith('http://') || url.startsWith('https://')) return url
  return `https://${url}`
}

function isUrl(s: string | null | undefined): s is string {
  if (!s) return false
  return s.startsWith('http') || s.startsWith('www.') || /\.[a-z]{2,}\//.test(s) || /^[a-zA-Z0-9-]+\.(com|org|gov|net|edu|co)/.test(s)
}

function SourceLink({ value }: { value: string | null | undefined }) {
  if (!value) return <span>-</span>
  if (isUrl(value)) {
    const display = value.replace(/^https?:\/\/(www\.)?/, '').split('/')[0]
    return (
      <a href={ensureProtocol(value)} target="_blank" rel="noreferrer"
        style={{ color: 'var(--color-accent)', textDecoration: 'none', wordBreak: 'break-all' }}>
        {display} ↗
      </a>
    )
  }
  return <span>{value}</span>
}

function fmtConf(v: number | null) {
  if (v == null) return '-'
  return `${Math.round(v <= 1 ? v * 100 : v)}%`
}

function fmtCat(v: string | null) {
  const m: Record<string, string> = {
    basic: 'Basic', vegetable: 'Vegetable', meat_based: 'Meat-based',
    seafood: 'Seafood', house_special: 'House special', premium: 'Premium',
  }
  return v ? (m[v] ?? v.replace(/_/g, ' ')) : '-'
}

function fmtTier(v: string | null) {
  const m: Record<string, string> = {
    low_tier: 'Budget', mid_tier: 'Mid-range', high_end: 'High-end', premium: 'Premium',
  }
  return v ? (m[v] ?? v.replace(/_/g, ' ')) : '-'
}

function median(vals: number[]) {
  if (!vals.length) return null
  const s = [...vals].sort((a, b) => a - b)
  const m = Math.floor(s.length / 2)
  return s.length % 2 === 1 ? s[m] : (s[m - 1] + s[m]) / 2
}

function avg(vals: number[]) {
  return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null
}

function stddev(vals: number[]) {
  if (vals.length < 2) return null
  const mean = vals.reduce((a, b) => a + b, 0) / vals.length
  return Math.sqrt(vals.reduce((s, v) => s + (v - mean) ** 2, 0) / (vals.length - 1))
}

// ── Sub-components ────────────────────────────────────────────────────────────

function ScoreBar({ score, label }: { score: number | null; label: string }) {
  if (score == null) return <p style={metaValStyle}>-</p>
  const pct   = Math.min(100, Math.max(0, score))
  const color = pct >= 70 ? 'var(--color-green)' : pct >= 50 ? 'var(--color-text-2)' : 'var(--color-accent)'
  const grade = pct >= 80 ? 'Excellent' : pct >= 65 ? 'Good' : pct >= 50 ? 'Moderate' : 'Below avg'
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <span style={{ ...metaValStyle, color }}>{score}</span>
        <span style={{ fontSize: 12, color: '#9b9b90' }}>/ 100</span>
        <span style={{ fontSize: 11, color, fontWeight: 500 }}>· {grade}</span>
      </div>
      <div style={{ height: 4, borderRadius: 4, background: 'var(--color-border)', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 4 }} />
      </div>
      <p style={{ fontSize: 11, color: '#9b9b90', margin: '4px 0 0' }}>{label}</p>
    </div>
  )
}

function Badge({ value }: { value: string | null }) {
  if (!value) return <span style={metaValStyle}>-</span>
  const styles: Record<string, React.CSSProperties> = {
    native:   { background: 'var(--color-accent-dim)', color: 'var(--color-accent)', border: '0.5px solid var(--color-border)' },
    high:     { background: 'var(--color-accent-dim)', color: 'var(--color-accent)', border: '0.5px solid var(--color-border)' },
    medium:   { background: 'var(--color-surface-2)', color: 'var(--color-text-2)', border: '0.5px solid var(--color-border)' },
    low:      { background: 'var(--color-surface-2)', color: 'var(--color-text-3)', border: '0.5px solid var(--color-border)', opacity: 0.8 },
    easy:     { background: 'var(--color-accent-dim)', color: 'var(--color-accent)', border: '0.5px solid var(--color-border)' },
    moderate: { background: 'var(--color-surface-2)', color: 'var(--color-text-2)', border: '0.5px solid var(--color-border)' },
    complex:  { background: 'var(--color-surface-2)', color: 'var(--color-text-3)', border: '0.5px solid var(--color-border)', opacity: 0.8 },
  }
  const labels: Record<string, string> = {
    native: 'Native', high: 'High', medium: 'Medium', low: 'Limited',
    easy: 'Easy', moderate: 'Moderate', complex: 'Complex',
  }
  return (
    <span style={{
      display: 'inline-block', padding: '3px 10px', borderRadius: 20,
      fontSize: 12, fontWeight: 500,
      ...(styles[value] ?? { background: '#f5f5f2', color: '#6b6b64', border: '0.5px solid #e5e3da' }),
    }}>
      {labels[value] ?? value}
    </span>
  )
}

// ── Historical Price Chart component ──────────────────────────────────────────

function HistoricalPriceChart({ history, currency, rates }: {
  history: HistoryPoint[]; currency: string; rates: Record<string, number>
}) {
  if (history.length === 0) return null;

  const rate = rates[currency] ?? 1
  const sym = SYMBOLS[currency] ?? 'CA$'
  
  const points = history.map(pt => ({
    ...pt,
    price: pt.price_cad * rate
  }))
  
  const prices = points.map(p => p.price)
  const minP = Math.min(...prices) * 0.9
  const maxP = Math.max(...prices) * 1.1
  const pDiff = maxP - minP === 0 ? 1 : maxP - minP

  const W = 600
  const H = 200
  const padding = { top: 22, right: 30, bottom: 30, left: 50 }
  
  const getX = (idx: number) => padding.left + (idx / (points.length - 1 || 1)) * (W - padding.left - padding.right)
  const getY = (price: number) => H - padding.bottom - ((price - minP) / pDiff) * (H - padding.top - padding.bottom)

  let pathD = ""
  points.forEach((pt, i) => {
    const x = getX(i)
    const y = getY(pt.price)
    if (i === 0) pathD = `M ${x} ${y}`
    else pathD += ` L ${x} ${y}`
  })

  let areaD = ""
  if (points.length > 1) {
    areaD = `${pathD} L ${getX(points.length - 1)} ${H - padding.bottom} L ${getX(0)} ${H - padding.bottom} Z`
  }

  return (
    <div className="glass-panel" style={{ borderRadius: 18, padding: '1.5rem', flex: '1 1 340px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: 230 }}>
      <div>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: 9.5, fontWeight: 500, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--color-text-3)', margin: '0 0 12px' }}>
          Historical Price Trend
        </p>
      </div>
      {points.length < 2 ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-3)', fontSize: 12.5, fontFamily: 'var(--font-body)', textAlign: 'center', padding: '0 1rem' }}>
          Price history tracking started {points[0]?.date ?? 'recently'}. Baseline price is currently stable.
        </div>
      ) : (
        <div style={{ position: 'relative', width: '100%', flex: 1, display: 'flex', alignItems: 'center' }}>
          <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
            <defs>
              <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-accent)" stopOpacity="0.22" />
                <stop offset="100%" stopColor="var(--color-accent)" stopOpacity="0.00" />
              </linearGradient>
            </defs>
            
            {/* Grid lines */}
            <line x1={padding.left} y1={getY(minP / 0.9)} x2={W - padding.right} y2={getY(minP / 0.9)} stroke="var(--color-border)" strokeWidth={0.5} strokeDasharray="2 4" />
            <line x1={padding.left} y1={getY((minP / 0.9 + maxP / 1.1) / 2)} x2={W - padding.right} y2={getY((minP / 0.9 + maxP / 1.1) / 2)} stroke="var(--color-border)" strokeWidth={0.5} strokeDasharray="2 4" />
            <line x1={padding.left} y1={getY(maxP / 1.1)} x2={W - padding.right} y2={getY(maxP / 1.1)} stroke="var(--color-border)" strokeWidth={0.5} strokeDasharray="2 4" />

            {/* Gradient Area under line */}
            <path d={areaD} fill="url(#chartGrad)" />

            {/* Line Path */}
            <path d={pathD} fill="none" stroke="var(--color-accent)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />

            {/* Dots and Labels */}
            {points.map((pt, i) => {
              const x = getX(i)
              const y = getY(pt.price)
              return (
                <g key={pt.month} style={{ cursor: 'pointer' }}>
                  <title>{pt.date}: {sym}{pt.price.toFixed(2)}</title>
                  <circle cx={x} cy={y} r={4.5} fill="var(--color-bg)" stroke="var(--color-accent)" strokeWidth={2.5} />
                  <text x={x} y={y - 10} textAnchor="middle" fontFamily="var(--font-mono)" fontSize={10} fill="var(--color-text-1)" fontWeight={500}>
                    {sym}{pt.price.toFixed(2)}
                  </text>
                  <text x={x} y={H - 8} textAnchor="middle" fontFamily="var(--font-mono)" fontSize={9} fill="var(--color-text-3)">
                    {pt.date}
                  </text>
                </g>
              )
            })}
          </svg>
        </div>
      )}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function CityPageContent({
  city,
  restaurants,
  history = [],
}: {
  city: CityRow
  restaurants: RestaurantRow[]
  history?: HistoryPoint[]
}) {
  const [currency, setCurrency] = useState('CAD')
  const [rates, setRates] = useState<Record<string, number>>(RATES)

  useEffect(() => {
    fetch('/api/exchange-rates')
      .then(r => r.json())
      .then(d => { if (d && typeof d === 'object') setRates(d) })
      .catch(() => {})
  }, [])

  const blEntries = restaurants.filter(r => r.included_in_baseline)
  const allPrices = restaurants.map(r => r.price_cad).filter((p): p is number => p != null)
  const blPrices  = blEntries.map(r => r.price_cad).filter((p): p is number => p != null)

  const bowlPrice = city.price_cad ?? city.baseline_median_cad ?? median(blPrices)
  const mktAvg    = city.market_average_cad ?? avg(allPrices)
  const mktMin    = city.market_min_cad ?? (allPrices.length ? Math.min(...allPrices) : null)
  const mktMax    = city.market_max_cad ?? (allPrices.length ? Math.max(...allPrices) : null)
  const sd        = stddev(allPrices)

  const hasLiving     = city.median_rent_1br_cad != null || city.median_monthly_salary_cad != null
  const hasLiveability= city.safety_index != null || city.healthcare_index != null

  const bowlsRent      = bowls(city.median_rent_1br_cad, bowlPrice)
  const bowlsSalary    = bowls(city.median_monthly_salary_cad, bowlPrice)
  const bowlsTech      = bowls(city.tech_salary_cad, bowlPrice)
  const bowlsAfterRent = (city.median_monthly_salary_cad != null && city.median_rent_1br_cad != null && bowlPrice)
    ? bowls(city.median_monthly_salary_cad - city.median_rent_1br_cad, bowlPrice)
    : '-'
  const rentBurden = (city.median_rent_1br_cad != null && city.median_monthly_salary_cad != null && city.median_monthly_salary_cad > 0)
    ? `${Math.round((city.median_rent_1br_cad / city.median_monthly_salary_cad) * 100)}%`
    : '-'

  const sym = SYMBOLS[currency] ?? currency
  const exchangeRateMonth = new Date().toLocaleDateString(undefined, { month: 'long', year: 'numeric' })

  return (
    <main style={{ fontFamily: 'var(--font-body)', background: 'var(--color-bg)', minHeight: '100vh', color: 'var(--color-text-1)' }}>

      <NavBar active="cities" />

      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <section style={{ padding: '3rem 2rem 2rem', maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
          <p style={{ fontSize: 10, fontWeight: 500, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--color-accent)', margin: 0 }}>
            City profile
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 12, color: '#3a3a32' }}>View in</span>
            <select
              value={currency}
              onChange={e => setCurrency(e.target.value)}
              style={{ padding: '5px 10px', border: '0.5px solid var(--color-border)', borderRadius: 8, background: 'var(--color-surface)', fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--color-text-1)', cursor: 'pointer' }}
            >
              {CURRENCY_GROUPS.map(group => (
                <optgroup key={group.label} label={group.label}>
                  {group.codes.filter(c => RATES[c]).map(code => (
                    <option key={code} value={code}>{SYMBOLS[code]}{code === 'CAD' ? ' (default)' : ''}</option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>
        </div>

        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 52, lineHeight: 1.05, letterSpacing: -1.2, margin: '0 0 0.4rem', color: 'var(--color-text-1)' }}>
          {city.flag ? `${city.flag} ` : ''}{city.city}
        </h1>
        <p style={{ fontSize: 14, color: '#4a4a42', margin: '0 0 1.25rem' }}>
          {[city.region, city.country].filter(Boolean).join(', ')}
          {city.population ? ` · ${Number(city.population).toLocaleString()} people` : ''}
        </p>
        <p style={{ fontSize: 15, color: '#7a7a70', lineHeight: 1.75, maxWidth: 700, margin: '0 0 2rem' }}>
          {city.blurb ?? 'City context coming soon.'}
        </p>

        {/* Stat cards & historical price chart */}
        <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', alignItems: 'stretch' }}>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', flex: '1 1 500px', alignItems: 'flex-start' }}>
            <PriceCard
              label="Baseline poutine"
              value={convert(bowlPrice, currency, rates)}
              sub={`${city.data_quality_label ?? 'Pending'} · ${city.baseline_entry_count ?? blEntries.length} sources`}
              accent
            />
            <PriceCard
              label="Market average"
              value={convert(mktAvg, currency, rates)}
              sub={`${city.market_entry_count ?? restaurants.length} entries tracked`}
            />
            <PriceCard
              label="Price range"
              value={mktMin != null && mktMax != null
                ? `${convert(mktMin, currency, rates)}–${convert(mktMax, currency, rates)}`
                : '-'}
              sub={sd != null ? `±${convert(sd, currency, rates)} std dev` : 'All approved entries'}
              wide
            />
          </div>
          <HistoricalPriceChart history={history} currency={currency} rates={rates} />
        </div>
      </section>

      {/* ── Living costs ────────────────────────────────────────────────── */}
      {hasLiving && (
        <section style={{ maxWidth: 1100, margin: '0 auto', padding: '0 2.5rem 2rem' }}>
          <div style={{ borderTop: '0.5px solid var(--color-border)', paddingTop: '2rem' }}>
            <h2 style={h2}>What does it cost to live here?</h2>
            <p style={lead}>
              Prices shown in <strong>{sym} {currency}</strong>.
              Poutine ratios are currency-neutral. One poutine in {city.city} = <strong>{convert(bowlPrice, currency, rates)}</strong>.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginTop: '1.25rem' }}>
              {city.median_rent_1br_cad != null && (
                <LivingCard label="Typical monthly rent (1BR)" bowlCount={bowlsRent}
                  amount={convert(city.median_rent_1br_cad, currency, rates)} sub={city.rent_data_source ?? undefined} />
              )}
              {city.median_monthly_salary_cad != null && (
                <LivingCard label="Median monthly salary" bowlCount={bowlsSalary}
                  amount={convert(city.median_monthly_salary_cad, currency, rates)} sub={city.salary_data_source ?? undefined} />
              )}
              {city.tech_salary_cad != null && (
                <LivingCard label="Tech / knowledge worker salary" bowlCount={bowlsTech}
                  amount={convert(city.tech_salary_cad, currency, rates)} sub="Median gross monthly" />
              )}
              {city.median_monthly_salary_cad != null && city.median_rent_1br_cad != null && (() => {
                const diff = city.median_monthly_salary_cad - city.median_rent_1br_cad
                const isDeficit = diff < 0
                return (
                  <LivingCard
                    label={isDeficit ? 'Rent exceeds median salary' : 'Poutines left after rent'}
                    bowlCount={isDeficit ? `−${Math.abs(parseInt(bowlsAfterRent))}` : bowlsAfterRent}
                    amount={convert(Math.abs(diff), currency, rates)}
                    sub={isDeficit
                      ? `Rent burden: ${rentBurden}. Median wage cannot cover city rent.`
                      : `Rent burden: ${rentBurden} of median salary`}
                    highlight
                    deficit={isDeficit}
                  />
                )
              })()}
            </div>
          </div>
        </section>
      )}

      {/* ── Liveability ─────────────────────────────────────────────────── */}
      {hasLiveability && (
        <section style={{ maxWidth: 1100, margin: '0 auto', padding: '0 2.5rem 2rem' }}>
          <div style={{ borderTop: '0.5px solid var(--color-border)', paddingTop: '2rem' }}>
            <h2 style={h2}>Liveability</h2>
            <p style={lead}>Key quality-of-life and practical indicators for international residents.</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginTop: '1.25rem' }}>
              {city.safety_index != null && (
                <MetaCard label="Safety"><ScoreBar score={city.safety_index} label="Numbeo Crime Index (inverted)" /></MetaCard>
              )}
              {city.healthcare_index != null && (
                <MetaCard label="Healthcare"><ScoreBar score={city.healthcare_index} label="Numbeo Healthcare Index" /></MetaCard>
              )}
              {city.english_proficiency != null && (
                <MetaCard label="English">
                  <Badge value={city.english_proficiency} />
                  <p style={{ fontSize: 11, color: '#9b9b90', margin: '6px 0 0' }}>
                    {{ native:'Official or de facto language', high:'Widely spoken in business and daily life', medium:'Basic communication manageable', low:'Significant language barrier' }[city.english_proficiency] ?? ''}
                  </p>
                </MetaCard>
              )}
              {city.visa_ease != null && (
                <MetaCard label="Visa ease">
                  <Badge value={city.visa_ease} />
                  <p style={{ fontSize: 11, color: '#9b9b90', margin: '6px 0 0' }}>
                    {{ easy:'Visa-free entry or straightforward pathways', moderate:'Visa required; work permit needs employer', complex:'Significant immigration requirements' }[city.visa_ease] ?? ''}
                    {' '}(Western passport)
                  </p>
                </MetaCard>
              )}
              {city.avg_internet_mbps != null && (
                <MetaCard label="Internet speed">
                  <p style={metaValStyle}>{city.avg_internet_mbps} <span style={{ fontSize: 14, color: '#9b9b90' }}>Mbps</span></p>
                  <p style={{ fontSize: 11, color: '#9b9b90', margin: '4px 0 0' }}>
                    {city.avg_internet_mbps >= 200 ? 'Excellent' : city.avg_internet_mbps >= 100 ? 'Good' : city.avg_internet_mbps >= 50 ? 'Average' : 'Below avg'}
                    {' · Ookla Speedtest Global Index'}
                  </p>
                </MetaCard>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ── Poutine market ───────────────────────────────────────────── */}
      <section style={{ maxWidth: 1100, margin: '0 auto', padding: '0 2.5rem 2rem' }}>
        <div style={{ borderTop: '0.5px solid var(--color-border)', paddingTop: '2rem' }}>
          <h2 style={h2}>Poutine market</h2>
          <p style={lead}>
            {restaurants.length} approved entries in {city.city}. Prices shown in {sym} {currency}.
            Baseline entries (classic poutine) set the index price.
          </p>
          <RestaurantTable rows={restaurants} bowlPrice={bowlPrice} currency={currency} rates={rates} />
        </div>
      </section>

      {/* ── Data notes ──────────────────────────────────────────────────── */}
      <section style={{ maxWidth: 1100, margin: '0 auto', padding: '0 2.5rem 3rem' }}>
        <div style={{ borderTop: '0.5px solid var(--color-border)', paddingTop: '2rem' }}>
          <h2 style={h2}>Data notes</h2>
          <div style={{ background: 'var(--color-surface)', border: '0.5px solid var(--color-border)', borderRadius: 14, padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {[
              { label: 'Price source',   value: city.price_source,          isSource: true },
              { label: 'Salary source',  value: city.salary_data_source,    isSource: true },
              { label: 'Rent source',    value: city.rent_data_source,      isSource: true },
              { label: 'Last updated',   value: fmtDate(city.price_updated_at), isSource: false },
              { label: 'Confidence',     value: fmtConf(city.confidence_score), isSource: false },
              { label: 'Climate',        value: city.climate,               isSource: false },
              { label: 'Population',     value: city.population ? Number(city.population).toLocaleString() : null, isSource: false },
            ].filter(({ value }) => value).map(({ label, value, isSource }) => (
              <p key={label} style={{ fontSize: 13, color: '#8a8a82', margin: 0 }}>
                <span style={{ color: '#3a3a32', marginRight: 6 }}>{label}:</span>
                {isSource ? <SourceLink value={value} /> : value}
              </p>
            ))}
            <p style={{ fontSize: 12, color: '#3a3a32', margin: '0.5rem 0 0', lineHeight: 1.6 }}>
              All monetary values stored in CAD and converted client-side at {exchangeRateMonth} exchange rates.
              Salary and rent figures represent median values for the metropolitan area.
              Liveability scores follow Numbeo methodology (0–100 scale).
            </p>
          </div>
        </div>
      </section>

    </main>
  )
}

// ── Small components ──────────────────────────────────────────────────────────

function PriceCard({ label, value, sub, accent = false, wide = false }: {
  label: string; value: string; sub: string; accent?: boolean; wide?: boolean
}) {
  return (
    <div style={{
      background: 'var(--color-surface)', border: '0.5px solid var(--color-border)', borderRadius: 18,
      padding: '1.5rem 1.75rem', minWidth: wide ? 220 : 180,
    }}>
      <p style={{ fontSize: 10, fontWeight: 500, letterSpacing: '1.2px', textTransform: 'uppercase', color: '#3a3a32', margin: '0 0 0.5rem' }}>{label}</p>
      <p style={{ fontFamily: 'var(--font-display)', fontSize: accent ? 44 : 32, color: accent ? 'var(--color-accent)' : 'var(--color-text-1)', margin: 0, lineHeight: 1 }}>{value}</p>
      <p style={{ fontSize: 12, color: '#4a4a42', margin: '0.4rem 0 0' }}>{sub}</p>
    </div>
  )
}

function LivingCard({ label, bowlCount, amount, sub, highlight = false, deficit = false }: {
  label: string; bowlCount: string; amount: string; sub?: string; highlight?: boolean; deficit?: boolean
}) {
  const bg     = deficit ? 'rgba(217,56,58,0.06)' : highlight ? 'rgba(238,180,79,0.06)' : 'var(--color-surface)'
  const border = deficit ? 'rgba(217,56,58,0.20)' : highlight ? 'rgba(238,180,79,0.20)' : 'var(--color-border)'
  const numColor = deficit ? 'var(--color-accent)' : highlight ? 'var(--color-green)' : 'var(--color-text-1)'
  return (
    <div style={{ background: bg, border: `0.5px solid ${border}`, borderRadius: 14, padding: '1.1rem' }}>
      <p style={{ fontSize: 9, fontWeight: 500, letterSpacing: '1.1px', textTransform: 'uppercase', color: 'var(--color-text-3)', margin: '0 0 0.4rem' }}>{label}</p>
      <p style={{ fontFamily: 'var(--font-display)', fontSize: 32, color: numColor, margin: 0, lineHeight: 1 }}>
        {deficit ? '−' : ''}{bowlCount} <span style={{ fontSize: 18 }}>🍟</span>
      </p>
      <p style={{ fontSize: 12, color: '#5a5a52', margin: '0.35rem 0 0' }}>{amount} / month</p>
      {sub && <p style={{ fontSize: 11, color: '#3a3a32', margin: '0.2rem 0 0' }}>{sub}</p>}
    </div>
  )
}

function MetaCard({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ background: 'var(--color-surface)', border: '0.5px solid var(--color-border)', borderRadius: 14, padding: '1.1rem' }}>
      <p style={{ fontSize: 9, fontWeight: 500, letterSpacing: '1.1px', textTransform: 'uppercase', color: '#3a3a32', margin: '0 0 0.6rem' }}>{label}</p>
      {children}
    </div>
  )
}

function RestaurantTable({ rows, bowlPrice, currency, rates }: {
  rows: RestaurantRow[]; bowlPrice: number | null; currency: string; rates: Record<string, number>
}) {
  const sym = SYMBOLS[currency] ?? currency
  if (!rows.length) {
    return (
      <div style={{ background: 'var(--color-surface)', border: '0.5px solid var(--color-border)', borderRadius: 14, padding: '1rem', marginTop: '1rem' }}>
        <p style={{ fontSize: 14, color: '#3a3a32', margin: 0 }}>No approved entries yet.</p>
      </div>
    )
  }
  return (
    <div style={{ background: 'var(--color-surface)', border: '0.5px solid var(--color-border)', borderRadius: 14, overflowX: 'auto', marginTop: '1rem' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 800 }}>
        <thead>
          <tr>
            {['Restaurant', 'Dish', 'Category', 'Tier', 'Local price', `Price (${sym})`, 'In poutines 🍟', 'Baseline', 'Conf.'].map(h => (
              <th key={h} style={{ textAlign: 'left', padding: '0.7rem 0.9rem', fontSize: 9, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--color-text-3)', borderBottom: '0.5px solid var(--color-border)', whiteSpace: 'nowrap' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(row => (
            <tr key={row.id} style={{ background: row.included_in_baseline ? 'rgba(118,169,140,0.10)' : 'var(--color-surface)' }}>
              <td style={td}>{row.restaurant_name ?? '-'}</td>
              <td style={td}>{row.dish_name ?? '-'}</td>
              <td style={td}>{fmtCat(row.dish_category)}</td>
              <td style={td}>{fmtTier(row.tier)}</td>
              <td style={{ ...td, whiteSpace: 'nowrap' }}>{fmtLocal(row.local_price, row.local_currency)}</td>
              <td style={{ ...td, whiteSpace: 'nowrap', fontWeight: 500, color: 'var(--color-text-1)' }}>{convert(row.price_cad, currency, rates)}</td>
              <td style={{ ...td, color: 'var(--color-accent)', fontWeight: 500 }}>
                {row.price_cad != null && bowlPrice ? (row.price_cad / bowlPrice).toFixed(1) : '-'}
              </td>
              <td style={td}>
                {row.included_in_baseline
                  ? <span style={{ color: 'var(--color-green)', fontWeight: 500 }}>Yes</span>
                  : <span style={{ color: '#2a2a22' }}>No</span>}
              </td>
              <td style={td}>{row.confidence_score != null ? `${Math.round(row.confidence_score <= 1 ? row.confidence_score * 100 : row.confidence_score)}%` : '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────────

const h2: React.CSSProperties = {
  fontFamily: 'var(--font-display)', fontSize: 28, letterSpacing: -0.5, margin: '0 0 0.4rem', color: 'var(--color-text-1)',
}
const lead: React.CSSProperties = {
  fontSize: 13, color: '#4a4a42', lineHeight: 1.6, margin: 0, maxWidth: 700,
}
const metaValStyle: React.CSSProperties = {
  fontFamily: 'var(--font-display)', fontSize: 28, color: 'var(--color-text-1)', margin: 0,
}
const td: React.CSSProperties = {
  padding: '0.8rem 0.9rem', fontSize: 13, color: '#8a8a82',
  borderBottom: '0.5px solid var(--color-border)', verticalAlign: 'top',
}
