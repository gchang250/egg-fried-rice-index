/**
 * Seed script: manually verified Toronto fried rice prices.
 * Run with:  npx tsx scripts/seed-toronto.ts
 *
 * Inserts directly to the restaurants table via the service role key,
 * then recalculates Toronto's city stats.
 */

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

// CAD → CAD rate is 1; all prices already in CAD
const EXCHANGE_RATE = 1
const NOW = new Date().toISOString()

type Entry = {
  restaurant_name: string
  dish_name: string
  dish_category: 'basic' | 'vegetable' | 'meat_based' | 'seafood' | 'house_special' | 'premium'
  price_cad: number
  tier: 'low_tier' | 'mid_tier' | 'high_end' | 'premium'
  source_url: string
  source_type: string
  confidence_score: number
  notes?: string
}

/**
 * Trimmed mean: excludes the bottom 5% and top 5% of prices (by count) before
 * averaging, to reduce the influence of outliers on the market average.
 * Uses Math.round so that small datasets (n < 20) still trim at least 1 entry
 * from each end, while very small datasets (n ≤ 9) trim 0 and fall back to a
 * straight mean.
 */
function trimmedMean(sortedPrices: number[], trimFraction = 0.05): number {
  const n = sortedPrices.length
  const k = Math.round(n * trimFraction)
  const trimmed = k > 0 ? sortedPrices.slice(k, n - k) : sortedPrices
  return trimmed.reduce((s, p) => s + p, 0) / trimmed.length
}

const ENTRIES: Entry[] = [
  // ── Mr. Fried Rice (160 McCaul St) ─────────────────────────────────────────
  {
    restaurant_name: 'Mr. Fried Rice',
    dish_name: 'Egg Fried Rice',
    dish_category: 'basic',
    price_cad: 7.99,
    tier: 'low_tier',
    source_url: 'https://www.ubereats.com/ca/store/mr-fried-rice/UxZdOoB6Th2FezaR6uTmpw',
    source_type: 'delivery_app',
    confidence_score: 0.82,
    notes: '160 McCaul St. Specialty fried rice restaurant.',
  },
  {
    restaurant_name: 'Mr. Fried Rice',
    dish_name: 'Curry Seafood Fried Rice',
    dish_category: 'seafood',
    price_cad: 13.99,
    tier: 'low_tier',
    source_url: 'https://www.ubereats.com/ca/store/mr-fried-rice/UxZdOoB6Th2FezaR6uTmpw',
    source_type: 'delivery_app',
    confidence_score: 0.82,
    notes: '160 McCaul St.',
  },

  // ── 19 Eatery Toronto (19c Finch Ave W, North York) ─────────────────────────
  {
    restaurant_name: '19 Eatery Toronto',
    dish_name: 'Egg Fried Rice 蛋炒饭',
    dish_category: 'basic',
    price_cad: 14.00,
    tier: 'low_tier',
    source_url: 'https://19eaterytoronto.com/egg-fried-rice/',
    source_type: 'official_menu',
    confidence_score: 0.92,
    notes: '19c Finch Ave W, North York.',
  },

  // ── Dragon Delight Chinese Restaurant (825 St Clair Ave W) ──────────────────
  {
    restaurant_name: 'Dragon Delight Chinese Restaurant',
    dish_name: 'Young Chow Fried Rice',
    dish_category: 'house_special',
    price_cad: 14.99,
    tier: 'low_tier',
    source_url: 'https://dragon-delight.com/49-young-chow-fried-rice/',
    source_type: 'official_menu',
    confidence_score: 0.92,
    notes: '825 St Clair Ave W. Shrimp, chicken, and barbecue pork.',
  },

  // ── Little Sister (2031 Yonge St) ───────────────────────────────────────────
  {
    restaurant_name: 'Little Sister',
    dish_name: 'Nasi Goreng',
    dish_category: 'house_special',
    price_cad: 15.00,
    tier: 'low_tier',
    source_url: 'https://www.ubereats.com/ca/store/little-sister/VL8n_TdgRQWBhjLVXafbhw',
    source_type: 'delivery_app',
    confidence_score: 0.82,
    notes: '2031 Yonge St. Indonesian fried rice, contains egg. No modifications.',
  },

  // ── Mehfill Indian Cuisine (2120 Queen St E) ────────────────────────────────
  {
    restaurant_name: 'Mehfill Indian Cuisine',
    dish_name: 'Chicken Fried Rice',
    dish_category: 'meat_based',
    price_cad: 16.99,
    tier: 'mid_tier',
    source_url: 'https://mehfillindian.com/location/toronto/chicken-fried-rice/',
    source_type: 'official_menu',
    confidence_score: 0.90,
    notes: '2120 Queen St E.',
  },

  // ── Swatow Restaurant (309 Spadina Ave, Chinatown) ──────────────────────────
  {
    restaurant_name: 'Swatow Restaurant',
    dish_name: 'Mixed Vegetable Fried Rice',
    dish_category: 'vegetable',
    price_cad: 18.99,
    tier: 'mid_tier',
    source_url: 'https://www.swatowrestauranttoronto.com/fried-rice',
    source_type: 'official_menu',
    confidence_score: 0.93,
    notes: '309 Spadina Ave, Chinatown. Over 40 years of Cantonese cooking.',
  },
  {
    restaurant_name: 'Swatow Restaurant',
    dish_name: 'Seafood Fried Rice',
    dish_category: 'seafood',
    price_cad: 22.99,
    tier: 'mid_tier',
    source_url: 'https://www.swatowrestauranttoronto.com/fried-rice',
    source_type: 'official_menu',
    confidence_score: 0.93,
    notes: '309 Spadina Ave, Chinatown.',
  },

  // ── Yueh Tung Restaurant (126 Elizabeth St) — Toronto's Original Hakka ──────
  {
    restaurant_name: 'Yueh Tung Restaurant',
    dish_name: 'Egg Fried Rice',
    dish_category: 'basic',
    price_cad: 19.50,
    tier: 'mid_tier',
    source_url: 'https://yuehtungrestaurant.com/',
    source_type: 'official_menu',
    confidence_score: 0.85,
    notes: '126 Elizabeth St, first Chinatown. Hakka Chinese cuisine (Guangdong via Calcutta).',
  },
  {
    restaurant_name: 'Yueh Tung Restaurant',
    dish_name: 'SPECIAL Chili Lobster over Egg Fried Rice',
    dish_category: 'premium',
    price_cad: 48.00,
    tier: 'premium',
    source_url: 'https://yuehtungrestaurant.com/',
    source_type: 'official_menu',
    confidence_score: 0.85,
    notes: '126 Elizabeth St. Seasonal special.',
  },

  // ── Sisaket Thai Kitchen (1466 Kingston Rd, Scarborough) ────────────────────
  {
    restaurant_name: 'Sisaket Thai Kitchen',
    dish_name: 'Sisaket Country-Styled Fried Rice',
    dish_category: 'house_special',
    price_cad: 20.95,
    tier: 'mid_tier',
    source_url: 'https://sisaketthaikitchen.ca/',
    source_type: 'official_menu',
    confidence_score: 0.92,
    notes: '1466 Kingston Rd, Scarborough. Includes chicken or vegetable/tofu; +$3 for beef/shrimp.',
  },
  {
    restaurant_name: 'Sisaket Thai Kitchen',
    dish_name: 'Pineapple Fried Rice',
    dish_category: 'house_special',
    price_cad: 21.95,
    tier: 'mid_tier',
    source_url: 'https://sisaketthaikitchen.ca/',
    source_type: 'official_menu',
    confidence_score: 0.92,
    notes: '1466 Kingston Rd, Scarborough.',
  },

  // ── Chiang Mai Thai Kitchen & Bar (171 E Liberty St) ────────────────────────
  {
    restaurant_name: 'Chiang Mai Thai Kitchen & Bar',
    dish_name: 'Thai Basil Fried Rice',
    dish_category: 'house_special',
    price_cad: 22.00,
    tier: 'mid_tier',
    source_url: 'https://www.ubereats.com/ca/store/chiang-mai-kitchen-and-bar/c9j0eBbnTzSZQ7_wAJrnZA',
    source_type: 'delivery_app',
    confidence_score: 0.78,
    notes: '171 E Liberty St. Multi-location Thai chain.',
  },

  // ── PAI Northern Thai Kitchen (Downtown) ────────────────────────────────────
  {
    restaurant_name: 'PAI Northern Thai Kitchen',
    dish_name: 'Khao Pad Baan Nok Thai Fried Rice',
    dish_category: 'house_special',
    price_cad: 22.25,
    tier: 'mid_tier',
    source_url: 'https://paitoronto.com/menu/pai-menu',
    source_type: 'official_menu',
    confidence_score: 0.93,
    notes: 'Thai garlic, Chinese broccoli, tomato, egg, choice of protein. Well-regarded downtown Thai.',
  },

  // ── Dim Sum King Seafood Restaurant (421 Dundas St W) ───────────────────────
  {
    restaurant_name: 'Dim Sum King Seafood Restaurant',
    dish_name: 'Yang Chow Fried Rice',
    dish_category: 'house_special',
    price_cad: 24.95,
    tier: 'mid_tier',
    source_url: 'https://dimsumkingtoronto.com/106-yang-chow-fried-rice/',
    source_type: 'official_menu',
    confidence_score: 0.92,
    notes: '421 Dundas St W.',
  },
]

async function run() {
  // Delete any previously seeded rows for Toronto so re-runs are idempotent
  const { error: deleteErr, count } = await supabase
    .from('restaurants')
    .delete({ count: 'exact' })
    .eq('city', 'Toronto')
    .like('source', 'Manual seed – %')

  if (deleteErr) {
    console.error('Delete failed:', deleteErr.message)
    process.exit(1)
  }
  if (count && count > 0) {
    console.log(`Deleted ${count} existing seeded rows for Toronto.`)
  }

  console.log(`Inserting ${ENTRIES.length} entries for Toronto...\n`)

  const rows = ENTRIES.map((e) => ({
    city: 'Toronto',
    country: 'Canada',
    restaurant_name: e.restaurant_name,
    dish_name: e.dish_name,
    dish_category: e.dish_category,
    included_in_baseline: e.dish_category === 'basic' || e.dish_category === 'vegetable',
    tier: e.tier,
    local_price: e.price_cad,
    local_currency: 'CAD',
    exchange_rate_used: EXCHANGE_RATE,
    price_cad: e.price_cad,
    source: `Manual seed – ${e.source_url}`,
    source_type: e.source_type,
    source_url: e.source_url,
    confidence_score: e.confidence_score,
    approved: true,
    active: true,
    date_accessed: NOW,
    notes: e.notes ?? null,
  }))

  const { error } = await supabase.from('restaurants').insert(rows)

  if (error) {
    console.error('Insert failed:', error.message)
    process.exit(1)
  }

  console.log(`✓ Inserted ${rows.length} rows`)

  // Print summary
  for (const e of ENTRIES) {
    const baseline = e.dish_category === 'basic' || e.dish_category === 'vegetable' ? ' [baseline]' : ''
    console.log(`  ${e.restaurant_name} — ${e.dish_name}: CA$${e.price_cad.toFixed(2)}${baseline}`)
  }

  // Recalculate Toronto stats
  console.log('\nRecalculating Toronto city stats...')
  const baselineRows = rows.filter((r) => r.included_in_baseline)
  const baselinePrices = baselineRows.map((r) => r.price_cad).sort((a, b) => a - b)
  const allPrices = rows.map((r) => r.price_cad).sort((a, b) => a - b)

  if (baselinePrices.length > 0) {
    const mid = Math.floor(baselinePrices.length / 2)
    const median = baselinePrices.length % 2 === 1
      ? baselinePrices[mid]
      : (baselinePrices[mid - 1] + baselinePrices[mid]) / 2
    const marketAvg = trimmedMean(allPrices)
    const trimK = Math.round(allPrices.length * 0.05)

    const { error: cityErr } = await supabase
      .from('cities')
      .update({
        price_cad: Number(median.toFixed(2)),
        baseline_median_cad: Number(median.toFixed(2)),
        market_average_cad: Number(marketAvg.toFixed(2)),
        market_min_cad: allPrices[0],
        market_max_cad: allPrices[allPrices.length - 1],
        market_entry_count: rows.length,
        baseline_entry_count: baselineRows.length,
        data_quality_label: baselineRows.length >= 5 ? 'Moderate' : 'Preliminary',
        price_source: `Baseline median from ${baselineRows.length} manually verified entries`,
        price_updated_at: NOW,
        confidence_score: 0.88,
      })
      .eq('city', 'Toronto')

    if (cityErr) {
      console.error('City update failed:', cityErr.message)
    } else {
      console.log(`✓ Toronto updated`)
      console.log(`  Baseline median: CA$${median.toFixed(2)} (from ${baselineRows.length} entries)`)
      console.log(`  Market avg (5% trimmed): CA$${marketAvg.toFixed(2)} (${trimK} removed each end, ${allPrices.length - trimK * 2} entries used)`)
      console.log(`  Market range: CA$${allPrices[0]} – CA$${allPrices[allPrices.length - 1]}`)
    }
  }

  console.log('\nDone.')
}

run()
