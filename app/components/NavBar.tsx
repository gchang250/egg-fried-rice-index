'use client'

import { useState } from 'react'
import { X, Menu } from 'lucide-react'

const LINKS = [
  ['Explore',     '/explore'],
  ['Cities',      '/cities'],
  ['Reports',     '/reports'],
  ['Submit',      '/submit'],
  ['About',       '/about'],
  ['Methodology', '/methodology'],
] as const

type Props = { active?: string; fixed?: boolean }

/* Rice-grain brand mark SVG */
function GrainMark({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 26 26" fill="none" aria-hidden="true">
      <circle cx="13" cy="13" r="11.5" stroke="#c8a862" strokeWidth="1"/>
      <ellipse cx="10" cy="11.5" rx="3" ry="1.6" fill="#c8a862" transform="rotate(-22 10 11.5)"/>
      <ellipse cx="16" cy="14"   rx="3" ry="1.6" fill="#ece9e2" transform="rotate(16 16 14)"/>
      <ellipse cx="11.5" cy="16.5" rx="3" ry="1.6" fill="#76a98c" transform="rotate(-6 11.5 16.5)"/>
    </svg>
  )
}

export default function NavBar({ active, fixed = false }: Props) {
  const [open, setOpen] = useState(false)

  const pos: React.CSSProperties = fixed
    ? { position: 'fixed', top: 0, left: 0, right: 0, zIndex: 200 }
    : { position: 'sticky', top: 0, zIndex: 50 }

  return (
    <>
      <nav style={{
        ...pos,
        height: 68,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 2rem',
        background: 'rgba(10,10,12,.82)',
        backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
        borderBottom: '1px solid #1a1a1f',
      }}>
        {/* Brand */}
        <a href="/" style={{
          display: 'flex', alignItems: 'center', gap: 10,
          fontFamily: 'var(--font-body)', fontWeight: 500, fontSize: 14.5,
          letterSpacing: '.02em', color: 'var(--color-text-1)', textDecoration: 'none',
        }}>
          <GrainMark />
          The Fried Rice Index
        </a>

        {/* Desktop links */}
        <div style={{ display: 'flex', gap: 32, alignItems: 'center' }} className="nb-d">
          {LINKS.map(([label, href]) => (
            <a key={href} href={href} style={{
              fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '.18em',
              textTransform: 'uppercase',
              color: label.toLowerCase() === active ? 'var(--color-text-1)' : 'var(--color-text-3)',
              textDecoration: 'none',
              transition: 'color .2s',
            }}>
              {label}
            </a>
          ))}
        </div>

        {/* Pill CTA */}
        <a href="/submit" style={{
          fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '.18em',
          textTransform: 'uppercase',
          border: '1px solid var(--color-border)',
          padding: '10px 18px', borderRadius: 100,
          color: 'var(--color-text-1)', textDecoration: 'none',
          transition: 'border-color .2s, color .2s',
          whiteSpace: 'nowrap',
        }} className="nb-cta nb-d">
          Submit a price
        </a>

        {/* Mobile hamburger */}
        <button onClick={() => setOpen(true)} className="nb-m" style={{
          display: 'none', background: 'none', border: 'none',
          color: 'var(--color-text-2)', cursor: 'pointer', padding: 4,
        }}>
          <Menu size={20} />
        </button>
      </nav>

      {/* Mobile drawer */}
      {open && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'var(--color-bg)' }}>
          <div style={{
            padding: '0 2rem', height: 68,
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            borderBottom: '1px solid var(--line-soft)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontWeight: 500, fontSize: 14.5 }}>
              <GrainMark />
              The Fried Rice Index
            </div>
            <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-2)' }}>
              <X size={20} />
            </button>
          </div>
          <div style={{ padding: '2rem' }}>
            {LINKS.map(([label, href]) => (
              <a key={href} href={href} style={{
                display: 'block', fontSize: 28, fontWeight: 200,
                color: 'var(--color-text-1)', textDecoration: 'none', marginBottom: '1.25rem',
                letterSpacing: '-.02em',
              }}>{label}</a>
            ))}
          </div>
        </div>
      )}

      <style>{`
        @media(max-width:920px){.nb-d{display:none!important}.nb-m{display:block!important}}
        .nb-cta:hover{border-color:var(--gold)!important;color:var(--gold)!important}
      `}</style>
    </>
  )
}
