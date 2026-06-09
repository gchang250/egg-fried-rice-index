'use client'

import { useState } from 'react'
import { Globe, Menu, X } from 'lucide-react'

const LINKS = [
  ['cities',      '/cities'],
  ['reports',     '/reports'],
  ['submit',      '/submit'],
  ['about',       '/about'],
  ['methodology', '/methodology'],
] as const

type Props = {
  active?: string
  fixed?: boolean
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
        height: 52,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 2rem',
        background: 'rgba(9,13,10,.92)',
        backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '0.5px solid var(--color-border)',
      }}>
        <a href="/" style={{
          fontFamily: 'var(--font-display)', fontSize: 16, fontStyle: 'italic',
          letterSpacing: -.2, color: 'var(--color-text-1)', textDecoration: 'none',
          display: 'flex', alignItems: 'center', gap: 7,
        }}>
          <Globe size={14} color="var(--color-accent)" />
          fried rice <span style={{ color: 'var(--color-accent)', fontStyle: 'normal' }}>index</span>
        </a>

        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }} className="nb-d">
          {LINKS.map(([l, h]) => (
            <a key={h} href={h} style={{
              fontSize: 13, textDecoration: 'none',
              color: l === active ? 'var(--color-text-1)' : 'var(--color-text-3)',
              borderBottom: l === active ? '0.5px solid var(--color-accent)' : 'none',
              paddingBottom: l === active ? 1 : 0,
            }}>{l}</a>
          ))}
        </div>

        <button onClick={() => setOpen(true)} className="nb-m" style={{ display: 'none', background: 'none', border: 'none', color: 'var(--color-text-2)', cursor: 'pointer', padding: 4 }}>
          <Menu size={20} />
        </button>
      </nav>

      {open && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'var(--color-bg)' }}>
          <div style={{ padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '0.5px solid var(--color-border)', height: 52 }}>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontStyle: 'italic' }}>
              fried rice <span style={{ color: 'var(--color-accent)', fontStyle: 'normal' }}>index</span>
            </span>
            <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-2)' }}>
              <X size={20} />
            </button>
          </div>
          <div style={{ padding: '2rem' }}>
            {LINKS.map(([l, h]) => (
              <a key={h} href={h} style={{ display: 'block', fontFamily: 'var(--font-display)', fontSize: 28, color: 'var(--color-text-1)', textDecoration: 'none', marginBottom: '1.25rem' }}>{l}</a>
            ))}
          </div>
        </div>
      )}

      <style>{`@media(max-width:640px){.nb-d{display:none!important}.nb-m{display:block!important}}`}</style>
    </>
  )
}
