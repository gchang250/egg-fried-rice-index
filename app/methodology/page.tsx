export default function MethodologyPage() {
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

  const listStyle = {
    fontSize: 15,
    color: '#3a3a34',
    lineHeight: 1.8,
    paddingLeft: '1.25rem',
    marginTop: 0,
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
          <a href="/submit" style={navLinkStyle}>
            submit
          </a>
          <a href="/about" style={navLinkStyle}>
            about
          </a>
          <a href="/methodology" style={navLinkStyle}>
            methodology
          </a>
        </div>
      </nav>

      <section style={{ maxWidth: 920, margin: '0 auto', padding: '4rem 1.5rem' }}>
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
          Methodology
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
          How the Fried Rice Index is calculated.
        </h1>

        <p
          style={{
            fontSize: 16,
            color: '#6b6b64',
            lineHeight: 1.7,
            maxWidth: 720,
            marginBottom: '3rem',
          }}
        >
          The Fried Rice Index compares restaurant fried rice prices across cities.
          It tracks baseline affordability, dish variety, price spread, and
          premiumization in local restaurant markets.
        </p>

        <div style={cardStyle}>
          <h2 style={h2Style}>1. What the index measures</h2>
          <p style={paragraphStyle}>
            The Fried Rice Index is a food-based affordability index built from
            restaurant menu data. It compares fried rice prices across cities and
            studies what those prices reveal about everyday affordability, local
            restaurant markets, and urban economic conditions.
          </p>
          <p style={paragraphStyle}>
            The index is not a replacement for CPI, PPP, rent data, wage data, or
            official cost-of-living statistics. It is a narrower signal based on one
            common restaurant dish.
          </p>
        </div>

        <div style={cardStyle}>
          <h2 style={h2Style}>2. Why fried rice?</h2>
          <p style={paragraphStyle}>
            Fried rice is widely available, easy to identify on menus, and common
            across many cities. It appears in both casual and higher-end restaurants,
            which makes it useful for comparing both everyday affordability and the
            range of a city’s restaurant market.
          </p>
          <p style={paragraphStyle}>
            A fried rice price can reflect labour costs, rent, ingredients, tax,
            supply chains, consumer demand, and local pricing norms. The goal is not
            to claim that fried rice explains an entire economy. The goal is to use a
            familiar dish as a concrete comparison point.
          </p>
        </div>

        <div style={cardStyle}>
          <h2 style={h2Style}>3. Dish classification</h2>
          <p style={paragraphStyle}>
            The index collects all fried rice dishes, but it does not treat every dish
            as equivalent. Each entry is classified before analysis.
          </p>
          <ul style={listStyle}>
            <li>
              <strong>Basic:</strong> plain fried rice, egg fried rice, soy sauce fried rice,
              or classic fried rice
            </li>
            <li>
              <strong>Vegetable:</strong> vegetable, mixed vegetable, or mushroom fried rice
            </li>
            <li>
              <strong>Meat-based:</strong> chicken, pork, beef, or BBQ pork fried rice
            </li>
            <li>
              <strong>Seafood:</strong> shrimp, prawn, crab, scallop, or seafood fried rice
            </li>
            <li>
              <strong>House special:</strong> special, combination, Yangzhou/Yang Chow,
              deluxe, or mixed fried rice
            </li>
            <li>
              <strong>Premium:</strong> lobster, truffle, wagyu, XO, or other luxury fried rice
            </li>
          </ul>
        </div>

        <div style={cardStyle}>
          <h2 style={h2Style}>4. Baseline price and market profile</h2>
          <p style={paragraphStyle}>
            The index separates baseline affordability from broader market analysis.
          </p>
          <p style={paragraphStyle}>
            The <strong>baseline city price</strong> uses basic and vegetable fried rice
            entries. These are the closest comparison points for everyday restaurant
            affordability.
          </p>
          <p style={paragraphStyle}>
            The <strong>full fried rice market profile</strong> includes all dish categories.
            Protein-heavy, seafood, house special, and premium dishes are not treated as
            identical to basic fried rice, but they are useful for studying variety,
            price spread, and premiumization.
          </p>
        </div>

        <div style={cardStyle}>
          <h2 style={h2Style}>5. Data collection</h2>
          <p style={paragraphStyle}>
            Restaurant prices may come from official restaurant menus, official online
            ordering pages, restaurant-uploaded menus, recent menu photos, third-party
            menu websites, delivery apps, scraper-assisted searches, and public
            submissions.
          </p>
          <p style={paragraphStyle}>
            Every approved entry must include the restaurant name, city, country, dish
            name, original price, original currency, CAD price, source link, source type,
            date checked, confidence score, and admin approval.
          </p>
          <p style={paragraphStyle}>
            Entries without a usable source link are not approved.
          </p>
        </div>

        <div style={cardStyle}>
          <h2 style={h2Style}>6. Source reliability</h2>
          <p style={paragraphStyle}>
            Not all sources are treated equally. Official restaurant sources receive
            higher confidence than delivery apps or unclear scraper results.
          </p>
          <ul style={listStyle}>
            <li>Official restaurant menu: very high reliability</li>
            <li>Official ordering page: high reliability</li>
            <li>Recent restaurant menu photo: high reliability</li>
            <li>Third-party menu website: medium reliability</li>
            <li>Delivery app: lower reliability because of possible markup</li>
            <li>Unclear scraper result: low reliability until manually verified</li>
          </ul>
        </div>

        <div style={cardStyle}>
          <h2 style={h2Style}>7. Confidence scores</h2>
          <p style={paragraphStyle}>
            Each restaurant entry receives a confidence score based on source quality,
            dish clarity, price clarity, and location certainty.
          </p>
          <ul style={listStyle}>
            <li>95% — official restaurant website menu</li>
            <li>90% — official restaurant ordering page</li>
            <li>85% — recent menu photo</li>
            <li>70% — third-party menu site</li>
            <li>60% — delivery app</li>
            <li>50% — unclear scraper result</li>
          </ul>
          <p style={paragraphStyle}>
            Scores may be reduced if the dish is ambiguous, the source may be outdated,
            the price may include delivery markup, the portion size is unclear, or the
            restaurant location is uncertain.
          </p>
        </div>

        <div style={cardStyle}>
          <h2 style={h2Style}>8. Currency conversion</h2>
          <p style={paragraphStyle}>
            Prices are stored in Canadian dollars for comparison. The original local
            price and currency are also preserved so the dataset remains auditable.
          </p>
          <p style={paragraphStyle}>
            Each entry records the local price, local currency, exchange rate used,
            CAD price, and date accessed. Future versions may use live or periodically
            updated exchange-rate data.
          </p>
        </div>

        <div style={cardStyle}>
          <h2 style={h2Style}>9. City-level calculations</h2>
          <p style={paragraphStyle}>
            The main city price is based on the median approved baseline fried rice
            price. The median is used because it is less affected by unusually cheap
            or unusually expensive restaurants.
          </p>
          <p style={paragraphStyle}>
            For each city, the index can calculate median price, average price, minimum
            price, maximum price, standard deviation, interquartile range, restaurant
            count, average confidence, and data quality label.
          </p>
        </div>

        <div style={cardStyle}>
          <h2 style={h2Style}>10. Data quality labels</h2>
          <p style={paragraphStyle}>
            Cities are labelled based on sample size and source reliability.
          </p>
          <ul style={listStyle}>
            <li>Preliminary: 1–2 approved restaurants</li>
            <li>Limited: 3–4 approved restaurants</li>
            <li>Moderate: 5–9 approved restaurants</li>
            <li>Strong: 10–14 approved restaurants</li>
            <li>High confidence: 15+ approved restaurants with strong source quality</li>
          </ul>
        </div>

        <div style={cardStyle}>
          <h2 style={h2Style}>11. Public submissions</h2>
          <p style={paragraphStyle}>
            Public submissions do not directly affect the index. Submitted restaurants
            enter a pending review queue. An admin checks the source, dish category,
            price, currency, and location before approving or denying the entry.
          </p>
          <p style={paragraphStyle}>
            Only approved entries are added to the public dataset and used in city-level
            calculations.
          </p>
        </div>

        <div style={cardStyle}>
          <h2 style={h2Style}>12. Downloadable datasets</h2>
          <p style={paragraphStyle}>
            The Fried Rice Index will provide date-stamped downloadable datasets for
            transparency. The restaurant-level dataset contains approved restaurant
            entries. The city-level dataset summarizes city statistics such as median
            price, average price, restaurant count, price spread, confidence, and data
            quality.
          </p>
          <p style={paragraphStyle}>
            Dataset files are date-stamped at the time of export.
          </p>
        </div>

        <div style={cardStyle}>
          <h2 style={h2Style}>13. Limitations</h2>
          <p style={paragraphStyle}>
            The index does not account for rent, wages, taxes, transportation, groceries,
            household expenses, portion size differences, service models, delivery
            markups, menu changes, or exchange-rate fluctuations.
          </p>
          <p style={paragraphStyle}>
            It should be read as a transparent restaurant-price signal, not as a complete
            measure of cost of living.
          </p>
        </div>
      </section>
    </main>
  )
}