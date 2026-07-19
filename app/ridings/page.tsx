'use client'

import { useEffect, useState, useMemo } from 'react'
import { Search, Building2, X } from 'lucide-react'
import NavBar from '@/app/components/NavBar'
import { supabase } from '@/lib/supabase'
import { previewRent } from '@/lib/rent-preview'
import { estimateMonthlyTakeHome } from '@/lib/canada-tax'

type CityRow = {
  city: string; country: string | null; region: string | null; flag: string | null
  population: string | null; price_cad: number | null; price_updated_at: string | null
  confidence_score: number | null; baseline_entry_count: number | null
  market_entry_count: number | null; data_quality_label: string | null
  median_rent_1br_cad: number | null; median_monthly_salary_cad: number | null
  safety_index: number | null
  tech_salary_cad: number | null
  rent_data_source: string | null
}

function getNetDisposable(monthlyGross: number, monthlyRent: number, prov: string | null): number {
  const takeHome = estimateMonthlyTakeHome(monthlyGross, prov) ?? monthlyGross * 0.75
  return Math.round(takeHome - monthlyRent)
}

function getProxyName(source: string | null | undefined, city: string): string | null {
  if (!source) return null
  const m = source.match(/average one-bedroom rent for ([^(]+)/)
  if (!m) return null
  const name = m[1].trim().replace(/,\s*$/, '').split(',')[0]
  if (name.toLowerCase() !== city.toLowerCase()) {
    return name
  }
  return null
}

function slugifyCity(city: string) {
  return city.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

function barColor(price: number, max: number): string {
  const p = price / max
  if (p < 0.6) return 'var(--color-green)'
  if (p < 0.8) return 'var(--color-text-2)'
  return 'var(--color-accent)'
}

function burdenColor(pct: number): string {
  if (pct <= 35) return 'var(--color-green)'
  if (pct <= 50) return 'var(--color-text-2)'
  return 'var(--color-accent)'
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

export default function CitiesPage() {
  const [cities, setCities]               = useState<CityRow[]>([])
  const [loading, setLoading]             = useState(true)
  const [isMobile, setIsMobile]           = useState(false)
  const [search, setSearch]               = useState('')
  const [selectedProvince, setSelectedProvince] = useState('All')
  const [hoveredCity, setHoveredCity]     = useState<string | null>(null)
  const [profile, setProfile]             = useState<'single_renter' | 'family_homeowner'>('single_renter')
  
  // Comparison State
  const [compareA, setCompareA]           = useState('')
  const [compareB, setCompareB]           = useState('')

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const a = params.get('compareA')
      const b = params.get('compareB')
      if (a) setCompareA(a)
      if (b) setCompareB(b)
    }
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
        median_rent_1br_cad, median_monthly_salary_cad,
        safety_index, tech_salary_cad, rent_data_source
      `).order('price_cad', { ascending: true, nullsFirst: false })
      if (error) { setLoading(false); return }
      setCities(previewRent((data ?? []) as CityRow[]))
      setLoading(false)
    }
    fetchCities()
  }, [])

  const formatDate = (s: string | null) =>
    s ? new Date(s).toLocaleDateString(undefined, { year: 'numeric', month: 'short' }) : '-'

  const formatPrice = (cad: number | null) => {
    if (!cad || cad <= 0) return 'Pending'
    return `CA$${cad.toFixed(2)}`
  }

  const rentBurden = (c: CityRow): number | null => {
    if (!c.median_rent_1br_cad || !c.median_monthly_salary_cad || c.median_monthly_salary_cad <= 0) return null
    return Math.round((c.median_rent_1br_cad / c.median_monthly_salary_cad) * 100)
  }

  const bowlsAfterRent = (c: CityRow): number | null => {
    if (!c.median_rent_1br_cad || !c.median_monthly_salary_cad || !c.price_cad || c.price_cad <= 0) return null
    const remaining = c.median_monthly_salary_cad - c.median_rent_1br_cad
    return remaining > 0 ? Math.round(remaining / c.price_cad) : 0
  }

  const cleanCities = useMemo(() => {
    return cities.filter(c => c.median_rent_1br_cad != null && c.median_monthly_salary_cad != null)
      .map(c => {
        const isSingle = profile === 'single_renter'
        const rent = isSingle
          ? Number(c.median_rent_1br_cad)
          : Number(c.median_rent_1br_cad) * 1.65
        const salary = isSingle
          ? Number(c.median_monthly_salary_cad)
          : (c.tech_salary_cad != null ? Number(c.tech_salary_cad) : Number(c.median_monthly_salary_cad) * 1.5)

        const burden = Math.round((rent / salary) * 100)
        const disposable = getNetDisposable(salary, rent, c.region)
        return { 
          ...c, 
          burden, 
          disposable,
          rent_data_source: c.rent_data_source,
          median_rent_1br_cad: Math.round(rent),
          median_monthly_salary_cad: Math.round(salary)
        }
      })
      .sort((a, b) => a.burden - b.burden)
  }, [cities, profile])

  const cheapest = cleanCities[0]
  const priciest = cleanCities[cleanCities.length - 1]

  const provinces = useMemo(() => {
    const seen = new Set<string>()
    cleanCities.forEach(c => { if (c.region) seen.add(c.region) })
    return ['All', ...Array.from(seen).sort()]
  }, [cleanCities])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return cleanCities.filter(c => {
      const matchProvince = selectedProvince === 'All' || c.region === selectedProvince
      const matchSearch = !q || c.city.toLowerCase().includes(q) || (PROVINCE_NAMES[c.region ?? ''] ?? '').toLowerCase().includes(q)
      return matchProvince && matchSearch
    })
  }, [cleanCities, search, selectedProvince])

  return (
    <main style={{ fontFamily:'var(--font-body)', background:'var(--color-bg)', minHeight:'100vh', color:'var(--color-text-1)', overflowX:'hidden' }}>

      <NavBar active="cities" />

      <section style={{ maxWidth:1180, margin:'0 auto', padding: isMobile ? '2rem 1.25rem' : '3rem 2rem' }}>

        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:'0.75rem' }}>
          <Building2 size={14} color="var(--color-text-3)" />
          <span style={{ fontSize:11, color:'var(--color-text-3)' }}>Canadian Federal Ridings</span>
        </div>
        <h1 style={{ fontFamily:'var(--font-display)', fontSize: isMobile ? 32 : 44, lineHeight:1.05, letterSpacing: isMobile ? -0.5 : -1, margin:'0 0 0.75rem', color:'var(--color-text-1)', fontWeight:400 }}>
          Cost of living & housing burden by riding.
        </h1>
        <p style={{ fontSize:14, color:'var(--color-text-2)', lineHeight:1.6, maxWidth:560, marginBottom:'2rem' }}>
          Ranked by lowest rent burden. Metrics highlight the percentage of local median income consumed by a standard 1BR rental unit.
        </p>

        {/* Stat cards */}
        <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4,1fr)', gap:'1px', marginBottom:'2rem', border:'0.5px solid var(--color-border)', borderRadius:12, overflow:'hidden' }}>
          {[
            { label:'Ridings indexed', val:String(cleanCities.length) },
            { label:'Lowest rent burden', val: cheapest ? cheapest.city : '-', sub: cheapest ? `${PROVINCE_NAMES[cheapest.region ?? '']} (${cheapest.burden}%)` : null },
            { label:'Highest rent burden', val: priciest ? priciest.city : '-', sub: priciest ? `${PROVINCE_NAMES[priciest.region ?? '']} (${priciest.burden}%)` : null },
            { label:'National average burden', val: cleanCities.length ? `${Math.round(cleanCities.reduce((sum, c) => sum + c.burden, 0) / cleanCities.length)}%` : '-', sub:'average across Canada' },
          ].map(s => (
            <div key={s.label} style={{ background:'var(--color-surface)', padding:'1.1rem 1.5rem' }}>
              <p style={{ fontSize:11, color:'var(--color-text-3)', margin:'0 0 0.4rem' }}>{s.label}</p>
              <p style={{ fontFamily:'var(--font-display)', fontSize:s.label==='Ridings indexed'||s.label==='National average burden'?28:17, color:'var(--color-text-1)', margin:'0 0 0.2rem', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', fontWeight:400 }}>{s.val}</p>
              {s.sub && <p style={{ fontSize:12, color:'var(--color-accent)', margin:0 }}>{s.sub}</p>}
            </div>
          ))}
        </div>

        {/* Controls */}
        <div style={{ display:'flex', gap:'0.75rem', flexWrap:'wrap', alignItems:'center', marginBottom:'1.5rem', justifyContent:'space-between' }}>
          <div style={{ display:'flex', gap:'0.6rem', flexWrap:'wrap', alignItems:'center', flex:1 }}>
            <div style={{ position:'relative' }}>
              <Search size={13} style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:'var(--color-text-3)', pointerEvents:'none' }} />
              <input type="text" placeholder="Search city or province…" value={search} onChange={e => setSearch(e.target.value)}
                style={{ paddingLeft:32, paddingRight:12, paddingTop:7, paddingBottom:7, border:'0.5px solid var(--color-border)', borderRadius:8, background:'var(--color-surface)', fontFamily:'var(--font-body)', fontSize:13, color:'var(--color-text-1)', outline:'none', width: isMobile ? '100%' : 220 }} />
            </div>
            {!isMobile && (
              <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
                {provinces.map(prov => (
                  <button key={prov} onClick={() => setSelectedProvince(prov)} style={{ padding:'4px 10px', borderRadius:20, fontSize:12, cursor:'pointer', border: selectedProvince===prov ? '0.5px solid var(--color-accent)' : '0.5px solid var(--color-border)', background: selectedProvince===prov ? 'var(--color-accent-dim)' : 'var(--color-surface)', color: selectedProvince===prov ? 'var(--color-accent)' : 'var(--color-text-3)', fontFamily:'var(--font-body)' }}>
                    {prov === 'All' ? 'All Canada' : PROVINCE_NAMES[prov] || prov}
                  </button>
                ))}
              </div>
            )}
            {isMobile && (
              <select value={selectedProvince} onChange={e => setSelectedProvince(e.target.value)} style={{ padding:'7px 12px', border:'0.5px solid var(--color-border)', borderRadius:8, background:'var(--color-surface)', fontFamily:'var(--font-body)', fontSize:13, color:'var(--color-text-1)' }}>
                {provinces.map(prov => <option key={prov} value={prov}>{prov === 'All' ? 'All Canada' : PROVINCE_NAMES[prov] || prov}</option>)}
              </select>
            )}
          </div>

          <div style={{ display:'flex', alignItems:'center', gap:'0.6rem', flexShrink:0 }}>
            <div style={{ display: 'inline-flex', background: 'var(--color-surface-2)', padding: 3, borderRadius: 10, border: '0.5px solid var(--color-border)' }}>
              <button
                onClick={() => setProfile('single_renter')}
                style={{
                  border: 'none', background: profile === 'single_renter' ? 'var(--color-surface)' : 'none',
                  color: profile === 'single_renter' ? 'var(--color-text-1)' : 'var(--color-text-3)',
                  padding: '6px 12px', borderRadius: 8, fontSize: 11, fontWeight: 500, cursor: 'pointer',
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
                  padding: '6px 12px', borderRadius: 8, fontSize: 11, fontWeight: 500, cursor: 'pointer',
                  boxShadow: profile === 'family_homeowner' ? '0 2px 6px rgba(0,0,0,0.05)' : 'none',
                  transition: 'all 0.2s', fontFamily: 'var(--font-body)'
                }}
              >
                Family Homeowner
              </button>
            </div>
          </div>
        </div>

        {(search || selectedProvince !== 'All') && (
          <p style={{ fontSize:12, color:'var(--color-text-3)', marginBottom:'0.75rem', display:'flex', alignItems:'center', gap:6 }}>
            {filtered.length} of {cleanCities.length} communities
            {selectedProvince !== 'All' ? ` in ${PROVINCE_NAMES[selectedProvince]}` : ''}
            {search ? ` matching "${search}"` : ''}
            <button onClick={() => { setSearch(''); setSelectedProvince('All') }} style={{ background:'none', border:'none', color:'var(--color-text-3)', cursor:'pointer', fontSize:12, fontFamily:'var(--font-body)', padding:0, display:'inline-flex', alignItems:'center', gap:3 }}>
              <X size={11} /> Clear filters
            </button>
          </p>
        )}

        {loading ? (
          <p style={{ color:'var(--color-text-3)', padding:'2rem 0' }}>Loading ridings…</p>
        ) : (
          <div style={{ background:'var(--color-surface)', border:'0.5px solid var(--color-border)', borderRadius:12, overflow:'hidden' }}>
            {!isMobile && (
              <div style={{ display:'grid', gridTemplateColumns:'62px 2fr 1fr 1fr 1fr 1fr 1.2fr', gap:'0.75rem', padding:'0.75rem 1rem', borderBottom:'0.5px solid var(--color-border)', fontSize:11, color:'var(--color-text-3)' }}>
                <div>Rank</div><div>Riding / Community</div><div>Average Rent (1BR)</div>
                <div>Median Income</div>
                <div>Rent Burden</div><div>Net Disposable</div><div>Quality Metrics</div>
              </div>
            )}

            {filtered.length === 0 ? (
              <div style={{ padding:'2rem 1rem', color:'var(--color-text-3)', fontSize:14, textAlign:'center' }}>No communities match your search.</div>
            ) : (
              filtered.map((city, index) => {
                const href = `/ridings/${slugifyCity(city.city)}`
                const burden = city.burden
                const disposable = city.disposable
                const rank = index + 1
                const isLast = index === filtered.length - 1
                const provName = city.region ? PROVINCE_NAMES[city.region] || city.region : ''

                return isMobile ? (
                  <a key={city.city} href={href} style={{ display:'block', padding:'1rem 1.25rem', borderBottom: isLast ? 'none' : '0.5px solid var(--color-border)', textDecoration:'none', color:'inherit' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', gap:'1rem', alignItems:'flex-start' }}>
                      <div style={{ flex:1 }}>
                        <p style={{ fontSize:11, color:'var(--color-text-3)', margin:'0 0 0.2rem' }}>#{rank} in Canada</p>
                        <h2 style={{ fontFamily:'var(--font-display)', fontSize:20, margin:0, color:'var(--color-text-1)', fontWeight:400 }}>
                          {city.city}
                        </h2>
                        <p style={{ fontSize:12, color:'var(--color-text-3)', margin:'0.2rem 0 0' }}>{provName}</p>
                        <p style={{ fontSize:12, margin:'0.35rem 0 0', color: burdenColor(burden) }}>{burden}% rent burden · ${disposable.toLocaleString()} net disposable</p>
                      </div>
                      <div style={{ textAlign:'right' }}>
                        <div style={{ fontFamily:'var(--font-display)', fontSize:20, color:'var(--color-accent)', whiteSpace:'nowrap', fontWeight:400 }}>${city.median_rent_1br_cad}/mo</div>
                        {(() => {
                          const proxy = getProxyName(city.rent_data_source, city.city)
                          return proxy ? (
                            <p style={{ fontSize: 9.5, color: 'var(--color-text-4)', margin: '2px 0 0', whiteSpace: 'nowrap' }}>
                              via {proxy}
                            </p>
                          ) : null
                        })()}
                      </div>
                    </div>
                  </a>
                ) : (
                  <a key={city.city} href={href}
                    onMouseEnter={() => setHoveredCity(city.city)}
                    onMouseLeave={() => setHoveredCity(null)}
                    style={{ display:'grid', gridTemplateColumns:'62px 2fr 1fr 1fr 1fr 1fr 1.2fr', gap:'0.75rem', padding:'0.8rem 1rem', borderBottom: isLast ? 'none' : '0.5px solid var(--color-border)', alignItems:'center', textDecoration:'none', color:'inherit', background: hoveredCity===city.city ? 'var(--color-surface-2)' : 'var(--color-surface)', transition:'background 0.1s' }}>

                    <div style={{ fontSize:12, color:'var(--color-text-3)' }}>#{rank}</div>

                    <div>
                      <div style={{ display:'flex', alignItems: 'center', gap:8 }}>
                        <span style={{ fontFamily:'var(--font-display)', fontSize:17, color:'var(--color-text-1)', fontWeight:400 }}>{city.city}</span>
                      </div>
                      <p style={{ fontSize:11, color:'var(--color-text-3)', margin:'0.15rem 0 0' }}>
                        {provName}{city.population ? ` · Pop. ${Number(city.population).toLocaleString()}` : ''}
                      </p>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <div style={{ fontFamily:'var(--font-display)', fontSize:17, color:'var(--color-accent)', fontWeight:400 }}>${city.median_rent_1br_cad}/mo</div>
                      {(() => {
                        const proxy = getProxyName(city.rent_data_source, city.city)
                        return proxy ? (
                          <p style={{ fontSize: 9.5, color: 'var(--color-text-4)', margin: '2px 0 0' }} title={city.rent_data_source ?? undefined}>
                            via {proxy}
                          </p>
                        ) : null
                      })()}
                    </div>

                    <div style={{ fontSize:14, color:'var(--color-text-2)', fontFamily:'var(--font-mono)' }}>
                      ${city.median_monthly_salary_cad}/mo
                    </div>

                    <div>
                      <span style={{ fontSize:13, fontWeight:500, color:burdenColor(burden) }}>{burden}%</span>
                      <p style={{ fontSize:10, color:'var(--color-text-4)', margin:'2px 0 0' }}>of gross paycheck</p>
                    </div>

                    <div>
                      <span style={{ fontSize:13, fontWeight:500, color:'var(--color-green)' }}>${disposable.toLocaleString()}</span>
                      <p style={{ fontSize:10, color:'var(--color-text-4)', margin:'2px 0 0' }}>net after tax</p>
                    </div>

                    <div>
                      <span style={{ fontSize:12, color:'var(--color-text-2)' }}>Safety: {city.safety_index ?? '-'}</span>
                      <p style={{ fontSize:10, color:'var(--color-text-4)', margin:'2px 0 0' }}>electoral riding</p>
                    </div>
                  </a>
                )
              })
            )}
          </div>
        )}

        {/* City Comparison Dashboard */}
        <section className="glass-panel" style={{ marginTop: '4rem', padding: isMobile ? '1.5rem' : '2.5rem', borderRadius: 16, border: '1px solid var(--color-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '0.75rem' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 3h5v5M4 20L21 3M21 16v5h-5M4 4l17 17"/></svg>
            <span style={{ fontSize: 11, color: 'var(--color-text-3)' }}>Comparison</span>
          </div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: isMobile ? 26 : 34, letterSpacing: -0.8, margin: '0 0 0.5rem', color: 'var(--color-text-1)', fontWeight: 400 }}>
            Compare Communities Side-by-Side.
          </h2>
          <p style={{ fontSize: 14, color: 'var(--color-text-2)', lineHeight: 1.6, maxWidth: 560, marginBottom: '2rem' }}>
            Select two Canadian electoral ridings to compare incomes, housing rent burdens, and other key socio-economic indices.
          </p>

          <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '2.5rem', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 220 }}>
              <label style={{ display: 'block', fontSize: 11, color: 'var(--color-text-3)', marginBottom: 6 }}>Base Riding</label>
              <select value={compareA} onChange={e => setCompareA(e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '0.5px solid var(--color-border)', background: 'var(--color-bg)', fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--color-text-1)', cursor: 'pointer' }}>
                <option value="">Select a riding...</option>
                {cleanCities.map(c => (
                  <option key={c.city} value={c.city}>{c.city} ({c.region})</option>
                ))}
              </select>
            </div>
            <div style={{ flex: 1, minWidth: 220 }}>
              <label style={{ display: 'block', fontSize: 11, color: 'var(--color-text-3)', marginBottom: 6 }}>Comparison Riding</label>
              <select value={compareB} onChange={e => setCompareB(e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '0.5px solid var(--color-border)', background: 'var(--color-bg)', fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--color-text-1)', cursor: 'pointer' }}>
                <option value="">Select a riding...</option>
                {cleanCities.map(c => (
                  <option key={c.city} value={c.city}>{c.city} ({c.region})</option>
                ))}
              </select>
            </div>
          </div>

          {compareA && compareB && (() => {
            const cityDataA = cleanCities.find(c => c.city === compareA)
            const cityDataB = cleanCities.find(c => c.city === compareB)
            
            if (!cityDataA || !cityDataB) return null
            
            const rentA = cityDataA.median_rent_1br_cad
            const rentB = cityDataB.median_rent_1br_cad
            
            const salA = cityDataA.median_monthly_salary_cad
            const salB = cityDataB.median_monthly_salary_cad
            
            const burdenValA = cityDataA.burden
            const burdenValB = cityDataB.burden
            
            const dispA = cityDataA.disposable
            const dispB = cityDataB.disposable

            const compRows = [
              {
                label: 'Median Monthly Income',
                valA: salA ? `$${salA.toLocaleString()}/mo` : '-',
                valB: salB ? `$${salB.toLocaleString()}/mo` : '-',
                better: salA && salB ? (salA > salB ? 'A' : salA < salB ? 'B' : 'draw') : 'draw',
                desc: salA && salB ? (salA > salB ? `${cityDataA.city} is higher by $${(salA - salB).toLocaleString()}` : `${cityDataB.city} is higher by $${(salB - salA).toLocaleString()}`) : '-'
              },
              {
                label: 'Average 1BR Rent',
                valA: rentA ? `$${rentA.toLocaleString()}/mo` : '-',
                valB: rentB ? `$${rentB.toLocaleString()}/mo` : '-',
                better: rentA && rentB ? (rentA < rentB ? 'A' : rentA > rentB ? 'B' : 'draw') : 'draw',
                desc: rentA && rentB ? (rentA < rentB ? `${cityDataA.city} is cheaper by $${(rentB - rentA).toLocaleString()}` : `${cityDataB.city} is cheaper by $${(rentA - rentB).toLocaleString()}`) : '-'
              },
              {
                label: 'Rent Burden (Housing cost/income)',
                valA: `${burdenValA}%`,
                valB: `${burdenValB}%`,
                better: burdenValA < burdenValB ? 'A' : burdenValA > burdenValB ? 'B' : 'draw',
                desc: burdenValA < burdenValB ? `${cityDataA.city} is ${burdenValB - burdenValA}% lower` : `${cityDataB.city} is ${burdenValA - burdenValB}% lower`
              },
              {
                label: 'Net Monthly Disposable Income',
                valA: `$${dispA.toLocaleString()}`,
                valB: `$${dispB.toLocaleString()}`,
                better: dispA > dispB ? 'A' : dispA < dispB ? 'B' : 'draw',
                desc: dispA > dispB ? `${cityDataA.city} has $${(dispA - dispB).toLocaleString()} more` : `${cityDataB.city} has $${(dispB - dispA).toLocaleString()} more`
              },
              {
                label: 'Safety Index (/100)',
                valA: cityDataA.safety_index !== null ? String(cityDataA.safety_index) : '-',
                valB: cityDataB.safety_index !== null ? String(cityDataB.safety_index) : '-',
                better: cityDataA.safety_index !== null && cityDataB.safety_index !== null ? (cityDataA.safety_index > cityDataB.safety_index ? 'A' : cityDataA.safety_index < cityDataB.safety_index ? 'B' : 'draw') : 'draw',
                desc: cityDataA.safety_index !== null && cityDataB.safety_index !== null ? (cityDataA.safety_index > cityDataB.safety_index ? `${cityDataA.city} is safer (+${(cityDataA.safety_index - cityDataB.safety_index).toFixed(0)})` : `${cityDataB.city} is safer (+${(cityDataB.safety_index - cityDataA.safety_index).toFixed(0)})`) : '-'
              }
            ]

            return (
              <div style={{ background: 'var(--color-surface)', border: '0.5px solid var(--color-border)', borderRadius: 14, overflow: 'hidden', padding: isMobile ? '1rem' : '1.5rem 2rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr', borderBottom: '1px solid var(--color-border)', paddingBottom: '1.25rem', marginBottom: '1.25rem', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ fontSize: 11, color: 'var(--color-text-3)' }}>Comparative Indicators</div>
                  <div style={{ textAlign: 'center' }}>
                    <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, margin: '4px 0 0', color: 'var(--color-text-1)', fontWeight: 500 }}>{cityDataA.city}</h3>
                    <p style={{ fontSize: 11, color: 'var(--color-text-3)', margin: 0 }}>{PROVINCE_NAMES[cityDataA.region ?? '']}</p>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, margin: '4px 0 0', color: 'var(--color-text-1)', fontWeight: 500 }}>{cityDataB.city}</h3>
                    <p style={{ fontSize: 11, color: 'var(--color-text-3)', margin: 0 }}>{PROVINCE_NAMES[cityDataB.region ?? '']}</p>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {compRows.map(row => {
                    const bgA = row.better === 'A' ? 'rgba(255,255,255,0.04)' : 'transparent'
                    const bgB = row.better === 'B' ? 'rgba(255,255,255,0.04)' : 'transparent'

                    const borderA = row.better === 'A' ? '0.5px solid rgba(255,255,255,0.14)' : '0.5px solid transparent'
                    const borderB = row.better === 'B' ? '0.5px solid rgba(255,255,255,0.14)' : '0.5px solid transparent'

                    const colA = row.better === 'A' ? 'var(--color-text-1)' : 'var(--color-text-2)'
                    const colB = row.better === 'B' ? 'var(--color-text-1)' : 'var(--color-text-2)'

                    return (
                      <div key={row.label} style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr', alignItems: 'center', padding: '10px 0', borderBottom: '0.5px solid var(--color-border)', gap: '0.5rem' }}>
                        <div>
                          <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-2)' }}>{row.label}</span>
                          {row.desc !== '-' && (
                            <span style={{ display: 'block', fontSize: 10, color: 'var(--color-text-3)', marginTop: 3 }}>{row.desc}</span>
                          )}
                        </div>
                        <div style={{ textAlign: 'center', background: bgA, border: borderA, padding: '8px 10px', borderRadius: 8, color: colA, fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: row.better === 'A' ? 600 : 400 }}>
                          {row.valA} {row.better === 'A' && '✓'}
                        </div>
                        <div style={{ textAlign: 'center', background: bgB, border: borderB, padding: '8px 10px', borderRadius: 8, color: colB, fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: row.better === 'B' ? 600 : 400 }}>
                          {row.valB} {row.better === 'B' && '✓'}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })()}
        </section>
      </section>
    </main>
  )
}
