/**
 * deactivate-bad-entries.ts
 *
 * Deactivates restaurant entries that have CRITICAL data quality failures:
 *   - FABRICATED_NAME: restaurant name matches AI-generated geographic descriptor patterns
 *   - GENERIC_SOURCE_URL: source_url is a city/category browse page, not a specific restaurant
 *   - MISSING_SOURCE: included in baseline but has no source URL at all
 *
 * Does NOT deactivate entries with only PRICE_OUTLIER or SOURCE_QUALITY warnings —
 * those may be legitimate premium entries.
 *
 * Sets active=false (preserves the row). City stats are recalculated at the end.
 *
 * Run:
 *   export $(grep -v '^#' .env.local | xargs) && npx tsx scripts/deactivate-bad-entries.ts
 * Flags:
 *   --dry-run         Print what would be deactivated, do not write
 *   --city "Beijing"  Only process one city
 */

import { createClient } from '@supabase/supabase-js'

const s = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

const DRY_RUN   = process.argv.includes('--dry-run')
const CITY_FILTER = (() => {
  const i = process.argv.indexOf('--city'); return i >= 0 ? process.argv[i + 1] : null
})()

// ─── Copied from audit-data-quality.ts (same logic, same thresholds) ─────────

const FABRICATION_CRITICAL: RegExp[] = [
  /\b(student district|neighbourhood chinese|neighborhood chinese|area chinese|district chinese)\b/i,
  /^(representative|budget|mid-range|upscale)\s+(chinese|asian|thai|indian|korean|japanese)\s+(restaurant|stall|delivery|takeout)/i,
  /^[A-Za-z\s]+(road|blvd|blvd\.?|ave\.?|avenue|street|st\.?)\s+(chinese|stall|restaurant|hawker)$/i,
  /\b(area restaurant|lunch chinese|area chinese|cbp chinese|cbd lunch)\b/i,
]

function isFabricatedName(name: string): boolean {
  if (!name) return false
  for (const re of FABRICATION_CRITICAL) {
    if (re.test(name)) return true
  }
  // Generic name + no source URL is handled below
  return false
}

function isGenericSourceUrl(url: string | null): boolean {
  if (!url) return false
  if (/tripadvisor\.[a-z.]+\/Restaurants-g\d+/.test(url)) return true
  if (/dianping\.com\/[a-z]+(\/[a-z]+)?$/.test(url) && !url.includes('/shop/')) return true
  return false
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\n${'═'.repeat(60)}`)
  console.log(`  Deactivate bad entries${DRY_RUN ? ' [DRY RUN]' : ''}`)
  console.log(`${'═'.repeat(60)}\n`)

  let q = s.from('restaurants')
    .select('id, city, country, restaurant_name, dish_name, price_cad, source_url, included_in_baseline')
    .eq('active', true)
  if (CITY_FILTER) q = q.eq('city', CITY_FILTER)

  const { data, error } = await q
  if (error || !data) { console.error('DB error:', error?.message); process.exit(1) }

  console.log(`Loaded ${data.length} active entries\n`)

  type Row = { id: string; city: string; country: string; restaurant_name: string; dish_name: string; price_cad: number; source_url: string | null; included_in_baseline: boolean | null }
  const rows = data as Row[]

  const toDeactivate: Array<{ id: string; city: string; reason: string; restaurant_name: string; dish_name: string }> = []
  const cityCount: Record<string, number> = {}

  for (const row of rows) {
    const reasons: string[] = []

    if (isFabricatedName(row.restaurant_name)) {
      reasons.push('FABRICATED_NAME')
    }
    if (isGenericSourceUrl(row.source_url)) {
      reasons.push('GENERIC_SOURCE_URL')
    }
    if (!row.source_url && row.included_in_baseline) {
      // Generic name with no URL — also a fabrication signal
      const generic = /\b(neighbourhood|street stall|budget|mid-range|area restaurant|representative|student district|lunch spot)\b/i
      if (generic.test(row.restaurant_name)) {
        reasons.push('FABRICATED_NAME+NO_SOURCE')
      }
    }

    if (reasons.length > 0) {
      toDeactivate.push({ id: row.id, city: row.city, reason: reasons.join(', '), restaurant_name: row.restaurant_name, dish_name: row.dish_name })
      cityCount[row.city] = (cityCount[row.city] ?? 0) + 1
    }
  }

  // Print per-city breakdown
  for (const [city, count] of Object.entries(cityCount).sort()) {
    const entries = toDeactivate.filter(r => r.city === city)
    console.log(`  ${city}: ${count} to deactivate`)
    for (const e of entries) {
      console.log(`    ✗ [${e.reason}]`)
      console.log(`      ${e.restaurant_name.slice(0, 60)} — ${e.dish_name.slice(0, 35)}`)
    }
  }

  console.log(`\n  Total to deactivate: ${toDeactivate.length} / ${rows.length} entries`)

  if (DRY_RUN) {
    console.log('\n  [dry run] No changes made.')
    return
  }

  if (toDeactivate.length === 0) {
    console.log('\n  Nothing to deactivate.')
    return
  }

  // Deactivate in batches of 50
  console.log('\n── Deactivating ──')
  const ids = toDeactivate.map(r => r.id)
  let deactivated = 0
  for (let i = 0; i < ids.length; i += 50) {
    const batch = ids.slice(i, i + 50)
    const { error: upErr } = await s.from('restaurants').update({ active: false }).in('id', batch)
    if (upErr) { console.error(`  Batch error: ${upErr.message}`); continue }
    deactivated += batch.length
    process.stdout.write(`  Deactivated ${deactivated}/${ids.length}\r`)
  }
  console.log(`\n  ✓ Deactivated ${deactivated} entries`)

  // Recalculate city stats for affected cities
  const affectedCities = [...new Set(toDeactivate.map(r => r.city))]
  console.log(`\n── Recalculating ${affectedCities.length} cities ──`)

  for (const city of affectedCities) {
    const { data: remaining } = await s.from('restaurants')
      .select('price_cad, included_in_baseline, confidence_score, dish_category, tier')
      .eq('city', city)
      .eq('active', true)
      .eq('approved', true)

    if (!remaining || remaining.length === 0) {
      await s.from('cities').update({
        price_cad: null, baseline_median_cad: null, market_average_cad: null,
        market_min_cad: null, market_max_cad: null,
        market_entry_count: 0, baseline_entry_count: 0,
        data_quality_label: 'No baseline data',
        price_updated_at: new Date().toISOString(),
      }).eq('city', city)
      console.log(`  ${city}: no entries remaining — zeroed stats`)
      continue
    }

    const allPrices = remaining.map(r => Number(r.price_cad)).filter(p => p > 0).sort((a, b) => a - b)
    const blRows = remaining.filter(r => r.included_in_baseline)
    const blPrices = blRows.map(r => Number(r.price_cad)).filter(p => p > 0).sort((a, b) => a - b)

    if (blPrices.length === 0) {
      await s.from('cities').update({
        price_cad: null, baseline_median_cad: null,
        baseline_entry_count: 0, market_entry_count: allPrices.length,
        data_quality_label: 'No baseline data',
        price_updated_at: new Date().toISOString(),
      }).eq('city', city)
      console.log(`  ${city}: ${allPrices.length} market entries, 0 baseline — no price set`)
      continue
    }

    const mid = Math.floor(blPrices.length / 2)
    const blMedian = blPrices.length % 2 === 1 ? blPrices[mid] : (blPrices[mid - 1] + blPrices[mid]) / 2
    const mktAvg = allPrices.reduce((s, p) => s + p, 0) / allPrices.length
    const avgConf = blRows.reduce((s, r) => s + Number(r.confidence_score ?? 0), 0) / blRows.length

    function dqLabel(n: number) {
      if (n >= 15) return 'High confidence'
      if (n >= 10) return 'Strong'
      if (n >= 5)  return 'Moderate'
      if (n >= 3)  return 'Limited'
      return 'Preliminary'
    }

    await s.from('cities').update({
      price_cad:             Math.round(blMedian * 100) / 100,
      baseline_median_cad:   Math.round(blMedian * 100) / 100,
      market_average_cad:    Math.round(mktAvg * 100) / 100,
      market_min_cad:        allPrices[0],
      market_max_cad:        allPrices[allPrices.length - 1],
      market_entry_count:    allPrices.length,
      baseline_entry_count:  blPrices.length,
      confidence_score:      Math.round(avgConf * 100) / 100,
      data_quality_label:    dqLabel(allPrices.length),
      price_source:          `Baseline median from ${blPrices.length} verified entries`,
      price_updated_at:      new Date().toISOString(),
    }).eq('city', city)

    console.log(`  ${city}: CA$${blMedian.toFixed(2)} baseline (${blPrices.length} BL / ${allPrices.length} total) — ${dqLabel(allPrices.length)}`)
  }

  console.log('\n  ✓ Done. Run audit-data-quality.ts to verify the clean state.')
}

main().catch(err => { console.error(err); process.exit(1) })
