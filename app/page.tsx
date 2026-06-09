'use client'

import { useEffect, useRef, useState } from 'react'
import {
  ChevronRight, RotateCcw, Expand,
  MapPin, BarChart2, TrendingDown, TrendingUp,
  X, ExternalLink, Globe,
} from 'lucide-react'
import WorldMap, { type MapCity, type WorldMapHandle, LEGEND } from './components/WorldMap'
import { RATES, SYMBOLS } from './cities/[city]/CityPageContent'
import NavBar from './components/NavBar'

/* ── helpers ─────────────────────────────────────────────────────────── */
const CURRENCY_OPTIONS = [
  ['CAD','CA$'],['USD','US$'],['EUR','€'],['GBP','£'],['CHF','Fr'],
  ['JPY','¥'],['CNY','¥'],['AUD','AU$'],['HKD','HK$'],['SGD','S$'],
  ['KRW','₩'],['INR','₹'],['AED','AED'],['BRL','R$'],['MXN','MX$'],
]
function cvt(cad: number | null, cur: string) {
  if (!cad) return '—'
  const v = cad * (RATES[cur] ?? 1)
  return `${SYMBOLS[cur] ?? 'CA$'}${v.toLocaleString(undefined, { minimumFractionDigits: v >= 100 ? 0 : 2, maximumFractionDigits: v >= 100 ? 0 : 2 })}`
}

const SLIDES = [
  { num: '1',     color: '#d9682a', glow: 'rgba(217,104,42,.2)',  label: 'dish',   body: 'A bowl of egg fried rice. One dish, wherever you are in the world.' },
  { num: '40',    color: '#3db870', glow: 'rgba(61,184,112,.18)', label: 'cities',  body: 'Indexed across forty cities on six continents, from Cairo to Seoul.' },
  { num: '11.5×', color: '#d9682a', glow: 'rgba(217,104,42,.2)',  label: 'spread',  body: 'The cheapest bowl costs eleven and a half times less than the priciest.' },
  { num: '→',     color: '#f0ece4', glow: 'rgba(240,236,228,.1)', label: 'explore', body: 'The data is live. See what fried rice costs where you live — and everywhere else.' },
]

/* ══════════════════════════════════════════════════════════════════════ */
export default function Home() {
  const mapRef  = useRef<WorldMapHandle>(null)
  const [selected, setSelected] = useState<MapCity | null>(null)
  const [currency, setCurrency] = useState('CAD')
  const [slide, setSlide]       = useState(0)

  /* trigger refs for IntersectionObserver-based slide detection */
  const t0 = useRef<HTMLDivElement>(null)
  const t1 = useRef<HTMLDivElement>(null)
  const t2 = useRef<HTMLDivElement>(null)
  const t3 = useRef<HTMLDivElement>(null)
  const triggers = [t0, t1, t2, t3]

  useEffect(() => {
    const obs = triggers.map((ref, i) => {
      const o = new IntersectionObserver(
        ([e]) => { if (e.isIntersecting) setSlide(i) },
        { threshold: 0.5 }
      )
      if (ref.current) o.observe(ref.current)
      return o
    })
    return () => obs.forEach(o => o.disconnect())
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const rentBurden = selected?.median_rent_1br_cad && selected?.median_monthly_salary_cad
    ? Math.round((selected.median_rent_1br_cad / selected.median_monthly_salary_cad) * 100) : null
  const bowlsAfterRent = selected?.median_monthly_salary_cad && selected?.median_rent_1br_cad && selected?.price_cad
    ? Math.round((selected.median_monthly_salary_cad - selected.median_rent_1br_cad) / selected.price_cad) : null

  const S = SLIDES[slide]

  return (
    <div style={{ background:'var(--color-bg)', color:'var(--color-text-1)', fontFamily:'var(--font-body)', minHeight:'100vh' }}>
      <style>{`
        @keyframes orb1{0%,100%{transform:translate(0,0)scale(1)}33%{transform:translate(-5%,7%)scale(1.08)}66%{transform:translate(7%,-4%)scale(.94)}}
        @keyframes orb2{0%,100%{transform:translate(0,0)scale(1)}40%{transform:translate(6%,-6%)scale(1.1)}80%{transform:translate(-6%,4%)scale(.93)}}
        @keyframes orb3{0%,100%{transform:translate(0,0)}25%{transform:translate(5%,5%)}75%{transform:translate(-4%,-4%)}}
        @keyframes orb4{0%,100%{transform:translate(0,0)scale(1)}50%{transform:translate(-8%,3%)scale(1.12)}}
        @keyframes popIn{from{opacity:0;transform:scale(.9)}to{opacity:1;transform:scale(1)}}
        @keyframes slideIn{from{opacity:0;transform:translateX(-10px)}to{opacity:1;transform:none}}
      `}</style>

      <NavBar fixed />

      {/* ══ HERO ═══════════════════════════════════════════════════════ */}
      <section style={{ position:'relative', overflow:'hidden', paddingTop:52, minHeight:'68vh', display:'flex', alignItems:'center' }}>

        {/* Aurora orbs */}
        <div style={{ position:'absolute', inset:0, pointerEvents:'none' }}>
          <div style={{ position:'absolute', top:'-10%', right:'-6%', width:700, height:700, background:'radial-gradient(circle, rgba(217,104,42,.24) 0%, transparent 58%)', filter:'blur(80px)', animation:'orb1 14s ease-in-out infinite' }} />
          <div style={{ position:'absolute', bottom:'-12%', left:'-10%', width:620, height:620, background:'radial-gradient(circle, rgba(61,184,112,.18) 0%, transparent 58%)', filter:'blur(80px)', animation:'orb2 19s ease-in-out infinite' }} />
          <div style={{ position:'absolute', top:'30%', left:'25%', width:480, height:480, background:'radial-gradient(circle, rgba(196,137,15,.12) 0%, transparent 62%)', filter:'blur(100px)', animation:'orb3 24s ease-in-out infinite' }} />
          <div style={{ position:'absolute', top:'5%', left:'-8%', width:500, height:500, background:'radial-gradient(circle, rgba(180,55,20,.16) 0%, transparent 58%)', filter:'blur(80px)', animation:'orb4 17s ease-in-out infinite' }} />
        </div>

        {/* Grid lines */}
        <div style={{ position:'absolute', inset:0, pointerEvents:'none', backgroundImage:'linear-gradient(rgba(255,255,255,.028) 1px, transparent 1px),linear-gradient(90deg, rgba(255,255,255,.028) 1px, transparent 1px)', backgroundSize:'76px 76px' }} />
        {/* Vignette */}
        <div style={{ position:'absolute', inset:0, pointerEvents:'none', background:'radial-gradient(ellipse 85% 70% at 50% 50%, transparent 15%, var(--color-bg) 85%)' }} />

        {/* Content */}
        <div style={{ position:'relative', zIndex:2, maxWidth:1280, margin:'0 auto', padding:'3rem 2rem', width:'100%' }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:'1rem' }}>
            <MapPin size={13} color="var(--color-accent)" />
            <span style={{ fontSize:11, letterSpacing:'2.5px', textTransform:'uppercase', color:'var(--color-text-3)' }}>40 cities · food-based affordability index</span>
          </div>

          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', flexWrap:'wrap', gap:'2rem' }}>
            <div>
              <h1 style={{ fontFamily:'var(--font-display)', fontSize:'clamp(42px,7vw,92px)', fontWeight:400, lineHeight:.92, letterSpacing:-2.5, color:'var(--color-text-1)', margin:'0 0 1.25rem' }}>
                The Fried<br /><em style={{ color:'var(--color-accent)' }}>Rice Index.</em>
              </h1>
              <p style={{ fontSize:'clamp(14px,1.5vw,17px)', color:'var(--color-text-2)', maxWidth:420, lineHeight:1.65, margin:0 }}>
                Restaurant prices across forty cities — and what they reveal about the cost of living everywhere.
              </p>
            </div>
            <div style={{ display:'flex', gap:'0.75rem', flexWrap:'wrap' }}>
              <a href="/cities" style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'.75rem 1.5rem', borderRadius:8, background:'var(--color-accent)', color:'#fff', textDecoration:'none', fontSize:14, fontWeight:500 }}>
                Browse cities <ChevronRight size={15} />
              </a>
              <a href="/explore" style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'.75rem 1.5rem', borderRadius:8, border:'0.5px solid var(--color-border)', color:'var(--color-text-2)', textDecoration:'none', fontSize:14 }}>
                Full map <Expand size={14} />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ══ STICKY SCROLL NARRATIVE ════════════════════════════════════ */}
      <div style={{ height:'400vh', position:'relative' }}>

        {/* Invisible scroll triggers — one per 100vh */}
        {[t0,t1,t2,t3].map((ref,i) => (
          <div key={i} ref={ref} style={{ position:'absolute', top:`${i * 25}%`, height:'25%', width:'100%', pointerEvents:'none' }} />
        ))}

        {/* Sticky panel */}
        <div style={{ position:'sticky', top:0, height:'100vh', display:'flex', overflow:'hidden', borderTop:'0.5px solid var(--color-border)', borderBottom:'0.5px solid var(--color-border)' }}>

          {/* Left — giant number */}
          <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', position:'relative', overflow:'hidden', borderRight:'0.5px solid var(--color-border)' }}>
            <div style={{ position:'absolute', inset:0, background:`radial-gradient(circle at center, ${S.glow} 0%, transparent 65%)`, transition:'background .8s ease' }} />
            <div key={`num-${slide}`} style={{
              fontFamily:'var(--font-display)',
              fontSize:'clamp(110px,22vw,300px)',
              color: S.color,
              lineHeight:1,
              letterSpacing:-8,
              position:'relative', zIndex:1,
              animation:'popIn .4s cubic-bezier(.16,1,.3,1)',
              textShadow:`0 0 120px ${S.glow}`,
            }}>
              {S.num}
            </div>
          </div>

          {/* Right — text */}
          <div style={{ width:'40%', display:'flex', flexDirection:'column', justifyContent:'center', padding:'clamp(2rem,5vw,5rem)' }}>
            {/* Progress pills */}
            <div style={{ display:'flex', gap:6, marginBottom:'2.5rem', alignItems:'center' }}>
              {SLIDES.map((sl,i) => (
                <div key={i} style={{ height:5, borderRadius:3, width: i===slide ? 28 : 5, background: i===slide ? sl.color : 'var(--color-border)', transition:'all .5s cubic-bezier(.16,1,.3,1)' }} />
              ))}
              <span style={{ marginLeft:8, fontSize:11, color:'var(--color-text-3)', letterSpacing:'1px' }}>{String(slide+1).padStart(2,'0')} / 04</span>
            </div>

            <div key={`txt-${slide}`} style={{ animation:'slideIn .4s cubic-bezier(.16,1,.3,1)' }}>
              <h2 style={{ fontFamily:'var(--font-display)', fontSize:'clamp(44px,5vw,74px)', color: S.color, margin:'0 0 1.25rem', lineHeight:.95, letterSpacing:-1.5 }}>
                {S.label}
              </h2>
              <p style={{ fontSize:'clamp(15px,1.6vw,18px)', color:'var(--color-text-2)', lineHeight:1.75, margin:0, maxWidth:340 }}>
                {S.body}
              </p>
            </div>

            <div style={{ marginTop:'3rem', height:'0.5px', background:'var(--color-border)', overflow:'hidden' }}>
              <div style={{ height:'100%', width:`${((slide+1)/4)*100}%`, background: S.color, transition:'width .6s cubic-bezier(.16,1,.3,1), background .5s ease' }} />
            </div>

            {slide === 3 && (
              <div style={{ marginTop:'2rem', display:'flex', gap:'0.75rem', flexWrap:'wrap' }}>
                <a href="/explore" style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'.7rem 1.4rem', borderRadius:8, background:'var(--color-accent)', color:'#fff', textDecoration:'none', fontSize:14 }}>
                  Open the map <ChevronRight size={14} />
                </a>
                <a href="/cities" style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'.7rem 1.4rem', borderRadius:8, border:'0.5px solid var(--color-border)', color:'var(--color-text-2)', textDecoration:'none', fontSize:14 }}>
                  Browse cities
                </a>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ══ MAP ════════════════════════════════════════════════════════ */}
      <section style={{ borderTop:'0.5px solid var(--color-border)' }}>

        {/* Toolbar */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'.85rem 2rem', borderBottom:'0.5px solid var(--color-border)', flexWrap:'wrap', gap:'.75rem' }}>
          <span style={{ fontSize:12, color:'var(--color-text-3)', display:'flex', alignItems:'center', gap:6 }}>
            <Globe size={13} /> Click a dot · scroll to zoom · names appear at 3×
          </span>
          <div style={{ display:'flex', gap:'.6rem', alignItems:'center' }}>
            <select value={currency} onChange={e => setCurrency(e.target.value)} style={{ padding:'5px 10px', border:'0.5px solid var(--color-border)', borderRadius:6, background:'var(--color-surface)', fontFamily:'var(--font-body)', fontSize:12, color:'var(--color-text-2)', cursor:'pointer' }}>
              {CURRENCY_OPTIONS.map(([c,s]) => <option key={c} value={c}>{s} {c}</option>)}
            </select>
            <button onClick={() => mapRef.current?.reset()} style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'5px 10px', background:'none', border:'0.5px solid var(--color-border)', borderRadius:6, cursor:'pointer', fontSize:12, color:'var(--color-text-3)', fontFamily:'var(--font-body)' }}>
              <RotateCcw size={12} /> Reset
            </button>
          </div>
        </div>

        <div style={{ display:'flex' }}>
          {/* Map */}
          <div style={{ flex:1, overflow:'hidden' }}>
            <WorldMap ref={mapRef} onSelect={setSelected} selected={selected} mapH={440} />
          </div>

          {/* City panel */}
          <div style={{ width: selected ? 'clamp(270px,28vw,340px)' : 0, overflow:'hidden', transition:'width .3s cubic-bezier(.4,0,.2,1)', borderLeft: selected ? '0.5px solid var(--color-border)' : 'none', background:'var(--color-surface)', flexShrink:0 }}>
            {selected && (
              <div style={{ width:'clamp(270px,28vw,340px)', padding:'1.5rem', overflowY:'auto', maxHeight:440 }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'1.25rem' }}>
                  <div>
                    <div style={{ fontSize:26, marginBottom:4 }}>{selected.flag ?? '🌍'}</div>
                    <h2 style={{ fontFamily:'var(--font-display)', fontSize:24, letterSpacing:-.5, margin:0, color:'var(--color-text-1)' }}>{selected.city}</h2>
                    <p style={{ fontSize:12, color:'var(--color-text-3)', margin:'3px 0 0' }}>{[selected.region, selected.country].filter(Boolean).join(', ')}</p>
                  </div>
                  <button onClick={() => setSelected(null)} style={{ background:'none', border:'0.5px solid var(--color-border)', borderRadius:6, padding:'4px 7px', cursor:'pointer', color:'var(--color-text-3)' }}>
                    <X size={13} />
                  </button>
                </div>

                <div style={{ borderTop:'0.5px solid var(--color-border)', paddingTop:'1rem', marginBottom:'1rem' }}>
                  <p style={{ fontSize:10, letterSpacing:'1.5px', textTransform:'uppercase', color:'var(--color-text-3)', margin:'0 0 4px' }}>Baseline price</p>
                  <p style={{ fontFamily:'var(--font-display)', fontSize:34, color:'var(--color-accent)', margin:0, lineHeight:1 }}>{cvt(selected.price_cad, currency)}</p>
                </div>

                {(rentBurden !== null || bowlsAfterRent !== null) && (
                  <div style={{ display:'flex', gap:'.6rem', marginBottom:'1rem' }}>
                    {bowlsAfterRent !== null && (
                      <div style={{ flex:1, background:'var(--color-bg)', border:'0.5px solid var(--color-border)', borderRadius:8, padding:'.75rem' }}>
                        <p style={{ fontSize:9, letterSpacing:'1px', textTransform:'uppercase', color:'var(--color-text-3)', margin:'0 0 4px' }}>After rent</p>
                        <p style={{ fontFamily:'var(--font-display)', fontSize:20, color:'#3db870', margin:0 }}>{bowlsAfterRent} 🍚</p>
                        <p style={{ fontSize:10, color:'var(--color-text-3)', margin:'2px 0 0' }}>bowls / month</p>
                      </div>
                    )}
                    {rentBurden !== null && (
                      <div style={{ flex:1, background:'var(--color-bg)', border:'0.5px solid var(--color-border)', borderRadius:8, padding:'.75rem' }}>
                        <p style={{ fontSize:9, letterSpacing:'1px', textTransform:'uppercase', color:'var(--color-text-3)', margin:'0 0 4px' }}>Rent burden</p>
                        <p style={{ fontFamily:'var(--font-display)', fontSize:20, color: rentBurden > 70 ? '#c0392b' : rentBurden > 50 ? '#c4890f' : '#3db870', margin:0 }}>{rentBurden}%</p>
                        <p style={{ fontSize:10, color:'var(--color-text-3)', margin:'2px 0 0' }}>of median salary</p>
                      </div>
                    )}
                  </div>
                )}

                {selected.blurb && <p style={{ fontSize:12, color:'var(--color-text-2)', lineHeight:1.65, margin:'0 0 1rem' }}>{selected.blurb}</p>}

                <a href={`/cities/${selected.city.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'')}`}
                  style={{ display:'inline-flex', alignItems:'center', gap:5, fontSize:13, color:'var(--color-accent)', textDecoration:'none', borderBottom:'0.5px solid var(--color-accent)', paddingBottom:2 }}>
                  Full profile <ExternalLink size={12} />
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Legend */}
        <div style={{ padding:'.85rem 2rem', display:'flex', alignItems:'center', gap:'1rem', flexWrap:'wrap', borderTop:'0.5px solid var(--color-border)' }}>
          <span style={{ fontSize:10, letterSpacing:'1.5px', textTransform:'uppercase', color:'var(--color-text-3)' }}>Baseline price</span>
          {LEGEND.map(t => (
            <div key={t.color} style={{ display:'flex', alignItems:'center', gap:5 }}>
              <div style={{ width:8, height:8, borderRadius:'50%', background:t.color }} />
              <span style={{ fontSize:11, color:'var(--color-text-3)' }}>{t.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ══ STATS STRIP ════════════════════════════════════════════════ */}
      <section style={{ borderBottom:'0.5px solid var(--color-border)' }}>
        <div style={{ maxWidth:1280, margin:'0 auto', display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))' }}>
          {[
            { icon:<Globe size={15} color="var(--color-accent)" />,        val:'40',       sub:'cities indexed' },
            { icon:<TrendingDown size={15} color="#3db870" />,              val:'CA$1.80',  sub:'cheapest baseline' },
            { icon:<TrendingUp size={15} color="#c0392b" />,                val:'CA$20.68', sub:'most expensive' },
            { icon:<BarChart2 size={15} color="var(--color-accent)" />,    val:'11.5×',    sub:'price spread' },
          ].map((s,i,a) => (
            <div key={s.sub} style={{ padding:'1.25rem 2rem', display:'flex', alignItems:'center', gap:'1rem', borderRight: i < a.length-1 ? '0.5px solid var(--color-border)' : 'none' }}>
              {s.icon}
              <div>
                <p style={{ fontFamily:'var(--font-display)', fontSize:22, color:'var(--color-text-1)', margin:0, lineHeight:1 }}>{s.val}</p>
                <p style={{ fontSize:11, color:'var(--color-text-3)', margin:'3px 0 0' }}>{s.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ══ WHAT WE MEASURE ════════════════════════════════════════════ */}
      <section style={{ maxWidth:1280, margin:'0 auto', padding:'4rem 2rem 5rem' }}>
        <p style={{ fontSize:11, letterSpacing:'2.5px', textTransform:'uppercase', color:'var(--color-text-3)', marginBottom:'2rem', display:'flex', alignItems:'center', gap:6 }}>
          <BarChart2 size={13} /> What the index tracks
        </p>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(260px,1fr))', gap:'1px', border:'0.5px solid var(--color-border)', borderRadius:12, overflow:'hidden' }}>
          {[
            { num:'01', label:'Baseline price',  body:"What you'd pay at a regular local restaurant. Not a tourist trap — just the going rate." },
            { num:'02', label:'Rent burden',      body:"How much of the average paycheck goes to rent before you've spent a dollar on food." },
            { num:'03', label:'Bowls after rent', body:"Once rent is paid, how many bowls can you actually afford? The most direct affordability signal." },
          ].map(c => (
            <div key={c.label} style={{ padding:'2rem', background:'var(--color-surface)' }}>
              <p style={{ fontSize:11, color:'var(--color-text-3)', margin:'0 0 1rem' }}>{c.num}</p>
              <h3 style={{ fontFamily:'var(--font-display)', fontSize:20, color:'var(--color-text-1)', margin:'0 0 .75rem', fontWeight:400 }}>{c.label}</h3>
              <p style={{ fontSize:13, color:'var(--color-text-2)', lineHeight:1.75, margin:0 }}>{c.body}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
