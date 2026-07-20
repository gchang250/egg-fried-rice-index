'use client'

import type { CSSProperties, FormEvent } from 'react'
import { useEffect, useState } from 'react'
import { MapPin, Tag, DollarSign, MessageSquare, Send, ArrowRight } from 'lucide-react'
import NavBar from '@/app/components/NavBar'
import Footer from '@/app/components/Footer'
import { supabase } from '@/lib/supabase'

type CityRow = { city: string; region: string | null }

const indicatorCategories = [
  { value: 'median_rent_1br',    label: 'Average 1BR Rent (monthly CAD)' },
  { value: 'median_gross_wage',  label: 'Median Income (monthly CAD)' },
  { value: 'prov_tax_bracket',   label: 'Provincial Tax Bracket Pressure' },
  { value: 'safety_index',       label: 'Safety Index (/100)' },
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
  const [indicator, setIndicator]         = useState('median_rent_1br')
  const [proposedValue, setProposedValue] = useState('')
  const [notes, setNotes]                 = useState('')
  const [saving, setSaving]               = useState(false)
  const [message, setMessage]             = useState('')
  const [success, setSuccess]             = useState(false)

  useEffect(() => {
    supabase.from('cities').select('city, region').order('city', { ascending: true })
      .then(({ data }) => {
        const rows = (data ?? []) as CityRow[]
        setCities(rows)
        if (rows.length) setCity(rows[0].city)
      })
  }, [])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setMessage('')
    setSuccess(false)
    setSaving(true)

    if (!city || !proposedValue.trim()) {
      setMessage('Riding and proposed value are required.')
      setSaving(false); return
    }

    const region = cities.find(r => r.city === city)?.region ?? null
    const { error } = await supabase.from('pending_requests').insert({
      request_type: 'riding_update',
      city,
      country: 'Canada',
      region,
      dish_name: indicator, // Map the indicator field to generic database columns
      dish_category: 'riding_update_request',
      local_price: Number(proposedValue) || null,
      notes: `Proposed Value: ${proposedValue.trim()}. Source/Notes: ${notes.trim()}`,
      status: 'pending',
      date_accessed: new Date().toISOString()
    })

    if (error) { setMessage(error.message); setSaving(false); return }
    setSuccess(true)
    setProposedValue('')
    setNotes('')
    setSaving(false)
  }

  return (
    <main style={{ fontFamily: 'var(--font-body)', background: 'var(--color-bg)', minHeight: '100vh', color: 'var(--color-text-1)' }}>
      <NavBar active="submit" />

      <div style={{ maxWidth: 680, margin: '0 auto', padding: 'clamp(3rem,6vh,5rem) 2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '1.5rem' }}>
          <Send size={14} color="var(--color-accent)" />
          <span style={{ fontSize: 13, color: 'var(--color-text-3)', fontWeight: 600 }}>Submit Data</span>
        </div>

        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(32px,5vw,52px)', fontWeight: 400, lineHeight: 1.05, letterSpacing: -1.2, color: 'var(--color-text-1)', margin: '0 0 1rem' }}>
          Submit a riding update.
        </h1>
        <p style={{ fontSize: 15, color: 'var(--color-text-2)', lineHeight: 1.65, marginBottom: '2.5rem' }}>
          Spotted local CMHC rental updates, Statistics Canada median income adjustments, or changes in regional quality metrics? Submit proposed values below for audit.
        </p>

        {success && (
          <div style={{ background: 'var(--color-surface)', border: '0.5px solid var(--color-green)', borderRadius: 10, padding: '1rem 1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: 8 }}>
            <ArrowRight size={14} color="var(--color-green)" />
            <span style={{ fontSize: 14, color: 'var(--color-green)' }}>Submission received! We will verify the updated statistics and refresh the CanPol Index.</span>
          </div>
        )}
        {message && (
          <div style={{ background: 'var(--color-surface)', border: '0.5px solid var(--color-border)', borderRadius: 10, padding: '1rem 1.25rem', marginBottom: '1.5rem' }}>
            <p style={{ fontSize: 14, color: 'var(--color-text-2)', margin: 0 }}>{message}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ background: 'var(--color-surface)', border: '0.5px solid var(--color-border)', borderRadius: 12, padding: '2rem', display: 'grid', gap: '1.25rem' }}>
          <Field icon={<MapPin size={12} />} label="Federal Riding / Community">
            <select value={city} onChange={e => setCity(e.target.value)} style={inp}>
              {cities.map(r => <option key={r.city} value={r.city}>{r.city} ({r.region})</option>)}
            </select>
          </Field>

          <Field icon={<Tag size={12} />} label="Indicator to Update">
            <select value={indicator} onChange={e => setIndicator(e.target.value)} style={inp}>
              {indicatorCategories.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </Field>

          <Field icon={<DollarSign size={12} />} label="New Proposed Value">
            <input value={proposedValue} onChange={e => setProposedValue(e.target.value)} style={inp} placeholder="e.g. 1450 or 45%" required />
          </Field>

          <Field icon={<MessageSquare size={12} />} label="Source Link & Verification Details">
            <textarea value={notes} onChange={e => setNotes(e.target.value)} style={{ ...inp, minHeight: 100, resize: 'vertical' }} placeholder="Provide a link to Statistics Canada, CMHC, or provincial releases to verify this update." required />
          </Field>

          <div style={{ borderTop: '0.5px solid var(--color-border)', paddingTop: '1.25rem' }}>
            <button type="submit" disabled={saving} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '.75rem 1.75rem', background: 'var(--color-accent)', color: '#fff', border: 'none', borderRadius: 8, fontFamily: 'var(--font-body)', fontSize: 14, cursor: saving ? 'default' : 'pointer', opacity: saving ? 0.6 : 1, fontWeight: 600 }}>
              <Send size={14} />
              {saving ? 'Submitting…' : 'Submit update request'}
            </button>
          </div>
        </form>
      </div>
      <Footer />
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
