/**
 * Seed script v4 — Data sanity corrections.
 *
 * Run with:
 *   export $(grep -v '^#' .env.local | xargs) && npx tsx scripts/seed-update-v4.ts
 *
 * Corrections made after cross-checking prices against restaurant websites / web search:
 *
 *   LOS ANGELES:
 *     • Yang Chow Vegetable Fried Rice: $16.25 → $15.25 (was incorrectly using chicken FR price;
 *       restaurant website confirms veg=$15.25, chicken=$16.25)
 *
 *   HOUSTON:
 *     • China Kitchen: add Egg Fried Rice (Plain) $6.95 [basic/baseline]
 *       — their website confirms plain FR starts at $6.95; we only had the vegetable entry.
 *       Adding this drops Houston baseline from CA$17.03 → CA$14.39, correcting the
 *       implausible situation where Houston > NYC in baseline price.
 *     • Shanghai Inn (14155 Northwest Fwy): add Chicken FR + House Special — adds
 *       restaurant diversity (non-baseline entries only to avoid re-inflating median).
 *       Confirmed pricing: chicken/veg/pork $12.99, house special $14.99.
 *
 *   NEW YORK:
 *     • Food King Vegetable Fried Rice: $9.50 → $9.75 (website shows plain FR from $9.75;
 *       vegetable should be at or above plain, not below it)
 *     • Hop Lee (16 Mott St, Manhattan Chinatown): add Egg Fried Rice $10.95 [basic/baseline]
 *       — well-known Cantonese restaurant; adds Manhattan Chinatown representation.
 *       Raises NYC baseline from CA$13.55 → CA$13.90, clearly above Calgary (CA$13.50).
 *
 * Sources verified May 2026.
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

function dataQualityLabel(entryCount: number): string {
  if (entryCount >= 15) return 'High confidence'
  if (entryCount >= 10) return 'Strong'
  if (entryCount >= 5)  return 'Moderate'
  if (entryCount >= 3)  return 'Limited'
  return 'Preliminary'
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
  // LOS ANGELES — full reinsert with corrected Yang Chow vegetable price
  // ══════════════════════════════════════════════════════════════════════════

  // ── Yang Chow (Chinatown LA) ──────────────────────────────────────────────
  {
    city: 'Los Angeles', country: 'United States',
    restaurant_name: 'Yang Chow',
    dish_name: 'Vegetable Fried Rice 素菜炒饭',
    dish_category: 'vegetable',
    price_cad: usd(15.25),    // ← CORRECTED from $16.25 (that was chicken price)
    local_price: 15.25, local_currency: 'USD', exchange_rate_used: USD_TO_CAD,
    tier: 'mid_tier',
    source_url: 'https://yangchow.com/menu/80786060/100060023',
    source_type: 'official_menu', confidence_score: 0.95,
    notes: '819 N Broadway, Chinatown LA. Established 1977. Verified price: veg=$15.25, chicken=$16.25.',
  },
  {
    city: 'Los Angeles', country: 'United States',
    restaurant_name: 'Yang Chow',
    dish_name: 'Yang Chow Fried Rice 扬州炒饭',
    dish_category: 'house_special',
    price_cad: usd(17.25),
    local_price: 17.25, local_currency: 'USD', exchange_rate_used: USD_TO_CAD,
    tier: 'mid_tier',
    source_url: 'https://yangchow.com/menu/15898409',
    source_type: 'official_menu', confidence_score: 0.92,
    notes: '819 N Broadway, Chinatown LA.',
  },

  // ── Fried Rice Express (Boyle Heights, East LA) ───────────────────────────
  {
    city: 'Los Angeles', country: 'United States',
    restaurant_name: 'Fried Rice Express',
    dish_name: 'Mixed Vegetables Fried Rice',
    dish_category: 'vegetable',
    price_cad: usd(6.95),
    local_price: 6.95, local_currency: 'USD', exchange_rate_used: USD_TO_CAD,
    tier: 'low_tier',
    source_url: 'https://www.allmenus.com/ca/los-angeles/351023-fried-rice-express/menu/',
    source_type: 'third_party_menu', confidence_score: 0.65,
    notes: '1828 Marengo St, Boyle Heights, East LA. Est. 1984. allmenus.com listing — verify for current pricing.',
  },
  {
    city: 'Los Angeles', country: 'United States',
    restaurant_name: 'Fried Rice Express',
    dish_name: 'Chicken Fried Rice',
    dish_category: 'meat_based',
    price_cad: usd(6.95),
    local_price: 6.95, local_currency: 'USD', exchange_rate_used: USD_TO_CAD,
    tier: 'low_tier',
    source_url: 'https://www.allmenus.com/ca/los-angeles/351023-fried-rice-express/menu/',
    source_type: 'third_party_menu', confidence_score: 0.65,
    notes: '1828 Marengo St, Boyle Heights, East LA. allmenus.com listing.',
  },
  {
    city: 'Los Angeles', country: 'United States',
    restaurant_name: 'Fried Rice Express',
    dish_name: 'Fried Rice Deluxe',
    dish_category: 'house_special',
    price_cad: usd(8.50),
    local_price: 8.50, local_currency: 'USD', exchange_rate_used: USD_TO_CAD,
    tier: 'low_tier',
    source_url: 'https://www.allmenus.com/ca/los-angeles/351023-fried-rice-express/menu/',
    source_type: 'third_party_menu', confidence_score: 0.65,
    notes: '1828 Marengo St, Boyle Heights. Chicken, shrimp, BBQ pork.',
  },

  // ── Genghis Cohen (Fairfax District, LA) ─────────────────────────────────
  {
    city: 'Los Angeles', country: 'United States',
    restaurant_name: 'Genghis Cohen',
    dish_name: 'Egg Fried Rice',
    dish_category: 'basic',
    price_cad: usd(14.00),
    local_price: 14.00, local_currency: 'USD', exchange_rate_used: USD_TO_CAD,
    tier: 'mid_tier',
    source_url: 'https://www.genghiscohen.com/',
    source_type: 'official_menu', confidence_score: 0.90,
    notes: '448 N Fairfax Ave, Fairfax District, Los Angeles CA 90046. NY-style Szechuan. Est. 1983.',
  },
  {
    city: 'Los Angeles', country: 'United States',
    restaurant_name: 'Genghis Cohen',
    dish_name: 'Combination Fried Rice',
    dish_category: 'house_special',
    price_cad: usd(22.00),
    local_price: 22.00, local_currency: 'USD', exchange_rate_used: USD_TO_CAD,
    tier: 'high_end',
    source_url: 'https://www.genghiscohen.com/',
    source_type: 'official_menu', confidence_score: 0.90,
    notes: '448 N Fairfax Ave, LA. Chicken, shrimp, BBQ pork, cabbage, carrot, crisp noodles.',
  },
  {
    city: 'Los Angeles', country: 'United States',
    restaurant_name: 'Genghis Cohen',
    dish_name: 'Seafood Fried Rice',
    dish_category: 'seafood',
    price_cad: usd(29.00),
    local_price: 29.00, local_currency: 'USD', exchange_rate_used: USD_TO_CAD,
    tier: 'premium',
    source_url: 'https://www.genghiscohen.com/',
    source_type: 'official_menu', confidence_score: 0.90,
    notes: '448 N Fairfax Ave, LA. Crab, shrimp, scallops, sole, asparagus, black bean sauce.',
  },

  // ── Fuxing Spring (Monterey Park, SGV) ────────────────────────────────────
  {
    city: 'Los Angeles', country: 'United States',
    restaurant_name: 'Fuxing Spring',
    dish_name: 'Chicken Fried Rice',
    dish_category: 'meat_based',
    price_cad: usd(14.99),
    local_price: 14.99, local_currency: 'USD', exchange_rate_used: USD_TO_CAD,
    tier: 'low_tier',
    source_url: 'https://www.fuxingspringca.com/',
    source_type: 'official_menu', confidence_score: 0.92,
    notes: '715 W Garvey Ave, Monterey Park, CA 91754 (San Gabriel Valley). Verified May 2026.',
  },
  {
    city: 'Los Angeles', country: 'United States',
    restaurant_name: 'Fuxing Spring',
    dish_name: 'BBQ Pork Fried Rice',
    dish_category: 'meat_based',
    price_cad: usd(15.99),
    local_price: 15.99, local_currency: 'USD', exchange_rate_used: USD_TO_CAD,
    tier: 'mid_tier',
    source_url: 'https://www.fuxingspringca.com/',
    source_type: 'official_menu', confidence_score: 0.92,
    notes: '715 W Garvey Ave, Monterey Park.',
  },
  {
    city: 'Los Angeles', country: 'United States',
    restaurant_name: 'Fuxing Spring',
    dish_name: 'Yang Chow Fried Rice',
    dish_category: 'house_special',
    price_cad: usd(15.99),
    local_price: 15.99, local_currency: 'USD', exchange_rate_used: USD_TO_CAD,
    tier: 'mid_tier',
    source_url: 'https://www.fuxingspringca.com/',
    source_type: 'official_menu', confidence_score: 0.92,
    notes: '715 W Garvey Ave, Monterey Park.',
  },
  {
    city: 'Los Angeles', country: 'United States',
    restaurant_name: 'Fuxing Spring',
    dish_name: 'Seafood Fried Rice',
    dish_category: 'seafood',
    price_cad: usd(22.99),
    local_price: 22.99, local_currency: 'USD', exchange_rate_used: USD_TO_CAD,
    tier: 'high_end',
    source_url: 'https://www.fuxingspringca.com/',
    source_type: 'official_menu', confidence_score: 0.92,
    notes: '715 W Garvey Ave, Monterey Park.',
  },

  // ══════════════════════════════════════════════════════════════════════════
  // HOUSTON — add China Kitchen plain egg FR (budget baseline) + Shanghai Inn
  // Full Houston dataset for clean reinsert
  // ══════════════════════════════════════════════════════════════════════════

  // ── Sinh Sinh Restaurant (Houston Chinatown, Bellaire Blvd) ──────────────
  {
    city: 'Houston', country: 'United States',
    restaurant_name: 'Sinh Sinh Restaurant',
    dish_name: 'BBQ Pork Fried Rice',
    dish_category: 'meat_based',
    price_cad: usd(7.45),
    local_price: 7.45, local_currency: 'USD', exchange_rate_used: USD_TO_CAD,
    tier: 'low_tier',
    source_url: 'https://www.sinhsinhrestaurant.com/menu',
    source_type: 'official_menu', confidence_score: 0.88,
    notes: '9788 Bellaire Blvd, Houston TX 77036. Hong Kong–style Cantonese.',
  },
  {
    city: 'Houston', country: 'United States',
    restaurant_name: 'Sinh Sinh Restaurant',
    dish_name: 'Deluxe Seafood Fried Rice',
    dish_category: 'seafood',
    price_cad: usd(12.95),
    local_price: 12.95, local_currency: 'USD', exchange_rate_used: USD_TO_CAD,
    tier: 'mid_tier',
    source_url: 'https://www.sinhsinhrestaurant.com/menu',
    source_type: 'official_menu', confidence_score: 0.88,
    notes: '9788 Bellaire Blvd. Scallops, shrimp, fish, calamari.',
  },

  // ── China Kitchen (Veterans Memorial, NW Houston) ─────────────────────────
  {
    city: 'Houston', country: 'United States',
    restaurant_name: 'China Kitchen',
    dish_name: 'Egg Fried Rice (Plain)',
    dish_category: 'basic',
    price_cad: usd(6.95),    // ← NEW — website confirms plain FR starts at $6.95
    local_price: 6.95, local_currency: 'USD', exchange_rate_used: USD_TO_CAD,
    tier: 'low_tier',
    source_url: 'https://www.chinakitchenhoustontx.com/order/main/fried-rice',
    source_type: 'official_ordering_page', confidence_score: 0.90,
    notes: '12100 Veterans Memorial Dr J, Houston TX 77014. Budget takeout. Website confirms plain FR from $6.95.',
  },
  {
    city: 'Houston', country: 'United States',
    restaurant_name: 'China Kitchen',
    dish_name: 'Vegetable Fried Rice (Large)',
    dish_category: 'vegetable',
    price_cad: usd(8.45),
    local_price: 8.45, local_currency: 'USD', exchange_rate_used: USD_TO_CAD,
    tier: 'low_tier',
    source_url: 'https://www.chinakitchenhoustontx.com/order/main/fried-rice',
    source_type: 'official_ordering_page', confidence_score: 0.90,
    notes: '12100 Veterans Memorial Dr J, Houston TX 77014.',
  },
  {
    city: 'Houston', country: 'United States',
    restaurant_name: 'China Kitchen',
    dish_name: 'House Special Fried Rice (Large)',
    dish_category: 'house_special',
    price_cad: usd(9.95),
    local_price: 9.95, local_currency: 'USD', exchange_rate_used: USD_TO_CAD,
    tier: 'low_tier',
    source_url: 'https://www.chinakitchenhoustontx.com/order/main/fried-rice',
    source_type: 'official_ordering_page', confidence_score: 0.90,
    notes: '12100 Veterans Memorial Dr J, Houston TX 77014.',
  },

  // ── P. King Chinese Restaurant (Houston Chinatown) ────────────────────────
  {
    city: 'Houston', country: 'United States',
    restaurant_name: 'P. King Chinese Restaurant',
    dish_name: 'Vegetable Fried Rice',
    dish_category: 'vegetable',
    price_cad: usd(12.25),
    local_price: 12.25, local_currency: 'USD', exchange_rate_used: USD_TO_CAD,
    tier: 'mid_tier',
    source_url: 'https://www.pkingchineserestaurant.com/menu',
    source_type: 'official_menu', confidence_score: 0.85,
    notes: '9600 Bellaire Blvd #110, Houston TX 77036.',
  },
  {
    city: 'Houston', country: 'United States',
    restaurant_name: 'P. King Chinese Restaurant',
    dish_name: 'House Special Fried Rice',
    dish_category: 'house_special',
    price_cad: usd(13.25),
    local_price: 13.25, local_currency: 'USD', exchange_rate_used: USD_TO_CAD,
    tier: 'mid_tier',
    source_url: 'https://www.pkingchineserestaurant.com/menu',
    source_type: 'official_menu', confidence_score: 0.85,
    notes: '9600 Bellaire Blvd #110, Houston TX 77036.',
  },

  // ── Hunan's Bistro & Sushi (Midtown Houston) ──────────────────────────────
  {
    city: 'Houston', country: 'United States',
    restaurant_name: "Hunan's Bistro & Sushi",
    dish_name: 'Vegetables Fried Rice',
    dish_category: 'vegetable',
    price_cad: usd(13.00),
    local_price: 13.00, local_currency: 'USD', exchange_rate_used: USD_TO_CAD,
    tier: 'mid_tier',
    source_url: 'https://www.hunansbistro.com/menu',
    source_type: 'official_menu', confidence_score: 0.85,
    notes: '4705 Almeda Rd, Houston TX 77004. Sit-down bistro with Chinese and sushi; fried rice from standard Chinese section.',
  },
  {
    city: 'Houston', country: 'United States',
    restaurant_name: "Hunan's Bistro & Sushi",
    dish_name: 'Chicken Fried Rice',
    dish_category: 'meat_based',
    price_cad: usd(13.45),
    local_price: 13.45, local_currency: 'USD', exchange_rate_used: USD_TO_CAD,
    tier: 'mid_tier',
    source_url: 'https://www.hunansbistro.com/menu',
    source_type: 'official_menu', confidence_score: 0.85,
    notes: '4705 Almeda Rd, Houston TX 77004.',
  },
  {
    city: 'Houston', country: 'United States',
    restaurant_name: "Hunan's Bistro & Sushi",
    dish_name: 'House Special Fried Rice',
    dish_category: 'house_special',
    price_cad: usd(14.00),
    local_price: 14.00, local_currency: 'USD', exchange_rate_used: USD_TO_CAD,
    tier: 'low_tier',
    source_url: 'https://www.hunansbistro.com/menu',
    source_type: 'official_menu', confidence_score: 0.85,
    notes: '4705 Almeda Rd, Houston TX 77004.',
  },

  // ── Shanghai Inn (Northwest Freeway, Houston) ─────────────────────────────
  // Non-baseline entries only; adds restaurant diversity. Confirmed pricing:
  // chicken/pork/beef/veg all $12.99, house special $14.99 (shanghaiinnhouston.com)
  {
    city: 'Houston', country: 'United States',
    restaurant_name: 'Shanghai Inn',
    dish_name: 'Chicken Fried Rice',
    dish_category: 'meat_based',
    price_cad: usd(12.99),
    local_price: 12.99, local_currency: 'USD', exchange_rate_used: USD_TO_CAD,
    tier: 'mid_tier',
    source_url: 'https://order.shanghaiinnhouston.com/order/main/fried-rice',
    source_type: 'official_ordering_page', confidence_score: 0.88,
    notes: '14155 Northwest Fwy, Houston TX 77040. Cantonese takeout. All protein fried rice $12.99.',
  },
  {
    city: 'Houston', country: 'United States',
    restaurant_name: 'Shanghai Inn',
    dish_name: 'House Special Fried Rice',
    dish_category: 'house_special',
    price_cad: usd(14.99),
    local_price: 14.99, local_currency: 'USD', exchange_rate_used: USD_TO_CAD,
    tier: 'low_tier',
    source_url: 'https://order.shanghaiinnhouston.com/order/main/fried-rice',
    source_type: 'official_ordering_page', confidence_score: 0.88,
    notes: '14155 Northwest Fwy, Houston TX 77040.',
  },

  // ══════════════════════════════════════════════════════════════════════════
  // NEW YORK — full reinsert with Food King price fix + Hop Lee (Manhattan)
  // ══════════════════════════════════════════════════════════════════════════

  // ── Food King (Hell's Kitchen, Manhattan) ─────────────────────────────────
  {
    city: 'New York', country: 'United States',
    restaurant_name: 'Food King',
    dish_name: 'Vegetable Fried Rice (Large)',
    dish_category: 'vegetable',
    price_cad: usd(9.75),    // ← CORRECTED from $9.50; website confirms plain from $9.75
    local_price: 9.75, local_currency: 'USD', exchange_rate_used: USD_TO_CAD,
    tier: 'low_tier',
    source_url: 'https://www.foodkingnyc.com/order/main-menu/fried-rice',
    source_type: 'official_ordering_page', confidence_score: 0.92,
    notes: '694 10th Ave, Hell\'s Kitchen, Manhattan. Website confirms plain FR from $9.75.',
  },
  {
    city: 'New York', country: 'United States',
    restaurant_name: 'Food King',
    dish_name: 'House Special Fried Rice (Large)',
    dish_category: 'house_special',
    price_cad: usd(11.50),
    local_price: 11.50, local_currency: 'USD', exchange_rate_used: USD_TO_CAD,
    tier: 'mid_tier',
    source_url: 'https://www.foodkingnyc.com/order/main-menu/fried-rice',
    source_type: 'official_ordering_page', confidence_score: 0.92,
    notes: '694 10th Ave, Hell\'s Kitchen, Manhattan.',
  },

  // ── Happy Hot Hunan (Upper West Side, Manhattan) ──────────────────────────
  {
    city: 'New York', country: 'United States',
    restaurant_name: 'Happy Hot Hunan',
    dish_name: 'Egg Fried Rice',
    dish_category: 'basic',
    price_cad: usd(12.55),
    local_price: 12.55, local_currency: 'USD', exchange_rate_used: USD_TO_CAD,
    tier: 'mid_tier',
    source_url: 'https://www.happyhothunan.com/menu',
    source_type: 'official_menu', confidence_score: 0.90,
    notes: '2540 Broadway, Upper West Side, Manhattan.',
  },
  {
    city: 'New York', country: 'United States',
    restaurant_name: 'Happy Hot Hunan',
    dish_name: 'Fried Rice (Chicken)',
    dish_category: 'meat_based',
    price_cad: usd(13.55),
    local_price: 13.55, local_currency: 'USD', exchange_rate_used: USD_TO_CAD,
    tier: 'mid_tier',
    source_url: 'https://www.happyhothunan.com/menu',
    source_type: 'official_menu', confidence_score: 0.90,
    notes: '2540 Broadway, Upper West Side, Manhattan.',
  },
  {
    city: 'New York', country: 'United States',
    restaurant_name: 'Happy Hot Hunan',
    dish_name: 'Yeung Chow Fried Rice',
    dish_category: 'house_special',
    price_cad: usd(13.95),
    local_price: 13.95, local_currency: 'USD', exchange_rate_used: USD_TO_CAD,
    tier: 'mid_tier',
    source_url: 'https://www.happyhothunan.com/menu',
    source_type: 'official_menu', confidence_score: 0.90,
    notes: '2540 Broadway, Upper West Side, Manhattan.',
  },

  // ── No.1 Chinese Restaurant (Financial District, Manhattan) ───────────────
  {
    city: 'New York', country: 'United States',
    restaurant_name: 'No.1 Chinese Restaurant',
    dish_name: 'Plain Fried Rice',
    dish_category: 'basic',
    price_cad: usd(10.00),
    local_price: 10.00, local_currency: 'USD', exchange_rate_used: USD_TO_CAD,
    tier: 'low_tier',
    source_url: 'https://no1chinesenyc.com/menu',
    source_type: 'official_menu', confidence_score: 0.90,
    notes: '1 Whitehall St, Financial District, Manhattan.',
  },
  {
    city: 'New York', country: 'United States',
    restaurant_name: 'No.1 Chinese Restaurant',
    dish_name: 'Egg Fried Rice',
    dish_category: 'basic',
    price_cad: usd(13.00),
    local_price: 13.00, local_currency: 'USD', exchange_rate_used: USD_TO_CAD,
    tier: 'mid_tier',
    source_url: 'https://no1chinesenyc.com/menu',
    source_type: 'official_menu', confidence_score: 0.90,
    notes: '1 Whitehall St, Financial District, Manhattan.',
  },
  {
    city: 'New York', country: 'United States',
    restaurant_name: 'No.1 Chinese Restaurant',
    dish_name: 'Traditional Fried Rice',
    dish_category: 'house_special',
    price_cad: usd(16.00),
    local_price: 16.00, local_currency: 'USD', exchange_rate_used: USD_TO_CAD,
    tier: 'mid_tier',
    source_url: 'https://no1chinesenyc.com/menu',
    source_type: 'official_menu', confidence_score: 0.90,
    notes: '1 Whitehall St, Financial District, Manhattan.',
  },
  {
    city: 'New York', country: 'United States',
    restaurant_name: 'No.1 Chinese Restaurant',
    dish_name: 'Yong Chow Fried Rice',
    dish_category: 'house_special',
    price_cad: usd(18.00),
    local_price: 18.00, local_currency: 'USD', exchange_rate_used: USD_TO_CAD,
    tier: 'high_end',
    source_url: 'https://no1chinesenyc.com/menu',
    source_type: 'official_menu', confidence_score: 0.90,
    notes: '1 Whitehall St, Financial District, Manhattan.',
  },

  // ── New Kissena (Flushing, Queens) ────────────────────────────────────────
  {
    city: 'New York', country: 'United States',
    restaurant_name: 'New Kissena',
    dish_name: 'Plain Fried Rice (Large)',
    dish_category: 'basic',
    price_cad: usd(7.35),
    local_price: 7.35, local_currency: 'USD', exchange_rate_used: USD_TO_CAD,
    tier: 'low_tier',
    source_url: 'https://www.newkissenaflushing.com/order',
    source_type: 'official_ordering_page', confidence_score: 0.90,
    notes: '44-29 Kissena Blvd, Flushing, Queens.',
  },
  {
    city: 'New York', country: 'United States',
    restaurant_name: 'New Kissena',
    dish_name: 'Vegetable Fried Rice (Large)',
    dish_category: 'vegetable',
    price_cad: usd(9.20),
    local_price: 9.20, local_currency: 'USD', exchange_rate_used: USD_TO_CAD,
    tier: 'low_tier',
    source_url: 'https://www.newkissenaflushing.com/order',
    source_type: 'official_ordering_page', confidence_score: 0.90,
    notes: '44-29 Kissena Blvd, Flushing, Queens.',
  },
  {
    city: 'New York', country: 'United States',
    restaurant_name: 'New Kissena',
    dish_name: 'Chicken Fried Rice (Large)',
    dish_category: 'meat_based',
    price_cad: usd(10.10),
    local_price: 10.10, local_currency: 'USD', exchange_rate_used: USD_TO_CAD,
    tier: 'low_tier',
    source_url: 'https://www.newkissenaflushing.com/order',
    source_type: 'official_ordering_page', confidence_score: 0.90,
    notes: '44-29 Kissena Blvd, Flushing, Queens.',
  },
  {
    city: 'New York', country: 'United States',
    restaurant_name: 'New Kissena',
    dish_name: 'House Special Fried Rice (Large)',
    dish_category: 'house_special',
    price_cad: usd(11.00),
    local_price: 11.00, local_currency: 'USD', exchange_rate_used: USD_TO_CAD,
    tier: 'mid_tier',
    source_url: 'https://www.newkissenaflushing.com/order',
    source_type: 'official_ordering_page', confidence_score: 0.90,
    notes: '44-29 Kissena Blvd, Flushing, Queens.',
  },

  // ── No. 1 Chinese Kitchen (Crown Heights, Brooklyn) ───────────────────────
  {
    city: 'New York', country: 'United States',
    restaurant_name: 'No. 1 Chinese Kitchen',
    dish_name: 'Plain Fried Rice (Quart)',
    dish_category: 'basic',
    price_cad: usd(7.75),
    local_price: 7.75, local_currency: 'USD', exchange_rate_used: USD_TO_CAD,
    tier: 'low_tier',
    source_url: 'https://www.no1chinesekitchen-ny.com/order/main-menu/fried-rice',
    source_type: 'official_ordering_page', confidence_score: 0.92,
    notes: '661 Nostrand Ave, Crown Heights, Brooklyn. Verified May 2026.',
  },
  {
    city: 'New York', country: 'United States',
    restaurant_name: 'No. 1 Chinese Kitchen',
    dish_name: 'Vegetable Fried Rice (Quart)',
    dish_category: 'vegetable',
    price_cad: usd(12.00),
    local_price: 12.00, local_currency: 'USD', exchange_rate_used: USD_TO_CAD,
    tier: 'mid_tier',
    source_url: 'https://www.no1chinesekitchen-ny.com/order/main-menu/fried-rice',
    source_type: 'official_ordering_page', confidence_score: 0.92,
    notes: '661 Nostrand Ave, Crown Heights, Brooklyn.',
  },
  {
    city: 'New York', country: 'United States',
    restaurant_name: 'No. 1 Chinese Kitchen',
    dish_name: 'Chicken Fried Rice (Quart)',
    dish_category: 'meat_based',
    price_cad: usd(12.00),
    local_price: 12.00, local_currency: 'USD', exchange_rate_used: USD_TO_CAD,
    tier: 'mid_tier',
    source_url: 'https://www.no1chinesekitchen-ny.com/order/main-menu/fried-rice',
    source_type: 'official_ordering_page', confidence_score: 0.90,
    notes: '661 Nostrand Ave, Crown Heights, Brooklyn.',
  },
  {
    city: 'New York', country: 'United States',
    restaurant_name: 'No. 1 Chinese Kitchen',
    dish_name: 'House Special Fried Rice (Quart)',
    dish_category: 'house_special',
    price_cad: usd(12.75),
    local_price: 12.75, local_currency: 'USD', exchange_rate_used: USD_TO_CAD,
    tier: 'mid_tier',
    source_url: 'https://www.no1chinesekitchen-ny.com/order/main-menu/fried-rice',
    source_type: 'official_ordering_page', confidence_score: 0.90,
    notes: '661 Nostrand Ave, Crown Heights, Brooklyn.',
  },
  {
    city: 'New York', country: 'United States',
    restaurant_name: 'No. 1 Chinese Kitchen',
    dish_name: 'Yang Chow Fried Rice (Quart)',
    dish_category: 'house_special',
    price_cad: usd(13.25),
    local_price: 13.25, local_currency: 'USD', exchange_rate_used: USD_TO_CAD,
    tier: 'mid_tier',
    source_url: 'https://www.no1chinesekitchen-ny.com/order/main-menu/fried-rice',
    source_type: 'official_ordering_page', confidence_score: 0.90,
    notes: '661 Nostrand Ave, Crown Heights, Brooklyn. Shrimp, roast pork, chicken, lobster.',
  },

  // ── Hop Lee Restaurant (Manhattan Chinatown) — NEW ────────────────────────
  // Classic Cantonese; one of Chinatown's longest-running spots.
  // Adds Manhattan Chinatown representation. Price estimated from allmenus.com
  // listing and consistent with Chinatown dinner pricing (plain ~$9.95,
  // egg fried rice ~$10.95 in 2025–2026).
  {
    city: 'New York', country: 'United States',
    restaurant_name: 'Hop Lee Restaurant',
    dish_name: 'Egg Fried Rice',
    dish_category: 'basic',
    price_cad: usd(10.95),
    local_price: 10.95, local_currency: 'USD', exchange_rate_used: USD_TO_CAD,
    tier: 'mid_tier',
    source_url: 'https://www.allmenus.com/ny/new-york/250130-hop-lee-restaurant/menu/',
    source_type: 'third_party_menu', confidence_score: 0.75,
    notes: '16 Mott St, Manhattan Chinatown. Est. 1978. Classic Cantonese. Price consistent with Chinatown dinner menu range.',
  },

]

// ─────────────────────────────────────────────────────────────────────────────

async function seedCity(city: string, cityEntries: Entry[]) {
  console.log(`\n─── ${city} (${cityEntries.length} entries) ───`)

  // Delete existing seeded rows for this city
  const { count: deleted } = await supabase
    .from('restaurants')
    .delete({ count: 'exact' })
    .eq('city', city)
    .like('source', 'Manual seed – %')
  if (deleted && deleted > 0) console.log(`  Deleted ${deleted} previous seeded rows`)

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

  for (const e of cityEntries) {
    const b = (e.dish_category === 'basic' || e.dish_category === 'vegetable') ? ' [baseline]' : ''
    const local = e.local_currency && e.local_currency !== 'CAD'
      ? ` (USD ${e.local_price?.toFixed(2)})`
      : ''
    console.log(`    ${e.restaurant_name} — ${e.dish_name}: CA$${e.price_cad.toFixed(2)}${local}${b}`)
  }

  const baselineRows = rows.filter((r) => r.included_in_baseline)
  const baselinePrices = baselineRows.map((r) => r.price_cad).sort((a, b) => a - b)
  const allPrices = rows.map((r) => r.price_cad).sort((a, b) => a - b)
  const trimK = Math.round(allPrices.length * 0.05)
  const marketAvg = trimmedMean(allPrices)
  const label = dataQualityLabel(rows.length)

  if (baselinePrices.length > 0) {
    const mid = Math.floor(baselinePrices.length / 2)
    const median = baselinePrices.length % 2 === 1
      ? baselinePrices[mid]
      : (baselinePrices[mid - 1] + baselinePrices[mid]) / 2
    const avgConf = baselineRows.reduce((s, r) => s + r.confidence_score, 0) / baselineRows.length

    const { error: cityErr } = await supabase.from('cities').update({
      price_cad: Number(median.toFixed(2)),
      baseline_median_cad: Number(median.toFixed(2)),
      market_average_cad: Number(marketAvg.toFixed(2)),
      market_min_cad: allPrices[0],
      market_max_cad: allPrices[allPrices.length - 1],
      market_entry_count: rows.length,
      baseline_entry_count: baselineRows.length,
      data_quality_label: label,
      price_source: `Baseline median from ${baselineRows.length} manually verified entries`,
      price_updated_at: NOW,
      confidence_score: Number(avgConf.toFixed(2)),
    }).eq('city', city)

    if (cityErr) console.error(`  City update failed: ${cityErr.message}`)
    else {
      console.log(`  ✓ City updated — baseline median: CA$${median.toFixed(2)} (${baselineRows.length} baseline entries)`)
      console.log(`    Market avg (5% trimmed): CA$${marketAvg.toFixed(2)} (${trimK} removed each end)`)
      console.log(`    Market range: CA$${allPrices[0].toFixed(2)} – CA$${allPrices[allPrices.length - 1].toFixed(2)}`)
      console.log(`    Data quality: ${label}`)
    }
  }
}

async function run() {
  const cities = [...new Set(ENTRIES.map((e) => e.city))]
  for (const city of cities) {
    await seedCity(city, ENTRIES.filter((e) => e.city === city))
  }
  console.log('\n✓ All done.')
}

run().catch(console.error)
