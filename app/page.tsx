'use client'

import { supabase } from '@/lib/supabase'
import { useEffect, useRef, useState } from 'react'
import * as d3 from 'd3'
import * as topojson from 'topojson-client'

const rates: Record<string, number> = {
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
  CAD: 'CA$',
  USD: 'US$',
  EUR: '€',
  CHF: 'Fr',
  GBP: '£',
  JPY: '¥',
  CNY: '¥',
  AUD: 'AU$',
  HKD: 'HK$',
  SGD: 'S$',
  SAR: '﷼',
  PHP: '₱',
  MYR: 'RM',
  MXN: 'MX$',
  ARS: 'AR$',
  KRW: '₩',
  INR: '₹',
  AED: 'د.إ',
}

const currencyOptions = Object.keys(rates).map((code) => [
  code,
  `${symbols[code]} ${code}`,
])

const navLinks = [
  { label: 'cities', href: '/cities' },
  { label: 'submit', href: '/submit' },
  { label: 'about', href: '/about' },
  { label: 'methodology', href: '/methodology' },
]

type City = {
  city: string
  country: string | null
  region: string | null
  flag: string | null
  latitude: number | null
  longitude: number | null
  population: string | null
  climate: string | null
  blurb: string | null
  price_cad: number | null
  price_source: string | null
  price_updated_at: string | null
  population_source: string | null
  population_updated_at: string | null
  confidence_score: number | null
}

export default function Home() {
  const svgRef = useRef<SVGSVGElement>(null)
  const gRef = useRef<SVGGElement>(null)
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null)

  const [currency, setCurrency] = useState('CAD')
  const [selectedCity, setSelectedCity] = useState<City | null>(null)
  const [expanded, setExpanded] = useState(false)
  const [cities, setCities] = useState<City[]>([])
  const [loadingCities, setLoadingCities] = useState(true)
  const [isMobile, setIsMobile] = useState(false)

  const getPrice = (priceCAD: number | null) => {
    if (!priceCAD || priceCAD <= 0) return 'Pending'

    const rate = rates[currency] ?? 1
    const symbol = symbols[currency] ?? 'CA$'
    const converted = priceCAD * rate

    return `${symbol}${converted.toLocaleString(undefined, {
      minimumFractionDigits: converted >= 100 ? 0 : 2,
      maximumFractionDigits: converted >= 100 ? 0 : 2,
    })}`
  }

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'Not available'

    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const formatConfidence = (value: number | null) => {
    if (value === null || value === undefined) return 'Not available'
    if (value <= 1) return `${Math.round(value * 100)}%`
    return `${Math.round(value)}%`
  }

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)

    checkMobile()
    window.addEventListener('resize', checkMobile)

    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    async function fetchCities() {
      setLoadingCities(true)

      const { data, error } = await supabase
        .from('cities')
        .select(
          `
          city,
          country,
          region,
          flag,
          latitude,
          longitude,
          population,
          climate,
          blurb,
          price_cad,
          price_source,
          price_updated_at,
          population_source,
          population_updated_at,
          confidence_score
        `
        )
        .order('city', { ascending: true })

      if (error) {
        console.error('Supabase error:', error)
        setLoadingCities(false)
        return
      }

      const validCities = (data ?? []).filter(
        (city) =>
          city.latitude !== null &&
          city.longitude !== null &&
          Number.isFinite(Number(city.latitude)) &&
          Number.isFinite(Number(city.longitude))
      )

      setCities(validCities as City[])
      setLoadingCities(false)
    }

    fetchCities()
  }, [])

  const handleSelectCity = (city: City) => setSelectedCity(city)
  const handleClose = () => setSelectedCity(null)

  useEffect(() => {
    if (!svgRef.current || !gRef.current) return

    const W = 700
    const H = 380
    const svg = d3.select(svgRef.current)
    const g = d3.select(gRef.current)

    g.selectAll('*').remove()

    const projection = d3
      .geoNaturalEarth1()
      .scale(115)
      .translate([W / 2, H / 2 + 14])

    const pathGen = d3.geoPath().projection(projection)

    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([1, 12])
      .on('zoom', (event) => {
        g.attr('transform', event.transform)

        g.selectAll<SVGCircleElement, unknown>('.city-dot')
          .attr('r', 6 / event.transform.k)
          .attr('stroke-width', 2 / event.transform.k)

        g.selectAll<SVGTextElement, unknown>('.city-label')
          .attr('font-size', 9 / event.transform.k)
          .attr('x', function () {
            const cx = parseFloat(
              d3.select(this.parentNode as SVGGElement).select('circle').attr('cx')
            )
            return cx + 9 / event.transform.k
          })
          .attr('y', function () {
            const cy = parseFloat(
              d3.select(this.parentNode as SVGGElement).select('circle').attr('cy')
            )
            return cy + 4 / event.transform.k
          })
          .attr('opacity', event.transform.k >= 3 ? 1 : 0)
      })

    zoomRef.current = zoom
    svg.call(zoom)

    g.append('rect').attr('width', W).attr('height', H).attr('fill', '#E4E8DC')

    d3.json('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json').then(
      (world: any) => {
        g.append('g')
          .selectAll('path')
          .data((topojson.feature(world, world.objects.countries) as any).features)
          .enter()
          .append('path')
          .attr('d', pathGen as any)
          .attr('fill', '#EEF0E8')
          .attr('stroke', '#d2d5c8')
          .attr('stroke-width', 0.4)

        cities.forEach((city) => {
          const projected = projection([
            Number(city.longitude),
            Number(city.latitude),
          ] as [number, number])

          if (!projected) return

          const [x, y] = projected
          const cityG = g.append('g').style('cursor', 'pointer')

          cityG
            .append('circle')
            .attr('class', 'city-dot')
            .attr('cx', x)
            .attr('cy', y)
            .attr('r', 6)
            .attr('fill', '#C25E1E')
            .attr('stroke', '#fff')
            .attr('stroke-width', 2)

          cityG
            .append('text')
            .attr('class', 'city-label')
            .attr('x', x + 9)
            .attr('y', y + 4)
            .attr('font-size', isMobile ? 8 : 9)
            .attr('fill', '#4a4a44')
            .attr('font-family', 'sans-serif')
            .attr('pointer-events', 'none')
            .attr('opacity', 0)
            .text(city.city)

          cityG.on('click', () => handleSelectCity(city))
        })
      }
    )
  }, [expanded, cities, isMobile])

  const resetZoom = () => {
    if (!svgRef.current || !zoomRef.current) return

    d3.select(svgRef.current)
      .transition()
      .duration(500)
      .call(zoomRef.current.transform, d3.zoomIdentity)
  }

  const sectionLabel: React.CSSProperties = {
    fontSize: 10,
    fontWeight: 500,
    letterSpacing: '1.2px',
    textTransform: 'uppercase',
    color: '#9b9b90',
    marginBottom: 4,
  }

  const divider: React.CSSProperties = {
    borderBottom: '0.5px solid #f0ede6',
    margin: '1rem 0',
  }

  return (
    <main
      style={{
        fontFamily: 'DM Sans, sans-serif',
        background: '#FAFAF8',
        minHeight: '100vh',
        color: '#1a1a18',
        overflowX: 'hidden',
      }}
    >
      <link
        href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500&display=swap"
        rel="stylesheet"
      />

      {selectedCity && (
        <div
          onClick={handleClose}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.15)',
            zIndex: 99,
          }}
        />
      )}

      <div
        style={{
          position: 'fixed',
          top: 0,
          right: selectedCity ? 0 : isMobile ? '-100vw' : -420,
          width: isMobile ? '100vw' : 380,
          maxWidth: '100vw',
          height: '100vh',
          background: '#fff',
          borderLeft: isMobile ? 'none' : '0.5px solid #e5e3da',
          zIndex: 100,
          overflowY: 'auto',
          transition: 'right 0.35s cubic-bezier(0.4,0,0.2,1)',
          padding: isMobile ? '1.25rem' : '2rem',
          boxSizing: 'border-box',
        }}
      >
        {selectedCity && (
          <>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '1.5rem',
                gap: '1rem',
              }}
            >
              <div>
                <div style={{ fontSize: 28, marginBottom: 4 }}>
                  {selectedCity.flag ?? '🌍'}
                </div>

                <h2
                  style={{
                    fontFamily: 'DM Serif Display, serif',
                    fontSize: 28,
                    letterSpacing: -0.5,
                    margin: 0,
                  }}
                >
                  {selectedCity.city}
                </h2>
              </div>

              <button
                onClick={handleClose}
                style={{
                  background: 'none',
                  border: '0.5px solid #e5e3da',
                  borderRadius: 8,
                  padding: '6px 10px',
                  cursor: 'pointer',
                  fontSize: 13,
                  color: '#6b6b64',
                  fontFamily: 'DM Sans, sans-serif',
                  flexShrink: 0,
                }}
              >
                Close
              </button>
            </div>

            <div style={divider} />

            <div style={{ marginBottom: '1rem' }}>
              <p style={sectionLabel}>Location</p>
              <p style={{ fontSize: 14, color: '#1a1a18', lineHeight: 1.5 }}>
                {[selectedCity.region, selectedCity.country].filter(Boolean).join(', ') ||
                  'Not available'}
              </p>
            </div>

            <div style={divider} />

            <div style={{ marginBottom: '1rem' }}>
              <p style={sectionLabel}>Baseline fried rice price</p>

              <p
                style={{
                  fontFamily: 'DM Serif Display, serif',
                  fontSize: 32,
                  color: '#C25E1E',
                  margin: 0,
                }}
              >
                {getPrice(selectedCity.price_cad)}
              </p>

              <p style={{ fontSize: 11, color: '#9b9b90', marginTop: 4 }}>
                Median or approved baseline estimate, depending on available data.
              </p>

              <div
                style={{
                  marginTop: '0.8rem',
                  fontSize: 12,
                  color: '#6b6b64',
                  lineHeight: 1.6,
                }}
              >
                <p style={{ margin: 0 }}>
                  <strong>Updated:</strong> {formatDate(selectedCity.price_updated_at)}
                </p>

                <p style={{ margin: 0 }}>
                  <strong>Confidence:</strong>{' '}
                  {formatConfidence(selectedCity.confidence_score)}
                </p>

                <p style={{ margin: 0 }}>
                  <strong>Source:</strong>{' '}
                  {selectedCity.price_source ?? 'Not available'}
                </p>
              </div>
            </div>

            <div style={divider} />

            <div style={{ marginBottom: '1rem' }}>
              <p style={sectionLabel}>City context</p>
              <p style={{ fontSize: 14, color: '#3a3a34', lineHeight: 1.7 }}>
                {selectedCity.blurb ?? 'No city context has been added yet.'}
              </p>
            </div>

            <div style={divider} />

            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <a href="/cities" style={drawerButtonStyle}>
                View all cities
              </a>

              <a href="/submit" style={drawerButtonStyle}>
                Submit data
              </a>

              <a href="/methodology" style={drawerButtonStyle}>
                Methodology
              </a>
            </div>
          </>
        )}
      </div>

      {!(expanded && isMobile) && (
        <>
          <nav
            style={{
              display: 'flex',
              flexDirection: isMobile ? 'column' : 'row',
              justifyContent: 'space-between',
              alignItems: isMobile ? 'flex-start' : 'center',
              gap: isMobile ? '0.9rem' : 0,
              padding: isMobile ? '1rem 1.25rem' : '1.25rem 2.5rem',
              borderBottom: '0.5px solid #e5e3da',
            }}
          >
            <a
              href="/"
              style={{
                fontFamily: 'DM Serif Display, serif',
                fontSize: 18,
                color: '#1a1a18',
                textDecoration: 'none',
              }}
            >
              fried rice <span style={{ color: '#C25E1E' }}>index</span>
            </a>

            <div
              style={{
                display: 'flex',
                gap: isMobile ? '1rem' : '2rem',
                flexWrap: 'wrap',
              }}
            >
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  style={{
                    fontSize: 13,
                    color: '#6b6b64',
                    textDecoration: 'none',
                  }}
                >
                  {link.label}
                </a>
              ))}
            </div>
          </nav>

          <div
            style={{
              padding: isMobile ? '2.25rem 1.25rem 1.5rem' : '4rem 2.5rem 2.5rem',
              maxWidth: 760,
            }}
          >
            <p
              style={{
                fontSize: 11,
                fontWeight: 500,
                letterSpacing: '1.5px',
                textTransform: 'uppercase',
                color: '#C25E1E',
                marginBottom: '1rem',
              }}
            >
              Food prices, urban affordability, and restaurant markets
            </p>

            <h1
              style={{
                fontFamily: 'DM Serif Display, serif',
                fontSize: isMobile ? 34 : 46,
                lineHeight: 1.05,
                letterSpacing: isMobile ? -0.8 : -1.5,
                color: '#1a1a18',
                marginBottom: '1rem',
              }}
            >
              What does fried rice reveal{' '}
              <em style={{ color: '#C25E1E' }}>about a city?</em>
            </h1>

            <p
              style={{
                fontSize: isMobile ? 14 : 15,
                fontWeight: 300,
                color: '#6b6b64',
                lineHeight: 1.6,
                maxWidth: 680,
              }}
            >
              The Fried Rice Index tracks fried rice prices across cities and studies
              what they reveal about baseline affordability, price variation, dish
              variety, and premiumization in local restaurant markets.
            </p>

            <div
              style={{
                display: 'flex',
                gap: '0.75rem',
                flexWrap: 'wrap',
                marginTop: '1.35rem',
              }}
            >
              <a href="/submit" style={primaryHeroButtonStyle}>
                Submit a price
              </a>

              <a href="/cities" style={secondaryHeroButtonStyle}>
                View cities
              </a>
            </div>
          </div>
        </>
      )}

      <div
        style={{
          padding:
            expanded && isMobile
              ? 0
              : isMobile
                ? '0 1.25rem 2rem'
                : '0 2.5rem 3rem',
          display: 'block',
        }}
      >
        <div
          style={{
            background: '#fff',
            border: expanded && isMobile ? 'none' : '0.5px solid #e5e3da',
            borderRadius: expanded && isMobile ? 0 : 16,
            padding: expanded && isMobile ? '1rem' : isMobile ? '1rem' : '1.5rem',
            minHeight: expanded && isMobile ? '100vh' : 'auto',
            maxWidth: expanded ? 'none' : 1180,
            margin: expanded ? 0 : '0 auto',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: isMobile ? 'column' : 'row',
              justifyContent: 'space-between',
              alignItems: isMobile ? 'flex-start' : 'center',
              gap: isMobile ? '0.75rem' : 0,
              marginBottom: '1.1rem',
            }}
          >
            <div>
              <p
                style={{
                  fontSize: 11,
                  fontWeight: 500,
                  letterSpacing: '1.2px',
                  textTransform: 'uppercase',
                  color: '#9b9b90',
                  margin: 0,
                }}
              >
                Interactive city map
              </p>

              <p
                style={{
                  fontSize: 13,
                  color: '#6b6b64',
                  margin: '0.35rem 0 0',
                }}
              >
                Click a city dot to view price, confidence, and city context.
              </p>
            </div>

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                style={{
                  padding: '5px 10px',
                  border: '0.5px solid #e5e3da',
                  borderRadius: 8,
                  background: '#FAFAF8',
                  fontFamily: 'DM Sans, sans-serif',
                  fontSize: 12,
                  color: '#6b6b64',
                  cursor: 'pointer',
                }}
              >
                {currencyOptions.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>

              <button onClick={resetZoom} style={mapButtonStyle}>
                Reset zoom
              </button>

              <button onClick={() => setExpanded(!expanded)} style={mapButtonStyle}>
                {expanded ? 'Collapse' : 'Expand'}
              </button>
            </div>
          </div>

          <div
            style={{
              borderRadius: expanded && isMobile ? 0 : 10,
              overflow: 'hidden',
              background: '#E4E8DC',
              cursor: 'grab',
            }}
          >
            <svg
              ref={svgRef}
              viewBox="0 0 700 380"
              style={{
                width: '100%',
                height: expanded && isMobile ? 'calc(100vh - 95px)' : 'auto',
                display: 'block',
              }}
            >
              <g ref={gRef} />
            </svg>
          </div>

          <p style={{ fontSize: 11, color: '#9b9b90', marginTop: 8 }}>
            Scroll to zoom · drag to pan · click a city for details · city names appear
            after 3x zoom
          </p>

          {loadingCities && (
            <p style={{ fontSize: 12, color: '#9b9b90', marginTop: 8 }}>
              Loading city data...
            </p>
          )}

          {!loadingCities && cities.length === 0 && (
            <p style={{ fontSize: 12, color: '#9b9b90', marginTop: 8 }}>
              No cities with coordinates are available yet.
            </p>
          )}

          <div
            style={{
              display: 'flex',
              gap: '0.75rem',
              flexWrap: 'wrap',
              marginTop: '1rem',
            }}
          >
            <a href="/cities" style={panelButtonStyle}>
              View all cities
            </a>

            <a href="/submit" style={panelButtonStyle}>
              Submit a price
            </a>

            <a href="/methodology" style={panelButtonStyle}>
              Read methodology
            </a>
          </div>
        </div>
      </div>
    </main>
  )
}

const mapButtonStyle: React.CSSProperties = {
  background: 'none',
  border: '0.5px solid #e5e3da',
  borderRadius: 8,
  padding: '5px 10px',
  cursor: 'pointer',
  fontSize: 12,
  color: '#6b6b64',
  fontFamily: 'DM Sans, sans-serif',
}

const drawerButtonStyle: React.CSSProperties = {
  padding: '0.55rem 0.8rem',
  borderRadius: 10,
  border: '0.5px solid #e5e3da',
  color: '#1a1a18',
  textDecoration: 'none',
  fontSize: 13,
  background: '#FAFAF8',
}

const panelButtonStyle: React.CSSProperties = {
  padding: '0.6rem 0.9rem',
  borderRadius: 10,
  border: '0.5px solid #e5e3da',
  color: '#1a1a18',
  textDecoration: 'none',
  fontSize: 13,
  background: '#FAFAF8',
}

const primaryHeroButtonStyle: React.CSSProperties = {
  padding: '0.7rem 1rem',
  borderRadius: 10,
  border: '0.5px solid #C25E1E',
  color: '#fff',
  textDecoration: 'none',
  fontSize: 13,
  background: '#C25E1E',
}

const secondaryHeroButtonStyle: React.CSSProperties = {
  padding: '0.7rem 1rem',
  borderRadius: 10,
  border: '0.5px solid #e5e3da',
  color: '#1a1a18',
  textDecoration: 'none',
  fontSize: 13,
  background: '#fff',
}