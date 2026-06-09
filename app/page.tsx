'use client'

import { supabase } from '@/lib/supabase'
import { useEffect, useRef, useState } from 'react'

type SpecCity = { city: string; flag: string | null; price_cad: number }

function useReveal(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true) }, { threshold })
    obs.observe(el)
    return () => obs.disconnect()
  }, [threshold])
  return { ref, visible }
}

function specColor(t: number) {
  if (t < 0.25) return '#3db870'
  if (t < 0.5)  return '#a8b030'
  if (t < 0.75) return '#d9862a'
  return '#c0392b'
}

const TICKER = [
  '🇹🇭 Bangkok','🇨🇦 Toronto','🇵🇰 Karachi','🇳🇬 Lagos','🇰🇷 Seoul',
  '🇺🇸 New York','🇵🇭 Manila','🇬🇧 London','🇸🇬 Singapore','🇮🇳 Mumbai',
  '🇯🇵 Tokyo','🇪🇬 Cairo','🇦🇺 Sydney','🇦🇪 Dubai','🇦🇷 Buenos Aires',
  '🇹🇷 Istanbul','🇨🇦 Vancouver','🇮🇩 Jakarta','🇨🇳 Beijing','🇲🇽 Mexico City',
]

const SLIDES = [
  { num: '1',     color: '#d9682a', label: 'dish',   body: 'A bowl of egg fried rice. One dish, wherever you are in the world.' },
  { num: '40',    color: '#3db870', label: 'cities',  body: 'Indexed across forty cities on six continents, from Lagos to Seoul.' },
  { num: '11.5×', color: '#d9682a', label: 'spread',  body: 'The cheapest bowl costs eleven and a half times less than the most expensive one.' },
  { num: '→',     color: '#f0ece4', label: 'explore', body: 'The data is live. Click through and see what fried rice costs where you live.' },
]

export default function Home() {
  const heroRef   = useRef<HTMLDivElement>(null)
  const orb1Ref   = useRef<HTMLDivElement>(null)
  const orb2Ref   = useRef<HTMLDivElement>(null)
  const stickyRef = useRef<HTMLDivElement>(null)

  const metrics  = useReveal(0.15)
  const spectrum = useReveal(0.1)

  const [slide, setSlide]           = useState(0)
  const [specCities, setSpecCities] = useState<SpecCity[]>([])

  useEffect(() => {
    supabase.from('cities').select('city, flag, price_cad')
      .not('price_cad', 'is', null).gt('price_cad', 0)
      .order('price_cad', { ascending: true })
      .then(({ data }) => { if (data) setSpecCities(data as SpecCity[]) })
  }, [])

  useEffect(() => {
    const fn = () => {
      const y = window.scrollY
      if (heroRef.current) {
        heroRef.current.style.transform = `translateY(${y * 0.22}px)`
        heroRef.current.style.opacity   = `${Math.max(0, 1 - y / 700)}`
      }
      if (orb1Ref.current) orb1Ref.current.style.transform = `translateY(${y * 0.11}px)`
      if (orb2Ref.current) orb2Ref.current.style.transform = `translateY(${-y * 0.06}px)`

      if (stickyRef.current) {
        const rect     = stickyRef.current.getBoundingClientRect()
        const total    = stickyRef.current.offsetHeight - window.innerHeight
        const progress = Math.max(0, Math.min(1, -rect.top / total))
        setSlide(Math.min(3, Math.floor(progress * 4)))
      }
    }
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [])

  const minP = specCities[0]?.price_cad ?? 1.8
  const maxP = specCities[specCities.length - 1]?.price_cad ?? 20.68

  return (
    <main style={{ background: 'var(--color-bg)', color: 'var(--color-text-1)', fontFamily: 'var(--font-body)', overflowX: 'hidden' }}>
      <style>{`
        @keyframes orb1 { 0%,100%{transform:translate(0,0)scale(1)}  33%{transform:translate(-5%,6%)scale(1.07)}  66%{transform:translate(6%,-3%)scale(.95)} }
        @keyframes orb2 { 0%,100%{transform:translate(0,0)scale(1)}  40%{transform:translate(6%,-5%)scale(1.09)}  80%{transform:translate(-5%,4%)scale(.93)} }
        @keyframes orb3 { 0%,100%{transform:translate(0,0)scale(1)}  25%{transform:translate(4%,5%)scale(1.05)}   75%{transform:translate(-4%,-4%)scale(.96)} }
        @keyframes orb4 { 0%,100%{transform:translate(0,0)scale(1)}  50%{transform:translate(-7%,3%)scale(1.1)} }
        @keyframes ticker  { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
        @keyframes ticker2 { 0%{transform:translateX(-50%)} 100%{transform:translateX(0)} }
        @keyframes nudge   { 0%,100%{opacity:.4;transform:translateY(0)} 50%{opacity:.8;transform:translateY(9px)} }
        @keyframes popIn   { from{opacity:0;transform:scale(.92) translateY(16px)} to{opacity:1;transform:scale(1) translateY(0)} }
        @keyframes slideIn { from{opacity:0;transform:translateX(-12px)} to{opacity:1;transform:translateX(0)} }
        @keyframes pulse   { 0%,100%{opacity:.5;transform:scale(1)} 50%{opacity:1;transform:scale(1.5)} }
      `}</style>

      {/* ══ NAV ═══════════════════════════════════════════════════════════════ */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '.9rem 2rem',
        background: 'rgba(9,13,10,.82)',
        backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '0.5px solid var(--color-border)',
      }}>
        <a href="/" style={{ fontFamily: 'var(--font-display)', fontSize: 17, color: 'var(--color-text-1)', textDecoration: 'none', fontStyle: 'italic', letterSpacing: -.2 }}>
          fried rice{' '}<span style={{ color: 'var(--color-accent)', fontStyle: 'normal' }}>index</span>
        </a>
        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
          {[['cities','/cities'],['submit','/submit'],['about','/about'],['methodology','/methodology']].map(([l,h]) => (
            <a key={h} href={h} style={{ fontSize: 13, color: 'var(--color-text-3)', textDecoration: 'none', letterSpacing: '.02em' }}>{l}</a>
          ))}
          <a href="/explore" style={{ fontSize: 13, color: 'var(--color-accent)', textDecoration: 'none', padding: '.35rem .85rem', border: '0.5px solid rgba(217,104,42,.42)', borderRadius: 8, letterSpacing: '.02em' }}>
            explore →
          </a>
        </div>
      </nav>

      {/* ══ HERO ══════════════════════════════════════════════════════════════ */}
      <section style={{ minHeight: '100vh', position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', paddingTop: 60 }}>

        {/* Aurora blobs */}
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          <div ref={orb1Ref} style={{ position: 'absolute', top: '-10%', right: '-8%' }}>
            <div style={{ width: 900, height: 900, background: 'radial-gradient(circle, rgba(217,104,42,.26) 0%, transparent 58%)', filter: 'blur(90px)', animation: 'orb1 14s ease-in-out infinite' }} />
          </div>
          <div ref={orb2Ref} style={{ position: 'absolute', bottom: '-12%', left: '-12%' }}>
            <div style={{ width: 800, height: 800, background: 'radial-gradient(circle, rgba(61,184,112,.19) 0%, transparent 58%)', filter: 'blur(90px)', animation: 'orb2 19s ease-in-out infinite' }} />
          </div>
          <div style={{ position: 'absolute', top: '35%', left: '22%' }}>
            <div style={{ width: 600, height: 600, background: 'radial-gradient(circle, rgba(196,137,15,.13) 0%, transparent 62%)', filter: 'blur(110px)', animation: 'orb3 24s ease-in-out infinite' }} />
          </div>
          <div style={{ position: 'absolute', top: '5%', left: '-10%' }}>
            <div style={{ width: 600, height: 600, background: 'radial-gradient(circle, rgba(180,55,20,.16) 0%, transparent 58%)', filter: 'blur(90px)', animation: 'orb4 17s ease-in-out infinite' }} />
          </div>
        </div>

        {/* Grid */}
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', backgroundImage: 'linear-gradient(rgba(255,255,255,.032) 1px, transparent 1px),linear-gradient(90deg, rgba(255,255,255,.032) 1px, transparent 1px)', backgroundSize: '80px 80px' }} />
        {/* Vignette */}
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'radial-gradient(ellipse 90% 75% at 50% 50%, transparent 10%, var(--color-bg) 80%)' }} />

        {/* Giant decorative 🍚 */}
        <div style={{ position: 'absolute', right: '4%', bottom: '4%', fontSize: 'clamp(140px,26vw,320px)', opacity: .035, transform: 'rotate(-12deg)', userSelect: 'none', pointerEvents: 'none', lineHeight: 1 }}>🍚</div>

        {/* Copy */}
        <div ref={heroRef} style={{ position: 'relative', zIndex: 2, padding: '0 2rem', width: '100%', maxWidth: 1300 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '2.5rem' }}>
            <div style={{ width: 40, height: '0.5px', background: 'var(--color-accent)' }} />
            <span style={{ fontSize: 11, letterSpacing: '2.8px', textTransform: 'uppercase', color: 'var(--color-text-3)' }}>The Fried Rice Index · 2025</span>
          </div>

          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(80px,15vw,220px)', lineHeight: .82, letterSpacing: -6, margin: '0 0 2.5rem', color: 'var(--color-text-1)' }}>
            What<br />
            does<br />
            fried<br />
            <em style={{ color: 'var(--color-accent)' }}>rice</em><br />
            <em style={{ color: 'var(--color-accent)' }}>reveal?</em>
          </h1>

          <p style={{ fontSize: 'clamp(15px,1.8vw,20px)', color: 'var(--color-text-2)', maxWidth: 400, lineHeight: 1.72, margin: 0 }}>
            One dish. Forty cities.<br />The prices will surprise you.
          </p>
        </div>

        {/* Scroll hint */}
        <div style={{ position: 'absolute', bottom: '2rem', left: '2rem', animation: 'nudge 2.6s ease-in-out infinite', display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ fontSize: 10, letterSpacing: '2.2px', textTransform: 'uppercase', color: 'var(--color-text-4)' }}>Scroll</span>
          <div style={{ width: 1, height: 48, background: 'linear-gradient(to bottom, var(--color-text-4), transparent)' }} />
        </div>
      </section>

      {/* ══ DUAL TICKERS ══════════════════════════════════════════════════════ */}
      <div style={{ borderTop: '0.5px solid var(--color-border)', borderBottom: '0.5px solid var(--color-border)', background: 'var(--color-surface)', overflow: 'hidden' }}>
        <div style={{ padding: '.65rem 0', whiteSpace: 'nowrap', overflow: 'hidden' }}>
          <div style={{ display: 'inline-flex', animation: 'ticker 28s linear infinite' }}>
            {[...TICKER,...TICKER].map((c,i) => <span key={i} style={{ margin: '0 2rem', fontSize: 12, color: 'var(--color-text-4)', letterSpacing: '.04em' }}>{c}</span>)}
          </div>
        </div>
        <div style={{ padding: '.65rem 0', whiteSpace: 'nowrap', overflow: 'hidden', borderTop: '0.5px solid var(--color-border)' }}>
          <div style={{ display: 'inline-flex', animation: 'ticker2 22s linear infinite' }}>
            {[...TICKER,...TICKER].reverse().map((c,i) => <span key={i} style={{ margin: '0 2rem', fontSize: 12, color: 'var(--color-accent)', opacity: .45, letterSpacing: '.04em' }}>{c}</span>)}
          </div>
        </div>
      </div>

      {/* ══ STICKY SCROLL NARRATIVE ═══════════════════════════════════════════ */}
      <div ref={stickyRef} style={{ height: '420vh', position: 'relative' }}>
        <div style={{ position: 'sticky', top: 0, height: '100vh', display: 'flex', overflow: 'hidden' }}>

          {/* Left — giant animated number */}
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden', borderRight: '0.5px solid var(--color-border)' }}>
            {/* Ambient glow behind number */}
            <div style={{
              position: 'absolute', inset: 0,
              background: `radial-gradient(circle at center, ${SLIDES[slide].color === '#3db870' ? 'rgba(61,184,112,.1)' : 'rgba(217,104,42,.12)'} 0%, transparent 60%)`,
              transition: 'background 1s ease',
            }} />
            {/* Number */}
            <div key={`num-${slide}`} style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(120px, 22vw, 300px)',
              color: SLIDES[slide].color,
              lineHeight: 1,
              letterSpacing: -8,
              position: 'relative', zIndex: 1,
              animation: 'popIn .45s cubic-bezier(.16,1,.3,1)',
              textShadow: `0 0 120px ${SLIDES[slide].color}55`,
            }}>
              {SLIDES[slide].num}
            </div>
          </div>

          {/* Right — text */}
          <div style={{ width: '42%', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: 'clamp(2rem,5vw,5rem)' }}>
            {/* Progress pills */}
            <div style={{ display: 'flex', gap: 6, marginBottom: '3rem', alignItems: 'center' }}>
              {SLIDES.map((s, i) => (
                <div key={i} style={{
                  height: 6, borderRadius: 3,
                  width: i === slide ? 28 : 6,
                  background: i === slide ? s.color : 'var(--color-border)',
                  transition: 'all .5s cubic-bezier(.16,1,.3,1)',
                }} />
              ))}
              <span style={{ marginLeft: 8, fontSize: 11, color: 'var(--color-text-3)', letterSpacing: '1.5px' }}>
                {String(slide + 1).padStart(2,'0')} / 04
              </span>
            </div>

            <div key={`text-${slide}`} style={{ animation: 'slideIn .4s cubic-bezier(.16,1,.3,1)' }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(44px,5vw,76px)', color: SLIDES[slide].color, margin: '0 0 1.25rem', lineHeight: .95, letterSpacing: -1.5 }}>
                {SLIDES[slide].label}
              </h2>
              <p style={{ fontSize: 'clamp(15px,1.6vw,19px)', color: 'var(--color-text-2)', lineHeight: 1.75, margin: 0, maxWidth: 360 }}>
                {SLIDES[slide].body}
              </p>
            </div>

            {/* Progress bar */}
            <div style={{ marginTop: '3.5rem', height: '0.5px', background: 'var(--color-border)', borderRadius: 1, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${((slide + 1) / 4) * 100}%`, background: SLIDES[slide].color, transition: 'width .6s cubic-bezier(.16,1,.3,1), background .5s ease' }} />
            </div>

            {slide === 3 && (
              <div style={{ marginTop: '2.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <a href="/explore" style={{ padding: '.8rem 1.8rem', borderRadius: 10, background: 'var(--color-accent)', color: '#fff', textDecoration: 'none', fontSize: 14, fontFamily: 'var(--font-body)' }}>Open the map →</a>
                <a href="/cities" style={{ padding: '.8rem 1.8rem', borderRadius: 10, border: '0.5px solid var(--color-border)', color: 'var(--color-text-2)', textDecoration: 'none', fontSize: 14, fontFamily: 'var(--font-body)' }}>Browse cities</a>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ══ PRICE SPECTRUM ════════════════════════════════════════════════════ */}
      {specCities.length > 0 && (
        <section ref={spectrum.ref} style={{ padding: '6rem 0 8rem' }}>
          <div style={{ padding: '0 2rem', maxWidth: 1280, margin: '0 auto' }}>
            <p style={{ fontSize: 11, letterSpacing: '2.5px', textTransform: 'uppercase', color: 'var(--color-text-3)', marginBottom: '4rem', transition: 'opacity .8s', opacity: spectrum.visible ? 1 : 0 }}>
              Price spectrum — every indexed city
            </p>
            <div style={{ position: 'relative', height: 260 }}>
              <div style={{ position: 'absolute', bottom: 110, left: 0, right: 0, height: 2, background: 'var(--color-surface-2)', borderRadius: 2 }}>
                <div style={{ height: '100%', borderRadius: 2, width: spectrum.visible ? '100%' : '0%', background: 'linear-gradient(to right, #3db870, #a8b030, #d9862a, #c0392b)', transition: 'width 1.6s .3s cubic-bezier(.4,0,.2,1)' }} />
              </div>
              {specCities.map((city, i) => {
                const t    = (city.price_cad - minP) / (maxP - minP)
                const pct  = t * 94 + 3
                const col  = specColor(t)
                const above = i % 2 === 0
                return (
                  <div key={city.city} style={{ position: 'absolute', left: `${pct}%`, bottom: 110, transform: 'translateX(-50%)', display: 'flex', flexDirection: above ? 'column-reverse' : 'column', alignItems: 'center', transition: `opacity .5s ${.3 + i * .035}s`, opacity: spectrum.visible ? 1 : 0 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingBottom: above ? 0 : 4, paddingTop: above ? 4 : 0 }}>
                      <span style={{ fontSize: 9.5, fontWeight: 600, color: col, whiteSpace: 'nowrap' }}>CA${city.price_cad.toFixed(2)}</span>
                      <span style={{ fontSize: 8.5, color: 'var(--color-text-3)', whiteSpace: 'nowrap', marginTop: 1 }}>{city.flag} {city.city}</span>
                    </div>
                    <div style={{ width: 1, height: 28, background: col, opacity: .45 }} />
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: col }} />
                  </div>
                )
              })}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', transition: 'opacity .8s .7s', opacity: spectrum.visible ? 1 : 0 }}>
              <span style={{ fontSize: 10, color: 'var(--color-text-4)', letterSpacing: '1.5px', textTransform: 'uppercase' }}>Cheapest</span>
              <span style={{ fontSize: 10, color: 'var(--color-text-4)', letterSpacing: '1.5px', textTransform: 'uppercase' }}>Most expensive</span>
            </div>
          </div>
        </section>
      )}

      {/* ══ METRIC CARDS ══════════════════════════════════════════════════════ */}
      <section ref={metrics.ref} style={{ padding: '4rem 2rem 8rem', maxWidth: 1120, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px,1fr))', gap: '1.2rem' }}>
          {[
            { icon:'🥡', title:'Baseline price',  desc:"What you'd pay at a regular local restaurant — not a tourist trap, not a Michelin spot. Just the going rate.", delay:'0s' },
            { icon:'🏠', title:'Rent burden',      desc:"How much of the average paycheck disappears to rent before you've spent a dollar on food.", delay:'.15s' },
            { icon:'🍚', title:'Bowls after rent', desc:"Once rent is paid, how many bowls can you actually afford that month? More honest than any statistic.", delay:'.3s' },
          ].map(m => (
            <div key={m.title} style={{ padding: '2rem', border: '0.5px solid var(--color-border)', borderRadius: 14, background: 'var(--color-surface)', transition: `opacity .75s ${m.delay}, transform .75s ${m.delay}`, opacity: metrics.visible ? 1 : 0, transform: metrics.visible ? 'translateY(0)' : 'translateY(30px)' }}>
              <div style={{ fontSize: 28, marginBottom: '1.2rem' }}>{m.icon}</div>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 22, color: 'var(--color-text-1)', margin: '0 0 .75rem', fontWeight: 400 }}>{m.title}</h3>
              <p style={{ fontSize: 13, color: 'var(--color-text-2)', lineHeight: 1.8, margin: 0 }}>{m.desc}</p>
            </div>
          ))}
        </div>
      </section>

    </main>
  )
}
