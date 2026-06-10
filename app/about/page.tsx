import { Info, ArrowRight } from 'lucide-react'
import NavBar from '@/app/components/NavBar'

const CARDS = [
  {
    title: 'Why this exists',
    body: ["Cost of living gets described through numbers that are hard to feel: CPI, PPP, rent indices. They matter, but they don't stick.", "The Fried Rice Index starts with something concrete: the price of a bowl of fried rice at a local restaurant. That one number ends up saying a lot about a place."],
  },
  {
    title: 'What the index does',
    body: ["It collects restaurant-level fried rice prices, preserves the original local currency, converts to CAD for comparison, assigns confidence scores, and summarises city-level patterns.", "Basic, vegetable, meat, seafood, house special, and premium fried rice are categorised separately so the data holds up under scrutiny."],
  },
  {
    title: 'What the index is not',
    body: ["It is not a full cost-of-living model. It doesn't replace rent data, wage data, CPI, or PPP.", "It is a transparent, narrow restaurant-price signal. Its value is being concrete, comparable, and honest about its limits."],
  },
  {
    title: 'Where the project is going',
    body: ["The index is expanding with more cities, public submissions, downloadable datasets, and more regular updates.", "The goal is a public dataset serious enough for real analysis but readable enough for anyone who just wants to understand how cities compare."],
  },
]

export default function AboutPage() {
  return (
    <main style={{ fontFamily: 'var(--font-body)', background: 'var(--color-bg)', minHeight: '100vh', color: 'var(--color-text-1)' }}>
      <NavBar active="about" />

      <div style={{ maxWidth: 860, margin: '0 auto', padding: 'clamp(3rem,6vh,5rem) 2rem' }}>
        {/* Eyebrow */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '1.5rem' }}>
          <Info size={14} color="var(--color-accent)" />
          <span style={{ fontSize: 11, letterSpacing: '2.5px', textTransform: 'uppercase', color: 'var(--color-text-3)' }}>About</span>
        </div>

        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(32px, 5vw, 56px)', fontWeight: 400, lineHeight: 1.05, letterSpacing: -1.5, color: 'var(--color-text-1)', margin: '0 0 1.5rem' }}>
          A simple dish,<br />a sharper way to compare cities.
        </h1>

        <p style={{ fontSize: 16, color: 'var(--color-text-2)', lineHeight: 1.7, maxWidth: 640, marginBottom: '3.5rem' }}>
          The Fried Rice Index tracks fried rice prices across cities and uses that data
          to study baseline affordability, price variation, and restaurant market patterns.
        </p>

        {/* Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', border: '0.5px solid var(--color-border)', borderRadius: 12, overflow: 'hidden', marginBottom: '3rem' }}>
          {CARDS.map((card, i) => (
            <div key={card.title} style={{ background: 'var(--color-surface)', padding: '2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '1rem' }}>
                <span style={{ fontSize: 11, color: 'var(--color-text-3)', fontVariantNumeric: 'tabular-nums' }}>0{i + 1}</span>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, color: 'var(--color-text-1)', margin: 0, fontWeight: 400 }}>{card.title}</h2>
              </div>
              {card.body.map((p, j) => (
                <p key={j} style={{ fontSize: 15, color: 'var(--color-text-2)', lineHeight: 1.75, margin: j < card.body.length - 1 ? '0 0 0.85rem' : 0 }}>{p}</p>
              ))}
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <a href="/methodology" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '.7rem 1.4rem', borderRadius: 8, background: 'var(--color-accent)', color: '#fff', textDecoration: 'none', fontSize: 14 }}>
            Read the methodology <ArrowRight size={14} />
          </a>
          <a href="/cities" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '.7rem 1.4rem', borderRadius: 8, border: '0.5px solid var(--color-border)', color: 'var(--color-text-2)', textDecoration: 'none', fontSize: 14 }}>
            Browse cities
          </a>
        </div>
      </div>
    </main>
  )
}
