export default function AboutPage() {
  const navStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1.25rem 2.5rem',
    borderBottom: '0.5px solid #e5e3da',
  }

  const brandStyle = {
    fontFamily: 'DM Serif Display, serif',
    fontSize: 18,
    color: '#1a1a18',
    textDecoration: 'none',
  }

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

      <nav style={navStyle}>
        <a href="/" style={brandStyle}>
          egg fried rice <span style={{ color: '#C25E1E' }}>index</span>
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

      <section
        style={{
          maxWidth: 860,
          margin: '0 auto',
          padding: '4rem 1.5rem',
        }}
      >
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
          A simple food-based signal for comparing cities.
        </h1>

        <p
          style={{
            fontSize: 16,
            color: '#6b6b64',
            lineHeight: 1.7,
            maxWidth: 680,
            marginBottom: '3rem',
          }}
        >
          The Egg Fried Rice Index tracks the price of a large bowl of egg fried rice
          across major cities and converts that price into the user’s selected currency.
        </p>

        <div style={cardStyle}>
          <h2
            style={{
              fontFamily: 'DM Serif Display, serif',
              fontSize: 26,
              margin: '0 0 0.75rem',
            }}
          >
            Why egg fried rice?
          </h2>
          <p style={{ fontSize: 15, color: '#3a3a34', lineHeight: 1.7, margin: 0 }}>
            Egg fried rice is familiar, widely available, relatively inexpensive, and built
            from basic inputs: rice, egg, oil, heat, labour, rent, and local restaurant costs.
            That makes it a useful everyday reference point for comparing cities.
          </p>
        </div>

        <div style={cardStyle}>
          <h2
            style={{
              fontFamily: 'DM Serif Display, serif',
              fontSize: 26,
              margin: '0 0 0.75rem',
            }}
          >
            Who it is for
          </h2>
          <p style={{ fontSize: 15, color: '#3a3a34', lineHeight: 1.7, margin: 0 }}>
            The index is designed for immigrants, students, workers, and families comparing
            where to live. GDP per capita and formal purchasing-power measures can be hard
            to interpret. A restaurant food price is easier to understand.
          </p>
        </div>

        <div style={cardStyle}>
          <h2
            style={{
              fontFamily: 'DM Serif Display, serif',
              fontSize: 26,
              margin: '0 0 0.75rem',
            }}
          >
            What it is not
          </h2>
          <p style={{ fontSize: 15, color: '#3a3a34', lineHeight: 1.7, margin: 0 }}>
            This is not a full cost-of-living calculator. It does not replace rent, wages,
            taxes, healthcare, transport, or household budgets. It is a simple proxy: one
            familiar dish, measured consistently across cities.
          </p>
        </div>
      </section>
    </main>
  )
}