/**
 * Updates all restaurant exchange rates to June 2026 values,
 * recomputes city baseline stats, and refreshes the monthly report snapshot.
 *
 * Run with:
 *   export $(grep -v '^#' .env.local | xargs) && npx tsx scripts/update-exchange-rates-june2026.ts
 *
 * Sources: XE.com / Bank of Canada, June 8–9, 2026
 *   USD 1.3951  EUR 1.6106  GBP 1.8621  AUD 0.9841  SGD 1.0830
 *   CNY 0.2057  HKD 0.1780  JPY 0.008713 KRW 0.0009129 INR 0.01460
 *   PKR 0.005015  AED 0.3799  SAR 0.3720  EGP 0.02680  RUB 0.01891
 *   TRY 0.03025  MXN 0.08000  ARS 0.0009654
 */

import { createClient } from '@supabase/supabase-js'

const s = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

const JUNE_2026_RATES: Record<string, number> = {
  USD: 1.3951,
  EUR: 1.6106,
  GBP: 1.8621,
  AUD: 0.9841,
  SGD: 1.0830,
  CNY: 0.2057,
  HKD: 0.1780,
  JPY: 0.008713,
  KRW: 0.0009129,
  INR: 0.01460,
  PKR: 0.005015,
  AED: 0.3799,
  SAR: 0.3720,
  EGP: 0.02680,
  RUB: 0.01891,
  TRY: 0.03025,
  MXN: 0.08000,
  ARS: 0.0009654,
}

const r2 = (n: number) => Math.round(n * 100) / 100

function median(sorted: number[]): number {
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 1
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2
}

function trimmedMean(sorted: number[], frac = 0.05): number {
  const k = Math.round(sorted.length * frac)
  const trimmed = k > 0 ? sorted.slice(k, sorted.length - k) : sorted
  const src = trimmed.length ? trimmed : sorted
  return src.reduce((s, v) => s + v, 0) / src.length
}

async function updateRestaurantsForCurrency(currency: string, rate: number): Promise<number> {
  const { data, error } = await s
    .from('restaurants')
    .select('id, local_price')
    .eq('local_currency', currency)
    .not('local_price', 'is', null)

  if (error) { console.error(`  Fetch error for ${currency}: ${error.message}`); return 0 }
  if (!data || data.length === 0) { console.log(`  ${currency}: no entries`); return 0 }

  // Batch updates in groups of 20
  const batchSize = 20
  let updated = 0
  for (let i = 0; i < data.length; i += batchSize) {
    const batch = data.slice(i, i + batchSize)
    const results = await Promise.all(
      batch.map((row) =>
        s.from('restaurants')
          .update({
            price_cad: r2(Number(row.local_price) * rate),
            exchange_rate_used: rate,
          })
          .eq('id', row.id)
      )
    )
    const errors = results.filter((r) => r.error)
    if (errors.length) {
      console.error(`  ${currency}: ${errors.length} update errors in batch ${i / batchSize + 1}`)
    }
    updated += batch.length - errors.length
  }

  console.log(`  ${currency}: updated ${updated}/${data.length} entries (rate: ${rate})`)
  return updated
}

async function recomputeCityStats() {
  console.log('\n── Recomputing city baseline stats ──')

  const { data: restaurants, error: rErr } = await s
    .from('restaurants')
    .select('city, price_cad, included_in_baseline, approved, active, confidence_score')
    .eq('approved', true)
    .eq('active', true)

  if (rErr || !restaurants) { console.error('Failed to fetch restaurants:', rErr?.message); return }

  const cityMap = new Map<string, { all: number[]; baseline: number[]; confs: number[] }>()
  for (const r of restaurants) {
    if (!r.city || r.price_cad == null) continue
    if (!cityMap.has(r.city)) cityMap.set(r.city, { all: [], baseline: [], confs: [] })
    const entry = cityMap.get(r.city)!
    const price = Number(r.price_cad)
    if (price > 0) {
      entry.all.push(price)
      if (r.included_in_baseline) {
        entry.baseline.push(price)
        entry.confs.push(Number(r.confidence_score ?? 0.8))
      }
    }
  }

  const NOW = new Date().toISOString()
  let citiesUpdated = 0

  for (const [city, { all, baseline, confs }] of cityMap) {
    if (baseline.length === 0) continue

    const sortedBaseline = [...baseline].sort((a, b) => a - b)
    const sortedAll = [...all].sort((a, b) => a - b)
    const baselineMedian = r2(median(sortedBaseline))
    const marketAvg = r2(trimmedMean(sortedAll))
    const avgConf = confs.length ? confs.reduce((s, c) => s + c, 0) / confs.length : 0.8

    const { error } = await s.from('cities').update({
      price_cad: baselineMedian,
      baseline_median_cad: baselineMedian,
      market_average_cad: marketAvg,
      market_min_cad: r2(sortedAll[0]),
      market_max_cad: r2(sortedAll[sortedAll.length - 1]),
      market_entry_count: sortedAll.length,
      baseline_entry_count: sortedBaseline.length,
      price_updated_at: NOW,
      confidence_score: r2(avgConf),
    }).eq('city', city)

    if (error) {
      console.error(`  ${city}: city update failed — ${error.message}`)
    } else {
      console.log(`  ${city}: baseline median CA$${baselineMedian.toFixed(2)} (${sortedBaseline.length} BL entries)`)
      citiesUpdated++
    }
  }

  console.log(`\n  ✓ ${citiesUpdated} cities recomputed`)
  return cityMap
}

async function updateReportSnapshot() {
  console.log('\n── Updating monthly_reports exchange_rates_snapshot ──')

  const { data: cities, error: cErr } = await s
    .from('cities')
    .select(`
      city, country, region, flag, price_cad,
      median_rent_1br_cad, median_monthly_salary_cad,
      baseline_entry_count, market_entry_count, data_quality_label
    `)
    .order('price_cad', { ascending: true, nullsFirst: false })

  if (cErr || !cities) { console.error('Failed to fetch cities:', cErr?.message); return }

  const clean = cities.filter(c => c.price_cad != null && Number(c.price_cad) > 0)
  const cheapest = clean[0]
  const priciest = clean[clean.length - 1]
  const avg = clean.reduce((sum, c) => sum + Number(c.price_cad), 0) / clean.length
  const spread = r2(Number(priciest.price_cad) / Number(cheapest.price_cad) * 10) / 10

  const { error } = await s
    .from('monthly_reports')
    .update({
      exchange_rates_snapshot: JUNE_2026_RATES,
      city_snapshot: clean,
      cheapest_city: cheapest.city,
      cheapest_price_cad: Number(cheapest.price_cad),
      priciest_city: priciest.city,
      priciest_price_cad: Number(priciest.price_cad),
      spread_ratio: spread,
      avg_baseline_cad: r2(avg),
      city_count: clean.length,
    })
    .eq('month', '2026-05')

  if (error) {
    console.error('  Report update failed:', error.message)
  } else {
    console.log(`  ✓ exchange_rates_snapshot updated with June 2026 rates`)
    console.log(`  ✓ city_snapshot refreshed — ${clean.length} cities`)
    console.log(`  ✓ Spread: ${cheapest.city} (CA$${Number(cheapest.price_cad).toFixed(2)}) → ${priciest.city} (CA$${Number(priciest.price_cad).toFixed(2)}) = ${spread}×`)
  }
}

async function main() {
  console.log('═══════════════════════════════════════════════')
  console.log('  Exchange Rate Update — June 2026')
  console.log('═══════════════════════════════════════════════\n')
  console.log('── Step 1: Updating restaurant prices ──')

  let totalUpdated = 0
  for (const [currency, rate] of Object.entries(JUNE_2026_RATES)) {
    totalUpdated += await updateRestaurantsForCurrency(currency, rate)
  }
  console.log(`\n  ✓ ${totalUpdated} restaurant entries updated`)

  await recomputeCityStats()
  await updateReportSnapshot()

  console.log('\n═══════════════════════════════════════════════')
  console.log('  Done.')
  console.log('═══════════════════════════════════════════════')
}

main().catch((err) => { console.error(err); process.exit(1) })
