// app/components/Footer.tsx
import type { CSSProperties } from 'react'

const WRAP: CSSProperties = { maxWidth: 1120, margin: '0 auto', padding: '0 24px' }

const LINKS: [string, string][] = [
  ['Ridings', '/ridings'],
  ['Explore', '/explore'],
  ['About', '/about'],
  ['Privacy', '/privacy'],
  ['Terms', '/terms'],
]

export default function Footer() {
  return (
    <footer style={{ borderTop: '1px solid var(--color-border)', padding: '40px 0 32px', color: 'var(--color-text-3)', fontSize: 13 }}>
      <div style={WRAP}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 30, flexWrap: 'wrap', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: 15, letterSpacing: '-.015em', color: 'var(--color-text-1)', marginBottom: 8 }}>
              CanPol Index
            </div>
            <div>Socio-economic data across federal ridings. Free, forever.</div>
          </div>
          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
            {LINKS.map(([l, h]) => (
              <a key={h} href={h} style={{ fontSize: 13, color: 'var(--color-text-2)', textDecoration: 'none' }}>{l}</a>
            ))}
          </div>
        </div>
        <div style={{ marginTop: 28, fontSize: 12, color: 'var(--color-text-4)' }}>
          &copy; 2026 CanPol Index
        </div>
      </div>
    </footer>
  )
}
