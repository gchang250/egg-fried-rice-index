'use client'

import { useEffect, useState, useMemo } from 'react'
import { supabase } from '@/lib/supabase'

const FALLBACK_RATES: Record<string, number> = {
  CAD: 1, USD: 0.73, EUR: 0.68, CHF: 0.66, GBP: 0.58,
  JPY: 107.5, CNY: 5.3, AUD: 1.13, HKD: 5.72, SGD: 0.99,
  SAR: 2.74, PHP: 41.2, MYR: 3.18, MXN: 14.6, ARS: 720.0,
  KRW: 1001.0, INR: 60.8, AED: 2.68,
}
const symbols: Record<string, string> = {
  CAD: 'CA$', USD: 'US$', EUR: '€', CHF: 'Fr', GBP: '£', JPY: '¥', CNY: '¥',
  AUD: 'AU$', HKD: 'HK$', SGD: 'S$', SAR: '﷼', PHP: '₱', MYR: 'RM',
  MXN: 'MX$', ARS: 'AR$', KRW: '₩', INR: '₹', AED: 'د.إ',
}
const currencyOptions = Object.keys(FALLBACK_RATES).map(code => [code, `${symbols[code] ?? code} ${code}`])

type CityRow = {
  city: string; country: string | null; region: string | null; flag: string | null
  population: string | null; price_cad: number | null; price_updated_at: string | null
  confidence_score: number | null; baseline_entry_count: number | null
  market_entry_count: number | null; data_quality_label: string | null
  median_rent_1br_cad: number | null; median_monthly_salary_cad: number | null
}

function slugifyCity(city: string) {
  return city.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

// Color based on relative position in the price range
function barColor(price: number, max: number): string {
  const p = price / max
  if (p < 0.15) return '#34a85a'
  if (p < 0.35) return '#5bbf7a'
  if (p < 0.60) return '#c4890f'
  if (p < 0.82) return '#d9682a'
  return '#b83418'
}

function burdenColor(pct: number): string {
  if (pct <= 45) return '#34a85a'
  if (pct <= 65) return '#c4890f'
  return '#c04030'
}

export default function CitiesPage() {
  const [cities, setCities]               = useState<CityRow[]>([])
  const [loading, setLoading]             = useState(true)
  const [currency, setCurrency]           = useState('CAD')
  const [isMobile, setIsMobile]           = useState(false)
  const [rates, setRates]                 = useState<Record<string, number>>(FALLBACK_RATES)
  const [search, setSearch]               = useState('')
  const [selectedRegion, setSelectedRegion] = useState('All')
  const [hoveredCity, setHoveredCity]     = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/exchange-rates').then(r => r.json()).then(d => { if (d?.CAD) setRates(d) }).catch(() => {})
  }, [])

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check(); window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  useEffect(() => {
    async function fetchCities() {
      setLoading(true)
      const { data, error } = await supabase.from('cities').select(`
        city, country, region, flag, population, price_cad, price_updated_at,
        confidence_score, baseline_entry_count, market_entry_count, data_quality_label,
        median_rent_1br_cad, median_monthly_salary_cad
      `).order('price_cad', { ascending: true, nullsFirst: false })
      if (error) { setLoading(false); return }
      setCities((data ?? []) as CityRow[])
      setLoading(false)
    }
    fetchCities()
  }, [])

  const formatDate = (s: string | null) =>
    s ? new Date(s).toLocaleDateString(undefined, { year: 'numeric', month: 'short' }) : '—'

  const formatPrice = (cad: number | null) => {
    if (!cad || cad <= 0) return 'Pending'
    const rate = rates[currency] ?? 1
    const sym = symbols[currency] ?? 'CA$'
    const val = cad * rate
    return `${sym}${val.toLocaleString(undefined, { minimumFractionDigits: val >= 100 ? 0 : 2, maximumFractionDigits: val >= 100 ? 0 : 2 })}`
  }

  const rentBurden = (c: CityRow): number | null => {
    if (!c.median_rent_1br_cad || !c.median_monthly_salary_cad || c.median_monthly_salary_cad <= 0) return null
    return Math.round((c.median_rent_1br_cad / c.median_monthly_salary_cad) * 100)
  }

  const cleanCities = cities.filter(c => c.price_cad != null && Number(c.price_cad) > 0)
  const maxPrice = cleanCities.length ? (cleanCities[cleanCities.length - 1].price_cad ?? 25) : 25
  const cheapest = cleanCities[0]
  const priciest = cleanCities[cleanCities.length - 1]

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

  return (
    <main style={{ fontFamily: 'DM Sans, sans-serif', background: '#0c0f0d', minHeight: '100vh', color: '#e8e4dc', overflowX: 'hidden' }}>

      <nav style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'center', gap: isMobile ? '0.9rem' : 0, padding: isMobile ? '1rem 1.25rem' : '1.1rem 2rem', borderBottom: '0.5px solid #1e261e' }}>
        <a href="/" style={{ fontFamily: 'DM Serif Display, serif', fontSize: 17, color: '#e8e4dc', textDecoration: 'none' }}>
          fried rice <span style={{ color: '#d9682a' }}>index</span>
        </a>
        <div style={{ display: 'flex', gap: isMobile ? '1rem' : '1.75rem' }}>
          {[['cities', '/cities'], ['submit', '/submit'], ['about', '/about'], ['methodology', '/methodology']].map(([l, h]) => (
            <a key={h} href={h} style={{ fontSize: 13, color: l === 'cities' ? '#e8e4dc' : '#5a5a52', textDecoration: 'none', fontWeight: l === 'cities' ? 500 : 400 }}>{l}</a>
          ))}
        </div>
      </nav>

      <section style={{ maxWidth: 1160, margin: '0 auto', padding: isMobile ? '2rem 1.25rem' : '3rem 2rem' }}>

        <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: '1.5px', textTransform: 'uppercase', color: '#d9682a', marginBottom: '0.75rem' }}>Cities</p>
        <h1 style={{ fontFamily: 'DM Serif Display, serif', fontSize: isMobile ? 34 : 44, lineHeight: 1.05, letterSpacing: isMobile ? -0.5 : -1, margin: '0 0 0.75rem', color: '#f0ece4' }}>
          Fried rice prices by city.
        </h1>
        <p style={{ fontSize: isMobile ? 13 : 14, color: '#4a4a42', lineHeight: 1.6, maxWidth: 620, marginBottom: '2rem' }}>
          Ranked cheapest to most expensive. Baseline = median of all basic and vegetable entries.
        </p>

        {/* Stat cards */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)', gap: '0.75rem', marginBottom: '2rem' }}>
          {[
            { label: 'CITIES INDEXED', val: String(cleanCities.length), sub: null },
            { label: 'CHEAPEST', val: cheapest ? `${cheapest.flag ?? ''} ${cheapest.city}` : '—', sub: cheapest ? formatPrice(cheapest.price_cad) : null },
            { label: 'MOST EXPENSIVE', val: priciest ? `${priciest.flag ?? ''} ${priciest.city}` : '—', sub: priciest ? formatPrice(priciest.price_cad) : null },
            { label: 'PRICE SPREAD', val: cheapest && priciest ? `${((priciest.price_cad ?? 1) / (cheapest.price_cad ?? 1)).toFixed(1)}×` : '—', sub: 'cheapest vs priciest' },
          ].map(s => (
            <div key={s.label} style={{ background: '#141714', border: '0.5px solid #1e261e', borderRadius: 14, padding: '1.1rem 1.25rem' }}>
              <p style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '1.3px', color: '#3a3a32', margin: '0 0 0.45rem' }}>{s.label}</p>
              <p style={{ fontFamily: 'DM Serif Display, serif', fontSize: s.label === 'CITIES INDEXED' || s.label === 'PRICE SPREAD' ? 30 : 18, color: '#f0ece4', margin: '0 0 0.2rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.val}</p>
              {s.sub && <p style={{ fontSize: 12, color: '#d9682a', margin: 0 }}>{s.sub}</p>}
            </div>
          ))}
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center', marginBottom: '1rem', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', alignItems: 'center', flex: 1 }}>
            {/* Search */}
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 12, color: '#3a3a32', pointerEvents: 'none' }}>🔍</span>
              <input
                type="text" placeholder="Search city or country…" value={search} onChange={e => setSearch(e.target.value)}
                style={{ paddingLeft: 30, paddingRight: 12, paddingTop: 8, paddingBottom: 8, border: '0.5px solid #1e261e', borderRadius: 10, background: '#141714', fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#e8e4dc', outline: 'none', width: isMobile ? '100%' : 210 }}
              />
            </div>
            {/* Region pills (desktop) */}
            {!isMobile && (
              <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                {regions.map(r => (
                  <button key={r} onClick={() => setSelectedRegion(r)} style={{ padding: '5px 11px', borderRadius: 20, fontSize: 12, cursor: 'pointer', border: selectedRegion === r ? '0.5px solid #d9682a' : '0.5px solid #1e261e', background: selectedRegion === r ? '#1e1a14' : '#141714', color: selectedRegion === r ? '#d9682a' : '#5a5a52', fontFamily: 'DM Sans, sans-serif', fontWeight: selectedRegion === r ? 500 : 400 }}>
                    {r}
                  </button>
                ))}
              </div>
            )}
            {/* Region dropdown (mobile) */}
            {isMobile && (
              <select value={selectedRegion} onChange={e => setSelectedRegion(e.target.value)} style={{ padding: '8px 12px', border: '0.5px solid #1e261e', borderRadius: 10, background: '#141714', fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#e8e4dc' }}>
                {regions.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexShrink: 0 }}>
            <select value={currency} onChange={e => setCurrency(e.target.value)} style={{ padding: '8px 12px', border: '0.5px solid #1e261e', borderRadius: 10, background: '#141714', fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#e8e4dc', cursor: 'pointer' }}>
              {currencyOptions.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
            <a href="/api/download-report" download style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '8px 14px', background: '#1e261e', color: '#8a8a82', borderRadius: 10, fontSize: 12, fontWeight: 500, textDecoration: 'none', whiteSpace: 'nowrap', border: '0.5px solid #2a3a2a' }}>
              <svg width="12" height="12" viewBox="0 0 13 13" fill="none"><path d="M6.5 1v7M3.5 5.5l3 3 3-3M2 10.5h9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
              Download
            </a>
          </div>
        </div>

        {/* Result count */}
        {(search || selectedRegion !== 'All') && (
          <p style={{ fontSize: 12, color: '#3a3a32', marginBottom: '0.75rem' }}>
            Showing {filtered.length} of {cleanCities.length} cities
            {selectedRegion !== 'All' ? ` in ${selectedRegion}` : ''}
            {search ? ` matching "${search}"` : ''}
            {' '}<button onClick={() => { setSearch(''); setSelectedRegion('All') }} style={{ background: 'none', border: 'none', color: '#d9682a', cursor: 'pointer', fontSize: 12, fontFamily: 'DM Sans, sans-serif', padding: 0 }}>Clear</button>
          </p>
        )}

        {loading ? (
          <p style={{ color: '#3a3a32' }}>Loading cities…</p>
        ) : (
          <div style={{ background: '#141714', border: '0.5px solid #1e261e', borderRadius: 16, overflow: 'hidden' }}>

            {/* Desktop header */}
            {!isMobile && (
              <div style={{ display: 'grid', gridTemplateColumns: '52px 2fr 0.85fr 1.3fr 0.7fr 0.9fr 0.8fr', gap: '0.75rem', padding: '0.85rem 1rem', borderBottom: '0.5px solid #1e261e', fontSize: 9, textTransform: 'uppercase', letterSpacing: '1.2px', color: '#3a3a32' }}>
                <div>Rank</div><div>City</div><div>Baseline</div><div>Relative cost</div><div>Rent burden</div><div>Data quality</div><div>Updated</div>
              </div>
            )}

            {filtered.length === 0 && (
              <div style={{ padding: '2rem 1rem', color: '#3a3a32', fontSize: 14, textAlign: 'center' }}>No cities match your search.</div>
            )}

            {filtered.map((city, index) => {
              const href = `/cities/${slugifyCity(city.city)}`
              const burden = rentBurden(city)
              const rank = cleanCities.indexOf(city) + 1
              const isLast = index === filtered.length - 1

              return isMobile ? (
                <a key={city.city} href={href} style={{ display: 'block', padding: '1rem', borderBottom: isLast ? 'none' : '0.5px solid #1a221a', textDecoration: 'none', color: 'inherit' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 11, color: '#3a3a32', margin: '0 0 0.2rem' }}>#{rank}</p>
                      <h2 style={{ fontFamily: 'DM Serif Display, serif', fontSize: 22, margin: 0, color: '#f0ece4' }}>
                        {city.flag ? `${city.flag} ` : ''}{city.city}
                      </h2>
                      <p style={{ fontSize: 12, color: '#4a4a42', margin: '0.2rem 0 0' }}>
                        {[city.region, city.country].filter(Boolean).join(', ')}
                      </p>
                      {city.population && <p style={{ fontSize: 12, color: '#3a3a32', margin: '0.15rem 0 0' }}>{Number(city.population).toLocaleString()}</p>}
                      {burden !== null && <p style={{ fontSize: 12, margin: '0.35rem 0 0', color: burdenColor(burden) }}>{burden}% rent burden</p>}
                    </div>
                    <div>
                      <div style={{ fontFamily: 'DM Serif Display, serif', fontSize: 22, color: '#d9682a', whiteSpace: 'nowrap', textAlign: 'right' }}>{formatPrice(city.price_cad)}</div>
                      <div style={{ marginTop: 6, width: 80, height: 3, borderRadius: 2, background: '#1e261e' }}>
                        <div style={{ height: '100%', width: `${((city.price_cad ?? 0) / maxPrice) * 100}%`, background: barColor(city.price_cad ?? 0, maxPrice), borderRadius: 2 }} />
                      </div>
                    </div>
                  </div>
                </a>
              ) : (
                <a key={city.city} href={href}
                  onMouseEnter={() => setHoveredCity(city.city)}
                  onMouseLeave={() => setHoveredCity(null)}
                  style={{ display: 'grid', gridTemplateColumns: '52px 2fr 0.85fr 1.3fr 0.7fr 0.9fr 0.8fr', gap: '0.75rem', padding: '0.85rem 1rem', borderBottom: isLast ? 'none' : '0.5px solid #1a221a', alignItems: 'center', textDecoration: 'none', color: 'inherit', background: hoveredCity === city.city ? '#1a221a' : '#141714', transition: 'background 0.1s' }}>

                  <div style={{ fontSize: 12, color: '#3a3a32' }}>#{rank}</div>

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {city.flag && <span style={{ fontSize: 18, lineHeight: 1 }}>{city.flag}</span>}
                      <span style={{ fontFamily: 'DM Serif Display, serif', fontSize: 19, color: '#f0ece4' }}>{city.city}</span>
                    </div>
                    <p style={{ fontSize: 11, color: '#3a3a32', margin: '0.2rem 0 0' }}>
                      {[city.region, city.country].filter(Boolean).join(' · ')}{city.population ? ` · ${Number(city.population).toLocaleString()}` : ''}
                    </p>
                  </div>

                  <div style={{ fontFamily: 'DM Serif Display, serif', fontSize: 19, color: '#d9682a' }}>{formatPrice(city.price_cad)}</div>

                  <div>
                    <div style={{ height: 5, borderRadius: 3, background: '#1a221a', overflow: 'hidden', maxWidth: 160 }}>
                      <div style={{ height: '100%', width: `${((city.price_cad ?? 0) / maxPrice) * 100}%`, background: barColor(city.price_cad ?? 0, maxPrice), borderRadius: 3 }} />
                    </div>
                    <p style={{ fontSize: 10, color: '#3a3a32', margin: '4px 0 0' }}>
                      {priciest && city.price_cad && priciest.price_cad && city.city !== priciest.city
                        ? `${(priciest.price_cad / city.price_cad).toFixed(1)}× cheaper than ${priciest.city}` : city.city === priciest?.city ? 'Most expensive' : ''}
                    </p>
                  </div>

                  <div>
                    {burden !== null ? (
                      <>
                        <span style={{ fontSize: 14, fontWeight: 500, color: burdenColor(burden) }}>{burden}%</span>
                        <p style={{ fontSize: 10, color: '#3a3a32', margin: '2px 0 0' }}>salary → rent</p>
                      </>
                    ) : <span style={{ fontSize: 13, color: '#2a2a22' }}>—</span>}
                  </div>

                  <div>
                    <span style={{ fontSize: 12, color: '#8a8a82' }}>{city.data_quality_label ?? '—'}</span>
                    <p style={{ fontSize: 10, color: '#3a3a32', margin: '2px 0 0' }}>{city.baseline_entry_count ?? '—'} BL · {city.market_entry_count ?? '—'} total</p>
                  </div>

                  <div style={{ fontSize: 12, color: '#4a4a42' }}>{formatDate(city.price_updated_at)}</div>
                </a>
              )
            })}
          </div>
        )}
      </section>
    </main>
  )
}
