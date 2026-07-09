'use client'

import { useState } from 'react'
import { X, Menu } from 'lucide-react'

const LINKS = [
  ['Explore',     '/explore'],
  ['Ridings',     '/cities'],
  ['About',       '/about'],
] as const

type Props = { active?: string; fixed?: boolean }

/* Stylized Maple Leaf SVG mark */
function CanPolMark({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="11" stroke="var(--color-border)" strokeWidth="0.8" fill="var(--color-surface)"/>
      <path d="M 12 5 L 12.8 8.2 L 15.5 7.5 L 14.5 10.2 L 17 11.2 L 14.8 12.8 L 15.5 15.5 L 12.8 14.5 L 12 17.5 L 11.2 14.5 L 8.5 15.5 L 9.2 12.8 L 7 11.2 L 9.5 10.2 L 8.5 7.5 L 11.2 8.2 Z" fill="var(--color-accent)"/>
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
        background: 'var(--color-nav-bg)',
        backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--color-border)',
      }}>
        {/* Brand */}
        <a href="/" style={{
          display: 'flex', alignItems: 'center', gap: 10,
          fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 14.5,
          letterSpacing: '.02em', color: 'var(--color-text-1)', textDecoration: 'none',
        }}>
          <CanPolMark />
          CanPol Index
        </a>

        {/* Desktop links */}
        <div style={{ display: 'flex', gap: 32, alignItems: 'center' }} className="nb-d">
          {LINKS.map(([label, href]) => (
            <a key={href} href={href} style={{
              fontFamily: 'var(--font-body)', fontSize: 13,
              color: label.toLowerCase() === active ? 'var(--color-text-1)' : 'var(--color-text-3)',
              textDecoration: 'none',
              transition: 'color .2s',
              fontWeight: label.toLowerCase() === active ? 600 : 500
            }}>
              {label}
            </a>
          ))}
        </div>

        {/* Placeholder spacer */}
        <div style={{ width: 10 }} className="nb-d" />

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
            borderBottom: '1px solid var(--color-border)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontWeight: 600, fontSize: 14.5 }}>
              <CanPolMark />
              CanPol Index
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
                fontFamily: 'var(--font-display)'
              }}>{label}</a>
            ))}
          </div>
        </div>
      )}

      <style>{`
        @media(max-width:920px){.nb-d{display:none!important}.nb-m{display:block!important}}
      `}</style>
    </>
  )
}
