'use client'

import { useState, useEffect } from 'react'
import NavBar from '@/app/components/NavBar'

export type HistoryPoint = {
  month: string
  date: string
  price_cad: number
}

export type CityRow = {
  city: string
  country: string | null
  region: string | null
  flag: string | null
  population: string | null
  climate: string | null
  blurb: string | null
  price_cad: number | null
  price_source: string | null // representing political party
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

export const RATES: Record<string, number> = {
  CAD: 1,       USD: 0.719,  MXN: 13.89,   BRL: 3.6,
  ARS: 909,     COP: 3100,   GBP: 0.568,   EUR: 0.663,
  CHF: 0.66,    RUB: 66.7,   TRY: 27.0,    JPY: 115.1,
  CNY: 4.926,   HKD: 5.72,   SGD: 0.926,   KRW: 1099,
  TWD: 23.4,    INR: 60.6,   PKR: 277.8,   AUD: 1.136,
  NZD: 1.23,    AED: 2.639,  SAR: 2.703,   QAR: 2.66,
  KWD: 0.225,   EGP: 35.71,  ZAR: 13.2,
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

function convert(cadAmount: number | null | undefined, currency: string, ratesDict: Record<string, number> = RATES): string {
  if (cadAmount == null || !Number.isFinite(cadAmount)) return '-'
  const rate = ratesDict[currency] ?? RATES[currency] ?? 1
  const sym  = SYMBOLS[currency] ?? `${currency} `
  const val  = cadAmount * rate
  const digits = val >= 100 ? 0 : 2
  return `${sym}${val.toLocaleString(undefined, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })}`
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

export default function CityPageContent({
  city,
}: {
  city: CityRow
  restaurants?: RestaurantRow[]
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

  const french_speaking_pct = city.median_rent_local
  const provincial_tax_bracket = city.english_proficiency
  const healthcare_wait = city.visa_ease

  const hasLiving     = city.median_rent_1br_cad != null || city.median_monthly_salary_cad != null
  const hasLiveability= city.safety_index != null ||
    city.healthcare_index != null ||
    french_speaking_pct != null ||
    provincial_tax_bracket != null ||
    healthcare_wait != null

  const rentBurden = (city.median_rent_1br_cad != null && city.median_monthly_salary_cad != null && city.median_monthly_salary_cad > 0)
    ? `${Math.round((city.median_rent_1br_cad / city.median_monthly_salary_cad) * 100)}%`
    : '-'

  const sym = SYMBOLS[currency] ?? currency
  const exchangeRateMonth = new Date().toLocaleDateString(undefined, { month: 'long', year: 'numeric' })

  const partyColor = (party: string | null) => {
    const p = party?.toLowerCase() || ''
    if (p.includes('liberal')) return 'var(--color-red)'
    if (p.includes('conservative')) return '#0D47A1'
    if (p.includes('ndp') || p.includes('new democratic')) return '#FF9800'
    if (p.includes('bloc') || p.includes('québécois')) return '#29B6F6'
    if (p.includes('green')) return '#4CAF50'
    if (p.includes('independent')) return '#FFFFFF'
    return 'var(--color-text-2)'
  }

  return (
    <main style={{ fontFamily: 'var(--font-body)', background: 'var(--color-bg)', minHeight: '100vh', color: 'var(--color-text-1)' }}>

      <NavBar active="cities" />

      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <section style={{ padding: '3rem 2rem 2rem', maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
          <p style={{ fontSize: 10, fontWeight: 500, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--color-accent)', margin: 0 }}>
            Riding profile
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
          {city.blurb ?? 'Riding socio-economic context coming soon.'}
        </p>

        {/* Top summary cards */}
        <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', alignItems: 'stretch' }}>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', flex: '1 1 100%', alignItems: 'flex-start' }}>
            <PriceCard
              label="Rent Burden"
              value={rentBurden}
              sub="Wage percentage spent on rent"
              accent
            />
            <PriceCard
              label="Disposable Income"
              value={convert(city.median_monthly_salary_cad != null && city.median_rent_1br_cad != null ? city.median_monthly_salary_cad - city.median_rent_1br_cad : null, currency, rates)}
              sub="Remaining monthly wage after rent"
            />
            <PriceCard
              label="Representing Party"
              value={city.price_source ?? 'Unknown'}
              sub="Electoral representation"
              color={partyColor(city.price_source)}
            />
          </div>
        </div>
      </section>

      {/* ── Living costs ────────────────────────────────────────────────── */}
      {hasLiving && (
        <section style={{ maxWidth: 1100, margin: '0 auto', padding: '0 2.5rem 2rem' }}>
          <div style={{ borderTop: '0.5px solid var(--color-border)', paddingTop: '2rem' }}>
            <h2 style={h2}>Economic metrics</h2>
            <p style={lead}>
              Living costs shown in <strong>{sym} {currency}</strong>. Sourced from CMHC housing market updates and Statistics Canada census logs.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginTop: '1.25rem' }}>
              {city.median_rent_1br_cad != null && (
                <LivingCard label="Typical monthly rent (1BR)"
                  amount={convert(city.median_rent_1br_cad, currency, rates)} sub={city.rent_data_source ?? undefined} />
              )}
              {city.median_monthly_salary_cad != null && (
                <LivingCard label="Median monthly salary"
                  amount={convert(city.median_monthly_salary_cad, currency, rates)} sub={city.salary_data_source ?? undefined} />
              )}
              {city.tech_salary_cad != null && (
                <LivingCard label="Tech / knowledge worker salary"
                  amount={convert(city.tech_salary_cad, currency, rates)} sub="Median gross monthly" />
              )}
              {city.median_monthly_salary_cad != null && city.median_rent_1br_cad != null && (() => {
                const diff = city.median_monthly_salary_cad - city.median_rent_1br_cad
                const isDeficit = diff < 0
                return (
                  <LivingCard
                    label={isDeficit ? 'Rent exceeds median salary' : 'Monthly Disposable Income'}
                    amount={convert(Math.abs(diff), currency, rates)}
                    sub={isDeficit
                      ? `Rent burden: ${rentBurden}. Median wage cannot cover local rent.`
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
            <p style={lead}>Key quality-of-life and practical indicators for local residents.</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginTop: '1.25rem' }}>
              {city.safety_index != null && (
                <MetaCard label="Safety"><ScoreBar score={city.safety_index} label="Crime Index (inverted)" /></MetaCard>
              )}
              {city.healthcare_index != null && (
                <MetaCard label="Healthcare Quality"><ScoreBar score={city.healthcare_index} label="Local Healthcare Survey" /></MetaCard>
              )}
              {french_speaking_pct != null && (
                <MetaCard label="Language Profile">
                  <p style={metaValStyle}>{french_speaking_pct}%</p>
                  <p style={{ fontSize: 11, color: '#9b9b90', margin: '6px 0 0' }}>
                    First official language spoken (French)
                  </p>
                </MetaCard>
              )}
              {provincial_tax_bracket != null && (
                <MetaCard label="Provincial Tax">
                  <Badge value={provincial_tax_bracket} />
                  <p style={{ fontSize: 11, color: '#9b9b90', margin: '6px 0 0' }}>
                    Combined marginal bracket pressure
                  </p>
                </MetaCard>
              )}
              {healthcare_wait != null && (
                <MetaCard label="Healthcare Access">
                  <Badge value={healthcare_wait} />
                  <p style={{ fontSize: 11, color: '#9b9b90', margin: '6px 0 0' }}>
                    ER & specialist provincial wait times
                  </p>
                </MetaCard>
              )}
              {city.avg_internet_mbps != null && (
                <MetaCard label="Internet speed">
                  <p style={metaValStyle}>{city.avg_internet_mbps} <span style={{ fontSize: 14, color: '#9b9b90' }}>Mbps</span></p>
                  <p style={{ fontSize: 11, color: '#9b9b90', margin: '4px 0 0' }}>
                    {city.avg_internet_mbps >= 200 ? 'Excellent' : city.avg_internet_mbps >= 100 ? 'Good' : city.avg_internet_mbps >= 50 ? 'Average' : 'Below avg'}
                  </p>
                </MetaCard>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ── Data notes ──────────────────────────────────────────────────── */}
      <section style={{ maxWidth: 1100, margin: '0 auto', padding: '0 2.5rem 3rem' }}>
        <div style={{ borderTop: '0.5px solid var(--color-border)', paddingTop: '2rem' }}>
          <h2 style={h2}>Data notes</h2>
          <div style={{ background: 'var(--color-surface)', border: '0.5px solid var(--color-border)', borderRadius: 14, padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {[
              { label: 'Salary source',  value: city.salary_data_source,    isSource: true },
              { label: 'Rent source',    value: city.rent_data_source,      isSource: true },
              { label: 'Last updated',   value: fmtDate(city.price_updated_at), isSource: false },
              { label: 'Climate',        value: city.climate,               isSource: false },
              { label: 'Population',     value: city.population ? Number(city.population).toLocaleString() : null, isSource: false },
            ].filter(({ value }) => value).map(({ label, value, isSource }) => (
              <p key={label} style={{ fontSize: 13, color: '#8a8a82', margin: 0 }}>
                <span style={{ color: '#3a3a32', marginRight: 6 }}>{label}:</span>
                {isSource ? <SourceLink value={value} /> : value}
              </p>
            ))}
            <p style={{ fontSize: 12, color: '#3a3a32', margin: '0.5rem 0 0', lineHeight: 1.6 }}>
              All monetary values stored in CAD and converted client-side.
              Salary and rent figures represent median values for the metropolitan area representing this riding.
            </p>
          </div>
        </div>
      </section>

    </main>
  )
}

// ── Small components ──────────────────────────────────────────────────────────

function PriceCard({ label, value, sub, accent = false, color }: {
  label: string; value: string; sub: string; accent?: boolean; color?: string
}) {
  const valColor = color ?? (accent ? 'var(--color-accent)' : 'var(--color-text-1)')
  return (
    <div style={{
      background: 'var(--color-surface)', border: '0.5px solid var(--color-border)', borderRadius: 18,
      padding: '1.5rem 1.75rem', flex: '1 1 200px',
    }}>
      <p style={{ fontSize: 10, fontWeight: 500, letterSpacing: '1.2px', textTransform: 'uppercase', color: '#3a3a32', margin: '0 0 0.5rem' }}>{label}</p>
      <p style={{ fontFamily: 'var(--font-display)', fontSize: 32, color: valColor, margin: 0, lineHeight: 1.1, fontWeight: 400 }}>{value}</p>
      <p style={{ fontSize: 12, color: '#4a4a42', margin: '0.4rem 0 0' }}>{sub}</p>
    </div>
  )
}

function LivingCard({ label, amount, sub, highlight = false, deficit = false }: {
  label: string; amount: string; sub?: string; highlight?: boolean; deficit?: boolean
}) {
  const bg     = deficit ? 'rgba(217,56,58,0.06)' : highlight ? 'rgba(238,180,79,0.06)' : 'var(--color-surface)'
  const border = deficit ? 'rgba(217,56,58,0.20)' : highlight ? 'rgba(238,180,79,0.20)' : 'var(--color-border)'
  const numColor = deficit ? 'var(--color-accent)' : highlight ? 'var(--color-green)' : 'var(--color-text-1)'
  return (
    <div style={{ background: bg, border: `0.5px solid ${border}`, borderRadius: 14, padding: '1.5rem 1.25rem' }}>
      <p style={{ fontSize: 9, fontWeight: 500, letterSpacing: '1.1px', textTransform: 'uppercase', color: 'var(--color-text-3)', margin: '0 0 0.5rem' }}>{label}</p>
      <p style={{ fontFamily: 'var(--font-display)', fontSize: 26, color: numColor, margin: '0 0 0.25rem', lineHeight: 1.1 }}>
        {deficit ? '−' : ''}{amount}
      </p>
      {sub && <p style={{ fontSize: 11, color: 'var(--color-text-3)', margin: 0 }}>{sub}</p>}
    </div>
  )
}

function MetaCard({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ background: 'var(--color-surface)', border: '0.5px solid var(--color-border)', borderRadius: 14, padding: '1.1rem', flex: '1 1 220px' }}>
      <p style={{ fontSize: 9, fontWeight: 500, letterSpacing: '1.1px', textTransform: 'uppercase', color: '#3a3a32', margin: '0 0 0.6rem' }}>{label}</p>
      {children}
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
  fontFamily: 'var(--font-display)', fontSize: 26, margin: 0, color: 'var(--color-text-1)', lineHeight: 1.1, fontWeight: 400,
}
