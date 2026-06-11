'use client'

import { supabase } from '@/lib/supabase'
import NavBar from '@/app/components/NavBar'
import { useEffect, useRef, useState, useMemo } from 'react'
import * as d3 from 'd3'
import * as topojson from 'topojson-client'
import { RATES as rates, SYMBOLS as symbols } from '@/app/cities/[city]/CityPageContent'
import { Search } from 'lucide-react'

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

  // Tooltip & Search State
  const [hoveredCity, setHoveredCity] = useState<City | null>(null)
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 })
  const [searchQuery, setSearchQuery] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)

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

  // In-memory Global Rankings
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
      minPrice: priceSorted[0]?.price_cad ?? null,
      maxPrice: priceSorted[priceSorted.length - 1]?.price_cad ?? null,
    }
  }, [cities])

  // Similar Cities logic
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
    return cities.filter(c => c.city.toLowerCase().includes(q) || (c.country ?? '').toLowerCase().includes(q))
  }, [searchQuery, cities])

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

  // Programmatic travel transition
  const zoomToCity = (city: City) => {
    if (!svgRef.current || !zoomRef.current || city.latitude == null || city.longitude == null) return
    const W = 700, H = 380
    const svg = d3.select(svgRef.current)
    const projection = d3.geoNaturalEarth1().scale(115).translate([W / 2, H / 2 + 14])
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

    // SVG Gradient & Shadows Definitions
    svg.select('defs').remove()
    const defs = svg.append('defs')

    defs.append('radialGradient')
      .attr('id', 'oceanGlow')
      .attr('cx', '50%').attr('cy', '50%').attr('r', '75%')
      .selectAll('stop')
      .data([
        { offset: '0%', color: '#13131c' },
        { offset: '100%', color: '#060608' }
      ])
      .enter().append('stop')
      .attr('offset', d => d.offset)
      .attr('stop-color', d => d.color)

    const shadowFilter = defs.append('filter')
      .attr('id', 'landShadow')
      .attr('x', '-20%').attr('y', '-20%')
      .attr('width', '140%').attr('height', '140%')

    shadowFilter.append('feDropShadow')
      .attr('dx', '0')
      .attr('dy', '4')
      .attr('stdDeviation', '4')
      .attr('flood-color', '#000000')
      .attr('flood-opacity', '0.75')

    // Append Ocean
    g.append('rect')
      .attr('width', W)
      .attr('height', H)
      .attr('fill', 'url(#oceanGlow)')

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
      // Draw Continents with float shadow
      g.append('g')
        .selectAll('path')
        .data((topojson.feature(world, world.objects.countries) as any).features)
        .enter()
        .append('path')
        .attr('d', pathGen as any)
        .attr('fill', '#151522')
        .attr('stroke', '#28283a')
        .attr('stroke-width', 0.5)
        .attr('filter', 'url(#landShadow)')

      filteredCities.forEach(city => {
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

        // Outer glow aura
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

      // Retain size scale transformations during filter state redraws
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
  }, [expanded, cities, isMobile, priceRange, rentBurdenMax, regionFilter, selectedCity])

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
          background: 'rgba(18, 18, 24, 0.82)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(200, 168, 98, 0.4)',
          borderRadius: 12,
          padding: '10px 14px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          color: 'var(--color-text-1)',
          minWidth: 160,
          transform: 'translate3d(0,0,0)',
          animation: 'fadeIn 0.15s ease-out'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <span style={{ fontSize: 16 }}>{hoveredCity.flag ?? '🌍'}</span>
            <span style={{ fontSize: 13, fontWeight: 600 }}>{hoveredCity.city}</span>
          </div>
          <div style={{ fontSize: 11, color: 'var(--color-text-3)', marginBottom: 2 }}>
            {[hoveredCity.region, hoveredCity.country].filter(Boolean).join(', ')}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, borderTop: '0.5px solid rgba(255,255,255,0.08)', paddingTop: 6 }}>
            <span style={{ fontSize: 11, color: 'var(--color-text-2)' }}>Fried Rice:</span>
            <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--color-accent)' }}>
              {hoveredCity.price_cad ? cvt(hoveredCity.price_cad) : 'Pending'}
            </span>
          </div>
          {ranks.priceRank[hoveredCity.city] && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
              <span style={{ fontSize: 10, color: 'var(--color-text-3)' }}>Global Rank:</span>
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
        background: 'rgba(16, 16, 20, 0.82)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderLeft: isMobile ? 'none' : '0.5px solid var(--color-border)',
        zIndex: 100, overflowY: 'auto',
        transform: selectedCity ? 'translateX(0)' : isMobile ? 'translateX(100vw)' : 'translateX(420px)',
        transition: 'transform 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
        padding: isMobile ? '1.5rem 1.25rem' : '2rem',
        boxSizing: 'border-box',
        boxShadow: selectedCity ? '-10px 0 40px rgba(0, 0, 0, 0.7)' : 'none',
      }}>
        {selectedCity && (() => {
          const bowls = drawerBowlsAfterRent(selectedCity)
          const burden = rentBurden(selectedCity)
          return (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                <div>
                  <div style={{ fontSize: 32, marginBottom: 6 }}>{selectedCity.flag ?? '🌍'}</div>
                  <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 30, letterSpacing: -0.5, margin: 0, color: 'var(--color-text-1)', fontWeight: 400 }}>
                    {selectedCity.city}
                  </h2>
                  <p style={{ fontSize: 13, color: 'var(--color-text-3)', margin: '4px 0 0' }}>
                    {[selectedCity.region, selectedCity.country].filter(Boolean).join(', ')}
                    {selectedCity.population ? ` · ${Number(selectedCity.population).toLocaleString()}` : ''}
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
                <p style={{ fontSize: 10, fontWeight: 500, letterSpacing: '1.2px', textTransform: 'uppercase', color: 'var(--color-text-3)', margin: '0 0 0.5rem' }}>Baseline fried rice</p>
                <p style={{ fontFamily: 'var(--font-display)', fontSize: 40, color: 'var(--color-accent)', margin: 0, lineHeight: 1 }}>
                  {selectedCity.price_cad ? cvt(selectedCity.price_cad) : 'Pending'}
                </p>
                {selectedCity.confidence_score && (
                  <p style={{ fontSize: 12, color: 'var(--color-text-3)', margin: '6px 0 0' }}>
                    {Math.round(selectedCity.confidence_score <= 1 ? selectedCity.confidence_score * 100 : selectedCity.confidence_score)}% confidence
                  </p>
                )}
              </div>

              {/* Ranks Cards Section */}
              <div style={{ borderTop: '0.5px solid var(--color-border)', paddingTop: '1.25rem', marginBottom: '1.25rem' }}>
                <p style={{ fontSize: 10, fontWeight: 500, letterSpacing: '1.2px', textTransform: 'uppercase', color: 'var(--color-text-3)', margin: '0 0 0.75rem' }}>Global Index Ranks</p>
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
                      <p style={{ fontSize: 8.5, color: 'var(--color-text-3)', textTransform: 'uppercase', margin: '0 0 4px', letterSpacing: '0.5px' }}>Leftover bowls</p>
                      <p style={{ fontFamily: 'var(--font-display)', fontSize: 15, color: 'var(--color-accent)', margin: 0, fontWeight: 500 }}>
                        #{ranks.leftoverRank[selectedCity.city]}
                      </p>
                      <p style={{ fontSize: 8, color: 'var(--color-text-4)', margin: '2px 0 0' }}>of {ranks.totalLeftoverCount}</p>
                    </div>
                  ) : null}
                </div>
              </div>

              {/* Global Spectrum Slider */}
              {selectedCity.price_cad && ranks.minPrice && ranks.maxPrice && (
                <div style={{ borderTop: '0.5px solid var(--color-border)', paddingTop: '1.25rem', marginBottom: '1.25rem' }}>
                  <p style={{ fontSize: 10, fontWeight: 500, letterSpacing: '1.2px', textTransform: 'uppercase', color: 'var(--color-text-3)', margin: '0 0 0.5rem' }}>Global Price Spectrum</p>
                  <div style={{ position: 'relative', height: 6, borderRadius: 3, background: 'linear-gradient(to right, var(--color-green), var(--color-accent), var(--color-red))', marginTop: 14, marginBottom: 8 }}>
                    <div style={{
                      position: 'absolute',
                      left: `${((selectedCity.price_cad - ranks.minPrice) / (ranks.maxPrice - ranks.minPrice)) * 100}%`,
                      top: -4,
                      transform: 'translateX(-50%)',
                      width: 14,
                      height: 14,
                      borderRadius: '50%',
                      background: '#fff',
                      border: '3px solid var(--color-accent)',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.4)',
                    }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: 'var(--color-text-3)', fontFamily: 'var(--font-mono)' }}>
                    <span>Min: {cvt(ranks.minPrice)}</span>
                    <span style={{ color: 'var(--color-accent)', fontWeight: 500 }}>Current: {cvt(selectedCity.price_cad)}</span>
                    <span>Max: {cvt(ranks.maxPrice)}</span>
                  </div>
                </div>
              )}

              {/* Bowls after Rent Burden cards */}
              {(bowls !== null || burden !== null) && (
                <div style={{ borderTop: '0.5px solid var(--color-border)', paddingTop: '1.25rem', marginBottom: '1.25rem', display: 'flex', gap: '0.75rem' }}>
                  {bowls !== null && (
                    <div style={{ flex: 1, background: 'var(--color-surface)', border: '0.5px solid var(--color-border)', borderRadius: 12, padding: '0.9rem' }}>
                      <p style={{ fontSize: 10, color: 'var(--color-text-3)', letterSpacing: '1px', textTransform: 'uppercase', margin: '0 0 0.35rem' }}>After rent</p>
                      <p style={{ fontFamily: 'var(--font-display)', fontSize: 26, color: 'var(--color-green)', margin: 0 }}>{bowls} <span style={{ fontSize: 16 }}>🍚</span></p>
                      <p style={{ fontSize: 11, color: 'var(--color-text-3)', margin: '3px 0 0' }}>bowls / month</p>
                    </div>
                  )}
                  {burden !== null && (
                    <div style={{ flex: 1, background: 'var(--color-surface)', border: '0.5px solid var(--color-border)', borderRadius: 12, padding: '0.9rem' }}>
                      <p style={{ fontSize: 10, color: 'var(--color-text-3)', letterSpacing: '1px', textTransform: 'uppercase', margin: '0 0 0.35rem' }}>Rent burden</p>
                      <p style={{ fontFamily: 'var(--font-display)', fontSize: 26, color: burden > 70 ? 'var(--color-red)' : burden > 50 ? 'var(--color-accent)' : 'var(--color-green)', margin: 0 }}>{burden}%</p>
                      <p style={{ fontSize: 11, color: 'var(--color-text-3)', margin: '3px 0 0' }}>of median salary</p>
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

              {/* Similar Cities Suggestions */}
              {similarCities.length > 0 && (
                <div style={{ borderTop: '0.5px solid var(--color-border)', paddingTop: '1.25rem', marginBottom: '1.25rem' }}>
                  <p style={{ fontSize: 10, fontWeight: 500, letterSpacing: '1.2px', textTransform: 'uppercase', color: 'var(--color-text-3)', margin: '0 0 0.6rem' }}>Similar price bracket</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {similarCities.map(c => (
                      <div
                        key={c.city}
                        onClick={() => zoomToCity(c)}
                        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', borderRadius: 8, background: 'var(--color-surface)', border: '0.5px solid var(--color-border)', cursor: 'pointer', fontSize: 12.5, transition: 'all 0.2s' }}
                        onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--color-accent)'}
                        onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--color-border)'}
                      >
                        <span style={{ color: 'var(--color-text-2)' }}>{c.flag} {c.city}</span>
                        <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text-2)' }}>{c.price_cad ? cvt(c.price_cad) : ''}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedCity.blurb && (
                <div style={{ borderTop: '0.5px solid var(--color-border)', paddingTop: '1.25rem', marginBottom: '1.5rem' }}>
                  <p style={{ fontSize: 10, fontWeight: 500, letterSpacing: '1.2px', textTransform: 'uppercase', color: 'var(--color-text-3)', margin: '0 0 0.6rem' }}>City context</p>
                  <p style={{ fontSize: 13, color: 'var(--color-text-2)', lineHeight: 1.7, margin: 0 }}>{selectedCity.blurb}</p>
                </div>
              )}

              <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', borderTop: '0.5px solid var(--color-border)', paddingTop: '1.25rem' }}>
                <a
                  href={`/cities/${selectedCity.city.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}`}
                  style={{ padding: '0.6rem 0.9rem', borderRadius: 10, border: '0.5px solid var(--color-accent)', color: 'var(--color-accent)', textDecoration: 'none', fontSize: 13, background: 'transparent' }}
                >
                  Full profile →
                </a>
                <a
                  href={`/cities?compareA=${encodeURIComponent(selectedCity.city)}`}
                  style={{ padding: '0.6rem 0.9rem', borderRadius: 10, border: '0.5px solid rgba(200, 168, 98, 0.4)', color: '#fff', textDecoration: 'none', fontSize: 13, background: 'rgba(200, 168, 98, 0.12)' }}
                >
                  Compare City ⇄
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
                <span style={{ fontSize: 11, color: 'var(--color-text-3)', marginLeft: 6 }}>{s.sub}</span>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '0.6rem' }}>
            <a href="/cities" style={{ padding: '0.65rem 1.1rem', borderRadius: 10, border: '0.5px solid var(--color-accent)', background: 'var(--color-accent)', color: '#fff', textDecoration: 'none', fontSize: 13 }}>
              Explore cities
            </a>
            <a href="/submit" style={{ padding: '0.65rem 1.1rem', borderRadius: 10, border: '0.5px solid var(--color-border)', color: 'var(--color-text-2)', textDecoration: 'none', fontSize: 13 }}>
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
            <p style={{ fontSize: 12, color: 'var(--color-text-3)', margin: 0 }}>
              Search city · hover points for quick stats · zoom & drag to explore · details on click
            </p>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <select
                value={currency}
                onChange={e => setCurrency(e.target.value)}
                style={{ padding: '5px 10px', border: '0.5px solid var(--color-border)', borderRadius: 8, background: 'var(--color-surface)', fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--color-text-2)', cursor: 'pointer' }}
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

          {/* Map canvas container */}
          <div style={{
            flex: '2 1 500px',
            borderRadius: expanded && isMobile ? 0 : 14,
            overflow: 'hidden',
            background: 'var(--color-bg)',
            cursor: 'grab',
            touchAction: 'none',
            border: expanded && isMobile ? 'none' : '0.5px solid var(--color-border)',
            position: 'relative',
          }}>
            
            {/* Floating Search Bar */}
            <div style={{
              position: 'absolute',
              top: isMobile ? 10 : 16,
              left: isMobile ? 10 : 16,
              zIndex: 10,
              width: isMobile ? 'calc(100% - 20px)' : 260,
              maxWidth: '100%',
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                background: 'rgba(18, 18, 24, 0.82)',
                backdropFilter: 'blur(16px)',
                border: '0.5px solid var(--color-border)',
                borderRadius: 10,
                padding: '6px 12px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
              }}>
                <Search size={14} color="var(--color-text-3)" style={{ marginRight: 8, flexShrink: 0 }} />
                <input
                  type="text"
                  placeholder="Find a city..."
                  value={searchQuery}
                  onChange={e => {
                    setSearchQuery(e.target.value)
                    setShowSuggestions(true)
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  style={{
                    background: 'none',
                    border: 'none',
                    outline: 'none',
                    color: 'var(--color-text-1)',
                    fontSize: 13,
                    width: '100%',
                    fontFamily: 'var(--font-body)',
                  }}
                />
                {searchQuery && (
                  <button
                    onClick={() => { setSearchQuery(''); setShowSuggestions(false); }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: 'var(--color-text-3)', fontSize: 11 }}
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Suggestions dropdown */}
              {showSuggestions && suggestions.length > 0 && (
                <div className="glass-panel" style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  marginTop: 6,
                  borderRadius: 10,
                  maxHeight: 200,
                  overflowY: 'auto',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
                  zIndex: 15,
                  border: '0.5px solid var(--color-border)',
                }}>
                  {suggestions.map(c => (
                    <div
                      key={c.city}
                      onClick={() => zoomToCity(c)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 14px',
                        cursor: 'pointer',
                        borderBottom: '0.5px solid var(--color-border)',
                        fontSize: 13,
                        transition: 'background 0.2s',
                        color: 'var(--color-text-1)',
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 14 }}>{c.flag}</span>
                        <span style={{ fontWeight: 500 }}>{c.city}</span>
                        <span style={{ fontSize: 11, color: 'var(--color-text-3)' }}>{c.country}</span>
                      </div>
                      <span style={{ fontSize: 12, color: 'var(--color-accent)', fontWeight: 500 }}>
                        {c.price_cad ? cvt(c.price_cad) : 'Pending'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Suggestions click-away overlay backdrop */}
            {showSuggestions && searchQuery && (
              <div
                onClick={() => setShowSuggestions(false)}
                style={{ position: 'fixed', inset: 0, zIndex: 9, background: 'transparent' }}
              />
            )}

            {/* Floating Map Zoom Controls */}
            <div style={{
              position: 'absolute',
              bottom: isMobile ? 12 : 20,
              right: isMobile ? 12 : 20,
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
              zIndex: 10,
            }}>
              <button onClick={handleZoomIn} style={mapFloatingBtn} title="Zoom In">+</button>
              <button onClick={handleZoomOut} style={mapFloatingBtn} title="Zoom Out">-</button>
              <button onClick={resetZoom} style={mapFloatingBtn} title="Reset View">⌂</button>
            </div>

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

        {/* Legend / Metrics Footer */}
        {!(expanded && isMobile) && (
          <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: 10, color: 'var(--color-text-3)', letterSpacing: '0.8px', textTransform: 'uppercase' }}>Baseline price</span>
              {legendTiers.map(t => (
                <div key={t.label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <div style={{ width: 9, height: 9, borderRadius: '50%', background: t.color, flexShrink: 0 }} />
                  <span style={{ fontSize: 11, color: 'var(--color-text-2)' }}>{t.label}</span>
                </div>
              ))}
            </div>
            {loadingCities && <p style={{ fontSize: 11, color: 'var(--color-text-3)', margin: 0 }}>Loading…</p>}
          </div>
        )}

        {expanded && isMobile && (
          <div style={{ padding: '0.75rem 1rem', display: 'flex', gap: 8, alignItems: 'center', background: 'var(--color-surface)', borderTop: '0.5px solid var(--color-border)' }}>
            <select
              value={currency}
              onChange={e => setCurrency(e.target.value)}
              style={{ flex: 1, padding: '5px 10px', border: '0.5px solid var(--color-border)', borderRadius: 8, background: 'var(--color-bg)', fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--color-text-2)' }}
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
  padding: '5px 10px', cursor: 'pointer', fontSize: 12, color: 'var(--color-text-2)',
  fontFamily: 'var(--font-body)',
}

const mapFloatingBtn: React.CSSProperties = {
  background: 'rgba(18, 18, 24, 0.82)',
  backdropFilter: 'blur(16px)',
  border: '0.5px solid var(--color-border)',
  borderRadius: '50%',
  width: 32,
  height: 32,
  cursor: 'pointer',
  fontSize: 15,
  color: 'var(--color-text-2)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontWeight: 'bold',
  boxShadow: '0 2px 10px rgba(0,0,0,0.3)',
  transition: 'all 0.2s',
}
