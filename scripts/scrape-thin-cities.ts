/**
 * scrape-thin-cities.ts
 *
 * Runs the existing scrapeCity pipeline for cities that have fewer than 5
 * baseline entries, then auto-approves new proposals above the confidence
 * threshold and recalculates city stats.
 *
 * Run:
 *   export $(grep -v '^#' .env.local | xargs) && npx tsx scripts/scrape-thin-cities.ts
 * Flags:
 *   --dry-run        Scrape and insert into pending_requests, but skip auto-approve
 *   --city "Miami"   Only scrape one city
 *   --min-bl 3       Only scrape cities with baseline_entry_count < 3 (default 5)
 */

import { createClient } from '@supabase/supabase-js'
import { scrapeCity } from '@/app/api/scrape-city/route'

const s = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

const DRY_RUN    = process.argv.includes('--dry-run')
const CITY_ARG   = (() => { const i = process.argv.indexOf('--city'); return i >= 0 ? process.argv[i + 1] : null })()
const MIN_BL     = (() => { const i = process.argv.indexOf('--min-bl'); return i >= 0 ? Number(process.argv[i + 1]) : 5 })()

// These cities need region to disambiguate the scraper search.
// Note: Montreal 'QC' suppresses all SerpAPI results — omit it.
const REGION_MAP: Record<string, string> = {
  'Miami':     'FL',
  'Vancouver': 'BC',
  'Portland':  'OR',
  'Calgary':   'AB',
  'Edmonton':  'AB',
  'Toronto':   'ON',
}

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)) }

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

async function recalcCity(city: string) {
  const { data } = await s.from('restaurants')
    .select('price_cad, included_in_baseline, confidence_score')
    .eq('city', city)
    .eq('active', true)
    .eq('approved', true)

  if (!data || data.length === 0) return

  const allPrices = data.map(r => Number(r.price_cad)).filter(p => p > 0).sort((a, b) => a - b)
  const blRows = data.filter(r => r.included_in_baseline)
  const blPrices = blRows.map(r => Number(r.price_cad)).filter(p => p > 0).sort((a, b) => a - b)
  if (blPrices.length === 0) return

  const blMedian = medianOf(blPrices)!
  const mktAvg = allPrices.reduce((s, p) => s + p, 0) / allPrices.length
  const avgConf = blRows.reduce((s, r) => s + Number(r.confidence_score ?? 0), 0) / blRows.length

  await s.from('cities').update({
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

  console.log(`  Recalculated ${city}: CA$${blMedian.toFixed(2)} (${blPrices.length} BL / ${allPrices.length} total) — ${dqLabel(allPrices.length)}`)
}

async function main() {
  console.log(`\n${'═'.repeat(60)}`)
  console.log(`  Scrape thin cities${DRY_RUN ? ' [DRY RUN — no auto-approve]' : ''}`)
  console.log(`${'═'.repeat(60)}\n`)

  // Load thin cities from DB
  let query = s.from('cities')
    .select('city, country, baseline_entry_count, data_quality_label')
    .lt('baseline_entry_count', MIN_BL)
    .not('country', 'is', null)
    .order('baseline_entry_count', { ascending: true })

  if (CITY_ARG) query = (query as typeof query).eq('city', CITY_ARG)

  const { data: cities, error } = await query
  if (error || !cities) { console.error('DB error:', error?.message); process.exit(1) }

  console.log(`Cities to scrape (baseline < ${MIN_BL}): ${cities.length}`)
  for (const c of cities) {
    console.log(`  ${c.city.padEnd(18)} BL:${c.baseline_entry_count ?? '?'}  ${c.data_quality_label ?? '?'}`)
  }
  console.log()

  const approvedCities = new Set<string>()

  for (const city of cities) {
    const region = REGION_MAP[city.city]
    console.log(`\n── Scraping ${city.city}, ${city.country}${region ? ` (${region})` : ''} ──`)

    try {
      const result = await scrapeCity(city.city, city.country, region)

      console.log(`  URLs checked:       ${result.urls_checked}`)
      console.log(`  Pages scraped:      ${result.pages_scraped}`)
      console.log(`  Dishes found:       ${result.dishes_found}`)
      console.log(`  Proposals inserted: ${result.proposals_inserted}`)
      if (result.errors.length > 0) {
        console.log(`  Errors: ${result.errors.length}`)
        for (const e of result.errors.slice(0, 3)) console.log(`    ${e.slice(0, 100)}`)
      }

      if (result.proposals_inserted > 0) approvedCities.add(city.city)
    } catch (err) {
      console.error(`  Failed: ${(err as Error).message}`)
    }

    // Rate-limit between cities to avoid hammering SerpAPI / Groq
    if (cities.indexOf(city) < cities.length - 1) {
      console.log('  Waiting 15s before next city...')
      await sleep(15000)
    }
  }

  if (DRY_RUN) {
    console.log('\n  [dry run] Skipping auto-approve step.')
    console.log('  Review pending_requests in the admin panel, then re-run without --dry-run.')
    return
  }

  // Auto-approve proposals with confidence >= 0.65 and no serving size warning
  if (approvedCities.size === 0) {
    console.log('\n  No new proposals were inserted — nothing to approve.')
    return
  }

  console.log(`\n── Auto-approving high-confidence proposals ──`)
  const cityList = [...approvedCities]
  const { data: pending, error: pendingErr } = await s.from('pending_requests')
    .select('id, city, restaurant_name, dish_name, price_cad, confidence_score, notes, dish_category')
    .in('city', cityList)
    .eq('status', 'pending')
    .eq('request_type', 'restaurant')

  if (pendingErr || !pending) {
    console.error('Could not load pending requests:', pendingErr?.message)
    return
  }

  const toApprove: string[] = []
  const toSkip: typeof pending = []

  for (const p of pending) {
    const conf = Number(p.confidence_score ?? 0)
    const hasServingWarning = String(p.notes ?? '').includes('SERVING SIZE UNCONFIRMED')

    if (conf >= 0.65 && !hasServingWarning) {
      toApprove.push(p.id)
    } else {
      toSkip.push(p)
    }
  }

  console.log(`  Pending: ${pending.length}  Auto-approve: ${toApprove.length}  Needs review: ${toSkip.length}`)

  if (toSkip.length > 0) {
    console.log('\n  Proposals needing manual review (low confidence or serving size flag):')
    for (const p of toSkip) {
      const conf = Number(p.confidence_score ?? 0)
      const flag = String(p.notes ?? '').includes('SERVING SIZE UNCONFIRMED') ? '⚠️ serving' : `conf ${conf.toFixed(2)}`
      console.log(`    ${p.city.padEnd(14)} ${p.restaurant_name?.slice(0, 30).padEnd(30)} CA$${Number(p.price_cad).toFixed(2)} [${flag}]`)
    }
  }

  if (toApprove.length === 0) {
    console.log('\n  Nothing to auto-approve.')
    return
  }

  // Approve in batches: update pending_requests status, then insert into restaurants
  let approved = 0
  for (let i = 0; i < toApprove.length; i += 50) {
    const batch = toApprove.slice(i, i + 50)
    const { data: approved_rows, error: appErr } = await s.from('pending_requests')
      .update({ status: 'approved' })
      .in('id', batch)
      .select('city, country, restaurant_name, dish_name, dish_category, included_in_baseline, tier, local_price, local_currency, exchange_rate_used, price_cad, source, source_type, source_url, confidence_score, notes, date_accessed')

    if (appErr || !approved_rows) { console.error('Approve error:', appErr?.message); continue }

    const insertRows = approved_rows.map(r => ({
      city: r.city, country: r.country,
      restaurant_name: r.restaurant_name, dish_name: r.dish_name,
      dish_category: r.dish_category, included_in_baseline: r.included_in_baseline,
      tier: r.tier, local_price: r.local_price, local_currency: r.local_currency,
      exchange_rate_used: r.exchange_rate_used, price_cad: r.price_cad,
      source: r.source, source_type: r.source_type, source_url: r.source_url,
      confidence_score: r.confidence_score, notes: r.notes,
      date_accessed: r.date_accessed, approved: true, active: true,
    }))

    const { error: insErr } = await s.from('restaurants').insert(insertRows)
    if (insErr) { console.error('Insert error:', insErr.message); continue }

    approved += insertRows.length
    console.log(`  Approved and inserted ${approved}/${toApprove.length}`)
  }

  // Recalculate baselines for all cities that got new entries
  console.log('\n── Recalculating baselines ──')
  for (const city of [...approvedCities].sort()) {
    await recalcCity(city)
  }

  console.log('\n  Done.')
}

main().catch(err => { console.error(err); process.exit(1) })
