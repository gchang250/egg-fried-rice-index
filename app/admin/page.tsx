'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 11,
  textTransform: 'uppercase',
  letterSpacing: '1.2px',
  color: '#9b9b90',
  marginBottom: 6,
  marginTop: 14,
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.75rem 0.9rem',
  border: '0.5px solid #e5e3da',
  borderRadius: 10,
  background: '#FAFAF8',
  fontSize: 14,
  boxSizing: 'border-box',
}

export default function AdminPage() {
  const [restaurants, setRestaurants] = useState<any[]>([])
  const [cityOptions, setCityOptions] = useState<string[]>([])
  const [city, setCity] = useState('Toronto')
  const [name, setName] = useState('')
  const [tier, setTier] = useState('mid_tier')
  const [price, setPrice] = useState('')
  const [source, setSource] = useState('manual research')
  const [confidence, setConfidence] = useState('0.8')
  const [message, setMessage] = useState('')

  async function fetchRestaurants(selectedCity: string) {
    const response = await fetch(
      `/api/restaurants?city=${encodeURIComponent(selectedCity)}`
    )

    const result = await response.json()

    if (!result.success) {
      setMessage(`Error loading restaurants: ${result.error}`)
      return
    }

    setRestaurants(result.restaurants)
  }

  useEffect(() => {
    async function fetchCities() {
      const { data, error } = await supabase
        .from('cities')
        .select('city')
        .order('city', { ascending: true })

      if (error) {
        setMessage(`Error loading cities: ${error.message}`)
        return
      }

      const cityNames = (data ?? []).map((row) => row.city).filter(Boolean)

      setCityOptions(cityNames)

      if (cityNames.length > 0) {
        setCity(cityNames[0])
      }
    }

    fetchCities()
  }, [])

  useEffect(() => {
    if (city) {
      fetchRestaurants(city)
    }
  }, [city])

  async function addRestaurant() {
    setMessage('Adding restaurant...')

    const params = new URLSearchParams({
      city,
      name,
      tier,
      price,
      source,
      confidence,
      approved: 'true',
    })

    const response = await fetch(`/api/add-restaurant?${params.toString()}`)
    const result = await response.json()

    if (!result.success) {
      setMessage(`Error: ${result.error}`)
      return
    }

    setMessage(`Added ${name}. Recalculating ${city}...`)

    const recalcResponse = await fetch(
      `/api/recalculate-city?city=${encodeURIComponent(city)}`
    )

    const recalcResult = await recalcResponse.json()

    if (!recalcResult.success) {
      setMessage(`Added restaurant, but recalculation failed: ${recalcResult.error}`)
      return
    }

    setMessage(
      `Added ${name}. ${city} average is now CA$${Number(
        recalcResult.average_price_cad
      ).toFixed(2)}.`
    )

    await fetchRestaurants(city)

    setName('')
    setPrice('')
  }

  return (
    <main
      style={{
        fontFamily: 'DM Sans, sans-serif',
        background: '#FAFAF8',
        minHeight: '100vh',
        padding: '3rem',
        color: '#1a1a18',
      }}
    >
      <div
        style={{
          maxWidth: 620,
          margin: '0 auto',
          background: '#fff',
          border: '0.5px solid #e5e3da',
          borderRadius: 18,
          padding: '2rem',
        }}
      >
        <h1 style={{ fontFamily: 'serif', fontSize: 32, marginBottom: 8 }}>
          Add Restaurant Entry
        </h1>

        <p style={{ color: '#6b6b64', fontSize: 14, marginBottom: '2rem' }}>
          Add an approved egg fried rice price, then automatically recalculate the city average.
        </p>

        <label style={labelStyle}>City</label>
        <select value={city} onChange={(e) => setCity(e.target.value)} style={inputStyle}>
          {cityOptions.map((cityOption) => (
            <option key={cityOption} value={cityOption}>
              {cityOption}
            </option>
          ))}
        </select>

        <label style={labelStyle}>Restaurant name</label>
        <input value={name} onChange={(e) => setName(e.target.value)} style={inputStyle} />

        <label style={labelStyle}>Tier</label>
        <select value={tier} onChange={(e) => setTier(e.target.value)} style={inputStyle}>
          <option value="low_tier">Low tier</option>
          <option value="mid_tier">Mid tier</option>
          <option value="high_end">High end</option>
          <option value="fine_dining">Fine dining</option>
        </select>

        <label style={labelStyle}>Price in CAD</label>
        <input value={price} onChange={(e) => setPrice(e.target.value)} style={inputStyle} />

        <label style={labelStyle}>Source</label>
        <input value={source} onChange={(e) => setSource(e.target.value)} style={inputStyle} />

        <label style={labelStyle}>Confidence, 0 to 1</label>
        <input
          value={confidence}
          onChange={(e) => setConfidence(e.target.value)}
          style={inputStyle}
        />

        <button
          onClick={addRestaurant}
          style={{
            width: '100%',
            marginTop: '1rem',
            padding: '0.85rem 1rem',
            borderRadius: 12,
            border: 'none',
            background: '#C25E1E',
            color: '#fff',
            fontSize: 14,
            cursor: 'pointer',
          }}
        >
          Add restaurant and recalculate
        </button>

        {message && (
          <p style={{ marginTop: '1rem', fontSize: 13, color: '#3a3a34', lineHeight: 1.5 }}>
            {message}
          </p>
        )}

        <div style={{ marginTop: '2rem' }}>
          <h2 style={{ fontFamily: 'serif', fontSize: 22, marginBottom: 12 }}>
            Existing Entries
          </h2>

          {restaurants.length === 0 ? (
            <p style={{ fontSize: 13, color: '#6b6b64' }}>
              No restaurant entries found for this city.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {restaurants.map((restaurant) => (
                <div
                  key={restaurant.id}
                  style={{
                    border: '0.5px solid #e5e3da',
                    borderRadius: 12,
                    padding: '0.85rem',
                    background: '#FAFAF8',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                    <strong style={{ fontSize: 14 }}>
                      {restaurant.restaurant_name}
                    </strong>

                    <span style={{ fontSize: 14, color: '#C25E1E' }}>
                      CA${Number(restaurant.price_cad).toFixed(2)}
                    </span>
                  </div>

                  <p style={{ margin: '0.35rem 0 0', fontSize: 12, color: '#6b6b64' }}>
                    {restaurant.tier} · confidence{' '}
                    {Math.round(Number(restaurant.confidence_score) * 100)}%
                  </p>

                  <p style={{ margin: '0.25rem 0 0', fontSize: 12, color: '#9b9b90' }}>
                    approved: {String(restaurant.approved)} · active: {String(restaurant.active)}
                  </p>

                  <p style={{ margin: '0.25rem 0 0', fontSize: 12, color: '#9b9b90' }}>
                    source: {restaurant.source}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  )
}