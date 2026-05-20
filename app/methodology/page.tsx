export default function MethodologyPage() {
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
        <p style={eyebrowStyle}>Methodology</p>

        <h1
          style={{
            fontFamily: 'DM Serif Display, serif',
            fontSize: 48,
            lineHeight: 1.05,
            letterSpacing: -1.5,
            margin: '0 0 1.25rem',
          }}
        >
          How the Egg Fried Rice Index is calculated.
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
          The Egg Fried Rice Index compares the restaurant price of a large bowl
          of egg fried rice across cities. It is designed as a simple,
          food-based cost-of-living signal for people comparing places to live,
          study, or work.
        </p>

        <div style={cardStyle}>
          <h2 style={sectionTitleStyle}>1. What price we record</h2>
          <p style={bodyStyle}>
            For each restaurant, we record the cheapest menu item whose base
            dish is fried rice with egg.
          </p>
          <p style={bodyStyle}>
            We exclude meat-heavy, seafood-heavy, luxury, combo, or
            delivery-inflated items when a cleaner menu price is available.
            This prevents items such as crab fried rice, scallop fried rice, or
            truffle fried rice from distorting the city average.
          </p>
        </div>

        <div style={cardStyle}>
          <h2 style={sectionTitleStyle}>2. Restaurant sample</h2>
          <p style={bodyStyle}>
            Each city aims to use at least five restaurant entries across different price
            tiers:
          </p>

          <ul style={listStyle}>
            <li>1 low-tier or casual local restaurant</li>
            <li>2 mid-tier restaurants</li>
            <li>1 higher-end restaurant</li>
            <li>1 premium casual or fine-dining equivalent when available</li>
          </ul>

          <p style={bodyStyle}>
            In cities where a clean fine-dining egg fried rice option is not
            available, the index uses the closest suitable higher-end restaurant
            and marks the city with an appropriate confidence score.
          </p>
        </div>

        <div style={cardStyle}>
          <h2 style={sectionTitleStyle}>3. Currency conversion</h2>
          <p style={bodyStyle}>
            Restaurant prices are stored in Canadian dollars for consistency.
            The website then converts prices into the user-selected currency
            using exchange-rate estimates.
          </p>
          <p style={bodyStyle}>
            Future versions may use live exchange-rate data. Current conversions
            should be treated as approximate.
          </p>
        </div>

        <div style={cardStyle}>
          <h2 style={sectionTitleStyle}>4. Confidence scores</h2>
          <p style={bodyStyle}>
            Each city price includes a confidence score based on source quality.
          </p>

          <ul style={listStyle}>
            <li>90%: official restaurant menu with clear egg fried rice item</li>
            <li>80%: restaurant ordering page or clear menu photo</li>
            <li>70%: reliable third-party menu listing</li>
            <li>60%: delivery app or acceptable variant</li>
            <li>Below 60%: unclear, outdated, or weak source</li>
          </ul>
        </div>

        <div style={cardStyle}>
          <h2 style={sectionTitleStyle}>5. Limitations</h2>
          <p style={bodyStyle}>
            The index is not a full measure of purchasing power, rent, wages, or
            household expenses. It is a simple food-based proxy that captures
            some combination of ingredient cost, labour cost, rent, energy,
            logistics, and restaurant pricing norms.
          </p>
          <p style={bodyStyle}>
            It should be used as a comparison signal, not as a complete
            relocation model.
          </p>
        </div>
      </section>
    </main>
  )
}

const navLinkStyle: React.CSSProperties = {
  fontSize: 13,
  color: '#6b6b64',
  textDecoration: 'none',
}

const eyebrowStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 500,
  letterSpacing: '1.5px',
  textTransform: 'uppercase',
  color: '#C25E1E',
  marginBottom: '1rem',
}

const cardStyle: React.CSSProperties = {
  background: '#fff',
  border: '0.5px solid #e5e3da',
  borderRadius: 16,
  padding: '1.5rem',
  marginBottom: '1.25rem',
}

const sectionTitleStyle: React.CSSProperties = {
  fontFamily: 'DM Serif Display, serif',
  fontSize: 26,
  margin: '0 0 0.75rem',
}

const bodyStyle: React.CSSProperties = {
  fontSize: 15,
  color: '#3a3a34',
  lineHeight: 1.7,
  margin: '0 0 0.85rem',
}

const listStyle: React.CSSProperties = {
  fontSize: 15,
  color: '#3a3a34',
  lineHeight: 1.8,
  paddingLeft: '1.25rem',
}