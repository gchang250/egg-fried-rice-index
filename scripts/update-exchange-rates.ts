/**
 * update-exchange-rates.ts
 *
 * Fetches live CAD rates from open.er-api.com, then updates every active +
 * approved restaurant entry so that exchange_rate_used and price_cad reflect
 * current rates.  City baselines are recalculated at the end.
 *
 * Run:
 *   export $(grep -v '^#' .env.local | xargs) && npx tsx scripts/update-exchange-rates.ts
 * Flags:
 *   --dry-run   Print what would change, do not write
 */

import { createClient } from '@supabase/supabase-js'

const s = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

const DRY_RUN = process.argv.includes('--dry-run')

// Fallback rates (CAD per 1 unit of foreign currency) if the API is down
const FALLBACK: Record<string, number> = {
  CAD: 1, USD: 1.38, EUR: 1.55, GBP: 1.78, AUD: 0.91, JPY: 0.0091,
  CNY: 0.19, HKD: 0.178, SGD: 1.01, KRW: 0.001, INR: 0.016,
  MXN: 0.071, ARS: 0.0014, AED: 0.37, SAR: 0.37, PKR: 0.005,
  RUB: 0.018, TRY: 0.030, EGP: 0.027, CHF: 1.52, BRL: 0.27,
}

async function fetchLiveRates(): Promise<Record<string, number>> {
  try {
    const res = await fetch('https://open.er-api.com/v6/latest/CAD', { cache: 'no-store' } as RequestInit)
    if (!res.ok) { console.warn('  Rate API returned', res.status, '— using fallback'); return FALLBACK }
    const json = await res.json() as { result: string; rates: Record<string, number> }
    if (json.result !== 'success' || !json.rates) { console.warn('  Rate API bad response — using fallback'); return FALLBACK }
    const live: Record<string, number> = { CAD: 1 }
    for (const [code, ratePerCAD] of Object.entries(json.rates)) {
      if (ratePerCAD > 0) live[code] = Number((1 / ratePerCAD).toFixed(8))
    }
    console.log(`  Fetched ${Object.keys(live).length} live rates`)
    return live
  } catch (err) {
    console.warn('  Rate fetch failed:', (err as Error).message, '— using fallback')
    return FALLBACK
  }
}

function medianOf(sorted: number[]): number | null {
  if (sorted.length === 0) return null
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 1 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
}

function dqLabel(count: number): string {
  if (count >= 15) return 'High confidence'
  if (count >= 10) return 'Strong'
  if (count >= 5)  return 'Moderate'
  if (count >= 3)  return 'Limited'
  return 'Preliminary'
}

async function main() {
  console.log(`\n${'═'.repeat(60)}`)
  console.log(`  Update exchange rates${DRY_RUN ? ' [DRY RUN]' : ''}`)
  console.log(`${'═'.repeat(60)}\n`)

  // 1. Fetch live rates
  console.log('── Fetching rates ──')
  const rates = await fetchLiveRates()

  // Print key rates
  const KEY = ['USD', 'EUR', 'GBP', 'JPY', 'CNY', 'AUD', 'HKD', 'SGD', 'KRW', 'INR', 'ARS', 'PKR']
  for (const code of KEY) {
    if (rates[code]) console.log(`  ${code}: ${rates[code].toFixed(6)} CAD`)
  }
  console.log()

  // 2. Load all active, approved, non-CAD restaurant entries
  console.log('── Loading restaurants ──')
  const { data, error } = await s.from('restaurants')
    .select('id, city, local_price, local_currency, exchange_rate_used, price_cad, included_in_baseline, confidence_score, approved, active')
    .eq('active', true)
    .eq('approved', true)
    .neq('local_currency', 'CAD')

  if (error || !data) { console.error('DB error:', error?.message); process.exit(1) }
  console.log(`  Loaded ${data.length} non-CAD entries\n`)

  type Row = {
    id: string; city: string
    local_price: number; local_currency: string
    exchange_rate_used: number | null; price_cad: number | null
    included_in_baseline: boolean | null; confidence_score: number | null
  }
  const rows = data as Row[]

  // 3. Compute new rates and flag changes
  type Update = { id: string; city: string; currency: string; old_rate: number; new_rate: number; old_cad: number; new_cad: number }
  const updates: Update[] = []
  let skipped = 0

  for (const row of rows) {
    const newRate = rates[row.local_currency]
    if (!newRate) { skipped++; continue }

    const oldRate = Number(row.exchange_rate_used ?? 0)
    const oldCad  = Number(row.price_cad ?? 0)
    const newCad  = Math.round(row.local_price * newRate * 100) / 100

    // Skip if less than 0.5% change (floating point noise)
    const pctChange = oldCad > 0 ? Math.abs(newCad - oldCad) / oldCad : 1
    if (pctChange < 0.005 && Math.abs(newRate - oldRate) < 0.000001) { skipped++; continue }

    updates.push({ id: row.id, city: row.city, currency: row.local_currency, old_rate: oldRate, new_rate: newRate, old_cad: oldCad, new_cad: newCad })
  }

  console.log(`── Changes needed: ${updates.length} / ${data.length} entries (${skipped} unchanged or unknown currency) ──\n`)

  // Print a sample of significant changes
  const sample = [...updates].sort((a, b) => Math.abs(b.new_cad - b.old_cad) - Math.abs(a.new_cad - a.old_cad)).slice(0, 20)
  for (const u of sample) {
    const delta = u.new_cad - u.old_cad
    const sign = delta >= 0 ? '+' : ''
    console.log(`  ${u.city.padEnd(16)} ${u.currency}  old CA$${u.old_cad.toFixed(2)} → new CA$${u.new_cad.toFixed(2)} (${sign}${delta.toFixed(2)})`)
  }
  if (updates.length > 20) console.log(`  ... and ${updates.length - 20} more`)

  if (DRY_RUN) {
    console.log('\n  [dry run] No changes written.')
    return
  }

  // 4. Apply updates in batches of 50
  console.log('\n── Applying updates ──')
  let updated = 0
  for (let i = 0; i < updates.length; i += 50) {
    const batch = updates.slice(i, i + 50)
    for (const u of batch) {
      const { error: upErr } = await s.from('restaurants').update({
        exchange_rate_used: u.new_rate,
        price_cad: u.new_cad,
      }).eq('id', u.id)
      if (upErr) { console.error(`  Error updating ${u.id}: ${upErr.message}`); continue }
      updated++
    }
    process.stdout.write(`  Updated ${updated}/${updates.length}\r`)
  }
  console.log(`\n  Done: ${updated} entries updated\n`)

  // 5. Recalculate baselines for all affected cities
  const affectedCities = [...new Set(updates.map(u => u.city))]
  console.log(`── Recalculating ${affectedCities.length} city baselines ──`)

  for (const city of affectedCities.sort()) {
    const { data: all } = await s.from('restaurants')
      .select('price_cad, included_in_baseline, confidence_score')
      .eq('city', city)
      .eq('active', true)
      .eq('approved', true)

    if (!all || all.length === 0) continue

    const allPrices = (all.map(r => Number(r.price_cad))).filter(p => p > 0).sort((a, b) => a - b)
    const blRows = all.filter(r => r.included_in_baseline)
    const blPrices = blRows.map(r => Number(r.price_cad)).filter(p => p > 0).sort((a, b) => a - b)

    if (blPrices.length === 0) continue

    const blMedian = medianOf(blPrices)!
    const mktAvg = allPrices.reduce((s, p) => s + p, 0) / allPrices.length
    const avgConf = blRows.reduce((s, r) => s + Number(r.confidence_score ?? 0), 0) / blRows.length

    const { error: cityErr } = await s.from('cities').update({
      price_cad:            Math.round(blMedian * 100) / 100,
      baseline_median_cad:  Math.round(blMedian * 100) / 100,
      market_average_cad:   Math.round(mktAvg * 100) / 100,
      market_min_cad:       allPrices[0],
      market_max_cad:       allPrices[allPrices.length - 1],
      market_entry_count:   allPrices.length,
      baseline_entry_count: blPrices.length,
      confidence_score:     Math.round(avgConf * 100) / 100,
      data_quality_label:   dqLabel(allPrices.length),
      price_updated_at:     new Date().toISOString(),
    }).eq('city', city)

    if (cityErr) { console.error(`  ${city}: ${cityErr.message}`); continue }
    console.log(`  ${city.padEnd(18)} CA$${blMedian.toFixed(2)} baseline (${blPrices.length} BL / ${allPrices.length} total)`)
  }

  console.log('\n  Exchange rate update complete.')
}

main().catch(err => { console.error(err); process.exit(1) })
