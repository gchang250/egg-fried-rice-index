'use client'

import type { CSSProperties, FormEvent } from 'react'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type CityRow = {
  city: string
  country: string | null
}

const dishCategories = [
  { value: 'basic', label: 'Basic fried rice' },
  { value: 'vegetable', label: 'Vegetable fried rice' },
  { value: 'meat_based', label: 'Meat-based fried rice' },
  { value: 'seafood', label: 'Seafood fried rice' },
  { value: 'house_special', label: 'House special / combination' },
  { value: 'premium', label: 'Premium / luxury' },
  { value: 'unknown', label: 'Unknown' },
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

export default function SubmitPage() {
  const [cities, setCities] = useState<CityRow[]>([])
  const [city, setCity] = useState('')
  const [restaurantName, setRestaurantName] = useState('')
  const [dishName, setDishName] = useState('')
  const [dishCategory, setDishCategory] = useState('basic')
  const [localPrice, setLocalPrice] = useState('')
  const [localCurrency, setLocalCurrency] = useState('CAD')
  const [sourceUrl, setSourceUrl] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    async function fetchCities() {
      const { data } = await supabase
        .from('cities')
        .select('city, country')
        .order('city', { ascending: true })

      setCities((data ?? []) as CityRow[])

      if (data && data.length > 0) {
        setCity(data[0].city)
      }
    }

    fetchCities()
  }, [])

  function selectedCountry() {
    return cities.find((row) => row.city === city)?.country ?? null
  }

  function includedInBaseline() {
    return dishCategory === 'basic' || dishCategory === 'vegetable'
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setMessage('')
    setSaving(true)

    const parsedLocalPrice = Number(localPrice)

    if (!city || !restaurantName.trim() || !dishName.trim() || !sourceUrl.trim()) {
      setMessage('City, restaurant, dish name, and source URL are required.')
      setSaving(false)
      return
    }

    if (!Number.isFinite(parsedLocalPrice) || parsedLocalPrice <= 0) {
      setMessage('Enter a valid local price.')
      setSaving(false)
      return
    }

    const { error } = await supabase.from('pending_requests').insert({
      request_type: 'restaurant',
      city,
      country: selectedCountry(),
      restaurant_name: restaurantName.trim(),
      dish_name: dishName.trim(),
      dish_category: dishCategory,
      included_in_baseline: includedInBaseline(),
      local_price: parsedLocalPrice,
      local_currency: localCurrency,
      price_cad: null,
      source: 'Public submission',
      source_type: 'public_submission',
      source_url: sourceUrl.trim(),
      confidence_score: 0.45,
      date_accessed: new Date().toISOString(),
      notes: notes.trim() || null,
      status: 'pending',
    })

    if (error) {
      setMessage(error.message)
      setSaving(false)
      return
    }

    setMessage('Submission received. It will appear after review.')
    setRestaurantName('')
    setDishName('')
    setDishCategory('basic')
    setLocalPrice('')
    setLocalCurrency('CAD')
    setSourceUrl('')
    setNotes('')
    setSaving(false)
  }

  return (
    <main style={pageStyle}>
      <link
        href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500&display=swap"
        rel="stylesheet"
      />

      <nav style={navStyle}>
        <a href="/" style={brandStyle}>
          fried rice <span style={{ color: '#C25E1E' }}>index</span>
        </a>

        <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
          <a href="/cities" style={navLinkStyle}>cities</a>
          <a href="/about" style={navLinkStyle}>about</a>
          <a href="/methodology" style={navLinkStyle}>methodology</a>
        </div>
      </nav>

      <section style={{ maxWidth: 760, margin: '0 auto', padding: '4rem 1.5rem' }}>
        <p style={eyebrowStyle}>Submit data</p>

        <h1 style={titleStyle}>Submit a fried rice price.</h1>

        <p style={introStyle}>
          Submit a restaurant menu entry for review. Public submissions are not added
          directly to the index until they are checked for source quality, dish category,
          and price reliability.
        </p>

        {message && <p style={messageStyle}>{message}</p>}

        <form onSubmit={handleSubmit} style={formStyle}>
          <label style={labelStyle}>
            City
            <select value={city} onChange={(event) => setCity(event.target.value)} style={inputStyle}>
              {cities.map((cityRow) => (
                <option key={cityRow.city} value={cityRow.city}>
                  {cityRow.city}
                </option>
              ))}
            </select>
          </label>

          <label style={labelStyle}>
            Restaurant name
            <input value={restaurantName} onChange={(event) => setRestaurantName(event.target.value)} style={inputStyle} required />
          </label>

          <label style={labelStyle}>
            Dish name
            <input value={dishName} onChange={(event) => setDishName(event.target.value)} style={inputStyle} placeholder="Chicken Fried Rice" required />
          </label>

          <label style={labelStyle}>
            Dish category
            <select value={dishCategory} onChange={(event) => setDishCategory(event.target.value)} style={inputStyle}>
              {dishCategories.map((category) => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
          </label>

          <label style={labelStyle}>
            Local price
            <input type="number" step="0.01" value={localPrice} onChange={(event) => setLocalPrice(event.target.value)} style={inputStyle} required />
          </label>

          <label style={labelStyle}>
            Local currency
            <select value={localCurrency} onChange={(event) => setLocalCurrency(event.target.value)} style={inputStyle}>
              {currencies.map((currency) => (
                <option key={currency} value={currency}>
                  {currency}
                </option>
              ))}
            </select>
          </label>

          <label style={labelStyle}>
            Source URL
            <input value={sourceUrl} onChange={(event) => setSourceUrl(event.target.value)} style={inputStyle} placeholder="Restaurant menu or ordering page" required />
          </label>

          <label style={labelStyle}>
            Notes
            <textarea value={notes} onChange={(event) => setNotes(event.target.value)} style={{ ...inputStyle, minHeight: 100, resize: 'vertical' }} placeholder="Optional: delivery markup, menu date, screenshot context, etc." />
          </label>

          <button type="submit" style={primaryButtonStyle} disabled={saving}>
            {saving ? 'Submitting...' : 'Submit for review'}
          </button>
        </form>
      </section>
    </main>
  )
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

const navLinkStyle: CSSProperties = {
  fontSize: 13,
  color: '#6b6b64',
  textDecoration: 'none',
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
  fontSize: 48,
  lineHeight: 1.05,
  letterSpacing: -1.2,
  margin: '0 0 1rem',
}

const introStyle: CSSProperties = {
  fontSize: 16,
  lineHeight: 1.7,
  color: '#6b6b64',
  marginBottom: '1.5rem',
}

const formStyle: CSSProperties = {
  background: '#fff',
  border: '0.5px solid #e5e3da',
  borderRadius: 18,
  padding: '1.5rem',
  display: 'grid',
  gap: '1rem',
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

const messageStyle: CSSProperties = {
  background: '#fff',
  border: '0.5px solid #e5e3da',
  borderRadius: 12,
  padding: '0.9rem 1rem',
  color: '#3a3a34',
  fontSize: 14,
  marginBottom: '1rem',
}