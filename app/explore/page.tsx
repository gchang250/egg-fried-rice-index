'use client'

import { supabase } from '@/lib/supabase'
import { useEffect, useRef, useState } from 'react'
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
}

function dotColor(priceCAD: number | null): string {
  if (!priceCAD || priceCAD <= 0) return '#555550'
  if (priceCAD < 5)  return '#34a85a'
  if (priceCAD < 9)  return '#5bbf7a'
  if (priceCAD < 14) return '#c4890f'
  if (priceCAD < 18) return '#d9682a'
  return '#b83418'
}

const COLOR_TIERS = [
  { color: '#34a85a', max: 5 },
  { color: '#5bbf7a', max: 9 },
  { color: '#c4890f', max: 14 },
  { color: '#d9682a', max: 18 },
  { color: '#b83418', max: Infinity },
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

  const cvt = (cad: number) => {
    const rate = rates[currency] ?? 1
    const sym  = symbols[currency] ?? 'CA$'
    const val  = cad * rate
    const digits = val >= 100 ? 0 : 2
    return `${sym}${val.toLocaleString(undefined, { minimumFractionDigits: digits, maximumFractionDigits: digits })}`
  }

  const legendTiers = [
    { color: '#34a85a', label: `Under ${cvt(5)}` },
    { color: '#5bbf7a', label: `${cvt(5)} – ${cvt(9)}` },
    { color: '#c4890f', label: `${cvt(9)} – ${cvt(14)}` },
    { color: '#d9682a', label: `${cvt(14)} – ${cvt(18)}` },
    { color: '#b83418', label: `${cvt(18)}+` },
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
          median_rent_1br_cad, median_monthly_salary_cad
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

    g.append('rect').attr('width', W).attr('height', H).attr('fill', '#0d1a14')

    d3.json('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json').then((world: any) => {
      g.append('g')
        .selectAll('path')
        .data((topojson.feature(world, world.objects.countries) as any).features)
        .enter()
        .append('path')
        .attr('d', pathGen as any)
        .attr('fill', '#162218')
        .attr('stroke', '#1e3022')
        .attr('stroke-width', 0.5)

      cities.forEach(city => {
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
          .attr('font-family', 'DM Sans, sans-serif')
          .attr('pointer-events', 'none')
          .attr('opacity', 0)
          .text(city.city)

        cityG.on('click', () => setSelectedCity(city))
      })
    })
  }, [expanded, cities, isMobile])

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
    <main style={{ fontFamily: 'var(--font-body)', background: '#0c0f0d', minHeight: '100vh', color: '#e8e4dc', overflowX: 'hidden', WebkitTapHighlightColor: 'transparent' }}>

      {selectedCity && (
        <div onClick={() => setSelectedCity(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 99 }} />
      )}

      <div style={{
        position: 'fixed', top: 0, right: 0,
        width: isMobile ? '100vw' : 390, maxWidth: '100vw',
        height: '100vh',
        background: '#141714',
        borderLeft: isMobile ? 'none' : '0.5px solid #2a3028',
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
                  <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 30, letterSpacing: -0.5, margin: 0, color: '#f0ece4' }}>
                    {selectedCity.city}
                  </h2>
                  <p style={{ fontSize: 13, color: '#6a6a62', margin: '4px 0 0' }}>
                    {[selectedCity.region, selectedCity.country].filter(Boolean).join(', ')}
                    {selectedCity.population ? ` · ${Number(selectedCity.population).toLocaleString()}` : ''}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedCity(null)}
                  style={{ background: 'none', border: '0.5px solid #2a3028', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', fontSize: 12, color: '#6a6a62', fontFamily: 'var(--font-body)', flexShrink: 0 }}
                >
                  ✕
                </button>
              </div>

              <div style={{ borderTop: '0.5px solid #1e261e', paddingTop: '1.25rem', marginBottom: '1.25rem' }}>
                <p style={{ fontSize: 10, fontWeight: 500, letterSpacing: '1.2px', textTransform: 'uppercase', color: '#5a5a52', margin: '0 0 0.5rem' }}>Baseline fried rice</p>
                <p style={{ fontFamily: 'var(--font-display)', fontSize: 40, color: '#d9682a', margin: 0, lineHeight: 1 }}>
                  {selectedCity.price_cad ? cvt(selectedCity.price_cad) : 'Pending'}
                </p>
                {selectedCity.confidence_score && (
                  <p style={{ fontSize: 12, color: '#5a5a52', margin: '6px 0 0' }}>
                    {Math.round(selectedCity.confidence_score <= 1 ? selectedCity.confidence_score * 100 : selectedCity.confidence_score)}% confidence
                  </p>
                )}
              </div>

              {(bowls !== null || burden !== null) && (
                <div style={{ borderTop: '0.5px solid #1e261e', paddingTop: '1.25rem', marginBottom: '1.25rem', display: 'flex', gap: '0.75rem' }}>
                  {bowls !== null && (
                    <div style={{ flex: 1, background: '#1a221a', borderRadius: 12, padding: '0.9rem' }}>
                      <p style={{ fontSize: 10, color: '#5a5a52', letterSpacing: '1px', textTransform: 'uppercase', margin: '0 0 0.35rem' }}>After rent</p>
                      <p style={{ fontFamily: 'var(--font-display)', fontSize: 26, color: '#34a85a', margin: 0 }}>{bowls} <span style={{ fontSize: 16 }}>🍚</span></p>
                      <p style={{ fontSize: 11, color: '#5a5a52', margin: '3px 0 0' }}>bowls / month</p>
                    </div>
                  )}
                  {burden !== null && (
                    <div style={{ flex: 1, background: '#1a221a', borderRadius: 12, padding: '0.9rem' }}>
                      <p style={{ fontSize: 10, color: '#5a5a52', letterSpacing: '1px', textTransform: 'uppercase', margin: '0 0 0.35rem' }}>Rent burden</p>
                      <p style={{ fontFamily: 'var(--font-display)', fontSize: 26, color: burden > 70 ? '#c04030' : burden > 50 ? '#c4890f' : '#34a85a', margin: 0 }}>{burden}%</p>
                      <p style={{ fontSize: 11, color: '#5a5a52', margin: '3px 0 0' }}>of median salary</p>
                    </div>
                  )}
                </div>
              )}

              {selectedCity.blurb && (
                <div style={{ borderTop: '0.5px solid #1e261e', paddingTop: '1.25rem', marginBottom: '1.5rem' }}>
                  <p style={{ fontSize: 10, fontWeight: 500, letterSpacing: '1.2px', textTransform: 'uppercase', color: '#5a5a52', margin: '0 0 0.6rem' }}>City context</p>
                  <p style={{ fontSize: 13, color: '#a8a49c', lineHeight: 1.7, margin: 0 }}>{selectedCity.blurb}</p>
                </div>
              )}

              <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', borderTop: '0.5px solid #1e261e', paddingTop: '1.25rem' }}>
                <a
                  href={`/cities/${selectedCity.city.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}`}
                  style={{ padding: '0.6rem 0.9rem', borderRadius: 10, border: '0.5px solid #d9682a', color: '#d9682a', textDecoration: 'none', fontSize: 13, background: 'transparent' }}
                >
                  Full profile →
                </a>
                <a href="/cities" style={{ padding: '0.6rem 0.9rem', borderRadius: 10, border: '0.5px solid #2a3028', color: '#8a8a82', textDecoration: 'none', fontSize: 13 }}>
                  All cities
                </a>
              </div>
            </>
          )
        })()}
      </div>

      {!(expanded && isMobile) && (
        <nav style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: isMobile ? '1rem 1.25rem' : '1.1rem 2rem',
          borderBottom: '0.5px solid #1e261e',
          position: 'relative', zIndex: 10,
        }}>
          <a href="/" style={{ fontFamily: 'var(--font-display)', fontSize: 17, color: 'var(--color-text-1)', textDecoration: 'none' }}>
            fried rice <span style={{ color: '#d9682a' }}>index</span>
          </a>
          <div style={{ display: 'flex', gap: isMobile ? '1rem' : '1.75rem' }}>
            {[['cities', '/cities'], ['submit', '/submit'], ['about', '/about'], ['methodology', '/methodology']].map(([l, h]) => (
              <a key={h} href={h} style={{ fontSize: 13, color: 'var(--color-text-3)', textDecoration: 'none' }}>{l}</a>
            ))}
          </div>
        </nav>
      )}

      {!(expanded && isMobile) && (
        <div style={{ padding: isMobile ? '2rem 1.25rem 1.25rem' : '2.5rem 2rem 1.5rem', maxWidth: 960 }}>
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: isMobile ? 30 : 40,
            lineHeight: 1.08, letterSpacing: isMobile ? -0.5 : -1,
            color: '#f0ece4', margin: '0 0 1rem',
          }}>
            What does fried rice reveal{' '}
            <em style={{ color: '#d9682a' }}>about a city?</em>
          </h1>

          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
            {[
              { label: '40 cities', sub: 'indexed' },
              { label: cvt(1.80), sub: 'cheapest baseline' },
              { label: cvt(20.68), sub: 'most expensive' },
              { label: '11.5×', sub: 'price spread' },
            ].map(s => (
              <div key={s.label} style={{ background: '#141714', border: '0.5px solid #1e261e', borderRadius: 10, padding: '0.6rem 0.9rem' }}>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: 18, color: '#d9682a' }}>{s.label}</span>
                <span style={{ fontSize: 11, color: '#4a4a42', marginLeft: 6 }}>{s.sub}</span>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '0.6rem' }}>
            <a href="/cities" style={{ padding: '0.65rem 1.1rem', borderRadius: 10, border: '0.5px solid #d9682a', background: '#d9682a', color: '#fff', textDecoration: 'none', fontSize: 13 }}>
              Explore cities
            </a>
            <a href="/submit" style={{ padding: '0.65rem 1.1rem', borderRadius: 10, border: '0.5px solid #1e261e', color: '#8a8a82', textDecoration: 'none', fontSize: 13 }}>
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
                style={{ padding: '5px 10px', border: '0.5px solid #1e261e', borderRadius: 8, background: '#141714', fontFamily: 'var(--font-body)', fontSize: 12, color: '#8a8a82', cursor: 'pointer' }}
              >
                {currencyOptions.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
              <button onClick={resetZoom} style={ctrlBtn}>Reset zoom</button>
              <button onClick={() => setExpanded(!expanded)} style={ctrlBtn}>{expanded ? 'Collapse' : 'Expand'}</button>
            </div>
          </div>
        )}

        <div style={{
          borderRadius: expanded && isMobile ? 0 : 14,
          overflow: 'hidden',
          background: '#0d1a14',
          cursor: 'grab',
          touchAction: 'none',
          border: expanded && isMobile ? 'none' : '0.5px solid #1a2a1e',
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

        {!(expanded && isMobile) && (
          <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: 10, color: '#3a3a32', letterSpacing: '0.8px', textTransform: 'uppercase' }}>Baseline price</span>
              {legendTiers.map(t => (
                <div key={t.color} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <div style={{ width: 9, height: 9, borderRadius: '50%', background: t.color, flexShrink: 0 }} />
                  <span style={{ fontSize: 11, color: '#4a4a42' }}>{t.label}</span>
                </div>
              ))}
            </div>
            {loadingCities && <p style={{ fontSize: 11, color: '#3a3a32', margin: 0 }}>Loading…</p>}
          </div>
        )}

        {expanded && isMobile && (
          <div style={{ padding: '0.75rem 1rem', display: 'flex', gap: 8, alignItems: 'center', background: '#141714', borderTop: '0.5px solid #1e261e' }}>
            <select
              value={currency}
              onChange={e => setCurrency(e.target.value)}
              style={{ flex: 1, padding: '5px 10px', border: '0.5px solid #1e261e', borderRadius: 8, background: '#0c0f0d', fontFamily: 'var(--font-body)', fontSize: 12, color: '#8a8a82' }}
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
  background: 'none', border: '0.5px solid #1e261e', borderRadius: 8,
  padding: '5px 10px', cursor: 'pointer', fontSize: 12, color: '#5a5a52',
  fontFamily: 'var(--font-body)',
}
