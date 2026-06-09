'use client'

import { supabase } from '@/lib/supabase'
import { useEffect, useRef, useState } from 'react'

/* ── Types ───────────────────────────────────────────────────────── */
type SpecCity = { city: string; flag: string | null; price_cad: number }

/* ── Hooks ───────────────────────────────────────────────────────── */
function useReveal(threshold = 0.2) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setVisible(true) },
      { threshold }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [threshold])
  return { ref, visible }
}

/* ── Spectrum colour ─────────────────────────────────────────────── */
function specColor(t: number) {
  // t = 0 (cheap) → 1 (expensive)
  if (t < 0.25) return '#3db870'
  if (t < 0.50) return '#a8b030'
  if (t < 0.75) return '#d9862a'
  return '#c0392b'
}

/* ── Ticker cities ───────────────────────────────────────────────── */
const TICKER = [
  '🇹🇭 Bangkok','🇨🇦 Toronto','🇵🇰 Karachi','🇳🇬 Lagos','🇰🇷 Seoul',
  '🇺🇸 New York','🇵🇭 Manila','🇬🇧 London','🇸🇬 Singapore','🇮🇳 Mumbai',
  '🇯🇵 Tokyo','🇪🇬 Cairo','🇦🇺 Sydney','🇦🇪 Dubai','🇦🇷 Buenos Aires',
  '🇹🇷 Istanbul','🇨🇦 Vancouver','🇮🇩 Jakarta','🇨🇳 Beijing','🇲🇽 Mexico City',
]

/* ══════════════════════════════════════════════════════════════════ */
export default function Home() {
  const heroRef  = useRef<HTMLDivElement>(null)
  const orb1Ref  = useRef<HTMLDivElement>(null)
  const orb2Ref  = useRef<HTMLDivElement>(null)

  const stats    = useReveal(0.2)
  const spectrum = useReveal(0.1)
  const spread   = useReveal(0.15)
  const metrics  = useReveal(0.15)
  const cta      = useReveal(0.15)

  const [cityCount,  setCityCount]  = useState(0)
  const [specCities, setSpecCities] = useState<SpecCity[]>([])

  /* Fetch spectrum data */
  useEffect(() => {
    supabase
      .from('cities')
      .select('city, flag, price_cad')
      .not('price_cad', 'is', null)
      .gt('price_cad', 0)
      .order('price_cad', { ascending: true })
      .then(({ data }) => { if (data) setSpecCities(data as SpecCity[]) })
  }, [])

  /* Parallax — direct DOM, no re-render */
  useEffect(() => {
    const fn = () => {
      const y = window.scrollY
      if (heroRef.current) {
        heroRef.current.style.transform = `translateY(${y * 0.26}px)`
        heroRef.current.style.opacity   = `${Math.max(0, 1 - y / 580)}`
      }
      if (orb1Ref.current) orb1Ref.current.style.transform = `translateY(${y * 0.14}px)`
      if (orb2Ref.current) orb2Ref.current.style.transform = `translateY(${-y * 0.07}px)`
    }
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [])

  /* City counter */
  useEffect(() => {
    if (!stats.visible) return
    const t0 = performance.now()
    const tick = (t: number) => {
      const p = Math.min((t - t0) / 1600, 1)
      setCityCount(Math.round(40 * (1 - Math.pow(1 - p, 3))))
      if (p < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [stats.visible])

  const minP = specCities[0]?.price_cad ?? 1.8
  const maxP = specCities[specCities.length - 1]?.price_cad ?? 20.68

  /* ── Render ────────────────────────────────────────────────────── */
  return (
    <main style={{ background: 'var(--color-bg)', color: 'var(--color-text-1)', fontFamily: 'var(--font-body)', overflowX: 'hidden', minHeight: '100vh' }}>
      <style>{`
        /* ── Keyframes ──────────────────────────────────── */
        @keyframes wordIn {
          from { opacity:0; transform:translateY(22px) skewY(1.5deg); }
          to   { opacity:1; transform:translateY(0)    skewY(0deg);   }
        }
        @keyframes floatA {
          0%,100% { transform:translateY(0)    scale(1);    }
          50%     { transform:translateY(-42px) scale(1.04); }
        }
        @keyframes floatB {
          0%,100% { transform:translateY(0);    }
          40%     { transform:translateY(28px); }
          70%     { transform:translateY(-16px);}
        }
        @keyframes floatC {
          0%,100% { transform:translateY(0)   rotate(0deg);  }
          50%     { transform:translateY(-18px) rotate(8deg); }
        }
        @keyframes ticker {
          0%   { transform:translateX(0);    }
          100% { transform:translateX(-50%); }
        }
        @keyframes nudge {
          0%,100% { opacity:.45; transform:translateY(0);   }
          50%     { opacity:.9;  transform:translateY(9px); }
        }
        @keyframes dotPulse {
          0%,100% { opacity:.6; transform:scale(1);   }
          50%     { opacity:1;  transform:scale(1.55);}
        }
        @keyframes railIn {
          from { width:0; opacity:0; }
          to   { opacity:1; }
        }

        /* ── Staggered headline ─────────────────────────── */
        .word {
          display:inline-block; opacity:0;
          animation: wordIn .75s cubic-bezier(.16,1,.3,1) forwards;
        }
        .word:nth-child(1) { animation-delay:.06s }
        .word:nth-child(2) { animation-delay:.20s }
        .word:nth-child(3) { animation-delay:.34s }
        .word:nth-child(4) { animation-delay:.48s }
        .word:nth-child(5) { animation-delay:.62s }
        .word:nth-child(6) { animation-delay:.76s }

        /* ── Noise texture overlay ──────────────────────── */
        .noise-layer::before {
          content:''; position:fixed; inset:0; pointer-events:none; z-index:9999;
          opacity:.018;
          background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
          background-size:200px;
        }

        /* ── Spectrum rail ──────────────────────────────── */
        .rail-enter { animation: railIn 1.4s .25s ease-out both; }
      `}</style>

      {/* ══ Nav ════════════════════════════════════════════════════ */}
      <nav style={{
        position:'fixed', top:0, left:0, right:0, zIndex:50,
        display:'flex', justifyContent:'space-between', alignItems:'center',
        padding:'.95rem 2rem',
        background:'rgba(9,16,10,.78)',
        backdropFilter:'blur(18px)', WebkitBackdropFilter:'blur(18px)',
        borderBottom:'0.5px solid var(--color-border)',
      }}>
        <span style={{ fontFamily:'var(--font-display)', fontSize:17, color:'var(--color-text-1)', fontStyle:'italic', letterSpacing:-.2 }}>
          fried rice{' '}
          <span style={{ color:'var(--color-accent)', fontStyle:'normal' }}>index</span>
        </span>
        <div style={{ display:'flex', gap:'1.5rem', alignItems:'center' }}>
          {[['cities','/cities'],['about','/about'],['methodology','/methodology']].map(([l,h]) => (
            <a key={h} href={h} style={{ fontSize:13, color:'var(--color-text-3)', textDecoration:'none', letterSpacing:'.03em' }}>{l}</a>
          ))}
          <a href="/explore" style={{
            fontSize:13, color:'var(--color-accent)', textDecoration:'none', letterSpacing:'.03em',
            padding:'.38rem .85rem', border:'0.5px solid rgba(217,104,42,.42)', borderRadius:8,
          }}>explore →</a>
        </div>
      </nav>

      {/* ══ Hero ═══════════════════════════════════════════════════ */}
      <section className="noise-layer" style={{
        minHeight:'100vh', position:'relative', overflow:'hidden',
        display:'flex', alignItems:'center', paddingTop:64,
      }}>
        {/* Grid */}
        <div style={{
          position:'absolute', inset:0, pointerEvents:'none',
          backgroundImage:[
            'linear-gradient(rgba(255,255,255,.028) 1px, transparent 1px)',
            'linear-gradient(90deg, rgba(255,255,255,.028) 1px, transparent 1px)',
          ].join(','),
          backgroundSize:'76px 76px',
        }} />
        {/* Vignette */}
        <div style={{
          position:'absolute', inset:0, pointerEvents:'none',
          background:'radial-gradient(ellipse 80% 68% at 50% 50%, transparent 18%, var(--color-bg) 86%)',
        }} />

        {/* Orb 1 — warm orange */}
        <div ref={orb1Ref} style={{ position:'absolute', top:'6%', right:'1%', pointerEvents:'none' }}>
          <div style={{
            width:640, height:640,
            background:'radial-gradient(circle, var(--color-accent-glow) 0%, transparent 58%)',
            filter:'blur(65px)', animation:'floatA 12s ease-in-out infinite',
          }} />
        </div>

        {/* Orb 2 — cool green */}
        <div ref={orb2Ref} style={{ position:'absolute', bottom:'-4%', left:'-9%', pointerEvents:'none' }}>
          <div style={{
            width:540, height:540,
            background:'radial-gradient(circle, rgba(61,184,112,.14) 0%, transparent 58%)',
            filter:'blur(75px)', animation:'floatB 16s ease-in-out infinite',
          }} />
        </div>

        {/* Orb 3 — amber mid */}
        <div style={{ position:'absolute', top:'38%', left:'34%', pointerEvents:'none' }}>
          <div style={{
            width:400, height:400,
            background:'radial-gradient(circle, rgba(196,137,15,.07) 0%, transparent 65%)',
            filter:'blur(100px)', animation:'floatC 22s ease-in-out infinite',
          }} />
        </div>

        {/* Giant background bowl */}
        <div style={{
          position:'absolute', right:'5%', bottom:'5%',
          fontSize:'clamp(120px,23vw,260px)', opacity:.038,
          transform:'rotate(-15deg)', animation:'floatA 20s ease-in-out infinite',
          userSelect:'none', pointerEvents:'none', lineHeight:1,
        }}>🍚</div>

        {/* Copy — parallax target */}
        <div ref={heroRef} style={{ position:'relative', zIndex:2, padding:'0 2rem', maxWidth:1060 }}>
          {/* Eyebrow */}
          <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:'2.5rem' }}>
            <div style={{ width:44, height:1, background:'rgba(217,104,42,.5)' }} />
            <span style={{ fontSize:11, letterSpacing:'2.8px', textTransform:'uppercase', color:'var(--color-text-3)' }}>
              The Fried Rice Index · 2025
            </span>
          </div>

          {/* Headline — word-by-word stagger */}
          <h1 style={{
            fontFamily:'var(--font-display)',
            fontSize:'clamp(58px,11vw,130px)',
            lineHeight:.88, letterSpacing:-4,
            margin:'0 0 2.5rem', color:'var(--color-text-1)',
          }}>
            <span className="word">What</span>{' '}
            <span className="word">does</span>
            <br />
            <span className="word">fried</span>{' '}
            <span className="word">rice</span>
            <br />
            <em className="word" style={{ color:'var(--color-accent)' }}>reveal?</em>
          </h1>

          <p style={{ fontSize:'clamp(15px,1.8vw,19px)', color:'var(--color-text-2)', maxWidth:400, lineHeight:1.75, margin:'0 0 3.5rem' }}>
            One dish. Forty cities. The prices will surprise you.
          </p>

          {/* Floating bowls */}
          <div style={{ display:'flex', alignItems:'flex-end', gap:10 }}>
            <span style={{ fontSize:30, animation:'floatC 6s ease-in-out infinite' }}>🍚</span>
            <span style={{ fontSize:22, opacity:.5, animation:'floatC 8.5s ease-in-out infinite 1.8s' }}>🍚</span>
            <span style={{ fontSize:14, opacity:.22, animation:'floatC 12s ease-in-out infinite 3.5s' }}>🍚</span>
          </div>
        </div>

        {/* Scroll hint */}
        <div style={{
          position:'absolute', bottom:'2.2rem', left:'2rem',
          display:'flex', flexDirection:'column', alignItems:'flex-start', gap:6,
          animation:'nudge 2.6s ease-in-out infinite',
        }}>
          <span style={{ fontSize:10, letterSpacing:'2.2px', textTransform:'uppercase', color:'var(--color-text-4)' }}>Scroll</span>
          <div style={{ width:1, height:48, background:'linear-gradient(to bottom, var(--color-text-4), transparent)' }} />
        </div>
      </section>

      {/* ══ Ticker ═════════════════════════════════════════════════ */}
      <div style={{
        borderTop:'0.5px solid var(--color-border)', borderBottom:'0.5px solid var(--color-border)',
        background:'var(--color-surface)', padding:'.85rem 0', overflow:'hidden', whiteSpace:'nowrap',
      }}>
        <div style={{ display:'inline-flex', animation:'ticker 32s linear infinite' }}>
          {[...TICKER,...TICKER].map((city, i) => (
            <span key={i} style={{ margin:'0 2.4rem', fontSize:12, color:'var(--color-text-4)', letterSpacing:'.04em', fontWeight:300 }}>
              {city}
            </span>
          ))}
        </div>
      </div>

      {/* ══ 11.5× ══════════════════════════════════════════════════ */}
      <section ref={stats.ref} style={{ padding:'10rem 2rem 6rem', textAlign:'center', position:'relative' }}>
        {/* Ambient glow */}
        <div style={{
          position:'absolute', top:'50%', left:'50%',
          width:700, height:500,
          background:'radial-gradient(ellipse, var(--color-accent-dim) 0%, transparent 58%)',
          filter:'blur(90px)', transform:'translate(-50%,-50%)', pointerEvents:'none',
        }} />

        {/* Live badge */}
        <div style={{
          display:'inline-flex', alignItems:'center', gap:9,
          border:'0.5px solid var(--color-border)', borderRadius:100, padding:'.38rem 1rem',
          marginBottom:'3rem',
          transition:'opacity .9s', opacity:stats.visible ? 1 : 0,
        }}>
          <div style={{ width:6, height:6, borderRadius:'50%', background:'var(--color-green)', animation:'dotPulse 2s ease-in-out infinite' }} />
          <span style={{ fontSize:11, letterSpacing:'1.6px', textTransform:'uppercase', color:'var(--color-text-3)', fontFamily:'var(--font-body)' }}>
            across {cityCount} cities
          </span>
        </div>

        {/* Big number */}
        <div style={{
          fontFamily:'var(--font-display)',
          fontSize:'clamp(90px,19vw,220px)',
          color:'var(--color-accent)',
          lineHeight:.84, letterSpacing:-6, margin:'0 0 1.5rem',
          transition:'opacity 1s .12s, transform 1s .12s',
          opacity:stats.visible ? 1 : 0,
          transform:stats.visible ? 'translateY(0)' : 'translateY(55px)',
        }}>
          11.5×
        </div>

        <p style={{
          fontSize:'clamp(16px,2.2vw,22px)', color:'var(--color-text-3)', margin:0,
          transition:'opacity .9s .32s', opacity:stats.visible ? 1 : 0,
        }}>
          price difference — cheapest bowl to most expensive
        </p>
      </section>

      {/* ══ Price Spectrum ═════════════════════════════════════════ */}
      {specCities.length > 0 && (
        <section ref={spectrum.ref} style={{ padding:'2rem 0 7rem', position:'relative' }}>
          <div style={{ padding:'0 2rem', maxWidth:1280, margin:'0 auto' }}>

            <p style={{
              fontSize:11, letterSpacing:'2.5px', textTransform:'uppercase',
              color:'var(--color-text-3)', marginBottom:'4rem',
              transition:'opacity .8s', opacity:spectrum.visible ? 1 : 0,
            }}>
              Price spectrum — every indexed city
            </p>

            {/* Spectrum visualisation */}
            <div style={{ position:'relative', height:260, userSelect:'none' }}>

              {/* Rail */}
              <div style={{
                position:'absolute', bottom:110, left:0, right:0, height:2,
                background:'var(--color-surface-2)',
                borderRadius:2,
              }}>
                <div
                  className={spectrum.visible ? 'rail-enter' : ''}
                  style={{
                    height:'100%', borderRadius:2,
                    width: spectrum.visible ? '100%' : '0%',
                    background:'linear-gradient(to right, #3db870 0%, #a8b030 40%, #d9862a 70%, #c0392b 100%)',
                    transition:'width 1.6s .3s cubic-bezier(.4,0,.2,1)',
                  }}
                />
              </div>

              {/* City dots + labels */}
              {specCities.map((city, i) => {
                const t   = specCities.length < 2 ? 0.5 : (city.price_cad - minP) / (maxP - minP)
                const pct = t * 94 + 3   // 3%…97% so labels don't clip
                const col = specColor(t)
                const above = i % 2 === 0

                return (
                  <div key={city.city} style={{
                    position:'absolute',
                    left:`${pct}%`,
                    bottom:110,
                    transform:'translateX(-50%)',
                    display:'flex',
                    flexDirection: above ? 'column-reverse' : 'column',
                    alignItems:'center',
                    gap:0,
                    transition:`opacity .5s ${.35 + i * .035}s`,
                    opacity: spectrum.visible ? 1 : 0,
                  }}>
                    {/* Label */}
                    <div style={{
                      display:'flex', flexDirection:'column', alignItems:'center',
                      paddingBottom: above ? 0 : 4,
                      paddingTop:    above ? 4 : 0,
                    }}>
                      <span style={{ fontSize:9.5, fontWeight:600, color:col, whiteSpace:'nowrap', lineHeight:1.2 }}>
                        CA${city.price_cad.toFixed(2)}
                      </span>
                      <span style={{ fontSize:8.5, color:'var(--color-text-3)', whiteSpace:'nowrap', lineHeight:1.2, marginTop:1 }}>
                        {city.flag} {city.city}
                      </span>
                    </div>
                    {/* Tick */}
                    <div style={{ width:1, height:above ? 28 : 28, background:col, opacity:.45 }} />
                    {/* Dot */}
                    <div style={{ width:6, height:6, borderRadius:'50%', background:col, flexShrink:0 }} />
                  </div>
                )
              })}
            </div>

            {/* Axis */}
            <div style={{
              display:'flex', justifyContent:'space-between',
              transition:'opacity .8s .7s', opacity:spectrum.visible ? 1 : 0,
            }}>
              <span style={{ fontSize:10, color:'var(--color-text-4)', letterSpacing:'1.5px', textTransform:'uppercase' }}>Cheapest</span>
              <span style={{ fontSize:10, color:'var(--color-text-4)', letterSpacing:'1.5px', textTransform:'uppercase' }}>Most expensive</span>
            </div>
          </div>
        </section>
      )}

      {/* ══ Split screen ═══════════════════════════════════════════ */}
      <section ref={spread.ref} style={{ display:'flex', minHeight:'55vh', position:'relative', overflow:'hidden' }}>
        {/* Left — cheap */}
        <div style={{
          flex:1,
          background:'linear-gradient(135deg, rgba(20,52,26,.48) 0%, rgba(9,16,10,.28) 100%)',
          display:'flex', flexDirection:'column', justifyContent:'center',
          padding:'clamp(2rem,6vw,5rem)',
          borderRight:'0.5px solid rgba(255,255,255,.04)',
          transition:'opacity .9s, transform .9s',
          opacity:spread.visible ? 1 : 0,
          transform:spread.visible ? 'translateX(0)' : 'translateX(-28px)',
        }}>
          <span style={{ fontSize:10, letterSpacing:'2.5px', textTransform:'uppercase', color:'var(--color-green)', marginBottom:'1.25rem', display:'block' }}>
            Floor of the index
          </span>
          <div style={{ fontFamily:'var(--font-display)', fontSize:'clamp(56px,9vw,96px)', color:'var(--color-green)', lineHeight:1, letterSpacing:-2 }}>
            CA$1.80
          </div>
          <p style={{ fontSize:15, color:'var(--color-text-3)', marginTop:'1rem', lineHeight:1.6, maxWidth:280 }}>
            a bowl at the cheapest city in the index
          </p>
        </div>

        {/* Centre badge */}
        <div style={{
          position:'absolute', top:'50%', left:'50%',
          transform:'translate(-50%,-50%)', zIndex:2,
          background:'var(--color-bg)', border:'0.5px solid var(--color-border)',
          borderRadius:100, padding:'.6rem 1.3rem',
          transition:'opacity 1s .28s', opacity:spread.visible ? 1 : 0,
          whiteSpace:'nowrap',
        }}>
          <span style={{ fontFamily:'var(--font-display)', fontSize:28, color:'var(--color-accent)', lineHeight:1 }}>11.5×</span>
        </div>

        {/* Right — expensive */}
        <div style={{
          flex:1,
          background:'linear-gradient(225deg, rgba(52,14,5,.48) 0%, rgba(9,16,10,.28) 100%)',
          display:'flex', flexDirection:'column', justifyContent:'center', alignItems:'flex-end',
          padding:'clamp(2rem,6vw,5rem)',
          borderLeft:'0.5px solid rgba(255,255,255,.04)',
          transition:'opacity .9s, transform .9s',
          opacity:spread.visible ? 1 : 0,
          transform:spread.visible ? 'translateX(0)' : 'translateX(28px)',
        }}>
          <span style={{ fontSize:10, letterSpacing:'2.5px', textTransform:'uppercase', color:'var(--color-red)', marginBottom:'1.25rem', display:'block', textAlign:'right' }}>
            Ceiling of the index
          </span>
          <div style={{ fontFamily:'var(--font-display)', fontSize:'clamp(56px,9vw,96px)', color:'var(--color-red)', lineHeight:1, letterSpacing:-2, textAlign:'right' }}>
            CA$20.68
          </div>
          <p style={{ fontSize:15, color:'var(--color-text-3)', marginTop:'1rem', lineHeight:1.6, textAlign:'right', maxWidth:280 }}>
            a bowl at the priciest city in the index
          </p>
        </div>
      </section>

      {/* ══ What we measure ════════════════════════════════════════ */}
      <section ref={metrics.ref} style={{ padding:'8rem 2rem', maxWidth:1120, margin:'0 auto' }}>
        <div style={{
          marginBottom:'4.5rem',
          transition:'opacity .85s, transform .85s',
          opacity:metrics.visible ? 1 : 0,
          transform:metrics.visible ? 'translateY(0)' : 'translateY(26px)',
        }}>
          <span style={{ fontSize:11, letterSpacing:'2.8px', textTransform:'uppercase', color:'var(--color-text-3)', display:'block', marginBottom:'1rem' }}>
            what the index tracks
          </span>
          <h2 style={{ fontFamily:'var(--font-display)', fontSize:'clamp(36px,5.5vw,60px)', color:'var(--color-text-1)', margin:0, lineHeight:1.04 }}>
            Food prices show you<br />
            <em style={{ color:'var(--color-accent)' }}>what the stats don&apos;t.</em>
          </h2>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(280px, 1fr))', gap:'1.2rem' }}>
          {[
            { icon:'🥡', title:'Baseline price',   desc:"What you'd pay at a regular local restaurant — not a tourist trap, not a Michelin spot. Just the going rate.",                                  delay:'0s'   },
            { icon:'🏠', title:'Rent burden',       desc:"How much of the average paycheck disappears to rent before you've spent a dollar on food.",                                                     delay:'.18s' },
            { icon:'🍚', title:'Bowls after rent',  desc:"Once rent is paid, how many bowls can you actually buy that month? More honest than any index number.",                                         delay:'.36s' },
          ].map(m => (
            <div key={m.title} style={{
              padding:'2rem', border:'0.5px solid var(--color-border)',
              borderRadius:14, background:'var(--color-surface)',
              transition:`opacity .8s ${m.delay}, transform .8s ${m.delay}`,
              opacity:metrics.visible ? 1 : 0,
              transform:metrics.visible ? 'translateY(0)' : 'translateY(34px)',
            }}>
              <div style={{ fontSize:28, marginBottom:'1.2rem' }}>{m.icon}</div>
              <h3 style={{ fontFamily:'var(--font-display)', fontSize:22, color:'var(--color-text-1)', margin:'0 0 .75rem', fontWeight:400 }}>{m.title}</h3>
              <p style={{ fontSize:13, color:'var(--color-text-2)', lineHeight:1.8, margin:0 }}>{m.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ══ CTA ════════════════════════════════════════════════════ */}
      <section ref={cta.ref} style={{ padding:'8rem 2rem 11rem', textAlign:'center', position:'relative', overflow:'hidden' }}>
        {/* Bottom glow */}
        <div style={{
          position:'absolute', bottom:'-130px', left:'50%',
          width:960, height:540,
          background:'radial-gradient(ellipse, var(--color-accent-dim) 0%, transparent 56%)',
          filter:'blur(90px)', transform:'translateX(-50%)', pointerEvents:'none',
        }} />

        <span style={{
          fontSize:11, letterSpacing:'2.8px', textTransform:'uppercase', color:'var(--color-text-3)',
          display:'block', marginBottom:'2rem',
          transition:'opacity .85s', opacity:cta.visible ? 1 : 0,
        }}>
          40 cities · live data
        </span>

        <h2 style={{
          fontFamily:'var(--font-display)',
          fontSize:'clamp(46px,9.5vw,108px)',
          color:'var(--color-text-1)', lineHeight:.92, letterSpacing:-3,
          margin:'0 0 3.5rem',
          transition:'opacity .85s .14s, transform .85s .14s',
          opacity:cta.visible ? 1 : 0,
          transform:cta.visible ? 'translateY(0)' : 'translateY(32px)',
        }}>
          See for<br />
          <em style={{ color:'var(--color-accent)' }}>yourself.</em>
        </h2>

        <div style={{
          display:'flex', gap:'1rem', justifyContent:'center', flexWrap:'wrap',
          transition:'opacity .85s .28s, transform .85s .28s',
          opacity:cta.visible ? 1 : 0,
          transform:cta.visible ? 'translateY(0)' : 'translateY(22px)',
        }}>
          <a href="/explore" style={{
            padding:'1.1rem 2.8rem', borderRadius:12,
            background:'var(--color-accent)', color:'#fff',
            textDecoration:'none', fontSize:16, letterSpacing:'.02em',
            fontFamily:'var(--font-body)',
            display:'inline-flex', alignItems:'center', gap:8,
          }}>
            Open the map <span aria-hidden>→</span>
          </a>
          <a href="/cities" style={{
            padding:'1.1rem 2.8rem', borderRadius:12,
            border:'0.5px solid var(--color-border)', color:'var(--color-text-2)',
            textDecoration:'none', fontSize:16, letterSpacing:'.02em',
            fontFamily:'var(--font-body)',
          }}>
            Browse all cities
          </a>
        </div>
      </section>
    </main>
  )
}
