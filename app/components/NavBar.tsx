'use client'

import { useState } from 'react'
import { X, Menu } from 'lucide-react'

const LINKS = [
  ['Explore',     '/explore'],
  ['Communities', '/cities'],
  ['Reports',     '/reports'],
  ['Submit',      '/submit'],
  ['About',       '/about'],
  ['Methodology', '/methodology'],
] as const

type Props = { active?: string; fixed?: boolean }

/* Stylized Poutine Carton SVG mark */
function PoutineMark({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none" aria-hidden="true">
      {/* Background circle */}
      <circle cx="14" cy="14" r="13" stroke="var(--color-border)" strokeWidth="0.8" fill="var(--color-surface)"/>
      {/* Fries (golden rectangular shapes in cheese-curd gold) */}
      <rect x="9" y="8" width="2" height="10" rx="0.5" transform="rotate(-15 9 8)" fill="var(--color-green)"/>
      <rect x="12" y="6" width="2" height="12" rx="0.5" transform="rotate(5 12 6)" fill="var(--color-green)"/>
      <rect x="15" y="7" width="2" height="11" rx="0.5" transform="rotate(-5 15 7)" fill="var(--color-green)"/>
      <rect x="17" y="9" width="2" height="9" rx="0.5" transform="rotate(20 17 9)" fill="var(--color-green)"/>
      {/* Cheese curds (creamy white circles/ellipses) */}
      <circle cx="11" cy="13" r="1.8" fill="var(--color-text-1)"/>
      <circle cx="16" cy="12" r="1.6" fill="var(--color-text-1)"/>
      <ellipse cx="13.5" cy="14.5" rx="2" ry="1.4" fill="var(--color-text-1)" transform="rotate(15 13.5 14.5)"/>
      {/* Poutine cup/carton front panel in Crimson red */}
      <path d="M 7 15 L 21 15 L 18 23 L 10 23 Z" fill="var(--color-accent)"/>
      {/* Minimalist maple leaf emblem on cup */}
      <path d="M 14 17.5 L 14.5 19 L 16 19 L 14.8 19.8 L 15.2 21.2 L 14 20.4 L 12.8 21.2 L 13.2 19.8 L 12 19 L 13.5 19 Z" fill="#ffffff" opacity="0.9"/>
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
          <PoutineMark />
          The Canadian Poutine Index
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

        {/* Pill CTA */}
        <a href="/submit" style={{
          fontFamily: 'var(--font-body)', fontSize: 13,
          border: '1px solid var(--color-border)',
          padding: '8px 16px', borderRadius: 7,
          color: 'var(--color-text-2)', textDecoration: 'none',
          transition: 'border-color .2s, color .2s',
          whiteSpace: 'nowrap',
          fontWeight: 600,
          background: 'var(--color-accent-dim)'
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
            borderBottom: '1px solid var(--color-border)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontWeight: 600, fontSize: 14.5 }}>
              <PoutineMark />
              The Canadian Poutine Index
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
        .nb-cta:hover{border-color:var(--color-accent)!important;color:var(--color-text-1)!important;background:var(--color-accent-dim)!important}
      `}</style>
    </>
  )
}
