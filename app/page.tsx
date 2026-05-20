'use client'

import { supabase } from '@/lib/supabase'
import { useEffect, useRef, useState } from 'react'
import * as d3 from 'd3'
import * as topojson from 'topojson-client'

const cities = [
  {
    name: 'Vancouver',
    country: 'Canada',
    region: 'British Columbia',
    flag: '🇨🇦',
    priceCAD: 16.5,
    coord: [-123.12, 49.28],
    population: '675,000',
    climate: 'Oceanic — mild rainy winters, warm dry summers',
    blurb:
      "Nestled between the Pacific Ocean and the Coast Mountains, Vancouver is one of Canada's most culturally diverse cities. A major gateway for Asian immigration, it has one of the largest Chinese-Canadian communities in the country and a thriving tech and film industry.",
  },
  {
    name: 'Toronto',
    country: 'Canada',
    region: 'Ontario',
    flag: '🇨🇦',
    priceCAD: 14.0,
    coord: [-79.38, 43.65],
    population: '2,930,000',
    climate: 'Humid continental — cold winters, hot humid summers',
    blurb:
      "Canada's largest city and financial capital, Toronto is one of the most multicultural cities in the world. Over half its residents were born outside Canada. It is the top destination for new immigrants to Canada, with major communities from South Asia, China, the Philippines, and the Caribbean.",
  },
  {
    name: 'Montreal',
    country: 'Canada',
    region: 'Quebec',
    flag: '🇨🇦',
    priceCAD: 13.5,
    coord: [-73.57, 45.5],
    population: '1,780,000',
    climate: 'Humid continental — cold snowy winters, warm summers',
    blurb:
      'The cultural capital of French Canada, Montreal blends European character with North American energy. It is known for its vibrant arts scene, world-class restaurants, and low cost of living relative to other major Canadian cities. A growing tech hub attracting immigrants from francophone Africa and Haiti.',
  },
  {
    name: 'Calgary',
    country: 'Canada',
    region: 'Alberta',
    flag: '🇨🇦',
    priceCAD: 13.0,
    coord: [-114.07, 51.04],
    population: '1,340,000',
    climate: 'Semi-arid — cold winters, warm summers, frequent chinooks',
    blurb:
      'Built on oil wealth, Calgary has diversified into tech and finance. It has one of the youngest and fastest-growing populations of any major Canadian city, with a booming South Asian immigrant community. The city offers high wages and relatively affordable housing compared to Vancouver and Toronto.',
  },
  {
    name: 'Edmonton',
    country: 'Canada',
    region: 'Alberta',
    flag: '🇨🇦',
    priceCAD: 12.5,
    coord: [-113.49, 53.55],
    population: '1,010,000',
    climate: 'Humid continental/subarctic — long cold winters, short warm summers',
    blurb:
      "Alberta's capital and the northernmost major city in Canada. Edmonton serves as the gateway to the oil sands and has a large Filipino community, one of the largest in Canada. It offers strong employment opportunities and a lower cost of living than most major Canadian cities.",
  },
  {
    name: 'New York',
    country: 'USA',
    region: 'New York State',
    flag: '🇺🇸',
    priceCAD: 19.0,
    coord: [-74.01, 40.71],
    population: '8,330,000',
    climate: 'Humid subtropical — hot summers, cold winters, year-round rain',
    blurb:
      'The most populous city in the United States and a global financial, cultural, and media capital. New York has been the entry point for waves of immigrants for over a century. Today it is home to massive Chinese, Dominican, Mexican, Indian, and Korean communities among hundreds of others.',
  },
  {
    name: 'Los Angeles',
    country: 'USA',
    region: 'California',
    flag: '🇺🇸',
    priceCAD: 17.5,
    coord: [-118.24, 34.05],
    population: '3,980,000',
    climate: 'Mediterranean — warm dry summers, mild wet winters',
    blurb:
      'The entertainment capital of the world and a major Pacific Rim gateway. Los Angeles has one of the largest Korean communities outside Korea, a massive Mexican-American population, and significant Chinese, Filipino, and Vietnamese communities. Its economy spans entertainment, tech, trade, and aerospace.',
  },
  {
    name: 'Chicago',
    country: 'USA',
    region: 'Illinois',
    flag: '🇺🇸',
    priceCAD: 16.0,
    coord: [-87.63, 41.88],
    population: '2,700,000',
    climate: 'Humid continental — cold windy winters, hot summers',
    blurb:
      "The Midwest's largest city and a major hub for finance, manufacturing, and transportation. Chicago has a storied immigrant history, from early waves of Polish and Italian arrivals to today's large Mexican, Indian, and Chinese communities. Known as the city that shaped American blues, jazz, and architecture.",
  },
  {
    name: 'Houston',
    country: 'USA',
    region: 'Texas',
    flag: '🇺🇸',
    priceCAD: 11.5,
    coord: [-95.37, 29.76],
    population: '2,300,000',
    climate: 'Humid subtropical — hot summers, mild winters, frequent storms',
    blurb:
      "The energy capital of the world and one of the most ethnically diverse cities in the United States. Houston's low cost of living, lack of state income tax, and booming economy have made it a magnet for immigrants from Latin America, Asia, and Africa. It has the largest Vietnamese community in the southern US.",
  },
  {
    name: 'Phoenix',
    country: 'USA',
    region: 'Arizona',
    flag: '🇺🇸',
    priceCAD: 12.0,
    coord: [-112.07, 33.45],
    population: '1,620,000',
    climate: 'Hot desert — extremely hot summers, mild winters, very little rain',
    blurb:
      'One of the fastest-growing cities in the United States. Phoenix has a large Hispanic population and a growing South Asian tech community driven by the expansion of the semiconductor industry in the region. Its affordability relative to coastal cities has driven significant domestic and international migration.',
  },
  {
    name: 'Philadelphia',
    country: 'USA',
    region: 'Pennsylvania',
    flag: '🇺🇸',
    priceCAD: 15.5,
    coord: [-75.17, 39.95],
    population: '1,570,000',
    climate: 'Humid subtropical — hot summers, cold winters, moderate rainfall',
    blurb:
      "One of America's oldest and most historically significant cities, birthplace of the US Declaration of Independence. Philadelphia has a large Black American community and growing immigrant populations from China, Mexico, India, and Vietnam. It is known for its world-class universities, hospitals, and affordable housing relative to nearby New York.",
  },
]

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

type BaseCity = (typeof cities)[number]

type City = BaseCity & {
  priceSource?: string | null
  priceUpdatedAt?: string | null
  populationSource?: string | null
  populationUpdatedAt?: string | null
  confidenceScore?: number | null
}

export default function Home() {
  const svgRef = useRef<SVGSVGElement>(null)
  const gRef = useRef<SVGGElement>(null)
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null)

  const [currency, setCurrency] = useState('CAD')
  const [selectedCity, setSelectedCity] = useState<City | null>(null)
  const [expanded, setExpanded] = useState(false)
  const [dbCities, setDbCities] = useState<Record<string, any>>({})
  const [isMobile, setIsMobile] = useState(false)

  const getPrice = (priceCAD: number) => {
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

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)

    checkMobile()
    window.addEventListener('resize', checkMobile)

    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    const fetchCities = async () => {
      const { data, error } = await supabase.from('cities').select('*')

      if (error) {
        console.error('Supabase error:', error)
        return
      }

      if (data) {
        const mapped: Record<string, any> = {}
        data.forEach((row: any) => {
          mapped[row.city] = row
        })
        setDbCities(mapped)
      }
    }

    fetchCities()
  }, [])

  const displayCities: City[] = cities.map((city) => {
    const dbCity = dbCities[city.name]

    return {
      ...city,
      priceCAD: dbCity?.price_cad ?? city.priceCAD,
      population: dbCity?.population ?? city.population,
      blurb: dbCity?.blurb ?? city.blurb,
      priceSource: dbCity?.price_source ?? null,
      priceUpdatedAt: dbCity?.price_updated_at ?? null,
      populationSource: dbCity?.population_source ?? null,
      populationUpdatedAt: dbCity?.population_updated_at ?? null,
      confidenceScore: dbCity?.confidence_score ?? null,
    }
  })

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

        displayCities.forEach((city) => {
          const projected = projection(city.coord as [number, number])
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
            .text(city.name)

          cityG.on('click', () => handleSelectCity(city))
        })
      }
    )
  }, [expanded, dbCities, isMobile])

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
                <div style={{ fontSize: 28, marginBottom: 4 }}>{selectedCity.flag}</div>
                <h2
                  style={{
                    fontFamily: 'DM Serif Display, serif',
                    fontSize: 28,
                    letterSpacing: -0.5,
                    margin: 0,
                  }}
                >
                  {selectedCity.name}
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
                {selectedCity.region}, {selectedCity.country}
              </p>
            </div>

            <div style={divider} />

            <div style={{ marginBottom: '1rem' }}>
              <p style={sectionLabel}>Population</p>
              <p style={{ fontSize: 14, color: '#1a1a18', lineHeight: 1.5 }}>
                {selectedCity.population}
              </p>
            </div>

            <div style={divider} />

            <div style={{ marginBottom: '1rem' }}>
              <p style={sectionLabel}>Climate</p>
              <p style={{ fontSize: 14, color: '#1a1a18', lineHeight: 1.5 }}>
                {selectedCity.climate}
              </p>
            </div>

            <div style={divider} />

            <div style={{ marginBottom: '1rem' }}>
              <p style={sectionLabel}>Price of a large bowl</p>

              <p
                style={{
                  fontFamily: 'DM Serif Display, serif',
                  fontSize: 32,
                  color: '#C25E1E',
                  margin: 0,
                }}
              >
                {getPrice(selectedCity.priceCAD)}
              </p>

              <p style={{ fontSize: 11, color: '#9b9b90', marginTop: 4 }}>
                Average across 5 restaurant tiers
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
                  <strong>Source:</strong> {selectedCity.priceSource ?? 'Not available'}
                </p>

                <p style={{ margin: 0 }}>
                  <strong>Updated:</strong> {formatDate(selectedCity.priceUpdatedAt)}
                </p>

                <p style={{ margin: 0 }}>
                  <strong>Confidence:</strong>{' '}
                  {selectedCity.confidenceScore !== null &&
                  selectedCity.confidenceScore !== undefined
                    ? `${Math.round(selectedCity.confidenceScore * 100)}%`
                    : 'Not available'}
                </p>
              </div>
            </div>

            <div style={divider} />

            <div>
              <p style={sectionLabel}>History & significance</p>
              <p style={{ fontSize: 14, color: '#3a3a34', lineHeight: 1.7 }}>
                {selectedCity.blurb}
              </p>
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
            <div style={{ fontFamily: 'DM Serif Display, serif', fontSize: 18 }}>
              egg fried rice <span style={{ color: '#C25E1E' }}>index</span>
            </div>

            <div
              style={{
                display: 'flex',
                gap: isMobile ? '1rem' : '2rem',
                flexWrap: 'wrap',
              }}
            >
              {[
                { label: 'cities', href: '/cities' },
                { label: 'about', href: '/about' },
                { label: 'methodology', href: '/methodology' },
              ].map((link) => (
                <a
                  key={link.label}
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
              maxWidth: 640,
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
              Cost of living, simplified
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
              What does a bowl cost{' '}
              <em style={{ color: '#C25E1E' }}>where you&apos;re moving?</em>
            </h1>

            <p
              style={{
                fontSize: isMobile ? 14 : 15,
                fontWeight: 300,
                color: '#6b6b64',
                lineHeight: 1.6,
              }}
            >
              We track the price of egg fried rice at restaurants across the world&apos;s
              biggest cities — in your currency.
            </p>
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
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : expanded ? '0fr 1fr' : '1fr 1.4fr',
          gap: expanded && isMobile ? 0 : isMobile ? '1rem' : '1.5rem',
          transition: 'grid-template-columns 0.3s',
        }}
      >
        <div
          style={{
            display: expanded && isMobile ? 'none' : 'block',
            background: '#fff',
            border: '0.5px solid #e5e3da',
            borderRadius: 16,
            padding: isMobile ? '1rem' : '1.5rem',
            overflow: 'hidden',
            opacity: expanded && !isMobile ? 0 : 1,
            transition: 'opacity 0.2s',
          }}
        >
          <p
            style={{
              fontSize: 11,
              fontWeight: 500,
              letterSpacing: '1.2px',
              textTransform: 'uppercase',
              color: '#9b9b90',
              marginBottom: '1.1rem',
            }}
          >
            City prices
          </p>

          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            style={{
              width: '100%',
              padding: '0.6rem 1rem',
              border: '0.5px solid #e5e3da',
              borderRadius: 10,
              background: '#FAFAF8',
              fontFamily: 'DM Sans, sans-serif',
              fontSize: 13,
              color: '#1a1a18',
              marginBottom: '1.1rem',
            }}
          >
            <option value="CAD">Canadian Dollar (CA$)</option>
            <option value="USD">US Dollar (US$)</option>
            <option value="EUR">Euro (€)</option>
            <option value="CHF">Swiss Franc (Fr)</option>
            <option value="GBP">British Pound (£)</option>
            <option value="JPY">Japanese Yen (¥)</option>
            <option value="CNY">Chinese Yuan (¥)</option>
            <option value="AUD">Australian Dollar (AU$)</option>
            <option value="HKD">Hong Kong Dollar (HK$)</option>
            <option value="SGD">Singapore Dollar (S$)</option>
            <option value="SAR">Saudi Riyal (﷼)</option>
            <option value="PHP">Philippine Peso (₱)</option>
            <option value="MYR">Malaysian Ringgit (RM)</option>
            <option value="MXN">Mexican Peso (MX$)</option>
            <option value="ARS">Argentine Peso (AR$)</option>
            <option value="KRW">Korean Won (₩)</option>
            <option value="INR">Indian Rupee (₹)</option>
            <option value="AED">UAE Dirham (د.إ)</option>
          </select>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            {displayCities.map((city) => (
              <div
                key={city.name}
                onClick={() => handleSelectCity(city)}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.6rem 0.85rem',
                  borderRadius: 10,
                  background: selectedCity?.name === city.name ? '#FEF5EF' : '#FAFAF8',
                  border: `0.5px solid ${
                    selectedCity?.name === city.name ? '#C25E1E' : 'transparent'
                  }`,
                  cursor: 'pointer',
                  minWidth: 0,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 9,
                    minWidth: 0,
                  }}
                >
                  <span style={{ fontSize: 16 }}>{city.flag}</span>

                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 13,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        maxWidth: isMobile ? 140 : 180,
                      }}
                    >
                      {city.name}
                    </div>

                    <div style={{ fontSize: 11, color: '#9b9b90' }}>
                      {city.country}
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    fontFamily: 'DM Serif Display, serif',
                    fontSize: isMobile ? 14 : 15,
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                  }}
                >
                  {getPrice(city.priceCAD)}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div
          style={{
            background: '#fff',
            border: expanded && isMobile ? 'none' : '0.5px solid #e5e3da',
            borderRadius: expanded && isMobile ? 0 : 16,
            padding: expanded && isMobile ? '1rem' : isMobile ? '1rem' : '1.5rem',
            minHeight: expanded && isMobile ? '100vh' : 'auto',
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
              Map
            </p>

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button
                onClick={resetZoom}
                style={{
                  background: 'none',
                  border: '0.5px solid #e5e3da',
                  borderRadius: 8,
                  padding: '5px 10px',
                  cursor: 'pointer',
                  fontSize: 12,
                  color: '#6b6b64',
                  fontFamily: 'DM Sans, sans-serif',
                }}
              >
                Reset zoom
              </button>

              <button
                onClick={() => setExpanded(!expanded)}
                style={{
                  background: 'none',
                  border: '0.5px solid #e5e3da',
                  borderRadius: 8,
                  padding: '5px 10px',
                  cursor: 'pointer',
                  fontSize: 12,
                  color: '#6b6b64',
                  fontFamily: 'DM Sans, sans-serif',
                }}
              >
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
            Scroll to zoom · drag to pan · click a city for details
          </p>
        </div>
      </div>
    </main>
  )
}