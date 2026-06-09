import { Globe, BookOpen } from 'lucide-react'

const NAV_LINKS = [['cities','/cities'],['submit','/submit'],['about','/about'],['methodology','/methodology']] as const

function Nav({ active }: { active?: string }) {
  return (
    <nav style={{
      position: 'sticky', top: 0, zIndex: 50,
      background: 'rgba(9,13,10,.92)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
      borderBottom: '0.5px solid var(--color-border)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 2rem', height: 56,
    }}>
      <a href="/" style={{ fontFamily: 'var(--font-display)', fontSize: 17, color: 'var(--color-text-1)', textDecoration: 'none', fontStyle: 'italic', letterSpacing: -.2, display: 'flex', alignItems: 'center', gap: 8 }}>
        <Globe size={15} color="var(--color-accent)" />
        fried rice <span style={{ color: 'var(--color-accent)', fontStyle: 'normal' }}>index</span>
      </a>
      <div style={{ display: 'flex', gap: '1.75rem' }}>
        {NAV_LINKS.map(([l, h]) => (
          <a key={h} href={h} style={{ fontSize: 13, textDecoration: 'none', color: l === active ? 'var(--color-text-1)' : 'var(--color-text-3)', borderBottom: l === active ? '0.5px solid var(--color-accent)' : 'none', paddingBottom: l === active ? 1 : 0 }}>{l}</a>
        ))}
      </div>
    </nav>
  )
}

const SECTIONS = [
  { num: '01', title: 'What the index measures', body: ['The Fried Rice Index is built from restaurant menu data. It compares fried rice prices across cities and studies what those prices reveal about everyday affordability, local restaurant markets, and urban economic conditions.', "It is not a replacement for CPI, PPP, rent data, or wage data. It is a narrower signal based on one common restaurant dish — transparent about what it is and what it isn't."] },
  { num: '02', title: 'Why fried rice?', body: ["Fried rice is widely available, easy to identify on menus, and common across many cities. It appears at casual restaurants and higher-end spots, making it useful for comparing everyday affordability and the range of a city's restaurant market.", 'A fried rice price can reflect labour costs, rent, ingredients, tax, supply chains, and local pricing norms. The goal is a concrete comparison point, not a complete economic model.'] },
  { num: '03', title: 'Dish classification', body: ['The index collects all fried rice dishes but classifies them before analysis. Categories: Basic (plain, egg, soy sauce), Vegetable, Meat-based (chicken, pork, beef), Seafood, House special (combination, Yangzhou), and Premium (lobster, truffle, wagyu). Not every dish is treated as equivalent.'] },
  { num: '04', title: 'Baseline vs. market price', body: ['The baseline city price uses only Basic and Vegetable entries — the closest comparison points for everyday affordability.', 'The full market profile includes all categories and is used to study variety, price spread, and premiumisation. Premium dishes are not treated as identical to basic fried rice.'] },
  { num: '05', title: 'Data collection', body: ['Prices come from official restaurant menus, ordering pages, menu photos, third-party menu sites, delivery apps, scraper-assisted searches, and public submissions. Every approved entry must include: restaurant name, city, dish name, original price, currency, source link, source type, date checked, and confidence score.'] },
  { num: '06', title: 'Source reliability & confidence', body: ['Official restaurant menu: 95%. Official ordering page: 90%. Recent menu photo: 85%. Third-party menu site: 70%. Delivery app: 60%. Unclear scraper result: 50%. Scores are reduced for ambiguous dishes, stale sources, delivery markup, or uncertain locations.'] },
  { num: '07', title: 'City-level calculations', body: ['The main city price is the median approved baseline price. A 5% trimmed mean of all entries gives the market average (trimming begins once a city has 10+ entries). The index also tracks minimum, maximum, standard deviation, restaurant count, average confidence, and a data quality label.'] },
  { num: '08', title: 'Currency conversion', body: ['Prices are stored in CAD for comparison. The original local price and exchange rate are preserved so the dataset stays fully auditable. Each entry records local price, local currency, rate used, CAD price, and access date.'] },
  { num: '09', title: 'Data quality labels', body: ['Preliminary: 1–2 restaurants. Limited: 3–4. Moderate: 5–9. Strong: 10–14. High confidence: 15+ with strong source quality.'] },
  { num: '10', title: 'Limitations', body: ["The index does not account for rent, wages, taxes, transportation, groceries, portion differences, service models, delivery markups, or exchange-rate changes. It's a transparent restaurant-price signal — narrow, imperfect, and honest about that."] },
]

export default function MethodologyPage() {
  return (
    <main style={{ fontFamily: 'var(--font-body)', background: 'var(--color-bg)', minHeight: '100vh', color: 'var(--color-text-1)' }}>
      <Nav active="methodology" />

      <div style={{ maxWidth: 920, margin: '0 auto', padding: 'clamp(3rem,6vh,5rem) 2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '1.5rem' }}>
          <BookOpen size={14} color="var(--color-accent)" />
          <span style={{ fontSize: 11, letterSpacing: '2.5px', textTransform: 'uppercase', color: 'var(--color-text-3)' }}>Methodology</span>
        </div>

        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(32px, 5vw, 56px)', fontWeight: 400, lineHeight: 1.05, letterSpacing: -1.5, color: 'var(--color-text-1)', margin: '0 0 1.5rem' }}>
          How the Fried Rice<br />Index is calculated.
        </h1>

        <p style={{ fontSize: 16, color: 'var(--color-text-2)', lineHeight: 1.7, maxWidth: 640, marginBottom: '3.5rem' }}>
          The index compares restaurant fried rice prices across cities and tracks what those prices reveal about affordability, dish variety, and local restaurant markets.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', border: '0.5px solid var(--color-border)', borderRadius: 12, overflow: 'hidden' }}>
          {SECTIONS.map(s => (
            <div key={s.num} style={{ background: 'var(--color-surface)', padding: '1.75rem 2rem', display: 'flex', gap: '1.5rem' }}>
              <span style={{ fontSize: 11, color: 'var(--color-text-3)', fontVariantNumeric: 'tabular-nums', flexShrink: 0, paddingTop: 3 }}>{s.num}</span>
              <div>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 20, color: 'var(--color-text-1)', margin: '0 0 0.75rem', fontWeight: 400 }}>{s.title}</h2>
                {s.body.map((p, i) => (
                  <p key={i} style={{ fontSize: 14, color: 'var(--color-text-2)', lineHeight: 1.75, margin: i < s.body.length - 1 ? '0 0 0.7rem' : 0 }}>{p}</p>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
