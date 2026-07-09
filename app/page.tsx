'use client'

import { useEffect, useRef, useState, useMemo, type CSSProperties } from 'react'
import NavBar from './components/NavBar'
import { supabase } from '@/lib/supabase'
import * as d3 from 'd3'

/* ═══════════════════════════════════════════════════════════════════
   Types & helpers
   ═══════════════════════════════════════════════════════════════════ */
type CityRow = {
  city: string
  country: string | null
  region:  string | null
  flag:    string | null
  price_cad: number
  latitude:  number | null
  longitude: number | null
  median_rent_1br_cad:      number | null
  median_monthly_salary_cad: number | null
  tech_salary_cad:          number | null
  blurb: string | null
  price_source:             string | null
  rentBurden?:    number | null
  bowlsAfterRent?: number | null // renamed to plates left
}

type Tip = { city: string; province: string; price: number; burden: number | null; plates: number | null; x: number; y: number }

const colorFor = (p: number) => p < 9.5 ? 'var(--color-green)' : p < 12.5 ? 'var(--color-text-2)' : 'var(--color-accent)'
const fmt = (n: number) => `CA$${n.toFixed(2)}`

function getNetDisposable(monthlyGross: number, monthlyRent: number, prov: string | null): number {
  const annualGross = monthlyGross * 12
  let baseRate = 0.15
  const p = prov?.toUpperCase() || ''
  if (p === 'QC') baseRate = 0.205
  else if (p === 'ON') baseRate = 0.150
  else if (p === 'BC') baseRate = 0.135
  else if (p === 'AB') baseRate = 0.140
  else if (['NS', 'NB', 'PE', 'NL'].includes(p)) baseRate = 0.180
  else if (['MB', 'SK'].includes(p)) baseRate = 0.165
  else if (['YT', 'NT', 'NU'].includes(p)) baseRate = 0.125
  else baseRate = 0.150

  const progressiveRate = baseRate + (annualGross - 42600) * 0.000002
  const finalRate = Math.max(0.08, Math.min(0.38, progressiveRate))
  
  const netIncome = monthlyGross * (1 - finalRate)
  return Math.round(netIncome - monthlyRent)
}

const PROVINCE_NAMES: Record<string, string> = {
  ON: 'Ontario',
  BC: 'British Columbia',
  QC: 'Quebec',
  AB: 'Alberta',
  MB: 'Manitoba',
  SK: 'Saskatchewan',
  NS: 'Nova Scotia',
  NB: 'New Brunswick',
  NL: 'Newfoundland & Labrador',
  PE: 'Prince Edward Island',
  YT: 'Yukon',
  NT: 'Northwest Territories',
  NU: 'Nunavut'
}

/* ═══════════════════════════════════════════════════════════════════
   Style constants
   ═══════════════════════════════════════════════════════════════════ */
const WRAP: CSSProperties  = { maxWidth: 1280, margin: '0 auto', padding: '0 32px' }
const MONO: CSSProperties  = { fontFamily: "var(--font-mono)", fontSize: 11.5, letterSpacing: '0.05em' }
const LABEL: CSSProperties = { fontSize: 11, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--color-text-3)', fontWeight: 600 }
const SEC: CSSProperties   = { padding: '100px 0' }
const CARD: CSSProperties  = { border: '1px solid var(--color-border)', borderRadius: 18, background: 'var(--color-surface)', overflow: 'hidden' }
const BTN_GOLD: CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 10,
  fontFamily: 'var(--font-body)', fontSize: 13.5, letterSpacing: '.01em',
  padding: '13px 26px', borderRadius: 8, border: 'none',
  background: 'var(--color-accent)', color: '#fff', textDecoration: 'none', transition: '.2s',
  fontWeight: 600,
  cursor: 'pointer'
}
const BTN_GHOST: CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 10,
  fontFamily: 'var(--font-body)', fontSize: 13.5, letterSpacing: '.01em',
  padding: '13px 26px', borderRadius: 8, border: '1px solid var(--color-border)',
  color: 'var(--color-text-1)', textDecoration: 'none', transition: '.2s',
  cursor: 'pointer',
  fontWeight: 600,
  background: 'rgba(255,255,255,0.02)'
}

function CanPolIllustration() {
  return (
    <svg width="100%" height="280" viewBox="0 0 320 280" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="mapleShadow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="8" stdDeviation="6" floodColor="#000" floodOpacity="0.15" />
        </filter>
      </defs>
      <g filter="url(#mapleShadow)">
        <circle cx="160" cy="140" r="100" fill="var(--color-surface-2)" stroke="var(--color-border)" strokeWidth="1" />
        {/* Large Stylized Maple Leaf */}
        <path d="M 160 70 L 168 102 L 195 95 L 185 122 L 210 132 L 188 148 L 195 175 L 168 165 L 160 195 L 152 165 L 125 175 L 132 148 L 110 132 L 135 122 L 125 95 L 152 102 Z" fill="var(--color-accent)"/>
        {/* Stem */}
        <rect x="157" y="193" width="6" height="25" rx="2" fill="var(--color-accent)" />
      </g>
    </svg>
  )
}

function CanPolMark({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="11" stroke="var(--color-border)" strokeWidth="0.8" fill="var(--color-surface)"/>
      <path d="M 12 5 L 12.8 8.2 L 15.5 7.5 L 14.5 10.2 L 17 11.2 L 14.8 12.8 L 15.5 15.5 L 12.8 14.5 L 12 17.5 L 11.2 14.5 L 8.5 15.5 L 9.2 12.8 L 7 11.2 L 9.5 10.2 L 8.5 7.5 L 11.2 8.2 Z" fill="var(--color-accent)"/>
    </svg>
  )
}

export default function Home() {
  const [cities, setCities]   = useState<CityRow[]>([])
  const [tip, setTip]         = useState<Tip | null>(null)
  const [sel, setSel]         = useState<CityRow | null>(null)
  const [boardIn, setBoardIn] = useState(false)
  const [profile, setProfile] = useState<'single_renter' | 'family_homeowner'>('single_renter')

  const specRef  = useRef<SVGSVGElement>(null)
  const scatRef  = useRef<SVGSVGElement>(null)
  const boardRef = useRef<HTMLDivElement>(null)

  /* ── Fetch cities ──────────────────────────────────────────────── */
  useEffect(() => {
    supabase
      .from('cities')
      .select('city,country,region,flag,price_cad,latitude,longitude,median_rent_1br_cad,median_monthly_salary_cad,tech_salary_cad,blurb,median_rent_local,price_source')
      .order('city', { ascending: true })
      .then(({ data }) => {
        if (!data) return
        setCities((data ?? []) as CityRow[])
      })
  }, [])

  const parsedCities = useMemo(() => {
    return cities.map(c => {
      const isSingle = profile === 'single_renter'
      const rent = isSingle
        ? (c.median_rent_1br_cad != null ? Number(c.median_rent_1br_cad) : null)
        : (c.median_rent_1br_cad != null ? Number(c.median_rent_1br_cad) * 1.65 : null)
      const salary = isSingle
        ? (c.median_monthly_salary_cad != null ? Number(c.median_monthly_salary_cad) : null)
        : (c.tech_salary_cad != null ? Number(c.tech_salary_cad) : c.median_monthly_salary_cad != null ? Number(c.median_monthly_salary_cad) * 1.5 : null)

      return {
        ...c,
        price_cad: c.price_cad ? Number(c.price_cad) : 0,
        median_rent_1br_cad: rent,
        median_monthly_salary_cad: salary,
        rentBurden: rent && salary ? Math.round(rent / salary * 100) : null,
        bowlsAfterRent: rent && salary ? getNetDisposable(salary, rent, c.region) : null,
      }
    })
  }, [cities, profile])

  /* ── Scatter plot ──────────────────────────────────────────────── */
  useEffect(() => {
    const svg = scatRef.current
    if (!svg || !parsedCities.length) return
    const data = parsedCities.filter(c => c.rentBurden != null && c.bowlsAfterRent != null) as (CityRow & { rentBurden: number; bowlsAfterRent: number })[]
    if (!data.length) return
    const NOTABLE = [
      'Spadina-Fort York', 'Vancouver Centre', 'Laurier-Sainte-Marie', 'Calgary Centre', 
      'Edmonton Centre', 'Halifax', 'Winnipeg Centre', 'Nunavut', 'Northwest Territories', 
      'Fort McMurray-Cold Lake', 'Sherbrooke'
    ]
    
    const draw = () => {
      svg.innerHTML = ''
      const W = svg.clientWidth || 1100, H = 450, m = { t: 30, r: 30, b: 50, l: 60 }
      svg.setAttribute('viewBox', `0 0 ${W} ${H}`)
      
      const bVals = data.map(c => c.rentBurden), yVals = data.map(c => c.bowlsAfterRent)
      const bmin = Math.min(...bVals), bmax = Math.max(...bVals)
      const ymin = Math.min(0, ...yVals), ymax = Math.max(...yVals)
      const xS = (v: number) => m.l + (v - bmin) / (bmax - bmin) * (W - m.l - m.r)
      const yS = (v: number) => H - m.b - (v - ymin) / (ymax - ymin) * (H - m.t - m.b)

      // X grid
      const step = 5
      for (let v = Math.ceil(bmin / step) * step; v <= bmax; v += step) {
        svg.appendChild(d3.create('svg:line')
          .attr('x1', xS(v)).attr('x2', xS(v)).attr('y1', m.t).attr('y2', H - m.b)
          .attr('stroke', 'var(--color-border)').attr('stroke-dasharray', '1 4').node()!)
        const t = d3.create('svg:text')
          .attr('x', xS(v)).attr('y', H - m.b + 18).attr('text-anchor', 'middle')
          .attr('font-family', 'var(--font-mono)').attr('font-size', '9.5')
          .attr('fill', 'var(--color-text-3)').text(v + '%').node()!
        svg.appendChild(t)
      }

      // Y grid
      const yStep = 1000
      for (let v = Math.ceil(ymin / yStep) * yStep; v <= ymax; v += yStep) {
        svg.appendChild(d3.create('svg:line')
          .attr('x1', m.l).attr('x2', W - m.r).attr('y1', yS(v)).attr('y2', yS(v))
          .attr('stroke', 'var(--color-border)').attr('stroke-dasharray', '1 4').node()!)
        const t = d3.create('svg:text')
          .attr('x', m.l - 10).attr('y', yS(v) + 3).attr('text-anchor', 'end')
          .attr('font-family', 'var(--font-mono)').attr('font-size', '9.5')
          .attr('fill', 'var(--color-text-3)').text('$' + v.toLocaleString()).node()!
        svg.appendChild(t)
      }

      // X/Y Titles
      const xt = d3.create('svg:text')
        .attr('x', (m.l + W - m.r) / 2).attr('y', H - 10).attr('text-anchor', 'middle')
        .attr('font-family', 'var(--font-body)').attr('font-size', '10')
        .attr('fill', 'var(--color-text-2)').attr('letter-spacing', '1').attr('font-weight', 600)
        .text('HOUSING RENT BURDEN (% OF LOCAL MEDIAN INCOME)').node()!
      svg.appendChild(xt)

      const yt = d3.create('svg:text')
        .attr('transform', `translate(14 ${(m.t + H - m.b) / 2}) rotate(-90)`).attr('text-anchor', 'middle')
        .attr('font-family', 'var(--font-body)').attr('font-size', '10')
        .attr('fill', 'var(--color-text-2)').attr('letter-spacing', '1').attr('font-weight', 600)
        .text('DISPOSABLE MONTHLY INCOME AFTER HOUSING COST (CAD)').node()!
      svg.appendChild(yt)

      // Plot data points
      data.forEach((c) => {
        const gx = xS(c.rentBurden), gy = yS(c.bowlsAfterRent)
        const rs = 6 

        const g = d3.create('svg:g')
          .attr('class', 'grain')
          .attr('transform', `translate(${gx},${gy})`)
          .on('click', () => setSel(c))
          .on('mousemove', (ev) => {
            setTip({
              city: c.city,
              province: c.region ?? '',
              price: c.price_cad,
              burden: c.rentBurden,
              plates: c.bowlsAfterRent,
              x: ev.clientX,
              y: ev.clientY
            })
          })
          .on('mouseleave', () => setTip(null))

        const party = c.price_source?.toLowerCase() || ''
        let fill = 'rgba(128,128,128,0.7)'
        if (party.includes('liberal')) fill = 'rgba(229, 57, 53, 0.75)'
        else if (party.includes('conservative')) fill = 'rgba(13, 71, 161, 0.75)'
        else if (party.includes('ndp')) fill = 'rgba(255, 152, 0, 0.75)'
        else if (party.includes('bloc')) fill = 'rgba(41, 182, 246, 0.75)'
        else if (party.includes('green')) fill = 'rgba(76, 175, 80, 0.75)'
        else if (party.includes('independent')) fill = 'rgba(255, 255, 255, 0.75)'

        g.append('circle')
          .attr('r', rs)
          .attr('fill', fill)
          .attr('opacity', 0.95)
          .attr('stroke', 'var(--color-border)')
          .attr('stroke-width', 0.8)

        svg.appendChild(g.node()!)

        if (NOTABLE.includes(c.city)) {
          const t = d3.create('svg:text')
            .attr('x', gx + rs + 6).attr('y', gy + 3)
            .attr('font-family', 'var(--font-mono)').attr('font-size', '9')
            .attr('fill', 'var(--color-text-3)').attr('letter-spacing', '0.5')
            .text(c.city.toUpperCase()).node()!
          svg.appendChild(t)
        }
      })
    }

    draw()
    const ro = new ResizeObserver(() => draw())
    ro.observe(svg)
    return () => ro.disconnect()
  }, [parsedCities])

  /* ── Leaderboard Intersection ─────────────────────────────────── */
  useEffect(() => {
    const el = boardRef.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setBoardIn(true); io.disconnect() } }, { threshold: 0.1 })
    io.observe(el)
    return () => io.disconnect()
  }, [parsedCities])

  /* ── Escape key closes sidebar ───────────────────────────────── */
  useEffect(() => {
    if (!sel) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setSel(null) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [sel])

  /* ── Stats Calculations ────────────────────────────────────────── */
  const rents    = parsedCities.map(c => c.median_rent_1br_cad).filter((r): r is number => r != null && r > 0).sort((a, b) => a - b)
  const rmin     = rents[0] ?? 1050
  const rmax     = rents[rents.length - 1] ?? 2800
  const burdens  = parsedCities.map(c => c.rentBurden).filter((b): b is number => b !== null)
  const avgBurden = burdens.length ? Math.round(burdens.reduce((sum, b) => sum + b, 0) / burdens.length) : 41
  const spread   = rents.length >= 2 ? rmax / rmin : 2.4
  const maxPlates = parsedCities.reduce((m, c) => Math.max(m, c.bowlsAfterRent ?? 0), 0)
  const cheapTop = [...parsedCities].sort((a,b) => (a.rentBurden ?? 0) - (b.rentBurden ?? 0)).slice(0, 8)
  const priceTop = [...parsedCities].sort((a,b) => (b.rentBurden ?? 0) - (a.rentBurden ?? 0)).slice(0, 8)

  return (
    <div style={{ background: 'var(--color-bg)', color: 'var(--color-text-1)', fontFamily: "var(--font-body)", overflowX: 'hidden', WebkitFontSmoothing: 'antialiased' }}>
      <style>{`
        .grain { cursor: pointer; }
        .grain circle { transform-box: fill-box; transform-origin: center; transition: transform .25s cubic-bezier(.2,.8,.2,1); }
        .grain:hover circle { transform: scale(1.4) !important; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes drawerIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
        .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); }
        h1, h2, h3, .heading-display { fontFamily: var(--font-display); }
        @media(max-width: 900px) {
          .stats-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .board-grid { grid-template-columns: 1fr !important; }
          .metrics-grid { grid-template-columns: 1fr !important; }
          .method-grid { grid-template-columns: 1fr !important; gap: 40px !important; }
        }
      `}</style>

      <NavBar fixed />

      {/* HERO SECTION */}
      <header style={{ paddingTop: 110 }}>
        <div style={WRAP}>
          <div style={{ display: 'flex', gap: 40, alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 540px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 30 }}>
                <div style={{ width: 40, height: 1, background: 'var(--color-border)' }} />
                <span style={LABEL}>Canada Edition · Cost of Living & Socio-Economic Index</span>
              </div>

              <h1 style={{ fontSize: 'clamp(38px, 5.2vw, 76px)', lineHeight: 1.05, letterSpacing: '-.025em', fontWeight: 200, maxWidth: '20ch', margin: '0 0 28px' }}>
                Pure cost of living data across <strong style={{ fontWeight: 500, color: 'var(--color-accent)' }}>Canadian ridings.</strong>
              </h1>

              <p style={{ maxWidth: '56ch', color: 'var(--color-text-2)', fontSize: 16.5, fontWeight: 300, lineHeight: 1.65, margin: '0 0 40px' }}>
                Median 1BR housing rents span from <strong style={{ color: 'var(--color-text-1)', fontWeight: 600 }}>{fmt(rmin)}/mo</strong> to{' '}
                <strong style={{ color: 'var(--color-text-1)', fontWeight: 600 }}>{fmt(rmax)}/mo</strong> across ridings.
                The index evaluates local housing burdens relative to regional median household income.
              </p>

              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 28 }}>
                <a href="/cities" style={BTN_GOLD}>Browse Ridings</a>
                <a href="/explore" style={BTN_GHOST}>Interactive Map</a>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-start' }}>
                <span style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--color-text-3)' }}>Living Profile</span>
                <div style={{ display: 'inline-flex', background: 'var(--color-surface-2)', padding: 3, borderRadius: 10, border: '0.5px solid var(--color-border)' }}>
                  <button
                    onClick={() => setProfile('single_renter')}
                    style={{
                      border: 'none', background: profile === 'single_renter' ? 'var(--color-surface)' : 'none',
                      color: profile === 'single_renter' ? 'var(--color-text-1)' : 'var(--color-text-3)',
                      padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 500, cursor: 'pointer',
                      boxShadow: profile === 'single_renter' ? '0 2px 8px rgba(0,0,0,0.05)' : 'none',
                      transition: 'all 0.2s', fontFamily: 'var(--font-body)'
                    }}
                  >
                    Single Renter (1BR)
                  </button>
                  <button
                    onClick={() => setProfile('family_homeowner')}
                    style={{
                      border: 'none', background: profile === 'family_homeowner' ? 'var(--color-surface)' : 'none',
                      color: profile === 'family_homeowner' ? 'var(--color-text-1)' : 'var(--color-text-3)',
                      padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 500, cursor: 'pointer',
                      boxShadow: profile === 'family_homeowner' ? '0 2px 8px rgba(0,0,0,0.05)' : 'none',
                      transition: 'all 0.2s', fontFamily: 'var(--font-body)'
                    }}
                  >
                    Family Homeowner
                  </button>
                </div>
              </div>
            </div>

            {/* Themed Map Illustration */}
            <div style={{ flex: '1 1 320px', maxWidth: 360, display: 'flex', justifyContent: 'center' }} className="hero-graphic">
              <CanPolIllustration />
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div style={{ ...WRAP, borderBottom: '1px solid var(--color-border)' }}>
          <div className="stats-grid">
            {[
              { prefix: '', val: cities.length, dec: 0, suffix: '', label: 'Ridings Indexed' },
              { prefix: 'CA$', val: rmin, dec: 0, suffix: '/mo', label: 'Lowest 1BR Rent' },
              { prefix: 'CA$', val: rmax, dec: 0, suffix: '/mo', label: 'Highest 1BR Rent' },
              { prefix: '', val: avgBurden, dec: 0, suffix: '%', label: 'Average Rent Burden' },
            ].map((s, i) => (
              <div key={s.label} style={{ padding: '36px 20px', borderLeft: i > 0 ? '1px solid var(--color-border)' : 'none', paddingLeft: i === 0 ? 0 : 20 }}>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 400, fontSize: 'clamp(28px, 3vw, 42px)', letterSpacing: '-.02em', fontVariantNumeric: 'tabular-nums' }}>
                  {s.prefix && <span style={{ fontSize: '.45em', color: 'var(--color-text-3)', fontWeight: 300, verticalAlign: '.4em', marginRight: 2 }}>{s.prefix}</span>}
                  {s.val.toFixed(s.dec)}
                  {s.suffix && <span style={{ fontSize: '.45em', color: 'var(--color-text-3)', fontWeight: 300, verticalAlign: '.4em', marginLeft: 2 }}>{s.suffix}</span>}
                </div>
                <div style={{ ...LABEL, marginTop: 8 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </header>

      {/* THE SPECTRUM */}
      <section style={SEC} id="spectrum">
        <div style={WRAP}>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 40, marginBottom: 50, flexWrap: 'wrap' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 12 }}>
                <div style={{ width: 32, height: 1, background: 'var(--color-border)' }} />
                <span style={LABEL}>The Housing Axis</span>
              </div>
              <h2 style={{ fontSize: 'clamp(26px, 3.4vw, 46px)', letterSpacing: '-.02em', lineHeight: 1.1, fontWeight: 200, maxWidth: '22ch', margin: 0 }}>
                Rent Spectrum. <strong style={{ fontWeight: 500, color: 'var(--color-accent)' }}>Standard 1BR.</strong>
              </h2>
            </div>
            <p style={{ maxWidth: '44ch', color: 'var(--color-text-2)', fontWeight: 300, fontSize: 14.5 }}>
              Every federal riding laid out relative to their median monthly rent, revealing local housing pressures.
            </p>
          </div>
          <div style={{ ...CARD, padding: '36px 30px 24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 14, borderBottom: '1px solid var(--color-border)', marginBottom: 10 }}>
              <span style={LABEL}>Lowest: {fmt(rmin)}/mo (Sherbrooke)</span>
              <span style={LABEL}>Highest: {fmt(rmax)}/mo (Iqaluit / Toronto)</span>
            </div>
            <div style={{ position: 'relative', height: 12, borderRadius: 6, background: 'linear-gradient(90deg, var(--color-green), var(--color-text-2) 50%, var(--color-accent))' }}>
              <div style={{ position: 'absolute', top: '-6px', left: '10%', width: 24, height: 24, borderRadius: '50%', background: 'var(--color-surface)', border: '2px solid var(--color-green)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 600 }}>QC</div>
              <div style={{ position: 'absolute', top: '-6px', left: '50%', width: 24, height: 24, borderRadius: '50%', background: 'var(--color-surface)', border: '2px solid var(--color-text-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 600 }}>AB</div>
              <div style={{ position: 'absolute', top: '-6px', left: '90%', width: 24, height: 24, borderRadius: '50%', background: 'var(--color-surface)', border: '2px solid var(--color-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 600 }}>ON</div>
            </div>
          </div>
        </div>
      </section>

      {/* METRICS INFORMATION */}
      <section style={{ ...SEC, paddingTop: 0 }} id="tracks">
        <div style={WRAP}>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 40, marginBottom: 50, flexWrap: 'wrap' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 12 }}>
                <div style={{ width: 32, height: 1, background: 'var(--color-border)' }} />
                <span style={LABEL}>Metrics Guide</span>
              </div>
              <h2 style={{ fontSize: 'clamp(26px, 3.4vw, 46px)', letterSpacing: '-.02em', lineHeight: 1.1, fontWeight: 200, maxWidth: '22ch', margin: 0 }}>
                Dissecting local <strong style={{ fontWeight: 500, color: 'var(--color-accent)' }}>discretionary income.</strong>
              </h2>
            </div>
            <p style={{ maxWidth: '44ch', color: 'var(--color-text-2)', fontWeight: 300, fontSize: 14.5 }}>
              National indicators average away regional differences. We zoom into local neighborhoods to see what money really buys.
            </p>
          </div>

          <div className="metrics-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 1, background: 'var(--color-border)', border: '1px solid var(--color-border)', borderRadius: 18, overflow: 'hidden' }}>
            {/* Metric 1 */}
            <div style={{ background: 'var(--color-surface)', padding: '36px 30px', position: 'relative' }}>
              <span style={{ ...LABEL, position: 'absolute', top: 24, right: 24, color: 'var(--color-text-3)' }}>M·01</span>
              <div style={{ height: 100, marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: 36, color: 'var(--color-green)' }}>CA$3,550</span>
              </div>
              <h3 style={{ fontSize: 20, marginBottom: 10, fontWeight: 500 }}>Median Monthly Income</h3>
              <p style={{ color: 'var(--color-text-2)', fontSize: 14, fontWeight: 300, lineHeight: 1.6 }}>The real national median monthly individual income in Canada, updated to reflect current Statistics Canada benchmarks.</p>
            </div>

            {/* Metric 2 */}
            <div style={{ background: 'var(--color-surface)', padding: '36px 30px', position: 'relative' }}>
              <span style={{ ...LABEL, position: 'absolute', top: 24, right: 24, color: 'var(--color-text-3)' }}>M·02</span>
              <div style={{ height: 100, marginBottom: 20 }}>
                <svg viewBox="0 0 280 100" width="100%" height="100%">
                  {/* Semi-circle gauge */}
                  <g transform="translate(140, 88)">
                    <path d="M -70 0 A 70 70 0 0 1 70 0" fill="none" stroke="var(--color-border)" strokeWidth="8" strokeLinecap="round"/>
                    <path d="M -70 0 A 70 70 0 0 1 38 -59" fill="none" stroke="var(--color-accent)" strokeWidth="8" strokeLinecap="round"/>
                    <text x="0" y="-24" fontFamily="var(--font-display)" fontWeight="400" fontSize="28" fill="var(--color-text-1)" textAnchor="middle">34%</text>
                    <text x="0" y="-8" fontFamily="var(--font-mono)" fontSize="7.5" fill="var(--color-accent)" textAnchor="middle" letterSpacing="1">AVERAGE BURDEN</text>
                  </g>
                </svg>
              </div>
              <h3 style={{ fontSize: 20, marginBottom: 10, fontWeight: 500 }}>Rent Burden</h3>
              <p style={{ color: 'var(--color-text-2)', fontSize: 14, fontWeight: 300, lineHeight: 1.6 }}>The true national average household rent burden is 33–35%. For single individuals renting a standard 1BR unit, this burden escalates significantly.</p>
            </div>

            {/* Metric 3 */}
            <div style={{ background: 'var(--color-surface)', padding: '36px 30px', position: 'relative' }}>
              <span style={{ ...LABEL, position: 'absolute', top: 24, right: 24, color: 'var(--color-text-3)' }}>M·03</span>
              <div style={{ height: 100, marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: 36, color: 'var(--color-text-1)' }}>CA$1,626</span>
              </div>
              <h3 style={{ fontSize: 20, marginBottom: 10, fontWeight: 500 }}>Disposable Income</h3>
              <p style={{ color: 'var(--color-text-2)', fontSize: 14, fontWeight: 300, lineHeight: 1.6 }}>Net income remaining after 1BR housing costs and progressive provincial + federal taxes are subtracted from the riding's actual local median paycheck. The CA$1,626 represents the resulting national baseline average.</p>
            </div>
          </div>
        </div>
      </section>

      {/* LEADERBOARDS */}
      <section style={{ ...SEC, paddingTop: 0 }} id="board">
        <div style={WRAP}>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 40, marginBottom: 50, flexWrap: 'wrap' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 12 }}>
                <div style={{ width: 32, height: 1, background: 'var(--color-border)' }} />
                <span style={LABEL}>The Standings</span>
              </div>
              <h2 style={{ fontSize: 'clamp(26px, 3.4vw, 46px)', letterSpacing: '-.02em', lineHeight: 1.1, fontWeight: 200, maxWidth: '22ch', margin: 0 }}>
                Rent Burden. <strong style={{ fontWeight: 500, color: 'var(--color-accent)' }}>Lowest vs. Highest.</strong>
              </h2>
            </div>
            <p style={{ maxWidth: '44ch', color: 'var(--color-text-2)', fontWeight: 300, fontSize: 14.5 }}>
              Comparing housing rent burden (1BR rent / median wage) across Canadian electoral ridings.
            </p>
          </div>

          <div ref={boardRef} className="board-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, background: 'var(--color-border)', border: '1px solid var(--color-border)', borderRadius: 18, overflow: 'hidden' }}>
            {/* Cheapest */}
            <div style={{ background: 'var(--color-surface)', padding: '36px 30px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--color-green)' }} />
                <span style={{ ...LABEL, color: 'var(--color-text-1)' }}>Lowest Rent Burden %</span>
              </div>
              {cheapTop.map((c, i) => (
                <div key={c.city} style={{ display: 'grid', gridTemplateColumns: '30px 1fr auto', alignItems: 'center', gap: 16, padding: '12px 0', borderBottom: i < cheapTop.length - 1 ? '1px solid var(--color-border)' : 'none' }}>
                  <span style={{ ...MONO, fontSize: 10, color: 'var(--color-text-3)' }}>{String(i + 1).padStart(2, '0')}</span>
                  <span style={{ fontSize: 14.5, fontWeight: 500 }}>
                    {c.city}, {c.region}
                    <small style={{ display: 'block', fontSize: 11, color: 'var(--color-text-3)', fontWeight: 400, marginTop: 2 }}>
                      {c.bowlsAfterRent != null ? (c.bowlsAfterRent < 0 ? `CA$${Math.abs(c.bowlsAfterRent).toLocaleString()} shortfall after rent` : `CA$${c.bowlsAfterRent.toLocaleString()} disposable after rent`) : ''}
                    </small>
                  </span>
                  <span style={{ position: 'relative', height: 20, width: 'min(34vw,250px)', display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                    <span style={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)', height: 2, background: 'var(--color-green)', width: boardIn ? `${(c.rentBurden ?? 0)}%` : '0%', transition: `width 1.2s cubic-bezier(.2,.8,.2,1) ${i * 50}ms` }} />
                    <span style={{ position: 'relative', ...MONO, fontSize: 12, background: 'var(--color-surface)', paddingLeft: 8 }}>{c.rentBurden}%</span>
                  </span>
                </div>
              ))}
            </div>

            {/* Priciest */}
            <div style={{ background: 'var(--color-surface)', padding: '36px 30px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--color-accent)' }} />
                <span style={{ ...LABEL, color: 'var(--color-text-1)' }}>Highest Rent Burden %</span>
              </div>
              {priceTop.map((c, i) => (
                <div key={c.city} style={{ display: 'grid', gridTemplateColumns: '30px 1fr auto', alignItems: 'center', gap: 16, padding: '12px 0', borderBottom: i < priceTop.length - 1 ? '1px solid var(--color-border)' : 'none' }}>
                  <span style={{ ...MONO, fontSize: 10, color: 'var(--color-text-3)' }}>{String(i + 1).padStart(2, '0')}</span>
                  <span style={{ fontSize: 14.5, fontWeight: 500 }}>
                    {c.city}, {c.region}
                    <small style={{ display: 'block', fontSize: 11, color: 'var(--color-text-3)', fontWeight: 400, marginTop: 2 }}>
                      {c.bowlsAfterRent != null ? (c.bowlsAfterRent < 0 ? `CA$${Math.abs(c.bowlsAfterRent).toLocaleString()} shortfall after rent` : `CA$${c.bowlsAfterRent.toLocaleString()} disposable after rent`) : ''}
                    </small>
                  </span>
                  <span style={{ position: 'relative', height: 20, width: 'min(34vw,250px)', display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                    <span style={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)', height: 2, background: 'var(--color-accent)', width: boardIn ? `${(c.rentBurden ?? 0)}%` : '0%', transition: `width 1.2s cubic-bezier(.2,.8,.2,1) ${i * 50}ms` }} />
                    <span style={{ position: 'relative', ...MONO, fontSize: 12, background: 'var(--color-surface)', paddingLeft: 8 }}>{c.rentBurden}%</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* SCATTER PLOT */}
      <section style={{ ...SEC, paddingTop: 0 }} id="scatter">
        <div style={WRAP}>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 40, marginBottom: 50, flexWrap: 'wrap' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 12 }}>
                <div style={{ width: 32, height: 1, background: 'var(--color-border)' }} />
                <span style={LABEL}>The Affordability Map</span>
              </div>
              <h2 style={{ fontSize: 'clamp(26px, 3.4vw, 46px)', letterSpacing: '-.02em', lineHeight: 1.1, fontWeight: 200, maxWidth: '22ch', margin: 0 }}>
                Rent burden <strong style={{ fontWeight: 500, color: 'var(--color-accent)' }}>vs. disposable income.</strong>
              </h2>
            </div>
            <p style={{ maxWidth: '44ch', color: 'var(--color-text-2)', fontWeight: 300, fontSize: 14.5 }}>
              Visualizing local purchasing power. Communities further right spend more of their local salary on housing. Communities higher up have more disposable monthly income left over.
            </p>
          </div>
          <div style={{ ...CARD, padding: '36px 30px' }}>
            <svg ref={scatRef} style={{ display: 'block', width: '100%', height: 450 }} />
          </div>
        </div>
      </section>

      {/* SUBMIT CALL TO ACTION */}
      <section style={{ ...SEC, paddingTop: 0 }} id="submit">
        <div style={WRAP}>
          <div style={{ border: '1px solid var(--color-border)', borderRadius: 22, background: 'var(--color-surface)', padding: '80px 40px', textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
              <CanPolMark size={64} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 14, marginBottom: 12 }}>
              <div style={{ width: 32, height: 1, background: 'var(--color-border)' }} />
              <span style={LABEL}>Independent Electoral Data</span>
              <div style={{ width: 32, height: 1, background: 'var(--color-border)' }} />
            </div>
            <h2 style={{ fontSize: 'clamp(26px, 3.4vw, 46px)', letterSpacing: '-.02em', lineHeight: 1.1, fontWeight: 200, maxWidth: '22ch', margin: '0 auto 16px' }}>
              Canadian Political <strong style={{ fontWeight: 500, color: 'var(--color-accent)' }}>Discretionary Index.</strong>
            </h2>
            <p style={{ maxWidth: '44ch', margin: '0 auto 36px', color: 'var(--color-text-2)', fontWeight: 300, fontSize: 14.5 }}>
              Explore how local median incomes, combined marginal tax brackets, and housing costs distribute across Canada's geographic federal ridings.
            </p>
            <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
              <a href="/cities" style={BTN_GOLD}>Browse Ridings</a>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop: '1px solid var(--color-border)', padding: '50px 0 40px', color: 'var(--color-text-3)', fontSize: 13.5, fontWeight: 300 }}>
        <div style={WRAP}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 30, flexWrap: 'wrap', alignItems: 'flex-start' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontWeight: 600, fontSize: 14, color: 'var(--color-text-1)', marginBottom: 10 }}>
                <CanPolMark size={18} />
                CanPol Index
              </div>
              <div>Mapping socio-economic data across federal ridings. Free, forever.</div>
            </div>
            <div style={{ display: 'flex', gap: 24 }}>
              {[['Ridings','/cities'],['Explore','/explore'],['About','/about']].map(([l,h]) => (
                <a key={h} href={h} style={{ fontSize: 13, color: 'var(--color-text-3)', textDecoration: 'none' }}>{l}</a>
              ))}
            </div>
          </div>
          <div style={{ marginTop: 30, fontSize: 11, color: 'var(--color-text-4)' }}>
            &copy; 2026 CanPol Index · canpolindex.vercel.app
          </div>
        </div>
      </footer>

      {/* CITY DRAWER PANEL */}
      {sel && (() => {
        const pos = rmax > rmin ? Math.max(0, Math.min(1, ((sel.median_rent_1br_cad ?? 1500) - rmin) / (rmax - rmin))) : 0
        const burdenCol = sel.rentBurden == null ? 'var(--color-text-3)' : sel.rentBurden > 50 ? 'var(--color-accent)' : sel.rentBurden > 35 ? 'var(--color-text-1)' : 'var(--color-green)'
        const slug = sel.city.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
        const provName = sel.region ? PROVINCE_NAMES[sel.region] || sel.region : ''
        return (
          <>
            <div onClick={() => setSel(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', zIndex: 95, animation: 'fadeIn .25s ease' }} />
            <aside style={{ position: 'fixed', top: 0, right: 0, height: '100vh', width: 'min(400px,100vw)', background: 'var(--color-surface)', borderLeft: '1px solid var(--color-border)', zIndex: 96, overflowY: 'auto', boxShadow: '-20px 0 60px rgba(0,0,0,.6)', animation: 'drawerIn .3s cubic-bezier(.4,0,.2,1)' }}>
              <div style={{ padding: '30px 24px 40px' }}>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
                  <div>
                    <div style={{ fontSize: 24, marginBottom: 8 }}>🇨🇦</div>
                    <h2 style={{ fontSize: 28, fontWeight: 300, letterSpacing: '-.02em', margin: 0, color: 'var(--color-text-1)', fontFamily: 'var(--font-display)' }}>{sel.city}</h2>
                    <p style={{ ...LABEL, marginTop: 6 }}>{provName ? `${provName} (${sel.region})` : sel.region} · Canada</p>
                  </div>
                  <button onClick={() => setSel(null)} aria-label="Close" style={{ background: 'none', border: '1px solid var(--color-border)', borderRadius: 8, width: 32, height: 32, flexShrink: 0, cursor: 'pointer', color: 'var(--color-text-3)', fontSize: 13 }}>✕</button>
                </div>

                <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 20, marginBottom: 24 }}>
                  <div style={LABEL}>Median 1BR Rent</div>
                  <div style={{ fontSize: 44, fontWeight: 500, color: 'var(--color-accent)', letterSpacing: '-.03em', lineHeight: 1, marginTop: 8, fontFamily: 'var(--font-display)' }}>{sel.median_rent_1br_cad ? `CA$${sel.median_rent_1br_cad}/mo` : 'Pending'}</div>
                </div>

                {/* lands marker */}
                <div style={{ marginBottom: 24 }}>
                  <div style={LABEL}>Rent Spectrum Position</div>
                  <div style={{ position: 'relative', height: 8, borderRadius: 5, marginTop: 14, background: 'linear-gradient(90deg,var(--color-green),var(--color-text-2) 55%,var(--color-accent))' }}>
                    <div style={{ position: 'absolute', top: '50%', left: `${pos * 100}%`, transform: 'translate(-50%,-50%)', width: 14, height: 14, borderRadius: '50%', background: 'var(--color-text-1)', border: '3px solid var(--color-surface)' }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10 }}>
                    <span style={{ ...LABEL, fontSize: 9 }}>CA${rmin} lowest</span>
                    <span style={{ ...LABEL, fontSize: 9 }}>highest CA${rmax}</span>
                  </div>
                </div>

                {/* Rent burden */}
                {sel.rentBurden != null && (
                  <div style={{ marginBottom: 20 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                      <span style={LABEL}>Rent Burden</span>
                      <span style={{ ...MONO, fontSize: 14, color: burdenCol }}>{sel.rentBurden}%</span>
                    </div>
                    <div style={{ height: 6, borderRadius: 5, background: 'var(--color-bg)', marginTop: 10, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${Math.min(100, sel.rentBurden)}%`, background: burdenCol, borderRadius: 5 }} />
                    </div>
                    <p style={{ ...LABEL, fontSize: 8.5, marginTop: 8 }}>Share of median local gross paycheck spent on 1BR rent</p>
                  </div>
                )}

                {/* Disposable income */}
                {sel.bowlsAfterRent != null && (() => {
                  const isDeficit = sel.bowlsAfterRent < 0
                  const dispColor = isDeficit ? 'var(--color-accent)' : 'var(--color-green)'
                  return (
                    <div style={{ marginBottom: 24 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                        <span style={LABEL}>{isDeficit ? 'Housing Cost Exceeds Income' : 'Disposable Income Left'}</span>
                        <span style={{ ...MONO, fontSize: 14, color: dispColor }}>{isDeficit ? '-' : ''}CA${Math.abs(sel.bowlsAfterRent).toLocaleString()}</span>
                      </div>
                      <div style={{ height: 6, borderRadius: 5, background: 'var(--color-bg)', marginTop: 10, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${Math.min(100, (Math.abs(sel.bowlsAfterRent) / 5000) * 100)}%`, background: dispColor, borderRadius: 5 }} />
                      </div>
                      <p style={{ ...LABEL, fontSize: 8.5, marginTop: 8 }}>
                        {isDeficit ? 'Median net income does not cover this profile\'s housing cost' : 'Net income remaining after estimated progressive provincial taxes and 1BR housing costs'}
                      </p>
                    </div>
                  )
                })()}

                {sel.blurb && <p style={{ fontSize: 13, color: 'var(--color-text-2)', lineHeight: 1.6, margin: '20px 0' }}>{sel.blurb}</p>}

                <a href={`/cities/${slug}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--color-accent)', textDecoration: 'none', borderBottom: '1px solid rgba(217,56,58,.3)', paddingBottom: 2, fontWeight: 600 }}>
                  See detailed profile →
                </a>
              </div>
            </aside>
          </>
        )
      })()}

      {tip && (
        <div style={{
          position: 'fixed', zIndex: 90, pointerEvents: 'none',
          left: Math.min(typeof window !== 'undefined' ? window.innerWidth - 220 : 1000, tip.x + 12),
          top:  tip.y - 85,
          background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 8,
          padding: '10px 12px', ...MONO, fontSize: 11.5, lineHeight: 1.6,
          boxShadow: '0 10px 30px rgba(0,0,0,.5)', maxWidth: 200,
        }}>
          <div style={{ fontWeight: 600, color: 'var(--color-text-1)', marginBottom: 2 }}>
            {tip.city}, {tip.province}
          </div>
          {tip.burden != null && (
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, color: 'var(--color-text-3)' }}>
              <span>Rent Burden:</span><b style={{ color: 'var(--color-text-1)', fontWeight: 500 }}>{tip.burden}%</b>
            </div>
          )}
          {tip.plates != null && (
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, color: 'var(--color-text-3)' }}>
              <span>{tip.plates < 0 ? 'Shortfall CAD:' : 'Disposable CAD:'}</span>
              <b style={{ color: tip.plates < 0 ? 'var(--color-accent)' : 'var(--color-green)', fontWeight: 600 }}>${Math.abs(tip.plates).toLocaleString()}</b>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
