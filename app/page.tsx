'use client'

import { useEffect, useRef, useState, type CSSProperties } from 'react'
import NavBar from './components/NavBar'
import { supabase } from '@/lib/supabase'

/* ═══════════════════════════════════════════════════════════════════
   WORLD MAP — RLE dot-matrix land mask
   168 columns × 74 rows, lat 76°N → 56°S, natural earth derived
═══════════════════════════════════════════════════════════════════ */
const LAND = [
  "1d.2,20.2,25.1,27.1,29.6,39.11,6e.3,7d.c,94.3,98.2",
  "1a.4,22.1,25.4,2a.6,3a.10,6d.2,7a.11,8e.2,95.2",
  "1a.9,25.3,2a.7,3a.10,6c.2,74.3,78.18,93.7",
  "8.a,16.3,1d.8,26.3,2c.1,30.4,3a.f,5d.5,70.1,73.2c,a3.3",
  "0.1,7.17,22.2,26.5,2c.2,30.1,32.3,3b.a,5b.c,69.1,6b.b,77.31",
  "0.5,6.2,9.23,31.3,35.2,3b.8,49.1,4c.1,5a.a,65.1,67.1,69.3f",
  "9.22,2c.2,30.6,3c.5,4a.3,59.5,5f.5,65.42",
  "7.22,2d.1,33.2,3d.3,57.5,5e.4a",
  "7.6,e.1a,30.4,3e.2,56.6,5e.3f,a0.4",
  "8.4,13.15,2f.5,35.1,57.5,5f.37,9b.1,9f.1",
  "a.1,c.1,16.13,30.7,51.2,58.1,5a.3,5e.37,9d.3",
  "8.1,16.16,30.8,52.1,58.3,5e.36,9d.3",
  "18.16,2f.b,50.1,53.1,57.40,9d.2",
  "18.16,2f.b,4f.1,52.3,56.41,9d.1",
  "18.1,1a.1b,39.1,51.1,55.42",
  "1b.1b,38.3,52.43,96.1",
  "1a.1c,53.f,63.2,66.5,6d.28,96.1",
  "1a.1d,53.7,5b.6,65.5,6c.28,96.1",
  "1a.19,50.5,59.1,5c.5,67.3,6c.25,92.1,95.2",
  "1a.18,50.5,5a.2,5d.4,63.2,67.4,6d.24",
  "1a.17,50.4,58.1,5b.1,5d.2,60.b,6d.1f,8f.1,95.1",
  "1b.15,50.4,5a.1,5e.1,61.a,6d.1e,8c.1,8f.1,95.1",
  "1b.16,54.5,65.27,8f.1,93.3",
  "1c.14,51.8,65.27,91.3",
  "1d.11,50.b,5d.2,64.29",
  "1f.f,4f.3e",
  "20.7,2d.1,4f.1c,6c.21",
  "1f.1,21.6,2e.1,4e.16,65.6,6d.1,6f.1d",
  "21.6,4d.17,65.7,70.1,73.19",
  "22.4,4c.19,66.9,74.17,8c.1",
  "23.3,2f.1,4c.19,66.a,75.8,7f.7,87.1",
  "b.1,23.4,2a.1,4c.19,67.8,76.6,80.5,87.1",
  "24.7,4c.1a,67.7,76.5,80.6,8c.1",
  "26.5,4c.1a,68.4,76.4,80.1,82.4,8c.1",
  "29.4,4c.1b,68.3,77.2,82.5,8c.1",
  "2b.2,4c.1d,77.2,82.5,8c.1",
  "2c.1,31.3,4d.1b,6a.2,77.2,84.2,8d.1",
  "2d.b,4e.1e,78.2,82.1",
  "30.9,4e.1d,79.1,82.1,8e.1",
  "30.b,4f.5,56.15,83.1,8a.1",
  "30.c,58.12,81.1,83.1,89.2",
  "2f.d,58.11,82.3,88.3",
  "2f.d,58.10,82.2,87.4",
  "2e.11,58.f,83.2,87.3,8c.1,91.2",
  "2f.13,59.e,84.1,89.1,8c.1,90.1,92.5",
  "2e.15,5a.c,94.4,9a.1",
  "2f.15,5a.c,86.3,95.4",
  "2f.15,5a.c,8b.2,8e.1,96.1,98.1",
  "30.13,5a.d,9f.1",
  "30.12,5a.d,91.3,96.1",
  "30.12,5a.d,6a.1,90.3,96.1",
  "31.11,59.e,69.2,8e.6,96.2",
  "33.f,59.c,69.2,8d.b",
  "33.e,5a.a,69.2,8d.c",
  "33.e,5a.a,68.3,8a.10",
  "33.d,5b.a,68.2,89.11",
  "33.b,5b.9,69.1,89.12",
  "33.a,5b.8,89.12",
  "33.a,5c.7,89.13",
  "33.a,5c.6,8a.11",
  "33.9,5d.5,8a.6,92.9",
  "32.9,5d.3,8a.4,93.8",
  "32.7,94.6",
  "32.7,95.5,a5.1",
  "32.5,a5.2",
  "32.5,a4.1",
  "31.5,98.1,a4.1",
  "31.5,a2.2",
  "31.3,a2.1",
  "31.4",
  "31.3",
  "31.3,38.1",
  "31.3",
  "33.2",
]
const LAND_COLS = 168, LAND_ROWS = 74, LAT_TOP = 76.0, LAT_BOT = -56.0

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
  bowlsAfterRent: number | null
}

type Tip = { city: string; country: string; price: number; burden: number | null; bowls: number | null; x: number; y: number }

const NS = 'http://www.w3.org/2000/svg'
const svgE = (tag: string, attrs: Record<string, string>) => {
  const e = document.createElementNS(NS, tag)
  Object.entries(attrs).forEach(([k, v]) => e.setAttribute(k, v))
  return e
}
const colorFor = (p: number) => p < 6 ? '#76a98c' : p < 13 ? '#c8a862' : '#c0674e'
const fmt = (n: number) => `CA$${n.toFixed(2)}`

/* ═══════════════════════════════════════════════════════════════════
   Style constants
═══════════════════════════════════════════════════════════════════ */
const WRAP: CSSProperties  = { maxWidth: 1280, margin: '0 auto', padding: '0 32px' }
const MONO: CSSProperties  = { fontFamily: "'Geist Mono', monospace" }
const LABEL: CSSProperties = { ...MONO, fontSize: 10.5, fontWeight: 400, letterSpacing: '.22em', textTransform: 'uppercase', color: '#8d8d96' }
const SEC: CSSProperties   = { padding: '130px 0' }
const CARD: CSSProperties  = { border: '1px solid #1a1a1f', borderRadius: 18, background: '#101013', overflow: 'hidden' }
const BTN_GOLD: CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 10,
  ...MONO, fontSize: 11.5, letterSpacing: '.16em', textTransform: 'uppercase',
  padding: '15px 28px', borderRadius: 100, border: '1px solid transparent',
  background: '#c8a862', color: '#171206', textDecoration: 'none', transition: '.22s',
}
const BTN_GHOST: CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 10,
  ...MONO, fontSize: 11.5, letterSpacing: '.16em', textTransform: 'uppercase',
  padding: '15px 28px', borderRadius: 100, border: '1px solid #1e1e24',
  color: '#ece9e2', textDecoration: 'none', transition: '.22s',
}

/* ═══════════════════════════════════════════════════════════════════
   Component
═══════════════════════════════════════════════════════════════════ */
export default function Home() {
  const [cities,  setCities]  = useState<CityRow[]>([])
  const [tip,     setTip]     = useState<Tip | null>(null)
  const [boardIn, setBoardIn] = useState(false)

  const mapRef    = useRef<SVGSVGElement>(null)
  const specRef   = useRef<SVGSVGElement>(null)
  const scatRef   = useRef<SVGSVGElement>(null)
  const boardRef  = useRef<HTMLDivElement>(null)

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

  /* ── World map ─────────────────────────────────────────────────── */
  useEffect(() => {
    const svg = mapRef.current
    if (!svg || !cities.length) return
    const draw = () => {
      svg.innerHTML = ''
      const W = svg.clientWidth || 1200
      const cell = W / LAND_COLS, H = cell * LAND_ROWS
      svg.setAttribute('viewBox', `0 0 ${W} ${H}`)
      svg.style.height = 'auto'
      const proj = (lat: number, lon: number): [number, number] => [
        (lon + 180) / 360 * W,
        (LAT_TOP - lat) / (LAT_TOP - LAT_BOT) * H,
      ]
      const dots = svgE('g', { fill: '#26262d' })
      LAND.forEach((row, ry) => {
        if (!row) return
        row.split(',').forEach(run => {
          const [sh, lh] = run.split('.')
          const s = parseInt(sh, 16), l = parseInt(lh, 16)
          for (let i = 0; i < l; i++) {
            dots.appendChild(svgE('circle', {
              cx: String((s + i + 0.5) * cell),
              cy: String((ry + 0.5) * cell),
              r:  String(Math.max(1.1, cell * 0.22)),
            }))
          }
        })
      })
      svg.appendChild(dots)
      const sorted = [...cities].sort((a, b) => (a.latitude ?? 0) - (b.latitude ?? 0))
      sorted.forEach((c, idx) => {
        if (!c.latitude || !c.longitude) return
        const [gx, gy] = proj(c.latitude, c.longitude)
        const col = colorFor(c.price_cad)
        svg.appendChild(svgE('circle', { cx: String(gx), cy: String(gy), r: String(cell * 1.6), fill: col, opacity: '0.07' }))
        const g = svgE('g', { class: 'grain', transform: `translate(${gx},${gy})` }) as SVGGElement
        const grain = svgE('ellipse', {
          rx: String(Math.max(5, cell * 0.85)), ry: String(Math.max(2.8, cell * 0.47)),
          fill: col, opacity: '0',
          transform: `rotate(${(idx * 37) % 70 - 35})`,
          stroke: '#0a0a0c', 'stroke-width': '1',
        })
        g.appendChild(grain)
        svg.appendChild(g)
        grain.animate([{ opacity: 0 }, { opacity: .95 }], { duration: 500, delay: 200 + idx * 45, fill: 'forwards', easing: 'ease-out' })
        g.addEventListener('mousemove', (ev: Event) => {
          const me = ev as MouseEvent
          setTip({ city: c.city, country: c.country ?? '', price: c.price_cad, burden: c.rentBurden, bowls: c.bowlsAfterRent, x: me.clientX, y: me.clientY })
        })
        g.addEventListener('mouseleave', () => setTip(null))
      })
      // floor / ceiling callouts
      const floor = cities[0], ceil = cities[cities.length - 1]
      ;[floor, ceil].forEach((d, k) => {
        if (!d?.latitude || !d?.longitude) return
        const [gx, gy] = proj(d.latitude, d.longitude)
        const ly = gy - 32, lx = gx + (k === 0 ? 14 : 18)
        svg.appendChild(svgE('line', { x1: String(gx), y1: String(gy - 6), x2: String(lx), y2: String(ly + 6), stroke: colorFor(d.price_cad), 'stroke-opacity': '.5' }))
        const t = svgE('text', { x: String(lx + 4), y: String(ly + 4), 'font-family': 'Geist Mono, monospace', 'font-size': '10', 'letter-spacing': '1.5', fill: colorFor(d.price_cad) })
        t.textContent = `${d.city.toUpperCase()} ${fmt(d.price_cad)} · ${k === 0 ? 'FLOOR' : 'CEILING'}`
        svg.appendChild(t)
      })
    }
    draw()
    const ro = new ResizeObserver(() => { clearTimeout((svg as any)._t); (svg as any)._t = setTimeout(draw, 180) })
    ro.observe(svg)
    return () => ro.disconnect()
  }, [cities])

  /* ── Spectrum strip plot ───────────────────────────────────────── */
  useEffect(() => {
    const svg = specRef.current
    if (!svg || !cities.length) return
    const PMIN = cities[0].price_cad, PMAX = cities[cities.length - 1].price_cad
    const draw = () => {
      svg.innerHTML = ''
      const W = svg.clientWidth || 1100, H = 230, px = 20, axY = H - 44
      svg.setAttribute('viewBox', `0 0 ${W} ${H}`)
      const x = (p: number) => px + ((p - PMIN) / (PMAX - PMIN)) * (W - px * 2)
      svg.appendChild(svgE('line', { x1: String(px), x2: String(W - px), y1: String(axY), y2: String(axY), stroke: '#222228' }))
      for (let t = 2; t <= 22; t += 2) {
        const tx = x(t)
        svg.appendChild(svgE('line', { x1: String(tx), x2: String(tx), y1: String(axY - 3), y2: String(axY + 3), stroke: '#2a2a31' }))
        const txt = svgE('text', { x: String(tx), y: String(axY + 24), 'text-anchor': 'middle', 'font-family': 'Geist Mono, monospace', 'font-size': '9.5', fill: '#55555e', 'letter-spacing': '1' })
        txt.textContent = '$' + t
        svg.appendChild(txt)
      }
      cities.forEach((c, idx) => {
        const gx = x(c.price_cad), jitter = ((idx * 73) % 5 - 2) * 15, gy = axY - 44 + jitter
        svg.appendChild(svgE('line', { x1: String(gx), x2: String(gx), y1: String(gy), y2: String(axY - 1), stroke: colorFor(c.price_cad), 'stroke-opacity': '.12' }))
        const g = svgE('g', { class: 'grain', transform: `translate(${gx},${gy})` }) as SVGGElement
        const grain = svgE('ellipse', { rx: '7.5', ry: '4', fill: colorFor(c.price_cad), opacity: '0', transform: `rotate(${(idx * 37) % 70 - 35})` })
        g.appendChild(grain)
        svg.appendChild(g)
        grain.animate([{ opacity: 0 }, { opacity: .92 }], { duration: 420, delay: idx * 32, fill: 'forwards', easing: 'ease-out' })
        g.addEventListener('mousemove', (ev: Event) => {
          const me = ev as MouseEvent
          setTip({ city: c.city, country: c.country ?? '', price: c.price_cad, burden: c.rentBurden, bowls: c.bowlsAfterRent, x: me.clientX, y: me.clientY })
        })
        g.addEventListener('mouseleave', () => setTip(null))
      })
      ;[['FLOOR', cities[0], 'start'], ['CEILING', cities[cities.length - 1], 'end']].forEach(([label, d, anchor]) => {
        const fx = x((d as CityRow).price_cad)
        const t = svgE('text', { x: String(fx), y: '22', 'text-anchor': anchor as string, 'font-family': 'Geist Mono, monospace', 'font-size': '10', 'letter-spacing': '1.5', fill: colorFor((d as CityRow).price_cad) })
        t.textContent = `${(d as CityRow).city.toUpperCase()} ${fmt((d as CityRow).price_cad)} · ${label}`
        svg.appendChild(t)
        svg.appendChild(svgE('line', { x1: String(fx), x2: String(fx), y1: '30', y2: String(axY - 2), stroke: colorFor((d as CityRow).price_cad), 'stroke-opacity': '.3', 'stroke-dasharray': '2 5' }))
      })
    }
    draw()
    const ro = new ResizeObserver(() => { clearTimeout((svg as any)._t); (svg as any)._t = setTimeout(draw, 180) })
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
    const NOTABLE = ['London','Karachi','Hong Kong','Singapore','Buenos Aires','Vancouver','Los Angeles','Tokyo']
    const draw = () => {
      svg.innerHTML = ''
      const W = svg.clientWidth || 1100, H = 480, m = { t: 28, r: 28, b: 56, l: 72 }
      svg.setAttribute('viewBox', `0 0 ${W} ${H}`)
      const bVals = data.map(c => c.rentBurden), yVals = data.map(c => c.bowlsAfterRent)
      const bmin = Math.min(...bVals), bmax = Math.max(...bVals)
      const ymax = Math.max(...yVals)
      const xS = (v: number) => m.l + (v - bmin) / (bmax - bmin) * (W - m.l - m.r)
      const yS = (v: number) => H - m.b - (Math.min(v, ymax) / ymax) * (H - m.t - m.b)
      const step = Math.max(10, Math.round((bmax - bmin) / 5 / 5) * 5)
      for (let v = Math.ceil(bmin / step) * step; v <= bmax; v += step) {
        svg.appendChild(svgE('line', { x1: String(xS(v)), x2: String(xS(v)), y1: String(m.t), y2: String(H - m.b), stroke: '#1a1a1f', 'stroke-dasharray': '1 6' }))
        const t = svgE('text', { x: String(xS(v)), y: String(H - m.b + 22), 'text-anchor': 'middle', 'font-family': 'Geist Mono, monospace', 'font-size': '9.5', fill: '#55555e', 'letter-spacing': '1' })
        t.textContent = v + '%'
        svg.appendChild(t)
      }
      const yStep = Math.max(50, Math.ceil(ymax / 6 / 50) * 50)
      for (let v = 0; v <= ymax; v += yStep) {
        svg.appendChild(svgE('line', { x1: String(m.l), x2: String(W - m.r), y1: String(yS(v)), y2: String(yS(v)), stroke: '#1a1a1f', 'stroke-dasharray': '1 6' }))
        const t = svgE('text', { x: String(m.l - 12), y: String(yS(v) + 3.5), 'text-anchor': 'end', 'font-family': 'Geist Mono, monospace', 'font-size': '9.5', fill: '#55555e', 'letter-spacing': '1' })
        t.textContent = String(v)
        svg.appendChild(t)
      }
      const xt = svgE('text', { x: String((m.l + W - m.r) / 2), y: String(H - 10), 'text-anchor': 'middle', 'font-family': 'Geist Mono, monospace', 'font-size': '9.5', fill: '#55555e', 'letter-spacing': '1.5' })
      xt.textContent = 'Rent burden — share of average paycheck'
      svg.appendChild(xt)
      const yt = svgE('text', { transform: `translate(14 ${(m.t + H - m.b) / 2}) rotate(-90)`, 'text-anchor': 'middle', 'font-family': 'Geist Mono, monospace', 'font-size': '9.5', fill: '#55555e', 'letter-spacing': '1.5' })
      yt.textContent = 'Bowls affordable after rent / month'
      svg.appendChild(yt)
      data.forEach((c, idx) => {
        const gx = xS(c.rentBurden), gy = yS(c.bowlsAfterRent)
        const g = svgE('g', { class: 'grain', transform: `translate(${gx},${gy})` }) as SVGGElement
        const rs = 5 + (c.price_cad - PMIN) / (PMAX - PMIN) * 8
        const grain = svgE('ellipse', { rx: String(rs), ry: String(rs * 0.55), fill: colorFor(c.price_cad), opacity: '.9', stroke: '#0a0a0c', 'stroke-width': '1', transform: `rotate(${(idx * 41) % 70 - 35})` })
        g.appendChild(grain)
        svg.appendChild(g)
        if (NOTABLE.includes(c.city)) {
          const t = svgE('text', { x: String(gx + rs + 7), y: String(gy + 3.5), 'font-family': 'Geist Mono, monospace', 'font-size': '9.5', fill: '#8d8d96', 'letter-spacing': '1' })
          t.textContent = c.city.toUpperCase()
          svg.appendChild(t)
        }
        g.addEventListener('mousemove', (ev: Event) => {
          const me = ev as MouseEvent
          setTip({ city: c.city, country: c.country ?? '', price: c.price_cad, burden: c.rentBurden, bowls: c.bowlsAfterRent, x: me.clientX, y: me.clientY })
        })
        g.addEventListener('mouseleave', () => setTip(null))
      })
    }
    draw()
    const ro = new ResizeObserver(() => { clearTimeout((svg as any)._t); (svg as any)._t = setTimeout(draw, 180) })
    ro.observe(svg)
    return () => ro.disconnect()
  }, [cities])

  /* ── Leaderboard reveal ────────────────────────────────────────── */
  useEffect(() => {
    const el = boardRef.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setBoardIn(true); io.disconnect() } }, { threshold: 0.2 })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  /* ── Derived data ──────────────────────────────────────────────── */
  const pmin     = cities[0]?.price_cad ?? 2.51
  const pmax     = cities[cities.length - 1]?.price_cad ?? 21.88
  const spread   = cities.length >= 2 ? pmax / pmin : 8.8
  const cheapTop = cities.slice(0, 8)
  const priceTop = [...cities].slice(-8).reverse()

  return (
    <div style={{ background: '#0a0a0c', color: '#ece9e2', fontFamily: "'Geist', system-ui, sans-serif", overflowX: 'hidden', WebkitFontSmoothing: 'antialiased' }}>
      <style>{`
        .grain{cursor:pointer}
        .grain ellipse,.grain circle{transform-box:fill-box;transform-origin:center;transition:transform .25s cubic-bezier(.2,.8,.2,1)}
        .grain:hover ellipse,.grain:hover circle{transform:scale(1.5)!important}
        .reveal{opacity:0;transform:translateY(24px);transition:opacity .8s ease,transform .8s cubic-bezier(.2,.8,.2,1)}
        .reveal.in{opacity:1;transform:none}
        @media(prefers-reduced-motion:reduce){.reveal{opacity:1;transform:none;transition:none}}
        @media(max-width:760px){.stats-grid{grid-template-columns:1fr 1fr!important} .board-grid{grid-template-columns:1fr!important} .metrics-grid{grid-template-columns:1fr!important} .method-grid{grid-template-columns:1fr!important;gap:50px!important}}
        @media(max-width:880px){.board-grid{grid-template-columns:1fr!important}.metrics-grid{grid-template-columns:1fr!important}}
      `}</style>

      <NavBar fixed />

      {/* ════════════════════════════════════════════════════════════
          HERO
      ════════════════════════════════════════════════════════════ */}
      <header style={{ paddingTop: 110 }}>
        <div style={WRAP}>
          {/* Eyebrow */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 34 }}>
            <div style={{ width: 40, height: 1, background: '#c8a862', opacity: .6 }} />
            <span style={{ ...LABEL, color: '#c8a862' }}>Forty cities · Food-based affordability index</span>
          </div>

          <h1 style={{ fontSize: 'clamp(44px,6.4vw,92px)', lineHeight: 1.02, letterSpacing: '-.025em', fontWeight: 200, maxWidth: '18ch', margin: '0 0 30px' }}>
            One dish, priced in forty cities.<br />
            <strong style={{ fontWeight: 500 }}>The cost of living, made legible.</strong>
          </h1>

          <p style={{ maxWidth: '54ch', color: '#8d8d96', fontSize: 17, fontWeight: 300, lineHeight: 1.65, margin: '0 0 44px' }}>
            A bowl of egg fried rice costs <strong style={{ color: '#ece9e2', fontWeight: 400 }}>CA$2.51</strong> in one city and{' '}
            <strong style={{ color: '#ece9e2', fontWeight: 400 }}>CA$21.88</strong> in another.
            The index tracks that gap and what restaurant pricing quietly reveals about rent, wages, and who can afford to live where.
          </p>

          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <a href="/cities" style={BTN_GOLD}>Browse the index</a>
            <a href="/methodology" style={BTN_GHOST}>Methodology</a>
          </div>
        </div>

        {/* ── World map ──────────────────────────────────────────── */}
        <div style={{ marginTop: 90 }}>
          <div style={{ ...WRAP, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', paddingBottom: 22, flexWrap: 'wrap', gap: 10 }}>
            <span style={{ ...LABEL, color: '#ece9e2' }}>The atlas — every indexed city</span>
            <span style={LABEL}>Hover a grain · baseline price, CAD</span>
          </div>
          <div style={{ borderTop: '1px solid #1a1a1f', borderBottom: '1px solid #1a1a1f', background: 'radial-gradient(1200px 500px at 50% 0%, rgba(200,168,98,.04), transparent 65%)' }}>
            <div style={{ ...WRAP, paddingTop: 34, paddingBottom: 34 }}>
              <svg ref={mapRef} role="img" aria-label="World map of fried rice prices across 40 cities" style={{ display: 'block', width: '100%', height: 'auto' }} />
            </div>
          </div>
        </div>

        {/* ── Stats strip ────────────────────────────────────────── */}
        <div style={{ ...WRAP, borderBottom: '1px solid #1a1a1f' }}>
          <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)' }}>
            {[
              { prefix: '',     val: cities.length || 40, dec: 0, suffix: '',  label: 'Cities indexed' },
              { prefix: 'CA$', val: pmin,                 dec: 2, suffix: '',  label: 'Cheapest baseline' },
              { prefix: 'CA$', val: pmax,                 dec: 2, suffix: '',  label: 'Most expensive' },
              { prefix: '',     val: spread,              dec: 1, suffix: '×', label: 'Price spread' },
            ].map((s, i) => (
              <div key={s.label} style={{ padding: '42px 30px', borderLeft: i > 0 ? '1px solid #1a1a1f' : 'none', paddingLeft: i === 0 ? 0 : 30 }}>
                <div style={{ fontWeight: 200, fontSize: 'clamp(30px,3.2vw,46px)', letterSpacing: '-.02em', fontVariantNumeric: 'tabular-nums' }}>
                  {s.prefix && <span style={{ fontSize: '.45em', color: '#8d8d96', fontWeight: 300, letterSpacing: '.04em', verticalAlign: '.5em', marginRight: 2 }}>{s.prefix}</span>}
                  {s.val.toFixed(s.dec)}
                  {s.suffix && <span style={{ fontSize: '.45em', color: '#8d8d96', fontWeight: 300, letterSpacing: '.04em', verticalAlign: '.5em', marginLeft: 2 }}>{s.suffix}</span>}
                </div>
                <div style={{ ...LABEL, marginTop: 10 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </header>

      {/* ════════════════════════════════════════════════════════════
          SPECTRUM
      ════════════════════════════════════════════════════════════ */}
      <section style={SEC} id="spectrum">
        <div style={WRAP}>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 40, marginBottom: 64, flexWrap: 'wrap' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
                <div style={{ width: 32, height: 1, background: '#c8a862', opacity: .6 }} />
                <span style={{ ...LABEL, color: '#c8a862' }}>The spectrum</span>
              </div>
              <h2 style={{ fontSize: 'clamp(30px,3.8vw,52px)', letterSpacing: '-.02em', lineHeight: 1.08, fontWeight: 200, maxWidth: '22ch', margin: 0 }}>
                Forty prices. <strong style={{ fontWeight: 500 }}>One axis.</strong>
              </h2>
            </div>
            <p style={{ maxWidth: '40ch', color: '#8d8d96', fontWeight: 300, fontSize: 15.5 }}>
              Every indexed city placed on a single price line. The clustering is the story, and so are the outliers.
            </p>
          </div>
          <div style={{ ...CARD, padding: '40px 36px 28px' }}>
            <svg ref={specRef} role="img" aria-label="Strip plot of fried rice prices across 40 cities" style={{ display: 'block', width: '100%', height: 230 }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 18, borderTop: '1px solid #1a1a1f', marginTop: 10, flexWrap: 'wrap', gap: 8 }}>
              <span style={LABEL}>Baseline price, egg fried rice · CAD</span>
              <span style={LABEL}>Median of local venues per city</span>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════
          WHAT WE TRACK
      ════════════════════════════════════════════════════════════ */}
      <section style={{ ...SEC, paddingTop: 0 }} id="tracks">
        <div style={WRAP}>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 40, marginBottom: 64, flexWrap: 'wrap' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
                <div style={{ width: 32, height: 1, background: '#c8a862', opacity: .6 }} />
                <span style={{ ...LABEL, color: '#c8a862' }}>What the index tracks</span>
              </div>
              <h2 style={{ fontSize: 'clamp(30px,3.8vw,52px)', letterSpacing: '-.02em', lineHeight: 1.08, fontWeight: 200, maxWidth: '22ch', margin: 0 }}>
                Three numbers, <strong style={{ fontWeight: 500 }}>one dish.</strong>
              </h2>
            </div>
            <p style={{ maxWidth: '40ch', color: '#8d8d96', fontWeight: 300, fontSize: 15.5 }}>
              Macro indicators average away the lives of the people they describe. A bowl of fried rice doesn&apos;t.
            </p>
          </div>

          <div className="metrics-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 1, background: '#1a1a1f', border: '1px solid #1a1a1f', borderRadius: 18, overflow: 'hidden' }}>
            {/* M·01 — Baseline price */}
            <div style={{ background: '#101013', padding: '44px 38px', position: 'relative' }}>
              <span style={{ ...LABEL, position: 'absolute', top: 28, right: 30, color: '#55555e' }}>M·01</span>
              <div style={{ height: 118, marginBottom: 30 }}>
                <svg viewBox="0 0 280 118" width="100%" height="100%" aria-hidden="true">
                  <line x1="14" y1="92" x2="266" y2="92" stroke="#222228"/>
                  <text x="14" y="110" fontFamily="Geist Mono" fontSize="8.5" fill="#8d8d96" letterSpacing="1">$0</text>
                  <text x="250" y="110" fontFamily="Geist Mono" fontSize="8.5" fill="#8d8d96" letterSpacing="1">$22</text>
                  <ellipse cx="40"  cy="82" rx="8" ry="4.4" fill="#76a98c" transform="rotate(-16 40 82)"/>
                  <ellipse cx="118" cy="68" rx="8" ry="4.4" fill="#c8a862" transform="rotate(8 118 68)"/>
                  <ellipse cx="226" cy="40" rx="8" ry="4.4" fill="#c0674e" transform="rotate(-10 226 40)"/>
                  <path d="M40 82 C 88 80, 96 70, 118 68 S 196 52, 226 40" stroke="#2c2c33" strokeDasharray="2 5" fill="none"/>
                  <text x="226" y="24" fontFamily="Geist Mono" fontSize="9.5" fill="#c0674e" textAnchor="middle">{pmax > 0 ? fmt(pmax) : 'CA$21.88'}</text>
                  <text x="40"  y="66" fontFamily="Geist Mono" fontSize="9.5" fill="#76a98c" textAnchor="middle">{pmin > 0 ? fmt(pmin) : 'CA$2.51'}</text>
                </svg>
              </div>
              <h3 style={{ fontSize: 19, letterSpacing: '-.01em', marginBottom: 12, fontWeight: 500 }}>Baseline price</h3>
              <p style={{ color: '#8d8d96', fontSize: 14.5, fontWeight: 300 }}>What you&apos;d pay at a regular local restaurant. The local rate, no tourist markup, no hotel surcharge.</p>
            </div>

            {/* M·02 — Rent burden */}
            <div style={{ background: '#101013', padding: '44px 38px', position: 'relative' }}>
              <span style={{ ...LABEL, position: 'absolute', top: 28, right: 30, color: '#55555e' }}>M·02</span>
              <div style={{ height: 118, marginBottom: 30 }}>
                <svg viewBox="0 0 280 118" width="100%" height="100%" aria-hidden="true">
                  <g transform="translate(140,114)">
                    <path d="M -94 0 A 94 94 0 0 1 94 0" fill="none" stroke="#222228" strokeWidth="6"/>
                    <path d="M -94 0 A 94 94 0 0 1 91 -23" fill="none" stroke="#c0674e" strokeWidth="6" strokeLinecap="round"/>
                    <text x="0" y="-30" fontFamily="Geist" fontWeight="300" fontSize="30" fill="#ece9e2" textAnchor="middle">92%</text>
                    <text x="0" y="-10" fontFamily="Geist Mono" fontSize="8" fill="#8d8d96" textAnchor="middle" letterSpacing="2">RENT · WORST CASE</text>
                  </g>
                </svg>
              </div>
              <h3 style={{ fontSize: 19, letterSpacing: '-.01em', marginBottom: 12, fontWeight: 500 }}>Rent burden</h3>
              <p style={{ color: '#8d8d96', fontSize: 14.5, fontWeight: 300 }}>How much of the average paycheck goes to rent before a dollar is spent on food. In some indexed cities, it&apos;s most of it.</p>
            </div>

            {/* M·03 — Bowls after rent */}
            <div style={{ background: '#101013', padding: '44px 38px', position: 'relative' }}>
              <span style={{ ...LABEL, position: 'absolute', top: 28, right: 30, color: '#55555e' }}>M·03</span>
              <div style={{ height: 118, marginBottom: 30 }}>
                <svg viewBox="0 0 280 118" width="100%" height="100%" aria-hidden="true">
                  {/* Cheap city row */}
                  <text x="14" y="28" fontFamily="Geist Mono" fontSize="8" fill="#8d8d96" letterSpacing="2">KARACHI</text>
                  {[...Array(12)].map((_, i) => (
                    <ellipse key={i} cx={22 + i * 20} cy={42} rx="6.5" ry="3.6" transform={`rotate(${(i * 31) % 50 - 25} ${22 + i * 20} 42)`} fill="#76a98c" opacity=".9"/>
                  ))}
                  {/* Expensive city row */}
                  <text x="14" y="76" fontFamily="Geist Mono" fontSize="8" fill="#8d8d96" letterSpacing="2">LONDON</text>
                  {[...Array(3)].map((_, i) => (
                    <ellipse key={i} cx={22 + i * 20} cy={90} rx="6.5" ry="3.6" transform={`rotate(${(i * 31) % 50 - 25} ${22 + i * 20} 90)`} fill="#c0674e" opacity=".9"/>
                  ))}
                  <text x="14" y="112" fontFamily="Geist Mono" fontSize="8" fill="#8d8d96" letterSpacing="1">ONE GRAIN = 1 BOWL OF DISPOSABLE INCOME</text>
                </svg>
              </div>
              <h3 style={{ fontSize: 19, letterSpacing: '-.01em', marginBottom: 12, fontWeight: 500 }}>Bowls after rent</h3>
              <p style={{ color: '#8d8d96', fontSize: 14.5, fontWeight: 300 }}>Once rent is paid, how many bowls can a median earner afford per month? The most direct affordability signal in the index.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════
          LEADERBOARD
      ════════════════════════════════════════════════════════════ */}
      <section style={{ ...SEC, paddingTop: 0 }} id="board">
        <div style={WRAP}>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 40, marginBottom: 64, flexWrap: 'wrap' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
                <div style={{ width: 32, height: 1, background: '#c8a862', opacity: .6 }} />
                <span style={{ ...LABEL, color: '#c8a862' }}>The leaderboard</span>
              </div>
              <h2 style={{ fontSize: 'clamp(30px,3.8vw,52px)', letterSpacing: '-.02em', lineHeight: 1.08, fontWeight: 200, maxWidth: '22ch', margin: 0 }}>
                An {spread.toFixed(1)}× gap, <strong style={{ fontWeight: 500 }}>grain by grain.</strong>
              </h2>
            </div>
            <p style={{ maxWidth: '40ch', color: '#8d8d96', fontWeight: 300, fontSize: 15.5 }}>
              The same dish. The same portion. A price difference of over {Math.floor(spread)} times between the floor and the ceiling of the index.
            </p>
          </div>

          <div ref={boardRef} className="board-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, background: '#1a1a1f', border: '1px solid #1a1a1f', borderRadius: 18, overflow: 'hidden' }}>
            {/* Cheapest */}
            <div style={{ background: '#101013', padding: '40px 38px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 30 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#76a98c' }} />
                <span style={{ ...LABEL, color: '#ece9e2' }}>Lowest baselines · CAD</span>
              </div>
              {cheapTop.map((c, i) => (
                <div key={c.city} style={{ display: 'grid', gridTemplateColumns: '30px 1fr auto', alignItems: 'center', gap: 16, padding: '12px 0', borderBottom: i < cheapTop.length - 1 ? '1px solid #1a1a1f' : 'none' }}>
                  <span style={{ ...MONO, fontSize: 10, color: '#55555e', letterSpacing: '.1em' }}>{String(i + 1).padStart(2, '0')}</span>
                  <span style={{ fontSize: 14.5 }}>
                    {c.city}
                    <small style={{ display: 'block', ...MONO, fontSize: 9.5, color: '#8d8d96', letterSpacing: '.12em', fontWeight: 300, marginTop: 2 }}>
                      {c.country} · {c.bowlsAfterRent != null ? c.bowlsAfterRent.toLocaleString() + ' BOWLS AFTER RENT' : ''}
                    </small>
                  </span>
                  <span style={{ position: 'relative', height: 22, width: 'min(34vw,280px)', display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                    <span style={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)', height: 2, background: '#76a98c', width: boardIn ? `${(c.price_cad / pmax * 100).toFixed(1)}%` : '0%', transition: `width 1.2s cubic-bezier(.2,.8,.2,1) ${i * 60}ms` }} />
                    <span style={{ position: 'relative', ...MONO, fontSize: 12, background: '#101013', paddingLeft: 10, fontVariantNumeric: 'tabular-nums' }}>{fmt(c.price_cad)}</span>
                  </span>
                </div>
              ))}
            </div>

            {/* Priciest */}
            <div style={{ background: '#101013', padding: '40px 38px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 30 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#c0674e' }} />
                <span style={{ ...LABEL, color: '#ece9e2' }}>Highest baselines · CAD</span>
              </div>
              {priceTop.map((c, i) => (
                <div key={c.city} style={{ display: 'grid', gridTemplateColumns: '30px 1fr auto', alignItems: 'center', gap: 16, padding: '12px 0', borderBottom: i < priceTop.length - 1 ? '1px solid #1a1a1f' : 'none' }}>
                  <span style={{ ...MONO, fontSize: 10, color: '#55555e', letterSpacing: '.1em' }}>{String(i + 1).padStart(2, '0')}</span>
                  <span style={{ fontSize: 14.5 }}>
                    {c.city}
                    <small style={{ display: 'block', ...MONO, fontSize: 9.5, color: '#8d8d96', letterSpacing: '.12em', fontWeight: 300, marginTop: 2 }}>
                      {c.country} · {c.bowlsAfterRent != null ? c.bowlsAfterRent.toLocaleString() + ' BOWLS AFTER RENT' : ''}
                    </small>
                  </span>
                  <span style={{ position: 'relative', height: 22, width: 'min(34vw,280px)', display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                    <span style={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)', height: 2, background: '#c0674e', width: boardIn ? `${(c.price_cad / pmax * 100).toFixed(1)}%` : '0%', transition: `width 1.2s cubic-bezier(.2,.8,.2,1) ${i * 60}ms` }} />
                    <span style={{ position: 'relative', ...MONO, fontSize: 12, background: '#101013', paddingLeft: 10, fontVariantNumeric: 'tabular-nums' }}>{fmt(c.price_cad)}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════
          SCATTER — Affordability map
      ════════════════════════════════════════════════════════════ */}
      <section style={{ ...SEC, paddingTop: 0 }} id="scatter">
        <div style={WRAP}>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 40, marginBottom: 64, flexWrap: 'wrap' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
                <div style={{ width: 32, height: 1, background: '#c8a862', opacity: .6 }} />
                <span style={{ ...LABEL, color: '#c8a862' }}>The affordability map</span>
              </div>
              <h2 style={{ fontSize: 'clamp(30px,3.8vw,52px)', letterSpacing: '-.02em', lineHeight: 1.08, fontWeight: 200, maxWidth: '22ch', margin: 0 }}>
                Rent eats first. <strong style={{ fontWeight: 500 }}>Then you do.</strong>
              </h2>
            </div>
            <p style={{ maxWidth: '40ch', color: '#8d8d96', fontWeight: 300, fontSize: 15.5 }}>
              Each grain is a city. Further right, more of the average paycheck goes to rent. Higher up, more bowls remain.
            </p>
          </div>
          <div style={{ ...CARD, padding: '40px 36px' }}>
            <svg ref={scatRef} role="img" aria-label="Scatter plot of rent burden versus bowls affordable after rent, by city" style={{ display: 'block', width: '100%', height: 480 }} />
            <div style={{ display: 'flex', gap: 30, marginTop: 24, flexWrap: 'wrap' }}>
              {[['#76a98c','Bowl under CA$6'],['#c8a862','CA$6 to CA$13'],['#c0674e','Over CA$13']].map(([col, label]) => (
                <span key={label} style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ width: 16, height: 2, display: 'inline-block', background: col }} />
                  <span style={LABEL}>{label}</span>
                </span>
              ))}
              <span style={{ ...LABEL, marginLeft: 'auto' }}>Grain size proportional to baseline price</span>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════
          METHODOLOGY
      ════════════════════════════════════════════════════════════ */}
      <section style={{ ...SEC, borderTop: '1px solid #1a1a1f' }} id="method">
        <div style={WRAP}>
          <div className="method-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 90, alignItems: 'start' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
                <div style={{ width: 32, height: 1, background: '#c8a862', opacity: .6 }} />
                <span style={{ ...LABEL, color: '#c8a862' }}>Methodology</span>
              </div>
              <h2 style={{ fontSize: 'clamp(30px,3.8vw,52px)', letterSpacing: '-.02em', lineHeight: 1.08, fontWeight: 200, maxWidth: '22ch', margin: '0 0 22px' }}>
                Boring on purpose. <strong style={{ fontWeight: 500 }}>Rigorous by design.</strong>
              </h2>
              <p style={{ color: '#8d8d96', maxWidth: '48ch', fontWeight: 300, fontSize: 15 }}>
                Novel indexes live or die on their discipline. Every price in the index passes the same four gates before it is published, and every rejected submission is logged.
              </p>
              <div style={{ display: 'flex', gap: 16, marginTop: 40, flexWrap: 'wrap' }}>
                <a href="/methodology" style={BTN_GHOST}>Read the full methodology</a>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {[
                { n: '01', title: 'Standard dish definition', body: 'Plain egg fried rice, single portion, dine-in or equivalent takeout. No protein add-ons, no combo pricing.' },
                { n: '02', title: 'Local-market sampling',    body: 'Prices come from regular neighbourhood restaurants. Median of multiple venues, tourist districts excluded.' },
                { n: '03', title: 'Currency normalisation',  body: 'All prices converted to CAD at a fixed monthly reference rate, so cities compare on the same day\'s terms.' },
                { n: '04', title: 'Cross-checks and review', body: 'Submissions are verified against independent sources before entering the index. Outliers are flagged, not averaged in.' },
              ].map((step, i) => (
                <div key={step.n} style={{ display: 'flex', gap: 26, padding: '26px 0', borderBottom: i < 3 ? '1px solid #1a1a1f' : 'none', paddingTop: i === 0 ? 6 : 26 }}>
                  <span style={{ ...MONO, fontSize: 10.5, color: '#c8a862', paddingTop: 5, flexShrink: 0, letterSpacing: '.15em' }}>{step.n}</span>
                  <div>
                    <h4 style={{ fontSize: 16.5, fontWeight: 500, marginBottom: 6 }}>{step.title}</h4>
                    <p style={{ fontSize: 14, color: '#8d8d96', fontWeight: 300 }}>{step.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════
          SUBMIT CTA
      ════════════════════════════════════════════════════════════ */}
      <section style={{ ...SEC, paddingTop: 0 }} id="submit">
        <div style={WRAP}>
          <div style={{ border: '1px solid #1a1a1f', borderRadius: 22, background: 'radial-gradient(900px 400px at 50% -30%, rgba(200,168,98,.08), transparent 60%), #101013', padding: '90px 60px', textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 14, marginBottom: 18 }}>
              <div style={{ width: 32, height: 1, background: '#c8a862', opacity: .6 }} />
              <span style={{ ...LABEL, color: '#c8a862' }}>Open data · community sourced</span>
              <div style={{ width: 32, height: 1, background: '#c8a862', opacity: .6 }} />
            </div>
            <h2 style={{ fontSize: 'clamp(30px,3.8vw,52px)', letterSpacing: '-.02em', lineHeight: 1.08, fontWeight: 200, maxWidth: '22ch', margin: '0 auto 20px' }}>
              Know what a bowl costs <strong style={{ fontWeight: 500 }}>where you live?</strong>
            </h2>
            <p style={{ maxWidth: '46ch', margin: '0 auto 44px', color: '#8d8d96', fontWeight: 300 }}>
              The index grows one verified price at a time. Submit a price from your city and help map affordability for everyone.
            </p>
            <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
              <a href="/submit"  style={BTN_GOLD}>Submit a price</a>
              <a href="/reports" style={BTN_GHOST}>Latest report</a>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════
          FOOTER
      ════════════════════════════════════════════════════════════ */}
      <footer style={{ borderTop: '1px solid #1a1a1f', padding: '64px 0 48px', color: '#8d8d96', fontSize: 14, fontWeight: 300 }}>
        <div style={WRAP}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 30, flexWrap: 'wrap', alignItems: 'flex-start' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontWeight: 500, fontSize: 14.5, color: '#ece9e2', marginBottom: 10 }}>
                <svg width="18" height="18" viewBox="0 0 26 26" fill="none" aria-hidden="true">
                  <circle cx="13" cy="13" r="11.5" stroke="#c8a862" strokeWidth="1"/>
                  <ellipse cx="10" cy="11.5" rx="3" ry="1.6" fill="#c8a862" transform="rotate(-22 10 11.5)"/>
                  <ellipse cx="16" cy="14"   rx="3" ry="1.6" fill="#ece9e2" transform="rotate(16 16 14)"/>
                  <ellipse cx="11.5" cy="16.5" rx="3" ry="1.6" fill="#76a98c" transform="rotate(-6 11.5 16.5)"/>
                </svg>
                The Fried Rice Index
              </div>
              <div>A food-based affordability index. Free, forever.</div>
            </div>
            <div style={{ display: 'flex', gap: 28 }}>
              {[['Cities','/cities'],['Reports','/reports'],['Submit','/submit'],['About','/about'],['Methodology','/methodology']].map(([l,h]) => (
                <a key={h} href={h} style={{ ...MONO, fontSize: 10.5, letterSpacing: '.18em', textTransform: 'uppercase', color: '#8d8d96', textDecoration: 'none' }}>{l}</a>
              ))}
            </div>
          </div>
          <div style={{ marginTop: 34, ...MONO, fontSize: 10, letterSpacing: '.12em', color: '#4c4c54', textTransform: 'uppercase' }}>
            &copy; 2026 The Fried Rice Index · Built in Surrey, BC · efr-index.vercel.app
          </div>
        </div>
      </footer>

      {/* ════════════════════════════════════════════════════════════
          TOOLTIP
      ════════════════════════════════════════════════════════════ */}
      {tip && (
        <div style={{
          position: 'fixed', zIndex: 90, pointerEvents: 'none',
          left: typeof window !== 'undefined' ? Math.min(window.innerWidth - 264, Math.max(8, tip.x + 16)) : tip.x + 16,
          top:  typeof window !== 'undefined' ? Math.max(8, tip.y - 100) : tip.y - 100,
          background: '#0d0d10', border: '1px solid #222228', borderRadius: 10,
          padding: '12px 15px', ...MONO, fontSize: 11.5, lineHeight: 1.7,
          boxShadow: '0 16px 44px rgba(0,0,0,.6)', maxWidth: 250,
        }}>
          <div style={{ fontWeight: 500, color: '#ece9e2', letterSpacing: '.04em', marginBottom: 4 }}>
            {tip.city}, {tip.country}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 22, color: '#8d8d96' }}>
            <span>baseline</span><b style={{ color: '#c8a862', fontWeight: 400 }}>{fmt(tip.price)}</b>
          </div>
          {tip.burden != null && (
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 22, color: '#8d8d96' }}>
              <span>rent burden</span><b style={{ color: '#c8a862', fontWeight: 400 }}>{tip.burden}%</b>
            </div>
          )}
          {tip.bowls != null && (
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 22, color: '#8d8d96' }}>
              <span>bowls after rent</span><b style={{ color: '#c8a862', fontWeight: 400 }}>{tip.bowls}</b>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
