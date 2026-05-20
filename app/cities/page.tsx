'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

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

const currencyOptions = [
  ['CAD', 'Canadian Dollar (CA$)'],
  ['USD', 'US Dollar (US$)'],
  ['EUR', 'Euro (€)'],
  ['CHF', 'Swiss Franc (Fr)'],
  ['GBP', 'British Pound (£)'],
  ['JPY', 'Japanese Yen (¥)'],
  ['CNY', 'Chinese Yuan (¥)'],
  ['AUD', 'Australian Dollar (AU$)'],
  ['HKD', 'Hong Kong Dollar (HK$)'],
  ['SGD', 'Singapore Dollar (S$)'],
  ['SAR', 'Saudi Riyal (﷼)'],
  ['PHP', 'Philippine Peso (₱)'],
  ['MYR', 'Malaysian Ringgit (RM)'],
  ['MXN', 'Mexican Peso (MX$)'],
  ['ARS', 'Argentine Peso (AR$)'],
  ['KRW', 'Korean Won (₩)'],
  ['INR', 'Indian Rupee (₹)'],
  ['AED', 'UAE Dirham (د.إ)'],
]

type CityRow = {
  city: string
  population: string | null
  price_cad: number | null
  blurb: string | null
  price_source: string | null
  price_updated_at: string | null
  confidence_score: number | null
}

export default function CitiesPage() {
  const [cities, setCities] = useState<CityRow[]>([])
  const [loading, setLoading] = useState(true)
  const [currency, setCurrency] = useState('CAD')
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)

    checkMobile()
    window.addEventListener('resize', checkMobile)

    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    async function fetchCities() {
      const { data, error } = await supabase
        .from('cities')
        .select(
          'city, population, price_cad, blurb, price_source, price_updated_at, confidence_score'
        )
        .order('price_cad', { ascending: true })

      if (error) {
        console.error('Error loading cities:', error)
        setLoading(false)
        return
      }

      setCities(data ?? [])
      setLoading(false)
    }

    fetchCities()
  }, [])

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not available'

    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const formatPrice = (priceCAD: number | null) => {
    if (priceCAD === null || priceCAD === undefined) return 'Not available'

    const rate = rates[currency] ?? 1
    const symbol = symbols[currency] ?? 'CA$'
    const converted = Number(priceCAD) * rate

    return `${symbol}${converted.toLocaleString(undefined, {
      minimumFractionDigits: converted >= 100 ? 0 : 2,
      maximumFractionDigits: converted >= 100 ? 0 : 2,
    })}`
  }

  const cleanCities = cities.filter(
    (city) => city.price_cad !== null && city.price_cad !== undefined
  )

  const pendingCities = cities.filter(
    (city) => city.price_cad === null || city.price_cad === undefined
  )

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
          egg fried rice <span style={{ color: '#C25E1E' }}>index</span>
        </a>

        <div style={{ display: 'flex', gap: isMobile ? '1rem' : '2rem', flexWrap: 'wrap' }}>
          <a href="/cities" style={navLinkStyle}>
            cities
          </a>
          <a href="/about" style={navLinkStyle}>
            about
          </a>
          <a href="/methodology" style={navLinkStyle}>
            methodology
          </a>
        </div>
      </nav>

      <section
        style={{
          maxWidth: 1120,
          margin: '0 auto',
          padding: isMobile ? '2.5rem 1.25rem' : '4rem 1.5rem',
        }}
      >
        <p style={eyebrowStyle}>Cities</p>

        <h1
          style={{
            fontFamily: 'DM Serif Display, serif',
            fontSize: isMobile ? 36 : 48,
            lineHeight: 1.05,
            letterSpacing: isMobile ? -0.8 : -1.5,
            margin: '0 0 1.25rem',
          }}
        >
          Compare egg fried rice prices by city.
        </h1>

        <p
          style={{
            fontSize: isMobile ? 14 : 16,
            color: '#6b6b64',
            lineHeight: 1.7,
            maxWidth: 720,
            marginBottom: '1.5rem',
          }}
        >
          Cities are ranked by the average price of qualifying egg fried rice entries.
          Prices are based on approved restaurant sources and should be treated as
          restaurant-price signals, not full cost-of-living estimates.
        </p>

        <div
          style={{
            marginBottom: '2rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            flexWrap: 'wrap',
          }}
        >
          <span
            style={{
              fontSize: 11,
              textTransform: 'uppercase',
              letterSpacing: '1.2px',
              color: '#9b9b90',
            }}
          >
            Display currency
          </span>

          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            style={{
              padding: '0.65rem 0.9rem',
              border: '0.5px solid #e5e3da',
              borderRadius: 10,
              background: '#fff',
              fontFamily: 'DM Sans, sans-serif',
              fontSize: 13,
              color: '#1a1a18',
              cursor: 'pointer',
            }}
          >
            {currencyOptions.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '1rem',
            marginBottom: '2rem',
          }}
        >
          <div style={statCardStyle}>
            <p style={statLabelStyle}>Indexed cities</p>
            <p style={statValueStyle}>{cleanCities.length}</p>
          </div>

          <div style={statCardStyle}>
            <p style={statLabelStyle}>Cheapest city</p>
            <p style={statValueStyle}>
              {cleanCities.length > 0 ? cleanCities[0].city : '—'}
            </p>
          </div>

          <div style={statCardStyle}>
            <p style={statLabelStyle}>Most expensive city</p>
            <p style={statValueStyle}>
              {cleanCities.length > 0 ? cleanCities[cleanCities.length - 1].city : '—'}
            </p>
          </div>
        </div>

        {loading ? (
          <p style={{ color: '#6b6b64' }}>Loading cities...</p>
        ) : (
          <>
            {!isMobile && (
              <div
                style={{
                  background: '#fff',
                  border: '0.5px solid #e5e3da',
                  borderRadius: 16,
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '70px 1.4fr 1fr 1fr 1fr',
                    gap: '1rem',
                    padding: '0.9rem 1rem',
                    borderBottom: '0.5px solid #f0ede6',
                    fontSize: 11,
                    textTransform: 'uppercase',
                    letterSpacing: '1.1px',
                    color: '#9b9b90',
                  }}
                >
                  <div>Rank</div>
                  <div>City</div>
                  <div>Price</div>
                  <div>Confidence</div>
                  <div>Updated</div>
                </div>

                {cleanCities.map((city, index) => (
                  <div
                    key={city.city}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '70px 1.4fr 1fr 1fr 1fr',
                      gap: '1rem',
                      padding: '1rem',
                      borderBottom:
                        index === cleanCities.length - 1
                          ? 'none'
                          : '0.5px solid #f0ede6',
                      alignItems: 'center',
                    }}
                  >
                    <div style={{ fontSize: 13, color: '#9b9b90' }}>#{index + 1}</div>

                    <div>
                      <h2
                        style={{
                          fontFamily: 'DM Serif Display, serif',
                          fontSize: 24,
                          margin: 0,
                        }}
                      >
                        {city.city}
                      </h2>

                      <p
                        style={{
                          fontSize: 12,
                          color: '#9b9b90',
                          margin: '0.2rem 0 0',
                        }}
                      >
                        {city.population
                          ? `Population ${city.population}`
                          : 'Population not available'}
                      </p>
                    </div>

                    <div
                      style={{
                        fontFamily: 'DM Serif Display, serif',
                        fontSize: 24,
                        color: '#C25E1E',
                      }}
                    >
                      {formatPrice(city.price_cad)}
                    </div>

                    <div style={{ fontSize: 14, color: '#3a3a34' }}>
                      {city.confidence_score !== null &&
                      city.confidence_score !== undefined
                        ? `${Math.round(Number(city.confidence_score) * 100)}%`
                        : 'Not available'}
                    </div>

                    <div style={{ fontSize: 13, color: '#6b6b64' }}>
                      {formatDate(city.price_updated_at)}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '1rem',
                marginTop: isMobile ? 0 : '1.5rem',
              }}
            >
              {cleanCities.map((city, index) => (
                <div
                  key={`${city.city}-card`}
                  style={{
                    background: '#fff',
                    border: '0.5px solid #e5e3da',
                    borderRadius: 16,
                    padding: '1.35rem',
                  }}
                >
                  <p
                    style={{
                      fontSize: 11,
                      textTransform: 'uppercase',
                      letterSpacing: '1.2px',
                      color: '#9b9b90',
                      margin: '0 0 0.5rem',
                    }}
                  >
                    #{index + 1} city profile
                  </p>

                  <h2
                    style={{
                      fontFamily: 'DM Serif Display, serif',
                      fontSize: 28,
                      margin: '0 0 0.75rem',
                    }}
                  >
                    {city.city}
                  </h2>

                  <p
                    style={{
                      fontFamily: 'DM Serif Display, serif',
                      fontSize: 32,
                      color: '#C25E1E',
                      margin: '0 0 0.75rem',
                    }}
                  >
                    {formatPrice(city.price_cad)}
                  </p>

                  <p
                    style={{
                      fontSize: 13,
                      color: '#6b6b64',
                      lineHeight: 1.6,
                      margin: '0 0 1rem',
                    }}
                  >
                    {city.blurb ?? 'City description coming soon.'}
                  </p>

                  <div
                    style={{
                      borderTop: '0.5px solid #f0ede6',
                      paddingTop: '0.85rem',
                      fontSize: 12,
                      color: '#6b6b64',
                      lineHeight: 1.6,
                    }}
                  >
                    <p style={{ margin: 0 }}>
                      <strong>Updated:</strong> {formatDate(city.price_updated_at)}
                    </p>

                    <p style={{ margin: 0 }}>
                      <strong>Confidence:</strong>{' '}
                      {city.confidence_score !== null &&
                      city.confidence_score !== undefined
                        ? `${Math.round(Number(city.confidence_score) * 100)}%`
                        : 'Not available'}
                    </p>

                    <p style={{ margin: 0 }}>
                      <strong>Source:</strong> {city.price_source ?? 'Not available'}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {pendingCities.length > 0 && (
              <div
                style={{
                  marginTop: '2rem',
                  background: '#fff',
                  border: '0.5px solid #e5e3da',
                  borderRadius: 16,
                  padding: '1.5rem',
                }}
              >
                <h2
                  style={{
                    fontFamily: 'DM Serif Display, serif',
                    fontSize: 26,
                    margin: '0 0 0.75rem',
                  }}
                >
                  Pending cities
                </h2>

                <p style={{ fontSize: 14, color: '#6b6b64', lineHeight: 1.6 }}>
                  These cities are in the database but do not yet have a verified price.
                </p>

                <div
                  style={{
                    display: 'flex',
                    gap: '0.5rem',
                    flexWrap: 'wrap',
                    marginTop: '1rem',
                  }}
                >
                  {pendingCities.map((city) => (
                    <span
                      key={city.city}
                      style={{
                        background: '#FAFAF8',
                        border: '0.5px solid #e5e3da',
                        borderRadius: 999,
                        padding: '0.45rem 0.7rem',
                        fontSize: 13,
                        color: '#6b6b64',
                      }}
                    >
                      {city.city}
                    </span>
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

const navLinkStyle: React.CSSProperties = {
  fontSize: 13,
  color: '#6b6b64',
  textDecoration: 'none',
}

const eyebrowStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 500,
  letterSpacing: '1.5px',
  textTransform: 'uppercase',
  color: '#C25E1E',
  marginBottom: '1rem',
}

const statCardStyle: React.CSSProperties = {
  background: '#fff',
  border: '0.5px solid #e5e3da',
  borderRadius: 16,
  padding: '1.25rem',
}

const statLabelStyle: React.CSSProperties = {
  fontSize: 11,
  textTransform: 'uppercase',
  letterSpacing: '1.2px',
  color: '#9b9b90',
  margin: '0 0 0.5rem',
}

const statValueStyle: React.CSSProperties = {
  fontFamily: 'DM Serif Display, serif',
  fontSize: 28,
  color: '#1a1a18',
  margin: 0,
}