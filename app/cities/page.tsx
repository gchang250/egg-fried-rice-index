'use client'

import { useEffect, useState, useMemo } from 'react'
import { Search, Download, Building2, X } from 'lucide-react'
import NavBar from '@/app/components/NavBar'
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
  if (p < 0.15) return '#76a98c'
  if (p < 0.35) return '#76a98c'
  if (p < 0.60) return '#c8a862'
  if (p < 0.82) return '#c8a862'
  return '#c0674e'
}

function burdenColor(pct: number): string {
  if (pct <= 45) return '#76a98c'
  if (pct <= 65) return '#c8a862'
  return '#c0674e'
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
    s ? new Date(s).toLocaleDateString(undefined, { year: 'numeric', month: 'short' }) : '-'

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
    <main style={{ fontFamily:'var(--font-body)', background:'var(--color-bg)', minHeight:'100vh', color:'var(--color-text-1)', overflowX:'hidden' }}>

      <NavBar active="cities" />

      <section style={{ maxWidth:1180, margin:'0 auto', padding: isMobile ? '2rem 1.25rem' : '3rem 2rem' }}>

        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:'0.75rem' }}>
          <Building2 size={14} color="var(--color-accent)" />
          <span style={{ fontSize:11, letterSpacing:'2.5px', textTransform:'uppercase', color:'var(--color-text-3)' }}>Cities</span>
        </div>
        <h1 style={{ fontFamily:'var(--font-display)', fontSize: isMobile ? 34 : 44, lineHeight:1.05, letterSpacing: isMobile ? -0.5 : -1, margin:'0 0 0.75rem', color:'var(--color-text-1)', fontWeight:400 }}>
          Fried rice prices by city.
        </h1>
        <p style={{ fontSize:14, color:'var(--color-text-2)', lineHeight:1.6, maxWidth:560, marginBottom:'2rem' }}>
          Ranked cheapest to most expensive. Baseline = median of basic and vegetable entries.
        </p>

        {/* Stat cards */}
        <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4,1fr)', gap:'1px', marginBottom:'2rem', border:'0.5px solid var(--color-border)', borderRadius:12, overflow:'hidden' }}>
          {[
            { label:'Cities indexed', val:String(cleanCities.length) },
            { label:'Cheapest', val: cheapest ? `${cheapest.flag ?? ''} ${cheapest.city}` : '-', sub: cheapest ? formatPrice(cheapest.price_cad) : null },
            { label:'Most expensive', val: priciest ? `${priciest.flag ?? ''} ${priciest.city}` : '-', sub: priciest ? formatPrice(priciest.price_cad) : null },
            { label:'Price spread', val: cheapest && priciest ? `${((priciest.price_cad??1)/(cheapest.price_cad??1)).toFixed(1)}×` : '-', sub:'cheapest vs priciest' },
          ].map(s => (
            <div key={s.label} style={{ background:'var(--color-surface)', padding:'1.1rem 1.5rem' }}>
              <p style={{ fontSize:10, textTransform:'uppercase', letterSpacing:'1.3px', color:'var(--color-text-3)', margin:'0 0 0.4rem' }}>{s.label}</p>
              <p style={{ fontFamily:'var(--font-display)', fontSize:s.label==='Cities indexed'||s.label==='Price spread'?28:17, color:'var(--color-text-1)', margin:'0 0 0.2rem', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', fontWeight:400 }}>{s.val}</p>
              {s.sub && <p style={{ fontSize:12, color:'var(--color-accent)', margin:0 }}>{s.sub}</p>}
            </div>
          ))}
        </div>

        {/* Controls */}
        <div style={{ display:'flex', gap:'0.75rem', flexWrap:'wrap', alignItems:'center', marginBottom:'1rem', justifyContent:'space-between' }}>
          <div style={{ display:'flex', gap:'0.6rem', flexWrap:'wrap', alignItems:'center', flex:1 }}>
            <div style={{ position:'relative' }}>
              <Search size={13} style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:'var(--color-text-3)', pointerEvents:'none' }} />
              <input type="text" placeholder="Search city or country…" value={search} onChange={e => setSearch(e.target.value)}
                style={{ paddingLeft:32, paddingRight:12, paddingTop:7, paddingBottom:7, border:'0.5px solid var(--color-border)', borderRadius:8, background:'var(--color-surface)', fontFamily:'var(--font-body)', fontSize:13, color:'var(--color-text-1)', outline:'none', width: isMobile ? '100%' : 210 }} />
            </div>
            {!isMobile && (
              <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
                {regions.map(r => (
                  <button key={r} onClick={() => setSelectedRegion(r)} style={{ padding:'4px 10px', borderRadius:20, fontSize:12, cursor:'pointer', border: selectedRegion===r ? '0.5px solid var(--color-accent)' : '0.5px solid var(--color-border)', background: selectedRegion===r ? 'var(--color-accent-dim)' : 'var(--color-surface)', color: selectedRegion===r ? 'var(--color-accent)' : 'var(--color-text-3)', fontFamily:'var(--font-body)' }}>
                    {r}
                  </button>
                ))}
              </div>
            )}
            {isMobile && (
              <select value={selectedRegion} onChange={e => setSelectedRegion(e.target.value)} style={{ padding:'7px 12px', border:'0.5px solid var(--color-border)', borderRadius:8, background:'var(--color-surface)', fontFamily:'var(--font-body)', fontSize:13, color:'var(--color-text-1)' }}>
                {regions.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            )}
          </div>

          <div style={{ display:'flex', alignItems:'center', gap:'0.6rem', flexShrink:0 }}>
            <select value={currency} onChange={e => setCurrency(e.target.value)} style={{ padding:'7px 12px', border:'0.5px solid var(--color-border)', borderRadius:8, background:'var(--color-surface)', fontFamily:'var(--font-body)', fontSize:13, color:'var(--color-text-1)', cursor:'pointer' }}>
              {currencyOptions.map(([v,l]) => <option key={v} value={v}>{l}</option>)}
            </select>
            <a href="/api/download-report" download style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'7px 14px', background:'var(--color-surface)', color:'var(--color-text-2)', borderRadius:8, fontSize:12, textDecoration:'none', whiteSpace:'nowrap', border:'0.5px solid var(--color-border)' }}>
              <Download size={12} /> Export
            </a>
          </div>
        </div>

        {(search || selectedRegion !== 'All') && (
          <p style={{ fontSize:12, color:'var(--color-text-3)', marginBottom:'0.75rem', display:'flex', alignItems:'center', gap:6 }}>
            {filtered.length} of {cleanCities.length} cities
            {selectedRegion !== 'All' ? ` in ${selectedRegion}` : ''}
            {search ? ` matching "${search}"` : ''}
            <button onClick={() => { setSearch(''); setSelectedRegion('All') }} style={{ background:'none', border:'none', color:'var(--color-accent)', cursor:'pointer', fontSize:12, fontFamily:'var(--font-body)', padding:0, display:'inline-flex', alignItems:'center', gap:3 }}>
              <X size={11} /> Clear
            </button>
          </p>
        )}

        {loading ? (
          <p style={{ color:'var(--color-text-3)', padding:'2rem 0' }}>Loading cities…</p>
        ) : (
          <div style={{ background:'var(--color-surface)', border:'0.5px solid var(--color-border)', borderRadius:12, overflow:'hidden' }}>
            {!isMobile && (
              <div style={{ display:'grid', gridTemplateColumns:'52px 2fr 0.85fr 1.3fr 0.7fr 0.9fr 0.8fr', gap:'0.75rem', padding:'0.75rem 1rem', borderBottom:'0.5px solid var(--color-border)', fontSize:9, textTransform:'uppercase', letterSpacing:'1.2px', color:'var(--color-text-3)' }}>
                <div>Rank</div><div>City</div><div>Baseline</div><div>Relative cost</div><div>Rent burden</div><div>Quality</div><div>Updated</div>
              </div>
            )}

            {filtered.length === 0 && (
              <div style={{ padding:'2rem 1rem', color:'var(--color-text-3)', fontSize:14, textAlign:'center' }}>No cities match your search.</div>
            )}

            {filtered.map((city, index) => {
              const href = `/cities/${slugifyCity(city.city)}`
              const burden = rentBurden(city)
              const rank = cleanCities.indexOf(city) + 1
              const isLast = index === filtered.length - 1

              return isMobile ? (
                <a key={city.city} href={href} style={{ display:'block', padding:'1rem 1.25rem', borderBottom: isLast ? 'none' : '0.5px solid var(--color-border)', textDecoration:'none', color:'inherit' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', gap:'1rem', alignItems:'flex-start' }}>
                    <div style={{ flex:1 }}>
                      <p style={{ fontSize:11, color:'var(--color-text-3)', margin:'0 0 0.2rem' }}>#{rank}</p>
                      <h2 style={{ fontFamily:'var(--font-display)', fontSize:22, margin:0, color:'var(--color-text-1)', fontWeight:400 }}>
                        {city.flag ? `${city.flag} ` : ''}{city.city}
                      </h2>
                      <p style={{ fontSize:12, color:'var(--color-text-3)', margin:'0.2rem 0 0' }}>{[city.region, city.country].filter(Boolean).join(', ')}</p>
                      {burden !== null && <p style={{ fontSize:12, margin:'0.35rem 0 0', color: burdenColor(burden) }}>{burden}% rent burden</p>}
                    </div>
                    <div style={{ textAlign:'right' }}>
                      <div style={{ fontFamily:'var(--font-display)', fontSize:22, color:'var(--color-accent)', whiteSpace:'nowrap', fontWeight:400 }}>{formatPrice(city.price_cad)}</div>
                      <div style={{ marginTop:6, width:80, height:3, borderRadius:2, background:'var(--color-border)' }}>
                        <div style={{ height:'100%', width:`${((city.price_cad??0)/maxPrice)*100}%`, background:barColor(city.price_cad??0,maxPrice), borderRadius:2 }} />
                      </div>
                    </div>
                  </div>
                </a>
              ) : (
                <a key={city.city} href={href}
                  onMouseEnter={() => setHoveredCity(city.city)}
                  onMouseLeave={() => setHoveredCity(null)}
                  style={{ display:'grid', gridTemplateColumns:'52px 2fr 0.85fr 1.3fr 0.7fr 0.9fr 0.8fr', gap:'0.75rem', padding:'0.8rem 1rem', borderBottom: isLast ? 'none' : '0.5px solid var(--color-border)', alignItems:'center', textDecoration:'none', color:'inherit', background: hoveredCity===city.city ? 'var(--color-surface-2)' : 'var(--color-surface)', transition:'background 0.1s' }}>

                  <div style={{ fontSize:12, color:'var(--color-text-3)' }}>#{rank}</div>

                  <div>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      {city.flag && <span style={{ fontSize:17, lineHeight:1 }}>{city.flag}</span>}
                      <span style={{ fontFamily:'var(--font-display)', fontSize:18, color:'var(--color-text-1)', fontWeight:400 }}>{city.city}</span>
                    </div>
                    <p style={{ fontSize:11, color:'var(--color-text-3)', margin:'0.15rem 0 0' }}>
                      {[city.region, city.country].filter(Boolean).join(' · ')}{city.population ? ` · ${Number(city.population).toLocaleString()}` : ''}
                    </p>
                  </div>

                  <div style={{ fontFamily:'var(--font-display)', fontSize:18, color:'var(--color-accent)', fontWeight:400 }}>{formatPrice(city.price_cad)}</div>

                  <div>
                    <div style={{ height:4, borderRadius:2, background:'var(--color-border)', overflow:'hidden', maxWidth:160 }}>
                      <div style={{ height:'100%', width:`${((city.price_cad??0)/maxPrice)*100}%`, background:barColor(city.price_cad??0,maxPrice), borderRadius:2 }} />
                    </div>
                    <p style={{ fontSize:10, color:'var(--color-text-3)', margin:'4px 0 0' }}>
                      {priciest && city.price_cad && priciest.price_cad && city.city !== priciest.city
                        ? `${(priciest.price_cad/city.price_cad).toFixed(1)}× cheaper than ${priciest.city}` : city.city === priciest?.city ? 'Most expensive' : ''}
                    </p>
                  </div>

                  <div>
                    {burden !== null ? (
                      <>
                        <span style={{ fontSize:13, fontWeight:500, color:burdenColor(burden) }}>{burden}%</span>
                        <p style={{ fontSize:10, color:'var(--color-text-3)', margin:'2px 0 0' }}>of salary</p>
                      </>
                    ) : <span style={{ fontSize:13, color:'var(--color-text-4)' }}>-</span>}
                  </div>

                  <div>
                    <span style={{ fontSize:12, color:'var(--color-text-2)' }}>{city.data_quality_label ?? '-'}</span>
                    <p style={{ fontSize:10, color:'var(--color-text-3)', margin:'2px 0 0' }}>{city.baseline_entry_count ?? '-'} BL · {city.market_entry_count ?? '-'} total</p>
                  </div>

                  <div style={{ fontSize:12, color:'var(--color-text-2)' }}>{formatDate(city.price_updated_at)}</div>
                </a>
              )
            })}
          </div>
        )}
      </section>
    </main>
  )
}
