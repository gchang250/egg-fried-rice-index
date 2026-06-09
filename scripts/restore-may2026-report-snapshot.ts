/**
 * Restores the May 2026 monthly_report snapshot to the original May 2026
 * exchange rates and city prices, undoing the accidental June 2026 overwrite.
 *
 * Monthly report snapshots are immutable — they record what prices were at
 * the time of the report. Only the live cities/restaurants tables should be
 * updated when exchange rates change.
 *
 * Run with:
 *   export $(grep -v '^#' .env.local | xargs) && npx tsx scripts/restore-may2026-report-snapshot.ts
 */

import { createClient } from '@supabase/supabase-js'

const s = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

// Original May 2026 rates (from seed-reports-v1.ts and all seed-update-v* scripts)
const MAY_2026_RATES: Record<string, number> = {
  USD: 1.39,
  GBP: 1.76,
  EUR: 1.51,
  AUD: 0.88,
  SGD: 1.08,
  CNY: 0.203,
  HKD: 0.1748,
  JPY: 0.00869,
  KRW: 0.00091,
  INR: 0.0165,
  PKR: 0.0036,
  AED: 0.379,
  SAR: 0.370,
  EGP: 0.028,
  RUB: 0.015,
  TRY: 0.037,
  MXN: 0.072,
  ARS: 0.0011,
  CAD: 1.0,
}

const r2 = (n: number) => Math.round(n * 100) / 100

function medianOf(sorted: number[]): number {
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 1
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2
}

async function main() {
  console.log('═══════════════════════════════════════════════')
  console.log('  Restoring May 2026 report snapshot')
  console.log('═══════════════════════════════════════════════\n')

  // Fetch all approved active restaurants with local price info
  const { data: restaurants, error: rErr } = await s
    .from('restaurants')
    .select('city, country, local_price, local_currency, included_in_baseline, approved, active, confidence_score')
    .eq('approved', true)
    .eq('active', true)

  if (rErr || !restaurants) { console.error('Failed to fetch restaurants:', rErr?.message); process.exit(1) }

  // Compute May 2026 price_cad per restaurant and group by city
  type CityAcc = { baseline: number[]; all: number[] }
  const cityPrices = new Map<string, CityAcc>()

  for (const r of restaurants) {
    if (r.local_price == null) continue
    const rate = MAY_2026_RATES[r.local_currency ?? 'CAD'] ?? MAY_2026_RATES['CAD']
    const price = r2(Number(r.local_price) * rate)
    if (price <= 0) continue

    if (!cityPrices.has(r.city)) cityPrices.set(r.city, { baseline: [], all: [] })
    const acc = cityPrices.get(r.city)!
    acc.all.push(price)
    if (r.included_in_baseline) acc.baseline.push(price)
  }

  // Fetch city metadata for the snapshot
  const { data: cities, error: cErr } = await s
    .from('cities')
    .select(`
      city, country, region, flag,
      median_rent_1br_cad, median_monthly_salary_cad,
      baseline_entry_count, market_entry_count, data_quality_label
    `)

  if (cErr || !cities) { console.error('Failed to fetch cities:', cErr?.message); process.exit(1) }

  // Build the city_snapshot with May 2026 baseline medians
  const citySnapshot = cities
    .map(city => {
      const prices = cityPrices.get(city.city)
      if (!prices || prices.baseline.length === 0) return null

      const sortedBL = [...prices.baseline].sort((a, b) => a - b)
      const mayPrice = r2(medianOf(sortedBL))

      return {
        city:                      city.city,
        country:                   city.country,
        region:                    city.region,
        flag:                      city.flag,
        price_cad:                 mayPrice,
        median_rent_1br_cad:       city.median_rent_1br_cad,
        median_monthly_salary_cad: city.median_monthly_salary_cad,
        baseline_entry_count:      city.baseline_entry_count,
        market_entry_count:        city.market_entry_count,
        data_quality_label:        city.data_quality_label,
      }
    })
    .filter((c): c is NonNullable<typeof c> => c !== null)
    .sort((a, b) => a.price_cad - b.price_cad)

  const cheapest = citySnapshot[0]
  const priciest = citySnapshot[citySnapshot.length - 1]
  const avg = r2(citySnapshot.reduce((sum, c) => sum + c.price_cad, 0) / citySnapshot.length)
  const spread = Math.round((priciest.price_cad / cheapest.price_cad) * 10) / 10

  console.log(`  Rebuilt ${citySnapshot.length} city snapshots with May 2026 rates`)
  console.log(`  Cheapest: ${cheapest.city} CA$${cheapest.price_cad.toFixed(2)}`)
  console.log(`  Priciest: ${priciest.city} CA$${priciest.price_cad.toFixed(2)}`)
  console.log(`  Spread: ${spread}×  ·  Avg: CA$${avg.toFixed(2)}`)

  const { error } = await s
    .from('monthly_reports')
    .update({
      exchange_rates_snapshot: MAY_2026_RATES,
      city_snapshot:           citySnapshot,
      cheapest_city:           cheapest.city,
      cheapest_price_cad:      cheapest.price_cad,
      priciest_city:           priciest.city,
      priciest_price_cad:      priciest.price_cad,
      spread_ratio:            spread,
      avg_baseline_cad:        avg,
      city_count:              citySnapshot.length,
    })
    .eq('month', '2026-05')

  if (error) {
    console.error('\n  ✗ Update failed:', error.message)
    process.exit(1)
  }

  console.log('\n  ✓ May 2026 report snapshot restored')
  console.log('    exchange_rates_snapshot → May 2026 rates')
  console.log('    city_snapshot → May 2026 baseline medians')
  console.log('\n═══════════════════════════════════════════════')
}

main().catch((err) => { console.error(err); process.exit(1) })
