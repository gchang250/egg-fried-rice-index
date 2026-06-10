'use client'

import { useEffect, useRef, useState } from 'react'
import {
  ChevronRight, RotateCcw, Expand,
  MapPin, X, ExternalLink, Globe,
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
  if (!cad) return '-'
  const v = cad * (RATES[cur] ?? 1)
  return `${SYMBOLS[cur] ?? 'CA$'}${v.toLocaleString(undefined, { minimumFractionDigits: v >= 100 ? 0 : 2, maximumFractionDigits: v >= 100 ? 0 : 2 })}`
}

const Q = '?auto=format&fit=crop&w=1920&q=85'

/* Each slide has its own verified fried rice photo */
const SLIDES = [
  {
    num: '1',     color: '#d9682a', glow: 'rgba(217,104,42,.25)',
    label: 'dish',    body: 'A bowl of egg fried rice. One dish, wherever you are in the world.',
    img: `https://images.unsplash.com/photo-1603133872878-684f208fb84b${Q}`,
  },
  {
    num: '40',    color: '#3db870', glow: 'rgba(61,184,112,.2)',
    label: 'cities',  body: 'Indexed across forty cities on six continents, from Cairo to Seoul.',
    img: `https://images.unsplash.com/photo-1596560548464-f010549b84d7${Q}`,
  },
  {
    num: '8.8×',  color: '#d9682a', glow: 'rgba(217,104,42,.25)',
    label: 'spread',  body: 'The cheapest bowl costs nearly nine times less than the priciest. Same dish, opposite ends of the world, CA$19 apart.',
    img: `https://images.unsplash.com/photo-1512058564366-18510be2db19${Q}`,
  },
  {
    num: '→',     color: '#f0ece4', glow: 'rgba(240,236,228,.12)',
    label: 'explore', body: 'The data is live. See what fried rice costs where you live, and everywhere else.',
    img: `https://images.unsplash.com/photo-1609570324378-ec0c4c9b6ba8${Q}`,
  },
]

/* Hero — fried rice in a black pan, confirmed Unsplash CDN */
const HERO_IMG = `https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7${Q}`

/* Price spectrum bar — % position = (price_cad - 2.51) / (21.88 - 2.51), June 2026 data */
const SPECTRUM: { name: string; pct: number; color: string; show: boolean }[] = [
  { name:'Karachi',   pct:0,   color:'#3db870', show:true  },
  { name:'Tehran',    pct:5,   color:'#3db870', show:false },
  { name:'Kolkata',   pct:8,   color:'#3db870', show:false },
  { name:'Chengdu',   pct:11,  color:'#3db870', show:false },
  { name:'Istanbul',  pct:16,  color:'#d9682a', show:false },
  { name:'Tokyo',     pct:20,  color:'#d9682a', show:false },
  { name:'Singapore', pct:26,  color:'#d9682a', show:true  },
  { name:'Seoul',     pct:34,  color:'#d9682a', show:false },
  { name:'Hong Kong', pct:46,  color:'#d9682a', show:true  },
  { name:'Toronto',   pct:49,  color:'#c4890f', show:false },
  { name:'Chicago',   pct:59,  color:'#c4890f', show:false },
  { name:'L.A.',      pct:68,  color:'#c4890f', show:true  },
  { name:'Paris',     pct:74,  color:'#b83418', show:false },
  { name:'London',    pct:100, color:'#b83418', show:true  },
]

/* ══════════════════════════════════════════════════════════════════════ */
export default function Home() {
  const mapRef  = useRef<WorldMapHandle>(null)
  const [selected, setSelected] = useState<MapCity | null>(null)
  const [currency, setCurrency] = useState('CAD')
  const [slide, setSlide]       = useState(0)
  const [scrollY, setScrollY]   = useState(0)

  const t0 = useRef<HTMLDivElement>(null)
  const t1 = useRef<HTMLDivElement>(null)
  const t2 = useRef<HTMLDivElement>(null)
  const t3 = useRef<HTMLDivElement>(null)
  const triggers = [t0, t1, t2, t3]

  /* Scroll tracking for parallax */
  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  /* Slide detection */
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
  const heroParallax = scrollY * 0.38

  return (
    <div style={{ background:'var(--color-bg)', color:'var(--color-text-1)', fontFamily:'var(--font-body)', minHeight:'100vh' }}>
      <style>{`
        @keyframes popIn{from{opacity:0;transform:scale(.88)}to{opacity:1;transform:scale(1)}}
        @keyframes slideIn{from{opacity:0;transform:translateX(-14px)}to{opacity:1;transform:none}}
        @keyframes imgReveal{from{opacity:0;transform:scale(1.07) perspective(900px) rotateX(4deg)}to{opacity:1;transform:scale(1) perspective(900px) rotateX(0deg)}}
        @keyframes grain{0%,100%{transform:translate(0,0)}20%{transform:translate(-2%,-3%)}40%{transform:translate(3%,2%)}60%{transform:translate(-1%,4%)}80%{transform:translate(2%,-1%)}}
      `}</style>

      <NavBar fixed />

      {/* ══ HERO ═══════════════════════════════════════════════════════ */}
      <section style={{ position:'relative', overflow:'hidden', height:'100vh', display:'flex', alignItems:'center' }}>

        {/* Fried rice photo — parallax layer */}
        <div style={{
          position:'absolute', inset:'-20% 0',
          backgroundImage:`url(${HERO_IMG})`,
          backgroundSize:'cover', backgroundPosition:'center',
          transform:`translateY(${heroParallax}px)`,
          willChange:'transform',
        }} />

        {/* Layered dark overlays for editorial depth */}
        <div style={{ position:'absolute', inset:0, background:'linear-gradient(to bottom, rgba(6,10,7,.65) 0%, rgba(6,10,7,.3) 40%, rgba(6,10,7,.75) 100%)' }} />
        <div style={{ position:'absolute', inset:0, background:'radial-gradient(ellipse 80% 60% at 60% 40%, transparent 30%, rgba(6,10,7,.5) 100%)' }} />

        {/* Film grain overlay */}
        <div style={{
          position:'absolute', inset:0, pointerEvents:'none', opacity:.045,
          backgroundImage:`url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          backgroundSize:'200px 200px',
          animation:'grain 6s steps(1) infinite',
        }} />

        {/* Content */}
        <div style={{ position:'relative', zIndex:2, maxWidth:1280, margin:'0 auto', padding:'6rem 2rem 4rem', width:'100%' }}>

          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:'1.5rem' }}>
            <MapPin size={12} color="var(--color-accent)" />
            <span style={{ fontSize:10, letterSpacing:'3px', textTransform:'uppercase', color:'rgba(240,236,228,.6)' }}>40 cities · food-based affordability index</span>
          </div>

          <h1 style={{ fontFamily:'var(--font-display)', fontSize:'clamp(52px,8.5vw,110px)', fontWeight:400, lineHeight:.88, letterSpacing:-3, color:'#f0ece4', margin:'0 0 1.75rem', textShadow:'0 2px 40px rgba(0,0,0,.4)' }}>
            The Fried<br /><em style={{ color:'var(--color-accent)' }}>Rice Index.</em>
          </h1>

          <p style={{ fontSize:'clamp(15px,1.6vw,19px)', color:'rgba(240,236,228,.72)', maxWidth:460, lineHeight:1.7, margin:'0 0 2.5rem', textShadow:'0 1px 12px rgba(0,0,0,.3)' }}>
            Restaurant prices across forty cities, and what they reveal about the cost of living everywhere.
          </p>

          <div style={{ display:'flex', gap:'0.75rem', flexWrap:'wrap' }}>
            <a href="/cities" style={{ display:'inline-flex', alignItems:'center', gap:7, padding:'.85rem 1.75rem', borderRadius:8, background:'var(--color-accent)', color:'#fff', textDecoration:'none', fontSize:14, fontWeight:500, boxShadow:'0 4px 24px rgba(217,104,42,.35)' }}>
              Browse cities <ChevronRight size={15} />
            </a>
            <a href="/explore" style={{ display:'inline-flex', alignItems:'center', gap:7, padding:'.85rem 1.75rem', borderRadius:8, border:'1px solid rgba(240,236,228,.25)', color:'rgba(240,236,228,.85)', textDecoration:'none', fontSize:14, backdropFilter:'blur(8px)', WebkitBackdropFilter:'blur(8px)', background:'rgba(255,255,255,.06)' }}>
              Full map <Expand size={14} />
            </a>
          </div>

          {/* Scroll cue */}
          <div style={{ position:'absolute', bottom:'3rem', left:'50%', transform:'translateX(-50%)', display:'flex', flexDirection:'column', alignItems:'center', gap:6, opacity:.45 }}>
            <span style={{ fontSize:9, letterSpacing:'2.5px', textTransform:'uppercase', color:'#f0ece4' }}>scroll</span>
            <div style={{ width:1, height:40, background:'linear-gradient(to bottom, rgba(240,236,228,.6), transparent)' }} />
          </div>
        </div>
      </section>

      {/* ══ STICKY SCROLL NARRATIVE ════════════════════════════════════ */}
      <div style={{ height:'400vh', position:'relative' }}>

        {[t0,t1,t2,t3].map((ref,i) => (
          <div key={i} ref={ref} style={{ position:'absolute', top:`${i * 25}%`, height:'25%', width:'100%', pointerEvents:'none' }} />
        ))}

        <div style={{ position:'sticky', top:0, height:'100vh', display:'flex', overflow:'hidden', borderTop:'0.5px solid var(--color-border)' }}>

          {/* Left — fried rice photo + giant number */}
          <div style={{ flex:1, position:'relative', overflow:'hidden', borderRight:'0.5px solid var(--color-border)' }}>

            {/* All slide images stacked, cross-fade on slide change */}
            {SLIDES.map((sl, i) => (
              <div key={sl.img} style={{
                position:'absolute', inset:0,
                backgroundImage:`url(${sl.img})`,
                backgroundSize:'cover', backgroundPosition:'center',
                opacity: i === slide ? 1 : 0,
                transform: i === slide ? 'scale(1) perspective(1200px) rotateX(0deg)' : 'scale(1.06) perspective(1200px) rotateX(3deg)',
                transition:'opacity .9s ease, transform 1.4s cubic-bezier(.16,1,.3,1)',
              }} />
            ))}

            {/* Dark overlay so the number reads cleanly */}
            <div style={{ position:'absolute', inset:0, background:'rgba(6,10,7,.58)' }} />
            <div style={{ position:'absolute', inset:0, background:`radial-gradient(circle at center, ${S.glow} 0%, transparent 60%)`, transition:'background .8s ease' }} />

            {/* Giant number */}
            <div key={`num-${slide}`} style={{
              position:'absolute', inset:0,
              display:'flex', alignItems:'center', justifyContent:'center',
              fontFamily:'var(--font-display)',
              fontSize:'clamp(100px,20vw,280px)',
              color: S.color,
              lineHeight:1,
              letterSpacing:-6,
              animation:'popIn .45s cubic-bezier(.16,1,.3,1)',
              textShadow:`0 0 100px ${S.glow}, 0 4px 40px rgba(0,0,0,.5)`,
              userSelect:'none',
            }}>
              {S.num}
            </div>
          </div>

          {/* Right — text */}
          <div style={{ width:'40%', display:'flex', flexDirection:'column', justifyContent:'center', padding:'clamp(2rem,5vw,5rem)', background:'var(--color-bg)' }}>
            <div style={{ display:'flex', gap:6, marginBottom:'2.5rem', alignItems:'center' }}>
              {SLIDES.map((sl,i) => (
                <div key={i} style={{ height:4, borderRadius:2, width: i===slide ? 28 : 4, background: i===slide ? sl.color : 'var(--color-border)', transition:'all .5s cubic-bezier(.16,1,.3,1)' }} />
              ))}
              <span style={{ marginLeft:8, fontSize:11, color:'var(--color-text-3)', letterSpacing:'1px' }}>{String(slide+1).padStart(2,'0')} / 04</span>
            </div>

            <div key={`txt-${slide}`} style={{ animation:'slideIn .45s cubic-bezier(.16,1,.3,1)' }}>
              <h2 style={{ fontFamily:'var(--font-display)', fontSize:'clamp(44px,5vw,72px)', color: S.color, margin:'0 0 1.25rem', lineHeight:.94, letterSpacing:-1.5 }}>
                {S.label}
              </h2>
              <p style={{ fontSize:'clamp(15px,1.6vw,18px)', color:'var(--color-text-2)', lineHeight:1.8, margin:0, maxWidth:340 }}>
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
          <div style={{ flex:1, overflow:'hidden' }}>
            <WorldMap ref={mapRef} onSelect={setSelected} selected={selected} mapH={440} />
          </div>
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

      {/* ══ PRICE GAP ══════════════════════════════════════════════════ */}
      <section style={{ borderTop:'0.5px solid var(--color-border)', borderBottom:'0.5px solid var(--color-border)', padding:'6rem 0 5rem' }}>
        <div style={{ maxWidth:1280, margin:'0 auto', padding:'0 2rem' }}>

          <p style={{ fontSize:10, letterSpacing:'3px', textTransform:'uppercase', color:'var(--color-text-3)', margin:'0 0 4rem' }}>
            Baseline price · basic &amp; vegetable · 40 cities · June 2026
          </p>

          {/* Cheapest / spread / priciest */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 140px 1fr', gap:'2rem', alignItems:'flex-end', marginBottom:'4rem' }}>

            <div>
              <p style={{ fontSize:11, color:'#3db870', letterSpacing:'2px', textTransform:'uppercase', margin:'0 0 .5rem' }}>Cheapest · Karachi 🇵🇰</p>
              <p style={{ fontFamily:'var(--font-display)', fontSize:'clamp(64px,7vw,108px)', color:'#3db870', margin:0, lineHeight:.85, letterSpacing:-3 }}>CA$2.51</p>
              <p style={{ fontSize:12, color:'var(--color-text-3)', margin:'.75rem 0 0', lineHeight:1.5 }}>Budget Indo-Chinese, Burns Road area</p>
            </div>

            <div style={{ textAlign:'center', paddingBottom:'.25rem' }}>
              <p style={{ fontFamily:'var(--font-display)', fontSize:'clamp(40px,5vw,60px)', color:'var(--color-accent)', margin:0, lineHeight:1 }}>8.8×</p>
              <div style={{ width:1, height:24, background:'var(--color-border)', margin:'.75rem auto' }} />
              <p style={{ fontSize:10, letterSpacing:'2px', textTransform:'uppercase', color:'var(--color-text-3)', margin:0 }}>spread</p>
            </div>

            <div style={{ textAlign:'right' }}>
              <p style={{ fontSize:11, color:'#b83418', letterSpacing:'2px', textTransform:'uppercase', margin:'0 0 .5rem' }}>Priciest · London 🇬🇧</p>
              <p style={{ fontFamily:'var(--font-display)', fontSize:'clamp(64px,7vw,108px)', color:'#b83418', margin:0, lineHeight:.85, letterSpacing:-3 }}>CA$21.88</p>
              <p style={{ fontSize:12, color:'var(--color-text-3)', margin:'.75rem 0 0', lineHeight:1.5 }}>Soho Chinatown, mid-tier</p>
            </div>
          </div>

          {/* Price spectrum bar */}
          <div style={{ position:'relative', height:52, margin:'0 0 3.5rem' }}>
            <div style={{ position:'absolute', top:'50%', left:0, right:0, height:1, background:'var(--color-border)', transform:'translateY(-50%)' }} />
            <div style={{ position:'absolute', top:'50%', left:0, right:0, height:2, background:'linear-gradient(to right,#3db870 0%,#d9682a 45%,#b83418 100%)', transform:'translateY(-50%)', borderRadius:1 }} />
            {SPECTRUM.map(c => (
              <div key={c.name} style={{ position:'absolute', top:'50%', left:`${c.pct}%`, transform:'translate(-50%,-50%)', zIndex:2 }}>
                <div style={{ width:c.show ? 10 : 6, height:c.show ? 10 : 6, borderRadius:'50%', background:c.color, border:'1.5px solid var(--color-bg)', margin:'0 auto' }} />
                {c.show && (
                  <p style={{ position:'absolute', top:'140%', left:'50%', transform:'translateX(-50%)', fontSize:9, color:'var(--color-text-3)', whiteSpace:'nowrap', margin:0, letterSpacing:'.5px' }}>{c.name}</p>
                )}
              </div>
            ))}
          </div>

          {/* Secondary stats — no boxes */}
          <div style={{ display:'flex', paddingTop:'2rem', borderTop:'0.5px solid var(--color-border)' }}>
            {[
              { val:'40',      sub:'cities indexed' },
              { val:'6',       sub:'continents' },
              { val:'22+',     sub:'entries per city' },
              { val:'Monthly', sub:'data updates' },
            ].map((s, i, a) => (
              <div key={s.sub} style={{ flex:1, paddingLeft: i > 0 ? '2rem' : 0, paddingRight: i < a.length-1 ? '2rem' : 0, borderRight: i < a.length-1 ? '0.5px solid var(--color-border)' : 'none' }}>
                <p style={{ fontFamily:'var(--font-display)', fontSize:26, color:'var(--color-text-1)', margin:0, lineHeight:1 }}>{s.val}</p>
                <p style={{ fontSize:11, color:'var(--color-text-3)', margin:'4px 0 0' }}>{s.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ WHAT WE TRACK ══════════════════════════════════════════════ */}
      <section style={{ maxWidth:1280, margin:'0 auto', padding:'5rem 2rem 6rem' }}>
        <p style={{ fontSize:11, letterSpacing:'2.5px', textTransform:'uppercase', color:'var(--color-text-3)', marginBottom:'3rem' }}>
          What the index tracks
        </p>

        <div>
          {([
            {
              num:'01', title:'Baseline price',
              body:"What you'd pay at a regular local restaurant — the local rate, no tourist markup. Calculated as the median of all basic and vegetable fried rice entries per city.",
              stat: null as string | null, statCaption:'',
            },
            {
              num:'02', title:'Rent burden',
              body:'Monthly rent as a share of median salary, measured before any food spending. Buenos Aires, Tehran, and Cairo require nearly all of a typical paycheck for housing alone.',
              stat:'92%', statCaption:'Buenos Aires · highest burden',
            },
            {
              num:'03', title:'Bowls after rent',
              body:"Once rent is paid, how many bowls can a median earner afford per month? The most direct signal of what everyday food affordability actually looks like in a city.",
              stat: null as string | null, statCaption:'',
            },
          ]).map(item => (
            <div key={item.num} style={{ padding:'3rem 0', borderTop:'0.5px solid var(--color-border)' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:'2rem' }}>
                <div style={{ flex:1 }}>
                  <p style={{ fontSize:10, letterSpacing:'2px', color:'var(--color-text-3)', margin:'0 0 .5rem' }}>{item.num}</p>
                  <h3 style={{ fontFamily:'var(--font-display)', fontSize:'clamp(36px,4vw,52px)', color:'var(--color-text-1)', margin:'0 0 1.25rem', fontWeight:400, letterSpacing:-1, lineHeight:.95 }}>
                    {item.title}.
                  </h3>
                  <p style={{ fontSize:15, color:'var(--color-text-2)', lineHeight:1.75, maxWidth:580, margin:0 }}>
                    {item.body}
                  </p>
                </div>
                {item.stat && (
                  <div style={{ textAlign:'right', flexShrink:0, paddingTop:'.5rem' }}>
                    <p style={{ fontFamily:'var(--font-display)', fontSize:'clamp(56px,7vw,88px)', color:'#b83418', margin:0, lineHeight:.9, letterSpacing:-2 }}>{item.stat}</p>
                    <p style={{ fontSize:11, color:'var(--color-text-3)', margin:'.5rem 0 0', letterSpacing:'.5px' }}>{item.statCaption}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
          <div style={{ borderTop:'0.5px solid var(--color-border)' }} />
        </div>
      </section>
    </div>
  )
}
