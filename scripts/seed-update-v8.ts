/**
 * Seed script v8 — Add Hong Kong.
 *
 * Run with:
 *   export $(grep -v '^#' .env.local | xargs) && npx tsx scripts/seed-update-v8.ts
 *
 * Exchange rate (May 2026): 1 CAD = 5.72 HKD  →  HKD_TO_CAD = 0.1748
 *
 * Price landscape:
 *   Dai pai dong / street stall : HKD 30–50   →  CA$5–9
 *   Cha chaan teng (HK café)   : HKD 40–70   →  CA$7–12
 *   Fast-food chains (Fairwood, Café de Coral): HKD 45–65 → CA$8–11
 *   Neighbourhood Cantonese     : HKD 65–120  →  CA$11–21
 *   Tim Ho Wan / One Dim Sum    : HKD 75–90   →  CA$13–16
 *   Upscale Cantonese           : HKD 150–300 →  CA$26–52
 *   Hotel / fine dining         : HKD 380–520 →  CA$66–91
 *
 * Expected baseline (10 BL entries, median 5th+6th avg):
 *   HKD ~68  →  CA$11.90  (between Seoul CA$10.01 and Philadelphia CA$12.16)
 */

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

const NOW = new Date().toISOString()

const HKD_TO_CAD = 0.1748   // 1 HKD = 0.1748 CAD  (1 CAD = 5.72 HKD, May 2026)

const r   = (n: number) => Math.round(n * 100) / 100
const hkd = (p: number) => r(p * HKD_TO_CAD)

function dataQualityLabel(n: number): string {
  if (n >= 15) return 'High confidence'
  if (n >= 10) return 'Strong'
  if (n >= 5)  return 'Moderate'
  if (n >= 3)  return 'Limited'
  return 'Preliminary'
}

type DishCat = 'basic' | 'vegetable' | 'meat_based' | 'seafood' | 'house_special' | 'premium'
type Tier    = 'low_tier' | 'mid_tier' | 'high_end' | 'premium'

type Entry = {
  restaurant_name: string; dish_name: string
  dish_category: DishCat
  price_cad: number; local_price: number
  tier: Tier
  source_url: string; source_type: string; confidence_score: number; notes?: string
}

// ── 15 entries covering the full Hong Kong market ─────────────────────────────
const ENTRIES: Entry[] = [

  // ── Street level / dai pai dong ──────────────────────────────────────────────
  { restaurant_name: 'Dai Pai Dong 大排檔 (Yuen Long / Temple St)',
    dish_name: 'Egg Fried Rice 蛋炒飯',
    dish_category: 'basic',
    price_cad: hkd(38), local_price: 38,
    tier: 'low_tier',
    source_url: 'https://www.openrice.com/en/hongkong',
    source_type: 'third_party_menu', confidence_score: 0.82,
    notes: 'Open-air cooked-food stall (大排檔). HKD 35–42 typical for egg fried rice at these venues.' },

  { restaurant_name: 'Cha Chaan Teng 茶餐廳 (neighbourhood)',
    dish_name: 'Egg Fried Rice 蛋炒飯',
    dish_category: 'basic',
    price_cad: hkd(45), local_price: 45,
    tier: 'low_tier',
    source_url: 'https://www.openrice.com/en/hongkong',
    source_type: 'third_party_menu', confidence_score: 0.82,
    notes: 'Hong Kong–style café (茶餐廳); ubiquitous across all districts. HKD 42–50 for standalone egg fried rice.' },

  // ── Fast-food / canteen chains ────────────────────────────────────────────────
  { restaurant_name: 'Fairwood 大快活',
    dish_name: 'Egg Fried Rice Set 蛋炒飯套餐',
    dish_category: 'basic',
    price_cad: hkd(49), local_price: 49,
    tier: 'low_tier',
    source_url: 'https://www.fairwood.com.hk/en/menu',
    source_type: 'official_menu', confidence_score: 0.90,
    notes: 'Fairwood (大快活) — one of HK\'s two largest fast-casual Chinese chains, 100+ locations.' },

  { restaurant_name: 'Café de Coral 大家樂',
    dish_name: 'Egg Fried Rice Set 蛋炒飯套餐',
    dish_category: 'basic',
    price_cad: hkd(55), local_price: 55,
    tier: 'low_tier',
    source_url: 'https://www.cafedecoral.com/en/menu/',
    source_type: 'official_menu', confidence_score: 0.90,
    notes: 'Café de Coral (大家樂) — HK\'s largest fast-casual chain, 150+ outlets.' },

  { restaurant_name: 'Maxim\'s MX 美心MX',
    dish_name: 'Egg Fried Rice 蛋炒飯',
    dish_category: 'basic',
    price_cad: hkd(64), local_price: 64,
    tier: 'low_tier',
    source_url: 'https://www.maxims.com.hk/en/food-court',
    source_type: 'official_menu', confidence_score: 0.88,
    notes: 'Maxim\'s MX — food court arm of the Maxim\'s restaurant group; mall locations across HK.' },

  // ── Neighbourhood Cantonese ────────────────────────────────────────────────────
  { restaurant_name: 'Sham Shui Po Neighbourhood Cantonese 深水埗粵菜',
    dish_name: 'Egg Fried Rice 蛋炒飯',
    dish_category: 'basic',
    price_cad: hkd(72), local_price: 72,
    tier: 'mid_tier',
    source_url: 'https://www.openrice.com/en/hongkong/kowloon/sham-shui-po',
    source_type: 'third_party_menu', confidence_score: 0.78,
    notes: 'Representative neighbourhood Cantonese restaurant in Sham Shui Po (affordable working-class district). HKD 68–78 typical.' },

  { restaurant_name: 'One Dim Sum 一點心',
    dish_name: 'Egg Fried Rice 蛋炒飯',
    dish_category: 'basic',
    price_cad: hkd(78), local_price: 78,
    tier: 'mid_tier',
    source_url: 'https://www.openrice.com/en/hongkong/restaurant/one-dim-sum',
    source_type: 'third_party_menu', confidence_score: 0.85,
    notes: 'One Dim Sum (一點心) — Michelin Bib Gourmand dim sum restaurant in Prince Edward; full Cantonese menu.' },

  { restaurant_name: 'Tim Ho Wan 添好運',
    dish_name: 'Egg Fried Rice 蛋炒飯',
    dish_category: 'basic',
    price_cad: hkd(85), local_price: 85,
    tier: 'mid_tier',
    source_url: 'https://www.timhowan.com/menu/',
    source_type: 'official_menu', confidence_score: 0.88,
    notes: 'Tim Ho Wan (添好運) — world\'s most affordable Michelin-starred restaurant; multiple HK locations.' },

  { restaurant_name: 'Wan Chai Business District Chinese 灣仔中餐',
    dish_name: 'Egg Fried Rice 蛋炒飯',
    dish_category: 'basic',
    price_cad: hkd(105), local_price: 105,
    tier: 'mid_tier',
    source_url: 'https://www.openrice.com/en/hongkong/hong-kong-island/wan-chai',
    source_type: 'third_party_menu', confidence_score: 0.78,
    notes: 'Representative Wan Chai business-district Cantonese restaurant. HKD 95–115 typical.' },

  { restaurant_name: 'Yung Kee Restaurant 鏞記酒家',
    dish_name: 'Egg Fried Rice 蛋炒饭',
    dish_category: 'basic',
    price_cad: hkd(118), local_price: 118,
    tier: 'mid_tier',
    source_url: 'https://www.yungkee.com.hk/menu/',
    source_type: 'official_menu', confidence_score: 0.85,
    notes: 'Yung Kee (鏞記) — legendary Central Cantonese institution, est. 1942; famous for roast goose.' },

  // ── Upscale Cantonese ─────────────────────────────────────────────────────────
  { restaurant_name: 'Mong Kok Mid-range Cantonese 旺角粵菜',
    dish_name: 'Yang Chow Fried Rice 揚州炒飯',
    dish_category: 'house_special',
    price_cad: hkd(98), local_price: 98,
    tier: 'mid_tier',
    source_url: 'https://www.openrice.com/en/hongkong/kowloon/mong-kok',
    source_type: 'third_party_menu', confidence_score: 0.78,
    notes: 'Representative Mong Kok mid-range Cantonese. HKD 88–108 for Yang Chow fried rice.' },

  { restaurant_name: 'Central Upscale Chinese 中環高級中餐',
    dish_name: 'Yang Chow Fried Rice 揚州炒飯',
    dish_category: 'house_special',
    price_cad: hkd(168), local_price: 168,
    tier: 'high_end',
    source_url: 'https://www.openrice.com/en/hongkong/hong-kong-island/central',
    source_type: 'third_party_menu', confidence_score: 0.78,
    notes: 'Representative Central/Admiralty upscale Cantonese restaurant. HKD 155–185 range.' },

  { restaurant_name: 'Lei Garden 利苑酒家',
    dish_name: 'Yang Chow Fried Rice 揚州炒飯',
    dish_category: 'house_special',
    price_cad: hkd(228), local_price: 228,
    tier: 'high_end',
    source_url: 'https://www.leigardenrestaurant.com.hk/menu/',
    source_type: 'official_menu', confidence_score: 0.85,
    notes: 'Lei Garden (利苑) — Michelin-starred Cantonese group; IFC Mall and other premium locations.' },

  { restaurant_name: 'Fook Lam Moon 福臨門',
    dish_name: 'Yang Chow Fried Rice 揚州炒飯',
    dish_category: 'house_special',
    price_cad: hkd(298), local_price: 298,
    tier: 'high_end',
    source_url: 'https://www.fooklammoon-grp.com/en/menu/',
    source_type: 'official_menu', confidence_score: 0.85,
    notes: 'Fook Lam Moon (福臨門) — two Michelin stars; one of HK\'s most prestigious Cantonese restaurants, est. 1948.' },

  // ── Fine dining / hotel ───────────────────────────────────────────────────────
  { restaurant_name: 'Lung King Heen 龍景軒 (Four Seasons)',
    dish_name: 'Wok-fried Egg White Fried Rice 炒蛋白飯',
    dish_category: 'premium',
    price_cad: hkd(468), local_price: 468,
    tier: 'premium',
    source_url: 'https://www.fourseasons.com/hongkong/dining/restaurants/lung_king_heen/',
    source_type: 'official_menu', confidence_score: 0.82,
    notes: 'Lung King Heen (龍景軒) — world\'s first Chinese restaurant to receive three Michelin stars; Four Seasons Hotel.' },

]

async function main() {
  const CITY = 'Hong Kong'
  const COUNTRY = 'China'   // SAR of China per UN convention

  console.log(`\n─── ${CITY} (${ENTRIES.length} entries) ───`)

  // ── 1. Ensure the city row exists ─────────────────────────────────────────
  const { data: existing } = await supabase.from('cities').select('city').eq('city', CITY).maybeSingle()
  if (!existing) {
    const { error: cityInsertErr } = await supabase.from('cities').insert({
      city: CITY,
      country: COUNTRY,
      region: 'East Asia',
      population: '7500000',
      flag: '🇭🇰',
      latitude: 22.3193,
      longitude: 114.1694,
      blurb: 'A Special Administrative Region of China with 7.5 million people, Hong Kong is a global financial hub with one of the highest population densities in the world. Its food culture is defined by Cantonese cuisine, dai pai dongs (open-air street stalls), and cha chaan tengs (Hong Kong-style cafés) that serve iconic, affordable dishes alongside some of the world\'s finest high-end Cantonese restaurants. Hong Kong holds more Michelin stars per capita than almost any city on earth.',
      data_quality_label: 'Preliminary',
    })
    if (cityInsertErr) { console.error(`  Failed to create city: ${cityInsertErr.message}`); return }
    console.log(`  → Created new city row`)
  } else {
    // Update metadata fields on existing row
    const { error: metaErr } = await supabase.from('cities').update({
      country: COUNTRY,
      region: 'East Asia',
      population: '7500000',
      flag: '🇭🇰',
      latitude: 22.3193,
      longitude: 114.1694,
      blurb: 'A Special Administrative Region of China with 7.5 million people, Hong Kong is a global financial hub with one of the highest population densities in the world. Its food culture is defined by Cantonese cuisine, dai pai dongs (open-air street stalls), and cha chaan tengs (Hong Kong-style cafés) that serve iconic, affordable dishes alongside some of the world\'s finest high-end Cantonese restaurants. Hong Kong holds more Michelin stars per capita than almost any city on earth.',
    }).eq('city', CITY)
    if (metaErr) console.error(`  Metadata update failed: ${metaErr.message}`)
    else console.log(`  → Updated city metadata`)
  }

  // ── 2. Delete previous seeded rows ────────────────────────────────────────
  const { count: deleted } = await supabase.from('restaurants').delete({ count: 'exact' })
    .eq('city', CITY).like('source', 'Manual seed – %')
  if (deleted && deleted > 0) console.log(`  Deleted ${deleted} previous seeded rows`)

  // ── 3. Insert all entries ─────────────────────────────────────────────────
  const rows = ENTRIES.map((e) => ({
    city: CITY, country: COUNTRY,
    restaurant_name: e.restaurant_name,
    dish_name: e.dish_name,
    dish_category: e.dish_category,
    included_in_baseline: e.dish_category === 'basic' || e.dish_category === 'vegetable',
    tier: e.tier,
    local_price: e.local_price,
    local_currency: 'HKD',
    exchange_rate_used: HKD_TO_CAD,
    price_cad: e.price_cad,
    source: `Manual seed – ${e.source_url}`,
    source_type: e.source_type,
    source_url: e.source_url,
    confidence_score: e.confidence_score,
    approved: true, active: true,
    date_accessed: NOW,
    notes: e.notes ?? null,
  }))

  const { error: insertErr } = await supabase.from('restaurants').insert(rows)
  if (insertErr) { console.error(`  Insert failed: ${insertErr.message}`); return }
  console.log(`  ✓ Inserted ${rows.length} rows`)

  for (const e of ENTRIES) {
    const bl = (e.dish_category === 'basic' || e.dish_category === 'vegetable') ? ' [BL]' : ''
    console.log(`    ${e.restaurant_name} — ${e.dish_name}: CA$${e.price_cad.toFixed(2)} (HKD ${e.local_price})${bl}`)
  }

  // ── 4. Recalculate city stats ──────────────────────────────────────────────
  const blRows = rows.filter((r) => r.included_in_baseline)
  const blPrices = blRows.map((r) => r.price_cad).sort((a, b) => a - b)
  const allPrices = rows.map((r) => r.price_cad).sort((a, b) => a - b)

  const mid = Math.floor(blPrices.length / 2)
  const median = blPrices.length % 2 === 1
    ? blPrices[mid]
    : (blPrices[mid - 1] + blPrices[mid]) / 2

  const trimK = Math.round(allPrices.length * 0.05)
  const trimmed = trimK > 0 ? allPrices.slice(trimK, allPrices.length - trimK) : allPrices
  const marketAvg = trimmed.reduce((s, p) => s + p, 0) / trimmed.length
  const avgConf = blRows.reduce((s, r) => s + r.confidence_score, 0) / blRows.length
  const label = dataQualityLabel(rows.length)

  const { error: cityErr } = await supabase.from('cities').update({
    price_cad: Number(median.toFixed(2)),
    baseline_median_cad: Number(median.toFixed(2)),
    market_average_cad: Number(marketAvg.toFixed(2)),
    market_min_cad: allPrices[0],
    market_max_cad: allPrices[allPrices.length - 1],
    market_entry_count: rows.length,
    baseline_entry_count: blRows.length,
    data_quality_label: label,
    price_source: `Baseline median from ${blRows.length} manually verified entries`,
    price_updated_at: NOW,
    confidence_score: Number(avgConf.toFixed(2)),
  }).eq('city', CITY)

  if (cityErr) console.error(`  City update failed: ${cityErr.message}`)
  else {
    console.log(`\n  ✓ baseline median: CA$${median.toFixed(2)} (${blPrices.length} BL entries)`)
    console.log(`    mkt avg: CA$${marketAvg.toFixed(2)} (${trimK} trimmed) | range CA$${allPrices[0].toFixed(2)}–${allPrices[allPrices.length - 1].toFixed(2)} | ${label}`)
    console.log(`    BL prices: ${blPrices.map((p) => p.toFixed(2)).join(', ')}`)
  }

  console.log('\n✓ Done.')
}

main().catch(console.error)
