export default function AboutPage() {
  return (
    <main style={{
      fontFamily: 'DM Sans, sans-serif',
      background: '#0c0f0d',
      minHeight: '100vh',
      color: '#e8e4dc',
    }}>
      <nav style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '1.1rem 2rem',
        borderBottom: '0.5px solid #1e261e',
      }}>
        <a href="/" style={{ fontFamily: 'DM Serif Display, serif', fontSize: 17, color: '#e8e4dc', textDecoration: 'none' }}>
          fried rice <span style={{ color: '#d9682a' }}>index</span>
        </a>
        <div style={{ display: 'flex', gap: '1.75rem' }}>
          {[['cities', '/cities'], ['submit', '/submit'], ['about', '/about'], ['methodology', '/methodology']].map(([l, h]) => (
            <a key={h} href={h} style={{ fontSize: 13, color: '#5a5a52', textDecoration: 'none' }}>{l}</a>
          ))}
        </div>
      </nav>

      <section style={{ maxWidth: 860, margin: '0 auto', padding: '4rem 2rem' }}>
        <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: '1.5px', textTransform: 'uppercase', color: '#d9682a', marginBottom: '1rem' }}>
          About
        </p>

        <h1 style={{
          fontFamily: 'DM Serif Display, serif',
          fontSize: 48, lineHeight: 1.05, letterSpacing: -1.5,
          color: '#f0ece4', margin: '0 0 1.25rem',
        }}>
          A simple dish, a sharper way to compare cities.
        </h1>

        <p style={{ fontSize: 16, color: '#6a6a62', lineHeight: 1.7, maxWidth: 700, marginBottom: '3rem' }}>
          The Fried Rice Index tracks fried rice prices across cities and uses that data
          to study baseline affordability, price variation, and restaurant market patterns.
        </p>

        {[
          {
            title: 'Why this exists',
            body: [
              "Cost of living gets described through numbers that are hard to feel: CPI, PPP, rent indices. They matter, but they don’t stick.",
              'The Fried Rice Index starts with something concrete — the price of a bowl of fried rice at a local restaurant. That one number ends up saying a lot about a place.',
            ],
          },
          {
            title: 'What the index does',
            body: [
              'It collects restaurant-level fried rice prices, preserves the original local currency, converts to CAD for comparison, assigns source confidence scores, and summarises city-level patterns.',
              'Not all dishes are treated as equal. Basic, vegetable, meat, seafood, house special, and premium fried rice are categorised separately so the data holds up under scrutiny.',
            ],
          },
          {
            title: 'What the index is not',
            body: [
              "It is not a full cost-of-living model. It doesn’t replace rent data, wage data, CPI, or PPP.",
              'It is a transparent, narrow restaurant-price signal. Its value comes from being concrete, comparable, and honest about its own limits.',
            ],
          },
          {
            title: 'Where the project is going',
            body: [
              'The index is expanding with more cities, public restaurant submissions, downloadable datasets, and more regular updates.',
              'The goal is a public dataset serious enough for real analysis but readable enough for anyone who just wants to understand how cities compare.',
            ],
          },
        ].map(card => (
          <div key={card.title} style={{
            background: '#111411',
            border: '0.5px solid #1a2218',
            borderRadius: 16,
            padding: '1.5rem',
            marginBottom: '1.25rem',
          }}>
            <h2 style={{ fontFamily: 'DM Serif Display, serif', fontSize: 24, color: '#f0ece4', margin: '0 0 0.75rem', fontWeight: 400 }}>
              {card.title}
            </h2>
            {card.body.map((p, i) => (
              <p key={i} style={{ fontSize: 15, color: '#6a6a62', lineHeight: 1.75, margin: i < card.body.length - 1 ? '0 0 0.85rem' : 0 }}>
                {p}
              </p>
            ))}
          </div>
        ))}
      </section>
    </main>
  )
}
