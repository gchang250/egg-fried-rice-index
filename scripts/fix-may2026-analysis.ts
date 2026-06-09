/**
 * Updates the May 2026 report analysis text: removes em dashes,
 * removes "not X" constructions, and tightens filler phrasing.
 *
 * Run with:
 *   export $(grep -v '^#' .env.local | xargs) && npx tsx scripts/fix-may2026-analysis.ts
 */

import { createClient } from '@supabase/supabase-js'

const s = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

const ANALYSIS = `The Fried Rice Index opens its inaugural edition with forty cities catalogued across six continents: Karachi at CA$1.80 per bowl to London at CA$20.68, a spread of 11.5x that sets the baseline for all future tracking. Egg fried rice is the right dish for this exercise because it is ordinary. It appears on every price tier of every Chinese-influenced restaurant menu in the world, consumed by construction workers and office workers alike. Its price reflects labour, utilities, rent, and staple ingredients at the point where a kitchen and a customer meet: the cost of living itself.

The cheapest cities cluster in South Asia. Karachi (CA$1.80), Kolkata, New Delhi, and Mumbai all sit below CA$5, representing economies where restaurant food remains accessible to a broad working population. China's interior cities (Chengdu, Chongqing, Wuhan, Suzhou) occupy a similar tier, consistent with the dish's status there as everyday food. The transition upward runs through East Asia's global hubs: Tokyo and Osaka fall in the CA$5-7 range, Seoul somewhat higher, Singapore at CA$7.56, held down by the hawker centre infrastructure that government policy has long protected. The premium tier belongs almost entirely to Western cities. Amsterdam, Paris, and London have absorbed a decade of accumulated cost increases into their restaurant menus: London's CA$20.68 median is more than eleven times Karachi's price.

Dish price alone gives an incomplete picture, and in some cases a misleading one. The rent burden metric, expressing monthly rent as a percentage of median salary, reveals a second axis of hardship. Buenos Aires carries the highest burden at 92%: the median resident spends more than nine-tenths of income on housing before food is considered. Tehran (90%) and Cairo (83%) follow closely, cities where years of currency devaluation and supply-constrained housing markets have made the gap between income and shelter almost impossibly narrow. Hong Kong presents combined stress: its CA$11.36 baseline sits mid-range globally, and it also carries an 82% rent burden. The "bowls after rent" figure (bowls affordable on a median salary after housing costs) places Hong Kong among the least liveable cities on this composite measure. The cities that score best are the Chinese interior cities where food prices and housing costs both remain low relative to local wages.

Several city prices warrant brief context. Los Angeles records CA$15.64, reflecting deliberate weighting of San Gabriel Valley restaurants: the SGV hosts one of the densest concentrations of regional Chinese cuisine outside China, with budget operators in Monterey Park and Alhambra keeping prices below what the broader Los Angeles market would suggest. Moscow's figures carry a caveat: sanctions-era import restrictions and price volatility have made the restaurant market less representative of long-run conditions, and these numbers should be read accordingly. Singapore's CA$7.56 median was reached through careful inclusion of kopitiam and food court operators, the dominant mode of consumption for most residents; tourist-facing prices in Orchard Road or Marina Bay would inflate the figure considerably.

This is the first of what will be monthly reports. From July 2026, the index expands by five cities per month, starting with Southeast Asian capitals and adding coverage in Africa and Latin America in subsequent months. Exchange rates are reviewed with each edition; rates used here are documented below. All forty cities hold a "High Confidence" data quality designation, with a minimum of 22 verified restaurant entries per city across budget, mid-market, and premium tiers.`

async function main() {
  const { error } = await s
    .from('monthly_reports')
    .update({
      analysis: ANALYSIS,
      subtitle: 'Inaugural Edition: 40 Cities',
    })
    .eq('month', '2026-05')

  if (error) {
    console.error('Update failed:', error.message)
    process.exit(1)
  }
  console.log('May 2026 analysis text updated.')
}

main().catch((err) => { console.error(err); process.exit(1) })
