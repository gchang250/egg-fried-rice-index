'use client'

import { useRef, useState } from 'react'
import {
  Globe, ChevronRight, RotateCcw, Expand,
  MapPin, BarChart2, TrendingDown, TrendingUp,
  X, ExternalLink, Menu,
} from 'lucide-react'
import WorldMap, { type MapCity, type WorldMapHandle, LEGEND } from './components/WorldMap'
import { RATES, SYMBOLS } from './cities/[city]/CityPageContent'

const CURRENCY_OPTIONS = [
  ['CAD','CA$'],['USD','US$'],['EUR','€'],['GBP','£'],['CHF','Fr'],
  ['JPY','¥'],['CNY','¥'],['AUD','AU$'],['HKD','HK$'],['SGD','S$'],
  ['KRW','₩'],['INR','₹'],['AED','AED'],['BRL','R$'],['MXN','MX$'],
]

function cvt(cad: number | null, cur: string): string {
  if (!cad) return '—'
  const rate = RATES[cur] ?? 1
  const sym  = SYMBOLS[cur] ?? 'CA$'
  const val  = cad * rate
  return `${sym}${val.toLocaleString(undefined, { minimumFractionDigits: val >= 100 ? 0 : 2, maximumFractionDigits: val >= 100 ? 0 : 2 })}`
}

function NavBar() {
  const [open, setOpen] = useState(false)
  const links = [
    ['cities','/cities'], ['submit','/submit'], ['about','/about'], ['methodology','/methodology'],
  ]
  return (
    <>
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 200,
        background: 'rgba(9,13,10,.88)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '0.5px solid var(--color-border)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 2rem', height: 56,
      }}>
        <a href="/" style={{ fontFamily: 'var(--font-display)', fontSize: 17, color: 'var(--color-text-1)', textDecoration: 'none', fontStyle: 'italic', letterSpacing: -.2, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Globe size={15} color="var(--color-accent)" />
          fried rice <span style={{ color: 'var(--color-accent)', fontStyle: 'normal' }}>index</span>
        </a>

        {/* Desktop links */}
        <div style={{ display: 'flex', gap: '1.75rem', alignItems: 'center' }} className="desktop-nav">
          {links.map(([l, h]) => (
            <a key={h} href={h} style={{ fontSize: 13, color: 'var(--color-text-3)', textDecoration: 'none', letterSpacing: '.02em' }}>{l}</a>
          ))}
        </div>

        {/* Mobile hamburger */}
        <button onClick={() => setOpen(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-2)', padding: 4, display: 'none' }} className="mobile-menu-btn">
          <Menu size={20} />
        </button>
      </nav>

      {/* Mobile drawer */}
      {open && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'var(--color-bg)' }}>
          <div style={{ padding: '1.25rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '0.5px solid var(--color-border)' }}>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 17, fontStyle: 'italic' }}>
              fried rice <span style={{ color: 'var(--color-accent)', fontStyle: 'normal' }}>index</span>
            </span>
            <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-2)' }}>
              <X size={20} />
            </button>
          </div>
          <div style={{ padding: '2rem' }}>
            {links.map(([l, h]) => (
              <a key={h} href={h} style={{ display: 'block', fontSize: 24, fontFamily: 'var(--font-display)', color: 'var(--color-text-1)', textDecoration: 'none', marginBottom: '1.5rem' }}>{l}</a>
            ))}
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 640px) {
          .desktop-nav { display: none !important; }
          .mobile-menu-btn { display: block !important; }
        }
      `}</style>
    </>
  )
}

export default function Home() {
  const mapRef = useRef<WorldMapHandle>(null)
  const [selected, setSelected] = useState<MapCity | null>(null)
  const [currency, setCurrency] = useState('CAD')

  const rentBurden = selected && selected.median_rent_1br_cad && selected.median_monthly_salary_cad
    ? Math.round((selected.median_rent_1br_cad / selected.median_monthly_salary_cad) * 100)
    : null

  const bowlsAfterRent = selected && selected.median_monthly_salary_cad && selected.median_rent_1br_cad && selected.price_cad
    ? Math.round((selected.median_monthly_salary_cad - selected.median_rent_1br_cad) / selected.price_cad)
    : null

  return (
    <div style={{ background: 'var(--color-bg)', color: 'var(--color-text-1)', fontFamily: 'var(--font-body)', minHeight: '100vh' }}>
      <NavBar />

      {/* ── HERO ──────────────────────────────────────────────────────────── */}
      <section style={{ paddingTop: 56 }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: 'clamp(2.5rem,5vh,4.5rem) 2rem clamp(2rem,4vh,3.5rem)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '1.25rem' }}>
            <MapPin size={13} color="var(--color-accent)" />
            <span style={{ fontSize: 11, letterSpacing: '2.5px', textTransform: 'uppercase', color: 'var(--color-text-3)' }}>
              40 cities · food-based affordability index
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1.5rem' }}>
            <div>
              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(38px, 6vw, 80px)', fontWeight: 400, lineHeight: .95, letterSpacing: -2, color: 'var(--color-text-1)', margin: '0 0 1rem' }}>
                The Fried<br />Rice Index.
              </h1>
              <p style={{ fontSize: 'clamp(14px,1.5vw,17px)', color: 'var(--color-text-2)', maxWidth: 440, lineHeight: 1.65, margin: 0 }}>
                Restaurant prices across forty cities — and what they reveal about the cost of living everywhere.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', flexShrink: 0 }}>
              <a href="/cities" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '.7rem 1.4rem', borderRadius: 8, background: 'var(--color-accent)', color: '#fff', textDecoration: 'none', fontSize: 14, fontFamily: 'var(--font-body)', fontWeight: 500 }}>
                Browse cities <ChevronRight size={15} />
              </a>
              <a href="/explore" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '.7rem 1.4rem', borderRadius: 8, border: '0.5px solid var(--color-border)', color: 'var(--color-text-2)', textDecoration: 'none', fontSize: 14, fontFamily: 'var(--font-body)' }}>
                Full map <Expand size={14} />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── MAP ───────────────────────────────────────────────────────────── */}
      <section style={{ borderTop: '0.5px solid var(--color-border)', borderBottom: '0.5px solid var(--color-border)' }}>
        {/* Map toolbar */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '0.85rem 2rem', borderBottom: '0.5px solid var(--color-border)',
          flexWrap: 'wrap', gap: '0.75rem',
        }}>
          <span style={{ fontSize: 12, color: 'var(--color-text-3)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Globe size={13} /> Click a dot to explore · scroll to zoom · names appear at 3×
          </span>
          <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
            <select
              value={currency} onChange={e => setCurrency(e.target.value)}
              style={{ padding: '5px 10px', border: '0.5px solid var(--color-border)', borderRadius: 6, background: 'var(--color-surface)', fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--color-text-2)', cursor: 'pointer' }}
            >
              {CURRENCY_OPTIONS.map(([code, sym]) => <option key={code} value={code}>{sym} {code}</option>)}
            </select>
            <button onClick={() => mapRef.current?.reset()} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 10px', background: 'none', border: '0.5px solid var(--color-border)', borderRadius: 6, cursor: 'pointer', fontSize: 12, color: 'var(--color-text-3)', fontFamily: 'var(--font-body)' }}>
              <RotateCcw size={12} /> Reset
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', position: 'relative' }}>
          {/* Map SVG */}
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <WorldMap ref={mapRef} onSelect={setSelected} selected={selected} mapH={420} />
          </div>

          {/* City panel — slides in on the right */}
          <div style={{
            width: selected ? 'clamp(280px, 30vw, 360px)' : 0,
            overflow: 'hidden',
            transition: 'width .3s cubic-bezier(.4,0,.2,1)',
            borderLeft: selected ? '0.5px solid var(--color-border)' : 'none',
            background: 'var(--color-surface)',
            flexShrink: 0,
          }}>
            {selected && (
              <div style={{ width: 'clamp(280px, 30vw, 360px)', padding: '1.5rem', overflowY: 'auto', maxHeight: 420 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
                  <div>
                    <div style={{ fontSize: 28, marginBottom: 4 }}>{selected.flag ?? '🌍'}</div>
                    <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 26, letterSpacing: -.5, margin: 0, color: 'var(--color-text-1)' }}>{selected.city}</h2>
                    <p style={{ fontSize: 12, color: 'var(--color-text-3)', margin: '3px 0 0' }}>
                      {[selected.region, selected.country].filter(Boolean).join(', ')}
                    </p>
                  </div>
                  <button onClick={() => setSelected(null)} style={{ background: 'none', border: '0.5px solid var(--color-border)', borderRadius: 6, padding: '5px 8px', cursor: 'pointer', color: 'var(--color-text-3)' }}>
                    <X size={13} />
                  </button>
                </div>

                <div style={{ borderTop: '0.5px solid var(--color-border)', paddingTop: '1rem', marginBottom: '1rem' }}>
                  <p style={{ fontSize: 10, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--color-text-3)', margin: '0 0 4px' }}>Baseline price</p>
                  <p style={{ fontFamily: 'var(--font-display)', fontSize: 36, color: 'var(--color-accent)', margin: 0, lineHeight: 1 }}>
                    {cvt(selected.price_cad, currency)}
                  </p>
                </div>

                {(rentBurden !== null || bowlsAfterRent !== null) && (
                  <div style={{ display: 'flex', gap: '0.6rem', marginBottom: '1rem' }}>
                    {bowlsAfterRent !== null && (
                      <div style={{ flex: 1, background: 'var(--color-bg)', border: '0.5px solid var(--color-border)', borderRadius: 8, padding: '0.75rem' }}>
                        <p style={{ fontSize: 9, letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--color-text-3)', margin: '0 0 4px' }}>After rent</p>
                        <p style={{ fontFamily: 'var(--font-display)', fontSize: 22, color: '#3db870', margin: 0 }}>{bowlsAfterRent} 🍚</p>
                        <p style={{ fontSize: 10, color: 'var(--color-text-3)', margin: '2px 0 0' }}>bowls / month</p>
                      </div>
                    )}
                    {rentBurden !== null && (
                      <div style={{ flex: 1, background: 'var(--color-bg)', border: '0.5px solid var(--color-border)', borderRadius: 8, padding: '0.75rem' }}>
                        <p style={{ fontSize: 9, letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--color-text-3)', margin: '0 0 4px' }}>Rent burden</p>
                        <p style={{ fontFamily: 'var(--font-display)', fontSize: 22, color: rentBurden > 70 ? '#c0392b' : rentBurden > 50 ? '#c4890f' : '#3db870', margin: 0 }}>{rentBurden}%</p>
                        <p style={{ fontSize: 10, color: 'var(--color-text-3)', margin: '2px 0 0' }}>of median salary</p>
                      </div>
                    )}
                  </div>
                )}

                {selected.blurb && (
                  <p style={{ fontSize: 12, color: 'var(--color-text-2)', lineHeight: 1.65, margin: '0 0 1rem' }}>{selected.blurb}</p>
                )}

                <a href={`/cities/${selected.city.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}`}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 13, color: 'var(--color-accent)', textDecoration: 'none', borderBottom: '0.5px solid var(--color-accent)', paddingBottom: 2 }}>
                  Full profile <ExternalLink size={12} />
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Legend */}
        <div style={{ padding: '0.85rem 2rem', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', borderTop: '0.5px solid var(--color-border)' }}>
          <span style={{ fontSize: 10, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--color-text-3)' }}>Baseline price</span>
          {LEGEND.map(t => (
            <div key={t.color} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: t.color }} />
              <span style={{ fontSize: 11, color: 'var(--color-text-3)' }}>{t.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── STATS STRIP ───────────────────────────────────────────────────── */}
      <section style={{ borderBottom: '0.5px solid var(--color-border)' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
          {[
            { icon: <Globe size={16} color="var(--color-accent)" />, val: '40',    sub: 'cities indexed' },
            { icon: <TrendingDown size={16} color="#3db870" />,      val: 'CA$1.80', sub: 'cheapest baseline' },
            { icon: <TrendingUp size={16} color="#c0392b" />,        val: 'CA$20.68', sub: 'most expensive' },
            { icon: <BarChart2 size={16} color="var(--color-accent)" />, val: '11.5×', sub: 'price spread' },
          ].map((s, i, arr) => (
            <div key={s.sub} style={{ padding: '1.5rem 2rem', display: 'flex', alignItems: 'center', gap: '1rem', borderRight: i < arr.length - 1 ? '0.5px solid var(--color-border)' : 'none' }}>
              {s.icon}
              <div>
                <p style={{ fontFamily: 'var(--font-display)', fontSize: 24, color: 'var(--color-text-1)', margin: 0, lineHeight: 1 }}>{s.val}</p>
                <p style={{ fontSize: 11, color: 'var(--color-text-3)', margin: '3px 0 0' }}>{s.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── WHAT WE MEASURE ───────────────────────────────────────────────── */}
      <section style={{ maxWidth: 1280, margin: '0 auto', padding: 'clamp(3rem,6vh,5rem) 2rem' }}>
        <p style={{ fontSize: 11, letterSpacing: '2.5px', textTransform: 'uppercase', color: 'var(--color-text-3)', marginBottom: '2.5rem', display: 'flex', alignItems: 'center', gap: 6 }}>
          <BarChart2 size={13} /> What the index tracks
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1px', border: '0.5px solid var(--color-border)', borderRadius: 12, overflow: 'hidden' }}>
          {[
            { label: 'Baseline price',  body: "What you'd pay at a regular local restaurant. Not a tourist trap — just the going rate.", num: '01' },
            { label: 'Rent burden',      body: "How much of the average paycheck goes straight to rent before you've spent a dollar on food.", num: '02' },
            { label: 'Bowls after rent', body: "Once rent is paid, how many bowls can you actually afford? More honest than any aggregate index.", num: '03' },
          ].map(c => (
            <div key={c.label} style={{ padding: '2rem', background: 'var(--color-surface)' }}>
              <p style={{ fontSize: 11, color: 'var(--color-text-3)', margin: '0 0 1.25rem' }}>{c.num}</p>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 20, color: 'var(--color-text-1)', margin: '0 0 0.75rem', fontWeight: 400 }}>{c.label}</h3>
              <p style={{ fontSize: 13, color: 'var(--color-text-2)', lineHeight: 1.75, margin: 0 }}>{c.body}</p>
            </div>
          ))}
        </div>
      </section>

    </div>
  )
}
