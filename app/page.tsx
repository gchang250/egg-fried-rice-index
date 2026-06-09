'use client'

import { useEffect, useState } from 'react'

export default function Home() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => { const t = setTimeout(() => setMounted(true), 40); return () => clearTimeout(t) }, [])

  const fadeStyle = (delay: string): React.CSSProperties => ({
    opacity: mounted ? 1 : 0,
    transform: mounted ? 'none' : 'translateY(10px)',
    transition: `opacity .9s ${delay} ease, transform .9s ${delay} ease`,
  })

  return (
    <main style={{
      background: '#F6F3EE',
      color: '#1A1714',
      fontFamily: "'Bricolage Grotesque', system-ui, sans-serif",
      height: '100dvh',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>

      {/* ── Nav ─────────────────────────────────────────────────────────── */}
      <nav style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '1.4rem 2.5rem',
        borderBottom: '0.5px solid rgba(26,23,20,.14)',
        flexShrink: 0,
        ...fadeStyle('0s'),
      }}>
        <span style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 17, letterSpacing: .2 }}>
          fried rice{' '}
          <em style={{ color: '#B85420', fontStyle: 'italic' }}>index</em>
        </span>
        <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
          {[['cities', '/cities'], ['about', '/about'], ['methodology', '/methodology']].map(([l, h]) => (
            <a key={h} href={h} style={{ fontSize: 13, color: '#9A9690', textDecoration: 'none', letterSpacing: '.02em' }}>{l}</a>
          ))}
          <a href="/explore" style={{ fontSize: 13, color: '#B85420', textDecoration: 'none', letterSpacing: '.02em' }}>
            explore →
          </a>
        </div>
      </nav>

      {/* ── Body ────────────────────────────────────────────────────────── */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: 'clamp(3rem, 8vh, 7rem) 2.5rem clamp(2rem, 5vh, 4rem)',
      }}>

        {/* Headline */}
        <div style={fadeStyle('.08s')}>
          <h1 style={{
            fontFamily: "'Cormorant Garamond', Georgia, serif",
            fontWeight: 300,
            fontSize: 'clamp(68px, 12.5vw, 176px)',
            lineHeight: .88,
            letterSpacing: 'clamp(-2px, -0.03em, -4px)',
            color: '#1A1714',
            margin: 0,
          }}>
            The Fried<br />
            Rice Index.
          </h1>
        </div>

        {/* Mid — rule + tagline */}
        <div style={fadeStyle('.28s')}>
          <div style={{ height: '0.5px', background: 'rgba(26,23,20,.16)', marginBottom: '1.5rem' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '2rem' }}>
            <p style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontStyle: 'italic',
              fontWeight: 300,
              fontSize: 'clamp(18px, 2.2vw, 28px)',
              lineHeight: 1.45,
              color: '#4A4440',
              margin: 0,
              maxWidth: 560,
            }}>
              Restaurant prices across forty cities —<br />
              and what they say about the cost of living.
            </p>
            <span style={{
              fontSize: 11, letterSpacing: '2px', textTransform: 'uppercase',
              color: '#C0BAB4', flexShrink: 0, paddingTop: 4,
            }}>
              2025
            </span>
          </div>
        </div>

        {/* Bottom — rule + CTAs */}
        <div style={fadeStyle('.5s')}>
          <div style={{ height: '0.5px', background: 'rgba(26,23,20,.1)', marginBottom: '1.5rem' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <p style={{ fontSize: 12, color: '#B0AAA4', margin: 0, letterSpacing: '.04em', textTransform: 'uppercase' }}>
              40 cities indexed
            </p>
            <div style={{ display: 'flex', gap: '2.5rem', alignItems: 'center' }}>
              <a href="/explore" style={{
                fontSize: 14, color: '#1A1714', textDecoration: 'none',
                borderBottom: '0.5px solid #1A1714', paddingBottom: 2,
                letterSpacing: '.02em',
              }}>
                View the map →
              </a>
              <a href="/cities" style={{
                fontSize: 14, color: '#9A9690', textDecoration: 'none',
                borderBottom: '0.5px solid #C8C4BE', paddingBottom: 2,
                letterSpacing: '.02em',
              }}>
                Browse all cities →
              </a>
            </div>
          </div>
        </div>

      </div>
    </main>
  )
}
