/**
 * Seed script: manually verified Vancouver fried rice prices.
 * Run with:  npx tsx scripts/seed-vancouver.ts
 *
 * Inserts directly to the restaurants table via the service role key,
 * then recalculates Vancouver's city stats.
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
  // ── Wo's Chinese Restaurant (woschineserestaurant.com) ──────────────────────
  {
    restaurant_name: "Wo's Chinese Restaurant",
    dish_name: 'Mixed Vegetable Fried Rice',
    dish_category: 'vegetable',
    price_cad: 19.50,
    tier: 'mid_tier',
    source_url: 'https://woschineserestaurant.com/menu/data/main-menu.html',
    source_type: 'official_menu',
    confidence_score: 0.92,
  },
  {
    restaurant_name: "Wo's Chinese Restaurant",
    dish_name: 'Dried Scallop with Egg White Fried Rice',
    dish_category: 'seafood',
    price_cad: 22.95,
    tier: 'mid_tier',
    source_url: 'https://woschineserestaurant.com/menu/data/main-menu.html',
    source_type: 'official_menu',
    confidence_score: 0.92,
  },

  // ── Phnom Penh Restaurant (phnom-penh.matsuba.ca) ───────────────────────────
  {
    restaurant_name: 'Phnom Penh Restaurant',
    dish_name: 'Trieu Chau Fried Rice',
    dish_category: 'basic',
    price_cad: 13.25,
    tier: 'low_tier',
    source_url: 'https://phnom-penh.matsuba.ca/',
    source_type: 'official_menu',
    confidence_score: 0.92,
    notes: 'Bib Gourmand-awarded Vietnamese/Cambodian restaurant, Chinatown',
  },
  {
    restaurant_name: 'Phnom Penh Restaurant',
    dish_name: 'Shrimp Fried Rice',
    dish_category: 'seafood',
    price_cad: 15.25,
    tier: 'low_tier',
    source_url: 'https://phnom-penh.matsuba.ca/',
    source_type: 'official_menu',
    confidence_score: 0.92,
  },

  // ── Chinatown BBQ (chinatownbbq.com) ────────────────────────────────────────
  {
    restaurant_name: 'Chinatown BBQ',
    dish_name: 'Vegetable Egg Fried Rice',
    dish_category: 'vegetable',
    price_cad: 13.00,
    tier: 'low_tier',
    source_url: 'https://chinatownbbq.com/new-menu/',
    source_type: 'official_menu',
    confidence_score: 0.92,
  },
  {
    restaurant_name: 'Chinatown BBQ',
    dish_name: 'BBQ Pork Fried Rice',
    dish_category: 'meat_based',
    price_cad: 14.50,
    tier: 'low_tier',
    source_url: 'https://chinatownbbq.com/new-menu/',
    source_type: 'official_menu',
    confidence_score: 0.92,
  },

  // ── Banana Leaf (bananaleaf-vancouver.com) ──────────────────────────────────
  {
    restaurant_name: 'Banana Leaf',
    dish_name: 'Nasi Goreng',
    dish_category: 'house_special',
    price_cad: 25.00,
    tier: 'high_end',
    source_url: 'https://www.bananaleaf-vancouver.com/broadway-menu',
    source_type: 'official_menu',
    confidence_score: 0.92,
    notes: 'Malaysian style fried rice with chili, tomato, soy sauce, beef, shrimp, onion, egg, green bean',
  },
  {
    restaurant_name: 'Banana Leaf',
    dish_name: 'Fried Rice GF',
    dish_category: 'house_special',
    price_cad: 28.00,
    tier: 'high_end',
    source_url: 'https://www.bananaleaf-vancouver.com/broadway-menu',
    source_type: 'official_menu',
    confidence_score: 0.92,
    notes: 'Fried rice sautéed with seafood, chicken, egg, green beans, tomato, onion, corn. Gluten-free.',
  },

  // ── Rice and Noodle (Robson St) ─────────────────────────────────────────────
  {
    restaurant_name: 'Rice and Noodle',
    dish_name: 'Pineapple Fried Rice',
    dish_category: 'house_special',
    price_cad: 15.50,
    tier: 'low_tier',
    source_url: 'https://www.ubereats.com/ca/store/rice-and-noodle-robson/xVdKnf7FS7izSCcvUqTEkQ',
    source_type: 'delivery_app',
    confidence_score: 0.78,
    notes: 'Fried rice, egg, carrot, green bean, onion, pineapple, red pepper, green onion',
  },

  // ── Kwong Chow Congee & Noodle House ────────────────────────────────────────
  {
    restaurant_name: 'Kwong Chow Congee & Noodle House',
    dish_name: 'Mixed Vegetable and Egg Fried Rice',
    dish_category: 'vegetable',
    price_cad: 19.60,
    tier: 'mid_tier',
    source_url: 'https://kwongchowcongee.com/309-mixed-vegetable-and-egg-fried-rice/',
    source_type: 'official_menu',
    confidence_score: 0.90,
  },

  // ── Momo Factory (Sino-Indian, Davie St) ────────────────────────────────────
  {
    restaurant_name: 'Momo Factory',
    dish_name: 'Szechuan Egg Fried Rice',
    dish_category: 'basic',
    price_cad: 15.99,
    tier: 'low_tier',
    source_url: 'https://momofactory.didevelop.com/location/vancouver/szechuan-egg-fried-rice/',
    source_type: 'official_menu',
    confidence_score: 0.88,
    notes: '1143 Davie St. Chinese-Indian fusion.',
  },

  // ── The Lunch Lady (Commercial Dr) — MICHELIN recommended ──────────────────
  {
    restaurant_name: 'The Lunch Lady',
    dish_name: 'Cơm Chiên Đặc Biệt – House Special Fried Rice',
    dish_category: 'house_special',
    price_cad: 24.00,
    tier: 'high_end',
    source_url: 'https://thelunchlady.com/dinner-vancouver',
    source_type: 'official_menu',
    confidence_score: 0.95,
    notes: 'MICHELIN-recommended. Cured pork belly, tiger prawns, lap cheong sausage, crispy rice.',
  },
  {
    restaurant_name: 'The Lunch Lady',
    dish_name: 'Cơm Chiên Cua – Crab Fried Rice',
    dish_category: 'seafood',
    price_cad: 34.00,
    tier: 'premium',
    source_url: 'https://thelunchlady.com/dinner-vancouver',
    source_type: 'official_menu',
    confidence_score: 0.95,
    notes: 'MICHELIN-recommended. Red crab, XO sauce, crispy rice, fish roe.',
  },
]

async function run() {
  // Delete any previously seeded rows for Vancouver so re-runs are idempotent
  const { error: deleteErr, count } = await supabase
    .from('restaurants')
    .delete({ count: 'exact' })
    .eq('city', 'Vancouver')
    .like('source', 'Manual seed – %')

  if (deleteErr) {
    console.error('Delete failed:', deleteErr.message)
    process.exit(1)
  }
  if (count && count > 0) {
    console.log(`Deleted ${count} existing seeded rows for Vancouver.`)
  }

  console.log(`Inserting ${ENTRIES.length} entries for Vancouver...\n`)

  const rows = ENTRIES.map((e) => ({
    city: 'Vancouver',
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

  // Recalculate Vancouver stats
  console.log('\nRecalculating Vancouver city stats...')
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
        confidence_score: 0.90,
      })
      .eq('city', 'Vancouver')

    if (cityErr) {
      console.error('City update failed:', cityErr.message)
    } else {
      console.log(`✓ Vancouver updated`)
      console.log(`  Baseline median: CA$${median.toFixed(2)} (from ${baselineRows.length} entries)`)
      console.log(`  Market avg (5% trimmed): CA$${marketAvg.toFixed(2)} (${trimK} removed each end, ${allPrices.length - trimK * 2} entries used)`)
      console.log(`  Market range: CA$${allPrices[0]} – CA$${allPrices[allPrices.length - 1]}`)
    }
  }

  console.log('\nDone.')
}

run()
