/**
 * Seed script v2 — comprehensive update for all 8 remaining cities.
 * Adds baseline entries, expands restaurant diversity, fixes Chicago sizing.
 *
 * Run with:
 *   export $(grep -v '^#' .env.local | xargs) && npx tsx scripts/seed-update-v2.ts
 *
 * Verified sources:
 *   - Ruby Rouge Montreal    → https://ruby-rouge.com/fr/menu/              (official)
 *   - Harvest Garden Calgary → https://order.harvestgardencalgary.com/…     (official)
 *   - King's Chinese Calgary → https://kingschinesefoods.com/…              (official)
 *   - Yummy Kitchen Edmonton → https://order.yummykitchenedmonton.com/…     (official)
 *   - Szechuan Sweet Mango   → https://order.szechuanstirfryab.com/…        (official)
 *   - Jin's Chinese Edmonton → https://jinschinesecuisine.com/…             (official)
 *   - Harvest Chinese Edm.   → https://harvestchinese-restaurant.com/…      (official)
 *   - Happy Hot Hunan NYC    → https://www.happyhothunanny.com/…            (official)
 *   - No.1 Chinese NYC       → https://menupages.com/no1-chinese-…          (third party)
 *   - New Kissena Flushing   → https://www.newkissenaflushing.com/…         (official)
 *   - Tony's Chicago         → https://www.tonyschinesechicago.com/…        (official)
 *   - Lao Sze Chuan Chicago  → https://www.laoszechuanchicago.com/…         (official)
 *   - P. King Houston        → https://www.pkingbellairetx.com/…            (official)
 *   - Hunan's Bistro Houston → https://www.hunanstx.com/…                   (official)
 *   - Fried Rice Express LA  → https://www.allmenus.com/ca/los-angeles/…    (third party, may be outdated)
 *   - China Restaurant Phx   → https://www.chinarestaurantaz.com/…          (official)
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
  // MONTREAL, QC, CANADA  (all CAD — adds baseline entries from Ruby Rouge)
  // ══════════════════════════════════════════════════════════════════════════

  // ── Keung Kee (Chinatown) ─────────────────────────────────────────────────
  {
    city: 'Montreal', country: 'Canada',
    restaurant_name: 'Keung Kee',
    dish_name: 'Fried Rice with Chicken and Salted Fish',
    dish_category: 'house_special',
    price_cad: 19.75, tier: 'mid_tier',
    source_url: 'https://www.ubereats.com/ca/store/keung-kee/cxpRWTUGTNyGbIg0O1qu1Q',
    source_type: 'delivery_app', confidence_score: 0.82,
    notes: '70 Rue de la Gauchetière O, Chinatown.',
  },

  // ── Dynastie ─────────────────────────────────────────────────────────────
  {
    city: 'Montreal', country: 'Canada',
    restaurant_name: 'Dynastie',
    dish_name: 'Chicken Fried Rice 鸡肉炒饭',
    dish_category: 'meat_based',
    price_cad: 19.50, tier: 'mid_tier',
    source_url: 'https://www.ubereats.com/ca/store/dynastie/uU7LzmN4TPO4_gIqV0FJ0g',
    source_type: 'delivery_app', confidence_score: 0.82,
    notes: '1 Place du Commerce, Brossard (serves Montreal metro).',
  },
  {
    city: 'Montreal', country: 'Canada',
    restaurant_name: 'Dynastie',
    dish_name: 'Salted Fish and Minced Chicken Fried Rice 咸鱼鸡肉碎炒饭',
    dish_category: 'house_special',
    price_cad: 21.78, tier: 'mid_tier',
    source_url: 'https://www.ubereats.com/ca/store/dynastie/uU7LzmN4TPO4_gIqV0FJ0g',
    source_type: 'delivery_app', confidence_score: 0.82,
    notes: '1 Place du Commerce, Brossard.',
  },

  // ── So Poong ─────────────────────────────────────────────────────────────
  {
    city: 'Montreal', country: 'Canada',
    restaurant_name: 'So Poong Korean Restaurant',
    dish_name: 'Kimchi Fried Rice',
    dish_category: 'house_special',
    price_cad: 21.99, tier: 'mid_tier',
    source_url: 'https://www.ubereats.com/ca/store/so-poong/Cx-YZuqhQfyMBIi1Lw9fWA',
    source_type: 'delivery_app', confidence_score: 0.82,
    notes: '1315 Rue Sainte-Catherine O, Montreal.',
  },
  {
    city: 'Montreal', country: 'Canada',
    restaurant_name: 'So Poong Korean Restaurant',
    dish_name: 'Beef Fried Rice',
    dish_category: 'meat_based',
    price_cad: 22.99, tier: 'mid_tier',
    source_url: 'https://www.ubereats.com/ca/store/so-poong/Cx-YZuqhQfyMBIi1Lw9fWA',
    source_type: 'delivery_app', confidence_score: 0.82,
    notes: '1315 Rue Sainte-Catherine O, Montreal.',
  },

  // ── Ruby Rouge (Chinatown) — BASELINE entries ─────────────────────────────
  {
    city: 'Montreal', country: 'Canada',
    restaurant_name: 'Ruby Rouge',
    dish_name: 'Plain Egg Fried Rice',
    dish_category: 'basic',
    price_cad: 14.95, tier: 'low_tier',
    source_url: 'https://ruby-rouge.com/fr/menu/',
    source_type: 'official_menu', confidence_score: 0.92,
    notes: '1008 Clark St, Montreal (Chinatown). Verified May 2026.',
  },
  {
    city: 'Montreal', country: 'Canada',
    restaurant_name: 'Ruby Rouge',
    dish_name: 'Vegetable Fried Rice 什菜炒飯',
    dish_category: 'vegetable',
    price_cad: 14.95, tier: 'low_tier',
    source_url: 'https://ruby-rouge.com/63-vegetable-fried-rice/',
    source_type: 'official_menu', confidence_score: 0.92,
    notes: '1008 Clark St, Montreal (Chinatown). Verified May 2026.',
  },
  {
    city: 'Montreal', country: 'Canada',
    restaurant_name: 'Ruby Rouge',
    dish_name: 'Beef Fried Rice',
    dish_category: 'meat_based',
    price_cad: 15.95, tier: 'mid_tier',
    source_url: 'https://ruby-rouge.com/fr/menu/',
    source_type: 'official_menu', confidence_score: 0.90,
    notes: '1008 Clark St, Montreal (Chinatown).',
  },
  {
    city: 'Montreal', country: 'Canada',
    restaurant_name: 'Ruby Rouge',
    dish_name: 'Salted Fish and Chicken Fried Rice',
    dish_category: 'house_special',
    price_cad: 17.95, tier: 'mid_tier',
    source_url: 'https://ruby-rouge.com/fr/menu/',
    source_type: 'official_menu', confidence_score: 0.90,
    notes: '1008 Clark St, Montreal (Chinatown).',
  },
  {
    city: 'Montreal', country: 'Canada',
    restaurant_name: 'Ruby Rouge',
    dish_name: 'Egg White and Scallop Fried Rice',
    dish_category: 'premium',
    price_cad: 19.95, tier: 'mid_tier',
    source_url: 'https://ruby-rouge.com/fr/menu/',
    source_type: 'official_menu', confidence_score: 0.88,
    notes: '1008 Clark St, Montreal (Chinatown).',
  },

  // ══════════════════════════════════════════════════════════════════════════
  // CALGARY, AB, CANADA  (all CAD — adds Harvest Garden + King's for baseline)
  // ══════════════════════════════════════════════════════════════════════════

  // ── Don's Restaurant ──────────────────────────────────────────────────────
  {
    city: 'Calgary', country: 'Canada',
    restaurant_name: "Don's Restaurant",
    dish_name: 'Chicken Fried Rice',
    dish_category: 'meat_based',
    price_cad: 12.65, tier: 'low_tier',
    source_url: 'https://www.doordash.com/store/dons-restaurant-calgary-1067879/',
    source_type: 'delivery_app', confidence_score: 0.82,
    notes: '4700 26 Ave SW, Calgary.',
  },

  // ── Ho Won Restaurant ─────────────────────────────────────────────────────
  {
    city: 'Calgary', country: 'Canada',
    restaurant_name: 'Ho Won Restaurant',
    dish_name: 'Chicken Fried Rice',
    dish_category: 'meat_based',
    price_cad: 15.34, tier: 'mid_tier',
    source_url: 'https://www.doordash.com/store/ho-won-restaurant-calgary-43618/',
    source_type: 'delivery_app', confidence_score: 0.82,
    notes: '115 2 Ave SE #2, Calgary (Chinatown).',
  },
  {
    city: 'Calgary', country: 'Canada',
    restaurant_name: 'Ho Won Restaurant',
    dish_name: 'Special Fried Rice',
    dish_category: 'house_special',
    price_cad: 15.34, tier: 'mid_tier',
    source_url: 'https://www.doordash.com/store/ho-won-restaurant-calgary-43618/',
    source_type: 'delivery_app', confidence_score: 0.82,
    notes: '115 2 Ave SE #2, Calgary (Chinatown).',
  },

  // ── Harvest Garden — BASELINE entries ────────────────────────────────────
  {
    city: 'Calgary', country: 'Canada',
    restaurant_name: 'Harvest Garden',
    dish_name: 'Mixed Vegetable Fried Rice',
    dish_category: 'vegetable',
    price_cad: 13.50, tier: 'low_tier',
    source_url: 'https://order.harvestgardencalgary.com/order/main-menu/menu',
    source_type: 'official_ordering_page', confidence_score: 0.92,
    notes: '116, 40 Country Hills Landing NW, Calgary. Verified May 2026.',
  },
  {
    city: 'Calgary', country: 'Canada',
    restaurant_name: 'Harvest Garden',
    dish_name: 'Mushroom Fried Rice',
    dish_category: 'vegetable',
    price_cad: 13.50, tier: 'low_tier',
    source_url: 'https://order.harvestgardencalgary.com/order/main-menu/menu',
    source_type: 'official_ordering_page', confidence_score: 0.92,
    notes: '116, 40 Country Hills Landing NW, Calgary.',
  },
  {
    city: 'Calgary', country: 'Canada',
    restaurant_name: 'Harvest Garden',
    dish_name: 'Chicken Fried Rice',
    dish_category: 'meat_based',
    price_cad: 13.50, tier: 'low_tier',
    source_url: 'https://order.harvestgardencalgary.com/order/main-menu/menu',
    source_type: 'official_ordering_page', confidence_score: 0.90,
    notes: '116, 40 Country Hills Landing NW, Calgary.',
  },
  {
    city: 'Calgary', country: 'Canada',
    restaurant_name: 'Harvest Garden',
    dish_name: 'House Special Fried Rice',
    dish_category: 'house_special',
    price_cad: 14.50, tier: 'low_tier',
    source_url: 'https://order.harvestgardencalgary.com/order/main-menu/menu',
    source_type: 'official_ordering_page', confidence_score: 0.90,
    notes: '116, 40 Country Hills Landing NW, Calgary.',
  },
  {
    city: 'Calgary', country: 'Canada',
    restaurant_name: 'Harvest Garden',
    dish_name: 'Seafood Fried Rice',
    dish_category: 'seafood',
    price_cad: 16.99, tier: 'mid_tier',
    source_url: 'https://order.harvestgardencalgary.com/order/main-menu/menu',
    source_type: 'official_ordering_page', confidence_score: 0.88,
    notes: '116, 40 Country Hills Landing NW, Calgary.',
  },

  // ── King's Chinese Foods ──────────────────────────────────────────────────
  {
    city: 'Calgary', country: 'Canada',
    restaurant_name: "King's Chinese Foods",
    dish_name: 'Chicken Fried Rice',
    dish_category: 'meat_based',
    price_cad: 13.95, tier: 'low_tier',
    source_url: 'https://kingschinesefoods.com/97-chicken-fried-rice/',
    source_type: 'official_menu', confidence_score: 0.90,
    notes: '1050 17 Ave SW, Calgary. Verified May 2026.',
  },

  // ══════════════════════════════════════════════════════════════════════════
  // EDMONTON, AB, CANADA  (all CAD — expanded baselines, updated Sweet Mango)
  // ══════════════════════════════════════════════════════════════════════════

  // ── Yummy Kitchen ─────────────────────────────────────────────────────────
  {
    city: 'Edmonton', country: 'Canada',
    restaurant_name: 'Yummy Kitchen',
    dish_name: 'Egg Fried Rice',
    dish_category: 'basic',
    price_cad: 14.00, tier: 'low_tier',
    source_url: 'https://order.yummykitchenedmonton.com/order/main-menu/fried-rice',
    source_type: 'official_ordering_page', confidence_score: 0.92,
    notes: '20035 Lessard Rd NW, Edmonton.',
  },
  {
    city: 'Edmonton', country: 'Canada',
    restaurant_name: 'Yummy Kitchen',
    dish_name: 'Vegetables Fried Rice',
    dish_category: 'vegetable',
    price_cad: 14.00, tier: 'low_tier',
    source_url: 'https://order.yummykitchenedmonton.com/order/main-menu/fried-rice',
    source_type: 'official_ordering_page', confidence_score: 0.92,
    notes: '20035 Lessard Rd NW, Edmonton.',
  },
  {
    city: 'Edmonton', country: 'Canada',
    restaurant_name: 'Yummy Kitchen',
    dish_name: 'Seafood Fried Rice',
    dish_category: 'seafood',
    price_cad: 19.50, tier: 'mid_tier',
    source_url: 'https://order.yummykitchenedmonton.com/order/main-menu/fried-rice',
    source_type: 'official_ordering_page', confidence_score: 0.92,
    notes: '20035 Lessard Rd NW, Edmonton.',
  },

  // ── Szechuan Sweet Mango ──────────────────────────────────────────────────
  {
    city: 'Edmonton', country: 'Canada',
    restaurant_name: 'Szechuan Sweet Mango',
    dish_name: 'Mixed Veggie Egg Fried Rice',
    dish_category: 'vegetable',
    price_cad: 14.95, tier: 'low_tier',
    source_url: 'https://order.szechuanstirfryab.com/order/chinese-menu/fried-rice',
    source_type: 'official_ordering_page', confidence_score: 0.92,
    notes: '9120 82 Ave NW, Edmonton.',
  },
  {
    city: 'Edmonton', country: 'Canada',
    restaurant_name: 'Szechuan Sweet Mango',
    dish_name: 'Chicken Fried Rice',
    dish_category: 'meat_based',
    price_cad: 14.95, tier: 'low_tier',
    source_url: 'https://order.szechuanstirfryab.com/order/chinese-menu/fried-rice',
    source_type: 'official_ordering_page', confidence_score: 0.90,
    notes: '9120 82 Ave NW, Edmonton.',
  },
  {
    city: 'Edmonton', country: 'Canada',
    restaurant_name: 'Szechuan Sweet Mango',
    dish_name: 'Special Fried Rice',
    dish_category: 'house_special',
    price_cad: 16.95, tier: 'mid_tier',
    source_url: 'https://order.szechuanstirfryab.com/order/chinese-menu/fried-rice',
    source_type: 'official_ordering_page', confidence_score: 0.90,
    notes: '9120 82 Ave NW, Edmonton.',
  },

  // ── Rice Paper Edmonton ───────────────────────────────────────────────────
  {
    city: 'Edmonton', country: 'Canada',
    restaurant_name: 'Rice Paper Edmonton',
    dish_name: "Chef's Special Fried Rice",
    dish_category: 'house_special',
    price_cad: 17.50, tier: 'mid_tier',
    source_url: 'https://ricepaperedmonton.ca/',
    source_type: 'official_menu', confidence_score: 0.90,
    notes: 'West Edmonton. Shrimp, BBQ Pork, Eggs & Peas.',
  },
  {
    city: 'Edmonton', country: 'Canada',
    restaurant_name: 'Rice Paper Edmonton',
    dish_name: 'Beef Fried Rice',
    dish_category: 'meat_based',
    price_cad: 16.50, tier: 'mid_tier',
    source_url: 'https://ricepaperedmonton.ca/',
    source_type: 'official_menu', confidence_score: 0.90,
    notes: 'West Edmonton.',
  },

  // ── Jin's Chinese Cuisine ─────────────────────────────────────────────────
  {
    city: 'Edmonton', country: 'Canada',
    restaurant_name: "Jin's Chinese Cuisine",
    dish_name: 'Egg Fried Rice',
    dish_category: 'basic',
    price_cad: 13.19, tier: 'low_tier',
    source_url: 'https://jinschinesecuisine.com/58-egg-fried-rice/',
    source_type: 'official_menu', confidence_score: 0.88,
    notes: '11828 103 St NW, Edmonton.',
  },

  // ── Harvest Chinese Restaurant ────────────────────────────────────────────
  {
    city: 'Edmonton', country: 'Canada',
    restaurant_name: 'Harvest Chinese Restaurant',
    dish_name: 'Mixed Vegetable Fried Rice',
    dish_category: 'vegetable',
    price_cad: 12.95, tier: 'low_tier',
    source_url: 'https://harvestchinese-restaurant.com/54-mixed-vegetable-fried-rice/',
    source_type: 'official_menu', confidence_score: 0.88,
    notes: '9010-75 St, Edmonton.',
  },

  // ══════════════════════════════════════════════════════════════════════════
  // NEW YORK, NY, USA  (USD × 1.39 — expanded from 2 to 13 entries)
  // ══════════════════════════════════════════════════════════════════════════

  // ── Food King (Hell's Kitchen, Manhattan) ─────────────────────────────────
  {
    city: 'New York', country: 'United States',
    restaurant_name: 'Food King',
    dish_name: 'Vegetable Fried Rice (Large)',
    dish_category: 'vegetable',
    price_cad: usd(9.50),
    local_price: 9.50, local_currency: 'USD', exchange_rate_used: USD_TO_CAD,
    tier: 'low_tier',
    source_url: 'https://www.foodkingnyc.com/order/main-menu/fried-rice',
    source_type: 'official_ordering_page', confidence_score: 0.90,
    notes: '10th Ave & W 43rd St, Hell\'s Kitchen, Manhattan.',
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
    source_type: 'official_ordering_page', confidence_score: 0.90,
    notes: '10th Ave & W 43rd St, Hell\'s Kitchen, Manhattan.',
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
    source_url: 'https://www.happyhothunanny.com/order/main-menu/noodle-rice-noodle-rice/47b-fried-rice-w-egg',
    source_type: 'official_ordering_page', confidence_score: 0.90,
    notes: '969 Amsterdam Ave, Upper West Side, Manhattan.',
  },
  {
    city: 'New York', country: 'United States',
    restaurant_name: 'Happy Hot Hunan',
    dish_name: 'Fried Rice (Chicken)',
    dish_category: 'meat_based',
    price_cad: usd(13.55),
    local_price: 13.55, local_currency: 'USD', exchange_rate_used: USD_TO_CAD,
    tier: 'mid_tier',
    source_url: 'https://www.happyhothunanny.com/order/main-menu/noodle-rice-noodle-rice/47b-fried-rice-w-egg',
    source_type: 'official_ordering_page', confidence_score: 0.90,
    notes: '969 Amsterdam Ave, Upper West Side, Manhattan.',
  },
  {
    city: 'New York', country: 'United States',
    restaurant_name: 'Happy Hot Hunan',
    dish_name: 'Yeung Chow Fried Rice',
    dish_category: 'house_special',
    price_cad: usd(13.95),
    local_price: 13.95, local_currency: 'USD', exchange_rate_used: USD_TO_CAD,
    tier: 'mid_tier',
    source_url: 'https://www.happyhothunanny.com/order/main-menu/noodle-rice-noodle-rice/47b-fried-rice-w-egg',
    source_type: 'official_ordering_page', confidence_score: 0.90,
    notes: '969 Amsterdam Ave, Upper West Side, Manhattan.',
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
    source_url: 'https://menupages.com/no1-chinese-restaurant-manhattan/10-s-william-st-new-york',
    source_type: 'third_party_menu', confidence_score: 0.72,
    notes: '10 S William St, Financial District, Manhattan.',
  },
  {
    city: 'New York', country: 'United States',
    restaurant_name: 'No.1 Chinese Restaurant',
    dish_name: 'Egg Fried Rice',
    dish_category: 'basic',
    price_cad: usd(13.00),
    local_price: 13.00, local_currency: 'USD', exchange_rate_used: USD_TO_CAD,
    tier: 'mid_tier',
    source_url: 'https://menupages.com/no1-chinese-restaurant-manhattan/10-s-william-st-new-york',
    source_type: 'third_party_menu', confidence_score: 0.72,
    notes: '10 S William St, Financial District, Manhattan.',
  },
  {
    city: 'New York', country: 'United States',
    restaurant_name: 'No.1 Chinese Restaurant',
    dish_name: 'Traditional Fried Rice',
    dish_category: 'house_special',
    price_cad: usd(16.00),
    local_price: 16.00, local_currency: 'USD', exchange_rate_used: USD_TO_CAD,
    tier: 'mid_tier',
    source_url: 'https://menupages.com/no1-chinese-restaurant-manhattan/10-s-william-st-new-york',
    source_type: 'third_party_menu', confidence_score: 0.70,
    notes: '10 S William St, Financial District. Choice of chicken/pork/shrimp/veg.',
  },
  {
    city: 'New York', country: 'United States',
    restaurant_name: 'No.1 Chinese Restaurant',
    dish_name: 'Yong Chow Fried Rice',
    dish_category: 'house_special',
    price_cad: usd(18.00),
    local_price: 18.00, local_currency: 'USD', exchange_rate_used: USD_TO_CAD,
    tier: 'high_end',
    source_url: 'https://menupages.com/no1-chinese-restaurant-manhattan/10-s-william-st-new-york',
    source_type: 'third_party_menu', confidence_score: 0.70,
    notes: '10 S William St, Financial District. Chicken, roast pork, shrimp.',
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

  // ══════════════════════════════════════════════════════════════════════════
  // LOS ANGELES, CA, USA  (USD × 1.39 — adds Fried Rice Express)
  // ══════════════════════════════════════════════════════════════════════════

  // ── Yang Chow (Chinatown LA) ──────────────────────────────────────────────
  {
    city: 'Los Angeles', country: 'United States',
    restaurant_name: 'Yang Chow',
    dish_name: 'Vegetable Fried Rice 素菜炒饭',
    dish_category: 'vegetable',
    price_cad: usd(16.25),
    local_price: 16.25, local_currency: 'USD', exchange_rate_used: USD_TO_CAD,
    tier: 'mid_tier',
    source_url: 'https://yangchow.com/menu/15898409',
    source_type: 'official_menu', confidence_score: 0.92,
    notes: '819 N Broadway, Chinatown LA. Established 1977.',
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
    notes: '1828 Marengo St, Boyle Heights, East LA. Est. 1984. allmenus.com listing; verify for current pricing.',
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

  // ══════════════════════════════════════════════════════════════════════════
  // CHICAGO, IL, USA  (USD × 1.39 — Tony's resized to Large; Lao Sze Chuan added)
  // ══════════════════════════════════════════════════════════════════════════

  // ── Tony's Chinese & American (Grand Ave, NW Chicago) ────────────────────
  {
    city: 'Chicago', country: 'United States',
    restaurant_name: "Tony's Chinese & American",
    dish_name: 'Egg Fried Rice (Large)',
    dish_category: 'basic',
    price_cad: usd(8.19),
    local_price: 8.19, local_currency: 'USD', exchange_rate_used: USD_TO_CAD,
    tier: 'low_tier',
    source_url: 'https://www.tonyschinesechicago.com/order/main-menu/famous-fried-rice',
    source_type: 'official_ordering_page', confidence_score: 0.92,
    notes: '6347 W Grand Ave, Chicago. Large = standard meal size.',
  },
  {
    city: 'Chicago', country: 'United States',
    restaurant_name: "Tony's Chinese & American",
    dish_name: 'Vegetable Fried Rice (Large)',
    dish_category: 'vegetable',
    price_cad: usd(9.79),
    local_price: 9.79, local_currency: 'USD', exchange_rate_used: USD_TO_CAD,
    tier: 'low_tier',
    source_url: 'https://www.tonyschinesechicago.com/order/main-menu/famous-fried-rice',
    source_type: 'official_ordering_page', confidence_score: 0.92,
    notes: '6347 W Grand Ave, Chicago.',
  },
  {
    city: 'Chicago', country: 'United States',
    restaurant_name: "Tony's Chinese & American",
    dish_name: 'BBQ Pork Fried Rice (Large)',
    dish_category: 'meat_based',
    price_cad: usd(10.56),
    local_price: 10.56, local_currency: 'USD', exchange_rate_used: USD_TO_CAD,
    tier: 'low_tier',
    source_url: 'https://www.tonyschinesechicago.com/order/main-menu/famous-fried-rice',
    source_type: 'official_ordering_page', confidence_score: 0.92,
    notes: '6347 W Grand Ave, Chicago.',
  },
  {
    city: 'Chicago', country: 'United States',
    restaurant_name: "Tony's Chinese & American",
    dish_name: "Tony's Special Fried Rice (XLarge)",
    dish_category: 'house_special',
    price_cad: usd(20.35),
    local_price: 20.35, local_currency: 'USD', exchange_rate_used: USD_TO_CAD,
    tier: 'high_end',
    source_url: 'https://www.tonyschinesechicago.com/order/main-menu/famous-fried-rice',
    source_type: 'official_ordering_page', confidence_score: 0.92,
    notes: '6347 W Grand Ave. Shrimp, chicken, BBQ pork, beef — XLarge size.',
  },

  // ── Lao Sze Chuan (Michigan Ave, Chicago) ─────────────────────────────────
  {
    city: 'Chicago', country: 'United States',
    restaurant_name: 'Lao Sze Chuan',
    dish_name: 'Vegetable Fried Rice (with Egg)',
    dish_category: 'vegetable',
    price_cad: usd(14.95),
    local_price: 14.95, local_currency: 'USD', exchange_rate_used: USD_TO_CAD,
    tier: 'low_tier',
    source_url: 'https://www.laoszechuanchicago.com/order/main-menu/-fried-rice-noodle',
    source_type: 'official_ordering_page', confidence_score: 0.92,
    notes: '520 N Michigan Ave, Chicago (Magnificent Mile).',
  },
  {
    city: 'Chicago', country: 'United States',
    restaurant_name: 'Lao Sze Chuan',
    dish_name: 'Chicken Fried Rice (with Egg)',
    dish_category: 'meat_based',
    price_cad: usd(14.95),
    local_price: 14.95, local_currency: 'USD', exchange_rate_used: USD_TO_CAD,
    tier: 'low_tier',
    source_url: 'https://www.laoszechuanchicago.com/order/main-menu/-fried-rice-noodle',
    source_type: 'official_ordering_page', confidence_score: 0.92,
    notes: '520 N Michigan Ave, Chicago.',
  },
  {
    city: 'Chicago', country: 'United States',
    restaurant_name: 'Lao Sze Chuan',
    dish_name: 'Yang Zhou Fried Rice',
    dish_category: 'house_special',
    price_cad: usd(17.95),
    local_price: 17.95, local_currency: 'USD', exchange_rate_used: USD_TO_CAD,
    tier: 'mid_tier',
    source_url: 'https://www.laoszechuanchicago.com/order/main-menu/-fried-rice-noodle',
    source_type: 'official_ordering_page', confidence_score: 0.90,
    notes: '520 N Michigan Ave, Chicago.',
  },

  // ── Big Bowl (River North, Chicago) ───────────────────────────────────────
  {
    city: 'Chicago', country: 'United States',
    restaurant_name: 'Big Bowl',
    dish_name: 'Teriyaki Chicken Fried Rice',
    dish_category: 'meat_based',
    price_cad: usd(19.95),
    local_price: 19.95, local_currency: 'USD', exchange_rate_used: USD_TO_CAD,
    tier: 'high_end',
    source_url: 'https://www.bigbowl.com/menu',
    source_type: 'official_menu', confidence_score: 0.92,
    notes: '159½ W Erie St, River North, Chicago. Upscale Asian casual.',
  },
  {
    city: 'Chicago', country: 'United States',
    restaurant_name: 'Big Bowl',
    dish_name: 'Teriyaki Shrimp Fried Rice',
    dish_category: 'seafood',
    price_cad: usd(21.95),
    local_price: 21.95, local_currency: 'USD', exchange_rate_used: USD_TO_CAD,
    tier: 'high_end',
    source_url: 'https://www.bigbowl.com/menu',
    source_type: 'official_menu', confidence_score: 0.92,
    notes: '159½ W Erie St, River North, Chicago.',
  },

  // ══════════════════════════════════════════════════════════════════════════
  // HOUSTON, TX, USA  (USD × 1.39 — adds P. King and Hunan's Bistro)
  // ══════════════════════════════════════════════════════════════════════════

  // ── China Kitchen (North Houston) ─────────────────────────────────────────
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
    notes: '12100 Veterans Memorial Dr J, North Houston.',
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
    notes: '12100 Veterans Memorial Dr J, North Houston.',
  },

  // ── Sinh Sinh (Bellaire Blvd, Houston Chinatown) ──────────────────────────
  {
    city: 'Houston', country: 'United States',
    restaurant_name: 'Sinh Sinh Restaurant',
    dish_name: 'BBQ Pork Fried Rice',
    dish_category: 'meat_based',
    price_cad: usd(7.45),
    local_price: 7.45, local_currency: 'USD', exchange_rate_used: USD_TO_CAD,
    tier: 'low_tier',
    source_url: 'https://www.allmenus.com/tx/houston/48745-sinh-sinh/menu/',
    source_type: 'third_party_menu', confidence_score: 0.78,
    notes: '9788 Bellaire Blvd, Houston Chinatown (Asia Town).',
  },
  {
    city: 'Houston', country: 'United States',
    restaurant_name: 'Sinh Sinh Restaurant',
    dish_name: 'Deluxe Seafood Fried Rice',
    dish_category: 'seafood',
    price_cad: usd(12.95),
    local_price: 12.95, local_currency: 'USD', exchange_rate_used: USD_TO_CAD,
    tier: 'mid_tier',
    source_url: 'https://www.allmenus.com/tx/houston/48745-sinh-sinh/menu/',
    source_type: 'third_party_menu', confidence_score: 0.78,
    notes: '9788 Bellaire Blvd, Houston Chinatown.',
  },

  // ── P. King (Bellaire, Houston) ───────────────────────────────────────────
  {
    city: 'Houston', country: 'United States',
    restaurant_name: 'P. King Chinese Restaurant',
    dish_name: 'Vegetable Fried Rice',
    dish_category: 'vegetable',
    price_cad: usd(12.25),
    local_price: 12.25, local_currency: 'USD', exchange_rate_used: USD_TO_CAD,
    tier: 'mid_tier',
    source_url: 'https://www.pkingbellairetx.com/order/main-menu/menu',
    source_type: 'official_ordering_page', confidence_score: 0.90,
    notes: '5409 S Rice Ave, Bellaire, TX (Houston Chinatown corridor). Verified May 2026.',
  },
  {
    city: 'Houston', country: 'United States',
    restaurant_name: 'P. King Chinese Restaurant',
    dish_name: 'House Special Fried Rice',
    dish_category: 'house_special',
    price_cad: usd(13.25),
    local_price: 13.25, local_currency: 'USD', exchange_rate_used: USD_TO_CAD,
    tier: 'mid_tier',
    source_url: 'https://www.pkingbellairetx.com/order/main-menu/menu',
    source_type: 'official_ordering_page', confidence_score: 0.90,
    notes: '5409 S Rice Ave, Bellaire, TX.',
  },

  // ── Hunan's Bistro & Sushi (Bellaire Blvd, Houston) ───────────────────────
  {
    city: 'Houston', country: 'United States',
    restaurant_name: "Hunan's Bistro & Sushi",
    dish_name: 'Vegetables Fried Rice',
    dish_category: 'vegetable',
    price_cad: usd(13.00),
    local_price: 13.00, local_currency: 'USD', exchange_rate_used: USD_TO_CAD,
    tier: 'mid_tier',
    source_url: 'https://www.hunanstx.com/order/chinese-menu/fried-ricee/house-special-fried-rice',
    source_type: 'official_ordering_page', confidence_score: 0.90,
    notes: '3835 Bellaire Blvd, Houston. Verified May 2026.',
  },
  {
    city: 'Houston', country: 'United States',
    restaurant_name: "Hunan's Bistro & Sushi",
    dish_name: 'Chicken Fried Rice',
    dish_category: 'meat_based',
    price_cad: usd(13.45),
    local_price: 13.45, local_currency: 'USD', exchange_rate_used: USD_TO_CAD,
    tier: 'mid_tier',
    source_url: 'https://www.hunanstx.com/order/chinese-menu/fried-ricee/house-special-fried-rice',
    source_type: 'official_ordering_page', confidence_score: 0.90,
    notes: '3835 Bellaire Blvd, Houston.',
  },
  {
    city: 'Houston', country: 'United States',
    restaurant_name: "Hunan's Bistro & Sushi",
    dish_name: 'House Special Fried Rice',
    dish_category: 'house_special',
    price_cad: usd(14.00),
    local_price: 14.00, local_currency: 'USD', exchange_rate_used: USD_TO_CAD,
    tier: 'low_tier',
    source_url: 'https://www.hunanstx.com/order/chinese-menu/fried-ricee/house-special-fried-rice',
    source_type: 'official_ordering_page', confidence_score: 0.90,
    notes: '3835 Bellaire Blvd, Houston.',
  },

  // ══════════════════════════════════════════════════════════════════════════
  // PHOENIX, AZ, USA  (USD × 1.39 — adds China Restaurant AZ)
  // ══════════════════════════════════════════════════════════════════════════

  // ── Yan's Chinese Food (West Phoenix) ────────────────────────────────────
  {
    city: 'Phoenix', country: 'United States',
    restaurant_name: "Yan's Chinese Food",
    dish_name: 'Egg Fried Rice',
    dish_category: 'basic',
    price_cad: usd(12.00),
    local_price: 12.00, local_currency: 'USD', exchange_rate_used: USD_TO_CAD,
    tier: 'mid_tier',
    source_url: 'https://www.yansphoenix.com/order/main-menu/fried-rice/egg-fried-rice',
    source_type: 'official_ordering_page', confidence_score: 0.90,
    notes: '9140 W Thomas Rd #B103, West Phoenix.',
  },
  {
    city: 'Phoenix', country: 'United States',
    restaurant_name: "Yan's Chinese Food",
    dish_name: 'Seafood Fried Rice',
    dish_category: 'seafood',
    price_cad: usd(17.50),
    local_price: 17.50, local_currency: 'USD', exchange_rate_used: USD_TO_CAD,
    tier: 'mid_tier',
    source_url: 'https://www.yansphoenix.com/order/main-menu/fried-rice/egg-fried-rice',
    source_type: 'official_ordering_page', confidence_score: 0.90,
    notes: '9140 W Thomas Rd #B103, West Phoenix.',
  },

  // ── The Wild Thaiger (Midtown Phoenix) ───────────────────────────────────
  {
    city: 'Phoenix', country: 'United States',
    restaurant_name: 'The Wild Thaiger',
    dish_name: 'Fire Wok-ker (Thai Hot Basil Fried Rice)',
    dish_category: 'house_special',
    price_cad: usd(12.95),
    local_price: 12.95, local_currency: 'USD', exchange_rate_used: USD_TO_CAD,
    tier: 'mid_tier',
    source_url: 'https://www.thewildthaiger.com/menu',
    source_type: 'official_menu', confidence_score: 0.90,
    notes: '2631 N Central Ave, Midtown Phoenix. Thai fried rice.',
  },
  {
    city: 'Phoenix', country: 'United States',
    restaurant_name: 'The Wild Thaiger',
    dish_name: 'Tropical Fried Rice',
    dish_category: 'house_special',
    price_cad: usd(12.95),
    local_price: 12.95, local_currency: 'USD', exchange_rate_used: USD_TO_CAD,
    tier: 'mid_tier',
    source_url: 'https://www.thewildthaiger.com/menu',
    source_type: 'official_menu', confidence_score: 0.90,
    notes: '2631 N Central Ave, Midtown Phoenix. Pineapple, cashews, golden raisins.',
  },

  // ── China Restaurant (South Mountain, Phoenix) ───────────────────────────
  {
    city: 'Phoenix', country: 'United States',
    restaurant_name: 'China Restaurant',
    dish_name: 'Egg Fried Rice',
    dish_category: 'basic',
    price_cad: usd(7.95),
    local_price: 7.95, local_currency: 'USD', exchange_rate_used: USD_TO_CAD,
    tier: 'low_tier',
    source_url: 'https://www.chinarestaurantaz.com/order/main/fried-rice',
    source_type: 'official_ordering_page', confidence_score: 0.90,
    notes: '4709 E Southern Ave, Phoenix, AZ 85042. Verified May 2026.',
  },
  {
    city: 'Phoenix', country: 'United States',
    restaurant_name: 'China Restaurant',
    dish_name: 'Chicken Fried Rice',
    dish_category: 'meat_based',
    price_cad: usd(8.95),
    local_price: 8.95, local_currency: 'USD', exchange_rate_used: USD_TO_CAD,
    tier: 'low_tier',
    source_url: 'https://www.chinarestaurantaz.com/order/main/fried-rice',
    source_type: 'official_ordering_page', confidence_score: 0.90,
    notes: '4709 E Southern Ave, Phoenix.',
  },
  {
    city: 'Phoenix', country: 'United States',
    restaurant_name: 'China Restaurant',
    dish_name: 'House Fried Rice',
    dish_category: 'house_special',
    price_cad: usd(10.59),
    local_price: 10.59, local_currency: 'USD', exchange_rate_used: USD_TO_CAD,
    tier: 'low_tier',
    source_url: 'https://www.chinarestaurantaz.com/order/main/fried-rice',
    source_type: 'official_ordering_page', confidence_score: 0.90,
    notes: '4709 E Southern Ave, Phoenix.',
  },
]

// ── City→Country mapping ──────────────────────────────────────────────────
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
  const label = dataQualityLabel(rows.length)

  if (baselinePrices.length > 0) {
    const mid = Math.floor(baselinePrices.length / 2)
    const median = baselinePrices.length % 2 === 1
      ? baselinePrices[mid]
      : (baselinePrices[mid - 1] + baselinePrices[mid]) / 2

    const avgConfidence = baselineRows.reduce((s, r) => s + r.confidence_score, 0) / baselineRows.length

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
        data_quality_label: label,
        price_source: `Baseline median from ${baselineRows.length} manually verified entries`,
        price_updated_at: NOW,
        confidence_score: Number(avgConfidence.toFixed(2)),
      })
      .eq('city', city)

    if (cityErr) {
      console.error(`  City update failed: ${cityErr.message}`)
    } else {
      console.log(`  ✓ City updated — baseline median: CA$${median.toFixed(2)} (${baselineRows.length} baseline entries)`)
      console.log(`    Market avg (5% trimmed): CA$${marketAvg.toFixed(2)} (${trimK} removed each end)`)
      console.log(`    Market range: CA$${allPrices[0].toFixed(2)} – CA$${allPrices[allPrices.length - 1].toFixed(2)}`)
      console.log(`    Data quality: ${label}`)
    }
  } else {
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
      console.log(`\n─── ${city} — no entries, skipping ───`)
      continue
    }
    await seedCity(city, cityEntries)
  }
  console.log('\n✓ All cities done.')
}

run().catch(console.error)
