export default function AboutPage() {
  const navLinkStyle = {
    fontSize: 13,
    color: '#6b6b64',
    textDecoration: 'none',
  }

  const cardStyle = {
    background: '#fff',
    border: '0.5px solid #e5e3da',
    borderRadius: 16,
    padding: '1.5rem',
    marginBottom: '1.25rem',
  }

  const paragraphStyle = {
    fontSize: 15,
    color: '#3a3a34',
    lineHeight: 1.7,
    margin: '0 0 0.85rem',
  }

  const h2Style = {
    fontFamily: 'DM Serif Display, serif',
    fontSize: 26,
    margin: '0 0 0.75rem',
  }

  return (
    <main
      style={{
        fontFamily: 'DM Sans, sans-serif',
        background: '#FAFAF8',
        minHeight: '100vh',
        color: '#1a1a18',
      }}
    >
      <link
        href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500&display=swap"
        rel="stylesheet"
      />

      <nav
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '1.25rem 2.5rem',
          borderBottom: '0.5px solid #e5e3da',
        }}
      >
        <a
          href="/"
          style={{
            fontFamily: 'DM Serif Display, serif',
            fontSize: 18,
            color: '#1a1a18',
            textDecoration: 'none',
          }}
        >
          fried rice <span style={{ color: '#C25E1E' }}>index</span>
        </a>

        <div style={{ display: 'flex', gap: '2rem' }}>
          <a href="/cities" style={navLinkStyle}>
            cities
          </a>
          <a href="/about" style={navLinkStyle}>
            about
          </a>
          <a href="/methodology" style={navLinkStyle}>
            methodology
          </a>
        </div>
      </nav>

      <section style={{ maxWidth: 860, margin: '0 auto', padding: '4rem 1.5rem' }}>
        <p
          style={{
            fontSize: 11,
            fontWeight: 500,
            letterSpacing: '1.5px',
            textTransform: 'uppercase',
            color: '#C25E1E',
            marginBottom: '1rem',
          }}
        >
          About
        </p>

        <h1
          style={{
            fontFamily: 'DM Serif Display, serif',
            fontSize: 48,
            lineHeight: 1.05,
            letterSpacing: -1.5,
            margin: '0 0 1.25rem',
          }}
        >
          A simple dish, a sharper way to compare cities.
        </h1>

        <p
          style={{
            fontSize: 16,
            color: '#6b6b64',
            lineHeight: 1.7,
            maxWidth: 700,
            marginBottom: '3rem',
          }}
        >
          The Fried Rice Index is a food-based affordability project that tracks
          fried rice prices across cities. It uses restaurant menu data to study
          baseline affordability, price variation, dish variety, and premiumization
          in urban restaurant markets.
        </p>

        <div style={cardStyle}>
          <h2 style={h2Style}>Why this exists</h2>
          <p style={paragraphStyle}>
            Cost of living is usually described through broad statistics: CPI, rent,
            wages, exchange rates, and purchasing power parity. Those measures matter,
            but they can feel abstract.
          </p>
          <p style={paragraphStyle}>
            The Fried Rice Index starts with something concrete: the price of a
            familiar restaurant dish. By comparing fried rice prices across cities,
            the project creates a simple way to see how everyday affordability changes
            from place to place.
          </p>
        </div>

        <div style={cardStyle}>
          <h2 style={h2Style}>What the index does</h2>
          <p style={paragraphStyle}>
            The index collects restaurant-level fried rice prices, preserves the
            original local price and currency, converts prices into Canadian dollars,
            assigns source confidence scores, and summarizes city-level patterns.
          </p>
          <p style={paragraphStyle}>
            It does not treat every fried rice dish as identical. Basic, vegetable,
            meat-based, seafood, house special, and premium fried rice dishes are
            categorized separately so the data can be analyzed more carefully.
          </p>
        </div>

        <div style={cardStyle}>
          <h2 style={h2Style}>What the index is not</h2>
          <p style={paragraphStyle}>
            The Fried Rice Index is not a complete cost-of-living model. It does not
            replace official inflation data, rent data, wage data, CPI, or PPP.
          </p>
          <p style={paragraphStyle}>
            It is a transparent restaurant-price signal: narrow, imperfect, but
            concrete. Its value comes from making affordability easier to see,
            question, and compare.
          </p>
        </div>

        <div style={cardStyle}>
          <h2 style={h2Style}>Where the project is going</h2>
          <p style={paragraphStyle}>
            The project is being expanded with a stronger methodology, public restaurant
            submissions, downloadable datasets, twice-yearly insights, and weekly
            writing on economic affairs.
          </p>
          <p style={paragraphStyle}>
            The goal is to build a public dataset that can support real statistical
            analysis while remaining readable to people who simply want to understand
            how cities compare.
          </p>
        </div>
      </section>
    </main>
  )
}