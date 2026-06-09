/**
 * Seeds the monthly_reports table — inaugural June 2026 edition.
 *
 * Prerequisites:
 *   1. Run scripts/migrate-reports-v1.sql in the Supabase SQL editor
 *   2. export $(grep -v '^#' .env.local | xargs) && npx tsx scripts/seed-reports-v1.ts
 */

import { createClient } from '@supabase/supabase-js'

const s = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

const ANALYSIS = `The Fried Rice Index opens its inaugural edition with forty cities catalogued across six continents — from Karachi's CA$1.80 per bowl to London's CA$20.68, a spread of 11.5× that sets the baseline for all tracking to come. Egg fried rice is the right dish for this exercise precisely because it is not special. It appears on every price tier of every Chinese-influenced restaurant menu in the world, eaten by construction workers and office workers alike. Its price does not reflect prestige or scarcity. It reflects the cost of labour, utilities, rent, and staple ingredients at the point where a kitchen and a customer meet — which is to say, it reflects the cost of living.

The cheapest cities are clustered in South Asia. Karachi (CA$1.80), Kolkata, New Delhi, and Mumbai all sit well below CA$5, each representing economies where restaurant food remains genuinely accessible to a broad working population. China's interior cities — Chengdu, Chongqing, Wuhan, and Suzhou — occupy a similar affordability tier, consistent with the dish's status there as ordinary food rather than restaurant curiosity. The transition upward runs through East Asia's global hubs: Tokyo and Osaka fall in the CA$5–7 range, Seoul somewhat higher, Singapore at CA$7.56 — a figure held down by the hawker centre infrastructure that government policy has long protected. The premium tier belongs almost entirely to Western cities. Amsterdam, Paris, and London have absorbed a decade of accumulated cost increases into their restaurant menus, and it shows: London's CA$20.68 median is more than eleven times the price of a bowl in Karachi.

Dish price alone gives an incomplete picture — and in some cases a misleading one. The index's rent burden metric, which expresses monthly rent as a percentage of the median local salary, reveals a second axis of hardship entirely. Buenos Aires carries the highest rent burden in the index at 92%, meaning the median resident spends more than nine-tenths of their income on housing before food is even considered. Tehran (90%) and Cairo (83%) follow closely, both cities where years of currency devaluation and supply-constrained housing markets have made the gap between income and shelter almost impossibly narrow. Hong Kong presents a different kind of combined stress: its CA$11.36 baseline is not cheap by global standards, and it also carries an 82% rent burden. The "bowls after rent" figure — the number of bowls affordable on a median salary after housing costs are deducted — places Hong Kong among the least liveable cities in the world by this composite measure, despite sitting in the middle of the global price range. The cities that score best on this metric are, consistently, the Chinese interior cities where both food prices and housing costs remain low relative to local wages.

A few city-level observations merit specific note. Los Angeles records a CA$15.64 baseline, a figure that reflects the deliberate weighting of San Gabriel Valley restaurants in the dataset: the SGV hosts one of the densest concentrations of regional Chinese cuisine outside China, with budget operators in Monterey Park and Alhambra keeping prices well below what the broader Los Angeles market would suggest. Moscow's data carries a caveat: sanctions-era import restrictions and price volatility have made the restaurant market less representative of long-run conditions than in earlier periods, and these figures should be read with that context in mind. Singapore's CA$7.56 median was arrived at through careful inclusion of kopitiam and food court operators, which form the dominant mode of food-service consumption for most residents; tourist-facing prices in Orchard Road or Marina Bay would inflate the figure considerably and misrepresent how Singaporeans actually eat.

This is the first of what will be monthly reports. From July 2026, the index expands by five cities per month — beginning with Southeast Asian capitals and moving through additional coverage in Africa and Latin America in subsequent months. Exchange rates are reviewed and updated with each edition; rates used in this report are documented below. All forty cities currently hold a "High Confidence" data quality designation, with a minimum of 22 verified restaurant entries per city distributed across budget, mid-market, and premium tiers.`

const EXCHANGE_RATES: Record<string, number> = {
  USD: 1.39, GBP: 1.76, EUR: 1.51, AUD: 0.88, SGD: 1.08,
  CNY: 0.203, HKD: 0.1748, JPY: 0.00869, KRW: 0.00091,
  INR: 0.0165, PKR: 0.0036,
  AED: 0.379, SAR: 0.370, EGP: 0.028,
  RUB: 0.015, TRY: 0.037,
  MXN: 0.072, ARS: 0.0011,
}

async function main() {
  const { data: cities, error } = await s
    .from('cities')
    .select(`
      city, country, region, flag, price_cad,
      median_rent_1br_cad, median_monthly_salary_cad,
      baseline_entry_count, market_entry_count,
      data_quality_label, population
    `)
    .order('price_cad', { ascending: true, nullsFirst: false })

  if (error) { console.error(error); process.exit(1) }

  const clean = (cities ?? []).filter(c => c.price_cad != null && Number(c.price_cad) > 0)
  const cheapest = clean[0]
  const priciest = clean[clean.length - 1]
  const avg = clean.reduce((sum, c) => sum + Number(c.price_cad), 0) / clean.length
  const spread = Number(priciest.price_cad) / Number(cheapest.price_cad)

  const { error: insertErr } = await s.from('monthly_reports').insert({
    month:              '2026-05',
    title:              'May 2026',
    subtitle:           'Inaugural Edition — 40 Cities',
    city_count:         clean.length,
    new_cities:         [],
    analysis:           ANALYSIS,
    cheapest_city:      cheapest.city,
    cheapest_price_cad: Number(cheapest.price_cad),
    priciest_city:      priciest.city,
    priciest_price_cad: Number(priciest.price_cad),
    spread_ratio:       Math.round(spread * 10) / 10,
    avg_baseline_cad:   Math.round(avg * 100) / 100,
    exchange_rates_snapshot: EXCHANGE_RATES,
    city_snapshot:      clean,
    published_at:       '2026-06-02T00:00:00Z',
    is_published:       true,
  })

  if (insertErr) { console.error(insertErr); process.exit(1) }
  console.log(`✓ Seeded June 2026 report — ${clean.length} cities snapshotted`)
}

main()
