'use client'

import { useState } from 'react'
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

const PROVINCE_NAMES: Record<string, string> = {
  ON: 'Ontario',
  BC: 'British Columbia',
  QC: 'Quebec',
  AB: 'Alberta',
  MB: 'Manitoba',
  SK: 'Saskatchewan',
  NS: 'Nova Scotia',
  NB: 'New Brunswick',
  NL: 'Newfoundland & Labrador',
  PE: 'Prince Edward Island',
  YT: 'Yukon',
  NT: 'Northwest Territories',
  NU: 'Nunavut'
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return `CA$${n.toFixed(2)}`
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

function ScoreBar({ score, label }: { score: number | null; label: string }) {
  if (score == null) return <p style={metaValStyle}>-</p>
  const pct   = Math.min(100, Math.max(0, score))
  const color = pct >= 70 ? '#76a98c' : pct >= 50 ? '#c8a862' : '#c0674e'
  const grade = pct >= 75 ? 'Excellent' : pct >= 60 ? 'Good' : pct >= 45 ? 'Moderate' : 'Below avg'
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

// ── Historical Price Chart component ──────────────────────────────────────────

function HistoricalPriceChart({ history }: { history: HistoryPoint[] }) {
  if (history.length === 0) return null

  const prices = history.map(p => p.price_cad)
  const minP = Math.min(...prices) * 0.95
  const maxP = Math.max(...prices) * 1.05
  const pDiff = maxP - minP === 0 ? 1 : maxP - minP

  const W = 600
  const H = 200
  const padding = { top: 22, right: 30, bottom: 30, left: 50 }
  
  const getX = (idx: number) => padding.left + (idx / (history.length - 1 || 1)) * (W - padding.left - padding.right)
  const getY = (price: number) => H - padding.bottom - ((price - minP) / pDiff) * (H - padding.top - padding.bottom)

  let pathD = ""
  history.forEach((pt, i) => {
    const x = getX(i)
    const y = getY(pt.price_cad)
    if (i === 0) pathD = `M ${x} ${y}`
    else pathD += ` L ${x} ${y}`
  })

  let areaD = ""
  if (history.length > 1) {
    areaD = `${pathD} L ${getX(history.length - 1)} ${H - padding.bottom} L ${getX(0)} ${H - padding.bottom} Z`
  }

  return (
    <div className="glass-panel" style={{ border: '0.5px solid var(--color-border)', borderRadius: 18, padding: '1.5rem', flex: '1 1 340px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: 230, background: 'var(--color-surface)' }}>
      <div>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: 9.5, fontWeight: 500, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--color-text-3)', margin: '0 0 12px' }}>
          Historical Price Trend
        </p>
      </div>
      {history.length < 2 ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-3)', fontSize: 12.5, fontFamily: 'var(--font-body)', textAlign: 'center', padding: '0 1rem' }}>
          Price history tracking started {history[0]?.date ?? 'recently'}. Baseline price is currently stable.
        </div>
      ) : (
        <div style={{ position: 'relative', width: '100%', flex: 1, display: 'flex', alignItems: 'center' }}>
          <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
            <defs>
              <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-accent)" stopOpacity="0.2" />
                <stop offset="100%" stopColor="var(--color-accent)" stopOpacity="0.0" />
              </linearGradient>
            </defs>
            
            {/* Grid lines */}
            <line x1={padding.left} y1={getY(minP / 0.95)} x2={W - padding.right} y2={getY(minP / 0.95)} stroke="var(--color-border)" strokeWidth={0.5} strokeDasharray="2 4" />
            <line x1={padding.left} y1={getY((minP / 0.95 + maxP / 1.05) / 2)} x2={W - padding.right} y2={getY((minP / 0.95 + maxP / 1.05) / 2)} stroke="var(--color-border)" strokeWidth={0.5} strokeDasharray="2 4" />
            <line x1={padding.left} y1={getY(maxP / 1.05)} x2={W - padding.right} y2={getY(maxP / 1.05)} stroke="var(--color-border)" strokeWidth={0.5} strokeDasharray="2 4" />

            {/* Gradient Area */}
            <path d={areaD} fill="url(#chartGrad)" />

            {/* Line Path */}
            <path d={pathD} fill="none" stroke="var(--color-accent)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />

            {/* Dots */}
            {history.map((pt, i) => {
              const x = getX(i)
              const y = getY(pt.price_cad)
              return (
                <g key={pt.month} style={{ cursor: 'pointer' }}>
                  <title>{pt.date}: {fmt(pt.price_cad)}</title>
                  <circle cx={x} cy={y} r={4} fill="var(--color-bg)" stroke="var(--color-accent)" strokeWidth={2} />
                  <text x={x} y={y - 10} textAnchor="middle" fontFamily="var(--font-mono)" fontSize={10} fill="var(--color-text-1)" fontWeight={500}>
                    {fmt(pt.price_cad)}
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
  const blEntries = restaurants.filter(r => r.included_in_baseline)
  const allPrices = restaurants.map(r => r.price_cad).filter((p): p is number => p != null)
  const blPrices  = blEntries.map(r => r.price_cad).filter((p): p is number => p != null)

  const bowlPrice = city.price_cad ?? city.baseline_median_cad ?? (blPrices.length ? blPrices[Math.floor(blPrices.length/2)] : 14.50)
  const mktAvg    = city.market_average_cad ?? (allPrices.length ? allPrices.reduce((a,b)=>a+b,0)/allPrices.length : null)
  const mktMin    = city.market_min_cad ?? (allPrices.length ? Math.min(...allPrices) : null)
  const mktMax    = city.market_max_cad ?? (allPrices.length ? Math.max(...allPrices) : null)

  const hasLiving     = city.median_rent_1br_cad != null || city.median_monthly_salary_cad != null
  const hasLiveability= city.safety_index != null || city.healthcare_index != null

  const rentBurden = (city.median_rent_1br_cad != null && city.median_monthly_salary_cad != null && city.median_monthly_salary_cad > 0)
    ? `${Math.round((city.median_rent_1br_cad / city.median_monthly_salary_cad) * 100)}%`
    : '-'

  const bowlsAfterRent = (city.median_monthly_salary_cad != null && city.median_rent_1br_cad != null && bowlPrice > 0)
    ? Math.round((city.median_monthly_salary_cad - city.median_rent_1br_cad) / bowlPrice)
    : '-'

  const provName = city.region ? PROVINCE_NAMES[city.region] || city.region : ''

  return (
    <main style={{ fontFamily: 'var(--font-body)', background: 'var(--color-bg)', minHeight: '100vh', color: 'var(--color-text-1)' }}>

      <NavBar active="cities" />

      {/* Hero Header */}
      <section style={{ padding: '3rem 2rem 2rem', maxWidth: 1100, margin: '0 auto' }}>
        <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--color-accent)', margin: '0 0 10px' }}>
          Community Index Profile
        </p>

        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 52, lineHeight: 1.05, letterSpacing: -1.2, margin: '0 0 0.4rem', color: 'var(--color-text-1)' }}>
          {city.city}
        </h1>
        <p style={{ fontSize: 14, color: 'var(--color-text-3)', margin: '0 0 1.25rem' }}>
          {provName} · Canada
          {city.population ? ` · Pop. ${Number(city.population).toLocaleString()}` : ''}
        </p>
        <p style={{ fontSize: 15.5, color: 'var(--color-text-2)', lineHeight: 1.7, maxWidth: 700, margin: '0 0 2rem' }}>
          {city.blurb ?? 'Community data context coming soon.'}
        </p>

        {/* Price & History cards */}
        <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', alignItems: 'stretch' }}>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', flex: '1 1 500px', alignItems: 'flex-start' }}>
            <PriceCard
              label="Baseline fried rice"
              value={fmt(bowlPrice)}
              sub={`${city.data_quality_label ?? 'Moderate'} · ${city.baseline_entry_count ?? blEntries.length} verified prices`}
              accent
            />
            <PriceCard
              label="Market average (all tiers)"
              value={mktAvg ? fmt(mktAvg) : '-'}
              sub={`${city.market_entry_count ?? restaurants.length} total restaurants tracked`}
            />
            <PriceCard
              label="Price range"
              value={mktMin != null && mktMax != null ? `${fmt(mktMin)} – ${fmt(mktMax)}` : '-'}
              sub="Budget stand to upscale dining"
              wide
            />
          </div>
          <HistoricalPriceChart history={history} />
        </div>
      </section>

      {/* Living costs */}
      {hasLiving && (
        <section style={{ maxWidth: 1100, margin: '0 auto', padding: '0 2rem 2rem' }}>
          <div style={{ borderTop: '0.5px solid var(--color-border)', paddingTop: '2rem' }}>
            <h2 style={h2}>Affordability & living costs</h2>
            <p style={lead}>
              All values measured in CAD. One bowl in {city.city} costs <strong>{fmt(bowlPrice)}</strong>.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginTop: '1.25rem' }}>
              {city.median_rent_1br_cad != null && (
                <LivingCard label="Median monthly rent (1BR)" bowlCount={Math.round(city.median_rent_1br_cad / bowlPrice).toString()}
                  amount={fmt(city.median_rent_1br_cad)} sub={city.rent_data_source ?? undefined} />
              )}
              {city.median_monthly_salary_cad != null && (
                <LivingCard label="Median monthly gross paycheck" bowlCount={Math.round(city.median_monthly_salary_cad / bowlPrice).toString()}
                  amount={fmt(city.median_monthly_salary_cad)} sub={city.salary_data_source ?? undefined} />
              )}
              {city.tech_salary_cad != null && (
                <LivingCard label="Tech / knowledge worker salary" bowlCount={Math.round(city.tech_salary_cad / bowlPrice).toString()}
                  amount={fmt(city.tech_salary_cad)} sub="Median monthly gross" />
              )}
              {city.median_monthly_salary_cad != null && city.median_rent_1br_cad != null && (() => {
                const diff = city.median_monthly_salary_cad - city.median_rent_1br_cad
                return (
                  <LivingCard
                    label="Disposable bowls left after rent"
                    bowlCount={String(bowlsAfterRent)}
                    amount={fmt(diff)}
                    sub={`Rent burden: ${rentBurden} of paycheck`}
                    highlight
                  />
                )
              })()}
            </div>
          </div>
        </section>
      )}

      {/* Quality of Life (Liveability) */}
      {hasLiveability && (
        <section style={{ maxWidth: 1100, margin: '0 auto', padding: '0 2rem 2rem' }}>
          <div style={{ borderTop: '0.5px solid var(--color-border)', paddingTop: '2rem' }}>
            <h2 style={h2}>Community liveability metrics</h2>
            <p style={lead}>Key quality-of-life indicators referenced from Statistics Canada and Numbeo community surveys.</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginTop: '1.25rem' }}>
              {city.safety_index != null && (
                <MetaCard label="Safety index"><ScoreBar score={city.safety_index} label="Numbeo Crime Index (inverted)" /></MetaCard>
              )}
              {city.healthcare_index != null && (
                <MetaCard label="Healthcare quality"><ScoreBar score={city.healthcare_index} label="Numbeo Healthcare Index" /></MetaCard>
              )}
              {city.avg_internet_mbps != null && (
                <MetaCard label="Internet performance">
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                    <span style={metaValStyle}>{city.avg_internet_mbps}</span>
                    <span style={{ fontSize: 12, color: 'var(--color-text-3)' }}>Mbps</span>
                  </div>
                  <div style={{ height: 4, borderRadius: 4, background: 'var(--color-border)', overflow: 'hidden', marginTop: 12 }}>
                    <div style={{ height: '100%', width: `${Math.min(100, city.avg_internet_mbps / 2.5)}%`, background: '#76a98c', borderRadius: 4 }} />
                  </div>
                  <p style={{ fontSize: 11, color: 'var(--color-text-3)', margin: '6px 0 0' }}>Ookla Speedtest median download</p>
                </MetaCard>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Restaurant listings */}
      <section style={{ maxWidth: 1100, margin: '0 auto', padding: '0 2rem 5rem' }}>
        <div style={{ borderTop: '0.5px solid var(--color-border)', paddingTop: '2rem' }}>
          <h2 style={h2}>Scanned restaurant listings</h2>
          <p style={lead}>The raw database entries used to compute the community baseline price.</p>
          
          <div style={{ background: 'var(--color-surface)', border: '0.5px solid var(--color-border)', borderRadius: 14, overflow: 'hidden', marginTop: '1.5rem' }}>
            <div style={{ padding: '1rem', overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5, textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-3)' }}>
                    <th style={{ padding: '8px 12px 12px' }}>Restaurant</th>
                    <th style={{ padding: '8px 12px 12px' }}>Dish Menu Item</th>
                    <th style={{ padding: '8px 12px 12px' }}>Category</th>
                    <th style={{ padding: '8px 12px 12px' }}>Tier</th>
                    <th style={{ padding: '8px 12px 12px', textAlign: 'right' }}>Price (CAD)</th>
                    <th style={{ padding: '8px 12px 12px' }}>Source Link</th>
                    <th style={{ padding: '8px 12px 12px' }}>Audit Date</th>
                  </tr>
                </thead>
                <tbody>
                  {restaurants.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ padding: '2rem 12px', color: 'var(--color-text-3)', textAlign: 'center' }}>No restaurants indexed yet.</td>
                    </tr>
                  ) : (
                    restaurants.map((r, i) => {
                      const isBaseline = r.included_in_baseline
                      return (
                        <tr key={r.id || i} style={{ borderBottom: i < restaurants.length - 1 ? '0.5px solid var(--color-border)' : 'none', background: isBaseline ? 'rgba(118,169,140,0.02)' : 'none' }}>
                          <td style={{ padding: '12px', fontWeight: 500, color: 'var(--color-text-1)' }}>
                            {r.restaurant_name ?? '-'}
                            {isBaseline && <span style={{ marginLeft: 6, fontSize: 9.5, padding: '2px 6px', background: 'rgba(118,169,140,0.1)', color: '#76a98c', borderRadius: 4, fontWeight: 600 }}>Baseline</span>}
                          </td>
                          <td style={{ padding: '12px', color: 'var(--color-text-2)' }}>{r.dish_name ?? '-'}</td>
                          <td style={{ padding: '12px', color: 'var(--color-text-3)' }}>{fmtCat(r.dish_category)}</td>
                          <td style={{ padding: '12px', color: 'var(--color-text-3)' }}>{fmtTier(r.tier)}</td>
                          <td style={{ padding: '12px', textAlign: 'right', fontWeight: 600, color: isBaseline ? 'var(--color-accent)' : 'var(--color-text-2)', fontFamily: 'var(--font-mono)' }}>
                            {r.price_cad ? fmt(r.price_cad) : '-'}
                          </td>
                          <td style={{ padding: '12px' }}><SourceLink value={r.notes} /></td>
                          <td style={{ padding: '12px', color: 'var(--color-text-3)', fontSize: 12 }}>{fmtDate(r.date_accessed)}</td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

    </main>
  )
}

// ── Shared Card Styles ────────────────────────────────────────────────────────

const h2: React.CSSProperties = {
  fontFamily: 'var(--font-display)', fontSize: 28, letterSpacing: -0.5, margin: '0 0 6px', color: 'var(--color-text-1)', fontWeight: 400
}
const lead: React.CSSProperties = {
  fontSize: 14, color: 'var(--color-text-3)', margin: '0 0 1.5rem', lineHeight: 1.5
}
const metaValStyle: React.CSSProperties = {
  fontFamily: 'var(--font-mono)', fontSize: 24, fontWeight: 500, color: 'var(--color-text-1)', margin: 0, lineHeight: 1
}

function PriceCard({ label, value, sub, accent = false, wide = false }: {
  label: string; value: string; sub?: string; accent?: boolean; wide?: boolean
}) {
  return (
    <div style={{
      background: accent ? 'rgba(200, 168, 98, 0.05)' : 'var(--color-surface)',
      border: accent ? '0.5px solid rgba(200, 168, 98, 0.4)' : '0.5px solid var(--color-border)',
      borderRadius: 14, padding: '1.25rem 1.5rem',
      flex: wide ? '1 1 100%' : '1 1 200px',
      display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
      minHeight: 110
    }}>
      <p style={{ fontSize: 10, fontWeight: 500, letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--color-text-3)', margin: '0 0 8px' }}>{label}</p>
      <p style={{ fontFamily: 'var(--font-display)', fontSize: 32, color: accent ? 'var(--color-accent)' : 'var(--color-text-1)', margin: '0 0 6px', fontWeight: 500, lineHeight: 1 }}>{value}</p>
      {sub && <p style={{ fontSize: 11, color: 'var(--color-text-3)', margin: 0 }}>{sub}</p>}
    </div>
  )
}

function LivingCard({ label, amount, bowlCount, sub, highlight = false, deficit = false }: {
  label: string; amount: string; bowlCount: string; sub?: string; highlight?: boolean; deficit?: boolean
}) {
  const accentColor = deficit ? 'var(--color-red)' : '#76a98c'
  return (
    <div style={{
      background: highlight ? 'rgba(255,255,255,0.02)' : 'var(--color-surface)',
      border: highlight ? '0.5px solid rgba(255,255,255,0.12)' : '0.5px solid var(--color-border)',
      borderRadius: 14, padding: '1.25rem 1.5rem',
      display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
      minHeight: 120
    }}>
      <div>
        <p style={{ fontSize: 10, fontWeight: 500, letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--color-text-3)', margin: '0 0 8px' }}>{label}</p>
        <p style={{ fontFamily: 'var(--font-display)', fontSize: 24, color: highlight ? 'var(--color-accent)' : 'var(--color-text-1)', margin: '0 0 4px', fontWeight: 500, lineHeight: 1 }}>{amount}</p>
      </div>
      <div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginTop: 10 }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 18, color: highlight ? accentColor : 'var(--color-text-2)', fontWeight: 600 }}>{bowlCount}</span>
          <span style={{ fontSize: 11, color: 'var(--color-text-3)' }}>bowls / mo</span>
        </div>
        {sub && <p style={{ fontSize: 10.5, color: 'var(--color-text-3)', margin: '4px 0 0' }}>{sub}</p>}
      </div>
    </div>
  )
}

function MetaCard({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ background: 'var(--color-surface)', border: '0.5px solid var(--color-border)', borderRadius: 14, padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: 110 }}>
      <p style={{ fontSize: 10, fontWeight: 500, letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--color-text-3)', margin: '0 0 10px' }}>{label}</p>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        {children}
      </div>
    </div>
  )
}
