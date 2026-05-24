/**
 * Seed script: manually verified fried rice prices for remaining cities.
 * Run with:  npx tsx scripts/seed-remaining-cities.ts
 *
 * Cities: Montreal, Calgary, Edmonton, New York, Los Angeles,
 *         Chicago, Houston, Phoenix
 *
 * Note: Philadelphia has no verified prices yet — skipped.
 * Note: Montreal & Calgary have no basic/vegetable entries yet — city
 *       baseline price stays null until more data is added.
 */

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

const NOW = new Date().toISOString()
const USD_TO_CAD = 1.39   // approximate rate May 2026

function usd(price: number): number {
  return Math.round(price * USD_TO_CAD * 100) / 100
}

function trimmedMean(sortedPrices: number[], trimFraction = 0.05): number {
  const n = sortedPrices.length
  const k = Math.round(n * trimFraction)
  const trimmed = k > 0 ? sortedPrices.slice(k, n - k) : sortedPrices
  return trimmed.reduce((s, p) => s + p, 0) / trimmed.length
}

type Entry = {
  city: string
  country: string
  restaurant_name: string
  dish_name: string
  dish_category: 'basic' | 'vegetable' | 'meat_based' | 'seafood' | 'house_special' | 'premium'
  price_cad: number
  local_price?: number
  local_currency?: string
  exchange_rate_used?: number
  tier: 'low_tier' | 'mid_tier' | 'high_end' | 'premium'
  source_url: string
  source_type: string
  confidence_score: number
  notes?: string
}

const ENTRIES: Entry[] = [

  // ══════════════════════════════════════════════════════════════════════════
  // MONTREAL, QC, CANADA  (all CAD)
  // ══════════════════════════════════════════════════════════════════════════

  // ── Keung Kee (Chinatown) ─────────────────────────────────────────────────
  {
    city: 'Montreal', country: 'Canada',
    restaurant_name: 'Keung Kee',
    dish_name: 'Fried Rice with Chicken and Salted Fish',
    dish_category: 'house_special',
    price_cad: 19.75,
    tier: 'mid_tier',
    source_url: 'https://www.ubereats.com/ca/store/keung-kee/cxpRWTUGTNyGbIg0O1qu1Q',
    source_type: 'delivery_app',
    confidence_score: 0.82,
    notes: '70 Rue de la Gauchetière O, Chinatown.',
  },

  // ── Dynastie ─────────────────────────────────────────────────────────────
  {
    city: 'Montreal', country: 'Canada',
    restaurant_name: 'Dynastie',
    dish_name: 'Chicken Fried Rice 鸡肉炒饭',
    dish_category: 'meat_based',
    price_cad: 19.50,
    tier: 'mid_tier',
    source_url: 'https://www.ubereats.com/ca/store/dynastie/uU7LzmN4TPO4_gIqV0FJ0g',
    source_type: 'delivery_app',
    confidence_score: 0.82,
    notes: '1008 Rue Clark #107.',
  },
  {
    city: 'Montreal', country: 'Canada',
    restaurant_name: 'Dynastie',
    dish_name: 'Salted Fish and Minced Chicken Fried Rice 咸鱼鸡肉碎炒饭',
    dish_category: 'house_special',
    price_cad: 21.78,
    tier: 'mid_tier',
    source_url: 'https://www.ubereats.com/ca/store/dynastie/uU7LzmN4TPO4_gIqV0FJ0g',
    source_type: 'delivery_app',
    confidence_score: 0.82,
    notes: '1008 Rue Clark #107.',
  },

  // ── So Poong (Korean) ─────────────────────────────────────────────────────
  {
    city: 'Montreal', country: 'Canada',
    restaurant_name: 'So Poong',
    dish_name: 'Kimchi Fried Rice',
    dish_category: 'house_special',
    price_cad: 21.99,
    tier: 'mid_tier',
    source_url: 'https://www.ubereats.com/ca/store/so-poong/jz-siEENSIuK-AVSARbn3Q',
    source_type: 'delivery_app',
    confidence_score: 0.82,
    notes: '5385 Chemin Queen-Mary. Korean BBQ restaurant.',
  },
  {
    city: 'Montreal', country: 'Canada',
    restaurant_name: 'So Poong',
    dish_name: 'Beef Fried Rice',
    dish_category: 'meat_based',
    price_cad: 22.99,
    tier: 'mid_tier',
    source_url: 'https://www.ubereats.com/ca/store/so-poong/jz-siEENSIuK-AVSARbn3Q',
    source_type: 'delivery_app',
    confidence_score: 0.82,
    notes: '5385 Chemin Queen-Mary.',
  },

  // ══════════════════════════════════════════════════════════════════════════
  // CALGARY, AB, CANADA  (all CAD)
  // ══════════════════════════════════════════════════════════════════════════

  // ── Don's Restaurant ──────────────────────────────────────────────────────
  {
    city: 'Calgary', country: 'Canada',
    restaurant_name: "Don's Restaurant",
    dish_name: 'Chicken Fried Rice',
    dish_category: 'meat_based',
    price_cad: 12.65,
    tier: 'low_tier',
    source_url: 'https://donscalgary.com/72-chicken-fried-rice/',
    source_type: 'official_menu',
    confidence_score: 0.92,
    notes: '4700 26 Ave SW, Calgary.',
  },

  // ── Ho Won Restaurant ─────────────────────────────────────────────────────
  {
    city: 'Calgary', country: 'Canada',
    restaurant_name: 'Ho Won Restaurant',
    dish_name: 'Chicken Fried Rice',
    dish_category: 'meat_based',
    price_cad: 15.34,
    tier: 'mid_tier',
    source_url: 'https://howoncalgary.com/151-chicken-fried-rice/',
    source_type: 'official_menu',
    confidence_score: 0.92,
    notes: '115 2 Ave SE #2, Chinatown Calgary.',
  },
  {
    city: 'Calgary', country: 'Canada',
    restaurant_name: 'Ho Won Restaurant',
    dish_name: 'Special Fried Rice',
    dish_category: 'house_special',
    price_cad: 15.34,
    tier: 'mid_tier',
    source_url: 'https://howoncalgary.com/151-chicken-fried-rice/',
    source_type: 'official_menu',
    confidence_score: 0.92,
    notes: '115 2 Ave SE #2, Chinatown Calgary.',
  },

  // ══════════════════════════════════════════════════════════════════════════
  // EDMONTON, AB, CANADA  (all CAD)
  // ══════════════════════════════════════════════════════════════════════════

  // ── Yummy Kitchen ─────────────────────────────────────────────────────────
  {
    city: 'Edmonton', country: 'Canada',
    restaurant_name: 'Yummy Kitchen',
    dish_name: 'Egg Fried Rice',
    dish_category: 'basic',
    price_cad: 14.00,
    tier: 'low_tier',
    source_url: 'https://order.yummykitchenedmonton.com/order/main-menu/fried-rice',
    source_type: 'official_menu',
    confidence_score: 0.92,
    notes: '20035 Lessard Rd NW, Edmonton.',
  },
  {
    city: 'Edmonton', country: 'Canada',
    restaurant_name: 'Yummy Kitchen',
    dish_name: 'Seafood Fried Rice',
    dish_category: 'seafood',
    price_cad: 19.50,
    tier: 'mid_tier',
    source_url: 'https://order.yummykitchenedmonton.com/order/main-menu/fried-rice',
    source_type: 'official_menu',
    confidence_score: 0.92,
    notes: '20035 Lessard Rd NW, Edmonton.',
  },

  // ── Szechuan Sweet Mango ──────────────────────────────────────────────────
  {
    city: 'Edmonton', country: 'Canada',
    restaurant_name: 'Szechuan Sweet Mango',
    dish_name: 'Stir Fried Rice with Chicken & Mixed Vegetable',
    dish_category: 'meat_based',
    price_cad: 14.95,
    tier: 'low_tier',
    source_url: 'https://order.szechuanstirfryab.com/order/vietnamesethai-menu/stir-fried-noodles',
    source_type: 'official_menu',
    confidence_score: 0.90,
    notes: '9120 82 Ave NW, Edmonton. Szechuan/Vietnamese-Thai fusion.',
  },
  {
    city: 'Edmonton', country: 'Canada',
    restaurant_name: 'Szechuan Sweet Mango',
    dish_name: 'Thai Seafood Stir Fried Rice',
    dish_category: 'seafood',
    price_cad: 17.95,
    tier: 'mid_tier',
    source_url: 'https://order.szechuanstirfryab.com/order/vietnamesethai-menu/stir-fried-noodles',
    source_type: 'official_menu',
    confidence_score: 0.90,
    notes: '9120 82 Ave NW, Edmonton. Prawns, squid, scallops; choice of sauce.',
  },

  // ── Rice Paper Edmonton ───────────────────────────────────────────────────
  {
    city: 'Edmonton', country: 'Canada',
    restaurant_name: 'Rice Paper Edmonton',
    dish_name: "Chef's Special Fried Rice",
    dish_category: 'house_special',
    price_cad: 17.50,
    tier: 'mid_tier',
    source_url: 'https://ricepaperedmonton.ca/',
    source_type: 'official_menu',
    confidence_score: 0.90,
    notes: 'West Edmonton. Shrimp, BBQ Pork, Eggs & Peas.',
  },
  {
    city: 'Edmonton', country: 'Canada',
    restaurant_name: 'Rice Paper Edmonton',
    dish_name: 'Beef Fried Rice',
    dish_category: 'meat_based',
    price_cad: 16.50,
    tier: 'mid_tier',
    source_url: 'https://ricepaperedmonton.ca/',
    source_type: 'official_menu',
    confidence_score: 0.90,
    notes: 'West Edmonton.',
  },

  // ══════════════════════════════════════════════════════════════════════════
  // NEW YORK, NY, USA  (USD × 1.39)
  // ══════════════════════════════════════════════════════════════════════════

  // ── Food King (10th Ave, Manhattan) ───────────────────────────────────────
  {
    city: 'New York', country: 'United States',
    restaurant_name: 'Food King',
    dish_name: 'Vegetable Fried Rice',
    dish_category: 'vegetable',
    price_cad: usd(9.50),       // large
    local_price: 9.50,
    local_currency: 'USD',
    exchange_rate_used: USD_TO_CAD,
    tier: 'low_tier',
    source_url: 'https://www.foodkingnyc.com/order/main-menu/fried-rice',
    source_type: 'official_menu',
    confidence_score: 0.90,
    notes: '10th Ave, Manhattan.',
  },
  {
    city: 'New York', country: 'United States',
    restaurant_name: 'Food King',
    dish_name: 'House Special Fried Rice',
    dish_category: 'house_special',
    price_cad: usd(11.50),      // large
    local_price: 11.50,
    local_currency: 'USD',
    exchange_rate_used: USD_TO_CAD,
    tier: 'mid_tier',
    source_url: 'https://www.foodkingnyc.com/order/main-menu/fried-rice',
    source_type: 'official_menu',
    confidence_score: 0.90,
    notes: '10th Ave, Manhattan.',
  },

  // ══════════════════════════════════════════════════════════════════════════
  // LOS ANGELES, CA, USA  (USD × 1.39)
  // ══════════════════════════════════════════════════════════════════════════

  // ── Yang Chow (Chinatown) ─────────────────────────────────────────────────
  {
    city: 'Los Angeles', country: 'United States',
    restaurant_name: 'Yang Chow',
    dish_name: 'Vegetable Fried Rice 素菜炒饭',
    dish_category: 'vegetable',
    price_cad: usd(16.25),
    local_price: 16.25,
    local_currency: 'USD',
    exchange_rate_used: USD_TO_CAD,
    tier: 'mid_tier',
    source_url: 'https://yangchow.com/menu/15898409',
    source_type: 'official_menu',
    confidence_score: 0.92,
    notes: '819 N Broadway, Chinatown LA. Established 1977.',
  },
  {
    city: 'Los Angeles', country: 'United States',
    restaurant_name: 'Yang Chow',
    dish_name: 'Yang Chow Fried Rice 扬州炒饭',
    dish_category: 'house_special',
    price_cad: usd(17.25),
    local_price: 17.25,
    local_currency: 'USD',
    exchange_rate_used: USD_TO_CAD,
    tier: 'mid_tier',
    source_url: 'https://yangchow.com/menu/15898409',
    source_type: 'official_menu',
    confidence_score: 0.92,
    notes: '819 N Broadway, Chinatown LA. Pork, shrimp, and chicken.',
  },

  // ══════════════════════════════════════════════════════════════════════════
  // CHICAGO, IL, USA  (USD × 1.39)
  // ══════════════════════════════════════════════════════════════════════════

  // ── Tony's Chinese & American ─────────────────────────────────────────────
  {
    city: 'Chicago', country: 'United States',
    restaurant_name: "Tony's Chinese & American",
    dish_name: 'Egg Fried Rice (Small)',
    dish_category: 'basic',
    price_cad: usd(5.41),
    local_price: 5.41,
    local_currency: 'USD',
    exchange_rate_used: USD_TO_CAD,
    tier: 'low_tier',
    source_url: 'https://www.tonyschinesechicago.com/order/main-menu/famous-fried-rice',
    source_type: 'official_menu',
    confidence_score: 0.92,
    notes: '6347 W Grand Ave, Chicago.',
  },
  {
    city: 'Chicago', country: 'United States',
    restaurant_name: "Tony's Chinese & American",
    dish_name: "Tony's Special Fried Rice (XLarge)",
    dish_category: 'house_special',
    price_cad: usd(20.35),
    local_price: 20.35,
    local_currency: 'USD',
    exchange_rate_used: USD_TO_CAD,
    tier: 'high_end',
    source_url: 'https://www.tonyschinesechicago.com/order/main-menu/famous-fried-rice',
    source_type: 'official_menu',
    confidence_score: 0.92,
    notes: '6347 W Grand Ave, Chicago.',
  },

  // ── Big Bowl ─────────────────────────────────────────────────────────────
  {
    city: 'Chicago', country: 'United States',
    restaurant_name: 'Big Bowl',
    dish_name: 'Teriyaki Chicken Fried Rice',
    dish_category: 'meat_based',
    price_cad: usd(19.95),
    local_price: 19.95,
    local_currency: 'USD',
    exchange_rate_used: USD_TO_CAD,
    tier: 'high_end',
    source_url: 'https://www.bigbowl.com/chicago/',
    source_type: 'official_menu',
    confidence_score: 0.92,
    notes: '159½ W Erie St, Chicago. Pan-Asian chain restaurant.',
  },
  {
    city: 'Chicago', country: 'United States',
    restaurant_name: 'Big Bowl',
    dish_name: 'Teriyaki Shrimp Fried Rice',
    dish_category: 'seafood',
    price_cad: usd(21.95),
    local_price: 21.95,
    local_currency: 'USD',
    exchange_rate_used: USD_TO_CAD,
    tier: 'high_end',
    source_url: 'https://www.bigbowl.com/chicago/',
    source_type: 'official_menu',
    confidence_score: 0.92,
    notes: '159½ W Erie St, Chicago.',
  },

  // ══════════════════════════════════════════════════════════════════════════
  // HOUSTON, TX, USA  (USD × 1.39)
  // ══════════════════════════════════════════════════════════════════════════

  // ── China Kitchen ─────────────────────────────────────────────────────────
  {
    city: 'Houston', country: 'United States',
    restaurant_name: 'China Kitchen',
    dish_name: 'Vegetable Fried Rice (Large)',
    dish_category: 'vegetable',
    price_cad: usd(8.45),
    local_price: 8.45,
    local_currency: 'USD',
    exchange_rate_used: USD_TO_CAD,
    tier: 'low_tier',
    source_url: 'https://www.chinakitchenhoustontx.com/order/main/fried-rice',
    source_type: 'official_menu',
    confidence_score: 0.90,
    notes: '12100 Veterans Memorial Dr J, Houston.',
  },
  {
    city: 'Houston', country: 'United States',
    restaurant_name: 'China Kitchen',
    dish_name: 'House Special Fried Rice (Large)',
    dish_category: 'house_special',
    price_cad: usd(9.95),
    local_price: 9.95,
    local_currency: 'USD',
    exchange_rate_used: USD_TO_CAD,
    tier: 'low_tier',
    source_url: 'https://www.chinakitchenhoustontx.com/order/main/fried-rice',
    source_type: 'official_menu',
    confidence_score: 0.90,
    notes: '12100 Veterans Memorial Dr J, Houston.',
  },

  // ── Sinh Sinh (Bellaire Chinatown) ────────────────────────────────────────
  {
    city: 'Houston', country: 'United States',
    restaurant_name: 'Sinh Sinh Restaurant',
    dish_name: 'BBQ Pork Fried Rice',
    dish_category: 'meat_based',
    price_cad: usd(7.45),
    local_price: 7.45,
    local_currency: 'USD',
    exchange_rate_used: USD_TO_CAD,
    tier: 'low_tier',
    source_url: 'https://www.allmenus.com/tx/houston/59638-sinh-sinh/menu/',
    source_type: 'third_party_menu',
    confidence_score: 0.78,
    notes: '9788 Bellaire Blvd, Bellaire Chinatown. Long-standing Vietnamese-Chinese institution.',
  },
  {
    city: 'Houston', country: 'United States',
    restaurant_name: 'Sinh Sinh Restaurant',
    dish_name: 'Deluxe Seafood Fried Rice',
    dish_category: 'seafood',
    price_cad: usd(12.95),
    local_price: 12.95,
    local_currency: 'USD',
    exchange_rate_used: USD_TO_CAD,
    tier: 'mid_tier',
    source_url: 'https://www.allmenus.com/tx/houston/59638-sinh-sinh/menu/',
    source_type: 'third_party_menu',
    confidence_score: 0.78,
    notes: '9788 Bellaire Blvd, Bellaire Chinatown.',
  },

  // ══════════════════════════════════════════════════════════════════════════
  // PHOENIX, AZ, USA  (USD × 1.39)
  // ══════════════════════════════════════════════════════════════════════════

  // ── Yan's Chinese Food ────────────────────────────────────────────────────
  {
    city: 'Phoenix', country: 'United States',
    restaurant_name: "Yan's Chinese Food",
    dish_name: 'Egg Fried Rice',
    dish_category: 'basic',
    price_cad: usd(12.00),
    local_price: 12.00,
    local_currency: 'USD',
    exchange_rate_used: USD_TO_CAD,
    tier: 'mid_tier',
    source_url: 'https://www.yansphoenix.com/order/main-menu/fried-rice',
    source_type: 'official_menu',
    confidence_score: 0.90,
    notes: '9140 W Thomas Rd #B103, Phoenix.',
  },
  {
    city: 'Phoenix', country: 'United States',
    restaurant_name: "Yan's Chinese Food",
    dish_name: 'Seafood Fried Rice',
    dish_category: 'seafood',
    price_cad: usd(17.50),
    local_price: 17.50,
    local_currency: 'USD',
    exchange_rate_used: USD_TO_CAD,
    tier: 'mid_tier',
    source_url: 'https://www.yansphoenix.com/order/main-menu/fried-rice',
    source_type: 'official_menu',
    confidence_score: 0.90,
    notes: '9140 W Thomas Rd #B103, Phoenix.',
  },

  // ── The Wild Thaiger ──────────────────────────────────────────────────────
  {
    city: 'Phoenix', country: 'United States',
    restaurant_name: 'The Wild Thaiger',
    dish_name: 'Fire Wok-ker (Thai Hot Basil Fried Rice)',
    dish_category: 'house_special',
    price_cad: usd(12.95),
    local_price: 12.95,
    local_currency: 'USD',
    exchange_rate_used: USD_TO_CAD,
    tier: 'low_tier',
    source_url: 'https://www.wildthaiger.com/dinner-menu',
    source_type: 'official_menu',
    confidence_score: 0.90,
    notes: '2631 N. Central Ave, Phoenix. Thai hot basil fried rice, string beans, mushrooms, carrots.',
  },
  {
    city: 'Phoenix', country: 'United States',
    restaurant_name: 'The Wild Thaiger',
    dish_name: 'Tropical Fried Rice',
    dish_category: 'house_special',
    price_cad: usd(12.95),
    local_price: 12.95,
    local_currency: 'USD',
    exchange_rate_used: USD_TO_CAD,
    tier: 'low_tier',
    source_url: 'https://www.wildthaiger.com/dinner-menu',
    source_type: 'official_menu',
    confidence_score: 0.90,
    notes: '2631 N. Central Ave, Phoenix. Jasmine rice, egg, snow peas, onion, carrots, pineapple.',
  },
]

// ── City config ────────────────────────────────────────────────────────────
const CITY_COUNTRY: Record<string, string> = {
  Montreal: 'Canada',
  Calgary: 'Canada',
  Edmonton: 'Canada',
  'New York': 'United States',
  'Los Angeles': 'United States',
  Chicago: 'United States',
  Houston: 'United States',
  Phoenix: 'United States',
}

async function seedCity(city: string, cityEntries: Entry[]) {
  console.log(`\n─── ${city} (${cityEntries.length} entries) ───`)

  // Delete existing seeded rows for this city (idempotent)
  const { count: deleted } = await supabase
    .from('restaurants')
    .delete({ count: 'exact' })
    .eq('city', city)
    .like('source', 'Manual seed – %')

  if (deleted && deleted > 0) console.log(`  Deleted ${deleted} previous seeded rows`)

  // Build rows
  const rows = cityEntries.map((e) => ({
    city: e.city,
    country: e.country,
    restaurant_name: e.restaurant_name,
    dish_name: e.dish_name,
    dish_category: e.dish_category,
    included_in_baseline: e.dish_category === 'basic' || e.dish_category === 'vegetable',
    tier: e.tier,
    local_price: e.local_price ?? e.price_cad,
    local_currency: e.local_currency ?? 'CAD',
    exchange_rate_used: e.exchange_rate_used ?? 1,
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

  const { error: insertErr } = await supabase.from('restaurants').insert(rows)
  if (insertErr) { console.error(`  Insert failed: ${insertErr.message}`); return }
  console.log(`  ✓ Inserted ${rows.length} rows`)

  // Print summary
  for (const e of cityEntries) {
    const b = (e.dish_category === 'basic' || e.dish_category === 'vegetable') ? ' [baseline]' : ''
    const local = e.local_currency && e.local_currency !== 'CAD'
      ? ` (${e.local_currency} ${e.local_price?.toFixed(2)})`
      : ''
    console.log(`    ${e.restaurant_name} — ${e.dish_name}: CA$${e.price_cad.toFixed(2)}${local}${b}`)
  }

  // Recalculate city stats
  const baselineRows = rows.filter((r) => r.included_in_baseline)
  const baselinePrices = baselineRows.map((r) => r.price_cad).sort((a, b) => a - b)
  const allPrices = rows.map((r) => r.price_cad).sort((a, b) => a - b)
  const trimK = Math.round(allPrices.length * 0.05)
  const marketAvg = trimmedMean(allPrices)

  if (baselinePrices.length > 0) {
    const mid = Math.floor(baselinePrices.length / 2)
    const median = baselinePrices.length % 2 === 1
      ? baselinePrices[mid]
      : (baselinePrices[mid - 1] + baselinePrices[mid]) / 2

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
        confidence_score: Number((baselineRows.reduce((s, r) => s + r.confidence_score, 0) / baselineRows.length).toFixed(2)),
      })
      .eq('city', city)

    if (cityErr) {
      console.error(`  City update failed: ${cityErr.message}`)
    } else {
      console.log(`  ✓ City updated — baseline median: CA$${median.toFixed(2)} (${baselineRows.length} entries)`)
      console.log(`    Market avg (5% trimmed): CA$${marketAvg.toFixed(2)} (${trimK} removed each end)`)
      console.log(`    Market range: CA$${allPrices[0].toFixed(2)} – CA$${allPrices[allPrices.length - 1].toFixed(2)}`)
    }
  } else {
    // No baseline entries — update market stats only, leave price_cad null
    const { error: cityErr } = await supabase
      .from('cities')
      .update({
        market_average_cad: Number(marketAvg.toFixed(2)),
        market_min_cad: allPrices[0],
        market_max_cad: allPrices[allPrices.length - 1],
        market_entry_count: rows.length,
        baseline_entry_count: 0,
        data_quality_label: 'Preliminary',
        price_source: 'No basic/vegetable entries yet — baseline price pending',
        price_updated_at: NOW,
      })
      .eq('city', city)

    if (cityErr) console.error(`  City update failed: ${cityErr.message}`)
    else console.log(`  ⚠ No baseline entries — market stats updated, city price left null`)
  }
}

async function run() {
  const cities = Object.keys(CITY_COUNTRY)

  for (const city of cities) {
    const cityEntries = ENTRIES.filter((e) => e.city === city)
    if (cityEntries.length === 0) {
      console.log(`\n─── ${city} — SKIPPED (no verified data)`)
      continue
    }
    await seedCity(city, cityEntries)
  }

  console.log('\n✓ All cities done.')
}

run()
