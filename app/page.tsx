'use client'

import { useEffect, useRef, useState } from 'react'

function useReveal(threshold = 0.2) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true) },
      { threshold }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [threshold])
  return { ref, visible }
}

const TICKER_CITIES = [
  '🇹🇭 Bangkok', '🇨🇦 Toronto', '🇨🇭 Zurich', '🇵🇰 Karachi', '🇳🇬 Lagos',
  '🇰🇷 Seoul', '🇺🇸 New York', '🇵🇭 Manila', '🇬🇧 London', '🇸🇬 Singapore',
  '🇮🇳 Mumbai', '🇯🇵 Tokyo', '🇪🇬 Cairo', '🇦🇺 Sydney', '🇦🇪 Dubai',
  '🇦🇷 Buenos Aires', '🇹🇷 Istanbul', '🇨🇦 Vancouver', '🇮🇩 Jakarta', '🇨🇳 Beijing',
]

export default function Home() {
  const heroTextRef  = useRef<HTMLDivElement>(null)
  const orb1Ref      = useRef<HTMLDivElement>(null)
  const orb2Ref      = useRef<HTMLDivElement>(null)
  const bigRiceRef   = useRef<HTMLDivElement>(null)

  const stats   = useReveal(0.25)
  const metrics = useReveal(0.15)
  const cta     = useReveal(0.15)

  const [cityCount, setCityCount] = useState(0)

  // Animate city counter when stats section enters view
  useEffect(() => {
    if (!stats.visible) return
    const target = 40
    const duration = 1600
    const start = performance.now()
    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - t, 3)
      setCityCount(Math.round(target * eased))
      if (t < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [stats.visible])

  // Parallax — direct DOM mutation, no state, no re-renders
  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY
      if (heroTextRef.current) {
        heroTextRef.current.style.transform = `translateY(${y * 0.28}px)`
        heroTextRef.current.style.opacity   = `${Math.max(0, 1 - y / 550)}`
      }
      if (orb1Ref.current)    orb1Ref.current.style.transform    = `translateY(${y * 0.14}px)`
      if (orb2Ref.current)    orb2Ref.current.style.transform    = `translateY(${-y * 0.07}px)`
      if (bigRiceRef.current) bigRiceRef.current.style.transform = `rotate(-15deg) translateY(${-y * 0.04}px)`
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <main style={{ fontFamily: 'DM Sans, sans-serif', background: '#0c0f0d', color: '#e8e4dc', overflowX: 'hidden', minHeight: '100vh' }}>
      <style>{`
        @keyframes floatA {
          0%,100% { transform:translateY(0px) scale(1); }
          50%      { transform:translateY(-38px) scale(1.04); }
        }
        @keyframes floatB {
          0%,100% { transform:translateY(0px); }
          33%     { transform:translateY(24px); }
          66%     { transform:translateY(-13px); }
        }
        @keyframes floatC {
          0%,100% { transform:translateY(0px) rotate(0deg); }
          50%     { transform:translateY(-20px) rotate(9deg); }
        }
        @keyframes ticker {
          0%   { transform:translateX(0); }
          100% { transform:translateX(-50%); }
        }
        @keyframes scrollPulse {
          0%,100% { opacity:0.35; transform:translateY(0); }
          50%     { opacity:0.8;  transform:translateY(9px); }
        }
        @keyframes dotPulse {
          0%,100% { opacity:0.5; transform:scale(1); }
          50%     { opacity:1;   transform:scale(1.4); }
        }
      `}</style>

      {/* ── Glassmorphism Nav ──────────────────────────────────────────────── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '1rem 2rem',
        background: 'rgba(12,15,13,0.72)',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
        borderBottom: '0.5px solid rgba(30,38,30,0.7)',
      }}>
        <span style={{ fontFamily: 'DM Serif Display, serif', fontSize: 17, color: '#e8e4dc' }}>
          fried rice <span style={{ color: '#d9682a' }}>index</span>
        </span>
        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
          {[['cities', '/cities'], ['about', '/about'], ['methodology', '/methodology']].map(([l, h]) => (
            <a key={h} href={h} style={{ fontSize: 13, color: '#4a4a42', textDecoration: 'none' }}>{l}</a>
          ))}
          <a href="/explore" style={{
            fontSize: 13, color: '#d9682a', textDecoration: 'none',
            padding: '0.38rem 0.85rem',
            border: '0.5px solid rgba(217,104,42,0.45)',
            borderRadius: 8,
          }}>
            explore →
          </a>
        </div>
      </nav>

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section style={{
        minHeight: '100vh', position: 'relative', overflow: 'hidden',
        display: 'flex', alignItems: 'center', paddingTop: 64,
      }}>
        {/* Grid */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          backgroundImage: [
            'linear-gradient(rgba(26,42,30,0.38) 1px, transparent 1px)',
            'linear-gradient(90deg, rgba(26,42,30,0.38) 1px, transparent 1px)',
          ].join(','),
          backgroundSize: '80px 80px',
        }} />

        {/* Radial vignette over grid */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'radial-gradient(ellipse 80% 70% at 50% 50%, transparent 20%, #0c0f0d 85%)',
        }} />

        {/* Orb 1 — orange, top-right */}
        <div ref={orb1Ref} style={{ position: 'absolute', top: '8%', right: '3%', pointerEvents: 'none' }}>
          <div style={{
            width: 580, height: 580,
            background: 'radial-gradient(circle, rgba(217,104,42,0.22) 0%, transparent 62%)',
            filter: 'blur(55px)',
            animation: 'floatA 11s ease-in-out infinite',
          }} />
        </div>

        {/* Orb 2 — green, bottom-left */}
        <div ref={orb2Ref} style={{ position: 'absolute', bottom: '2%', left: '-6%', pointerEvents: 'none' }}>
          <div style={{
            width: 500, height: 500,
            background: 'radial-gradient(circle, rgba(52,168,90,0.16) 0%, transparent 62%)',
            filter: 'blur(65px)',
            animation: 'floatB 14s ease-in-out infinite',
          }} />
        </div>

        {/* Orb 3 — amber, mid */}
        <div style={{ position: 'absolute', top: '35%', left: '32%', pointerEvents: 'none' }}>
          <div style={{
            width: 360, height: 360,
            background: 'radial-gradient(circle, rgba(196,137,15,0.09) 0%, transparent 68%)',
            filter: 'blur(90px)',
            animation: 'floatC 18s ease-in-out infinite',
          }} />
        </div>

        {/* Giant decorative rice bowl */}
        <div ref={bigRiceRef} style={{
          position: 'absolute', right: '7%', bottom: '8%',
          fontSize: 'clamp(110px, 22vw, 240px)',
          opacity: 0.045,
          transform: 'rotate(-15deg)',
          animation: 'floatA 16s ease-in-out infinite',
          userSelect: 'none', pointerEvents: 'none', lineHeight: 1,
        }}>🍚</div>

        {/* Hero copy — parallax target */}
        <div ref={heroTextRef} style={{ position: 'relative', zIndex: 2, padding: '0 2rem', maxWidth: 1050 }}>
          {/* Eyebrow */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: '2.5rem' }}>
            <div style={{ width: 44, height: 1, background: 'rgba(217,104,42,0.6)' }} />
            <span style={{ fontSize: 11, letterSpacing: '2.8px', textTransform: 'uppercase', color: '#3d3d36' }}>
              The Fried Rice Index · 2025
            </span>
          </div>

          {/* Headline */}
          <h1 style={{
            fontFamily: 'DM Serif Display, serif',
            fontSize: 'clamp(54px, 10.5vw, 122px)',
            lineHeight: 0.9,
            letterSpacing: -4,
            color: '#f0ece4',
            margin: '0 0 2.5rem',
          }}>
            What does<br />
            fried rice<br />
            <em style={{ color: '#d9682a' }}>reveal?</em>
          </h1>

          {/* Sub */}
          <p style={{
            fontSize: 'clamp(15px, 1.8vw, 19px)',
            color: '#434340',
            maxWidth: 420,
            lineHeight: 1.78,
            margin: '0 0 3.5rem',
          }}>
            One dish. 40 cities. An index that cuts through economic noise to show what life actually costs.
          </p>

          {/* Floating rice stack */}
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10 }}>
            <span style={{ fontSize: 30, animation: 'floatC 6s ease-in-out infinite' }}>🍚</span>
            <span style={{ fontSize: 22, opacity: 0.5, animation: 'floatC 8.5s ease-in-out infinite 1.8s' }}>🍚</span>
            <span style={{ fontSize: 14, opacity: 0.22, animation: 'floatC 12s ease-in-out infinite 3.5s' }}>🍚</span>
          </div>
        </div>

        {/* Scroll hint */}
        <div style={{
          position: 'absolute', bottom: '2.2rem', left: '2rem',
          display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 6,
        }}>
          <span style={{ fontSize: 10, letterSpacing: '2.2px', textTransform: 'uppercase', color: '#242420', animation: 'scrollPulse 2.6s ease-in-out infinite' }}>Scroll</span>
          <div style={{ width: 1, height: 48, background: 'linear-gradient(to bottom, #2a2a22, transparent)' }} />
        </div>
      </section>

      {/* ── Ticker ────────────────────────────────────────────────────────── */}
      <div style={{
        borderTop: '0.5px solid #111611', borderBottom: '0.5px solid #111611',
        background: '#090c09', padding: '0.85rem 0', overflow: 'hidden', whiteSpace: 'nowrap',
      }}>
        <div style={{ display: 'inline-flex', animation: 'ticker 32s linear infinite' }}>
          {[...TICKER_CITIES, ...TICKER_CITIES].map((city, i) => (
            <span key={i} style={{ margin: '0 2.2rem', fontSize: 12, color: '#1f261f', letterSpacing: '0.4px', fontWeight: 300 }}>
              {city}
            </span>
          ))}
        </div>
      </div>

      {/* ── The Number ────────────────────────────────────────────────────── */}
      <section ref={stats.ref} style={{ padding: '10rem 2rem', textAlign: 'center', position: 'relative' }}>
        {/* Subtle glow behind the number */}
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          width: 700, height: 500,
          background: 'radial-gradient(ellipse, rgba(217,104,42,0.08) 0%, transparent 58%)',
          filter: 'blur(90px)',
          transform: 'translate(-50%,-50%)',
          pointerEvents: 'none',
        }} />

        {/* Live badge */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 9,
          border: '0.5px solid #1e261e', borderRadius: 100, padding: '0.38rem 1rem',
          marginBottom: '3rem',
          transition: 'opacity 0.9s',
          opacity: stats.visible ? 1 : 0,
        }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#34a85a', animation: 'dotPulse 2s ease-in-out infinite' }} />
          <span style={{ fontSize: 11, letterSpacing: '1.6px', textTransform: 'uppercase', color: '#3d3d36' }}>
            across {cityCount} cities
          </span>
        </div>

        {/* Big multiplier */}
        <div style={{
          fontFamily: 'DM Serif Display, serif',
          fontSize: 'clamp(88px, 19vw, 216px)',
          color: '#d9682a',
          lineHeight: 0.84,
          letterSpacing: -6,
          margin: '0 0 1.5rem',
          position: 'relative',
          transition: 'opacity 1s 0.12s, transform 1s 0.12s',
          opacity: stats.visible ? 1 : 0,
          transform: stats.visible ? 'translateY(0)' : 'translateY(55px)',
        }}>
          11.5×
        </div>

        <p style={{
          fontSize: 'clamp(16px, 2.2vw, 22px)', color: '#323230',
          margin: '0 0 6rem',
          transition: 'opacity 0.9s 0.32s',
          opacity: stats.visible ? 1 : 0,
        }}>
          price difference — from the cheapest bowl to the most expensive
        </p>

        {/* Price cards */}
        <div style={{
          display: 'flex', justifyContent: 'center', gap: '1.5rem', flexWrap: 'wrap',
          transition: 'opacity 0.9s 0.5s, transform 0.9s 0.5s',
          opacity: stats.visible ? 1 : 0,
          transform: stats.visible ? 'translateY(0)' : 'translateY(28px)',
        }}>
          {[
            { val: 'CA$1.80',  label: 'cheapest bowl',    city: 'Karachi, Pakistan',     color: '#34a85a' },
            { val: 'CA$20.68', label: 'most expensive',   city: 'Zurich, Switzerland',   color: '#b83418' },
          ].map(s => (
            <div key={s.val} style={{
              padding: '2rem 3rem',
              border: '0.5px solid #1a2218',
              borderRadius: 16,
              background: 'rgba(16,20,16,0.6)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              minWidth: 190,
            }}>
              <div style={{ fontFamily: 'DM Serif Display, serif', fontSize: 48, color: s.color, lineHeight: 1 }}>{s.val}</div>
              <div style={{ fontSize: 12, color: '#4a4a42', marginTop: 8 }}>{s.label}</div>
              <div style={{ fontSize: 11, color: '#2e2e2a', marginTop: 4 }}>{s.city}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── What we measure ───────────────────────────────────────────────── */}
      <section ref={metrics.ref} style={{ padding: '4rem 2rem 8rem', maxWidth: 1120, margin: '0 auto' }}>
        <div style={{
          marginBottom: '4.5rem',
          transition: 'opacity 0.85s, transform 0.85s',
          opacity: metrics.visible ? 1 : 0,
          transform: metrics.visible ? 'translateY(0)' : 'translateY(26px)',
        }}>
          <span style={{ fontSize: 11, letterSpacing: '2.8px', textTransform: 'uppercase', color: '#323230', display: 'block', marginBottom: '1rem' }}>
            what the index measures
          </span>
          <h2 style={{
            fontFamily: 'DM Serif Display, serif',
            fontSize: 'clamp(36px, 5.5vw, 60px)',
            color: '#f0ece4', margin: 0, lineHeight: 1.04,
          }}>
            Food prices reveal<br />
            <em style={{ color: '#d9682a' }}>what GDP hides.</em>
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.2rem' }}>
          {[
            {
              icon: '🥡',
              title: 'Baseline price',
              desc: 'The median cost of a standard bowl of egg fried rice, normalised to remove restaurant tier bias.',
              delay: '0s',
            },
            {
              icon: '🏠',
              title: 'Rent burden',
              desc: 'What fraction of median salary goes to a 1-bedroom. Anchors food prices in real living costs.',
              delay: '0.18s',
            },
            {
              icon: '🍚',
              title: 'Bowls after rent',
              desc: 'How many bowls you can afford with disposable income after rent — the most direct affordability signal.',
              delay: '0.36s',
            },
          ].map(m => (
            <div key={m.title} style={{
              padding: '2rem',
              border: '0.5px solid #181e18',
              borderRadius: 14,
              background: '#101310',
              transition: `opacity 0.8s ${m.delay}, transform 0.8s ${m.delay}`,
              opacity: metrics.visible ? 1 : 0,
              transform: metrics.visible ? 'translateY(0)' : 'translateY(34px)',
            }}>
              <div style={{ fontSize: 28, marginBottom: '1.2rem' }}>{m.icon}</div>
              <h3 style={{ fontFamily: 'DM Serif Display, serif', fontSize: 22, color: '#e0dcd4', margin: '0 0 0.75rem', fontWeight: 400 }}>{m.title}</h3>
              <p style={{ fontSize: 13, color: '#404040', lineHeight: 1.78, margin: 0 }}>{m.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────────────────── */}
      <section ref={cta.ref} style={{ padding: '8rem 2rem 11rem', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        {/* Bottom glow */}
        <div style={{
          position: 'absolute', bottom: '-120px', left: '50%',
          width: 950, height: 520,
          background: 'radial-gradient(ellipse, rgba(217,104,42,0.13) 0%, transparent 58%)',
          filter: 'blur(90px)',
          transform: 'translateX(-50%)',
          pointerEvents: 'none',
        }} />

        <span style={{
          fontSize: 11, letterSpacing: '2.8px', textTransform: 'uppercase', color: '#2e2e2a',
          display: 'block', marginBottom: '2rem', position: 'relative',
          transition: 'opacity 0.85s',
          opacity: cta.visible ? 1 : 0,
        }}>
          40 cities · live data
        </span>

        <h2 style={{
          fontFamily: 'DM Serif Display, serif',
          fontSize: 'clamp(46px, 9.5vw, 104px)',
          color: '#f0ece4',
          lineHeight: 0.92,
          letterSpacing: -3,
          margin: '0 0 3.5rem',
          position: 'relative',
          transition: 'opacity 0.85s 0.14s, transform 0.85s 0.14s',
          opacity: cta.visible ? 1 : 0,
          transform: cta.visible ? 'translateY(0)' : 'translateY(32px)',
        }}>
          Ready to<br />
          <em style={{ color: '#d9682a' }}>explore?</em>
        </h2>

        <div style={{
          display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap',
          position: 'relative',
          transition: 'opacity 0.85s 0.28s, transform 0.85s 0.28s',
          opacity: cta.visible ? 1 : 0,
          transform: cta.visible ? 'translateY(0)' : 'translateY(22px)',
        }}>
          <a href="/explore" style={{
            padding: '1.05rem 2.6rem',
            borderRadius: 12,
            background: '#d9682a',
            color: '#fff',
            textDecoration: 'none',
            fontSize: 16,
            fontFamily: 'DM Sans, sans-serif',
            display: 'inline-flex', alignItems: 'center', gap: 8,
          }}>
            View the map <span aria-hidden>→</span>
          </a>
          <a href="/cities" style={{
            padding: '1.05rem 2.6rem',
            borderRadius: 12,
            border: '0.5px solid #252c25',
            color: '#6a6a62',
            textDecoration: 'none',
            fontSize: 16,
            fontFamily: 'DM Sans, sans-serif',
          }}>
            Browse all cities
          </a>
        </div>
      </section>
    </main>
  )
}
