'use client'

import { supabase } from '@/lib/supabase'
import NavBar from '@/app/components/NavBar'
import { useEffect, useRef, useState, useMemo } from 'react'
import * as d3 from 'd3'
import * as topojson from 'topojson-client'
import { RATES as rates, SYMBOLS as symbols } from '@/app/cities/[city]/CityPageContent'

const currencyOptions = [
  ['CAD', 'CA$ CAD'], ['USD', 'US$ USD'], ['EUR', '€ EUR'], ['GBP', '£ GBP'],
  ['CHF', 'Fr CHF'], ['AUD', 'AU$ AUD'], ['NZD', 'NZ$ NZD'],
  ['JPY', '¥ JPY'],  ['CNY', '¥ CNY'],  ['HKD', 'HK$ HKD'], ['SGD', 'S$ SGD'],
  ['KRW', '₩ KRW'],  ['TWD', 'NT$ TWD'], ['INR', '₹ INR'],  ['PKR', '₨ PKR'],
  ['MXN', 'MX$ MXN'], ['BRL', 'R$ BRL'], ['ARS', 'AR$ ARS'],
  ['AED', 'AED AED'], ['SAR', 'SAR SAR'], ['TRY', '₺ TRY'],
  ['EGP', 'E£ EGP'], ['RUB', '₽ RUB'],
]

type City = {
  city: string
  country: string | null
  region: string | null
  flag: string | null
  latitude: number | null
  longitude: number | null
  population: string | null
  blurb: string | null
  price_cad: number | null
  price_source: string | null
  price_updated_at: string | null
  confidence_score: number | null
  median_rent_1br_cad: number | null
  median_monthly_salary_cad: number | null
  safety_index: number | null
  healthcare_index: number | null
  avg_internet_mbps: number | null
}

function dotColor(priceCAD: number | null): string {
  if (!priceCAD || priceCAD <= 0) return '#55555e'
  if (priceCAD < 5)  return '#76a98c'
  if (priceCAD < 9)  return '#76a98c'
  if (priceCAD < 14) return '#c8a862'
  if (priceCAD < 18) return '#c8a862'
  return '#c0674e'
}

const COLOR_TIERS = [
  { color: '#76a98c', max: 5 },
  { color: '#76a98c', max: 9 },
  { color: '#c8a862', max: 14 },
  { color: '#c8a862', max: 18 },
  { color: '#c0674e', max: Infinity },
]

export default function Explore() {
  const svgRef = useRef<SVGSVGElement>(null)
  const gRef  = useRef<SVGGElement>(null)
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null)

  const [currency, setCurrency]         = useState('CAD')
  const [selectedCity, setSelectedCity] = useState<City | null>(null)
  const [expanded, setExpanded]         = useState(false)
  const [cities, setCities]             = useState<City[]>([])
  const [loadingCities, setLoadingCities] = useState(true)
  const [isMobile, setIsMobile]         = useState(false)
  const [ratesState, setRatesState]     = useState<Record<string, number>>(rates)

  // Filters State
  const [priceRange, setPriceRange]     = useState(25)
  const [rentBurdenMax, setRentBurdenMax] = useState(100)
  const [regionFilter, setRegionFilter]   = useState('All')

  useEffect(() => {
    fetch('/api/exchange-rates')
      .then(r => r.json())
      .then(d => { if (d && typeof d === 'object') setRatesState(d) })
      .catch(() => {})
  }, [])

  const cvt = (cad: number) => {
    const rate = ratesState[currency] ?? rates[currency] ?? 1
    const sym  = symbols[currency] ?? 'CA$'
    const val  = cad * rate
    const digits = val >= 100 ? 0 : 2
    return `${sym}${val.toLocaleString(undefined, { minimumFractionDigits: digits, maximumFractionDigits: digits })}`
  }

  const legendTiers = [
    { color: '#76a98c', label: `Under ${cvt(5)}` },
    { color: '#76a98c', label: `${cvt(5)} – ${cvt(9)}` },
    { color: '#c8a862', label: `${cvt(9)} – ${cvt(14)}` },
    { color: '#c8a862', label: `${cvt(14)} – ${cvt(18)}` },
    { color: '#c0674e', label: `${cvt(18)}+` },
  ]

  const regionsList = useMemo(() => {
    const seen = new Set<string>()
    cities.forEach(c => { if (c.region) seen.add(c.region) })
    return ['All', ...Array.from(seen).sort()]
  }, [cities])

  const cityPrices = cities
    .map(city => city.price_cad)
    .filter((price): price is number => price != null && Number.isFinite(price) && price > 0)
  const minPrice = cityPrices.length ? Math.min(...cityPrices) : null
  const maxPrice = cityPrices.length ? Math.max(...cityPrices) : null
  const spreadRatio = minPrice && maxPrice ? maxPrice / minPrice : null
  const statBadges = [
    { label: `${cities.length.toLocaleString()} ${cities.length === 1 ? 'city' : 'cities'}`, sub: 'indexed' },
    { label: minPrice != null ? cvt(minPrice) : 'Pending', sub: 'cheapest baseline' },
    { label: maxPrice != null ? cvt(maxPrice) : 'Pending', sub: 'most expensive' },
    { label: spreadRatio != null ? `${spreadRatio.toFixed(1)}×` : 'Pending', sub: 'price spread' },
  ]

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  useEffect(() => {
    async function fetchCities() {
      setLoadingCities(true)
      const { data, error } = await supabase
        .from('cities')
        .select(`
          city, country, region, flag, latitude, longitude,
          population, blurb, price_cad,
          price_source, price_updated_at, confidence_score,
          median_rent_1br_cad, median_monthly_salary_cad,
          safety_index, healthcare_index, avg_internet_mbps
        `)
        .order('city', { ascending: true })

      if (error) { setLoadingCities(false); return }
      setCities(
        (data ?? []).filter(c =>
          c.latitude != null && c.longitude != null &&
          Number.isFinite(Number(c.latitude)) && Number.isFinite(Number(c.longitude))
        ) as City[]
      )
      setLoadingCities(false)
    }
    fetchCities()
  }, [])

  useEffect(() => {
    if (!svgRef.current || !gRef.current) return
    const W = 700, H = 380
    const svg = d3.select(svgRef.current)
    const g   = d3.select(gRef.current)
    g.selectAll('*').remove()

    const projection = d3.geoNaturalEarth1().scale(115).translate([W / 2, H / 2 + 14])
    const pathGen = d3.geoPath().projection(projection)

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([1, 12])
      .on('zoom', event => {
        g.attr('transform', event.transform)
        g.selectAll<SVGCircleElement, unknown>('.city-dot')
          .attr('r', 6 / event.transform.k)
          .attr('stroke-width', 1.5 / event.transform.k)
        g.selectAll<SVGTextElement, unknown>('.city-label')
          .attr('font-size', 9 / event.transform.k)
          .attr('x', function () {
            const cx = parseFloat(d3.select(this.parentNode as SVGGElement).select('circle').attr('cx'))
            return cx + 9 / event.transform.k
          })
          .attr('y', function () {
            const cy = parseFloat(d3.select(this.parentNode as SVGGElement).select('circle').attr('cy'))
            return cy + 3.5 / event.transform.k
          })
          .attr('opacity', event.transform.k >= 3 ? 1 : 0)
      })

    zoomRef.current = zoom
    svg.call(zoom)

    g.append('rect').attr('width', W).attr('height', H).attr('fill', '#0a0a0c')

    // Filter cities based on slider criteria
    const filteredCities = cities.filter(city => {
      const price = city.price_cad ?? 0
      const rent = city.median_rent_1br_cad
      const salary = city.median_monthly_salary_cad
      const burden = rent && salary ? (rent / salary) * 100 : null
      
      const matchPrice = price <= priceRange
      const matchRent = burden === null || burden <= rentBurdenMax
      const matchRegion = regionFilter === 'All' || city.region === regionFilter
      
      return matchPrice && matchRent && matchRegion
    })

    d3.json('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json').then((world: any) => {
      g.append('g')
        .selectAll('path')
        .data((topojson.feature(world, world.objects.countries) as any).features)
        .enter()
        .append('path')
        .attr('d', pathGen as any)
        .attr('fill', '#15151a')
        .attr('stroke', '#1e1e24')
        .attr('stroke-width', 0.5)

      filteredCities.forEach(city => {
        const projected = projection([Number(city.longitude), Number(city.latitude)] as [number, number])
        if (!projected) return
        const [x, y] = projected
        const cityG = g.append('g').style('cursor', 'pointer').attr('pointer-events', 'all')

        cityG.append('circle')
          .attr('class', 'city-dot')
          .attr('cx', x).attr('cy', y)
          .attr('r', 6)
          .attr('fill', dotColor(city.price_cad))
          .attr('stroke', 'rgba(0,0,0,0.4)')
          .attr('stroke-width', 1.5)
          .attr('pointer-events', 'all')

        cityG.append('text')
          .attr('class', 'city-label')
          .attr('x', x + 9).attr('y', y + 3.5)
          .attr('font-size', 9)
          .attr('fill', '#b0aca6')
          .attr('font-family', 'Geist, system-ui, sans-serif')
          .attr('pointer-events', 'none')
          .attr('opacity', 0)
          .text(city.city)

        cityG.on('click', () => setSelectedCity(city))
      })
    })
  }, [expanded, cities, isMobile, priceRange, rentBurdenMax, regionFilter])

  const resetZoom = () => {
    if (!svgRef.current || !zoomRef.current) return
    d3.select(svgRef.current).transition().duration(500).call(zoomRef.current.transform, d3.zoomIdentity)
  }

  const drawerBowlsAfterRent = (city: City) => {
    if (!city.median_monthly_salary_cad || !city.median_rent_1br_cad || !city.price_cad) return null
    const leftover = city.median_monthly_salary_cad - city.median_rent_1br_cad
    if (leftover <= 0) return null
    return Math.round(leftover / city.price_cad)
  }

  const rentBurden = (city: City) => {
    if (!city.median_monthly_salary_cad || !city.median_rent_1br_cad) return null
    return Math.round((city.median_rent_1br_cad / city.median_monthly_salary_cad) * 100)
  }

  return (
    <main style={{ fontFamily: 'var(--font-body)', background: 'var(--color-bg)', minHeight: '100vh', color: 'var(--color-text-1)', overflowX: 'hidden', WebkitTapHighlightColor: 'transparent' }}>

      {selectedCity && (
        <div onClick={() => setSelectedCity(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 99 }} />
      )}

      <div style={{
        position: 'fixed', top: 0, right: 0,
        width: isMobile ? '100vw' : 390, maxWidth: '100vw',
        height: '100vh',
        background: 'var(--color-surface)',
        borderLeft: isMobile ? 'none' : '0.5px solid var(--color-border)',
        zIndex: 100, overflowY: 'auto',
        transform: selectedCity ? 'translateX(0)' : isMobile ? 'translateX(100vw)' : 'translateX(420px)',
        transition: 'transform 0.3s cubic-bezier(0.4,0,0.2,1)',
        padding: isMobile ? '1.5rem 1.25rem' : '2rem',
        boxSizing: 'border-box',
      }}>
        {selectedCity && (() => {
          const bowls = drawerBowlsAfterRent(selectedCity)
          const burden = rentBurden(selectedCity)
          return (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                <div>
                  <div style={{ fontSize: 32, marginBottom: 6 }}>{selectedCity.flag ?? '🌍'}</div>
                  <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 30, letterSpacing: -0.5, margin: 0, color: 'var(--color-text-1)' }}>
                    {selectedCity.city}
                  </h2>
                  <p style={{ fontSize: 13, color: '#6a6a62', margin: '4px 0 0' }}>
                    {[selectedCity.region, selectedCity.country].filter(Boolean).join(', ')}
                    {selectedCity.population ? ` · ${Number(selectedCity.population).toLocaleString()}` : ''}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedCity(null)}
                  style={{ background: 'none', border: '0.5px solid var(--color-border)', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', fontSize: 12, color: '#6a6a62', fontFamily: 'var(--font-body)', flexShrink: 0 }}
                >
                  ✕
                </button>
              </div>

              <div style={{ borderTop: '0.5px solid var(--color-border)', paddingTop: '1.25rem', marginBottom: '1.25rem' }}>
                <p style={{ fontSize: 10, fontWeight: 500, letterSpacing: '1.2px', textTransform: 'uppercase', color: '#5a5a52', margin: '0 0 0.5rem' }}>Baseline fried rice</p>
                <p style={{ fontFamily: 'var(--font-display)', fontSize: 40, color: 'var(--color-accent)', margin: 0, lineHeight: 1 }}>
                  {selectedCity.price_cad ? cvt(selectedCity.price_cad) : 'Pending'}
                </p>
                {selectedCity.confidence_score && (
                  <p style={{ fontSize: 12, color: '#5a5a52', margin: '6px 0 0' }}>
                    {Math.round(selectedCity.confidence_score <= 1 ? selectedCity.confidence_score * 100 : selectedCity.confidence_score)}% confidence
                  </p>
                )}
              </div>

              {(bowls !== null || burden !== null) && (
                <div style={{ borderTop: '0.5px solid var(--color-border)', paddingTop: '1.25rem', marginBottom: '1.25rem', display: 'flex', gap: '0.75rem' }}>
                  {bowls !== null && (
                    <div style={{ flex: 1, background: 'var(--color-surface-2)', borderRadius: 12, padding: '0.9rem' }}>
                      <p style={{ fontSize: 10, color: '#5a5a52', letterSpacing: '1px', textTransform: 'uppercase', margin: '0 0 0.35rem' }}>After rent</p>
                      <p style={{ fontFamily: 'var(--font-display)', fontSize: 26, color: 'var(--color-green)', margin: 0 }}>{bowls} <span style={{ fontSize: 16 }}>🍚</span></p>
                      <p style={{ fontSize: 11, color: '#5a5a52', margin: '3px 0 0' }}>bowls / month</p>
                    </div>
                  )}
                  {burden !== null && (
                    <div style={{ flex: 1, background: 'var(--color-surface-2)', borderRadius: 12, padding: '0.9rem' }}>
                      <p style={{ fontSize: 10, color: '#5a5a52', letterSpacing: '1px', textTransform: 'uppercase', margin: '0 0 0.35rem' }}>Rent burden</p>
                      <p style={{ fontFamily: 'var(--font-display)', fontSize: 26, color: burden > 70 ? 'var(--color-red)' : burden > 50 ? 'var(--color-accent)' : 'var(--color-green)', margin: 0 }}>{burden}%</p>
                      <p style={{ fontSize: 11, color: '#5a5a52', margin: '3px 0 0' }}>of median salary</p>
                    </div>
                  )}
                </div>
              )}

              {/* Liveability Indicators */}
              {(selectedCity.safety_index !== null || selectedCity.healthcare_index !== null || selectedCity.avg_internet_mbps !== null) && (
                <div style={{ borderTop: '0.5px solid var(--color-border)', paddingTop: '1.25rem', marginBottom: '1.25rem' }}>
                  <p style={{ fontSize: 10, fontWeight: 500, letterSpacing: '1.2px', textTransform: 'uppercase', color: 'var(--color-text-3)', marginBottom: '0.75rem' }}>Liveability Indicators</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                    {selectedCity.safety_index != null && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13 }}>
                        <span style={{ color: 'var(--color-text-2)' }}>🛡️ Safety Index</span>
                        <span style={{ fontFamily: 'var(--font-mono)', color: selectedCity.safety_index >= 70 ? 'var(--color-green)' : selectedCity.safety_index >= 50 ? 'var(--color-accent)' : 'var(--color-red)' }}>{selectedCity.safety_index}/100</span>
                      </div>
                    )}
                    {selectedCity.healthcare_index != null && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13 }}>
                        <span style={{ color: 'var(--color-text-2)' }}>🏥 Healthcare Index</span>
                        <span style={{ fontFamily: 'var(--font-mono)', color: selectedCity.healthcare_index >= 70 ? 'var(--color-green)' : selectedCity.healthcare_index >= 50 ? 'var(--color-accent)' : 'var(--color-red)' }}>{selectedCity.healthcare_index}/100</span>
                      </div>
                    )}
                    {selectedCity.avg_internet_mbps != null && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13 }}>
                        <span style={{ color: 'var(--color-text-2)' }}>⚡ Internet Speed</span>
                        <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-accent)' }}>{selectedCity.avg_internet_mbps} Mbps</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {selectedCity.blurb && (
                <div style={{ borderTop: '0.5px solid var(--color-border)', paddingTop: '1.25rem', marginBottom: '1.5rem' }}>
                  <p style={{ fontSize: 10, fontWeight: 500, letterSpacing: '1.2px', textTransform: 'uppercase', color: '#5a5a52', margin: '0 0 0.6rem' }}>City context</p>
                  <p style={{ fontSize: 13, color: '#a8a49c', lineHeight: 1.7, margin: 0 }}>{selectedCity.blurb}</p>
                </div>
              )}

              <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', borderTop: '0.5px solid var(--color-border)', paddingTop: '1.25rem' }}>
                <a
                  href={`/cities/${selectedCity.city.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}`}
                  style={{ padding: '0.6rem 0.9rem', borderRadius: 10, border: '0.5px solid var(--color-accent)', color: 'var(--color-accent)', textDecoration: 'none', fontSize: 13, background: 'transparent' }}
                >
                  Full profile →
                </a>
                <a href="/cities" style={{ padding: '0.6rem 0.9rem', borderRadius: 10, border: '0.5px solid var(--color-border)', color: '#8a8a82', textDecoration: 'none', fontSize: 13 }}>
                  All cities
                </a>
              </div>
            </>
          )
        })()}
      </div>

      {!(expanded && isMobile) && <NavBar />}

      {!(expanded && isMobile) && (
        <div style={{ padding: isMobile ? '2rem 1.25rem 1.25rem' : '2.5rem 2rem 1.5rem', maxWidth: 960 }}>
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: isMobile ? 30 : 40,
            lineHeight: 1.08, letterSpacing: isMobile ? -0.5 : -1,
            color: 'var(--color-text-1)', margin: '0 0 1rem',
          }}>
            What does fried rice reveal{' '}
            <em style={{ color: 'var(--color-accent)' }}>about a city?</em>
          </h1>

          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
            {statBadges.map(s => (
              <div key={s.sub} style={{ background: 'var(--color-surface)', border: '0.5px solid var(--color-border)', borderRadius: 10, padding: '0.6rem 0.9rem' }}>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: 18, color: 'var(--color-accent)' }}>{s.label}</span>
                <span style={{ fontSize: 11, color: '#4a4a42', marginLeft: 6 }}>{s.sub}</span>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '0.6rem' }}>
            <a href="/cities" style={{ padding: '0.65rem 1.1rem', borderRadius: 10, border: '0.5px solid var(--color-accent)', background: 'var(--color-accent)', color: '#fff', textDecoration: 'none', fontSize: 13 }}>
              Explore cities
            </a>
            <a href="/submit" style={{ padding: '0.65rem 1.1rem', borderRadius: 10, border: '0.5px solid var(--color-border)', color: '#8a8a82', textDecoration: 'none', fontSize: 13 }}>
              Submit a price
            </a>
          </div>
        </div>
      )}

      <div style={{ padding: expanded && isMobile ? 0 : isMobile ? '0 0 2rem' : '0 2rem 2.5rem' }}>

        {!(expanded && isMobile) && (
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            gap: '0.75rem', flexWrap: 'wrap',
            marginBottom: '0.6rem',
          }}>
            <p style={{ fontSize: 12, color: '#3a3a32', margin: 0 }}>
              Click a dot · scroll to zoom · drag to pan · city names at 3× zoom
            </p>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <select
                value={currency}
                onChange={e => setCurrency(e.target.value)}
                style={{ padding: '5px 10px', border: '0.5px solid var(--color-border)', borderRadius: 8, background: 'var(--color-surface)', fontFamily: 'var(--font-body)', fontSize: 12, color: '#8a8a82', cursor: 'pointer' }}
              >
                {currencyOptions.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
              <button onClick={resetZoom} style={ctrlBtn}>Reset zoom</button>
              <button onClick={() => setExpanded(!expanded)} style={ctrlBtn}>{expanded ? 'Collapse' : 'Expand'}</button>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: isMobile || expanded ? 'column' : 'row', gap: '1.5rem', alignItems: 'stretch' }}>
          {/* Filters Sidebar */}
          {!(expanded && isMobile) && (
            <div className="glass-panel" style={{ borderRadius: 14, padding: '1.5rem', flex: '1 1 240px', maxWidth: isMobile ? '100%' : 260, display: 'flex', flexDirection: 'column', gap: '1.25rem', justifyContent: 'flex-start' }}>
              <div>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: 9.5, fontWeight: 500, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--color-text-3)', margin: '0 0 10px' }}>
                  Filters
                </p>
              </div>

              {/* Price Filter Slider */}
              <div>
                <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--color-text-2)', marginBottom: 6 }}>
                  <span>Max price:</span>
                  <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-accent)', fontWeight: 500 }}>{cvt(priceRange)}</span>
                </label>
                <input
                  type="range"
                  min={1}
                  max={25}
                  step={0.5}
                  value={priceRange}
                  onChange={e => setPriceRange(parseFloat(e.target.value))}
                  style={{ width: '100%', accentColor: 'var(--color-accent)', cursor: 'pointer' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9.5, color: 'var(--color-text-4)', marginTop: 4, fontFamily: 'var(--font-mono)' }}>
                  <span>{cvt(1)}</span>
                  <span>{cvt(25)}</span>
                </div>
              </div>

              {/* Rent Burden Filter Slider */}
              <div>
                <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--color-text-2)', marginBottom: 6 }}>
                  <span>Max Rent burden:</span>
                  <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-accent)', fontWeight: 500 }}>{rentBurdenMax}%</span>
                </label>
                <input
                  type="range"
                  min={10}
                  max={100}
                  step={5}
                  value={rentBurdenMax}
                  onChange={e => setRentBurdenMax(parseInt(e.target.value))}
                  style={{ width: '100%', accentColor: 'var(--color-accent)', cursor: 'pointer' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9.5, color: 'var(--color-text-4)', marginTop: 4, fontFamily: 'var(--font-mono)' }}>
                  <span>10%</span>
                  <span>100%</span>
                </div>
              </div>

              {/* Region Filter Selector */}
              <div>
                <label style={{ display: 'block', fontSize: 12, color: 'var(--color-text-2)', marginBottom: 6 }}>
                  Geographic Region:
                </label>
                <select
                  value={regionFilter}
                  onChange={e => setRegionFilter(e.target.value)}
                  style={{ width: '100%', padding: '6px 10px', borderRadius: 8, border: '0.5px solid var(--color-border)', background: 'var(--color-bg)', fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--color-text-1)', cursor: 'pointer' }}
                >
                  {regionsList.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              {/* Reset Filters button */}
              <button
                onClick={() => { setPriceRange(25); setRentBurdenMax(100); setRegionFilter('All'); }}
                style={{ marginTop: 'auto', padding: '8px 12px', borderRadius: 8, border: '0.5px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text-2)', fontFamily: 'var(--font-body)', fontSize: 12.5, cursor: 'pointer', textAlign: 'center', transition: '0.2s' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--color-text-3)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--color-border)'}
              >
                Reset Filters
              </button>
            </div>
          )}

          {/* Map canvas */}
          <div style={{
            flex: '2 1 500px',
            borderRadius: expanded && isMobile ? 0 : 14,
            overflow: 'hidden',
            background: 'var(--color-bg)',
            cursor: 'grab',
            touchAction: 'none',
            border: expanded && isMobile ? 'none' : '0.5px solid var(--color-border)',
          }}>
            <svg
              ref={svgRef}
              viewBox="0 0 700 380"
              style={{
                width: '100%',
                height: expanded && isMobile ? 'calc(100vh - 95px)' : 'auto',
                display: 'block',
                touchAction: 'none',
              }}
            >
              <g ref={gRef} />
            </svg>
          </div>
        </div>

        {!(expanded && isMobile) && (
          <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: 10, color: '#3a3a32', letterSpacing: '0.8px', textTransform: 'uppercase' }}>Baseline price</span>
              {legendTiers.map(t => (
                <div key={t.label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <div style={{ width: 9, height: 9, borderRadius: '50%', background: t.color, flexShrink: 0 }} />
                  <span style={{ fontSize: 11, color: '#4a4a42' }}>{t.label}</span>
                </div>
              ))}
            </div>
            {loadingCities && <p style={{ fontSize: 11, color: '#3a3a32', margin: 0 }}>Loading…</p>}
          </div>
        )}

        {expanded && isMobile && (
          <div style={{ padding: '0.75rem 1rem', display: 'flex', gap: 8, alignItems: 'center', background: 'var(--color-surface)', borderTop: '0.5px solid var(--color-border)' }}>
            <select
              value={currency}
              onChange={e => setCurrency(e.target.value)}
              style={{ flex: 1, padding: '5px 10px', border: '0.5px solid var(--color-border)', borderRadius: 8, background: 'var(--color-bg)', fontFamily: 'var(--font-body)', fontSize: 12, color: '#8a8a82' }}
            >
              {currencyOptions.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
            <button onClick={resetZoom} style={ctrlBtn}>Reset</button>
            <button onClick={() => setExpanded(false)} style={ctrlBtn}>Collapse</button>
          </div>
        )}
      </div>

    </main>
  )
}

const ctrlBtn: React.CSSProperties = {
  background: 'none', border: '0.5px solid var(--color-border)', borderRadius: 8,
  padding: '5px 10px', cursor: 'pointer', fontSize: 12, color: '#5a5a52',
  fontFamily: 'var(--font-body)',
}
