'use client'

import { useEffect, useState, useMemo } from 'react'
import { supabase } from '@/lib/supabase'

const FALLBACK_RATES: Record<string, number> = {
  CAD: 1,
  USD: 0.73,
  EUR: 0.68,
  CHF: 0.66,
  GBP: 0.58,
  JPY: 107.5,
  CNY: 5.3,
  AUD: 1.13,
  HKD: 5.72,
  SGD: 0.99,
  SAR: 2.74,
  PHP: 41.2,
  MYR: 3.18,
  MXN: 14.6,
  ARS: 720.0,
  KRW: 1001.0,
  INR: 60.8,
  AED: 2.68,
}

const symbols: Record<string, string> = {
  CAD: 'CA$', USD: 'US$', EUR: '€', CHF: 'Fr', GBP: '£', JPY: '¥', CNY: '¥',
  AUD: 'AU$', HKD: 'HK$', SGD: 'S$', SAR: '﷼', PHP: '₱', MYR: 'RM',
  MXN: 'MX$', ARS: 'AR$', KRW: '₩', INR: '₹', AED: 'د.إ',
}

const currencyOptions = Object.keys(FALLBACK_RATES).map((code) => [
  code,
  `${symbols[code] ?? code} ${code}`,
])

type CityRow = {
  city: string
  country: string | null
  region: string | null
  flag: string | null
  population: string | null
  price_cad: number | null
  blurb: string | null
  price_source: string | null
  price_updated_at: string | null
  confidence_score: number | null
  baseline_entry_count: number | null
  market_entry_count: number | null
  data_quality_label: string | null
  median_rent_1br_cad: number | null
  median_monthly_salary_cad: number | null
}

function slugifyCity(city: string) {
  return city.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

function priceBarColor(price: number, max: number): string {
  const pct = price / max
  if (pct < 0.15) return '#2d7a4f'
  if (pct < 0.35) return '#4fa36c'
  if (pct < 0.60) return '#b8720d'
  if (pct < 0.82) return '#C25E1E'
  return '#942b0a'
}

export default function CitiesPage() {
  const [cities, setCities] = useState<CityRow[]>([])
  const [loading, setLoading] = useState(true)
  const [currency, setCurrency] = useState('CAD')
  const [isMobile, setIsMobile] = useState(false)
  const [rates, setRates] = useState<Record<string, number>>(FALLBACK_RATES)
  const [search, setSearch] = useState('')
  const [selectedRegion, setSelectedRegion] = useState('All')
  const [hoveredCity, setHoveredCity] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/exchange-rates')
      .then((r) => r.json())
      .then((data) => { if (data?.CAD) setRates(data) })
      .catch(() => {})
  }, [])

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  useEffect(() => {
    async function fetchCities() {
      setLoading(true)
      const { data, error } = await supabase
        .from('cities')
        .select(`
          city, country, region, flag, population,
          price_cad, blurb, price_source, price_updated_at,
          confidence_score, baseline_entry_count, market_entry_count,
          data_quality_label, median_rent_1br_cad, median_monthly_salary_cad
        `)
        .order('price_cad', { ascending: true, nullsFirst: false })

      if (error) { console.error(error); setLoading(false); return }
      setCities((data ?? []) as CityRow[])
      setLoading(false)
    }
    fetchCities()
  }, [])

  const formatDate = (s: string | null) => {
    if (!s) return '—'
    return new Date(s).toLocaleDateString(undefined, { year: 'numeric', month: 'short' })
  }

  const formatPrice = (priceCAD: number | null) => {
    if (!priceCAD || priceCAD <= 0) return 'Pending'
    const rate = rates[currency] ?? 1
    const symbol = symbols[currency] ?? 'CA$'
    const val = priceCAD * rate
    return `${symbol}${val.toLocaleString(undefined, {
      minimumFractionDigits: val >= 100 ? 0 : 2,
      maximumFractionDigits: val >= 100 ? 0 : 2,
    })}`
  }

  const rentBurden = (city: CityRow): number | null => {
    if (!city.median_rent_1br_cad || !city.median_monthly_salary_cad || city.median_monthly_salary_cad <= 0) return null
    return Math.round((city.median_rent_1br_cad / city.median_monthly_salary_cad) * 100)
  }

  const burdenColor = (pct: number) => {
    if (pct <= 45) return '#2d7a4f'
    if (pct <= 65) return '#b8720d'
    return '#c0392b'
  }

  const cleanCities = cities.filter(c => c.price_cad != null && Number(c.price_cad) > 0)
  const pendingCities = cities.filter(c => !c.price_cad || Number(c.price_cad) <= 0)

  const maxPrice = cleanCities.length ? (cleanCities[cleanCities.length - 1].price_cad ?? 25) : 25

  const regions = useMemo(() => {
    const seen = new Set<string>()
    cleanCities.forEach(c => { if (c.region) seen.add(c.region) })
    return ['All', ...Array.from(seen).sort()]
  }, [cleanCities])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return cleanCities.filter(c => {
      const matchRegion = selectedRegion === 'All' || c.region === selectedRegion
      const matchSearch = !q || c.city.toLowerCase().includes(q) || (c.country ?? '').toLowerCase().includes(q)
      return matchRegion && matchSearch
    })
  }, [cleanCities, search, selectedRegion])

  const cheapest = cleanCities[0]
  const priciest = cleanCities[cleanCities.length - 1]

  return (
    <main style={{ fontFamily: 'DM Sans, sans-serif', background: '#FAFAF8', minHeight: '100vh', color: '#1a1a18', overflowX: 'hidden' }}>

      <nav style={{
        display: 'flex', flexDirection: isMobile ? 'column' : 'row',
        justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'center',
        gap: isMobile ? '0.9rem' : 0,
        padding: isMobile ? '1rem 1.25rem' : '1.25rem 2.5rem',
        borderBottom: '0.5px solid #e5e3da',
      }}>
        <a href="/" style={{ fontFamily: 'DM Serif Display, serif', fontSize: 18, color: '#1a1a18', textDecoration: 'none' }}>
          fried rice <span style={{ color: '#C25E1E' }}>index</span>
        </a>
        <div style={{ display: 'flex', gap: isMobile ? '1rem' : '2rem', flexWrap: 'wrap' }}>
          {[['cities', '/cities'], ['submit', '/submit'], ['about', '/about'], ['methodology', '/methodology']].map(([l, h]) => (
            <a key={h} href={h} style={{ fontSize: 13, color: l === 'cities' ? '#1a1a18' : '#6b6b64', textDecoration: 'none', fontWeight: l === 'cities' ? 500 : 400 }}>{l}</a>
          ))}
        </div>
      </nav>

      <section style={{ maxWidth: 1120, margin: '0 auto', padding: isMobile ? '2.5rem 1.25rem' : '4rem 1.5rem' }}>

        <p style={eyebrowStyle}>Cities</p>
        <h1 style={{ fontFamily: 'DM Serif Display, serif', fontSize: isMobile ? 36 : 48, lineHeight: 1.05, letterSpacing: isMobile ? -0.8 : -1.5, margin: '0 0 1rem' }}>
          Fried rice prices by city.
        </h1>
        <p style={{ fontSize: isMobile ? 14 : 15, color: '#6b6b64', lineHeight: 1.7, maxWidth: 680, marginBottom: '2rem' }}>
          Cities ranked cheapest to most expensive by baseline fried rice price — the median of all basic and vegetable entries in each city.
        </p>

        {/* Stat cards */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)', gap: '0.9rem', marginBottom: '2rem' }}>
          <div style={statCard}>
            <p style={statLabel}>Cities indexed</p>
            <p style={statValue}>{cleanCities.length}</p>
          </div>
          <div style={statCard}>
            <p style={statLabel}>Cheapest baseline</p>
            <p style={{ ...statValue, fontSize: 20 }}>
              {cheapest ? `${cheapest.flag ?? ''} ${cheapest.city}` : '—'}
            </p>
            <p style={{ fontSize: 12, color: '#C25E1E', margin: 0 }}>{cheapest ? formatPrice(cheapest.price_cad) : ''}</p>
          </div>
          <div style={statCard}>
            <p style={statLabel}>Most expensive</p>
            <p style={{ ...statValue, fontSize: 20 }}>
              {priciest ? `${priciest.flag ?? ''} ${priciest.city}` : '—'}
            </p>
            <p style={{ fontSize: 12, color: '#C25E1E', margin: 0 }}>{priciest ? formatPrice(priciest.price_cad) : ''}</p>
          </div>
          <div style={statCard}>
            <p style={statLabel}>Price spread</p>
            <p style={{ ...statValue, fontSize: 20 }}>
              {cheapest && priciest ? `${(( priciest.price_cad ?? 1) / (cheapest.price_cad ?? 1)).toFixed(1)}×` : '—'}
            </p>
            <p style={{ fontSize: 12, color: '#9b9b90', margin: 0 }}>cheapest vs priciest</p>
          </div>
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center', marginBottom: '1.25rem', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center', flex: 1 }}>
            {/* Search */}
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 13, color: '#9b9b90', pointerEvents: 'none' }}>🔍</span>
              <input
                type="text"
                placeholder="Search city or country…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{
                  paddingLeft: 30, paddingRight: 12, paddingTop: 8, paddingBottom: 8,
                  border: '0.5px solid #e5e3da', borderRadius: 10, background: '#fff',
                  fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#1a1a18',
                  outline: 'none', width: isMobile ? '100%' : 220,
                }}
              />
            </div>

            {/* Region filter */}
            {!isMobile && (
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {regions.map(r => (
                  <button
                    key={r}
                    onClick={() => setSelectedRegion(r)}
                    style={{
                      padding: '5px 12px', borderRadius: 20, fontSize: 12, cursor: 'pointer',
                      border: selectedRegion === r ? '0.5px solid #C25E1E' : '0.5px solid #e5e3da',
                      background: selectedRegion === r ? '#fff5ef' : '#fff',
                      color: selectedRegion === r ? '#C25E1E' : '#6b6b64',
                      fontFamily: 'DM Sans, sans-serif', fontWeight: selectedRegion === r ? 500 : 400,
                      transition: 'all 0.15s',
                    }}
                  >
                    {r}
                  </button>
                ))}
              </div>
            )}

            {/* Mobile region dropdown */}
            {isMobile && (
              <select
                value={selectedRegion}
                onChange={e => setSelectedRegion(e.target.value)}
                style={{ padding: '8px 12px', border: '0.5px solid #e5e3da', borderRadius: 10, background: '#fff', fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#1a1a18' }}
              >
                {regions.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              style={{ padding: '8px 12px', border: '0.5px solid #e5e3da', borderRadius: 10, background: '#fff', fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#1a1a18', cursor: 'pointer' }}
            >
              {currencyOptions.map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>

            <a
              href="/api/download-report"
              download
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '8px 14px', background: '#1a1a18', color: '#fff', borderRadius: 10, fontSize: 12, fontWeight: 500, textDecoration: 'none', whiteSpace: 'nowrap' }}
            >
              <svg width="12" height="12" viewBox="0 0 13 13" fill="none"><path d="M6.5 1v7M3.5 5.5l3 3 3-3M2 10.5h9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
              Download
            </a>
          </div>
        </div>

        {/* Result count */}
        {(search || selectedRegion !== 'All') && (
          <p style={{ fontSize: 12, color: '#9b9b90', marginBottom: '0.75rem' }}>
            Showing {filtered.length} of {cleanCities.length} cities
            {selectedRegion !== 'All' ? ` in ${selectedRegion}` : ''}
            {search ? ` matching "${search}"` : ''}
            {(search || selectedRegion !== 'All') && (
              <button
                onClick={() => { setSearch(''); setSelectedRegion('All') }}
                style={{ marginLeft: 8, background: 'none', border: 'none', color: '#C25E1E', cursor: 'pointer', fontSize: 12, fontFamily: 'DM Sans, sans-serif', padding: 0 }}
              >
                Clear filters
              </button>
            )}
          </p>
        )}

        {loading ? (
          <p style={{ color: '#6b6b64' }}>Loading cities...</p>
        ) : (
          <>
            <div style={{ background: '#fff', border: '0.5px solid #e5e3da', borderRadius: 16, overflow: 'hidden' }}>

              {/* Desktop header */}
              {!isMobile && (
                <div style={{ display: 'grid', gridTemplateColumns: '52px 2fr 0.85fr 1.3fr 0.7fr 0.9fr 0.8fr', gap: '0.75rem', padding: '0.9rem 1rem', borderBottom: '0.5px solid #f0ede6', fontSize: 10, textTransform: 'uppercase', letterSpacing: '1.1px', color: '#9b9b90' }}>
                  <div>Rank</div>
                  <div>City</div>
                  <div>Baseline</div>
                  <div>Relative cost</div>
                  <div>Rent burden</div>
                  <div>Data quality</div>
                  <div>Updated</div>
                </div>
              )}

              {filtered.length === 0 && (
                <div style={{ padding: '2rem 1rem', color: '#6b6b64', fontSize: 14, textAlign: 'center' }}>
                  No cities match your search.
                </div>
              )}

              {filtered.map((city, index) => {
                const cityHref = `/cities/${slugifyCity(city.city)}`
                const burden = rentBurden(city)
                const rank = cleanCities.indexOf(city) + 1

                return isMobile ? (
                  <a
                    key={city.city}
                    href={cityHref}
                    style={{ display: 'block', padding: '1rem', borderBottom: index === filtered.length - 1 ? 'none' : '0.5px solid #f0ede6', textDecoration: 'none', color: 'inherit' }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'flex-start' }}>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: 11, color: '#9b9b90', margin: '0 0 0.2rem' }}>#{rank}</p>
                        <h2 style={{ fontFamily: 'DM Serif Display, serif', fontSize: 22, margin: 0 }}>
                          {city.flag ? `${city.flag} ` : ''}{city.city}
                        </h2>
                        <p style={{ fontSize: 12, color: '#9b9b90', margin: '0.2rem 0 0' }}>
                          {[city.region, city.country].filter(Boolean).join(', ')}
                        </p>
                        {city.population && (
                          <p style={{ fontSize: 12, color: '#9b9b90', margin: '0.15rem 0 0' }}>
                            {Number(city.population).toLocaleString()} people
                          </p>
                        )}
                        {burden !== null && (
                          <p style={{ fontSize: 12, margin: '0.35rem 0 0', color: burdenColor(burden) }}>
                            {burden}% rent burden
                          </p>
                        )}
                      </div>
                      <div>
                        <div style={{ fontFamily: 'DM Serif Display, serif', fontSize: 22, color: '#C25E1E', whiteSpace: 'nowrap', textAlign: 'right' }}>
                          {formatPrice(city.price_cad)}
                        </div>
                        {/* Mini price bar */}
                        <div style={{ marginTop: 6, width: 80, height: 3, borderRadius: 2, background: '#f0ede6' }}>
                          <div style={{ height: '100%', width: `${((city.price_cad ?? 0) / maxPrice) * 100}%`, background: priceBarColor(city.price_cad ?? 0, maxPrice), borderRadius: 2 }} />
                        </div>
                      </div>
                    </div>
                  </a>
                ) : (
                  <a
                    key={city.city}
                    href={cityHref}
                    onMouseEnter={() => setHoveredCity(city.city)}
                    onMouseLeave={() => setHoveredCity(null)}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '52px 2fr 0.85fr 1.3fr 0.7fr 0.9fr 0.8fr',
                      gap: '0.75rem',
                      padding: '0.9rem 1rem',
                      borderBottom: index === filtered.length - 1 ? 'none' : '0.5px solid #f0ede6',
                      alignItems: 'center',
                      textDecoration: 'none',
                      color: 'inherit',
                      background: hoveredCity === city.city ? '#fafaf8' : '#fff',
                      transition: 'background 0.1s',
                    }}
                  >
                    {/* Rank */}
                    <div style={{ fontSize: 13, color: '#9b9b90', fontVariantNumeric: 'tabular-nums' }}>#{rank}</div>

                    {/* City */}
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {city.flag && <span style={{ fontSize: 18, lineHeight: 1 }}>{city.flag}</span>}
                        <span style={{ fontFamily: 'DM Serif Display, serif', fontSize: 20 }}>{city.city}</span>
                      </div>
                      <p style={{ fontSize: 11, color: '#9b9b90', margin: '0.2rem 0 0' }}>
                        {[city.region, city.country].filter(Boolean).join(' · ')}
                        {city.population ? ` · ${Number(city.population).toLocaleString()}` : ''}
                      </p>
                    </div>

                    {/* Baseline price */}
                    <div style={{ fontFamily: 'DM Serif Display, serif', fontSize: 20, color: '#C25E1E' }}>
                      {formatPrice(city.price_cad)}
                    </div>

                    {/* Price bar */}
                    <div>
                      <div style={{ height: 5, borderRadius: 3, background: '#f0ede6', overflow: 'hidden', maxWidth: 160 }}>
                        <div style={{
                          height: '100%',
                          width: `${((city.price_cad ?? 0) / maxPrice) * 100}%`,
                          background: priceBarColor(city.price_cad ?? 0, maxPrice),
                          borderRadius: 3,
                        }} />
                      </div>
                      <p style={{ fontSize: 11, color: '#9b9b90', margin: '4px 0 0' }}>
                        {priciest && city.price_cad && priciest.price_cad && city.city !== priciest.city
                          ? `${(priciest.price_cad / city.price_cad).toFixed(1)}× cheaper than ${priciest.city}`
                          : priciest && city.city === priciest.city ? 'Most expensive city' : ''}
                      </p>
                    </div>

                    {/* Rent burden */}
                    <div>
                      {burden !== null ? (
                        <>
                          <span style={{ fontSize: 14, fontWeight: 500, color: burdenColor(burden) }}>{burden}%</span>
                          <p style={{ fontSize: 10, color: '#9b9b90', margin: '2px 0 0' }}>of salary → rent</p>
                        </>
                      ) : (
                        <span style={{ fontSize: 13, color: '#c8c6be' }}>—</span>
                      )}
                    </div>

                    {/* Data quality */}
                    <div>
                      <span style={{ fontSize: 12, color: '#3a3a34' }}>{city.data_quality_label ?? '—'}</span>
                      <p style={{ fontSize: 10, color: '#9b9b90', margin: '2px 0 0' }}>{city.baseline_entry_count ?? '—'} BL · {city.market_entry_count ?? '—'} total</p>
                    </div>

                    {/* Updated */}
                    <div style={{ fontSize: 12, color: '#6b6b64' }}>{formatDate(city.price_updated_at)}</div>
                  </a>
                )
              })}
            </div>

            {pendingCities.length > 0 && (
              <div style={{ marginTop: '2rem', background: '#fff', border: '0.5px solid #e5e3da', borderRadius: 16, padding: '1.5rem' }}>
                <h2 style={{ fontFamily: 'DM Serif Display, serif', fontSize: 24, margin: '0 0 0.5rem' }}>Pending</h2>
                <p style={{ fontSize: 13, color: '#6b6b64', lineHeight: 1.6, marginBottom: '1rem' }}>
                  In the database but not yet indexed.
                </p>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {pendingCities.map((city) => (
                    <a
                      key={city.city}
                      href={`/cities/${slugifyCity(city.city)}`}
                      style={{ background: '#FAFAF8', border: '0.5px solid #e5e3da', borderRadius: 999, padding: '0.4rem 0.75rem', fontSize: 12, color: '#6b6b64', textDecoration: 'none' }}
                    >
                      {city.flag ? `${city.flag} ` : ''}{city.city}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </section>
    </main>
  )
}

const eyebrowStyle: React.CSSProperties = {
  fontSize: 11, fontWeight: 500, letterSpacing: '1.5px',
  textTransform: 'uppercase', color: '#C25E1E', marginBottom: '1rem',
}

const statCard: React.CSSProperties = {
  background: '#fff', border: '0.5px solid #e5e3da', borderRadius: 16, padding: '1.25rem',
}

const statLabel: React.CSSProperties = {
  fontSize: 10, textTransform: 'uppercase', letterSpacing: '1.2px',
  color: '#9b9b90', margin: '0 0 0.4rem',
}

const statValue: React.CSSProperties = {
  fontFamily: 'DM Serif Display, serif', fontSize: 28, color: '#1a1a18', margin: '0 0 0.25rem',
}
