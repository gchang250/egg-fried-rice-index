'use client'

import { useEffect, useRef, useState, type CSSProperties } from 'react'
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
  blurb: string | null
  rentBurden:    number | null
  bowlsAfterRent: number | null // renamed to plates left
}

type Tip = { city: string; province: string; price: number; burden: number | null; plates: number | null; x: number; y: number }

const colorFor = (p: number) => p < 9.5 ? 'var(--color-green)' : p < 12.5 ? 'var(--color-text-2)' : 'var(--color-accent)'
const fmt = (n: number) => `CA$${n.toFixed(2)}`

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

function DetailedPoutineIllustration() {
  return (
    <svg width="100%" height="280" viewBox="0 0 320 280" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="poutineShadow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="8" stdDeviation="6" floodColor="#000" floodOpacity="0.4" />
        </filter>
        <linearGradient id="gravyGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#8d4a24" />
          <stop offset="50%" stopColor="#673215" />
          <stop offset="100%" stopColor="#431e0b" />
        </linearGradient>
        <linearGradient id="fryGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#f5cf6d" />
          <stop offset="70%" stopColor="#eeb44f" />
          <stop offset="100%" stopColor="#c38a22" />
        </linearGradient>
        <linearGradient id="bowlGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2c2a30" />
          <stop offset="100%" stopColor="#131317" />
        </linearGradient>
      </defs>

      {/* Steam lines */}
      <g stroke="var(--color-text-4)" strokeWidth="1.5" strokeLinecap="round" opacity="0.4">
        <path d="M120 60 Q110 40 120 20 T110 2" fill="none" />
        <path d="M160 55 Q170 35 160 15 T170 0" fill="none" />
        <path d="M200 60 Q190 40 200 20 T190 2" fill="none" />
      </g>

      <g filter="url(#poutineShadow)">
        {/* Bowl Background shadow rim */}
        <ellipse cx="160" cy="210" rx="90" ry="26" fill="#000" opacity="0.4" />
        
        {/* Bowl Back Rim */}
        <ellipse cx="160" cy="200" rx="80" ry="20" fill="#1b1a1f" stroke="#2c2a30" strokeWidth="1" />

        {/* FRIES STACK */}
        <g stroke="#8d5f14" strokeWidth="0.5">
          {/* Layer 1: Back fries */}
          <rect x="110" y="130" width="12" height="60" rx="2" transform="rotate(-40 110 130)" fill="url(#fryGrad)" />
          <rect x="180" y="115" width="12" height="65" rx="2" transform="rotate(35 180 115)" fill="url(#fryGrad)" />
          <rect x="140" y="120" width="13" height="62" rx="2" transform="rotate(-10 140 120)" fill="url(#fryGrad)" />
          
          {/* Layer 2: Mid fries */}
          <rect x="130" y="105" width="12" height="65" rx="2" transform="rotate(15 130 105)" fill="url(#fryGrad)" />
          <rect x="160" y="110" width="13" height="60" rx="2" transform="rotate(-25 160 110)" fill="url(#fryGrad)" />
          <rect x="105" y="115" width="12" height="70" rx="2" transform="rotate(45 105 115)" fill="url(#fryGrad)" />

          {/* GRAVY DRAUGHTS (Back layer) */}
          <path d="M120 125 Q140 135 155 130 T190 120" stroke="url(#gravyGrad)" strokeWidth="7" strokeLinecap="round" fill="none" opacity="0.9" />
          <path d="M100 150 C120 160 145 155 170 145" stroke="url(#gravyGrad)" strokeWidth="9" strokeLinecap="round" fill="none" opacity="0.9" />

          {/* CHEESE CURDS (Mid layer) */}
          <path d="M120 140 C110 140 105 148 115 152 C125 156 132 148 125 142 Z" fill="#faf8f2" stroke="#ebe8df" strokeWidth="0.8" />
          <path d="M175 132 C165 130 160 138 168 142 C176 146 185 140 180 135 Z" fill="#faf8f2" stroke="#ebe8df" strokeWidth="0.8" />

          {/* Layer 3: Front fries */}
          <rect x="120" y="90" width="13" height="70" rx="2" transform="rotate(-5 120 90)" fill="url(#fryGrad)" />
          <rect x="155" y="95" width="12" height="65" rx="2" transform="rotate(20 155 95)" fill="url(#fryGrad)" />
          <rect x="135" y="100" width="12" height="68" rx="2" transform="rotate(-30 135 100)" fill="url(#fryGrad)" />

          {/* GRAVY SPLASHES (Front layer) */}
          <path d="M110 110 Q130 105 150 115 T190 110" stroke="url(#gravyGrad)" strokeWidth="8" strokeLinecap="round" fill="none" />
          <path d="M130 95 Q145 110 160 100" stroke="url(#gravyGrad)" strokeWidth="5" strokeLinecap="round" fill="none" />
          <path d="M90 135 Q125 140 150 128 T210 135" stroke="url(#gravyGrad)" strokeWidth="10" strokeLinecap="round" fill="none" />
          <path d="M172 125 L174 150 Q176 156 173 158" stroke="url(#gravyGrad)" strokeWidth="5" strokeLinecap="round" fill="none" />

          {/* CHEESE CURDS (Front Layer) */}
          <path d="M102 115 C95 115 90 122 98 128 C106 134 112 126 106 120 Z" fill="#faf8f2" stroke="#ebe8df" strokeWidth="0.8" />
          <path d="M150 105 C142 102 135 112 144 118 C153 124 160 114 154 108 Z" fill="#faf8f2" stroke="#ebe8df" strokeWidth="0.8" />
          <path d="M130 145 C122 143 118 151 126 155 C134 159 140 151 134 146 Z" fill="#faf8f2" stroke="#ebe8df" strokeWidth="0.8" />
          <path d="M162 150 C155 147 150 155 158 161 C166 167 172 159 166 153 Z" fill="#faf8f2" stroke="#ebe8df" strokeWidth="0.8" />
        </g>

        {/* Green Scallion Garnish */}
        <g stroke="#3e8e41" strokeWidth="1.5" fill="none">
          <circle cx="118" cy="105" r="2" />
          <circle cx="168" cy="98" r="1.8" />
          <circle cx="140" cy="135" r="2" />
          <circle cx="108" cy="138" r="2" />
        </g>

        {/* Bowl Front panel */}
        <path d="M 78 196 C 78 196 78 224 160 224 C 242 224 242 196 242 196 C 242 196 230 248 160 248 C 90 248 78 196 78 196 Z" fill="url(#bowlGrad)" stroke="#2c2a30" strokeWidth="1.2" />
        <path d="M 82 198 C 82 198 90 220 160 220 C 230 220 238 198 238 198" stroke="#3d3c45" strokeWidth="0.8" fill="none" />
      </g>
    </svg>
  )
}

export default function Home() {
  const [cities, setCities]   = useState<CityRow[]>([])
  const [tip, setTip]         = useState<Tip | null>(null)
  const [sel, setSel]         = useState<CityRow | null>(null)
  const [boardIn, setBoardIn] = useState(false)
  const [mapLoading, setMapLoading] = useState(true)

  const mapRef   = useRef<SVGSVGElement>(null)
  const specRef  = useRef<SVGSVGElement>(null)
  const scatRef  = useRef<SVGSVGElement>(null)
  const boardRef = useRef<HTMLDivElement>(null)

  /* ── Fetch cities ──────────────────────────────────────────────── */
  useEffect(() => {
    supabase
      .from('cities')
      .select('city,country,region,flag,price_cad,latitude,longitude,median_rent_1br_cad,median_monthly_salary_cad,blurb')
      .not('price_cad', 'is', null)
      .order('price_cad', { ascending: true })
      .then(({ data }) => {
        if (!data) return
        setCities(data.map(c => {
          const price  = Number(c.price_cad)
          const rent   = c.median_rent_1br_cad        != null ? Number(c.median_rent_1br_cad)        : null
          const salary = c.median_monthly_salary_cad  != null ? Number(c.median_monthly_salary_cad)  : null
          return {
            ...c,
            price_cad:      price,
            rentBurden:     rent && salary ? Math.round(rent / salary * 100) : null,
            bowlsAfterRent: rent && salary && price > 0 ? Math.round((salary - rent) / price) : null,
          }
        }))
      })
  }, [])

  /* ── Canada map ────────────────────────────────────────────────── */
  useEffect(() => {
    const svgEl = mapRef.current
    if (!svgEl || !cities.length) return
    setMapLoading(true)

    d3.json('/canada.geojson').then((geojson: any) => {
      setMapLoading(false)
      svgEl.innerHTML = ''
      
      const W = svgEl.clientWidth || 1000
      const H = 450
      svgEl.setAttribute('viewBox', `0 0 ${W} ${H}`)

      const svg = d3.select(svgEl)
      const g = svg.append('g')

      const projection = d3.geoConicConformal()
        .center([0, 62])
        .rotate([96, 0])
        .parallels([49, 77])
        .scale(W * 0.72)
        .translate([W / 2, H / 2 + 50])

      const pathGen = d3.geoPath().projection(projection)

      const defs = svg.append('defs')
      const shadowFilter = defs.append('filter')
        .attr('id', 'landShadow')
        .attr('x', '-10%').attr('y', '-10%')
        .attr('width', '120%').attr('height', '120%')
      
      shadowFilter.append('feDropShadow')
        .attr('dx', '0')
        .attr('dy', '3')
        .attr('stdDeviation', '3')
        .attr('flood-color', '#000000')
        .attr('flood-opacity', '0.65')

      // Draw Canada Outline
      g.append('g')
        .selectAll('path')
        .data(geojson.features)
        .enter()
        .append('path')
        .attr('d', pathGen as any)
        .attr('fill', 'var(--color-surface)')
        .attr('stroke', 'var(--color-border)')
        .attr('stroke-width', 0.65)
        .attr('filter', 'url(#landShadow)')

      // Plot communities as glowing dots
      cities.forEach((city, idx) => {
        if (city.longitude == null || city.latitude == null) return
        const coords = projection([city.longitude, city.latitude])
        if (!coords) return
        const [cx, cy] = coords

        const dotG = g.append('g')
          .attr('class', 'grain')
          .attr('transform', `translate(${cx},${cy})`)
          .on('click', () => setSel(city))
          .on('mousemove', (ev) => {
            setTip({
              city: city.city,
              province: city.region ?? '',
              price: city.price_cad,
              burden: city.rentBurden,
              plates: city.bowlsAfterRent,
              x: ev.clientX,
              y: ev.clientY
            })
          })
          .on('mouseleave', () => setTip(null))

        // Ripple glow
        dotG.append('circle')
          .attr('r', 9)
          .attr('fill', colorFor(city.price_cad))
          .attr('opacity', 0.12)
          .attr('class', 'city-aura')

        // Central dot
        dotG.append('circle')
          .attr('r', 4.5)
          .attr('fill', colorFor(city.price_cad))
          .attr('stroke', '#09090b')
          .attr('stroke-width', 0.8)
          .attr('class', 'city-dot')
      })
    })
  }, [cities])

  /* ── Price Spectrum ────────────────────────────────────────────── */
  useEffect(() => {
    const svg = specRef.current
    if (!svg || !cities.length) return

    const draw = () => {
      svg.innerHTML = ''
      const W = svg.clientWidth || 1100
      const H = 200
      svg.setAttribute('viewBox', `0 0 ${W} ${H}`)
      
      const axY = H - 55
      const padding = { l: 40, r: 40 }
      const minVal = cities[0].price_cad
      const maxVal = cities[cities.length - 1].price_cad
      
      const x = d3.scaleLinear()
        .domain([minVal, maxVal])
        .range([padding.l, W - padding.r])

      // Axis Line
      d3.select(svg).append('line')
        .attr('x1', padding.l).attr('x2', W - padding.r)
        .attr('y1', axY).attr('y2', axY)
        .attr('stroke', 'var(--color-border)')
        .attr('stroke-width', 1)

      // Tick markers
      const ticks = x.ticks(10)
      ticks.forEach(t => {
        const tx = x(t)
        d3.select(svg).append('line')
          .attr('x1', tx).attr('x2', tx).attr('y1', axY).attr('y2', axY + 6)
          .attr('stroke', 'var(--color-border)')
          .attr('stroke-width', 0.8)
        
        d3.select(svg).append('text')
          .attr('x', tx).attr('y', axY + 18).attr('text-anchor', 'middle')
          .attr('font-family', 'var(--font-mono)').attr('font-size', '9.5')
          .attr('fill', 'var(--color-text-3)').text(fmt(t))
      })

      // Plot communities on spectrum
      cities.forEach((c, idx) => {
        const cx = x(c.price_cad)
        const cy = axY - 24 - ((idx * 14) % 65)
        
        const g = d3.select(svg).append('g')
          .attr('class', 'grain')
          .attr('transform', `translate(${cx},${cy})`)
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

        // Vertical drop line
        g.append('line')
          .attr('x1', 0).attr('x2', 0)
          .attr('y1', 4).attr('y2', axY - cy)
          .attr('stroke', 'var(--color-border)')
          .attr('stroke-width', 0.6)
          .attr('stroke-opacity', 0.3)

        // Drop stylized cheese-curd point
        g.append('circle')
          .attr('r', 5)
          .attr('fill', colorFor(c.price_cad))
          .attr('opacity', 0.95)

        svg.appendChild(g.node()!)
      })

      // Extremes labels
      const extremes: Array<[string, CityRow, string]> = [
        ['CHEAPEST', cities[0], 'start'],
        ['PRICIEST', cities[cities.length - 1], 'end']
      ]
      extremes.forEach(([label, d, anchor]) => {
        const fx = x(d.price_cad)
        const txt = d3.create('svg:text')
          .attr('x', fx).attr('y', 20).attr('text-anchor', anchor)
          .attr('font-family', 'var(--font-mono)').attr('font-size', '10')
          .attr('letter-spacing', '1.5').attr('fill', colorFor(d.price_cad))
          .text(`${d.city.toUpperCase()} ${fmt(d.price_cad)} · ${label}`).node()!
        svg.appendChild(txt)
        svg.appendChild(d3.create('svg:line')
          .attr('x1', fx).attr('x2', fx).attr('y1', 28).attr('y2', axY - 2)
          .attr('stroke', colorFor(d.price_cad)).attr('stroke-opacity', '.25')
          .attr('stroke-dasharray', '2 4').node()!)
      })
    }
    
    draw()
    const ro = new ResizeObserver(() => draw())
    ro.observe(svg)
    return () => ro.disconnect()
  }, [cities])

  /* ── Scatter plot ──────────────────────────────────────────────── */
  useEffect(() => {
    const svg = scatRef.current
    if (!svg || !cities.length) return
    const data = cities.filter(c => c.rentBurden != null && c.bowlsAfterRent != null) as (CityRow & { rentBurden: number; bowlsAfterRent: number })[]
    if (!data.length) return
    const PMIN = cities[0].price_cad, PMAX = cities[cities.length - 1].price_cad
    const NOTABLE = ['Toronto', 'Vancouver', 'Montreal', 'Calgary', 'Edmonton', 'Halifax', 'Winnipeg', 'Iqaluit', 'Yellowknife', 'Fort McMurray', 'Sherbrooke']
    
    const draw = () => {
      svg.innerHTML = ''
      const W = svg.clientWidth || 1100, H = 450, m = { t: 30, r: 30, b: 50, l: 60 }
      svg.setAttribute('viewBox', `0 0 ${W} ${H}`)
      
      const bVals = data.map(c => c.rentBurden), yVals = data.map(c => c.bowlsAfterRent)
      const bmin = Math.min(...bVals), bmax = Math.max(...bVals)
      const ymax = Math.max(...yVals)
      const xS = (v: number) => m.l + (v - bmin) / (bmax - bmin) * (W - m.l - m.r)
      const yS = (v: number) => H - m.b - (Math.min(v, ymax) / ymax) * (H - m.t - m.b)

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
      const yStep = 50
      for (let v = 0; v <= ymax; v += yStep) {
        svg.appendChild(d3.create('svg:line')
          .attr('x1', m.l).attr('x2', W - m.r).attr('y1', yS(v)).attr('y2', yS(v))
          .attr('stroke', 'var(--color-border)').attr('stroke-dasharray', '1 4').node()!)
        const t = d3.create('svg:text')
          .attr('x', m.l - 10).attr('y', yS(v) + 3).attr('text-anchor', 'end')
          .attr('font-family', 'var(--font-mono)').attr('font-size', '9.5')
          .attr('fill', 'var(--color-text-3)').text(String(v)).node()!
        svg.appendChild(t)
      }

      // X/Y Titles
      const xt = d3.create('svg:text')
        .attr('x', (m.l + W - m.r) / 2).attr('y', H - 10).attr('text-anchor', 'middle')
        .attr('font-family', 'var(--font-body)').attr('font-size', '10')
        .attr('fill', 'var(--color-text-2)').attr('letter-spacing', '1').attr('font-weight', 600)
        .text('RENT BURDEN (1BR RENT AS % OF LOCAL MEDIAN INCOME)').node()!
      svg.appendChild(xt)

      const yt = d3.create('svg:text')
        .attr('transform', `translate(14 ${(m.t + H - m.b) / 2}) rotate(-90)`).attr('text-anchor', 'middle')
        .attr('font-family', 'var(--font-body)').attr('font-size', '10')
        .attr('fill', 'var(--color-text-2)').attr('letter-spacing', '1').attr('font-weight', 600)
        .text('AFFORDABLE POUTINES AFTER RENT / MONTH').node()!
      svg.appendChild(yt)

      // Plot data points
      data.forEach((c) => {
        const gx = xS(c.rentBurden), gy = yS(c.bowlsAfterRent)
        const rs = 4.5 + (c.price_cad - PMIN) / (PMAX - PMIN) * 6.5

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

        // Draw curd marker
        g.append('circle')
          .attr('r', rs)
          .attr('fill', colorFor(c.price_cad))
          .attr('opacity', 0.9)
          .attr('stroke', '#09090b')
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
  }, [cities])

  /* ── Leaderboard Intersection ─────────────────────────────────── */
  useEffect(() => {
    const el = boardRef.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setBoardIn(true); io.disconnect() } }, { threshold: 0.1 })
    io.observe(el)
    return () => io.disconnect()
  }, [cities])

  /* ── Escape key closes sidebar ───────────────────────────────── */
  useEffect(() => {
    if (!sel) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setSel(null) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [sel])

  /* ── Stats Calculations ────────────────────────────────────────── */
  const pmin     = cities[0]?.price_cad ?? 7.50
  const pmax     = cities[cities.length - 1]?.price_cad ?? 18.50
  const spread   = cities.length >= 2 ? pmax / pmin : 2.4
  const maxPlates = cities.reduce((m, c) => Math.max(m, c.bowlsAfterRent ?? 0), 0)
  const cheapTop = cities.slice(0, 8)
  const priceTop = [...cities].slice(-8).reverse()

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
                <span style={LABEL}>Canada Edition · Food-based Affordability Index</span>
              </div>

              <h1 style={{ fontSize: 'clamp(38px, 5.2vw, 76px)', lineHeight: 1.05, letterSpacing: '-.025em', fontWeight: 200, maxWidth: '20ch', margin: '0 0 28px' }}>
                One dish, priced across <strong style={{ fontWeight: 500, color: 'var(--color-accent)' }}>Canadian communities.</strong>
              </h1>

              <p style={{ maxWidth: '56ch', color: 'var(--color-text-2)', fontSize: 16.5, fontWeight: 300, lineHeight: 1.65, margin: '0 0 40px' }}>
                A classic plate of poutine costs <strong style={{ color: 'var(--color-text-1)', fontWeight: 600 }}>{fmt(pmin)}</strong> in one community and{' '}
                <strong style={{ color: 'var(--color-text-1)', fontWeight: 600 }}>{fmt(pmax)}</strong> in another.
                The index evaluates local cost of living and housing burdens relative to local median wages.
              </p>

              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                <a href="/cities" style={BTN_GOLD}>Browse Communities</a>
                <a href="/explore" style={BTN_GHOST}>Interactive Map</a>
              </div>
            </div>

            {/* Themed Poutine Illustration */}
            <div style={{ flex: '1 1 320px', maxWidth: 360, display: 'flex', justifyContent: 'center' }} className="hero-graphic">
              <DetailedPoutineIllustration />
            </div>
          </div>
        </div>

        {/* Dynamic Canada Map */}
        <div style={{ marginTop: 80 }}>
          <div style={{ ...WRAP, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', paddingBottom: 18, flexWrap: 'wrap', gap: 10 }}>
            <span style={{ ...LABEL, color: 'var(--color-text-1)' }}>The Canadian Index Map — {cities.length} Communities</span>
            <span style={LABEL}>Hover a community point to inspect baseline price</span>
          </div>
          <div style={{ borderTop: '1px solid var(--color-border)', borderBottom: '1px solid var(--color-border)', background: 'radial-gradient(circle at 50% 50%, var(--color-surface), var(--color-bg))' }}>
            <div style={{ ...WRAP, paddingTop: 20, paddingBottom: 20 }}>
              {mapLoading && (
                <div style={{ height: 450, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-3)', ...MONO, fontSize: 12 }}>
                  LOADING CANADA ATLAS...
                </div>
              )}
              <svg ref={mapRef} style={{ display: mapLoading ? 'none' : 'block', width: '100%', height: 'auto' }} />
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div style={{ ...WRAP, borderBottom: '1px solid var(--color-border)' }}>
          <div className="stats-grid">
            {[
              { prefix: '', val: cities.length, dec: 0, suffix: '', label: 'Communities Indexed' },
              { prefix: 'CA$', val: pmin, dec: 2, suffix: '', label: 'Lowest Baseline Poutine' },
              { prefix: 'CA$', val: pmax, dec: 2, suffix: '', label: 'Highest Baseline Poutine' },
              { prefix: '', val: spread, dec: 2, suffix: '×', label: 'Price Spread Ratio' },
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
                <span style={LABEL}>The Price Axis</span>
              </div>
              <h2 style={{ fontSize: 'clamp(26px, 3.4vw, 46px)', letterSpacing: '-.02em', lineHeight: 1.1, fontWeight: 200, maxWidth: '22ch', margin: 0 }}>
                Price Spectrum. <strong style={{ fontWeight: 500, color: 'var(--color-accent)' }}>One standard.</strong>
              </h2>
            </div>
            <p style={{ maxWidth: '44ch', color: 'var(--color-text-2)', fontWeight: 300, fontSize: 14.5 }}>
              Every community laid out relative to their baseline price. Prices represent local neighborhood median pricing, revealing local purchasing power.
            </p>
          </div>
          <div style={{ ...CARD, padding: '36px 30px 24px' }}>
            <svg ref={specRef} style={{ display: 'block', width: '100%', height: 200 }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 14, borderTop: '1px solid var(--color-border)', marginTop: 10, flexWrap: 'wrap', gap: 8 }}>
              <span style={LABEL}>Baseline price, classic poutine · CAD</span>
              <span style={LABEL}>Median of local scanned venues</span>
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
              <div style={{ height: 100, marginBottom: 20 }}>
                <svg viewBox="0 0 280 100" width="100%" height="100%">
                  <line x1="10" y1="80" x2="270" y2="80" stroke="var(--color-border)" strokeWidth="1"/>
                  {/* Small baseline curd */}
                  <g transform="translate(40, 70)">
                    <rect x="-10" y="0" width="20" height="10" fill="var(--color-border)" rx="2"/>
                    <rect x="-6" y="-7" width="2.5" height="7" rx="0.5" fill="var(--color-green)" transform="rotate(-15)"/>
                    <rect x="2" y="-8" width="2.5" height="8" rx="0.5" fill="var(--color-green)" transform="rotate(10)"/>
                    <circle cx="-1" cy="-2" r="1.5" fill="var(--color-text-1)"/>
                  </g>
                  <text x="40" y="44" fontFamily="var(--font-mono)" fontSize="9" fill="var(--color-green)" textAnchor="middle">{fmt(pmin)}</text>
                  
                  {/* Medium curd */}
                  <g transform="translate(140, 68)">
                    <rect x="-14" y="0" width="28" height="12" fill="var(--color-border)" rx="2"/>
                    <rect x="-9" y="-10" width="3" height="10" rx="0.5" fill="var(--color-text-2)" transform="rotate(-10)"/>
                    <rect x="0" y="-11" width="3" height="11" rx="0.5" fill="var(--color-text-2)" transform="rotate(5)"/>
                    <rect x="6" y="-9" width="3" height="9" rx="0.5" fill="var(--color-text-2)" transform="rotate(15)"/>
                    <circle cx="-4" cy="-3" r="2" fill="var(--color-text-1)"/>
                    <circle cx="3" cy="-3" r="1.8" fill="var(--color-text-1)"/>
                  </g>

                  {/* Large curd */}
                  <g transform="translate(230, 64)">
                    <rect x="-18" y="0" width="36" height="16" fill="var(--color-accent)" rx="3"/>
                    <rect x="-12" y="-13" width="3.5" height="13" rx="0.5" fill="var(--color-green)" transform="rotate(-20)"/>
                    <rect x="-3" y="-15" width="3.5" height="15" rx="0.5" fill="var(--color-green)" transform="rotate(-5)"/>
                    <rect x="5" y="-14" width="3.5" height="14" rx="0.5" fill="var(--color-green)" transform="rotate(15)"/>
                    <rect x="10" y="-11" width="3.5" height="11" rx="0.5" fill="var(--color-green)" transform="rotate(30)"/>
                    <circle cx="-7" cy="-4" r="2.5" fill="#fff"/>
                    <circle cx="1" cy="-5" r="2.8" fill="#fff"/>
                    <circle cx="7" cy="-4" r="2.2" fill="#fff"/>
                    <path d="M-13 -2 Q0 -5 13 -2" stroke="#8d4a24" strokeWidth="2.5" fill="none"/>
                  </g>
                  <text x="230" y="24" fontFamily="var(--font-mono)" fontSize="9" fill="var(--color-accent)" textAnchor="middle">{fmt(pmax)}</text>
                </svg>
              </div>
              <h3 style={{ fontSize: 20, marginBottom: 10, fontWeight: 500 }}>Baseline Price</h3>
              <p style={{ color: 'var(--color-text-2)', fontSize: 14, fontWeight: 300, lineHeight: 1.6 }}>The median price of a standard classic poutine (fries, curds, gravy) at local, non-tourist diners in the community, measured in CAD.</p>
            </div>

            {/* Metric 2 */}
            <div style={{ background: 'var(--color-surface)', padding: '36px 30px', position: 'relative' }}>
              <span style={{ ...LABEL, position: 'absolute', top: 24, right: 24, color: 'var(--color-text-3)' }}>M·02</span>
              <div style={{ height: 100, marginBottom: 20 }}>
                <svg viewBox="0 0 280 100" width="100%" height="100%">
                  {/* Semi-circle gauge */}
                  <g transform="translate(140, 88)">
                    <path d="M -70 0 A 70 70 0 0 1 70 0" fill="none" stroke="var(--color-border)" strokeWidth="8" strokeLinecap="round"/>
                    <path d="M -70 0 A 70 70 0 0 1 56 -42" fill="none" stroke="var(--color-accent)" strokeWidth="8" strokeLinecap="round"/>
                    <text x="0" y="-24" fontFamily="var(--font-display)" fontWeight="400" fontSize="28" fill="var(--color-text-1)" textAnchor="middle">56%</text>
                    <text x="0" y="-8" fontFamily="var(--font-mono)" fontSize="7.5" fill="var(--color-accent)" textAnchor="middle" letterSpacing="1">MAX RENT BURDEN</text>
                  </g>
                </svg>
              </div>
              <h3 style={{ fontSize: 20, marginBottom: 10, fontWeight: 500 }}>Rent Burden</h3>
              <p style={{ color: 'var(--color-text-2)', fontSize: 14, fontWeight: 300, lineHeight: 1.6 }}>1BR median rent as a percentage of the average local monthly paycheck. Highlights how severe housing costs drain earnings.</p>
            </div>

            {/* Metric 3 */}
            <div style={{ background: 'var(--color-surface)', padding: '36px 30px', position: 'relative' }}>
              <span style={{ ...LABEL, position: 'absolute', top: 24, right: 24, color: 'var(--color-text-3)' }}>M·03</span>
              <div style={{ height: 100, marginBottom: 20 }}>
                <svg viewBox="0 0 280 100" width="100%" height="100%">
                  <text x="14" y="24" fontFamily="var(--font-mono)" fontSize="8.5" fill="var(--color-text-3)" letterSpacing="1.5">EDMONTON (ACCESSIBLE)</text>
                  <g transform="translate(14, 30)">
                    {[...Array(9)].map((_, i) => (
                      <rect key={i} x={i * 18} y="2" width="14" height="6" rx="1.5" fill="var(--color-green)" stroke="#c38a22" strokeWidth="0.5"/>
                    ))}
                  </g>
                  <text x="14" y="68" fontFamily="var(--font-mono)" fontSize="8.5" fill="var(--color-text-3)" letterSpacing="1.5">VANCOUVER (EXPENSIVE)</text>
                  <g transform="translate(14, 74)">
                    {[...Array(4)].map((_, i) => (
                      <rect key={i} x={i * 18} y="2" width="14" height="6" rx="1.5" fill="var(--color-accent)" stroke="#8d5f14" strokeWidth="0.5"/>
                    ))}
                  </g>
                </svg>
              </div>
              <h3 style={{ fontSize: 20, marginBottom: 10, fontWeight: 500 }}>Poutines After Rent</h3>
              <p style={{ color: 'var(--color-text-2)', fontSize: 14, fontWeight: 300, lineHeight: 1.6 }}>How many classic poutines a median worker can purchase with their remaining salary after paying local average 1BR rent.</p>
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
                Leaderboards. <strong style={{ fontWeight: 500, color: 'var(--color-accent)' }}>Cheapest vs. Priciest.</strong>
              </h2>
            </div>
            <p style={{ maxWidth: '44ch', color: 'var(--color-text-2)', fontWeight: 300, fontSize: 14.5 }}>
              Comparing absolute pricing for a single baseline plate across Canada. Highly reflective of local commercial rents and operating costs.
            </p>
          </div>

          <div ref={boardRef} className="board-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, background: 'var(--color-border)', border: '1px solid var(--color-border)', borderRadius: 18, overflow: 'hidden' }}>
            {/* Cheapest */}
            <div style={{ background: 'var(--color-surface)', padding: '36px 30px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--color-green)' }} />
                <span style={{ ...LABEL, color: 'var(--color-text-1)' }}>Lowest Baselines · CAD</span>
              </div>
              {cheapTop.map((c, i) => (
                <div key={c.city} style={{ display: 'grid', gridTemplateColumns: '30px 1fr auto', alignItems: 'center', gap: 16, padding: '12px 0', borderBottom: i < cheapTop.length - 1 ? '1px solid var(--color-border)' : 'none' }}>
                  <span style={{ ...MONO, fontSize: 10, color: 'var(--color-text-3)' }}>{String(i + 1).padStart(2, '0')}</span>
                  <span style={{ fontSize: 14.5, fontWeight: 500 }}>
                    {c.city}, {c.region}
                    <small style={{ display: 'block', fontSize: 11, color: 'var(--color-text-3)', fontWeight: 400, marginTop: 2 }}>
                      {c.bowlsAfterRent != null ? c.bowlsAfterRent.toLocaleString() + ' poutines left after rent' : ''}
                    </small>
                  </span>
                  <span style={{ position: 'relative', height: 20, width: 'min(34vw,250px)', display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                    <span style={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)', height: 2, background: 'var(--color-green)', width: boardIn ? `${(c.price_cad / pmax * 100).toFixed(1)}%` : '0%', transition: `width 1.2s cubic-bezier(.2,.8,.2,1) ${i * 50}ms` }} />
                    <span style={{ position: 'relative', ...MONO, fontSize: 12, background: 'var(--color-surface)', paddingLeft: 8 }}>{fmt(c.price_cad)}</span>
                  </span>
                </div>
              ))}
            </div>

            {/* Priciest */}
            <div style={{ background: 'var(--color-surface)', padding: '36px 30px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--color-accent)' }} />
                <span style={{ ...LABEL, color: 'var(--color-text-1)' }}>Highest Baselines · CAD</span>
              </div>
              {priceTop.map((c, i) => (
                <div key={c.city} style={{ display: 'grid', gridTemplateColumns: '30px 1fr auto', alignItems: 'center', gap: 16, padding: '12px 0', borderBottom: i < priceTop.length - 1 ? '1px solid var(--color-border)' : 'none' }}>
                  <span style={{ ...MONO, fontSize: 10, color: 'var(--color-text-3)' }}>{String(i + 1).padStart(2, '0')}</span>
                  <span style={{ fontSize: 14.5, fontWeight: 500 }}>
                    {c.city}, {c.region}
                    <small style={{ display: 'block', fontSize: 11, color: 'var(--color-text-3)', fontWeight: 400, marginTop: 2 }}>
                      {c.bowlsAfterRent != null ? c.bowlsAfterRent.toLocaleString() + ' poutines left after rent' : ''}
                    </small>
                  </span>
                  <span style={{ position: 'relative', height: 20, width: 'min(34vw,250px)', display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                    <span style={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)', height: 2, background: 'var(--color-accent)', width: boardIn ? `${(c.price_cad / pmax * 100).toFixed(1)}%` : '0%', transition: `width 1.2s cubic-bezier(.2,.8,.2,1) ${i * 50}ms` }} />
                    <span style={{ position: 'relative', ...MONO, fontSize: 12, background: 'var(--color-surface)', paddingLeft: 8 }}>{fmt(c.price_cad)}</span>
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
                Rent burden <strong style={{ fontWeight: 500, color: 'var(--color-accent)' }}>vs. poutines left.</strong>
              </h2>
            </div>
            <p style={{ maxWidth: '44ch', color: 'var(--color-text-2)', fontWeight: 300, fontSize: 14.5 }}>
              Visualizing local purchasing power. Communities further right spend more of their local salary on housing. Communities higher up have more disposable poutines left over.
            </p>
          </div>
          <div style={{ ...CARD, padding: '36px 30px' }}>
            <svg ref={scatRef} style={{ display: 'block', width: '100%', height: 450 }} />
            <div style={{ display: 'flex', gap: 30, marginTop: 24, flexWrap: 'wrap' }}>
              {[['var(--color-green)','Baseline under CA$9.50'],['var(--color-text-2)','CA$9.50 to CA$12.50'],['var(--color-accent)','Over CA$12.50']].map(([col, label]) => (
                <span key={label} style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ width: 14, height: 2, display: 'inline-block', background: col }} />
                  <span style={LABEL}>{label}</span>
                </span>
              ))}
              <span style={{ ...LABEL, marginLeft: 'auto' }}>Marker size proportional to baseline price</span>
            </div>
          </div>
        </div>
      </section>

      {/* METHODOLOGY SECTION SUMMARY */}
      <section style={{ ...SEC, borderTop: '1px solid var(--color-border)' }} id="method">
        <div style={WRAP}>
          <div className="method-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, alignItems: 'start' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 12 }}>
                <div style={{ width: 32, height: 1, background: 'var(--color-border)' }} />
                <span style={LABEL}>Scientific rigor</span>
              </div>
              <h2 style={{ fontSize: 'clamp(26px, 3.4vw, 46px)', letterSpacing: '-.02em', lineHeight: 1.1, fontWeight: 200, maxWidth: '22ch', margin: '0 0 20px' }}>
                Boring on purpose. <strong style={{ fontWeight: 500, color: 'var(--color-accent)' }}>Rigorous by design.</strong>
              </h2>
              <p style={{ color: 'var(--color-text-2)', maxWidth: '46ch', fontWeight: 300, fontSize: 14.5, lineHeight: 1.6 }}>
                Novel indexes live and die on their structural integrity. We utilize CMHC housing databases, Statistics Canada census tables, and direct restaurant menu audits.
              </p>
              <div style={{ display: 'flex', gap: 16, marginTop: 30 }}>
                <a href="/methodology" style={BTN_GHOST}>Read full methodology</a>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {[
                { n: '01', title: 'Standardized Dish Portion', body: 'Standard baseline classic poutine (fresh-cut fries, cheese curds, gravy). No gourmet meat or luxury add-ons.' },
                { n: '02', title: 'Local Audits Only', body: 'Sourced from local diners, chip trucks, and neighborhood poutineries outside high-cost tourist spots.' },
                { n: '03', title: 'National Wage Normalization', body: 'Salaries and rents are normalized against local Statistics Canada data to calculate local purchasing power.' },
                { n: '04', title: 'Source Verification', body: 'Each submitted restaurant entry is cross-checked against menu snapshots or food delivery menus for quality validation.' }
              ].map((step, i) => (
                <div key={step.title} style={{ display: 'flex', gap: 20, padding: '20px 0', borderBottom: i < 3 ? '1px solid var(--color-border)' : 'none', paddingTop: i === 0 ? 0 : 20 }}>
                  <span style={{ ...MONO, fontSize: 10, color: 'var(--color-text-3)', paddingTop: 2 }}>{String(i + 1).padStart(2, '0')}</span>
                  <div>
                    <h4 style={{ fontSize: 16, fontWeight: 600, marginBottom: 5 }}>{step.title}</h4>
                    <p style={{ fontSize: 13.5, color: 'var(--color-text-2)', fontWeight: 300, lineHeight: 1.5 }}>{step.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* SUBMIT CALL TO ACTION */}
      <section style={{ ...SEC, paddingTop: 0 }} id="submit">
        <div style={WRAP}>
          <div style={{ border: '1px solid var(--color-border)', borderRadius: 22, background: 'var(--color-surface)', padding: '80px 40px', textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
              <svg width="64" height="64" viewBox="0 0 28 28" fill="none" aria-hidden="true">
                <circle cx="14" cy="14" r="13" stroke="var(--color-border)" strokeWidth="0.8" fill="var(--color-surface)"/>
                <rect x="9" y="8" width="2" height="10" rx="0.5" transform="rotate(-15 9 8)" fill="var(--color-green)"/>
                <rect x="12" y="6" width="2" height="12" rx="0.5" transform="rotate(5 12 6)" fill="var(--color-green)"/>
                <rect x="15" y="7" width="2" height="11" rx="0.5" transform="rotate(-5 15 7)" fill="var(--color-green)"/>
                <rect x="17" y="9" width="2" height="9" rx="0.5" transform="rotate(20 17 9)" fill="var(--color-green)"/>
                <circle cx="11" cy="13" r="1.8" fill="var(--color-text-1)"/>
                <circle cx="16" cy="12" r="1.6" fill="var(--color-text-1)"/>
                <ellipse cx="13.5" cy="14.5" rx="2" ry="1.4" fill="var(--color-text-1)" transform="rotate(15 13.5 14.5)"/>
                <path d="M 7 15 L 21 15 L 18 23 L 10 23 Z" fill="var(--color-accent)"/>
                <path d="M 14 17.5 L 14.5 19 L 16 19 L 14.8 19.8 L 15.2 21.2 L 14 20.4 L 12.8 21.2 L 13.2 19.8 L 12 19 L 13.5 19 Z" fill="#ffffff" opacity="0.9"/>
              </svg>
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 14, marginBottom: 12 }}>
              <div style={{ width: 32, height: 1, background: 'var(--color-border)' }} />
              <span style={LABEL}>Help grow the index</span>
              <div style={{ width: 32, height: 1, background: 'var(--color-border)' }} />
            </div>
            <h2 style={{ fontSize: 'clamp(26px, 3.4vw, 46px)', letterSpacing: '-.02em', lineHeight: 1.1, fontWeight: 200, maxWidth: '22ch', margin: '0 auto 16px' }}>
              Know what a plate costs <strong style={{ fontWeight: 500, color: 'var(--color-accent)' }}>in your town?</strong>
            </h2>
            <p style={{ maxWidth: '44ch', margin: '0 auto 36px', color: 'var(--color-text-2)', fontWeight: 300, fontSize: 14.5 }}>
              The index is community-driven. Submit pricing details from local diners in your community to build a stronger purchasing power map.
            </p>
            <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
              <a href="/submit" style={BTN_GOLD}>Submit a price</a>
              <a href="/reports" style={BTN_GHOST}>Latest Reports</a>
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
                <svg width="18" height="18" viewBox="0 0 28 28" fill="none" aria-hidden="true">
                  <circle cx="14" cy="14" r="13" stroke="var(--color-border)" strokeWidth="0.8" fill="var(--color-surface)"/>
                  <rect x="9" y="8" width="2" height="10" rx="0.5" transform="rotate(-15 9 8)" fill="var(--color-green)"/>
                  <rect x="12" y="6" width="2" height="12" rx="0.5" transform="rotate(5 12 6)" fill="var(--color-green)"/>
                  <rect x="15" y="7" width="2" height="11" rx="0.5" transform="rotate(-5 15 7)" fill="var(--color-green)"/>
                  <rect x="17" y="9" width="2" height="9" rx="0.5" transform="rotate(20 17 9)" fill="var(--color-green)"/>
                  <circle cx="11" cy="13" r="1.8" fill="var(--color-text-1)"/>
                  <circle cx="16" cy="12" r="1.6" fill="var(--color-text-1)"/>
                  <ellipse cx="13.5" cy="14.5" rx="2" ry="1.4" fill="var(--color-text-1)" transform="rotate(15 13.5 14.5)"/>
                  <path d="M 7 15 L 21 15 L 18 23 L 10 23 Z" fill="var(--color-accent)"/>
                </svg>
                The Canadian Poutine Index
              </div>
              <div>Mapping purchasing power through everyday food. Free, forever.</div>
            </div>
            <div style={{ display: 'flex', gap: 24 }}>
              {[['Communities','/cities'],['Explore','/explore'],['Reports','/reports'],['Submit','/submit'],['About','/about'],['Methodology','/methodology']].map(([l,h]) => (
                <a key={h} href={h} style={{ fontSize: 13, color: 'var(--color-text-3)', textDecoration: 'none' }}>{l}</a>
              ))}
            </div>
          </div>
          <div style={{ marginTop: 30, fontSize: 11, color: 'var(--color-text-4)' }}>
            &copy; 2026 The Canadian Poutine Index · poutine-index.vercel.app
          </div>
        </div>
      </footer>

      {/* CITY DRAWER PANEL */}
      {sel && (() => {
        const pos = pmax > pmin ? Math.max(0, Math.min(1, (sel.price_cad - pmin) / (pmax - pmin))) : 0
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
                  <div style={LABEL}>Baseline Poutine Price</div>
                  <div style={{ fontSize: 44, fontWeight: 500, color: 'var(--color-accent)', letterSpacing: '-.03em', lineHeight: 1, marginTop: 8, fontFamily: 'var(--font-display)' }}>{fmt(sel.price_cad)}</div>
                </div>

                {/* lands marker */}
                <div style={{ marginBottom: 24 }}>
                  <div style={LABEL}>Lands in Canada Spectrum</div>
                  <div style={{ position: 'relative', height: 8, borderRadius: 5, marginTop: 14, background: 'linear-gradient(90deg,var(--color-green),var(--color-text-2) 55%,var(--color-accent))' }}>
                    <div style={{ position: 'absolute', top: '50%', left: `${pos * 100}%`, transform: 'translate(-50%,-50%)', width: 14, height: 14, borderRadius: '50%', background: 'var(--color-text-1)', border: '3px solid var(--color-surface)' }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10 }}>
                    <span style={{ ...LABEL, fontSize: 9 }}>{fmt(pmin)} lowest</span>
                    <span style={{ ...LABEL, fontSize: 9 }}>highest {fmt(pmax)}</span>
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

                {/* Poutines affordable after rent */}
                {sel.bowlsAfterRent != null && maxPlates > 0 && (
                  <div style={{ marginBottom: 24 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                      <span style={LABEL}>Poutines Left After Rent</span>
                      <span style={{ ...MONO, fontSize: 14, color: 'var(--color-green)' }}>{sel.bowlsAfterRent} 🍟</span>
                    </div>
                    <div style={{ height: 6, borderRadius: 5, background: 'var(--color-bg)', marginTop: 10, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${Math.min(100, sel.bowlsAfterRent / maxPlates * 100)}%`, background: 'var(--color-green)', borderRadius: 5 }} />
                    </div>
                    <p style={{ ...LABEL, fontSize: 8.5, marginTop: 8 }}>Number of meals remaining after paying housing costs</p>
                  </div>
                )}

                {sel.blurb && <p style={{ fontSize: 13, color: 'var(--color-text-2)', lineHeight: 1.6, margin: '20px 0' }}>{sel.blurb}</p>}

                <a href={`/cities/${slug}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--color-accent)', textDecoration: 'none', borderBottom: '1px solid rgba(217,56,58,.3)', paddingBottom: 2, fontWeight: 600 }}>
                  See detailed profile →
                </a>
              </div>
            </aside>
          </>
        )
      })()}

      {/* TOOLTIP */}
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
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, color: 'var(--color-text-3)' }}>
            <span>Price:</span><b style={{ color: 'var(--color-accent)', fontWeight: 600 }}>{fmt(tip.price)}</b>
          </div>
          {tip.burden != null && (
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, color: 'var(--color-text-3)' }}>
              <span>Rent Burden:</span><b style={{ color: 'var(--color-text-1)', fontWeight: 500 }}>{tip.burden}%</b>
            </div>
          )}
          {tip.plates != null && (
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, color: 'var(--color-text-3)' }}>
              <span>Leftover:</span><b style={{ color: 'var(--color-green)', fontWeight: 600 }}>{tip.plates}</b>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
