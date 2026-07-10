'use client'

import type { CSSProperties, FormEvent } from 'react'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type CityRow = {
  city: string
  country: string | null
  region: string | null
  flag: string | null
  population: string | null
  latitude: number | null
  longitude: number | null
  climate: string | null
  blurb: string | null
  population_source: string | null
  price_cad: number | null
  data_quality_label: string | null
  baseline_entry_count: number | null
  market_entry_count: number | null
}

type CityForm = {
  city: string
  country: string
  region: string
  flag: string
  population: string
  latitude: string
  longitude: string
  climate: string
  blurb: string
  population_source: string
}

const emptyForm: CityForm = {
  city: '',
  country: '',
  region: '',
  flag: '',
  population: '',
  latitude: '',
  longitude: '',
  climate: '',
  blurb: '',
  population_source: '',
}

function rowToForm(row: CityRow): CityForm {
  return {
    city: row.city,
    country: row.country ?? '',
    region: row.region ?? '',
    flag: row.flag ?? '',
    population: row.population ?? '',
    latitude: row.latitude !== null ? String(row.latitude) : '',
    longitude: row.longitude !== null ? String(row.longitude) : '',
    climate: row.climate ?? '',
    blurb: row.blurb ?? '',
    population_source: row.population_source ?? '',
  }
}

export default function AdminCitiesPage() {
  const [password, setPassword] = useState('')
  const [passwordInput, setPasswordInput] = useState('')
  const [authError, setAuthError] = useState('')

  const [cities, setCities] = useState<CityRow[]>([])
  const [loading, setLoading] = useState(false)
  const [editingCity, setEditingCity] = useState<string | null>(null)
  const [form, setForm] = useState<CityForm>(emptyForm)
  const [isCreating, setIsCreating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  const [scraping, setScraping] = useState(false)
  const [scrapeLog, setScrapeLog] = useState<Array<{ city: string; status: 'running' | 'done' | 'error'; proposals?: number; error?: string }>>([])
  const [scrapingCity, setScrapingCity] = useState<string | null>(null)
  const [cityScrapedResult, setCityScrapedResult] = useState<Record<string, { proposals?: number; error?: string }>>({})

  async function scrapeOneCity(cityRow: CityRow) {
    if (!cityRow.country) { setMessage('City has no country set.'); return }
    setScrapingCity(cityRow.city)
    try {
      const res = await fetch('/api/scrape-city', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'gchang', password, city: cityRow.city, country: cityRow.country, region: cityRow.region ?? undefined }),
      })
      const result = await res.json()
      setCityScrapedResult((prev) => ({
        ...prev,
        [cityRow.city]: result.error ? { error: result.error } : { proposals: result.proposals_inserted },
      }))
    } catch (err) {
      setCityScrapedResult((prev) => ({
        ...prev,
        [cityRow.city]: { error: err instanceof Error ? err.message : 'Network error' },
      }))
    }
    setScrapingCity(null)
  }

  async function scrapeAllCities() {
    const citiesToScrape = cities.filter((c) => c.country)
    if (citiesToScrape.length === 0) {
      setMessage('No cities with a country set.')
      return
    }
    setScraping(true)
    setScrapeLog([])
    for (const cityRow of citiesToScrape) {
      setScrapeLog((prev) => [...prev, { city: cityRow.city, status: 'running' }])
      try {
        const res = await fetch('/api/scrape-city', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: 'gchang', password, city: cityRow.city, country: cityRow.country, region: cityRow.region ?? undefined }),
        })
        const result = await res.json()
        setScrapeLog((prev) => prev.map((e) =>
          e.city === cityRow.city
            ? { ...e, status: result.error ? 'error' : 'done', proposals: result.proposals_inserted, error: result.error }
            : e
        ))
      } catch (err) {
        setScrapeLog((prev) => prev.map((e) =>
          e.city === cityRow.city ? { ...e, status: 'error', error: err instanceof Error ? err.message : 'Network error' } : e
        ))
      }
      await new Promise((r) => setTimeout(r, 500))
    }
    setScraping(false)
  }

  useEffect(() => {
    const stored = sessionStorage.getItem('admin_password')
    if (stored) setPassword(stored)
  }, [])

  useEffect(() => {
    if (password) loadCities()
  }, [password])

  async function loadCities() {
    setLoading(true)
    const { data, error } = await supabase
      .from('cities')
      .select(`
        city, country, region, flag, population, latitude, longitude,
        climate, blurb, population_source, price_cad,
        data_quality_label, baseline_entry_count, market_entry_count
      `)
      .order('city')

    if (error) {
      setMessage(error.message)
      setLoading(false)
      return
    }

    setCities((data ?? []) as CityRow[])
    setLoading(false)
  }

  function handleLogin(event: FormEvent) {
    event.preventDefault()
    setAuthError('')
    fetch('/api/admin-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'gchang', password: passwordInput }),
    })
      .then((res) => res.json())
      .then((result) => {
        if (!result.success) {
          setAuthError(result.error ?? 'Invalid password')
          return
        }
        sessionStorage.setItem('admin_password', passwordInput)
        setPassword(passwordInput)
      })
  }

  function startEdit(row: CityRow) {
    setIsCreating(false)
    setEditingCity(row.city)
    setForm(rowToForm(row))
    setMessage('')
  }

  function startCreate() {
    setEditingCity(null)
    setIsCreating(true)
    setForm(emptyForm)
    setMessage('')
  }

  function cancelEdit() {
    setEditingCity(null)
    setIsCreating(false)
    setForm(emptyForm)
    setMessage('')
  }

  async function handleSave(event: FormEvent) {
    event.preventDefault()
    setSaving(true)
    setMessage('')

    const body = {
      password,
      city: form.city.trim(),
      country: form.country.trim() || null,
      region: form.region.trim() || null,
      flag: form.flag.trim() || null,
      population: form.population.trim() || null,
      latitude: form.latitude ? Number(form.latitude) : null,
      longitude: form.longitude ? Number(form.longitude) : null,
      climate: form.climate.trim() || null,
      blurb: form.blurb.trim() || null,
      population_source: form.population_source.trim() || null,
    }

    const method = isCreating ? 'POST' : 'PATCH'

    const res = await fetch('/api/admin-city', {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    const result = await res.json()
    setSaving(false)

    if (!result.success) {
      setMessage(result.error ?? 'Save failed')
      return
    }

    setMessage(isCreating ? `Created ${form.city}.` : `Updated ${form.city}.`)
    cancelEdit()
    await loadCities()
  }

  if (!password) {
    return (
      <main style={pageStyle}>
        <div style={loginCardStyle}>
          <p style={eyebrowStyle}>Admin</p>
          <h1 style={titleStyle}>Sign in.</h1>
          <form onSubmit={handleLogin} style={{ display: 'grid', gap: '1rem' }}>
            <label style={labelStyle}>
              Password
              <input type="password" value={passwordInput} onChange={(e) => setPasswordInput(e.target.value)} style={inputStyle} autoComplete="current-password" />
            </label>
            {authError && <p style={errorStyle}>{authError}</p>}
            <button type="submit" style={primaryButtonStyle}>Login</button>
          </form>
        </div>
      </main>
    )
  }

  const formPanel = (editingCity !== null || isCreating) && (
    <div style={panelStyle}>
      <h2 style={panelTitleStyle}>{isCreating ? 'Add new city' : `Edit ${editingCity}`}</h2>

      <form onSubmit={handleSave} style={formGridStyle}>
        <label style={labelStyle}>
          City name {isCreating && <span style={{ color: '#C25E1E' }}>*</span>}
          <input
            value={form.city}
            onChange={(e) => setForm({ ...form, city: e.target.value })}
            style={inputStyle}
            required
            disabled={!isCreating}
          />
        </label>

        <label style={labelStyle}>
          Country
          <input value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} style={inputStyle} />
        </label>

        <label style={labelStyle}>
          Region / state / province
          <input value={form.region} onChange={(e) => setForm({ ...form, region: e.target.value })} style={inputStyle} />
        </label>

        <label style={labelStyle}>
          Flag emoji
          <input value={form.flag} onChange={(e) => setForm({ ...form, flag: e.target.value })} style={inputStyle} placeholder="🇨🇦" />
        </label>

        <label style={labelStyle}>
          Population (display string)
          <input value={form.population} onChange={(e) => setForm({ ...form, population: e.target.value })} style={inputStyle} placeholder="2.9 million" />
        </label>

        <label style={labelStyle}>
          Population source
          <input value={form.population_source} onChange={(e) => setForm({ ...form, population_source: e.target.value })} style={inputStyle} placeholder="Statistics Canada 2021" />
        </label>

        <label style={labelStyle}>
          Latitude
          <input type="number" step="0.0001" value={form.latitude} onChange={(e) => setForm({ ...form, latitude: e.target.value })} style={inputStyle} placeholder="49.2827" />
        </label>

        <label style={labelStyle}>
          Longitude
          <input type="number" step="0.0001" value={form.longitude} onChange={(e) => setForm({ ...form, longitude: e.target.value })} style={inputStyle} placeholder="-123.1207" />
        </label>

        <label style={labelStyle}>
          Climate
          <input value={form.climate} onChange={(e) => setForm({ ...form, climate: e.target.value })} style={inputStyle} placeholder="Oceanic (Köppen Cfb)" />
        </label>

        <div style={{ gridColumn: '1 / -1' }}>
          <label style={labelStyle}>
            City blurb
            <textarea
              value={form.blurb}
              onChange={(e) => setForm({ ...form, blurb: e.target.value })}
              style={{ ...inputStyle, minHeight: 100, resize: 'vertical' }}
              placeholder="Short description of the city for its profile page."
            />
          </label>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button type="submit" style={primaryButtonStyle} disabled={saving}>
            {saving ? 'Saving...' : isCreating ? 'Create city' : 'Save changes'}
          </button>
          <button type="button" onClick={cancelEdit} style={secondaryButtonStyle}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  )

  return (
    <main style={pageStyle}>
      <nav style={navStyle}>
        <a href="/" style={brandStyle}>fried rice <span style={{ color: '#C25E1E' }}>index</span></a>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <a href="/admin" style={navLinkStyle}>Dashboard</a>
          <a href="/admin/restaurants" style={navLinkStyle}>Restaurants</a>
        </div>
      </nav>

      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '2.5rem 1.5rem' }}>
        <p style={eyebrowStyle}>City management</p>
        <h1 style={titleStyle}>Manage cities.</h1>

        {message && <p style={messageStyle}>{message}</p>}

        {scrapeLog.length > 0 && (
          <div style={panelStyle}>
            <h2 style={{ ...panelTitleStyle, fontSize: 20, marginBottom: '0.75rem' }}>
              {scraping ? 'Scraping cities…' : 'Scrape complete'}
            </h2>
            <div style={{ display: 'grid', gap: '0.4rem' }}>
              {scrapeLog.map((entry) => (
                <div key={entry.city} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: 13 }}>
                  <span style={{ width: 16, textAlign: 'center' }}>
                    {entry.status === 'running' ? '⋯' : entry.status === 'done' ? '✓' : '✗'}
                  </span>
                  <span style={{ minWidth: 140 }}>{entry.city}</span>
                  {entry.status === 'done' && (
                    <span style={{ color: '#6b6b64' }}>{entry.proposals ?? 0} new proposals</span>
                  )}
                  {entry.status === 'error' && (
                    <span style={{ color: '#9b2c2c' }}>{entry.error}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {formPanel}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginBottom: '1rem' }}>
          <button onClick={scrapeAllCities} style={secondaryButtonStyle} disabled={scraping || loading}>
            {scraping ? 'Scraping…' : 'Scrape all cities'}
          </button>
          <button onClick={startCreate} style={primaryButtonStyle} disabled={isCreating}>
            + Add city
          </button>
        </div>

        {loading ? (
          <p style={{ color: '#6b6b64' }}>Loading...</p>
        ) : (
          <div style={tableWrapperStyle}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>City</th>
                  <th style={thStyle}>Country</th>
                  <th style={thStyle}>Region</th>
                  <th style={thStyle}>Population</th>
                  <th style={thStyle}>Price (CAD)</th>
                  <th style={thStyle}>Quality</th>
                  <th style={thStyle}>Baseline</th>
                  <th style={thStyle}>Market</th>
                  <th style={thStyle}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {cities.map((row) => (
                  <tr key={row.city} style={{ background: editingCity === row.city ? '#fffbf5' : undefined }}>
                    <td style={tdStyle}>
                      <strong>{row.flag ? `${row.flag} ` : ''}{row.city}</strong>
                    </td>
                    <td style={tdStyle}>{row.country ?? '-'}</td>
                    <td style={tdStyle}>{row.region ?? '-'}</td>
                    <td style={tdStyle}>{row.population ?? '-'}</td>
                    <td style={tdStyle}>{row.price_cad !== null ? `CA$${Number(row.price_cad).toFixed(2)}` : '-'}</td>
                    <td style={tdStyle}>{row.data_quality_label ?? '-'}</td>
                    <td style={tdStyle}>{row.baseline_entry_count ?? '-'}</td>
                    <td style={tdStyle}>{row.market_entry_count ?? '-'}</td>
                    <td style={{ ...tdStyle, whiteSpace: 'nowrap' }}>
                      <button onClick={() => startEdit(row)} style={{ ...secondaryButtonStyle, padding: '0.35rem 0.65rem', fontSize: 12 }}>
                        Edit
                      </button>
                      {row.country && (
                        <button
                          onClick={() => scrapeOneCity(row)}
                          disabled={scrapingCity === row.city || scraping}
                          style={{ ...secondaryButtonStyle, padding: '0.35rem 0.65rem', fontSize: 12, marginLeft: '0.4rem' }}
                        >
                          {scrapingCity === row.city ? '…' : 'Scrape'}
                        </button>
                      )}
                      {cityScrapedResult[row.city] && (
                        <span style={{ fontSize: 11, marginLeft: '0.5rem', color: cityScrapedResult[row.city].error ? '#9b2c2c' : '#2c7a4b' }}>
                          {cityScrapedResult[row.city].error
                            ? `✗ ${cityScrapedResult[row.city].error}`
                            : `✓ ${cityScrapedResult[row.city].proposals ?? 0} proposals`}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  )
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
  flexWrap: 'wrap',
  gap: '1rem',
}

const brandStyle: CSSProperties = {
  fontFamily: 'var(--font-display)',
  fontSize: 18,
  color: '#1a1a18',
  textDecoration: 'none',
}

const navLinkStyle: CSSProperties = {
  fontSize: 13,
  color: '#6b6b64',
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
  padding: '0.7rem 0.9rem',
  border: '0.5px solid #e5e3da',
  borderRadius: 10,
  background: '#fff',
  fontFamily: 'var(--font-body)',
  fontSize: 14,
  color: '#1a1a18',
  boxSizing: 'border-box',
  width: '100%',
}

const primaryButtonStyle: CSSProperties = {
  border: 'none',
  borderRadius: 10,
  padding: '0.65rem 1rem',
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

const panelStyle: CSSProperties = {
  background: '#fff',
  border: '0.5px solid #e5e3da',
  borderRadius: 18,
  padding: '1.5rem',
  marginBottom: '1.5rem',
}

const panelTitleStyle: CSSProperties = {
  fontFamily: 'var(--font-display)',
  fontSize: 28,
  margin: '0 0 1.25rem',
}

const formGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
  gap: '1rem',
}

const tableWrapperStyle: CSSProperties = {
  background: '#fff',
  border: '0.5px solid #e5e3da',
  borderRadius: 16,
  overflowX: 'auto',
}

const tableStyle: CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  minWidth: 900,
}

const thStyle: CSSProperties = {
  textAlign: 'left',
  padding: '0.75rem',
  fontSize: 11,
  textTransform: 'uppercase',
  letterSpacing: '1px',
  color: '#9b9b90',
  borderBottom: '0.5px solid #e5e3da',
  whiteSpace: 'nowrap',
}

const tdStyle: CSSProperties = {
  padding: '0.7rem 0.75rem',
  fontSize: 13,
  color: '#3a3a34',
  borderBottom: '0.5px solid #f0ede6',
  verticalAlign: 'middle',
}
