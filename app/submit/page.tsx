'use client'

import type { CSSProperties, FormEvent } from 'react'
import { useEffect, useState } from 'react'
import { MapPin, Store, Utensils, Tag, DollarSign, MessageSquare, Send, ArrowRight } from 'lucide-react'
import NavBar from '@/app/components/NavBar'
import { supabase } from '@/lib/supabase'

type CityRow = { city: string; region: string | null }

const dishCategories = [
  { value: 'basic',         label: 'Classic poutine (fries, curds, gravy)' },
  { value: 'vegetable',     label: 'Vegetable / Mushroom gravy poutine' },
  { value: 'meat_based',    label: 'Gourmet / Meat poutine' },
  { value: 'seafood',       label: 'Seafood poutine' },
  { value: 'house_special', label: 'House special poutine' },
  { value: 'premium',       label: 'Premium / Luxury poutine' },
  { value: 'unknown',       label: 'Unknown' },
]

function Field({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: 'grid', gap: '0.5rem' }}>
      <span style={{ fontSize: 12, color: 'var(--color-text-3)', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 }}>
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
  const [priceCad, setPriceCad]           = useState('')
  const [notes, setNotes]                 = useState('')
  const [saving, setSaving]               = useState(false)
  const [message, setMessage]             = useState('')
  const [success, setSuccess]             = useState(false)

  useEffect(() => {
    supabase.from('cities').select('city, region').order('city', { ascending: true })
      .then(({ data }) => {
        setCities((data ?? []) as CityRow[])
        if (data?.length) setCity(data[0].city)
      })
  }, [])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setMessage('')
    setSuccess(false)
    setSaving(true)
    const parsed = Number(priceCad)
    
    if (!city || !restaurantName.trim() || !dishName.trim()) {
      setMessage('City, restaurant name, and dish name are required.')
      setSaving(false); return
    }
    if (!Number.isFinite(parsed) || parsed <= 0) {
      setMessage('Enter a valid price in CAD.')
      setSaving(false); return
    }
    const region = cities.find(r => r.city === city)?.region ?? null
    const { error } = await supabase.from('pending_requests').insert({
      request_type: 'restaurant', city, country: 'Canada', region, restaurant_name: restaurantName.trim(),
      dish_name: dishName.trim(), dish_category: dishCategory,
      included_in_baseline: dishCategory === 'basic' || dishCategory === 'vegetable',
      local_price: parsed, local_currency: 'CAD', exchange_rate_used: 1,
      price_cad: parsed, source: 'Public submission', source_type: 'public_submission',
      confidence_score: 0.45,
      date_accessed: new Date().toISOString(), notes: notes.trim() || null, status: 'pending',
    })
    if (error) { setMessage(error.message); setSaving(false); return }
    setSuccess(true)
    setRestaurantName(''); setDishName(''); setDishCategory('basic')
    setPriceCad(''); setNotes('')
    setSaving(false)
  }

  return (
    <main style={{ fontFamily: 'var(--font-body)', background: 'var(--color-bg)', minHeight: '100vh', color: 'var(--color-text-1)' }}>
      <NavBar active="submit" />

      <div style={{ maxWidth: 680, margin: '0 auto', padding: 'clamp(3rem,6vh,5rem) 2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '1.5rem' }}>
          <Send size={14} color="var(--color-accent)" />
          <span style={{ fontSize: 11, letterSpacing: '2.5px', textTransform: 'uppercase', color: 'var(--color-text-3)', fontWeight: 600 }}>Submit data</span>
        </div>

        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(32px,5vw,52px)', fontWeight: 400, lineHeight: 1.05, letterSpacing: -1.2, color: 'var(--color-text-1)', margin: '0 0 1rem' }}>
          Submit a poutine price.
        </h1>
        <p style={{ fontSize: 15, color: 'var(--color-text-2)', lineHeight: 1.65, marginBottom: '2.5rem' }}>
          Spotted a price in your Canadian community that we&apos;re missing? Submit details of the menu item below. We will audit and approve it shortly.
        </p>

        {success && (
          <div style={{ background: 'var(--color-surface)', border: '0.5px solid var(--color-green)', borderRadius: 10, padding: '1rem 1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: 8 }}>
            <ArrowRight size={14} color="var(--color-green)" />
            <span style={{ fontSize: 14, color: 'var(--color-green)' }}>Submission received! We&apos;ll audit the diner menu and update the index shortly.</span>
          </div>
        )}
        {message && (
          <div style={{ background: 'var(--color-surface)', border: '0.5px solid var(--color-border)', borderRadius: 10, padding: '1rem 1.25rem', marginBottom: '1.5rem' }}>
            <p style={{ fontSize: 14, color: 'var(--color-text-2)', margin: 0 }}>{message}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ background: 'var(--color-surface)', border: '0.5px solid var(--color-border)', borderRadius: 12, padding: '2rem', display: 'grid', gap: '1.25rem' }}>
          <Field icon={<MapPin size={12} />} label="Canadian Community">
            <select value={city} onChange={e => setCity(e.target.value)} style={inp}>
              {cities.map(r => <option key={r.city} value={r.city}>{r.city} ({r.region})</option>)}
            </select>
          </Field>
          
          <Field icon={<Store size={12} />} label="Restaurant / Diner Name">
            <input value={restaurantName} onChange={e => setRestaurantName(e.target.value)} style={inp} placeholder="e.g. Chez Ashton" required />
          </Field>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <Field icon={<Utensils size={12} />} label="Dish name on menu">
              <input value={dishName} onChange={e => setDishName(e.target.value)} style={inp} placeholder="e.g. Classic Poutine" required />
            </Field>
            <Field icon={<Tag size={12} />} label="Dish category">
              <select value={dishCategory} onChange={e => setDishCategory(e.target.value)} style={inp}>
                {dishCategories.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </Field>
          </div>

          <Field icon={<DollarSign size={12} />} label="Price (CAD)">
            <input type="number" step="0.01" value={priceCad} onChange={e => setPriceCad(e.target.value)} style={inp} placeholder="e.g. 10.50" required />
          </Field>

          <Field icon={<MessageSquare size={12} />} label="Notes / Menu link (optional)">
            <textarea value={notes} onChange={e => setNotes(e.target.value)} style={{ ...inp, minHeight: 80, resize: 'vertical' }} placeholder="Link to the menu, delivery app listing, or other verification details." />
          </Field>

          <div style={{ borderTop: '0.5px solid var(--color-border)', paddingTop: '1.25rem' }}>
            <button type="submit" disabled={saving} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '.75rem 1.75rem', background: 'var(--color-accent)', color: '#fff', border: 'none', borderRadius: 8, fontFamily: 'var(--font-body)', fontSize: 14, cursor: saving ? 'default' : 'pointer', opacity: saving ? 0.6 : 1, fontWeight: 600 }}>
              <Send size={14} />
              {saving ? 'Submitting…' : 'Submit price'}
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
  outline: 'none',
}
