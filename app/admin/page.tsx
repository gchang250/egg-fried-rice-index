'use client'

import type { CSSProperties, FormEvent } from 'react'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type CityRow = {
  city: string
}

type PendingRequest = {
  id: string
  request_type: 'restaurant' | 'population'
  city: string
  restaurant_name: string | null
  dish_name: string | null
  tier: string | null
  price_cad: number | string | null
  source: string | null
  source_url: string | null
  population: string | null
  population_source: string | null
  confidence_score: number | string | null
  notes: string | null
  created_at: string
}

export default function AdminPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loggedIn, setLoggedIn] = useState(false)
  const [loginError, setLoginError] = useState('')

  const [view, setView] = useState<'dashboard' | 'pending' | 'manual'>('dashboard')

  const [cities, setCities] = useState<CityRow[]>([])
  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([])
  const [loadingPending, setLoadingPending] = useState(false)
  const [reviewingRequestId, setReviewingRequestId] = useState<string | null>(null)

  const [city, setCity] = useState('')
  const [restaurantName, setRestaurantName] = useState('')
  const [dishName, setDishName] = useState('')
  const [tier, setTier] = useState('mid_tier')
  const [priceCad, setPriceCad] = useState('')
  const [source, setSource] = useState('')
  const [sourceUrl, setSourceUrl] = useState('')
  const [confidenceScore, setConfidenceScore] = useState('0.7')
  const [approved, setApproved] = useState(true)
  const [savingManual, setSavingManual] = useState(false)

  const [message, setMessage] = useState('')

  useEffect(() => {
    fetchCities()
  }, [])

  async function fetchCities() {
    const { data, error } = await supabase
      .from('cities')
      .select('city')
      .order('city', { ascending: true })

    if (error) {
      console.error(error)
      setMessage(error.message)
      return
    }

    setCities(data ?? [])

    if (data && data.length > 0 && !city) {
      setCity(data[0].city)
    }
  }

  async function handleLogin(event: FormEvent) {
    event.preventDefault()
    setLoginError('')
    setMessage('')

    const response = await fetch('/api/admin-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    })

    const result = await response.json()

    if (!response.ok || !result.success) {
      setLoginError(result.error ?? 'Invalid username or password')
      return
    }

    setLoggedIn(true)
    setView('dashboard')
  }

  async function loadPendingRequests() {
    setLoadingPending(true)
    setMessage('')

    const response = await fetch('/api/pending-requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    })

    const result = await response.json()

    if (!response.ok) {
      setMessage(result.error ?? 'Could not load pending requests')
      setLoadingPending(false)
      return
    }

    setPendingRequests(result.requests ?? [])
    setLoadingPending(false)
  }

  async function openPending() {
    setView('pending')
    await loadPendingRequests()
  }

  async function reviewRequest(requestId: string, decision: 'approved' | 'denied') {
    setMessage('')
    setReviewingRequestId(requestId)

    const response = await fetch('/api/review-request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, requestId, decision }),
    })

    const result = await response.json()

    setReviewingRequestId(null)

    if (!response.ok) {
      setMessage(result.error ?? 'Review failed')
      return
    }

    if (decision === 'approved' && result.request_type === 'restaurant') {
      setMessage(
        `Approved. ${result.city} updated to ${formatCadPrice(
          result.average_price_cad
        )} with ${formatConfidence(result.average_confidence)} confidence.`
      )
    } else {
      setMessage(`Request ${decision}.`)
    }

    await loadPendingRequests()
  }

  async function handleManualSubmit(event: FormEvent) {
    event.preventDefault()
    setMessage('')
    setSavingManual(true)

    const parsedPrice = Number(priceCad)
    const parsedConfidence = Number(confidenceScore)

    if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
      setMessage('Enter a valid CAD price.')
      setSavingManual(false)
      return
    }

    if (
      !Number.isFinite(parsedConfidence) ||
      parsedConfidence < 0 ||
      parsedConfidence > 1
    ) {
      setMessage('Confidence score must be between 0 and 1.')
      setSavingManual(false)
      return
    }

    const addResponse = await fetch(
      `/api/add-restaurant?password=${encodeURIComponent(password)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          city,
          restaurant_name: restaurantName,
          dish_name: dishName || 'Egg Fried Rice',
          tier,
          price_cad: parsedPrice,
          source,
          source_url: sourceUrl || null,
          confidence_score: parsedConfidence,
          approved,
          active: true,
        }),
      }
    )

    const addResult = await addResponse.json()

    if (!addResponse.ok) {
      setMessage(addResult.error ?? 'Could not add restaurant')
      setSavingManual(false)
      return
    }

    if (approved) {
      const recalculateResponse = await fetch('/api/recalculate-city', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          city,
          password,
        }),
      })

      const recalculateResult = await recalculateResponse.json()

      if (!recalculateResponse.ok) {
        setMessage(
          recalculateResult.error ?? 'Added restaurant, but recalculation failed'
        )
        setSavingManual(false)
        return
      }

      setMessage(
        `Manual entry saved. ${city} updated to ${formatCadPrice(
          recalculateResult.average_price_cad
        )} with ${formatConfidence(
          recalculateResult.average_confidence
        )} confidence.`
      )
    } else {
      setMessage('Manual entry saved as unapproved.')
    }

    setRestaurantName('')
    setDishName('')
    setPriceCad('')
    setSource('')
    setSourceUrl('')
    setConfidenceScore('0.7')
    setApproved(true)
    setSavingManual(false)
  }

  if (!loggedIn) {
    return (
      <main style={pageStyle}>
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500&display=swap"
          rel="stylesheet"
        />

        <div style={loginCardStyle}>
          <p style={eyebrowStyle}>Admin</p>

          <h1 style={titleStyle}>Sign in.</h1>

          <form onSubmit={handleLogin} style={{ display: 'grid', gap: '1rem' }}>
            <label style={labelStyle}>
              Username
              <input
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                style={inputStyle}
                autoComplete="username"
              />
            </label>

            <label style={labelStyle}>
              Password
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                style={inputStyle}
                autoComplete="current-password"
              />
            </label>

            {loginError && <p style={errorStyle}>{loginError}</p>}

            <button type="submit" style={primaryButtonStyle}>
              Login
            </button>
          </form>
        </div>
      </main>
    )
  }

  return (
    <main style={pageStyle}>
      <link
        href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500&display=swap"
        rel="stylesheet"
      />

      <nav style={navStyle}>
        <a href="/" style={brandStyle}>
          egg fried rice <span style={{ color: '#C25E1E' }}>index</span>
        </a>

        <button
          onClick={() => {
            setLoggedIn(false)
            setPassword('')
            setView('dashboard')
            setMessage('')
            setPendingRequests([])
          }}
          style={secondaryButtonStyle}
        >
          Logout
        </button>
      </nav>

      <section style={{ maxWidth: 1050, margin: '0 auto', padding: '3rem 1.5rem' }}>
        {view === 'dashboard' && (
          <>
            <p style={eyebrowStyle}>Admin dashboard</p>

            <h1 style={titleStyle}>What do you want to do?</h1>

            {message && <p style={messageStyle}>{message}</p>}

            <div style={dashboardGridStyle}>
              <button onClick={openPending} style={dashboardCardStyle}>
                <span style={dashboardTitleStyle}>View pending requests</span>
                <span style={dashboardTextStyle}>
                  Review scraper proposals for restaurant entries and population updates.
                </span>
              </button>

              <button
                onClick={() => {
                  setView('manual')
                  setMessage('')
                }}
                style={dashboardCardStyle}
              >
                <span style={dashboardTitleStyle}>Enter manual entry</span>
                <span style={dashboardTextStyle}>
                  Add a restaurant entry manually and recalculate the city average.
                </span>
              </button>
            </div>
          </>
        )}

        {view === 'pending' && (
          <>
            <button
              onClick={() => {
                setView('dashboard')
                setMessage('')
              }}
              style={secondaryButtonStyle}
            >
              Back
            </button>

            <p style={{ ...eyebrowStyle, marginTop: '2rem' }}>Pending requests</p>

            <h1 style={titleStyle}>Review scraper proposals.</h1>

            {message && <p style={messageStyle}>{message}</p>}

            <div style={{ marginBottom: '1rem' }}>
              <button onClick={loadPendingRequests} style={secondaryButtonStyle}>
                Refresh pending requests
              </button>
            </div>

            {loadingPending ? (
              <p style={{ color: '#6b6b64' }}>Loading...</p>
            ) : pendingRequests.length === 0 ? (
              <div style={emptyStyle}>No pending requests.</div>
            ) : (
              <div style={{ display: 'grid', gap: '1rem' }}>
                {pendingRequests.map((request) => (
                  <div key={request.id} style={requestCardStyle}>
                    <div>
                      <p style={requestTypeStyle}>
                        {request.request_type === 'restaurant'
                          ? 'Restaurant entry'
                          : 'Population update'}
                      </p>

                      <h2 style={requestTitleStyle}>{request.city}</h2>

                      {request.request_type === 'restaurant' ? (
                        <div style={detailGridStyle}>
                          <p>
                            <strong>Restaurant:</strong>{' '}
                            {request.restaurant_name || 'Unknown restaurant'}
                          </p>
                          <p>
                            <strong>Dish:</strong>{' '}
                            {request.dish_name || 'Egg Fried Rice'}
                          </p>
                          <p>
                            <strong>Tier:</strong> {request.tier || 'mid_tier'}
                          </p>
                          <p>
                            <strong>Price:</strong>{' '}
                            {formatCadPrice(request.price_cad)}
                          </p>
                          <p>
                            <strong>Confidence:</strong>{' '}
                            {formatConfidence(request.confidence_score)}
                          </p>
                          <p>
                            <strong>Source:</strong>{' '}
                            {request.source || 'No source text'}
                          </p>
                          {request.source_url && (
                            <p>
                              <strong>URL:</strong>{' '}
                              <a
                                href={request.source_url}
                                target="_blank"
                                rel="noreferrer"
                                style={linkStyle}
                              >
                                Open source
                              </a>
                            </p>
                          )}
                          {request.notes && (
                            <p>
                              <strong>Notes:</strong> {request.notes}
                            </p>
                          )}
                        </div>
                      ) : (
                        <div style={detailGridStyle}>
                          <p>
                            <strong>Population:</strong>{' '}
                            {request.population || 'Missing population'}
                          </p>
                          <p>
                            <strong>Source:</strong>{' '}
                            {request.population_source || 'No source text'}
                          </p>
                          <p>
                            <strong>Confidence:</strong>{' '}
                            {formatConfidence(request.confidence_score)}
                          </p>
                          {request.source_url && (
                            <p>
                              <strong>URL:</strong>{' '}
                              <a
                                href={request.source_url}
                                target="_blank"
                                rel="noreferrer"
                                style={linkStyle}
                              >
                                Open source
                              </a>
                            </p>
                          )}
                          {request.notes && (
                            <p>
                              <strong>Notes:</strong> {request.notes}
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                      <button
                        onClick={() => reviewRequest(request.id, 'approved')}
                        style={primaryButtonStyle}
                        disabled={reviewingRequestId === request.id}
                      >
                        {reviewingRequestId === request.id ? 'Working...' : 'Approve'}
                      </button>

                      <button
                        onClick={() => reviewRequest(request.id, 'denied')}
                        style={dangerButtonStyle}
                        disabled={reviewingRequestId === request.id}
                      >
                        Deny
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {view === 'manual' && (
          <>
            <button
              onClick={() => {
                setView('dashboard')
                setMessage('')
              }}
              style={secondaryButtonStyle}
            >
              Back
            </button>

            <p style={{ ...eyebrowStyle, marginTop: '2rem' }}>Manual entry</p>

            <h1 style={titleStyle}>Add restaurant data.</h1>

            {message && <p style={messageStyle}>{message}</p>}

            <form onSubmit={handleManualSubmit} style={formGridStyle}>
              <label style={labelStyle}>
                City
                <select
                  value={city}
                  onChange={(event) => setCity(event.target.value)}
                  style={inputStyle}
                >
                  {cities.map((cityRow) => (
                    <option key={cityRow.city} value={cityRow.city}>
                      {cityRow.city}
                    </option>
                  ))}
                </select>
              </label>

              <label style={labelStyle}>
                Restaurant name
                <input
                  value={restaurantName}
                  onChange={(event) => setRestaurantName(event.target.value)}
                  style={inputStyle}
                  required
                />
              </label>

              <label style={labelStyle}>
                Dish name
                <input
                  value={dishName}
                  onChange={(event) => setDishName(event.target.value)}
                  style={inputStyle}
                  placeholder="Egg Fried Rice"
                />
              </label>

              <label style={labelStyle}>
                Tier
                <select
                  value={tier}
                  onChange={(event) => setTier(event.target.value)}
                  style={inputStyle}
                >
                  <option value="low_tier">low_tier</option>
                  <option value="mid_tier">mid_tier</option>
                  <option value="high_end">high_end</option>
                  <option value="premium">premium</option>
                </select>
              </label>

              <label style={labelStyle}>
                Price CAD
                <input
                  type="number"
                  step="0.01"
                  value={priceCad}
                  onChange={(event) => setPriceCad(event.target.value)}
                  style={inputStyle}
                  required
                />
              </label>

              <label style={labelStyle}>
                Source
                <input
                  value={source}
                  onChange={(event) => setSource(event.target.value)}
                  style={inputStyle}
                  required
                />
              </label>

              <label style={labelStyle}>
                Source URL
                <input
                  value={sourceUrl}
                  onChange={(event) => setSourceUrl(event.target.value)}
                  style={inputStyle}
                />
              </label>

              <label style={labelStyle}>
                Confidence score
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="1"
                  value={confidenceScore}
                  onChange={(event) => setConfidenceScore(event.target.value)}
                  style={inputStyle}
                />
              </label>

              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.6rem',
                  fontSize: 14,
                  color: '#3a3a34',
                }}
              >
                <input
                  type="checkbox"
                  checked={approved}
                  onChange={(event) => setApproved(event.target.checked)}
                />
                Approve immediately
              </label>

              <button
                type="submit"
                style={primaryButtonStyle}
                disabled={savingManual}
              >
                {savingManual ? 'Saving...' : 'Save manual entry'}
              </button>
            </form>
          </>
        )}
      </section>
    </main>
  )
}

function formatCadPrice(value: number | string | null) {
  const number = Number(value)

  if (!Number.isFinite(number) || number <= 0) {
    return 'Price missing'
  }

  return `CA$${number.toFixed(2)}`
}

function formatConfidence(value: number | string | null) {
  const number = Number(value)

  if (!Number.isFinite(number) || number < 0) {
    return 'Missing'
  }

  if (number <= 1) {
    return `${Math.round(number * 100)}%`
  }

  return `${Math.round(number)}%`
}

const pageStyle: CSSProperties = {
  fontFamily: 'DM Sans, sans-serif',
  background: '#FAFAF8',
  minHeight: '100vh',
  color: '#1a1a18',
}

const navStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '1.25rem 2.5rem',
  borderBottom: '0.5px solid #e5e3da',
}

const brandStyle: CSSProperties = {
  fontFamily: 'DM Serif Display, serif',
  fontSize: 18,
  color: '#1a1a18',
  textDecoration: 'none',
}

const loginCardStyle: CSSProperties = {
  width: 'min(420px, calc(100vw - 2rem))',
  margin: '12vh auto 0',
  background: '#fff',
  border: '0.5px solid #e5e3da',
  borderRadius: 18,
  padding: '2rem',
}

const eyebrowStyle: CSSProperties = {
  fontSize: 11,
  fontWeight: 500,
  letterSpacing: '1.5px',
  textTransform: 'uppercase',
  color: '#C25E1E',
  marginBottom: '1rem',
}

const titleStyle: CSSProperties = {
  fontFamily: 'DM Serif Display, serif',
  fontSize: 42,
  lineHeight: 1.05,
  letterSpacing: -1,
  margin: '0 0 1.5rem',
}

const labelStyle: CSSProperties = {
  display: 'grid',
  gap: '0.4rem',
  fontSize: 13,
  color: '#6b6b64',
}

const inputStyle: CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  padding: '0.75rem 0.9rem',
  border: '0.5px solid #e5e3da',
  borderRadius: 10,
  background: '#fff',
  fontFamily: 'DM Sans, sans-serif',
  fontSize: 14,
  color: '#1a1a18',
}

const primaryButtonStyle: CSSProperties = {
  border: 'none',
  borderRadius: 10,
  padding: '0.75rem 1rem',
  background: '#C25E1E',
  color: '#fff',
  fontFamily: 'DM Sans, sans-serif',
  fontSize: 14,
  cursor: 'pointer',
}

const secondaryButtonStyle: CSSProperties = {
  border: '0.5px solid #e5e3da',
  borderRadius: 10,
  padding: '0.65rem 0.9rem',
  background: '#fff',
  color: '#1a1a18',
  fontFamily: 'DM Sans, sans-serif',
  fontSize: 13,
  cursor: 'pointer',
}

const dangerButtonStyle: CSSProperties = {
  border: '0.5px solid #e5e3da',
  borderRadius: 10,
  padding: '0.75rem 1rem',
  background: '#fff',
  color: '#9b2c2c',
  fontFamily: 'DM Sans, sans-serif',
  fontSize: 14,
  cursor: 'pointer',
}

const errorStyle: CSSProperties = {
  margin: 0,
  color: '#9b2c2c',
  fontSize: 13,
}

const messageStyle: CSSProperties = {
  background: '#fff',
  border: '0.5px solid #e5e3da',
  borderRadius: 12,
  padding: '0.9rem 1rem',
  color: '#3a3a34',
  fontSize: 14,
  marginBottom: '1rem',
}

const dashboardGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
  gap: '1rem',
}

const dashboardCardStyle: CSSProperties = {
  display: 'grid',
  gap: '0.75rem',
  textAlign: 'left',
  background: '#fff',
  border: '0.5px solid #e5e3da',
  borderRadius: 18,
  padding: '1.5rem',
  cursor: 'pointer',
  fontFamily: 'DM Sans, sans-serif',
}

const dashboardTitleStyle: CSSProperties = {
  fontFamily: 'DM Serif Display, serif',
  fontSize: 28,
  color: '#1a1a18',
}

const dashboardTextStyle: CSSProperties = {
  fontSize: 14,
  lineHeight: 1.6,
  color: '#6b6b64',
}

const requestCardStyle: CSSProperties = {
  background: '#fff',
  border: '0.5px solid #e5e3da',
  borderRadius: 18,
  padding: '1.5rem',
  display: 'grid',
  gap: '1.25rem',
}

const requestTypeStyle: CSSProperties = {
  fontSize: 11,
  textTransform: 'uppercase',
  letterSpacing: '1.2px',
  color: '#C25E1E',
  margin: '0 0 0.5rem',
}

const requestTitleStyle: CSSProperties = {
  fontFamily: 'DM Serif Display, serif',
  fontSize: 28,
  margin: '0 0 1rem',
}

const detailGridStyle: CSSProperties = {
  display: 'grid',
  gap: '0.35rem',
  fontSize: 14,
  color: '#3a3a34',
}

const linkStyle: CSSProperties = {
  color: '#C25E1E',
}

const emptyStyle: CSSProperties = {
  background: '#fff',
  border: '0.5px solid #e5e3da',
  borderRadius: 16,
  padding: '1.5rem',
  color: '#6b6b64',
}

const formGridStyle: CSSProperties = {
  background: '#fff',
  border: '0.5px solid #e5e3da',
  borderRadius: 18,
  padding: '1.5rem',
  display: 'grid',
  gap: '1rem',
}