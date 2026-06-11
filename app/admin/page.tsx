'use client'

import type { CSSProperties, FormEvent } from 'react'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type CityRow = {
  city: string
  country: string | null
}

type PendingRequest = {
  id: string
  request_type: 'restaurant' | 'population' | 'price_update'
  city: string
  country: string | null
  restaurant_name: string | null
  dish_name: string | null
  dish_category: string | null
  included_in_baseline: boolean | null
  tier: string | null
  price_cad: number | string | null
  local_price: number | string | null
  local_currency: string | null
  exchange_rate_used: number | string | null
  source: string | null
  source_type: string | null
  source_url: string | null
  population: string | null
  population_source: string | null
  confidence_score: number | string | null
  notes: string | null
  date_accessed: string | null
  created_at: string
}

const dishCategories = [
  { value: 'basic', label: 'Basic' },
  { value: 'vegetable', label: 'Vegetable' },
  { value: 'meat_based', label: 'Meat-based' },
  { value: 'seafood', label: 'Seafood' },
  { value: 'house_special', label: 'House special / combination' },
  { value: 'premium', label: 'Premium / luxury' },
  { value: 'unknown', label: 'Unknown' },
]

const sourceTypes = [
  { value: 'official_menu', label: 'Official restaurant menu' },
  { value: 'official_ordering_page', label: 'Official ordering page' },
  { value: 'menu_photo', label: 'Recent menu photo' },
  { value: 'third_party_menu', label: 'Third-party menu site' },
  { value: 'delivery_app', label: 'Delivery app' },
  { value: 'scraper_result', label: 'Unclear scraper result' },
  { value: 'public_submission', label: 'Public submission' },
  { value: 'manual_review', label: 'Manual review' },
]

const currencies = [
  'CAD',
  'USD',
  'EUR',
  'GBP',
  'CHF',
  'JPY',
  'CNY',
  'AUD',
  'HKD',
  'SGD',
  'SAR',
  'PHP',
  'MYR',
  'MXN',
  'ARS',
  'KRW',
  'INR',
  'AED',
]

export default function AdminPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loggedIn, setLoggedIn] = useState(false)
  const [loginError, setLoginError] = useState('')

  const [view, setView] = useState<'dashboard' | 'pending' | 'manual'>('dashboard')
  const [confirmedPrices, setConfirmedPrices] = useState<Record<string, string>>({})

  const [editingRequestId, setEditingRequestId] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState<{
    restaurant_name: string
    dish_name: string
    dish_category: string
    tier: string
    included_in_baseline: boolean
    local_price: string
    local_currency: string
    price_cad: string
    notes: string
  } | null>(null)
  const [savingEditId, setSavingEditId] = useState<string | null>(null)

  const [cities, setCities] = useState<CityRow[]>([])
  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([])
  const [loadingPending, setLoadingPending] = useState(false)
  const [reviewingRequestId, setReviewingRequestId] = useState<string | null>(null)

  const [city, setCity] = useState('')
  const [restaurantName, setRestaurantName] = useState('')
  const [dishName, setDishName] = useState('')
  const [dishCategory, setDishCategory] = useState('basic')
  const [includedInBaseline, setIncludedInBaseline] = useState(true)
  const [tier, setTier] = useState('mid_tier')
  const [localPrice, setLocalPrice] = useState('')
  const [localCurrency, setLocalCurrency] = useState('CAD')
  const [exchangeRateUsed, setExchangeRateUsed] = useState('1')
  const [priceCad, setPriceCad] = useState('')
  const [source, setSource] = useState('')
  const [sourceType, setSourceType] = useState('manual_review')
  const [sourceUrl, setSourceUrl] = useState('')
  const [confidenceScore, setConfidenceScore] = useState('0.7')
  const [notes, setNotes] = useState('')
  const [approved, setApproved] = useState(true)
  const [savingManual, setSavingManual] = useState(false)

  const [message, setMessage] = useState('')

  useEffect(() => {
    fetchCities()
  }, [])

  useEffect(() => {
    if (dishCategory === 'basic' || dishCategory === 'vegetable') {
      setIncludedInBaseline(true)
    } else {
      setIncludedInBaseline(false)
    }
  }, [dishCategory])

  async function fetchCities() {
    const { data, error } = await supabase
      .from('cities')
      .select('city, country')
      .order('city', { ascending: true })

    if (error) {
      console.error(error)
      setMessage(error.message)
      return
    }

    setCities((data ?? []) as CityRow[])

    if (data && data.length > 0 && !city) {
      setCity(data[0].city)
    }
  }

  function selectedCountry() {
    return cities.find((cityRow) => cityRow.city === city)?.country ?? null
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
    sessionStorage.setItem('admin_password', password)
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

    const overridePriceCad = confirmedPrices[requestId]
    const body: Record<string, unknown> = { username, password, requestId, decision }
    if (decision === 'approved' && overridePriceCad && Number(overridePriceCad) > 0) {
      body.override_price_cad = Number(overridePriceCad)
    }

    const response = await fetch('/api/review-request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
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

  function startEditRequest(req: PendingRequest) {
    setEditingRequestId(req.id)
    setEditDraft({
      restaurant_name: req.restaurant_name ?? '',
      dish_name: req.dish_name ?? '',
      dish_category: req.dish_category ?? 'basic',
      tier: req.tier ?? 'mid_tier',
      included_in_baseline: req.included_in_baseline ?? false,
      local_price: String(req.local_price ?? ''),
      local_currency: req.local_currency ?? 'CAD',
      price_cad: String(req.price_cad ?? ''),
      notes: req.notes ?? '',
    })
  }

  async function saveEditRequest(id: string) {
    if (!editDraft) return
    setSavingEditId(id)
    setMessage('')

    const res = await fetch('/api/update-pending-request', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        password,
        id,
        restaurant_name: editDraft.restaurant_name.trim() || null,
        dish_name: editDraft.dish_name.trim() || null,
        dish_category: editDraft.dish_category,
        tier: editDraft.tier,
        included_in_baseline: editDraft.included_in_baseline,
        local_price: editDraft.local_price ? Number(editDraft.local_price) : null,
        local_currency: editDraft.local_currency,
        price_cad: editDraft.price_cad ? Number(editDraft.price_cad) : null,
        notes: editDraft.notes.trim() || null,
      }),
    })

    const result = await res.json()
    setSavingEditId(null)

    if (!result.success) {
      setMessage(result.error ?? 'Save failed')
      return
    }

    setEditingRequestId(null)
    setEditDraft(null)
    setMessage('Changes saved.')
    await loadPendingRequests()
  }

  async function handleManualSubmit(event: FormEvent) {
    event.preventDefault()
    setMessage('')
    setSavingManual(true)

    const parsedCadPrice = Number(priceCad)
    const parsedLocalPrice = Number(localPrice)
    const parsedExchangeRate = Number(exchangeRateUsed)
    const parsedConfidence = Number(confidenceScore)

    if (!restaurantName.trim()) {
      setMessage('Restaurant name is required.')
      setSavingManual(false)
      return
    }

    if (!dishName.trim()) {
      setMessage('Dish name is required.')
      setSavingManual(false)
      return
    }

    if (!Number.isFinite(parsedCadPrice) || parsedCadPrice <= 0) {
      setMessage('Enter a valid CAD price.')
      setSavingManual(false)
      return
    }

    if (!Number.isFinite(parsedLocalPrice) || parsedLocalPrice <= 0) {
      setMessage('Enter a valid local price.')
      setSavingManual(false)
      return
    }

    if (!Number.isFinite(parsedExchangeRate) || parsedExchangeRate <= 0) {
      setMessage('Enter a valid exchange rate.')
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
          country: selectedCountry(),
          restaurant_name: restaurantName.trim(),
          dish_name: dishName.trim(),
          dish_category: dishCategory,
          included_in_baseline: includedInBaseline,
          tier,
          local_price: parsedLocalPrice,
          local_currency: localCurrency,
          exchange_rate_used: parsedExchangeRate,
          price_cad: parsedCadPrice,
          source: source.trim(),
          source_type: sourceType,
          source_url: sourceUrl.trim() || null,
          confidence_score: parsedConfidence,
          notes: notes.trim() || null,
          date_accessed: new Date().toISOString(),
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
    setDishCategory('basic')
    setIncludedInBaseline(true)
    setTier('mid_tier')
    setLocalPrice('')
    setLocalCurrency('CAD')
    setExchangeRateUsed('1')
    setPriceCad('')
    setSource('')
    setSourceType('manual_review')
    setSourceUrl('')
    setConfidenceScore('0.7')
    setNotes('')
    setApproved(true)
    setSavingManual(false)
  }

  if (!loggedIn) {
    return (
      <main style={pageStyle}>
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
      <nav style={navStyle}>
        <a href="/" style={brandStyle}>
          fried rice <span style={{ color: '#C25E1E' }}>index</span>
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
                <span style={dashboardTitleStyle}>Pending requests</span>
                <span style={dashboardTextStyle}>
                  Review scraper proposals, public submissions, restaurant entries,
                  and population updates.
                </span>
              </button>

              <button
                onClick={() => {
                  setView('manual')
                  setMessage('')
                }}
                style={dashboardCardStyle}
              >
                <span style={dashboardTitleStyle}>Manual entry</span>
                <span style={dashboardTextStyle}>
                  Add a classified fried rice entry and recalculate the city baseline.
                </span>
              </button>

              <a href="/admin/restaurants" style={dashboardCardStyle}>
                <span style={dashboardTitleStyle}>Restaurants</span>
                <span style={dashboardTextStyle}>
                  View approved restaurants, edit prices and categories, mark inactive, and recalculate cities.
                </span>
              </a>

              <a href="/admin/cities" style={dashboardCardStyle}>
                <span style={dashboardTitleStyle}>Cities</span>
                <span style={dashboardTextStyle}>
                  Add or edit cities — name, country, region, flag, population, coordinates, climate, and blurb.
                </span>
              </a>
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

            <h1 style={titleStyle}>Review proposals.</h1>

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
                {pendingRequests.map((request) => {
                  const isEditing = editingRequestId === request.id
                  const isSavingEdit = savingEditId === request.id
                  const draft = isEditing ? editDraft! : null

                  return (
                  <div key={request.id} style={requestCardStyle}>
                    <div>
                      <p style={{
                        ...requestTypeStyle,
                        color: request.request_type === 'price_update' ? '#2563eb' : '#C25E1E',
                      }}>
                        {request.request_type === 'restaurant' ? 'New restaurant entry'
                          : request.request_type === 'price_update' ? '↑ Price update'
                          : 'Population update'}
                      </p>

                      <h2 style={requestTitleStyle}>{request.city}</h2>

                      {request.request_type === 'restaurant' ? (
                        <div style={detailGridStyle}>
                          <p>
                            <strong>Restaurant:</strong>{' '}
                            {isEditing ? (
                              <input value={draft!.restaurant_name} onChange={(e) => setEditDraft({ ...draft!, restaurant_name: e.target.value })} style={inlineInputStyle} />
                            ) : (request.restaurant_name || 'Unknown restaurant')}
                          </p>
                          <p>
                            <strong>Dish:</strong>{' '}
                            {isEditing ? (
                              <input value={draft!.dish_name} onChange={(e) => setEditDraft({ ...draft!, dish_name: e.target.value })} style={inlineInputStyle} />
                            ) : (request.dish_name || 'Missing dish')}
                          </p>
                          <p>
                            <strong>Category:</strong>{' '}
                            {isEditing ? (
                              <select value={draft!.dish_category} onChange={(e) => setEditDraft({ ...draft!, dish_category: e.target.value })} style={inlineInputStyle}>
                                {dishCategories.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                              </select>
                            ) : (request.dish_category || 'unknown')}
                          </p>
                          <p>
                            <strong>Tier:</strong>{' '}
                            {isEditing ? (
                              <select value={draft!.tier} onChange={(e) => setEditDraft({ ...draft!, tier: e.target.value })} style={inlineInputStyle}>
                                <option value="low_tier">low_tier</option>
                                <option value="mid_tier">mid_tier</option>
                                <option value="high_end">high_end</option>
                                <option value="premium">premium</option>
                              </select>
                            ) : (request.tier || 'mid_tier')}
                          </p>
                          <p>
                            <strong>Included in baseline:</strong>{' '}
                            {isEditing ? (
                              <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                                <input type="checkbox" checked={draft!.included_in_baseline} onChange={(e) => setEditDraft({ ...draft!, included_in_baseline: e.target.checked })} />
                                Yes
                              </label>
                            ) : (request.included_in_baseline ? 'Yes' : 'No')}
                          </p>
                          <p>
                            <strong>Local price:</strong>{' '}
                            {isEditing ? (
                              <>
                                <input type="number" step="0.01" value={draft!.local_price} onChange={(e) => setEditDraft({ ...draft!, local_price: e.target.value })} style={{ ...inlineInputStyle, width: 90 }} />
                                {' '}
                                <select value={draft!.local_currency} onChange={(e) => setEditDraft({ ...draft!, local_currency: e.target.value })} style={inlineInputStyle}>
                                  {currencies.map((c) => <option key={c} value={c}>{c}</option>)}
                                </select>
                              </>
                            ) : (request.local_price ? `${request.local_currency ?? ''} ${request.local_price}` : 'Missing')}
                          </p>
                          <p>
                            <strong>Exchange rate used:</strong>{' '}
                            {request.exchange_rate_used || 'Missing'}
                          </p>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <strong style={{ fontSize: 14 }}>CAD price:</strong>
                            <input
                              type="number"
                              step="0.01"
                              value={isEditing ? draft!.price_cad : (confirmedPrices[request.id] ?? String(request.price_cad ?? ''))}
                              onChange={(e) => isEditing
                                ? setEditDraft({ ...draft!, price_cad: e.target.value })
                                : setConfirmedPrices((prev) => ({ ...prev, [request.id]: e.target.value }))}
                              style={{ padding: '0.35rem 0.5rem', border: '0.5px solid #e5e3da', borderRadius: 8, fontFamily: 'var(--font-body)', fontSize: 14, width: 100 }}
                            />
                          </div>
                          <p>
                            <strong>Confidence:</strong>{' '}
                            {formatConfidence(request.confidence_score)}
                          </p>
                          <p>
                            <strong>Source type:</strong>{' '}
                            {request.source_type || 'Missing'}
                          </p>
                          <p>
                            <strong>Source:</strong>{' '}
                            {request.source || 'No source text'}
                          </p>
                          {request.source_url && (
                            <p>
                              <strong>URL:</strong>{' '}
                              <a href={request.source_url} target="_blank" rel="noreferrer" style={linkStyle}>
                                Open source
                              </a>
                            </p>
                          )}
                          <p>
                            <strong>Date accessed:</strong>{' '}
                            {formatDate(request.date_accessed)}
                          </p>
                          <p>
                            <strong>Notes:</strong>{' '}
                            {isEditing ? (
                              <textarea value={draft!.notes} onChange={(e) => setEditDraft({ ...draft!, notes: e.target.value })} style={{ ...inlineInputStyle, display: 'block', width: '100%', minHeight: 60, resize: 'vertical', marginTop: '0.25rem' }} />
                            ) : (request.notes || '—')}
                          </p>
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
                              <a href={request.source_url} target="_blank" rel="noreferrer" style={linkStyle}>
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
                      {isEditing ? (
                        <>
                          <button
                            onClick={() => saveEditRequest(request.id)}
                            style={primaryButtonStyle}
                            disabled={isSavingEdit}
                          >
                            {isSavingEdit ? 'Saving...' : 'Save changes'}
                          </button>
                          <button
                            onClick={() => { setEditingRequestId(null); setEditDraft(null) }}
                            style={secondaryButtonStyle}
                            disabled={isSavingEdit}
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => reviewRequest(request.id, 'approved')}
                            style={primaryButtonStyle}
                            disabled={reviewingRequestId === request.id}
                          >
                            {reviewingRequestId === request.id ? 'Working...' : 'Approve'}
                          </button>

                          {request.request_type === 'restaurant' && (
                            <button
                              onClick={() => startEditRequest(request)}
                              style={secondaryButtonStyle}
                              disabled={reviewingRequestId === request.id}
                            >
                              Edit
                            </button>
                          )}

                          <button
                            onClick={() => reviewRequest(request.id, 'denied')}
                            style={dangerButtonStyle}
                            disabled={reviewingRequestId === request.id}
                          >
                            Deny
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  )
                })}
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

            <h1 style={titleStyle}>Add fried rice data.</h1>

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
                  placeholder="Chicken Fried Rice"
                  required
                />
              </label>

              <label style={labelStyle}>
                Dish category
                <select
                  value={dishCategory}
                  onChange={(event) => setDishCategory(event.target.value)}
                  style={inputStyle}
                >
                  {dishCategories.map((category) => (
                    <option key={category.value} value={category.value}>
                      {category.label}
                    </option>
                  ))}
                </select>
              </label>

              <label style={labelStyle}>
                Restaurant tier
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
                  checked={includedInBaseline}
                  onChange={(event) => setIncludedInBaseline(event.target.checked)}
                />
                Include in baseline city price
              </label>

              <label style={labelStyle}>
                Local price
                <input
                  type="number"
                  step="0.01"
                  value={localPrice}
                  onChange={(event) => setLocalPrice(event.target.value)}
                  style={inputStyle}
                  required
                />
              </label>

              <label style={labelStyle}>
                Local currency
                <select
                  value={localCurrency}
                  onChange={(event) => setLocalCurrency(event.target.value)}
                  style={inputStyle}
                >
                  {currencies.map((currency) => (
                    <option key={currency} value={currency}>
                      {currency}
                    </option>
                  ))}
                </select>
              </label>

              <label style={labelStyle}>
                Exchange rate used to CAD
                <input
                  type="number"
                  step="0.0001"
                  value={exchangeRateUsed}
                  onChange={(event) => setExchangeRateUsed(event.target.value)}
                  style={inputStyle}
                  required
                />
              </label>

              <label style={labelStyle}>
                CAD price
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
                Source type
                <select
                  value={sourceType}
                  onChange={(event) => setSourceType(event.target.value)}
                  style={inputStyle}
                >
                  {sourceTypes.map((sourceType) => (
                    <option key={sourceType.value} value={sourceType.value}>
                      {sourceType.label}
                    </option>
                  ))}
                </select>
              </label>

              <label style={labelStyle}>
                Source description
                <input
                  value={source}
                  onChange={(event) => setSource(event.target.value)}
                  style={inputStyle}
                  placeholder="Official menu, Uber Eats, MenuPix, etc."
                  required
                />
              </label>

              <label style={labelStyle}>
                Source URL
                <input
                  value={sourceUrl}
                  onChange={(event) => setSourceUrl(event.target.value)}
                  style={inputStyle}
                  required
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

              <label style={labelStyle}>
                Notes
                <textarea
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  style={{ ...inputStyle, minHeight: 90, resize: 'vertical' }}
                  placeholder="Optional notes about source quality, dish ambiguity, delivery markup, etc."
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

function formatDate(value: string | null) {
  if (!value) return 'Missing'

  return new Date(value).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

const pageStyle: CSSProperties = {
  fontFamily: 'var(--font-body)',
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
  fontFamily: 'var(--font-display)',
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
  fontFamily: 'var(--font-display)',
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
  fontFamily: 'var(--font-body)',
  fontSize: 14,
  color: '#1a1a18',
}

const primaryButtonStyle: CSSProperties = {
  border: 'none',
  borderRadius: 10,
  padding: '0.75rem 1rem',
  background: '#C25E1E',
  color: '#fff',
  fontFamily: 'var(--font-body)',
  fontSize: 14,
  cursor: 'pointer',
}

const secondaryButtonStyle: CSSProperties = {
  border: '0.5px solid #e5e3da',
  borderRadius: 10,
  padding: '0.65rem 0.9rem',
  background: '#fff',
  color: '#1a1a18',
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  cursor: 'pointer',
}

const dangerButtonStyle: CSSProperties = {
  border: '0.5px solid #e5e3da',
  borderRadius: 10,
  padding: '0.75rem 1rem',
  background: '#fff',
  color: '#9b2c2c',
  fontFamily: 'var(--font-body)',
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
  fontFamily: 'var(--font-body)',
  textDecoration: 'none',
  color: 'inherit',
}

const dashboardTitleStyle: CSSProperties = {
  fontFamily: 'var(--font-display)',
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
  fontFamily: 'var(--font-display)',
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

const inlineInputStyle: CSSProperties = {
  padding: '0.25rem 0.5rem',
  border: '0.5px solid #e5e3da',
  borderRadius: 6,
  fontFamily: 'var(--font-body)',
  fontSize: 14,
  color: '#1a1a18',
  background: '#fff',
  boxSizing: 'border-box',
}

const formGridStyle: CSSProperties = {
  background: '#fff',
  border: '0.5px solid #e5e3da',
  borderRadius: 18,
  padding: '1.5rem',
  display: 'grid',
  gap: '1rem',
}