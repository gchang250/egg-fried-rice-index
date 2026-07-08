import { BookOpen } from 'lucide-react'
import NavBar from '@/app/components/NavBar'

const SECTIONS = [
  { num: '01', title: 'What the index measures', body: ['The Canadian Poutine Index is built from restaurant menu data. It compares classic poutine prices across Canadian communities and studies what those prices reveal about local affordability, rent burdens, and macroeconomic conditions.', "It is a narrower, more tangible indicator than CPI or average wage baskets: one standardized restaurant dish, transparent about what it represents and its limitations."] },
  { num: '02', title: 'Why poutine?', body: ["Poutine is Canada's quintessential casual dish, widely available in almost every province and territory from local diners to roadside chip trucks. It is simple, standardized (fresh-cut fries, cheese curds, gravy), and extremely sensitive to local operating costs.", 'A classic poutine reflects local commercial rents, labor costs, supply chain lines, dairy/cheese curd wholesale costs, utilities, and provincial taxes. It provides a concrete point of comparison.'] },
  { num: '03', title: 'Dish classification', body: ['The index collects all poutine dishes but groups them before processing. Categories: Classic (standard portion of fries, curds, gravy), Side (half portions), Gourmet (with standard meat toppings like pulled pork, bacon, or mushrooms), and Premium (luxury lobster, foie gras, or specialty toppings). We separate these to ensure comparing like-for-like.'] },
  { num: '04', title: 'Baseline vs. market price', body: ['The baseline community price uses only Classic entries, which represent the closest comparison point for everyday, affordable meals.', 'The full market profile includes gourmet and premium categories and is used to study local variety and price spreads.'] },
  { num: '05', title: 'Data collection', body: ['Prices are gathered from official menus, online ordering systems, menu photographs, chip truck boards, delivery apps, scraper-assisted searches, and community submissions. Each entry must list: restaurant name, city, province, dish name, price, source URL, date accessed, and confidence score.'] },
  { num: '06', title: 'Source reliability & confidence', body: ['Official dine-in menu: 95%. Official online ordering page: 90%. Recent menu photo: 85%. Third-party menu site: 70%. Delivery app: 60%. Scores are adjusted for delivery markup and stale data.'] },
  { num: '07', title: 'Community-level calculations', body: ['The baseline price for a community is the median of approved baseline entries. The market average uses a mean of all tracked entries. We also compute the absolute range (min to max), and data quality labels based on sample sizes.'] },
  { num: '08', title: 'Housing & Wage normalization', body: ['To gauge purchasing power, we pull local median household income (from Statistics Canada census updates) and local median 1BR rental costs (from the Canada Mortgage and Housing Corporation - CMHC). This lets us compute the rent burden and remaining disposable income in "poutines per month".'] },
  { num: '09', title: 'Data quality labels', body: ['Preliminary: 1–2 restaurant entries. Moderate: 3–5. High confidence: 6+ entries with high source quality.'] },
  { num: '10', title: 'Limitations', body: ["The index focuses on a single restaurant meal. It does not account for groceries, utilities, transit, or individual tax brackets. It is a focused indicator of local discretionary purchasing power and is honest about its limits."] },
]

export default function MethodologyPage() {
  return (
    <main style={{ fontFamily: 'var(--font-body)', background: 'var(--color-bg)', minHeight: '100vh', color: 'var(--color-text-1)' }}>
      <NavBar active="methodology" />

      <div style={{ maxWidth: 920, margin: '0 auto', padding: 'clamp(3rem,6vh,5rem) 2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '1.5rem' }}>
          <BookOpen size={14} color="var(--color-accent)" />
          <span style={{ fontSize: 11, letterSpacing: '2.5px', textTransform: 'uppercase', color: 'var(--color-text-3)', fontWeight: 600 }}>Methodology</span>
        </div>

        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(32px, 5vw, 56px)', fontWeight: 400, lineHeight: 1.05, letterSpacing: -1.5, color: 'var(--color-text-1)', margin: '0 0 1.5rem' }}>
          How the Canadian Poutine<br />Index is calculated.
        </h1>

        <p style={{ fontSize: 16, color: 'var(--color-text-2)', lineHeight: 1.7, maxWidth: 640, marginBottom: '3.5rem' }}>
          The index compares restaurant poutine prices across Canadian communities and tracks what those prices reveal about affordability, housing rent burdens, and local purchasing power.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', border: '0.5px solid var(--color-border)', borderRadius: 12, overflow: 'hidden' }}>
          {SECTIONS.map(s => (
            <div key={s.num} style={{ background: 'var(--color-surface)', padding: '1.75rem 2rem', display: 'flex', gap: '1.5rem' }}>
              <span style={{ fontSize: 11, color: 'var(--color-text-3)', fontVariantNumeric: 'tabular-nums', flexShrink: 0, paddingTop: 3, fontFamily: 'var(--font-mono)' }}>{s.num}</span>
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
