'use client'

import type { CSSProperties, FormEvent } from 'react'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type CityRow = {
  city: string
  country: string | null
}

const dishCategories = [
  { value: 'basic',        label: 'Basic fried rice' },
  { value: 'vegetable',    label: 'Vegetable fried rice' },
  { value: 'meat_based',   label: 'Meat-based fried rice' },
  { value: 'seafood',      label: 'Seafood fried rice' },
  { value: 'house_special',label: 'House special / combination' },
  { value: 'premium',      label: 'Premium / luxury' },
  { value: 'unknown',      label: 'Unknown' },
]

const currencies = ['CAD','USD','EUR','GBP','CHF','JPY','CNY','AUD','HKD','SGD','SAR','PHP','MYR','MXN','ARS','KRW','INR','AED']

const cadRates: Record<string, number> = {
  CAD:1, USD:1.37, EUR:1.48, GBP:1.73, CHF:1.52, JPY:0.0093,
  CNY:0.19, AUD:0.91, HKD:0.18, SGD:1.01, SAR:0.37, PHP:0.024,
  MYR:0.31, MXN:0.08, ARS:0.0014, KRW:0.001, INR:0.016, AED:0.37,
}

export default function SubmitPage() {
  const [cities, setCities]               = useState<CityRow[]>([])
  const [city, setCity]                   = useState('')
  const [restaurantName, setRestaurantName] = useState('')
  const [dishName, setDishName]           = useState('')
  const [dishCategory, setDishCategory]   = useState('basic')
  const [localPrice, setLocalPrice]       = useState('')
  const [localCurrency, setLocalCurrency] = useState('CAD')
  const [sourceUrl, setSourceUrl]         = useState('')
  const [notes, setNotes]                 = useState('')
  const [saving, setSaving]               = useState(false)
  const [message, setMessage]             = useState('')

  useEffect(() => {
    async function fetchCities() {
      const { data } = await supabase.from('cities').select('city, country').order('city', { ascending: true })
      setCities((data ?? []) as CityRow[])
      if (data && data.length > 0) setCity(data[0].city)
    }
    fetchCities()
  }, [])

  function selectedCountry() {
    return cities.find(r => r.city === city)?.country ?? null
  }

  function includedInBaseline() {
    return dishCategory === 'basic' || dishCategory === 'vegetable'
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setMessage('')
    setSaving(true)

    const parsedLocalPrice = Number(localPrice)
    const exchangeRateUsed = cadRates[localCurrency] ?? 1
    const priceCad = Number((parsedLocalPrice * exchangeRateUsed).toFixed(2))

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
      exchange_rate_used: exchangeRateUsed,
      price_cad: priceCad,
      source: 'Public submission',
      source_type: 'public_submission',
      source_url: sourceUrl.trim(),
      confidence_score: 0.45,
      date_accessed: new Date().toISOString(),
      notes: notes.trim() || null,
      status: 'pending',
    })

    if (error) { setMessage(error.message); setSaving(false); return }

    setMessage('Submitted. It will appear in the index after review.')
    setRestaurantName(''); setDishName(''); setDishCategory('basic')
    setLocalPrice(''); setLocalCurrency('CAD'); setSourceUrl(''); setNotes('')
    setSaving(false)
  }

  return (
    <main style={{ fontFamily: 'DM Sans, sans-serif', background: '#0c0f0d', minHeight: '100vh', color: '#e8e4dc' }}>
      <nav style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '1.1rem 2rem',
        borderBottom: '0.5px solid #1e261e',
      }}>
        <a href="/" style={{ fontFamily: 'DM Serif Display, serif', fontSize: 17, color: '#e8e4dc', textDecoration: 'none' }}>
          fried rice <span style={{ color: '#d9682a' }}>index</span>
        </a>
        <div style={{ display: 'flex', gap: '1.75rem' }}>
          {[['cities', '/cities'], ['submit', '/submit'], ['about', '/about'], ['methodology', '/methodology']].map(([l, h]) => (
            <a key={h} href={h} style={{ fontSize: 13, color: '#5a5a52', textDecoration: 'none' }}>{l}</a>
          ))}
        </div>
      </nav>

      <section style={{ maxWidth: 760, margin: '0 auto', padding: '4rem 2rem' }}>
        <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: '1.5px', textTransform: 'uppercase', color: '#d9682a', marginBottom: '1rem' }}>
          Submit data
        </p>

        <h1 style={{ fontFamily: 'DM Serif Display, serif', fontSize: 48, lineHeight: 1.05, letterSpacing: -1.2, color: '#f0ece4', margin: '0 0 1rem' }}>
          Submit a fried rice price.
        </h1>

        <p style={{ fontSize: 16, lineHeight: 1.7, color: '#6a6a62', marginBottom: '1.5rem' }}>
          Found a price we&apos;re missing? Submit it and we&apos;ll review it before adding it to the index.
        </p>

        {message && (
          <p style={{ background: '#141714', border: '0.5px solid #1e261e', borderRadius: 12, padding: '0.9rem 1rem', color: '#a8a49c', fontSize: 14, marginBottom: '1rem' }}>
            {message}
          </p>
        )}

        <form onSubmit={handleSubmit} style={{ background: '#111411', border: '0.5px solid #1a2218', borderRadius: 18, padding: '1.5rem', display: 'grid', gap: '1rem' }}>
          {[
            { label: 'City', el: (
              <select value={city} onChange={e => setCity(e.target.value)} style={inputStyle}>
                {cities.map(r => <option key={r.city} value={r.city}>{r.city}</option>)}
              </select>
            )},
            { label: 'Restaurant name', el: (
              <input value={restaurantName} onChange={e => setRestaurantName(e.target.value)} style={inputStyle} required />
            )},
            { label: 'Dish name', el: (
              <input value={dishName} onChange={e => setDishName(e.target.value)} style={inputStyle} placeholder="Chicken Fried Rice" required />
            )},
            { label: 'Dish category', el: (
              <select value={dishCategory} onChange={e => setDishCategory(e.target.value)} style={inputStyle}>
                {dishCategories.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            )},
            { label: 'Local price', el: (
              <input type="number" step="0.01" value={localPrice} onChange={e => setLocalPrice(e.target.value)} style={inputStyle} required />
            )},
            { label: 'Local currency', el: (
              <select value={localCurrency} onChange={e => setLocalCurrency(e.target.value)} style={inputStyle}>
                {currencies.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            )},
            { label: 'Source URL', el: (
              <input value={sourceUrl} onChange={e => setSourceUrl(e.target.value)} style={inputStyle} placeholder="Restaurant menu or ordering page" required />
            )},
            { label: 'Notes', el: (
              <textarea value={notes} onChange={e => setNotes(e.target.value)} style={{ ...inputStyle, minHeight: 100, resize: 'vertical' }} placeholder="Optional: delivery markup, menu date, screenshot context, etc." />
            )},
          ].map(({ label, el }) => (
            <label key={label} style={{ display: 'grid', gap: '0.4rem', fontSize: 13, color: '#5a5a52' }}>
              {label}
              {el}
            </label>
          ))}

          <button type="submit" disabled={saving} style={{
            border: 'none', borderRadius: 10, padding: '0.75rem 1rem',
            background: '#d9682a', color: '#fff',
            fontFamily: 'DM Sans, sans-serif', fontSize: 14, cursor: 'pointer',
            opacity: saving ? 0.6 : 1,
          }}>
            {saving ? 'Submitting…' : 'Submit for review'}
          </button>
        </form>
      </section>
    </main>
  )
}

const inputStyle: CSSProperties = {
  width: '100%', boxSizing: 'border-box',
  padding: '0.75rem 0.9rem',
  border: '0.5px solid #1e261e',
  borderRadius: 10,
  background: '#0c0f0d',
  fontFamily: 'DM Sans, sans-serif',
  fontSize: 14,
  color: '#e8e4dc',
}
