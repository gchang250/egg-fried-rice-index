export default function MethodologyPage() {
  const card = (children: React.ReactNode) => (
    <div style={{
      background: '#111411',
      border: '0.5px solid #1a2218',
      borderRadius: 16,
      padding: '1.5rem',
      marginBottom: '1.25rem',
    }}>
      {children}
    </div>
  )

  const h2 = (text: string) => (
    <h2 style={{ fontFamily: 'DM Serif Display, serif', fontSize: 24, color: '#f0ece4', margin: '0 0 0.75rem', fontWeight: 400 }}>
      {text}
    </h2>
  )

  const p = (text: React.ReactNode, key?: number) => (
    <p key={key} style={{ fontSize: 15, color: '#6a6a62', lineHeight: 1.75, margin: '0 0 0.85rem' }}>
      {text}
    </p>
  )

  const ul = (items: string[]) => (
    <ul style={{ fontSize: 15, color: '#6a6a62', lineHeight: 1.8, paddingLeft: '1.25rem', marginTop: 0 }}>
      {items.map((item, i) => <li key={i} dangerouslySetInnerHTML={{ __html: item }} />)}
    </ul>
  )

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

      <section style={{ maxWidth: 920, margin: '0 auto', padding: '4rem 2rem' }}>
        <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: '1.5px', textTransform: 'uppercase', color: '#d9682a', marginBottom: '1rem' }}>
          Methodology
        </p>

        <h1 style={{
          fontFamily: 'DM Serif Display, serif',
          fontSize: 48, lineHeight: 1.05, letterSpacing: -1.5,
          color: '#f0ece4', margin: '0 0 1.25rem',
        }}>
          How the Fried Rice Index is calculated.
        </h1>

        <p style={{ fontSize: 16, color: '#6a6a62', lineHeight: 1.7, maxWidth: 720, marginBottom: '3rem' }}>
          The index compares restaurant fried rice prices across cities and tracks what those
          prices reveal about baseline affordability, dish variety, and local restaurant markets.
        </p>

        {card(<>
          {h2('1. What the index measures')}
          {p('The Fried Rice Index is built from restaurant menu data. It compares fried rice prices across cities and studies what those prices reveal about everyday affordability, local restaurant markets, and urban economic conditions.')}
          {p("It is not a replacement for CPI, PPP, rent data, or wage data. It is a narrower signal based on one common restaurant dish — transparent about what it is and what it isn't.")}
        </>)}

        {card(<>
          {h2('2. Why fried rice?')}
          {p("Fried rice is widely available, easy to identify on menus, and common across many cities in the index. It appears at casual restaurants and higher-end spots, which makes it useful for comparing both everyday affordability and the range of a city's restaurant market.")}
          {p('A fried rice price can reflect labour costs, rent, ingredients, tax, supply chains, and local pricing norms. The goal is a concrete comparison point, not a complete economic model.')}
        </>)}

        {card(<>
          {h2('3. Dish classification')}
          {p('The index collects all fried rice dishes but classifies them before analysis. Not every dish is treated as the same thing.')}
          {ul([
            '<strong>Basic:</strong> plain fried rice, egg fried rice, soy sauce fried rice, or classic fried rice',
            '<strong>Vegetable:</strong> vegetable, mixed vegetable, or mushroom fried rice',
            '<strong>Meat-based:</strong> chicken, pork, beef, or BBQ pork fried rice',
            '<strong>Seafood:</strong> shrimp, prawn, crab, scallop, or seafood fried rice',
            '<strong>House special:</strong> special, combination, Yangzhou/Yang Chow, deluxe, or mixed fried rice',
            '<strong>Premium:</strong> lobster, truffle, wagyu, XO, or other luxury fried rice',
          ])}
        </>)}

        {card(<>
          {h2('4. Baseline price and market profile')}
          {p('The index separates baseline affordability from broader market analysis.')}
          {p('The <strong>baseline city price</strong> uses basic and vegetable fried rice entries — the closest comparison points for everyday restaurant affordability.', 1)}
          {p("The <strong>full fried rice market profile</strong> includes all categories. Protein-heavy, seafood, house special, and premium dishes aren't treated as identical to basic fried rice, but they're useful for studying variety, price spread, and premiumisation.", 2)}
        </>)}

        {card(<>
          {h2('5. Data collection')}
          {p('Prices may come from official restaurant menus, official online ordering pages, restaurant-uploaded menus, recent menu photos, third-party menu sites, delivery apps, scraper-assisted searches, and public submissions.')}
          {p('Every approved entry must include: restaurant name, city, country, dish name, original price, original currency, CAD price, source link, source type, date checked, confidence score, and admin approval. Entries without a usable source link are not approved.')}
        </>)}

        {card(<>
          {h2('6. Source reliability')}
          {p('Not all sources are weighted equally. Official restaurant sources receive higher confidence than delivery apps or unclear scraper results.')}
          {ul([
            'Official restaurant menu: very high reliability',
            'Official ordering page: high reliability',
            'Recent restaurant menu photo: high reliability',
            'Third-party menu website: medium reliability',
            'Delivery app: lower reliability — possible markup',
            'Unclear scraper result: low until manually verified',
          ])}
        </>)}

        {card(<>
          {h2('7. Confidence scores')}
          {p('Each entry receives a confidence score based on source quality, dish clarity, price clarity, and location certainty.')}
          {ul([
            '95% — official restaurant website menu',
            '90% — official ordering page',
            '85% — recent menu photo',
            '70% — third-party menu site',
            '60% — delivery app',
            '50% — unclear scraper result',
          ])}
          {p('Scores may be reduced for ambiguous dishes, potentially outdated sources, delivery markup, unclear portion sizes, or uncertain restaurant locations.')}
        </>)}

        {card(<>
          {h2('8. Currency conversion')}
          {p('Prices are stored in Canadian dollars for comparison. The original local price and currency are preserved so the dataset stays auditable.')}
          {p('Each entry records the local price, local currency, exchange rate used, CAD price, and date accessed.')}
        </>)}

        {card(<>
          {h2('9. City-level calculations')}
          {p('The main city price is based on the <strong>median</strong> approved baseline price. Median is used because it\'s less affected by outliers.', 1)}
          {p(<>The <strong>market average</strong> is a 5% trimmed mean of all approved entries — the cheapest and most expensive 5% are excluded before averaging. The trim removes <code style={{ fontFamily: 'monospace', fontSize: 13, color: '#d9682a' }}>Math.round(n × 0.05)</code> entries from each end, so trimming begins once a city has at least 10 approved entries.</>, 2)}
        </>)}

        {card(<>
          {h2('10. Data quality labels')}
          {p('Cities are labelled based on sample size and source reliability.')}
          {ul([
            'Preliminary: 1–2 approved restaurants',
            'Limited: 3–4 approved restaurants',
            'Moderate: 5–9 approved restaurants',
            'Strong: 10–14 approved restaurants',
            'High confidence: 15+ with strong source quality',
          ])}
        </>)}

        {card(<>
          {h2('11. Public submissions')}
          {p('Public submissions don\'t directly affect the index. Submitted restaurants enter a pending review queue. An admin checks the source, dish category, price, currency, and location before approving or denying the entry. Only approved entries are used in city calculations.')}
        </>)}

        {card(<>
          {h2('12. Downloadable datasets')}
          {p(<>The index provides a date-stamped full dataset download from the <a href="/cities" style={{ color: '#d9682a' }}>Cities</a> page. The report is a single CSV with two sections:</>)}
          {ul([
            '<strong>City summary:</strong> baseline median, 5% trimmed market average, standard deviation, price range, entry counts, data quality label, confidence score, and last-updated date.',
            '<strong>Restaurant entries:</strong> every approved restaurant entry with restaurant name, dish name, category, tier, local price, currency, exchange rate, CAD price, source type, source URL, confidence score, and date accessed.',
          ])}
          {p('All prices in CAD. Original local prices and exchange rates are preserved so the dataset is fully auditable.')}
        </>)}

        {card(<>
          {h2('13. Limitations')}
          {p('The index does not account for rent, wages, taxes, transportation, groceries, household expenses, portion size differences, service models, delivery markups, menu changes, or exchange-rate fluctuations.')}
          {p('It is a transparent restaurant-price signal — narrow, imperfect, and honest about that.')}
        </>)}
      </section>
    </main>
  )
}
