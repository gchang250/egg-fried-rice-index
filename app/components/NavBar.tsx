'use client'

import { useState } from 'react'
import { X, Menu } from 'lucide-react'
// components/Nav.tsx
import Link from 'next/link';


const LINKS = [
  ['Explore', '/explore'],
  ['Ridings', '/ridings'],
  ['About',   '/about'],
] as const

type Props = { active?: string; fixed?: boolean }

export default function NavBar({ active, fixed = false }: Props) {
  const [open, setOpen] = useState(false)

  const pos: React.CSSProperties = fixed
    ? { position: 'fixed', top: 0, left: 0, right: 0, zIndex: 200 }
    : { position: 'sticky', top: 0, zIndex: 50 }

  const wordmark: React.CSSProperties = {
    fontWeight: 600, fontSize: 17, letterSpacing: '-.015em',
    color: 'var(--color-text-1)', textDecoration: 'none',
  }

  return (
    <>
      <nav style={{
        ...pos,
        height: 56,
        display: 'flex', alignItems: 'center', gap: 40,
        padding: '0 24px',
        background: 'var(--color-nav-bg)',
        borderBottom: '1px solid var(--color-border)',
      }}>
        <a href="/" style={wordmark}>CanPol Index</a>

        <div style={{ display: 'flex', gap: 28, alignItems: 'center' }} className="nb-d">
          {LINKS.map(([label, href]) => (
            <a key={href} href={href} style={{
              fontSize: 14,
              color: label.toLowerCase() === active ? 'var(--color-text-1)' : 'var(--color-text-2)',
              textDecoration: 'none',
              transition: 'color .15s',
              fontWeight: label.toLowerCase() === active ? 600 : 400,
            }}>
              {label}
            </a>
          ))}
        </div>

        <button onClick={() => setOpen(true)} className="nb-m" aria-label="Menu" style={{
          display: 'none', marginLeft: 'auto', background: 'none', border: 'none',
          color: 'var(--color-text-1)', cursor: 'pointer', padding: 4,
        }}>
          <Menu size={20} />
        </button>
      </nav>

      {open && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'var(--color-bg)' }}>
          <div style={{
            padding: '0 24px', height: 56,
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            borderBottom: '1px solid var(--color-border)',
          }}>
            <span style={wordmark}>CanPol Index</span>
            <button onClick={() => setOpen(false)} aria-label="Close" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-1)' }}>
              <X size={20} />
            </button>
          </div>
          <div style={{ padding: 24 }}>
            {LINKS.map(([label, href]) => (
              <a key={href} href={href} style={{
                display: 'block', fontSize: 22, fontWeight: 500,
                color: 'var(--color-text-1)', textDecoration: 'none',
                padding: '14px 0', borderBottom: '1px solid var(--color-border)',
                letterSpacing: '-.01em',
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
