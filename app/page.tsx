'use client'

import { useEffect, useRef, useState, useMemo, type CSSProperties } from 'react'
import NavBar from './components/NavBar'
import { supabase } from '@/lib/supabase'
import { estimateMonthlyTakeHome } from '@/lib/canada-tax'
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
  rent_data_source?:        string | null
  rentBurden?:    number | null
  bowlsAfterRent?: number | null // renamed to plates left
}

function getProxyName(source: string | null | undefined, city: string): string | null {
  if (!source) return null
  const m = source.match(/average one-bedroom rent for ([^(]+)/)
  if (!m) return null
  const name = m[1].trim().replace(/,\s*$/, '').split(',')[0]
  if (name.toLowerCase() !== city.toLowerCase()) {
    return name
  }
  return null
}

type Tip = { city: string; province: string; price: number; burden: number | null; plates: number | null; x: number; y: number }

const colorFor = (p: number) => p < 9.5 ? 'var(--color-green)' : p < 12.5 ? 'var(--color-text-2)' : 'var(--color-accent)'
const fmt = (n: number) => `CA$${Math.round(n).toLocaleString('en-CA')}`

function getNetDisposable(monthlyGross: number, monthlyRent: number, prov: string | null): number {
  const takeHome = estimateMonthlyTakeHome(monthlyGross, prov) ?? monthlyGross * 0.75
  return Math.round(takeHome - monthlyRent)
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
const WRAP: CSSProperties  = { maxWidth: 1120, margin: '0 auto', padding: '0 24px' }
const MONO: CSSProperties  = { fontFamily: 'var(--font-mono)', fontSize: 12, fontVariantNumeric: 'tabular-nums' }
const LABEL: CSSProperties = { fontSize: 13, color: 'var(--color-text-3)', fontWeight: 400 }
const SEC: CSSProperties   = { padding: '72px 0' }
const CARD: CSSProperties  = { border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', background: 'var(--color-surface)', overflow: 'hidden' }
const H2: CSSProperties    = { fontSize: 'clamp(24px, 2.6vw, 34px)', letterSpacing: '-.02em', lineHeight: 1.15, fontWeight: 600, maxWidth: '20ch', margin: 0 }
const BTN_PRIMARY: CSSProperties = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  fontSize: 15, padding: '11px 22px', borderRadius: 980, border: '1px solid var(--color-ink)',
  background: 'var(--color-ink)', color: 'var(--color-ink-fg)', textDecoration: 'none',
  fontWeight: 500, cursor: 'pointer', transition: 'opacity .15s',
}
const BTN_GHOST: CSSProperties = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  fontSize: 15, padding: '11px 22px', borderRadius: 980, border: '1px solid var(--color-border)',
  background: 'transparent', color: 'var(--color-text-1)', textDecoration: 'none',
  fontWeight: 500, cursor: 'pointer', transition: 'border-color .15s',
}

/** Section heading: one sentence, one color, an optional standfirst beside it. */
function SectionHead({ title, blurb }: { title: string; blurb: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 48, marginBottom: 32, flexWrap: 'wrap' }}>
      <h2 style={H2}>{title}</h2>
      <p style={{ maxWidth: '46ch', color: 'var(--color-text-2)', fontSize: 15, lineHeight: 1.6, margin: 0 }}>{blurb}</p>
    </div>
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
      .select('city,country,region,flag,price_cad,latitude,longitude,median_rent_1br_cad,median_monthly_salary_cad,tech_salary_cad,blurb,median_rent_local,price_source,rent_data_source')
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
        rent_data_source: c.rent_data_source,
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
      const W = svg.clientWidth || 1100
      // On phones the fixed desktop margins ate most of the plot and the axis
      // titles collided with tick labels; use tighter margins, a taller canvas,
      // and a horizontal y-caption instead of a rotated axis title.
      const narrow = W < 500
      const H = narrow ? 350 : 450
      const m = narrow ? { t: 40, r: 16, b: 48, l: 48 } : { t: 30, r: 30, b: 50, l: 60 }
      svg.setAttribute('viewBox', `0 0 ${W} ${H}`)
      svg.style.height = H + 'px'

      const bVals = data.map(c => c.rentBurden), yVals = data.map(c => c.bowlsAfterRent)
      const bmin = Math.min(...bVals), bmax = Math.max(...bVals)
      const ymin = Math.min(0, ...yVals), ymax = Math.max(...yVals)
      const xS = (v: number) => m.l + (v - bmin) / (bmax - bmin) * (W - m.l - m.r)
      const yS = (v: number) => H - m.b - (v - ymin) / (ymax - ymin) * (H - m.t - m.b)

      // X grid
      const step = narrow ? 10 : 5
      for (let v = Math.ceil(bmin / step) * step; v <= bmax; v += step) {
        svg.appendChild(d3.create('svg:line')
          .attr('x1', xS(v)).attr('x2', xS(v)).attr('y1', m.t).attr('y2', H - m.b)
          .attr('stroke', 'var(--color-border)').attr('stroke-dasharray', '1 4').node()!)
        const t = d3.create('svg:text')
          .attr('x', xS(v)).attr('y', H - m.b + 15).attr('text-anchor', 'middle')
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
        const yLabel = narrow
          ? (Math.abs(v) >= 1000 ? `$${v / 1000}k` : `$${v}`)
          : '$' + v.toLocaleString()
        const t = d3.create('svg:text')
          .attr('x', m.l - 6).attr('y', yS(v) + 3).attr('text-anchor', 'end')
          .attr('font-family', 'var(--font-mono)').attr('font-size', '9.5')
          .attr('fill', 'var(--color-text-3)').text(yLabel).node()!
        svg.appendChild(t)
      }

      // X/Y Titles
      const xt = d3.create('svg:text')
        .attr('x', (m.l + W - m.r) / 2).attr('y', H - 6).attr('text-anchor', 'middle')
        .attr('font-family', 'var(--font-body)').attr('font-size', narrow ? '11' : '12')
        .attr('fill', 'var(--color-text-2)')
        .text('Rent burden (% of local median income)').node()!
      svg.appendChild(xt)

      if (narrow) {
        const yt = d3.create('svg:text')
          .attr('x', 4).attr('y', 18).attr('text-anchor', 'start')
          .attr('font-family', 'var(--font-body)').attr('font-size', '11')
          .attr('fill', 'var(--color-text-2)')
          .text('Disposable monthly income after housing (CAD)').node()!
        svg.appendChild(yt)
      } else {
        const yt = d3.create('svg:text')
          .attr('transform', `translate(14 ${(m.t + H - m.b) / 2}) rotate(-90)`).attr('text-anchor', 'middle')
          .attr('font-family', 'var(--font-body)').attr('font-size', '12')
          .attr('fill', 'var(--color-text-2)')
          .text('Disposable monthly income after housing (CAD)').node()!
        svg.appendChild(yt)
      }

      // Plot data points
      data.forEach((c) => {
        const gx = xS(c.rentBurden), gy = yS(c.bowlsAfterRent)
        const rs = narrow ? 3 : 6

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
        let fill = '#8e8e93'
        if (party.includes('liberal')) fill = '#d71920'
        else if (party.includes('conservative')) fill = '#1a4782'
        else if (party.includes('ndp')) fill = '#f58220'
        else if (party.includes('bloc')) fill = '#33b2cc'
        else if (party.includes('green')) fill = '#3d9b35'
        else if (party.includes('independent')) fill = '#6e6e73'

        // Invisible halo so dots stay tappable on touch screens
        if (narrow) {
          g.append('circle').attr('r', 10).attr('fill', 'transparent')
        }

        g.append('circle')
          .attr('r', rs)
          .attr('fill', fill)
          .attr('opacity', 0.8)
          .attr('stroke', 'var(--color-surface)')
          .attr('stroke-width', 1)

        svg.appendChild(g.node()!)

        if (!narrow && NOTABLE.includes(c.city)) {
          const t = d3.create('svg:text')
            .attr('x', gx + rs + 6).attr('y', gy + 4)
            .attr('font-family', 'var(--font-body)').attr('font-size', '11')
            .attr('fill', 'var(--color-text-2)')
            .text(c.city).node()!
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

  /* Rent distribution across every riding. Reported rents are quantized to round
     figures, so bin on a $100 edge — narrower bins alternate empty and read as gaps. */
  const BIN_WIDTH = 100
  const rentMedian = rents.length ? rents[Math.floor(rents.length / 2)] : 0
  const binFloor = Math.floor(rmin / BIN_WIDTH) * BIN_WIDTH
  const binCount = Math.max(1, Math.ceil((rmax - binFloor + 1) / BIN_WIDTH))
  const rentBins = (() => {
    const counts = new Array(binCount).fill(0)
    for (const r of rents) counts[Math.min(binCount - 1, Math.floor((r - binFloor) / BIN_WIDTH))]++
    return counts
  })()
  const binPeak = Math.max(...rentBins, 1)

  return (
    <div style={{ background: 'var(--color-bg)', color: 'var(--color-text-1)', fontFamily: "var(--font-body)", overflowX: 'hidden', WebkitFontSmoothing: 'antialiased' }}>
      <style>{`
        .grain { cursor: pointer; }
        .grain circle { transform-box: fill-box; transform-origin: center; transition: transform .2s cubic-bezier(.32,.72,0,1); }
        .grain:hover circle { transform: scale(1.4) !important; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes drawerIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
        .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); }
        a[data-btn="primary"]:hover { opacity: .85; }
        .board-card {
          background: var(--color-surface);
          padding: 36px 30px;
        }
        .bar-container {
          position: relative;
          height: 20px;
          width: clamp(64px, 20vw, 250px);
          display: flex;
          align-items: center;
          justify-content: flex-end;
        }
        .scatter-card {
          border: 1px solid var(--color-border);
          border-radius: var(--radius-lg);
          background: var(--color-surface);
          overflow: hidden;
          padding: 28px 24px;
        }
        @media(max-width: 900px) {
          .stats-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .board-grid { grid-template-columns: 1fr !important; }
          .metrics-grid { grid-template-columns: 1fr !important; }
          .method-grid { grid-template-columns: 1fr !important; gap: 40px !important; }
        }
        @media(max-width: 600px) {
          .board-card {
            padding: 20px 14px !important;
          }
          .bar-container {
            width: clamp(48px, 15vw, 100px) !important;
          }
          .scatter-card {
            padding: 16px 8px !important;
          }
        }
      `}</style>

      <NavBar fixed />

      {/* HERO SECTION */}
      <header style={{ paddingTop: 112 }}>
        <div style={WRAP}>
          <h1 style={{ fontSize: 'clamp(36px, 4.6vw, 60px)', lineHeight: 1.08, letterSpacing: '-.03em', fontWeight: 600, maxWidth: '16ch', margin: '0 0 20px' }}>
            Cost of living across {cities.length || 343} federal ridings.
          </h1>

          <p style={{ maxWidth: '58ch', color: 'var(--color-text-2)', fontSize: 19, lineHeight: 1.55, margin: '0 0 32px' }}>
            Median rent on a one-bedroom runs from {fmt(rmin)} to {fmt(rmax)} a month.
            The index weighs that against local median income, riding by riding.
          </p>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 40 }}>
            <a href="/cities" style={BTN_PRIMARY}>Browse ridings</a>
            <a href="/explore" style={BTN_GHOST}>Open the map</a>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'flex-start', marginBottom: 48 }}>
            <span style={LABEL}>Living profile</span>
            <div style={{ display: 'inline-flex', background: 'var(--color-surface-2)', padding: 2, borderRadius: 'var(--radius)', gap: 2 }}>
              {([
                ['single_renter', 'Single renter'],
                ['family_homeowner', 'Family homeowner'],
              ] as const).map(([key, text]) => (
                <button
                  key={key}
                  onClick={() => setProfile(key)}
                  aria-pressed={profile === key}
                  style={{
                    border: 'none',
                    background: profile === key ? 'var(--color-surface)' : 'transparent',
                    color: profile === key ? 'var(--color-text-1)' : 'var(--color-text-2)',
                    padding: '7px 16px', borderRadius: 6, fontSize: 14,
                    fontWeight: profile === key ? 500 : 400, cursor: 'pointer',
                    boxShadow: profile === key ? '0 1px 2px rgba(0,0,0,.08)' : 'none',
                    transition: 'background .15s, color .15s', fontFamily: 'var(--font-body)',
                  }}
                >
                  {text}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div style={{ ...WRAP, borderTop: '1px solid var(--color-border)', borderBottom: '1px solid var(--color-border)' }}>
          <div className="stats-grid">
            {[
              { val: String(cities.length), label: 'Ridings indexed' },
              { val: fmt(rmin),            label: 'Lowest 1BR rent' },
              { val: fmt(rmax),            label: 'Highest 1BR rent' },
              { val: `${avgBurden}%`,      label: 'Average rent burden' },
            ].map((s, i) => (
              <div key={s.label} style={{ padding: '28px 24px', borderLeft: i > 0 ? '1px solid var(--color-border)' : 'none', paddingLeft: i === 0 ? 0 : 24 }}>
                <div data-nums style={{ fontWeight: 600, fontSize: 'clamp(26px, 2.6vw, 34px)', letterSpacing: '-.025em' }}>
                  {s.val}
                </div>
                <div style={{ ...LABEL, marginTop: 6 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </header>

      {/* THE SPECTRUM */}
      <section style={SEC} id="spectrum">
        <div style={WRAP}>
          <SectionHead
            title="Where the rent actually lands"
            blurb={`Every riding placed by its median one-bedroom rent. Most cluster well below the headline maximum — the median riding pays ${fmt(rentMedian)}.`}
          />
          <div style={{ ...CARD, padding: '28px 28px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 160 }}>
              {rentBins.map((count, i) => (
                <div
                  key={i}
                  title={`${count} riding${count === 1 ? '' : 's'}`}
                  style={{
                    flex: 1,
                    height: `${Math.max(count / binPeak * 100, count ? 1.5 : 0)}%`,
                    background: 'var(--color-text-1)',
                    opacity: count ? 0.88 : 0,
                    borderRadius: '2px 2px 0 0',
                  }}
                />
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--color-border)', paddingTop: 12, marginTop: 4 }}>
              <span style={{ ...LABEL, ...MONO }}>{fmt(rmin)}</span>
              <span style={LABEL}>{rents.length} ridings by median 1BR rent</span>
              <span style={{ ...LABEL, ...MONO }}>{fmt(rmax)}</span>
            </div>
          </div>
        </div>
      </section>

      {/* METRICS INFORMATION */}
      <section style={{ ...SEC, paddingTop: 0 }} id="tracks">
        <div style={WRAP}>
          <SectionHead
            title="What the numbers mean"
            blurb="National averages flatten regional difference. These three figures are the ones the index is built from."
          />

          <div className="metrics-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 1, background: 'var(--color-border)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
            {[
              {
                val: 'CA$3,550',
                title: 'Median monthly income',
                body: 'The national median monthly individual income in Canada, per current Statistics Canada benchmarks.',
              },
              {
                val: `${avgBurden}%`,
                title: 'Rent burden',
                body: 'Rent as a share of local median income. The national household average sits near a third; for one person renting a 1BR it runs considerably higher.',
              },
              {
                val: 'CA$1,626',
                title: 'Disposable income',
                body: "What's left of the riding's median paycheck after 1BR rent and progressive federal and provincial tax.",
              },
            ].map(m => (
              <div key={m.title} style={{ background: 'var(--color-surface)', padding: '32px 28px' }}>
                <div data-nums style={{ fontSize: 40, fontWeight: 600, letterSpacing: '-.03em', marginBottom: 20 }}>{m.val}</div>
                <h3 style={{ fontSize: 17, margin: '0 0 8px', fontWeight: 600, letterSpacing: '-.01em' }}>{m.title}</h3>
                <p style={{ color: 'var(--color-text-2)', fontSize: 14.5, lineHeight: 1.6, margin: 0 }}>{m.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* LEADERBOARDS */}
      <section style={{ ...SEC, paddingTop: 0 }} id="board">
        <div style={WRAP}>
          <SectionHead
            title="Lowest and highest rent burden"
            blurb="Rent burden is 1BR rent divided by local median wage. These are the eight ridings at each end."
          />

          <div ref={boardRef} className="board-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, background: 'var(--color-border)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
            {/* Cheapest */}
            <div className="board-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--color-green)' }} />
                <span style={{ ...LABEL, color: 'var(--color-text-1)' }}>Lowest Rent Burden %</span>
              </div>
              {cheapTop.map((c, i) => {
                const proxy = getProxyName(c.rent_data_source, c.city)
                return (
                  <div key={c.city} style={{ display: 'grid', gridTemplateColumns: '30px minmax(0,1fr) auto', alignItems: 'center', gap: 16, padding: '12px 0', borderBottom: i < cheapTop.length - 1 ? '1px solid var(--color-border)' : 'none' }}>
                    <span style={{ ...MONO, fontSize: 10, color: 'var(--color-text-3)' }}>{String(i + 1).padStart(2, '0')}</span>
                    <span style={{ fontSize: 14.5, fontWeight: 500, minWidth: 0, overflowWrap: 'anywhere' }}>
                      {c.city}, {c.region}
                      <small style={{ display: 'block', fontSize: 11, color: 'var(--color-text-3)', fontWeight: 400, marginTop: 2 }}>
                        {c.bowlsAfterRent != null ? (c.bowlsAfterRent < 0 ? `CA$${Math.abs(c.bowlsAfterRent).toLocaleString()} shortfall after rent` : `CA$${c.bowlsAfterRent.toLocaleString()} disposable after rent`) : ''}
                        {proxy ? ` (via ${proxy})` : ''}
                      </small>
                    </span>
                    <span className="bar-container">
                      <span style={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)', height: 2, background: 'var(--color-green)', width: boardIn ? `${Math.min(100, c.rentBurden ?? 0)}%` : '0%', transition: `width 1.2s cubic-bezier(.2,.8,.2,1) ${i * 50}ms` }} />
                      <span style={{ position: 'relative', ...MONO, fontSize: 12, background: 'var(--color-surface)', paddingLeft: 8 }}>{c.rentBurden}%</span>
                    </span>
                  </div>
                )
              })}
            </div>

            {/* Priciest */}
            <div className="board-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--color-accent)' }} />
                <span style={{ ...LABEL, color: 'var(--color-text-1)' }}>Highest Rent Burden %</span>
              </div>
              {priceTop.map((c, i) => {
                const proxy = getProxyName(c.rent_data_source, c.city)
                return (
                  <div key={c.city} style={{ display: 'grid', gridTemplateColumns: '30px minmax(0,1fr) auto', alignItems: 'center', gap: 16, padding: '12px 0', borderBottom: i < priceTop.length - 1 ? '1px solid var(--color-border)' : 'none' }}>
                    <span style={{ ...MONO, fontSize: 10, color: 'var(--color-text-3)' }}>{String(i + 1).padStart(2, '0')}</span>
                    <span style={{ fontSize: 14.5, fontWeight: 500, minWidth: 0, overflowWrap: 'anywhere' }}>
                      {c.city}, {c.region}
                      <small style={{ display: 'block', fontSize: 11, color: 'var(--color-text-3)', fontWeight: 400, marginTop: 2 }}>
                        {c.bowlsAfterRent != null ? (c.bowlsAfterRent < 0 ? `CA$${Math.abs(c.bowlsAfterRent).toLocaleString()} shortfall after rent` : `CA$${c.bowlsAfterRent.toLocaleString()} disposable after rent`) : ''}
                        {proxy ? ` (via ${proxy})` : ''}
                      </small>
                    </span>
                    <span className="bar-container">
                      <span style={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)', height: 2, background: 'var(--color-accent)', width: boardIn ? `${Math.min(100, c.rentBurden ?? 0)}%` : '0%', transition: `width 1.2s cubic-bezier(.2,.8,.2,1) ${i * 50}ms` }} />
                      <span style={{ position: 'relative', ...MONO, fontSize: 12, background: 'var(--color-surface)', paddingLeft: 8 }}>{c.rentBurden}%</span>
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      {/* SCATTER PLOT */}
      <section style={{ ...SEC, paddingTop: 0 }} id="scatter">
        <div style={WRAP}>
          <SectionHead
            title="Rent burden against disposable income"
            blurb="Ridings further right spend more of their local salary on housing. Ridings higher up keep more of it. Each dot is coloured by the party holding the seat."
          />
          <div className="scatter-card">
            <svg ref={scatRef} style={{ display: 'block', width: '100%', height: 450 }} />
          </div>
        </div>
      </section>

      {/* SUBMIT CALL TO ACTION */}
      <section style={{ ...SEC, paddingTop: 0 }} id="submit">
        <div style={WRAP}>
          <div style={{ borderRadius: 'var(--radius-lg)', background: 'var(--color-surface-2)', padding: '72px 40px', textAlign: 'center' }}>
            <h2 style={{ ...H2, maxWidth: '20ch', margin: '0 auto 14px' }}>
              See how your riding compares.
            </h2>
            <p style={{ maxWidth: '52ch', margin: '0 auto 28px', color: 'var(--color-text-2)', fontSize: 16, lineHeight: 1.6 }}>
              Local median income, marginal tax brackets, and housing costs across all {cities.length || 343} federal ridings.
            </p>
            <a href="/cities" style={BTN_PRIMARY}>Browse ridings</a>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop: '1px solid var(--color-border)', padding: '40px 0 32px', color: 'var(--color-text-3)', fontSize: 13 }}>
        <div style={WRAP}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 30, flexWrap: 'wrap', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: 15, letterSpacing: '-.015em', color: 'var(--color-text-1)', marginBottom: 8 }}>
                CanPol Index
              </div>
              <div>Socio-economic data across federal ridings. Free, forever.</div>
            </div>
            <div style={{ display: 'flex', gap: 24 }}>
              {[['Ridings','/cities'],['Explore','/explore'],['About','/about']].map(([l,h]) => (
                <a key={h} href={h} style={{ fontSize: 13, color: 'var(--color-text-2)', textDecoration: 'none' }}>{l}</a>
              ))}
            </div>
          </div>
          <div style={{ marginTop: 28, fontSize: 12, color: 'var(--color-text-4)' }}>
            &copy; 2026 CanPol Index
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
            <div onClick={() => setSel(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.25)', zIndex: 95, animation: 'fadeIn .2s ease' }} />
            <aside style={{ position: 'fixed', top: 0, right: 0, height: '100vh', width: 'min(400px,100vw)', background: 'var(--color-surface)', borderLeft: '1px solid var(--color-border)', zIndex: 96, overflowY: 'auto', boxShadow: '-1px 0 24px rgba(0,0,0,.08)', animation: 'drawerIn .3s cubic-bezier(.32,.72,0,1)' }}>
              <div style={{ padding: '28px 24px 40px' }}>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
                  <div>
                    <h2 style={{ fontSize: 26, fontWeight: 600, letterSpacing: '-.025em', margin: 0, color: 'var(--color-text-1)' }}>{sel.city}</h2>
                    <p style={{ ...LABEL, marginTop: 6 }}>{provName ? `${provName} (${sel.region})` : sel.region}</p>
                  </div>
                  <button onClick={() => setSel(null)} aria-label="Close" style={{ background: 'none', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)', width: 32, height: 32, flexShrink: 0, cursor: 'pointer', color: 'var(--color-text-2)', fontSize: 13 }}>✕</button>
                </div>

                <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 20, marginBottom: 24 }}>
                  <div style={LABEL}>Median 1BR rent</div>
                  <div data-nums style={{ fontSize: 40, fontWeight: 600, color: 'var(--color-text-1)', letterSpacing: '-.03em', lineHeight: 1.1, marginTop: 6 }}>{sel.median_rent_1br_cad ? `CA$${sel.median_rent_1br_cad}` : 'Pending'}<span style={{ fontSize: 18, fontWeight: 400, color: 'var(--color-text-3)' }}>{sel.median_rent_1br_cad ? '/mo' : ''}</span></div>
                </div>

                {/* lands marker */}
                <div style={{ marginBottom: 24 }}>
                  <div style={LABEL}>Position on the rent spectrum</div>
                  <div style={{ position: 'relative', height: 8, borderRadius: 4, marginTop: 14, background: 'linear-gradient(90deg,var(--color-green),var(--color-amber) 55%,var(--color-red))' }}>
                    <div style={{ position: 'absolute', top: '50%', left: `${pos * 100}%`, transform: 'translate(-50%,-50%)', width: 14, height: 14, borderRadius: '50%', background: 'var(--color-text-1)', border: '3px solid var(--color-surface)' }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10 }}>
                    <span style={{ ...LABEL, fontSize: 12 }}>CA${rmin} lowest</span>
                    <span style={{ ...LABEL, fontSize: 12 }}>CA${rmax} highest</span>
                  </div>
                </div>

                {/* Rent burden */}
                {sel.rentBurden != null && (
                  <div style={{ marginBottom: 20 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                      <span style={LABEL}>Rent burden</span>
                      <span data-nums style={{ fontSize: 15, fontWeight: 600, color: burdenCol }}>{sel.rentBurden}%</span>
                    </div>
                    <div style={{ height: 6, borderRadius: 3, background: 'var(--color-surface-2)', marginTop: 10, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${Math.min(100, sel.rentBurden)}%`, background: burdenCol, borderRadius: 3 }} />
                    </div>
                    <p style={{ ...LABEL, fontSize: 12, marginTop: 8 }}>Share of median local gross paycheck spent on 1BR rent</p>
                  </div>
                )}

                {/* Disposable income */}
                {sel.bowlsAfterRent != null && (() => {
                  const isDeficit = sel.bowlsAfterRent < 0
                  const dispColor = isDeficit ? 'var(--color-accent)' : 'var(--color-green)'
                  return (
                    <div style={{ marginBottom: 24 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                        <span style={LABEL}>{isDeficit ? 'Housing cost exceeds income' : 'Disposable income left'}</span>
                        <span data-nums style={{ fontSize: 15, fontWeight: 600, color: dispColor }}>{isDeficit ? '-' : ''}CA${Math.abs(sel.bowlsAfterRent).toLocaleString()}</span>
                      </div>
                      <div style={{ height: 6, borderRadius: 3, background: 'var(--color-surface-2)', marginTop: 10, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${Math.min(100, (Math.abs(sel.bowlsAfterRent) / 5000) * 100)}%`, background: dispColor, borderRadius: 3 }} />
                      </div>
                      <p style={{ ...LABEL, fontSize: 12, marginTop: 8 }}>
                        {isDeficit ? 'Median net income does not cover this profile\'s housing cost' : 'Net income remaining after estimated progressive provincial taxes and 1BR housing costs'}
                      </p>
                    </div>
                  )
                })()}

                {sel.blurb && <p style={{ fontSize: 13, color: 'var(--color-text-2)', lineHeight: 1.6, margin: '20px 0' }}>{sel.blurb}</p>}

                <a href={`/cities/${slug}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 14, color: 'var(--color-text-1)', textDecoration: 'underline', textUnderlineOffset: 3, fontWeight: 500 }}>
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
          background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)',
          padding: '10px 12px', fontSize: 13, lineHeight: 1.6, fontVariantNumeric: 'tabular-nums',
          boxShadow: '0 4px 16px rgba(0,0,0,.1)', maxWidth: 220,
        }}>
          <div style={{ fontWeight: 600, color: 'var(--color-text-1)', marginBottom: 2 }}>
            {tip.city}, {tip.province}
          </div>
          {tip.burden != null && (
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, color: 'var(--color-text-2)' }}>
              <span>Rent burden</span><b style={{ color: 'var(--color-text-1)', fontWeight: 500 }}>{tip.burden}%</b>
            </div>
          )}
          {tip.plates != null && (
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, color: 'var(--color-text-2)' }}>
              <span>{tip.plates < 0 ? 'Shortfall' : 'Disposable'}</span>
              <b style={{ color: tip.plates < 0 ? 'var(--color-red)' : 'var(--color-text-1)', fontWeight: 600 }}>${Math.abs(tip.plates).toLocaleString()}</b>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
