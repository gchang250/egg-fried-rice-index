import { Info, ArrowRight } from 'lucide-react'
import NavBar from '@/app/components/NavBar'

const CARDS = [
  {
    title: 'Why this exists',
    body: [
      "Cost of living is often described through abstract macroeconomic metrics: CPI, rental market indices, average salary surveys. They are critical, but they don't capture daily financial realities.",
      "The Canadian Poutine Index begins with a concrete, tangible anchor: the price of a standard classic poutine (fresh-cut fries, cheese curds, and gravy) at a local neighborhood diner or chip truck. That single number says a lot about a community's economic landscape."
    ],
  },
  {
    title: 'What the index does',
    body: [
      "It gathers menu-level poutine pricing, organizes entries by community, compares prices to Statistics Canada wages and CMHC housing rent datasets, and outputs regional affordability metrics.",
      "By categorizing dishes by tier (budget, mid-tier, high-end, premium) and calculating baseline medians, we keep the index comparison rigorous and accurate."
    ],
  },
  {
    title: 'What the index is not',
    body: [
      "It is not a comprehensive cost-of-living index. It does not replace detailed basket surveys, CPI reports, or complete tax calculations.",
      "It is a transparent, focused cost-of-food indicator. Its strength lies in being relatable, easy to visualize, and honest about its boundaries."
    ],
  },
  {
    title: 'Where the project is going',
    body: [
      "The index is expanding to map smaller municipalities, rural towns, and northern settlements across all ten provinces and three territories.",
      "Our goal is to build an open-source, community-sourced dataset that sheds light on regional disparities and purchasing power across Canada."
    ],
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
          <span style={{ fontSize: 11, letterSpacing: '2.5px', textTransform: 'uppercase', color: 'var(--color-text-3)', fontWeight: 600 }}>About</span>
        </div>

        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(32px, 5vw, 56px)', fontWeight: 400, lineHeight: 1.05, letterSpacing: -1.5, color: 'var(--color-text-1)', margin: '0 0 1.5rem' }}>
          A simple dish,<br />a sharper way to compare Canadian communities.
        </h1>

        <p style={{ fontSize: 16, color: 'var(--color-text-2)', lineHeight: 1.7, maxWidth: 640, marginBottom: '3.5rem' }}>
          The Canadian Poutine Index tracks classic poutine prices across communities to study cost of living, regional rent burdens, and local purchasing power.
        </p>

        {/* Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', border: '0.5px solid var(--color-border)', borderRadius: 12, overflow: 'hidden', marginBottom: '3rem' }}>
          {CARDS.map((card, i) => (
            <div key={card.title} style={{ background: 'var(--color-surface)', padding: '2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '1rem' }}>
                <span style={{ fontSize: 11, color: 'var(--color-text-3)', fontVariantNumeric: 'tabular-nums', fontFamily: 'var(--font-mono)' }}>0{i + 1}</span>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, color: 'var(--color-text-1)', margin: 0, fontWeight: 400 }}>{card.title}</h2>
              </div>
              {card.body.map((p, j) => (
                <p key={j} style={{ fontSize: 15, color: 'var(--color-text-2)', lineHeight: 1.75, margin: j < card.body.length - 1 ? '0 0 0.85rem' : 0 }}>{p}</p>
              ))}
            </div>
          ))}
        </div>

        {/* Anatomy of Poutine Index */}
        <div style={{ marginTop: '4rem', marginBottom: '4rem' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 28, color: 'var(--color-text-1)', marginBottom: '1.5rem', fontWeight: 400 }}>
            The Anatomy of a Poutine Index
          </h2>
          <p style={{ fontSize: 15, color: 'var(--color-text-2)', lineHeight: 1.7, marginBottom: '2rem' }}>
            A standard plate of poutine is an exceptional cost-of-living proxy because its core ingredients track key sectors of local and national supply chains:
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem' }}>
            <div style={{ background: 'var(--color-surface)', border: '0.5px solid var(--color-border)', borderRadius: 12, padding: '1.5rem' }}>
              <div style={{ marginBottom: '1rem' }}>
                <svg width="40" height="40" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="12" y="6" width="6" height="36" rx="1.5" fill="var(--color-green)" transform="rotate(-15 12 6)"/>
                  <rect x="22" y="4" width="6" height="40" rx="1.5" fill="var(--color-green)" transform="rotate(5 22 4)"/>
                  <rect x="30" y="8" width="6" height="34" rx="1.5" fill="var(--color-green)" transform="rotate(20 30 8)"/>
                </svg>
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: '0.5rem' }}>The Potatoes (Fries)</h3>
              <p style={{ fontSize: 13, color: 'var(--color-text-2)', lineHeight: 1.6, margin: 0 }}>
                Tracks agricultural labor, crop yields, oil imports, and the utility/energy costs required to run commercial fryers.
              </p>
            </div>
            <div style={{ background: 'var(--color-surface)', border: '0.5px solid var(--color-border)', borderRadius: 12, padding: '1.5rem' }}>
              <div style={{ marginBottom: '1rem' }}>
                <svg width="40" height="40" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M16 20 C10 20 8 30 18 34 C28 38 34 26 24 22 Z" fill="#faf8f2" stroke="var(--color-border)" strokeWidth="1.5"/>
                  <path d="M32 24 C28 22 24 30 30 34 C36 38 40 30 34 26 Z" fill="#faf8f2" stroke="var(--color-border)" strokeWidth="1.5"/>
                  <circle cx="24" cy="14" r="5" fill="#faf8f2" stroke="var(--color-border)" strokeWidth="1.5"/>
                </svg>
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: '0.5rem' }}>The Cheese Curds</h3>
              <p style={{ fontSize: 13, color: 'var(--color-text-2)', lineHeight: 1.6, margin: 0 }}>
                Reflects dairy farm supply chains, marketing board price mandates, transport logistics, and cold storage refrigeration.
              </p>
            </div>
            <div style={{ background: 'var(--color-surface)', border: '0.5px solid var(--color-border)', borderRadius: 12, padding: '1.5rem' }}>
              <div style={{ marginBottom: '1rem' }}>
                <svg width="40" height="40" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M 12 28 C 12 34 36 34 36 28 C 36 22 42 24 44 20 C 32 14 18 16 12 28 Z" fill="#8d4a24" stroke="var(--color-border)" strokeWidth="1"/>
                  <path d="M 14 28 C 6 28 6 20 14 20" stroke="var(--color-border)" strokeWidth="1.5" fill="none"/>
                  <path d="M 44 20 Q 32 28 28 42" stroke="#8d4a24" strokeWidth="4" strokeLinecap="round" fill="none"/>
                </svg>
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: '0.5rem' }}>The Gravy</h3>
              <p style={{ fontSize: 13, color: 'var(--color-text-2)', lineHeight: 1.6, margin: 0 }}>
                Measures kitchen preparation labor, cooking gas/heating costs, stock seasoning supply, and commercial kitchen overheads.
              </p>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <a href="/methodology" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '.7rem 1.4rem', borderRadius: 8, background: 'var(--color-accent)', color: '#fff', textDecoration: 'none', fontSize: 14, fontWeight: 600 }}>
            Read the methodology <ArrowRight size={14} />
          </a>
          <a href="/cities" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '.7rem 1.4rem', borderRadius: 8, border: '0.5px solid var(--color-border)', color: 'var(--color-text-2)', textDecoration: 'none', fontSize: 14, fontWeight: 600, background: 'rgba(255,255,255,0.02)' }}>
            Browse communities
          </a>
        </div>
      </div>
    </main>
  )
}
