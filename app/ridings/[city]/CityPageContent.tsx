'use client'

import { useState, useEffect } from 'react'
import NavBar from '@/app/components/NavBar'
import { estimateMonthlyTakeHome } from '@/lib/canada-tax'

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
  english_proficiency: string | null
  visa_ease: string | null
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
        <span style={{ fontSize: 12, color: 'var(--color-text-3)' }}>/ 100</span>
        <span style={{ fontSize: 11, color, fontWeight: 500 }}>· {grade}</span>
      </div>
      <div style={{ height: 4, borderRadius: 4, background: 'var(--color-border)', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 4 }} />
      </div>
      <p style={{ fontSize: 11, color: 'var(--color-text-3)', margin: '4px 0 0' }}>{label}</p>
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

function getNetDisposable(monthlyGross: number, monthlyRent: number, prov: string | null): number {
  const takeHome = estimateMonthlyTakeHome(monthlyGross, prov) ?? monthlyGross * 0.75
  return Math.round(takeHome - monthlyRent)
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
  const [profile, setProfile] = useState<'single_renter' | 'family_homeowner'>('single_renter')

  useEffect(() => {
    fetch('/api/exchange-rates')
      .then(r => r.json())
      .then(d => { if (d && typeof d === 'object') setRates(d) })
      .catch(() => {})
  }, [])

  const provincial_tax_bracket = city.english_proficiency

  let displayPopulation: number | null = city.population ? Number(city.population) : null
  let displayVoters: number | null = null
  try {
    if (city.population && city.population.startsWith('{')) {
      const parsed = JSON.parse(city.population)
      displayPopulation = Number(parsed.population)
      displayVoters = Number(parsed.registered_voters)
    }
  } catch (e) {}

  const rent = profile === 'single_renter'
    ? (city.median_rent_1br_cad != null ? Number(city.median_rent_1br_cad) : null)
    : (city.median_rent_1br_cad != null ? Number(city.median_rent_1br_cad) * 1.65 : null)
    
  const salary = profile === 'single_renter'
    ? (city.median_monthly_salary_cad != null ? Number(city.median_monthly_salary_cad) : null)
    : (city.tech_salary_cad != null ? Number(city.tech_salary_cad) : city.median_monthly_salary_cad != null ? Number(city.median_monthly_salary_cad) * 1.5 : null)

  const hasLiving     = rent != null || salary != null
  const hasLiveability= city.safety_index != null ||
    provincial_tax_bracket != null

  const rentBurden = (rent != null && salary != null && salary > 0)
    ? `${Math.round((rent / salary) * 100)}%`
    : 'Pending'

  const sym = SYMBOLS[currency] ?? currency
  const exchangeRateMonth = new Date().toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
  const disposable = (salary != null && rent != null) ? getNetDisposable(salary, rent, city.region) : null

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
          <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-3)', margin: 0 }}>
            Riding profile
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ display: 'inline-flex', background: 'var(--color-surface-2)', padding: 3, borderRadius: 10, border: '0.5px solid var(--color-border)' }}>
              <button
                onClick={() => setProfile('single_renter')}
                style={{
                  border: 'none', background: profile === 'single_renter' ? 'var(--color-surface)' : 'none',
                  color: profile === 'single_renter' ? 'var(--color-text-1)' : 'var(--color-text-3)',
                  padding: '5px 12px', borderRadius: 8, fontSize: 11, fontWeight: 500, cursor: 'pointer',
                  boxShadow: profile === 'single_renter' ? '0 2px 6px rgba(0,0,0,0.05)' : 'none',
                  transition: 'all 0.2s', fontFamily: 'var(--font-body)'
                }}
              >
                Single Renter
              </button>
              <button
                onClick={() => setProfile('family_homeowner')}
                style={{
                  border: 'none', background: profile === 'family_homeowner' ? 'var(--color-surface)' : 'none',
                  color: profile === 'family_homeowner' ? 'var(--color-text-1)' : 'var(--color-text-3)',
                  padding: '5px 12px', borderRadius: 8, fontSize: 11, fontWeight: 500, cursor: 'pointer',
                  boxShadow: profile === 'family_homeowner' ? '0 2px 6px rgba(0,0,0,0.05)' : 'none',
                  transition: 'all 0.2s', fontFamily: 'var(--font-body)'
                }}
              >
                Family Homeowner
              </button>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 12, color: 'var(--color-text-2)' }}>View in</span>
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
        </div>

        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 52, lineHeight: 1.05, letterSpacing: -1.2, margin: '0 0 0.4rem', color: 'var(--color-text-1)' }}>
          {city.flag ? `${city.flag} ` : ''}{city.city}
        </h1>
        <p style={{ fontSize: 14, color: 'var(--color-text-2)', margin: '0 0 1.25rem' }}>
          {[city.region, city.country].filter(Boolean).join(', ')}
          {displayPopulation ? ` · ${displayPopulation.toLocaleString()} population` : ''}
          {displayVoters ? ` · Registered Voters: ${displayVoters.toLocaleString()}` : ''}
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
              value={disposable != null ? convert(disposable, currency, rates) : 'Pending'}
              sub="Remaining monthly take-home after tax & rent"
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
              Living costs shown in <strong>{sym} {currency}</strong>. Income and rent are real government data, sourcing shown on each card.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginTop: '1.25rem' }}>
              {rent != null && (
                <LivingCard
                  label={profile === 'single_renter' ? "Typical monthly rent (1BR)" : "Typical housing cost (Family)"}
                  amount={convert(rent, currency, rates)}
                  sub={
                    city.rent_data_source ? (
                      <span>
                        {city.rent_data_source}.{' '}
                        <a href="/about" style={{ color: 'var(--color-text-2)', textDecoration: 'underline', fontWeight: 500 }}>
                          Learn how rent is sourced
                        </a>
                      </span>
                    ) : undefined
                  }
                />
              )}
              {salary != null && (
                <LivingCard label={profile === 'single_renter' ? "Median monthly salary" : "Median salary (Family)"}
                  amount={convert(salary, currency, rates)} sub={city.salary_data_source ?? undefined} />
              )}
              {city.tech_salary_cad != null && (
                <LivingCard label="Median household income"
                  amount={convert(city.tech_salary_cad, currency, rates)} sub="Statistics Canada Census Profile 2021 (98-401-X2021029), ref. year 2020" />
              )}
              {disposable != null && (() => {
                const isDeficit = disposable < 0
                return (
                  <LivingCard
                    label={isDeficit ? 'Housing cost exceeds salary' : 'Monthly Disposable Income'}
                    amount={convert(Math.abs(disposable), currency, rates)}
                    sub={isDeficit
                      ? `Housing burden: ${rentBurden} (gross). Net income cannot cover housing.`
                      : `Housing burden: ${rentBurden} (gross). Net remaining after estimated progressive taxes.`}
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

              {provincial_tax_bracket != null && (
                <MetaCard label="Provincial Tax">
                  <Badge value={provincial_tax_bracket} />
                  <p style={{ fontSize: 11, color: 'var(--color-text-3)', margin: '6px 0 0' }}>
                    Combined marginal bracket pressure
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
              { label: 'Population',     value: displayPopulation ? displayPopulation.toLocaleString() : null, isSource: false },
              { label: 'Registered Voters', value: displayVoters ? displayVoters.toLocaleString() : null, isSource: false },
            ].filter(({ value }) => value).map(({ label, value, isSource }) => (
              <p key={label} style={{ fontSize: 13, color: 'var(--color-text-3)', margin: 0 }}>
                <span style={{ color: 'var(--color-text-2)', marginRight: 6 }}>{label}:</span>
                {isSource ? <SourceLink value={value} /> : value}
              </p>
            ))}
            <p style={{ fontSize: 12, color: 'var(--color-text-2)', margin: '0.5rem 0 0', lineHeight: 1.6 }}>
              All monetary values stored in CAD and converted client-side.
              Rent is sourced per riding — see the rent source above for the exact basis (CMHC neighbourhood, a Census-indexed estimate, or the nearest CMHC metro). Safety uses the nearest surveyed metro&rsquo;s crime index.
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
      <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-2)', margin: '0 0 0.5rem' }}>{label}</p>
      <p style={{ fontFamily: 'var(--font-display)', fontSize: 32, color: valColor, margin: 0, lineHeight: 1.1, fontWeight: 400 }}>{value}</p>
      <p style={{ fontSize: 12, color: 'var(--color-text-2)', margin: '0.4rem 0 0' }}>{sub}</p>
    </div>
  )
}

function LivingCard({ label, amount, sub, highlight = false, deficit = false }: {
  label: string; amount: string; sub?: React.ReactNode; highlight?: boolean; deficit?: boolean
}) {
  const bg     = deficit ? 'rgba(217,56,58,0.06)' : highlight ? 'rgba(238,180,79,0.06)' : 'var(--color-surface)'
  const border = deficit ? 'rgba(217,56,58,0.20)' : highlight ? 'rgba(238,180,79,0.20)' : 'var(--color-border)'
  const numColor = deficit ? 'var(--color-accent)' : highlight ? 'var(--color-green)' : 'var(--color-text-1)'
  return (
    <div style={{ background: bg, border: `0.5px solid ${border}`, borderRadius: 14, padding: '1.5rem 1.25rem' }}>
      <p style={{ fontSize: 12, fontWeight: 500, color: 'var(--color-text-3)', margin: '0 0 0.5rem' }}>{label}</p>
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
      <p style={{ fontSize: 12, fontWeight: 500, color: 'var(--color-text-2)', margin: '0 0 0.6rem' }}>{label}</p>
      {children}
    </div>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────────

const h2: React.CSSProperties = {
  fontFamily: 'var(--font-display)', fontSize: 28, letterSpacing: -0.5, margin: '0 0 0.4rem', color: 'var(--color-text-1)',
}
const lead: React.CSSProperties = {
  fontSize: 13, color: 'var(--color-text-2)', lineHeight: 1.6, margin: 0, maxWidth: 700,
}
const metaValStyle: React.CSSProperties = {
  fontFamily: 'var(--font-display)', fontSize: 26, margin: 0, color: 'var(--color-text-1)', lineHeight: 1.1, fontWeight: 400,
}
