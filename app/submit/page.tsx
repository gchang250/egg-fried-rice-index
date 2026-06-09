'use client'

import type { CSSProperties, FormEvent } from 'react'
import { useEffect, useState } from 'react'
import { Globe, MapPin, Store, Utensils, Tag, DollarSign, Link2, MessageSquare, Send, ArrowRight } from 'lucide-react'
import NavBar from '@/app/components/NavBar'
import { supabase } from '@/lib/supabase'

type CityRow = { city: string; country: string | null }

const dishCategories = [
  { value: 'basic',         label: 'Basic fried rice' },
  { value: 'vegetable',     label: 'Vegetable fried rice' },
  { value: 'meat_based',    label: 'Meat-based fried rice' },
  { value: 'seafood',       label: 'Seafood fried rice' },
  { value: 'house_special', label: 'House special / combination' },
  { value: 'premium',       label: 'Premium / luxury' },
  { value: 'unknown',       label: 'Unknown' },
]

const currencies = ['CAD','USD','EUR','GBP','CHF','JPY','CNY','AUD','HKD','SGD','SAR','PHP','MYR','MXN','ARS','KRW','INR','AED']

const cadRates: Record<string, number> = {
  CAD:1, USD:1.37, EUR:1.48, GBP:1.73, CHF:1.52, JPY:0.0093,
  CNY:0.19, AUD:0.91, HKD:0.18, SGD:1.01, SAR:0.37, PHP:0.024,
  MYR:0.31, MXN:0.08, ARS:0.0014, KRW:0.001, INR:0.016, AED:0.37,
}


function Field({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: 'grid', gap: '0.5rem' }}>
      <span style={{ fontSize: 12, color: 'var(--color-text-3)', display: 'flex', alignItems: 'center', gap: 6 }}>
        {icon} {label}
      </span>
      {children}
    </label>
  )
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
  const [success, setSuccess]             = useState(false)

  useEffect(() => {
    supabase.from('cities').select('city, country').order('city', { ascending: true })
      .then(({ data }) => {
        setCities((data ?? []) as CityRow[])
        if (data?.length) setCity(data[0].city)
      })
  }, [])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setMessage('')
    setSaving(true)
    const parsed = Number(localPrice)
    const rate   = cadRates[localCurrency] ?? 1
    const priceCad = Number((parsed * rate).toFixed(2))
    if (!city || !restaurantName.trim() || !dishName.trim() || !sourceUrl.trim()) {
      setMessage('City, restaurant name, dish name, and source URL are required.')
      setSaving(false); return
    }
    if (!Number.isFinite(parsed) || parsed <= 0) {
      setMessage('Enter a valid local price.')
      setSaving(false); return
    }
    const country = cities.find(r => r.city === city)?.country ?? null
    const { error } = await supabase.from('pending_requests').insert({
      request_type: 'restaurant', city, country, restaurant_name: restaurantName.trim(),
      dish_name: dishName.trim(), dish_category: dishCategory,
      included_in_baseline: dishCategory === 'basic' || dishCategory === 'vegetable',
      local_price: parsed, local_currency: localCurrency, exchange_rate_used: rate,
      price_cad: priceCad, source: 'Public submission', source_type: 'public_submission',
      source_url: sourceUrl.trim(), confidence_score: 0.45,
      date_accessed: new Date().toISOString(), notes: notes.trim() || null, status: 'pending',
    })
    if (error) { setMessage(error.message); setSaving(false); return }
    setSuccess(true)
    setRestaurantName(''); setDishName(''); setDishCategory('basic')
    setLocalPrice(''); setLocalCurrency('CAD'); setSourceUrl(''); setNotes('')
    setSaving(false)
  }

  return (
    <main style={{ fontFamily: 'var(--font-body)', background: 'var(--color-bg)', minHeight: '100vh', color: 'var(--color-text-1)' }}>
      <NavBar active="submit" />

      <div style={{ maxWidth: 680, margin: '0 auto', padding: 'clamp(3rem,6vh,5rem) 2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '1.5rem' }}>
          <Send size={14} color="var(--color-accent)" />
          <span style={{ fontSize: 11, letterSpacing: '2.5px', textTransform: 'uppercase', color: 'var(--color-text-3)' }}>Submit data</span>
        </div>

        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(32px,5vw,52px)', fontWeight: 400, lineHeight: 1.05, letterSpacing: -1.2, color: 'var(--color-text-1)', margin: '0 0 1rem' }}>
          Submit a fried rice price.
        </h1>
        <p style={{ fontSize: 15, color: 'var(--color-text-2)', lineHeight: 1.65, marginBottom: '2.5rem' }}>
          Found a price we&apos;re missing? Submit it and we&apos;ll review it before adding it to the index.
        </p>

        {success && (
          <div style={{ background: 'var(--color-surface)', border: '0.5px solid #3db870', borderRadius: 10, padding: '1rem 1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: 8 }}>
            <ArrowRight size={14} color="#3db870" />
            <span style={{ fontSize: 14, color: '#3db870' }}>Submitted. We&apos;ll review it and add it to the index if approved.</span>
          </div>
        )}
        {message && (
          <div style={{ background: 'var(--color-surface)', border: '0.5px solid var(--color-border)', borderRadius: 10, padding: '1rem 1.25rem', marginBottom: '1.5rem' }}>
            <p style={{ fontSize: 14, color: 'var(--color-text-2)', margin: 0 }}>{message}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ background: 'var(--color-surface)', border: '0.5px solid var(--color-border)', borderRadius: 12, padding: '2rem', display: 'grid', gap: '1.25rem' }}>
          <Field icon={<MapPin size={12} />} label="City">
            <select value={city} onChange={e => setCity(e.target.value)} style={inp}>
              {cities.map(r => <option key={r.city} value={r.city}>{r.city}</option>)}
            </select>
          </Field>
          <Field icon={<Store size={12} />} label="Restaurant name">
            <input value={restaurantName} onChange={e => setRestaurantName(e.target.value)} style={inp} required />
          </Field>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <Field icon={<Utensils size={12} />} label="Dish name">
              <input value={dishName} onChange={e => setDishName(e.target.value)} style={inp} placeholder="Egg Fried Rice" required />
            </Field>
            <Field icon={<Tag size={12} />} label="Dish category">
              <select value={dishCategory} onChange={e => setDishCategory(e.target.value)} style={inp}>
                {dishCategories.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </Field>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <Field icon={<DollarSign size={12} />} label="Local price">
              <input type="number" step="0.01" value={localPrice} onChange={e => setLocalPrice(e.target.value)} style={inp} required />
            </Field>
            <Field icon={<Globe size={12} />} label="Local currency">
              <select value={localCurrency} onChange={e => setLocalCurrency(e.target.value)} style={inp}>
                {currencies.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
          </div>
          <Field icon={<Link2 size={12} />} label="Source URL">
            <input value={sourceUrl} onChange={e => setSourceUrl(e.target.value)} style={inp} placeholder="Link to the restaurant menu or ordering page" required />
          </Field>
          <Field icon={<MessageSquare size={12} />} label="Notes (optional)">
            <textarea value={notes} onChange={e => setNotes(e.target.value)} style={{ ...inp, minHeight: 90, resize: 'vertical' }} placeholder="Delivery markup, menu date, screenshot context, etc." />
          </Field>

          <div style={{ borderTop: '0.5px solid var(--color-border)', paddingTop: '1.25rem' }}>
            <button type="submit" disabled={saving} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '.75rem 1.75rem', background: 'var(--color-accent)', color: '#fff', border: 'none', borderRadius: 8, fontFamily: 'var(--font-body)', fontSize: 14, cursor: saving ? 'default' : 'pointer', opacity: saving ? 0.6 : 1 }}>
              <Send size={14} />
              {saving ? 'Submitting…' : 'Submit for review'}
            </button>
          </div>
        </form>
      </div>
    </main>
  )
}

const inp: CSSProperties = {
  width: '100%', boxSizing: 'border-box',
  padding: '0.65rem 0.9rem',
  border: '0.5px solid var(--color-border)',
  borderRadius: 8, background: 'var(--color-bg)',
  fontFamily: 'var(--font-body)', fontSize: 14,
  color: 'var(--color-text-1)',
}
