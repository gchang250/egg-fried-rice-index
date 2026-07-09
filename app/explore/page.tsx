'use client'

import { supabase } from '@/lib/supabase'
import NavBar from '@/app/components/NavBar'
import { useEffect, useRef, useState, useMemo } from 'react'
import * as d3 from 'd3'
import { Search } from 'lucide-react'

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
  if (!priceCAD || priceCAD <= 0) return '#4f4d48'
  if (priceCAD < 9.5) return '#eeb44f'
  if (priceCAD < 12.5) return '#b3b0a9'
  return '#d9383a'
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

export default function Explore() {
  const svgRef = useRef<SVGSVGElement>(null)
  const gRef  = useRef<SVGGElement>(null)
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null)

  const [selectedCity, setSelectedCity] = useState<City | null>(null)
  const [expanded, setExpanded]         = useState(false)
  const [cities, setCities]             = useState<City[]>([])
  const [loadingCities, setLoadingCities] = useState(true)
  const [isMobile, setIsMobile]         = useState(false)

  // Filters State
  const [priceRange, setPriceRange]     = useState(25)
  const [rentBurdenMax, setRentBurdenMax] = useState(100)
  const [provinceFilter, setProvinceFilter] = useState('All')

  // Tooltip & Search State
  const [hoveredCity, setHoveredCity] = useState<City | null>(null)
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 })
  const [searchQuery, setSearchQuery] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)

  const cvt = (cad: number) => `CA$${cad.toFixed(2)}`

  const legendTiers = [
    { color: '#eeb44f', label: `Under ${cvt(9.50)}` },
    { color: '#b3b0a9', label: `${cvt(9.50)} – ${cvt(12.50)}` },
    { color: '#d9383a', label: `Over ${cvt(12.50)}` },
  ]

  const provincesList = useMemo(() => {
    const seen = new Set<string>()
    cities.forEach(c => { if (c.region) seen.add(c.region) })
    return ['All', ...Array.from(seen).sort()]
  }, [cities])

  const filteredCities = useMemo(() => {
    return cities.filter(city => {
      const price = city.price_cad ?? 0
      const rent = city.median_rent_1br_cad
      const salary = city.median_monthly_salary_cad
      const burden = rent && salary ? (rent / salary) * 100 : null
      
      const matchPrice = price <= priceRange
      const matchRent = burden === null || burden <= rentBurdenMax
      const matchProvince = provinceFilter === 'All' || city.region === provinceFilter
      
      return matchPrice && matchRent && matchProvince
    })
  }, [cities, priceRange, rentBurdenMax, provinceFilter])

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

  // In-memory Rankings inside Canada
  const ranks = useMemo(() => {
    const priceSorted = [...cities]
      .filter(c => c.price_cad != null && c.price_cad > 0)
      .sort((a, b) => (a.price_cad ?? 0) - (b.price_cad ?? 0))
    
    const burdenSorted = [...cities]
      .filter(c => c.median_rent_1br_cad != null && c.median_monthly_salary_cad != null && c.median_monthly_salary_cad > 0)
      .sort((a, b) => {
        const burdenA = (a.median_rent_1br_cad ?? 0) / (a.median_monthly_salary_cad ?? 1)
        const burdenB = (b.median_rent_1br_cad ?? 0) / (b.median_monthly_salary_cad ?? 1)
        return burdenA - burdenB
      })

    const leftoverSorted = [...cities]
      .filter(c => c.price_cad != null && c.price_cad > 0 && c.median_rent_1br_cad != null && c.median_monthly_salary_cad != null)
      .sort((a, b) => {
        const leftA = (a.median_monthly_salary_cad ?? 0) - (a.median_rent_1br_cad ?? 0)
        const leftB = (b.median_monthly_salary_cad ?? 0) - (b.median_rent_1br_cad ?? 0)
        const bowlsA = leftA / (a.price_cad ?? 1)
        const bowlsB = leftB / (b.price_cad ?? 1)
        return bowlsB - bowlsA
      })

    const priceRankMap: Record<string, number> = {}
    priceSorted.forEach((c, idx) => { priceRankMap[c.city] = idx + 1 })

    const burdenRankMap: Record<string, number> = {}
    burdenSorted.forEach((c, idx) => { burdenRankMap[c.city] = idx + 1 })

    const leftoverRankMap: Record<string, number> = {}
    leftoverSorted.forEach((c, idx) => { leftoverRankMap[c.city] = idx + 1 })

    return {
      priceRank: priceRankMap,
      burdenRank: burdenRankMap,
      leftoverRank: leftoverRankMap,
      totalPriceCount: priceSorted.length,
      totalBurdenCount: burdenSorted.length,
      totalLeftoverCount: leftoverSorted.length,
    }
  }, [cities])

  // Similar Communities logic
  const similarCities = useMemo(() => {
    if (!selectedCity || !selectedCity.price_cad) return []
    const basePrice = selectedCity.price_cad
    return cities
      .filter(c => c.city !== selectedCity.city && c.price_cad != null)
      .map(c => ({ city: c, diff: Math.abs((c.price_cad ?? 0) - basePrice) }))
      .sort((a, b) => a.diff - b.diff)
      .slice(0, 3)
      .map(item => item.city)
  }, [selectedCity, cities])

  const suggestions = useMemo(() => {
    if (!searchQuery) return []
    const q = searchQuery.toLowerCase()
    return cities.filter(c => c.city.toLowerCase().includes(q) || (PROVINCE_NAMES[c.region ?? ''] ?? '').toLowerCase().includes(q))
  }, [searchQuery, cities])

  // Programmatic travel transition
  const zoomToCity = (city: City) => {
    if (!svgRef.current || !zoomRef.current || city.latitude == null || city.longitude == null) return
    const W = 800, H = 450
    const svg = d3.select(svgRef.current)
    const projection = d3.geoConicConformal()
      .center([0, 62])
      .rotate([96, 0])
      .parallels([49, 77])
      .scale(W * 0.8)
      .translate([W / 2, H / 2 + 50])
    
    const projected = projection([city.longitude, city.latitude])
    if (!projected) return
    const [x, y] = projected
    
    const scale = 5
    const transform = d3.zoomIdentity
      .translate(W / 2 - x * scale, H / 2 - y * scale)
      .scale(scale)
    
    svg.transition()
      .duration(750)
      .call(zoomRef.current.transform, transform)
    
    setSelectedCity(city)
    setSearchQuery('')
    setShowSuggestions(false)
  }

  const handleZoomIn = () => {
    if (!svgRef.current || !zoomRef.current) return
    d3.select(svgRef.current).transition().duration(250).call(zoomRef.current.scaleBy, 1.5)
  }

  const handleZoomOut = () => {
    if (!svgRef.current || !zoomRef.current) return
    d3.select(svgRef.current).transition().duration(250).call(zoomRef.current.scaleBy, 1 / 1.5)
  }

  const resetZoom = () => {
    if (!svgRef.current || !zoomRef.current) return
    d3.select(svgRef.current).transition().duration(500).call(zoomRef.current.transform, d3.zoomIdentity)
  }

  useEffect(() => {
    if (!svgRef.current || !gRef.current) return
    const W = 800, H = 450
    const svg = d3.select(svgRef.current)
    const g   = d3.select(gRef.current)
    g.selectAll('*').remove()

    const projection = d3.geoConicConformal()
      .center([0, 62])
      .rotate([96, 0])
      .parallels([49, 77])
      .scale(W * 0.8)
      .translate([W / 2, H / 2 + 50])
      
    const pathGen = d3.geoPath().projection(projection)

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([1, 12])
      .on('zoom', event => {
        g.attr('transform', event.transform)
        g.selectAll<SVGCircleElement, unknown>('.city-dot')
          .attr('r', 5 / event.transform.k)
          .attr('stroke-width', 1.2 / event.transform.k)
        g.selectAll<SVGCircleElement, unknown>('.city-aura')
          .attr('r', 10 / event.transform.k)
        g.selectAll<SVGCircleElement, unknown>('.city-ripple')
          .attr('stroke-width', 2 / event.transform.k)
        g.selectAll<SVGTextElement, unknown>('.city-label')
          .attr('font-size', 9 / event.transform.k)
          .attr('x', function () {
            const cx = parseFloat(d3.select(this.parentNode as SVGGElement).select('.city-dot').attr('cx'))
            return cx + 9 / event.transform.k
          })
          .attr('y', function () {
            const cy = parseFloat(d3.select(this.parentNode as SVGGElement).select('.city-dot').attr('cy'))
            return cy + 3.5 / event.transform.k
          })
          .attr('opacity', event.transform.k >= 3 ? 1 : 0)
      })

    zoomRef.current = zoom
    svg.call(zoom)

    // Defs & shadows
    svg.select('defs').remove()
    const defs = svg.append('defs')

    defs.append('radialGradient')
      .attr('id', 'oceanGlow')
      .attr('cx', '50%').attr('cy', '50%').attr('r', '75%')
      .selectAll('stop')
      .data([
        { offset: '0%', color: 'var(--color-surface-2)' },
        { offset: '100%', color: 'var(--color-bg)' }
      ])
      .enter().append('stop')
      .attr('offset', d => d.offset)
      .attr('stop-color', d => d.color)

    const shadowFilter = defs.append('filter')
      .attr('id', 'landShadow')
      .attr('x', '-10%').attr('y', '-10%')
      .attr('width', '120%').attr('height', '120%')

    shadowFilter.append('feDropShadow')
      .attr('dx', '0')
      .attr('dy', '3')
      .attr('stdDeviation', '3')
      .attr('flood-color', '#000000')
      .attr('flood-opacity', '0.65')

    // Ocean rect
    g.append('rect')
      .attr('width', W)
      .attr('height', H)
      .attr('fill', 'url(#oceanGlow)')

    // Load Canada GeoJSON
    d3.json('/canada.geojson').then((canada: any) => {
      // Draw Canada Provinces
      g.append('g')
        .selectAll('path')
        .data(canada.features)
        .enter()
        .append('path')
        .attr('d', pathGen as any)
        .attr('fill', 'var(--color-surface)')
        .attr('stroke', 'var(--color-border)')
        .attr('stroke-width', 0.6)
        .attr('filter', 'url(#landShadow)')

      filteredCities.forEach(city => {
        if (city.longitude === null || city.latitude === null) return
        const projected = projection([Number(city.longitude), Number(city.latitude)] as [number, number])
        if (!projected) return
        const [x, y] = projected
        
        const cityG = g.append('g')
          .style('cursor', 'pointer')
          .attr('pointer-events', 'all')
          .on('click', () => zoomToCity(city))
          .on('mouseover', (event) => {
            setHoveredCity(city)
            setTooltipPos({ x: event.clientX, y: event.clientY })
          })
          .on('mousemove', (event) => {
            setTooltipPos({ x: event.clientX, y: event.clientY })
          })
          .on('mouseleave', () => {
            setHoveredCity(null)
          })

        // Outer aura
        cityG.append('circle')
          .attr('class', 'city-aura')
          .attr('cx', x).attr('cy', y)
          .attr('r', 10)
          .attr('fill', dotColor(city.price_cad))
          .attr('opacity', 0.25)
          .attr('pointer-events', 'none')

        // Inner solid dot
        cityG.append('circle')
          .attr('class', 'city-dot')
          .attr('cx', x).attr('cy', y)
          .attr('r', 5)
          .attr('fill', dotColor(city.price_cad))
          .attr('stroke', '#060608')
          .attr('stroke-width', 1.2)

        // Pulsating ripple if selected
        const isSelected = selectedCity && selectedCity.city === city.city
        if (isSelected) {
          cityG.append('circle')
            .attr('class', 'city-ripple')
            .attr('cx', x).attr('cy', y)
            .attr('r', 5)
            .attr('fill', 'none')
            .attr('stroke', dotColor(city.price_cad))
            .attr('stroke-width', 2)
            .attr('opacity', 1)
            .transition()
            .duration(1500)
            .ease(d3.easeLinear)
            .attr('r', 25)
            .attr('opacity', 0)
            .on('end', function repeat() {
              d3.select(this)
                .attr('r', 5)
                .attr('opacity', 1)
                .transition()
                .duration(1500)
                .ease(d3.easeLinear)
                .attr('r', 25)
                .attr('opacity', 0)
                .on('end', repeat)
            })
        }

        // Text label
        cityG.append('text')
          .attr('class', 'city-label')
          .attr('x', x + 9).attr('y', y + 3.5)
          .attr('font-size', 9)
          .attr('fill', '#d4cebe')
          .attr('font-family', 'var(--font-mono)')
          .attr('pointer-events', 'none')
          .attr('opacity', 0)
          .text(city.city)
      })

      // Retain scale transformations during filter state redraws
      const transform = d3.zoomTransform(svgRef.current!)
      if (transform.k > 1) {
        g.selectAll<SVGCircleElement, unknown>('.city-dot')
          .attr('r', 5 / transform.k)
          .attr('stroke-width', 1.2 / transform.k)
        g.selectAll<SVGCircleElement, unknown>('.city-aura')
          .attr('r', 10 / transform.k)
        g.selectAll<SVGCircleElement, unknown>('.city-ripple')
          .attr('stroke-width', 2 / transform.k)
        g.selectAll<SVGTextElement, unknown>('.city-label')
          .attr('font-size', 9 / transform.k)
          .attr('x', function () {
            const cx = parseFloat(d3.select(this.parentNode as SVGGElement).select('.city-dot').attr('cx'))
            return cx + 9 / transform.k
          })
          .attr('y', function () {
            const cy = parseFloat(d3.select(this.parentNode as SVGGElement).select('.city-dot').attr('cy'))
            return cy + 3.5 / transform.k
          })
          .attr('opacity', transform.k >= 3 ? 1 : 0)
      }
    })
  }, [expanded, cities, isMobile, filteredCities, selectedCity])

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

      {/* Floating Hover Tooltip */}
      {hoveredCity && (
        <div style={{
          position: 'fixed',
          left: tooltipPos.x + 15,
          top: tooltipPos.y - 15,
          zIndex: 1000,
          pointerEvents: 'none',
          background: 'var(--color-surface)',
          backdropFilter: 'blur(12px)',
          border: '1.5px solid var(--color-border)',
          borderRadius: 12,
          padding: '10px 14px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
          color: 'var(--color-text-1)',
          minWidth: 160,
          transform: 'translate3d(0,0,0)',
          animation: 'fadeIn 0.15s ease-out'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <span style={{ fontSize: 16 }}>🇨🇦</span>
            <span style={{ fontSize: 13, fontWeight: 600 }}>{hoveredCity.city}</span>
          </div>
          <div style={{ fontSize: 11, color: 'var(--color-text-3)', marginBottom: 2 }}>
            {PROVINCE_NAMES[hoveredCity.region ?? ''] || hoveredCity.region}, Canada
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, borderTop: '0.5px solid var(--color-border)', paddingTop: 6 }}>
            <span style={{ fontSize: 11, color: 'var(--color-text-2)' }}>Poutine:</span>
            <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--color-accent)' }}>
              {hoveredCity.price_cad ? cvt(hoveredCity.price_cad) : 'Pending'}
            </span>
          </div>
          {ranks.priceRank[hoveredCity.city] && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
              <span style={{ fontSize: 10, color: 'var(--color-text-3)' }}>Canada Rank:</span>
              <span style={{ fontSize: 10, fontWeight: 500, color: 'var(--color-green)' }}>
                #{ranks.priceRank[hoveredCity.city]} of {ranks.totalPriceCount}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Sliding Glass Drawer */}
      <div style={{
        position: 'fixed', top: 0, right: 0,
        width: isMobile ? '100vw' : 390, maxWidth: '100vw',
        height: '100vh',
        background: 'var(--color-surface)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderLeft: isMobile ? 'none' : '0.5px solid var(--color-border)',
        zIndex: 100, overflowY: 'auto',
        transform: selectedCity ? 'translateX(0)' : isMobile ? 'translateX(100vw)' : 'translateX(420px)',
        transition: 'transform 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
        padding: isMobile ? '1.5rem 1.25rem' : '2rem',
        boxSizing: 'border-box',
        boxShadow: selectedCity ? '-10px 0 40px rgba(0, 0, 0, 0.15)' : 'none',
      }}>
        {selectedCity && (() => {
          const bowls = drawerBowlsAfterRent(selectedCity)
          const burden = rentBurden(selectedCity)
          const provName = selectedCity.region ? PROVINCE_NAMES[selectedCity.region] || selectedCity.region : ''
          return (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                <div>
                  <div style={{ fontSize: 32, marginBottom: 6 }}>🇨🇦</div>
                  <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 30, letterSpacing: -0.5, margin: 0, color: 'var(--color-text-1)', fontWeight: 400 }}>
                    {selectedCity.city}
                  </h2>
                  <p style={{ fontSize: 13, color: 'var(--color-text-3)', margin: '4px 0 0' }}>
                    {provName} · Canada
                    {selectedCity.population ? ` · Pop. ${Number(selectedCity.population).toLocaleString()}` : ''}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedCity(null)}
                  style={{ background: 'none', border: '0.5px solid var(--color-border)', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', fontSize: 12, color: 'var(--color-text-3)', fontFamily: 'var(--font-body)', flexShrink: 0 }}
                >
                  ✕
                </button>
              </div>

              {/* Baseline Price Section */}
              <div style={{ borderTop: '0.5px solid var(--color-border)', paddingTop: '1.25rem', marginBottom: '1.25rem' }}>
                <p style={{ fontSize: 10, fontWeight: 500, letterSpacing: '1.2px', textTransform: 'uppercase', color: 'var(--color-text-3)', margin: '0 0 0.5rem' }}>Baseline poutine</p>
                <p style={{ fontFamily: 'var(--font-display)', fontSize: 40, color: 'var(--color-accent)', margin: 0, lineHeight: 1 }}>
                  {selectedCity.price_cad ? cvt(selectedCity.price_cad) : 'Pending'}
                </p>
                {selectedCity.confidence_score && (
                  <p style={{ fontSize: 11, color: 'var(--color-text-3)', margin: '6px 0 0' }}>
                    {Math.round(selectedCity.confidence_score <= 1 ? selectedCity.confidence_score * 100 : selectedCity.confidence_score)}% confidence score
                  </p>
                )}
              </div>

              {/* Ranks Cards Section */}
              <div style={{ borderTop: '0.5px solid var(--color-border)', paddingTop: '1.25rem', marginBottom: '1.25rem' }}>
                <p style={{ fontSize: 10, fontWeight: 500, letterSpacing: '1.2px', textTransform: 'uppercase', color: 'var(--color-text-3)', margin: '0 0 0.75rem' }}>Canada Index Ranks</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                  {ranks.priceRank[selectedCity.city] ? (
                    <div style={{ background: 'var(--color-surface)', borderRadius: 10, padding: '8px', textAlign: 'center', border: '0.5px solid var(--color-border)' }}>
                      <p style={{ fontSize: 8.5, color: 'var(--color-text-3)', textTransform: 'uppercase', margin: '0 0 4px', letterSpacing: '0.5px' }}>Price Rank</p>
                      <p style={{ fontFamily: 'var(--font-display)', fontSize: 15, color: 'var(--color-accent)', margin: 0, fontWeight: 500 }}>
                        #{ranks.priceRank[selectedCity.city]}
                      </p>
                      <p style={{ fontSize: 8, color: 'var(--color-text-4)', margin: '2px 0 0' }}>of {ranks.totalPriceCount}</p>
                    </div>
                  ) : null}
                  {ranks.burdenRank[selectedCity.city] ? (
                    <div style={{ background: 'var(--color-surface)', borderRadius: 10, padding: '8px', textAlign: 'center', border: '0.5px solid var(--color-border)' }}>
                      <p style={{ fontSize: 8.5, color: 'var(--color-text-3)', textTransform: 'uppercase', margin: '0 0 4px', letterSpacing: '0.5px' }}>Rent burden</p>
                      <p style={{ fontFamily: 'var(--font-display)', fontSize: 15, color: 'var(--color-green)', margin: 0, fontWeight: 500 }}>
                        #{ranks.burdenRank[selectedCity.city]}
                      </p>
                      <p style={{ fontSize: 8, color: 'var(--color-text-4)', margin: '2px 0 0' }}>of {ranks.totalBurdenCount}</p>
                    </div>
                  ) : null}
                  {ranks.leftoverRank[selectedCity.city] ? (
                    <div style={{ background: 'var(--color-surface)', borderRadius: 10, padding: '8px', textAlign: 'center', border: '0.5px solid var(--color-border)' }}>
                      <p style={{ fontSize: 8.5, color: 'var(--color-text-3)', textTransform: 'uppercase', margin: '0 0 4px', letterSpacing: '0.5px' }}>Leftover poutines</p>
                      <p style={{ fontFamily: 'var(--font-display)', fontSize: 15, color: 'var(--color-accent)', margin: 0, fontWeight: 500 }}>
                        #{ranks.leftoverRank[selectedCity.city]}
                      </p>
                      <p style={{ fontSize: 8, color: 'var(--color-text-4)', margin: '2px 0 0' }}>of {ranks.totalLeftoverCount}</p>
                    </div>
                  ) : null}
                </div>
              </div>

              {/* Economic stats */}
              <div style={{ borderTop: '0.5px solid var(--color-border)', paddingTop: '1.25rem', marginBottom: '1.25rem' }}>
                <p style={{ fontSize: 10, fontWeight: 500, letterSpacing: '1.2px', textTransform: 'uppercase', color: 'var(--color-text-3)', margin: '0 0 0.75rem' }}>Local Affordability</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                  <div>
                    <span style={{ fontSize: 11, color: 'var(--color-text-3)' }}>Median gross pay:</span>
                    <p style={{ fontSize: 15, margin: '2px 0 0', fontWeight: 500, fontFamily: 'var(--font-mono)' }}>
                      {selectedCity.median_monthly_salary_cad ? cvt(selectedCity.median_monthly_salary_cad) : 'N/A'}<span style={{ fontSize: 10, color: 'var(--color-text-3)' }}>/mo</span>
                    </p>
                  </div>
                  <div>
                    <span style={{ fontSize: 11, color: 'var(--color-text-3)' }}>Median 1BR rent:</span>
                    <p style={{ fontSize: 15, margin: '2px 0 0', fontWeight: 500, fontFamily: 'var(--font-mono)' }}>
                      {selectedCity.median_rent_1br_cad ? cvt(selectedCity.median_rent_1br_cad) : 'N/A'}<span style={{ fontSize: 10, color: 'var(--color-text-3)' }}>/mo</span>
                    </p>
                  </div>
                </div>

                <div style={{ marginBottom: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
                    <span style={{ color: 'var(--color-text-3)' }}>Rent burden share:</span>
                    <span style={{ fontWeight: 600, color: burden && burden > 50 ? 'var(--color-red)' : burden && burden > 35 ? 'var(--color-accent)' : 'var(--color-green)' }}>{burden ? `${burden}%` : 'N/A'}</span>
                  </div>
                  <div style={{ height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: burden ? `${burden}%` : '0%', background: burden && burden > 50 ? 'var(--color-red)' : burden && burden > 35 ? 'var(--color-accent)' : 'var(--color-green)', borderRadius: 3 }} />
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
                    <span style={{ color: 'var(--color-text-3)' }}>Poutines left after rent:</span>
                    <span style={{ fontWeight: 600, color: 'var(--color-accent)' }}>{bowls ? `${bowls} 🍟` : 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Blurb */}
              {selectedCity.blurb && (
                <div style={{ borderTop: '0.5px solid var(--color-border)', paddingTop: '1.25rem', marginBottom: '1.25rem' }}>
                  <p style={{ fontSize: 13, color: 'var(--color-text-2)', lineHeight: 1.6, margin: 0 }}>
                    {selectedCity.blurb}
                  </p>
                </div>
              )}

              {/* Similar Cities */}
              {similarCities.length > 0 && (
                <div style={{ borderTop: '0.5px solid var(--color-border)', paddingTop: '1.25rem' }}>
                  <p style={{ fontSize: 10, fontWeight: 500, letterSpacing: '1.2px', textTransform: 'uppercase', color: 'var(--color-text-3)', margin: '0 0 0.5rem' }}>Similar price tier</p>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {similarCities.map(c => (
                      <button
                        key={c.city}
                        onClick={() => zoomToCity(c)}
                        style={{
                          background: 'none', border: '0.5px solid var(--color-border)',
                          borderRadius: 8, padding: '6px 12px', cursor: 'pointer',
                          fontSize: 11.5, color: 'var(--color-text-2)', display: 'inline-flex',
                          alignItems: 'center', gap: 4
                        }}
                      >
                        🇨🇦 {c.city}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ borderTop: '0.5px solid var(--color-border)', paddingTop: '1.25rem', marginTop: '1.5rem', display: 'flex', justifyContent: 'space-between' }}>
                <a href={`/cities/${selectedCity.city.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`} style={{ fontSize: 12.5, color: 'var(--color-accent)', textDecoration: 'none', fontWeight: 500 }}>
                  Detailed profile & restaurants →
                </a>
              </div>
            </>
          )
        })()}
      </div>

      {/* NavBar */}
      <NavBar active="explore" />

      {/* Main Map Area Container */}
      <div style={{ position: 'relative', width: '100vw', height: 'calc(100vh - 68px)', overflow: 'hidden' }}>
        
        {/* Dynamic Zooming Map */}
        {loadingCities && (
          <div style={{ position: 'absolute', inset: 0, background: 'var(--color-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10, color: 'var(--color-text-3)', fontFamily: 'var(--font-mono)', fontSize: 13 }}>
            INITIALIZING MAP DATABASES...
          </div>
        )}

        <svg ref={svgRef} viewBox="0 0 800 450" preserveAspectRatio="xMidYMid slice" style={{ display: 'block', width: '100%', height: '100%', outline: 'none' }}>
          <g ref={gRef} />
        </svg>

        {/* Floating Search Controls */}
        <div style={{
          position: 'absolute', top: 20, left: 20, zIndex: 20,
          display: 'flex', flexDirection: 'column', gap: 10,
          width: isMobile ? 'calc(100vw - 40px)' : 340
        }}>
          {/* Search bar */}
          <div style={{ position: 'relative' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              background: 'var(--color-surface)', backdropFilter: 'blur(16px)',
              border: '0.5px solid var(--color-border)', borderRadius: 10,
              padding: '8px 14px', boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
            }}>
              <Search size={16} style={{ color: 'var(--color-text-3)' }} />
              <input
                type="text"
                placeholder="Search Canadian community..."
                value={searchQuery}
                onChange={e => {
                  setSearchQuery(e.target.value)
                  setShowSuggestions(true)
                }}
                onFocus={() => setShowSuggestions(true)}
                style={{
                  background: 'none', border: 'none', color: 'var(--color-text-1)',
                  fontSize: 13.5, width: '100%', outline: 'none', fontFamily: 'var(--font-body)'
                }}
              />
            </div>
            {showSuggestions && suggestions.length > 0 && (
              <div style={{
                position: 'absolute', top: '100%', left: 0, right: 0,
                marginTop: 6, background: 'var(--color-surface)',
                backdropFilter: 'blur(20px)', border: '0.5px solid var(--color-border)',
                borderRadius: 10, boxShadow: '0 12px 40px rgba(0,0,0,0.1)',
                maxHeight: 240, overflowY: 'auto', zIndex: 30
              }}>
                {suggestions.map(c => (
                  <button
                    key={c.city}
                    onClick={() => zoomToCity(c)}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                      padding: '10px 14px', background: 'none', border: 'none',
                      textAlign: 'left', cursor: 'pointer', borderBottom: '0.5px solid var(--color-border)',
                      transition: 'background 0.2s'
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--color-surface-2)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'none'}
                  >
                    <span style={{ fontSize: 16 }}>🇨🇦</span>
                    <div>
                      <span style={{ fontSize: 13, color: 'var(--color-text-1)', fontWeight: 500 }}>{c.city}</span>
                      <span style={{ fontSize: 11, color: 'var(--color-text-3)', marginLeft: 8 }}>{PROVINCE_NAMES[c.region ?? ''] || c.region}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Filter Card */}
          <div style={{
            background: 'var(--color-surface)', backdropFilter: 'blur(16px)',
            border: '0.5px solid var(--color-border)', borderRadius: 10,
            padding: '16px', boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
            display: 'flex', flexDirection: 'column', gap: 12
          }}>
            {/* Expanded toggle */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 11.5, fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase', color: 'var(--color-text-2)' }}>Index Controls</span>
              <button
                onClick={() => setExpanded(!expanded)}
                style={{ background: 'none', border: 'none', color: 'var(--color-accent)', fontSize: 11.5, cursor: 'pointer' }}
              >
                {expanded ? 'Hide filters' : 'Show filters'}
              </button>
            </div>

            {/* Always Visible stats */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', borderTop: 'var(--color-border)', paddingTop: 10 }}>
              <div>
                <span style={{ fontSize: 9.5, color: 'var(--color-text-3)', textTransform: 'uppercase' }}>Filtered count</span>
                <p style={{ fontSize: 16, margin: '2px 0 0', fontWeight: 500, color: 'var(--color-text-1)' }}>
                  {filteredCities.length} of {cities.length}
                </p>
              </div>
              <div>
                <span style={{ fontSize: 9.5, color: 'var(--color-text-3)', textTransform: 'uppercase' }}>Avg baseline</span>
                <p style={{ fontSize: 16, margin: '2px 0 0', fontWeight: 500, color: 'var(--color-accent)' }}>
                  {filteredCities.length > 0
                    ? cvt(filteredCities.reduce((s, c) => s + (c.price_cad ?? 0), 0) / filteredCities.length)
                    : 'N/A'
                  }
                </p>
              </div>
            </div>

            {/* Filter controls */}
            {expanded && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, borderTop: '0.5px solid var(--color-border)', paddingTop: 12, animation: 'fadeIn 0.2s ease-out' }}>
                {/* Max price slider */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
                    <span style={{ color: 'var(--color-text-2)' }}>Max baseline price:</span>
                    <span style={{ fontWeight: 600, color: 'var(--color-accent)' }}>{cvt(priceRange)}</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="25"
                    step="0.5"
                    value={priceRange}
                    onChange={e => setPriceRange(Number(e.target.value))}
                    style={{ width: '100%', accentColor: 'var(--color-accent)' }}
                  />
                </div>

                {/* Max rent burden */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
                    <span style={{ color: 'var(--color-text-2)' }}>Max rent burden:</span>
                    <span style={{ fontWeight: 600, color: 'var(--color-accent)' }}>{rentBurdenMax}%</span>
                  </div>
                  <input
                    type="range"
                    min="15"
                    max="100"
                    step="5"
                    value={rentBurdenMax}
                    onChange={e => setRentBurdenMax(Number(e.target.value))}
                    style={{ width: '100%', accentColor: 'var(--color-accent)' }}
                  />
                </div>

                {/* Province Filter */}
                <div>
                  <label style={{ display: 'block', fontSize: 11, color: 'var(--color-text-2)', marginBottom: 5 }}>Province / Territory:</label>
                  <select
                    value={provinceFilter}
                    onChange={e => setProvinceFilter(e.target.value)}
                    style={{
                      width: '100%', background: 'var(--color-bg)', border: '0.5px solid var(--color-border)',
                      borderRadius: 6, padding: '6px 10px', color: 'var(--color-text-1)', fontSize: 13,
                      outline: 'none', fontFamily: 'var(--font-body)'
                    }}
                  >
                    {provincesList.map(prov => (
                      <option key={prov} value={prov} style={{ background: 'var(--color-bg)' }}>
                        {prov === 'All' ? 'All Canada' : PROVINCE_NAMES[prov] || prov}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Floating Map Utility Buttons (Zoom +/- Reset) */}
        <div style={{
          position: 'absolute', bottom: 20, right: 20, zIndex: 20,
          display: 'flex', flexDirection: 'column', gap: 6
        }}>
          <button onClick={handleZoomIn} style={{ width: 34, height: 34, background: 'var(--color-surface)', backdropFilter: 'blur(12px)', border: '0.5px solid var(--color-border)', borderRadius: 8, color: 'var(--color-text-1)', fontSize: 16, fontWeight: 'bold', cursor: 'pointer' }}>+</button>
          <button onClick={handleZoomOut} style={{ width: 34, height: 34, background: 'var(--color-surface)', backdropFilter: 'blur(12px)', border: '0.5px solid var(--color-border)', borderRadius: 8, color: 'var(--color-text-1)', fontSize: 16, fontWeight: 'bold', cursor: 'pointer' }}>−</button>
          <button onClick={resetZoom} style={{ width: 34, height: 34, background: 'var(--color-surface)', backdropFilter: 'blur(12px)', border: '0.5px solid var(--color-border)', borderRadius: 8, color: 'var(--color-text-2)', fontSize: 11, cursor: 'pointer' }}>Reset</button>
        </div>

        {/* Map Legend Overlay */}
        <div style={{
          position: 'absolute', bottom: 20, left: 20, zIndex: 20,
          background: 'var(--color-surface)', backdropFilter: 'blur(12px)',
          border: '0.5px solid var(--color-border)', borderRadius: 10,
          padding: '10px 14px', boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
          display: 'flex', flexDirection: 'column', gap: 6
        }}>
          <span style={{ fontSize: 9.5, fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase', color: 'var(--color-text-3)', marginBottom: 2 }}>Baseline Price</span>
          {legendTiers.map(tier => (
            <div key={tier.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: tier.color }} />
              <span style={{ fontSize: 11, color: 'var(--color-text-2)', fontFamily: 'var(--font-mono)' }}>{tier.label}</span>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
