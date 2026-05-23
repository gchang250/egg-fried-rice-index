'use client'

import type { CSSProperties, FormEvent } from 'react'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type RestaurantRow = {
  id: string
  city: string
  restaurant_name: string | null
  dish_name: string | null
  dish_category: string | null
  tier: string | null
  local_price: number | null
  local_currency: string | null
  price_cad: number | null
  confidence_score: number | null
  included_in_baseline: boolean | null
  active: boolean | null
  approved: boolean | null
  source_type: string | null
  source_url: string | null
  created_at: string | null
}

type EditState = {
  price_cad: string
  dish_category: string
  tier: string
  confidence_score: string
  included_in_baseline: boolean
  active: boolean
}

const dishCategories = [
  { value: 'basic', label: 'Basic' },
  { value: 'vegetable', label: 'Vegetable' },
  { value: 'meat_based', label: 'Meat-based' },
  { value: 'seafood', label: 'Seafood' },
  { value: 'house_special', label: 'House special' },
  { value: 'premium', label: 'Premium' },
  { value: 'unknown', label: 'Unknown' },
]

const tierOptions = [
  { value: 'low_tier', label: 'Low tier' },
  { value: 'mid_tier', label: 'Mid tier' },
  { value: 'high_end', label: 'High end' },
  { value: 'premium', label: 'Premium' },
  { value: 'fine_dining', label: 'Fine dining' },
]

function formatCad(value: number | null): string {
  if (value === null || !Number.isFinite(Number(value))) return '—'
  return `CA$${Number(value).toFixed(2)}`
}

function formatDate(value: string | null): string {
  if (!value) return '—'
  return new Date(value).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

export default function AdminRestaurantsPage() {
  const [password, setPassword] = useState('')
  const [passwordInput, setPasswordInput] = useState('')
  const [authError, setAuthError] = useState('')

  const [cities, setCities] = useState<string[]>([])
  const [cityFilter, setCityFilter] = useState('')
  const [showFilter, setShowFilter] = useState<'approved' | 'all' | 'inactive'>('approved')

  const [rows, setRows] = useState<RestaurantRow[]>([])
  const [loading, setLoading] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editState, setEditState] = useState<EditState | null>(null)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  const [recalculating, setRecalculating] = useState(false)

  useEffect(() => {
    const stored = sessionStorage.getItem('admin_password')
    if (stored) setPassword(stored)
  }, [])

  useEffect(() => {
    if (password) loadCities()
  }, [password])

  useEffect(() => {
    if (password && cityFilter) loadRestaurants()
  }, [password, cityFilter, showFilter])

  async function loadCities() {
    const { data } = await supabase.from('cities').select('city').order('city')
    const names = (data ?? []).map((row: { city: string }) => row.city)
    setCities(names)
    if (names.length > 0) setCityFilter(names[0])
  }

  async function loadRestaurants() {
    setLoading(true)
    setMessage('')

    let query = supabase
      .from('restaurants')
      .select(`
        id, city, restaurant_name, dish_name, dish_category, tier,
        local_price, local_currency, price_cad, confidence_score,
        included_in_baseline, active, approved, source_type, source_url, created_at
      `)
      .eq('city', cityFilter)
      .order('created_at', { ascending: false })

    if (showFilter === 'approved') {
      query = query.eq('approved', true).eq('active', true)
    } else if (showFilter === 'inactive') {
      query = query.eq('active', false)
    }

    const { data, error } = await query

    if (error) {
      setMessage(error.message)
      setLoading(false)
      return
    }

    setRows((data ?? []) as RestaurantRow[])
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

  function startEdit(row: RestaurantRow) {
    setEditingId(row.id)
    setEditState({
      price_cad: String(row.price_cad ?? ''),
      dish_category: row.dish_category ?? 'unknown',
      tier: row.tier ?? 'mid_tier',
      confidence_score: String(row.confidence_score ?? ''),
      included_in_baseline: row.included_in_baseline ?? false,
      active: row.active ?? true,
    })
  }

  async function saveEdit(id: string) {
    if (!editState) return
    setSavingId(id)
    setMessage('')

    const res = await fetch('/api/update-restaurant', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        password,
        id,
        price_cad: editState.price_cad,
        dish_category: editState.dish_category,
        tier: editState.tier,
        confidence_score: editState.confidence_score,
        included_in_baseline: editState.included_in_baseline,
        active: editState.active,
      }),
    })

    const result = await res.json()
    setSavingId(null)

    if (!result.success) {
      setMessage(result.error ?? 'Save failed')
      return
    }

    setEditingId(null)
    setEditState(null)
    setMessage('Saved.')
    await loadRestaurants()
  }

  async function markInactive(id: string) {
    setSavingId(id)
    setMessage('')

    const res = await fetch('/api/update-restaurant', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password, id, active: false }),
    })

    const result = await res.json()
    setSavingId(null)

    if (!result.success) {
      setMessage(result.error ?? 'Failed to deactivate')
      return
    }

    setMessage('Marked inactive.')
    await loadRestaurants()
  }

  async function recalculateCity() {
    setRecalculating(true)
    setMessage('')

    const res = await fetch('/api/recalculate-city', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password, city: cityFilter }),
    })

    const result = await res.json()
    setRecalculating(false)

    if (!result.success) {
      setMessage(result.error ?? 'Recalculation failed')
      return
    }

    setMessage(
      `${cityFilter} recalculated: ${result.baseline_entry_count} baseline entries, baseline median CA$${result.baseline_median_cad ?? result.median_price_cad}.`
    )
  }

  if (!password) {
    return (
      <main style={pageStyle}>
        <link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet" />
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

  return (
    <main style={pageStyle}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet" />

      <nav style={navStyle}>
        <a href="/" style={brandStyle}>fried rice <span style={{ color: '#C25E1E' }}>index</span></a>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <a href="/admin" style={navLinkStyle}>Dashboard</a>
          <a href="/admin/cities" style={navLinkStyle}>Cities</a>
        </div>
      </nav>

      <section style={{ maxWidth: 1300, margin: '0 auto', padding: '2.5rem 1.5rem' }}>
        <p style={eyebrowStyle}>Restaurant management</p>
        <h1 style={titleStyle}>Manage restaurant data.</h1>

        {message && <p style={messageStyle}>{message}</p>}

        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.5rem', alignItems: 'center' }}>
          <label style={{ ...labelStyle, flexDirection: 'row', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ whiteSpace: 'nowrap', fontSize: 13, color: '#6b6b64' }}>City</span>
            <select value={cityFilter} onChange={(e) => setCityFilter(e.target.value)} style={{ ...inputStyle, width: 'auto' }}>
              {cities.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </label>

          <label style={{ ...labelStyle, flexDirection: 'row', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ whiteSpace: 'nowrap', fontSize: 13, color: '#6b6b64' }}>Show</span>
            <select value={showFilter} onChange={(e) => setShowFilter(e.target.value as 'approved' | 'all' | 'inactive')} style={{ ...inputStyle, width: 'auto' }}>
              <option value="approved">Approved + active</option>
              <option value="all">All</option>
              <option value="inactive">Inactive</option>
            </select>
          </label>

          <button onClick={recalculateCity} style={secondaryButtonStyle} disabled={recalculating || !cityFilter}>
            {recalculating ? 'Recalculating...' : `Recalculate ${cityFilter}`}
          </button>
        </div>

        {loading ? (
          <p style={{ color: '#6b6b64' }}>Loading...</p>
        ) : rows.length === 0 ? (
          <div style={emptyStyle}>No entries found.</div>
        ) : (
          <div style={tableWrapperStyle}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>Restaurant</th>
                  <th style={thStyle}>Dish</th>
                  <th style={thStyle}>Category</th>
                  <th style={thStyle}>Tier</th>
                  <th style={thStyle}>Local price</th>
                  <th style={thStyle}>CAD price</th>
                  <th style={thStyle}>Baseline</th>
                  <th style={thStyle}>Confidence</th>
                  <th style={thStyle}>Active</th>
                  <th style={thStyle}>Added</th>
                  <th style={thStyle}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const isEditing = editingId === row.id
                  const isSaving = savingId === row.id

                  return (
                    <tr key={row.id} style={{ opacity: row.active === false ? 0.5 : 1 }}>
                      <td style={tdStyle}>{row.restaurant_name ?? '—'}</td>
                      <td style={tdStyle}>{row.dish_name ?? '—'}</td>

                      <td style={tdStyle}>
                        {isEditing ? (
                          <select
                            value={editState!.dish_category}
                            onChange={(e) => setEditState({ ...editState!, dish_category: e.target.value })}
                            style={cellInputStyle}
                          >
                            {dishCategories.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                          </select>
                        ) : (
                          row.dish_category ?? '—'
                        )}
                      </td>

                      <td style={tdStyle}>
                        {isEditing ? (
                          <select
                            value={editState!.tier}
                            onChange={(e) => setEditState({ ...editState!, tier: e.target.value })}
                            style={cellInputStyle}
                          >
                            {tierOptions.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                          </select>
                        ) : (
                          row.tier ?? '—'
                        )}
                      </td>

                      <td style={tdStyle}>
                        {row.local_price ? `${row.local_currency ?? ''} ${row.local_price}` : '—'}
                      </td>

                      <td style={tdStyle}>
                        {isEditing ? (
                          <input
                            type="number"
                            step="0.01"
                            value={editState!.price_cad}
                            onChange={(e) => setEditState({ ...editState!, price_cad: e.target.value })}
                            style={{ ...cellInputStyle, width: 80 }}
                          />
                        ) : (
                          formatCad(row.price_cad)
                        )}
                      </td>

                      <td style={tdStyle}>
                        {isEditing ? (
                          <input
                            type="checkbox"
                            checked={editState!.included_in_baseline}
                            onChange={(e) => setEditState({ ...editState!, included_in_baseline: e.target.checked })}
                          />
                        ) : (
                          row.included_in_baseline ? 'Yes' : 'No'
                        )}
                      </td>

                      <td style={tdStyle}>
                        {isEditing ? (
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            max="1"
                            value={editState!.confidence_score}
                            onChange={(e) => setEditState({ ...editState!, confidence_score: e.target.value })}
                            style={{ ...cellInputStyle, width: 70 }}
                          />
                        ) : (
                          row.confidence_score !== null ? `${Math.round(Number(row.confidence_score) * 100)}%` : '—'
                        )}
                      </td>

                      <td style={tdStyle}>{row.active ? 'Yes' : 'No'}</td>

                      <td style={tdStyle}>{formatDate(row.created_at)}</td>

                      <td style={{ ...tdStyle, whiteSpace: 'nowrap' }}>
                        {isEditing ? (
                          <>
                            <button
                              onClick={() => saveEdit(row.id)}
                              style={{ ...primaryButtonStyle, padding: '0.4rem 0.7rem', fontSize: 12, marginRight: '0.4rem' }}
                              disabled={isSaving}
                            >
                              {isSaving ? '...' : 'Save'}
                            </button>
                            <button
                              onClick={() => { setEditingId(null); setEditState(null) }}
                              style={{ ...secondaryButtonStyle, padding: '0.4rem 0.7rem', fontSize: 12 }}
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => startEdit(row)}
                              style={{ ...secondaryButtonStyle, padding: '0.4rem 0.7rem', fontSize: 12, marginRight: '0.4rem' }}
                            >
                              Edit
                            </button>
                            {row.active !== false && (
                              <button
                                onClick={() => markInactive(row.id)}
                                style={{ ...dangerButtonStyle, padding: '0.4rem 0.7rem', fontSize: 12 }}
                                disabled={isSaving}
                              >
                                {isSaving ? '...' : 'Deactivate'}
                              </button>
                            )}
                          </>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
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
  flexWrap: 'wrap',
  gap: '1rem',
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
  padding: '0.65rem 0.9rem',
  border: '0.5px solid #e5e3da',
  borderRadius: 10,
  background: '#fff',
  fontFamily: 'DM Sans, sans-serif',
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
  padding: '0.65rem 1rem',
  background: '#fff',
  color: '#9b2c2c',
  fontFamily: 'DM Sans, sans-serif',
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

const emptyStyle: CSSProperties = {
  background: '#fff',
  border: '0.5px solid #e5e3da',
  borderRadius: 16,
  padding: '1.5rem',
  color: '#6b6b64',
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
  minWidth: 1100,
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

const cellInputStyle: CSSProperties = {
  padding: '0.3rem 0.5rem',
  border: '0.5px solid #e5e3da',
  borderRadius: 6,
  fontFamily: 'DM Sans, sans-serif',
  fontSize: 13,
  color: '#1a1a18',
  background: '#fff',
}
