/**
 * Seed script v5 — More restaurants for existing cities + 6 new East Asian cities.
 *
 * Run with:
 *   export $(grep -v '^#' .env.local | xargs) && npx tsx scripts/seed-update-v5.ts
 *
 * EXISTING CITIES (full reseed):
 *   New York  — +Great NY Noodletown (confirmed $18.95 plain, $14.50 chicken, $15.95 young chow)
 *               +Hwa Yuan Szechuan (confirmed $22 veg, $22 kung po chicken)
 *   Los Angeles — +Din Tai Fung Century City (confirmed $18 veg&mushroom, $18 chicken, $19.50 shrimp)
 *   Chicago   — +Phoenix Restaurant Chinatown ($13.50 egg, $15.95 house special)
 *               +Won Kow Restaurant ($10.50 egg, $12.50 chicken)
 *
 * NEW CITIES:
 *   Singapore  — hawker stalls (SGD $4.50–5) through Crystal Jade/Paradise Dynasty/Jumbo Seafood
 *   Tokyo      — budget chains (¥480 Hidakaya, ¥550 Gyoza no Ohsho) through Din Tai Fung
 *   Osaka      — Gyoza no Ohsho, Namba casual, Kani Chahan no Mise, Din Tai Fung
 *   Beijing    — Qingfeng Baozi (CNY 12) through Da Dong (CNY 88)
 *   Shanghai   — local restaurants (CNY 16) through Fu 1088 (CNY 118)
 *   Seoul      — Korean-Chinese 한중식당 (₩9,000) through premium hotel Chinese (₩30,000)
 *
 * Exchange rates (May 2026):
 *   USD → CAD  1.39    SGD → CAD  1.08
 *   JPY → CAD  0.00869 CNY → CAD  0.203
 *   KRW → CAD  0.00091
 *
 * Sources verified May 2026.
 */

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

const NOW = new Date().toISOString()

// ── Exchange rate helpers ─────────────────────────────────────────────────────
const USD_TO_CAD = 1.39
const SGD_TO_CAD = 1.08
const JPY_TO_CAD = 0.00869
const CNY_TO_CAD = 0.203
const KRW_TO_CAD = 0.00091

const r = (n: number) => Math.round(n * 100) / 100
const usd = (p: number) => r(p * USD_TO_CAD)
const sgd = (p: number) => r(p * SGD_TO_CAD)
const jpy = (p: number) => r(p * JPY_TO_CAD)
const cny = (p: number) => r(p * CNY_TO_CAD)
const krw = (p: number) => r(p * KRW_TO_CAD)

// ── City metadata for ensureCity ─────────────────────────────────────────────
const CITY_META: Record<string, { country: string; region: string; population: string }> = {
  Singapore: { country: 'Singapore',   region: 'Southeast Asia', population: '5917600' },
  Tokyo:     { country: 'Japan',        region: 'East Asia',      population: '13960000' },
  Osaka:     { country: 'Japan',        region: 'East Asia',      population: '2752000' },
  Beijing:   { country: 'China',        region: 'East Asia',      population: '21540000' },
  Shanghai:  { country: 'China',        region: 'East Asia',      population: '24870000' },
  Seoul:     { country: 'South Korea',  region: 'East Asia',      population: '9776000' },
}

function trimmedMean(sorted: number[], frac = 0.05): number {
  const n = sorted.length
  const k = Math.round(n * frac)
  const t = k > 0 ? sorted.slice(k, n - k) : sorted
  return t.reduce((s, p) => s + p, 0) / t.length
}

function dataQualityLabel(n: number): string {
  if (n >= 15) return 'High confidence'
  if (n >= 10) return 'Strong'
  if (n >= 5)  return 'Moderate'
  if (n >= 3)  return 'Limited'
  return 'Preliminary'
}

type Entry = {
  city: string; country: string
  restaurant_name: string; dish_name: string
  dish_category: 'basic'|'vegetable'|'meat_based'|'seafood'|'house_special'|'premium'
  price_cad: number; local_price: number; local_currency: string; exchange_rate_used: number
  tier: 'low_tier'|'mid_tier'|'high_end'|'premium'
  source_url: string; source_type: string; confidence_score: number; notes?: string
}

const ENTRIES: Entry[] = [

  // ══════════════════════════════════════════════════════════════════════════
  // NEW YORK — full reseed + Great NY Noodletown + Hwa Yuan
  // ══════════════════════════════════════════════════════════════════════════

  // ── Food King (Hell's Kitchen) ────────────────────────────────────────────
  { city:'New York', country:'United States', restaurant_name:'Food King',
    dish_name:'Vegetable Fried Rice (Large)', dish_category:'vegetable',
    price_cad:usd(9.75), local_price:9.75, local_currency:'USD', exchange_rate_used:USD_TO_CAD,
    tier:'low_tier', source_url:'https://www.foodkingnyc.com/order/main-menu/fried-rice',
    source_type:'official_ordering_page', confidence_score:0.92,
    notes:'694 10th Ave, Hell\'s Kitchen, Manhattan.' },
  { city:'New York', country:'United States', restaurant_name:'Food King',
    dish_name:'House Special Fried Rice (Large)', dish_category:'house_special',
    price_cad:usd(11.50), local_price:11.50, local_currency:'USD', exchange_rate_used:USD_TO_CAD,
    tier:'mid_tier', source_url:'https://www.foodkingnyc.com/order/main-menu/fried-rice',
    source_type:'official_ordering_page', confidence_score:0.92,
    notes:'694 10th Ave, Hell\'s Kitchen, Manhattan.' },

  // ── Happy Hot Hunan (Upper West Side) ─────────────────────────────────────
  { city:'New York', country:'United States', restaurant_name:'Happy Hot Hunan',
    dish_name:'Egg Fried Rice', dish_category:'basic',
    price_cad:usd(12.55), local_price:12.55, local_currency:'USD', exchange_rate_used:USD_TO_CAD,
    tier:'mid_tier', source_url:'https://www.happyhothunan.com/menu',
    source_type:'official_menu', confidence_score:0.90, notes:'2540 Broadway, Upper West Side.' },
  { city:'New York', country:'United States', restaurant_name:'Happy Hot Hunan',
    dish_name:'Fried Rice (Chicken)', dish_category:'meat_based',
    price_cad:usd(13.55), local_price:13.55, local_currency:'USD', exchange_rate_used:USD_TO_CAD,
    tier:'mid_tier', source_url:'https://www.happyhothunan.com/menu',
    source_type:'official_menu', confidence_score:0.90, notes:'2540 Broadway, Upper West Side.' },
  { city:'New York', country:'United States', restaurant_name:'Happy Hot Hunan',
    dish_name:'Yeung Chow Fried Rice', dish_category:'house_special',
    price_cad:usd(13.95), local_price:13.95, local_currency:'USD', exchange_rate_used:USD_TO_CAD,
    tier:'mid_tier', source_url:'https://www.happyhothunan.com/menu',
    source_type:'official_menu', confidence_score:0.90, notes:'2540 Broadway, Upper West Side.' },

  // ── No.1 Chinese Restaurant (Financial District) ──────────────────────────
  { city:'New York', country:'United States', restaurant_name:'No.1 Chinese Restaurant',
    dish_name:'Plain Fried Rice', dish_category:'basic',
    price_cad:usd(10.00), local_price:10.00, local_currency:'USD', exchange_rate_used:USD_TO_CAD,
    tier:'low_tier', source_url:'https://no1chinesenyc.com/menu',
    source_type:'official_menu', confidence_score:0.90, notes:'1 Whitehall St, Financial District.' },
  { city:'New York', country:'United States', restaurant_name:'No.1 Chinese Restaurant',
    dish_name:'Egg Fried Rice', dish_category:'basic',
    price_cad:usd(13.00), local_price:13.00, local_currency:'USD', exchange_rate_used:USD_TO_CAD,
    tier:'mid_tier', source_url:'https://no1chinesenyc.com/menu',
    source_type:'official_menu', confidence_score:0.90, notes:'1 Whitehall St, Financial District.' },
  { city:'New York', country:'United States', restaurant_name:'No.1 Chinese Restaurant',
    dish_name:'Traditional Fried Rice', dish_category:'house_special',
    price_cad:usd(16.00), local_price:16.00, local_currency:'USD', exchange_rate_used:USD_TO_CAD,
    tier:'mid_tier', source_url:'https://no1chinesenyc.com/menu',
    source_type:'official_menu', confidence_score:0.90, notes:'1 Whitehall St, Financial District.' },
  { city:'New York', country:'United States', restaurant_name:'No.1 Chinese Restaurant',
    dish_name:'Yong Chow Fried Rice', dish_category:'house_special',
    price_cad:usd(18.00), local_price:18.00, local_currency:'USD', exchange_rate_used:USD_TO_CAD,
    tier:'high_end', source_url:'https://no1chinesenyc.com/menu',
    source_type:'official_menu', confidence_score:0.90, notes:'1 Whitehall St, Financial District.' },

  // ── New Kissena (Flushing, Queens) ────────────────────────────────────────
  { city:'New York', country:'United States', restaurant_name:'New Kissena',
    dish_name:'Plain Fried Rice (Large)', dish_category:'basic',
    price_cad:usd(7.35), local_price:7.35, local_currency:'USD', exchange_rate_used:USD_TO_CAD,
    tier:'low_tier', source_url:'https://www.newkissenaflushing.com/order',
    source_type:'official_ordering_page', confidence_score:0.90, notes:'44-29 Kissena Blvd, Flushing, Queens.' },
  { city:'New York', country:'United States', restaurant_name:'New Kissena',
    dish_name:'Vegetable Fried Rice (Large)', dish_category:'vegetable',
    price_cad:usd(9.20), local_price:9.20, local_currency:'USD', exchange_rate_used:USD_TO_CAD,
    tier:'low_tier', source_url:'https://www.newkissenaflushing.com/order',
    source_type:'official_ordering_page', confidence_score:0.90, notes:'44-29 Kissena Blvd, Flushing, Queens.' },
  { city:'New York', country:'United States', restaurant_name:'New Kissena',
    dish_name:'Chicken Fried Rice (Large)', dish_category:'meat_based',
    price_cad:usd(10.10), local_price:10.10, local_currency:'USD', exchange_rate_used:USD_TO_CAD,
    tier:'low_tier', source_url:'https://www.newkissenaflushing.com/order',
    source_type:'official_ordering_page', confidence_score:0.90, notes:'44-29 Kissena Blvd, Flushing, Queens.' },
  { city:'New York', country:'United States', restaurant_name:'New Kissena',
    dish_name:'House Special Fried Rice (Large)', dish_category:'house_special',
    price_cad:usd(11.00), local_price:11.00, local_currency:'USD', exchange_rate_used:USD_TO_CAD,
    tier:'mid_tier', source_url:'https://www.newkissenaflushing.com/order',
    source_type:'official_ordering_page', confidence_score:0.90, notes:'44-29 Kissena Blvd, Flushing, Queens.' },

  // ── No. 1 Chinese Kitchen (Crown Heights, Brooklyn) ───────────────────────
  { city:'New York', country:'United States', restaurant_name:'No. 1 Chinese Kitchen',
    dish_name:'Plain Fried Rice (Quart)', dish_category:'basic',
    price_cad:usd(7.75), local_price:7.75, local_currency:'USD', exchange_rate_used:USD_TO_CAD,
    tier:'low_tier', source_url:'https://www.no1chinesekitchen-ny.com/order/main-menu/fried-rice',
    source_type:'official_ordering_page', confidence_score:0.92, notes:'661 Nostrand Ave, Crown Heights, Brooklyn.' },
  { city:'New York', country:'United States', restaurant_name:'No. 1 Chinese Kitchen',
    dish_name:'Vegetable Fried Rice (Quart)', dish_category:'vegetable',
    price_cad:usd(12.00), local_price:12.00, local_currency:'USD', exchange_rate_used:USD_TO_CAD,
    tier:'mid_tier', source_url:'https://www.no1chinesekitchen-ny.com/order/main-menu/fried-rice',
    source_type:'official_ordering_page', confidence_score:0.92, notes:'661 Nostrand Ave, Crown Heights, Brooklyn.' },
  { city:'New York', country:'United States', restaurant_name:'No. 1 Chinese Kitchen',
    dish_name:'Chicken Fried Rice (Quart)', dish_category:'meat_based',
    price_cad:usd(12.00), local_price:12.00, local_currency:'USD', exchange_rate_used:USD_TO_CAD,
    tier:'mid_tier', source_url:'https://www.no1chinesekitchen-ny.com/order/main-menu/fried-rice',
    source_type:'official_ordering_page', confidence_score:0.90, notes:'661 Nostrand Ave, Crown Heights, Brooklyn.' },
  { city:'New York', country:'United States', restaurant_name:'No. 1 Chinese Kitchen',
    dish_name:'House Special Fried Rice (Quart)', dish_category:'house_special',
    price_cad:usd(12.75), local_price:12.75, local_currency:'USD', exchange_rate_used:USD_TO_CAD,
    tier:'mid_tier', source_url:'https://www.no1chinesekitchen-ny.com/order/main-menu/fried-rice',
    source_type:'official_ordering_page', confidence_score:0.90, notes:'661 Nostrand Ave, Crown Heights, Brooklyn.' },
  { city:'New York', country:'United States', restaurant_name:'No. 1 Chinese Kitchen',
    dish_name:'Yang Chow Fried Rice (Quart)', dish_category:'house_special',
    price_cad:usd(13.25), local_price:13.25, local_currency:'USD', exchange_rate_used:USD_TO_CAD,
    tier:'mid_tier', source_url:'https://www.no1chinesekitchen-ny.com/order/main-menu/fried-rice',
    source_type:'official_ordering_page', confidence_score:0.90, notes:'661 Nostrand Ave, Crown Heights, Brooklyn.' },

  // ── Hop Lee Restaurant (Manhattan Chinatown) ──────────────────────────────
  { city:'New York', country:'United States', restaurant_name:'Hop Lee Restaurant',
    dish_name:'Egg Fried Rice', dish_category:'basic',
    price_cad:usd(10.95), local_price:10.95, local_currency:'USD', exchange_rate_used:USD_TO_CAD,
    tier:'mid_tier', source_url:'https://www.allmenus.com/ny/new-york/250130-hop-lee-restaurant/menu/',
    source_type:'third_party_menu', confidence_score:0.75,
    notes:'16 Mott St, Manhattan Chinatown. Est. 1978. Classic Cantonese.' },

  // ── Great N.Y. Noodletown (Manhattan Chinatown) — NEW ─────────────────────
  // Prices confirmed from greatnewyorknoodletown.com/menu (May 2026)
  { city:'New York', country:'United States', restaurant_name:'Great N.Y. Noodletown',
    dish_name:'Chicken Fried Rice', dish_category:'meat_based',
    price_cad:usd(14.50), local_price:14.50, local_currency:'USD', exchange_rate_used:USD_TO_CAD,
    tier:'mid_tier', source_url:'https://www.greatnewyorknoodletown.com/menu',
    source_type:'official_menu', confidence_score:0.93,
    notes:'28 Bowery, Manhattan Chinatown. Open since 1981. Tax included in prices.' },
  { city:'New York', country:'United States', restaurant_name:'Great N.Y. Noodletown',
    dish_name:'Plain Fried Rice', dish_category:'basic',
    price_cad:usd(18.95), local_price:18.95, local_currency:'USD', exchange_rate_used:USD_TO_CAD,
    tier:'high_end', source_url:'https://www.greatnewyorknoodletown.com/menu',
    source_type:'official_menu', confidence_score:0.93,
    notes:'28 Bowery, Manhattan Chinatown. Cantonese wok-fried. Tax included.' },
  { city:'New York', country:'United States', restaurant_name:'Great N.Y. Noodletown',
    dish_name:'Young Chow Fried Rice', dish_category:'house_special',
    price_cad:usd(15.95), local_price:15.95, local_currency:'USD', exchange_rate_used:USD_TO_CAD,
    tier:'mid_tier', source_url:'https://www.greatnewyorknoodletown.com/menu',
    source_type:'official_menu', confidence_score:0.93,
    notes:'28 Bowery, Manhattan Chinatown.' },

  // ── Hwa Yuan Szechuan (Manhattan Chinatown) — NEW ─────────────────────────
  // Prices confirmed from hwayuannyc.com/menu.html (May 2026)
  { city:'New York', country:'United States', restaurant_name:'Hwa Yuan Szechuan',
    dish_name:'Vegetable Fried Rice with Egg', dish_category:'vegetable',
    price_cad:usd(22.00), local_price:22.00, local_currency:'USD', exchange_rate_used:USD_TO_CAD,
    tier:'high_end', source_url:'https://hwayuannyc.com/menu.html',
    source_type:'official_menu', confidence_score:0.93,
    notes:'40 E Broadway, Manhattan Chinatown. Award-winning Sichuan. One of Chinatown\'s pricier spots.' },
  { city:'New York', country:'United States', restaurant_name:'Hwa Yuan Szechuan',
    dish_name:'Kung Po Chicken Fried Rice with Egg', dish_category:'meat_based',
    price_cad:usd(22.00), local_price:22.00, local_currency:'USD', exchange_rate_used:USD_TO_CAD,
    tier:'high_end', source_url:'https://hwayuannyc.com/menu.html',
    source_type:'official_menu', confidence_score:0.93,
    notes:'40 E Broadway, Manhattan Chinatown.' },

  // ══════════════════════════════════════════════════════════════════════════
  // LOS ANGELES — full reseed + Din Tai Fung Century City
  // ══════════════════════════════════════════════════════════════════════════

  { city:'Los Angeles', country:'United States', restaurant_name:'Yang Chow',
    dish_name:'Vegetable Fried Rice 素菜炒饭', dish_category:'vegetable',
    price_cad:usd(15.25), local_price:15.25, local_currency:'USD', exchange_rate_used:USD_TO_CAD,
    tier:'mid_tier', source_url:'https://yangchow.com/menu/80786060/100060023',
    source_type:'official_menu', confidence_score:0.95,
    notes:'819 N Broadway, Chinatown LA. Est. 1977.' },
  { city:'Los Angeles', country:'United States', restaurant_name:'Yang Chow',
    dish_name:'Yang Chow Fried Rice 扬州炒饭', dish_category:'house_special',
    price_cad:usd(17.25), local_price:17.25, local_currency:'USD', exchange_rate_used:USD_TO_CAD,
    tier:'mid_tier', source_url:'https://yangchow.com/menu/15898409',
    source_type:'official_menu', confidence_score:0.92, notes:'819 N Broadway, Chinatown LA.' },
  { city:'Los Angeles', country:'United States', restaurant_name:'Fried Rice Express',
    dish_name:'Mixed Vegetables Fried Rice', dish_category:'vegetable',
    price_cad:usd(6.95), local_price:6.95, local_currency:'USD', exchange_rate_used:USD_TO_CAD,
    tier:'low_tier', source_url:'https://www.allmenus.com/ca/los-angeles/351023-fried-rice-express/menu/',
    source_type:'third_party_menu', confidence_score:0.65,
    notes:'1828 Marengo St, Boyle Heights, East LA. Est. 1984.' },
  { city:'Los Angeles', country:'United States', restaurant_name:'Fried Rice Express',
    dish_name:'Chicken Fried Rice', dish_category:'meat_based',
    price_cad:usd(6.95), local_price:6.95, local_currency:'USD', exchange_rate_used:USD_TO_CAD,
    tier:'low_tier', source_url:'https://www.allmenus.com/ca/los-angeles/351023-fried-rice-express/menu/',
    source_type:'third_party_menu', confidence_score:0.65, notes:'1828 Marengo St, Boyle Heights.' },
  { city:'Los Angeles', country:'United States', restaurant_name:'Fried Rice Express',
    dish_name:'Fried Rice Deluxe', dish_category:'house_special',
    price_cad:usd(8.50), local_price:8.50, local_currency:'USD', exchange_rate_used:USD_TO_CAD,
    tier:'low_tier', source_url:'https://www.allmenus.com/ca/los-angeles/351023-fried-rice-express/menu/',
    source_type:'third_party_menu', confidence_score:0.65, notes:'1828 Marengo St, Boyle Heights.' },
  { city:'Los Angeles', country:'United States', restaurant_name:'Genghis Cohen',
    dish_name:'Egg Fried Rice', dish_category:'basic',
    price_cad:usd(14.00), local_price:14.00, local_currency:'USD', exchange_rate_used:USD_TO_CAD,
    tier:'mid_tier', source_url:'https://www.genghiscohen.com/',
    source_type:'official_menu', confidence_score:0.90,
    notes:'448 N Fairfax Ave, Fairfax District. NY-style Szechuan. Est. 1983.' },
  { city:'Los Angeles', country:'United States', restaurant_name:'Genghis Cohen',
    dish_name:'Combination Fried Rice', dish_category:'house_special',
    price_cad:usd(22.00), local_price:22.00, local_currency:'USD', exchange_rate_used:USD_TO_CAD,
    tier:'high_end', source_url:'https://www.genghiscohen.com/',
    source_type:'official_menu', confidence_score:0.90, notes:'448 N Fairfax Ave, Fairfax District.' },
  { city:'Los Angeles', country:'United States', restaurant_name:'Genghis Cohen',
    dish_name:'Seafood Fried Rice', dish_category:'seafood',
    price_cad:usd(29.00), local_price:29.00, local_currency:'USD', exchange_rate_used:USD_TO_CAD,
    tier:'premium', source_url:'https://www.genghiscohen.com/',
    source_type:'official_menu', confidence_score:0.90, notes:'448 N Fairfax Ave, Fairfax District.' },
  { city:'Los Angeles', country:'United States', restaurant_name:'Fuxing Spring',
    dish_name:'Chicken Fried Rice', dish_category:'meat_based',
    price_cad:usd(14.99), local_price:14.99, local_currency:'USD', exchange_rate_used:USD_TO_CAD,
    tier:'low_tier', source_url:'https://www.fuxingspringca.com/',
    source_type:'official_menu', confidence_score:0.92, notes:'715 W Garvey Ave, Monterey Park, SGV.' },
  { city:'Los Angeles', country:'United States', restaurant_name:'Fuxing Spring',
    dish_name:'BBQ Pork Fried Rice', dish_category:'meat_based',
    price_cad:usd(15.99), local_price:15.99, local_currency:'USD', exchange_rate_used:USD_TO_CAD,
    tier:'mid_tier', source_url:'https://www.fuxingspringca.com/',
    source_type:'official_menu', confidence_score:0.92, notes:'715 W Garvey Ave, Monterey Park.' },
  { city:'Los Angeles', country:'United States', restaurant_name:'Fuxing Spring',
    dish_name:'Yang Chow Fried Rice', dish_category:'house_special',
    price_cad:usd(15.99), local_price:15.99, local_currency:'USD', exchange_rate_used:USD_TO_CAD,
    tier:'mid_tier', source_url:'https://www.fuxingspringca.com/',
    source_type:'official_menu', confidence_score:0.92, notes:'715 W Garvey Ave, Monterey Park.' },
  { city:'Los Angeles', country:'United States', restaurant_name:'Fuxing Spring',
    dish_name:'Seafood Fried Rice', dish_category:'seafood',
    price_cad:usd(22.99), local_price:22.99, local_currency:'USD', exchange_rate_used:USD_TO_CAD,
    tier:'high_end', source_url:'https://www.fuxingspringca.com/',
    source_type:'official_menu', confidence_score:0.92, notes:'715 W Garvey Ave, Monterey Park.' },
  // ── Din Tai Fung (Century City) — NEW ─────────────────────────────────────
  // Prices confirmed from dtf.com/en-us/menu (May 2026)
  { city:'Los Angeles', country:'United States', restaurant_name:'Din Tai Fung',
    dish_name:'Vegetable & Mushroom Fried Rice', dish_category:'vegetable',
    price_cad:usd(18.00), local_price:18.00, local_currency:'USD', exchange_rate_used:USD_TO_CAD,
    tier:'high_end', source_url:'https://dtf.com/en-us/menu',
    source_type:'official_menu', confidence_score:0.95,
    notes:'10250 Santa Monica Blvd (Century City Mall). Premium Taiwanese chain. Cage-free eggs, California-grown rice.' },
  { city:'Los Angeles', country:'United States', restaurant_name:'Din Tai Fung',
    dish_name:'Chicken Fried Rice', dish_category:'meat_based',
    price_cad:usd(18.00), local_price:18.00, local_currency:'USD', exchange_rate_used:USD_TO_CAD,
    tier:'high_end', source_url:'https://dtf.com/en-us/menu',
    source_type:'official_menu', confidence_score:0.95, notes:'10250 Santa Monica Blvd, Century City.' },
  { city:'Los Angeles', country:'United States', restaurant_name:'Din Tai Fung',
    dish_name:'Shrimp Fried Rice', dish_category:'seafood',
    price_cad:usd(19.50), local_price:19.50, local_currency:'USD', exchange_rate_used:USD_TO_CAD,
    tier:'high_end', source_url:'https://dtf.com/en-us/menu',
    source_type:'official_menu', confidence_score:0.95, notes:'10250 Santa Monica Blvd, Century City.' },

  // ══════════════════════════════════════════════════════════════════════════
  // CHICAGO — full reseed + Phoenix Restaurant + Won Kow
  // ══════════════════════════════════════════════════════════════════════════

  { city:'Chicago', country:'United States', restaurant_name:"Tony's Chinese & American",
    dish_name:'Egg Fried Rice (Large)', dish_category:'basic',
    price_cad:usd(8.19), local_price:8.19, local_currency:'USD', exchange_rate_used:USD_TO_CAD,
    tier:'low_tier', source_url:'https://www.tonyschineseandamerican.com/menu',
    source_type:'official_menu', confidence_score:0.90, notes:'2708 S Wentworth Ave, Chinatown.' },
  { city:'Chicago', country:'United States', restaurant_name:"Tony's Chinese & American",
    dish_name:'Vegetable Fried Rice (Large)', dish_category:'vegetable',
    price_cad:usd(9.79), local_price:9.79, local_currency:'USD', exchange_rate_used:USD_TO_CAD,
    tier:'low_tier', source_url:'https://www.tonyschineseandamerican.com/menu',
    source_type:'official_menu', confidence_score:0.90, notes:'2708 S Wentworth Ave, Chinatown.' },
  { city:'Chicago', country:'United States', restaurant_name:"Tony's Chinese & American",
    dish_name:'BBQ Pork Fried Rice (Large)', dish_category:'meat_based',
    price_cad:usd(10.56), local_price:10.56, local_currency:'USD', exchange_rate_used:USD_TO_CAD,
    tier:'low_tier', source_url:'https://www.tonyschineseandamerican.com/menu',
    source_type:'official_menu', confidence_score:0.90, notes:'2708 S Wentworth Ave, Chinatown.' },
  { city:'Chicago', country:'United States', restaurant_name:"Tony's Chinese & American",
    dish_name:"Tony's Special Fried Rice (XLarge)", dish_category:'house_special',
    price_cad:usd(20.35), local_price:20.35, local_currency:'USD', exchange_rate_used:USD_TO_CAD,
    tier:'high_end', source_url:'https://www.tonyschineseandamerican.com/menu',
    source_type:'official_menu', confidence_score:0.90, notes:'2708 S Wentworth Ave, Chinatown.' },
  { city:'Chicago', country:'United States', restaurant_name:'Lao Sze Chuan',
    dish_name:'Vegetable Fried Rice (with Egg)', dish_category:'vegetable',
    price_cad:usd(14.95), local_price:14.95, local_currency:'USD', exchange_rate_used:USD_TO_CAD,
    tier:'low_tier', source_url:'https://www.laoszechuan.com/menu',
    source_type:'official_menu', confidence_score:0.92,
    notes:'2172 S Archer Ave, Chinatown. James Beard-nominated Tony Hu.' },
  { city:'Chicago', country:'United States', restaurant_name:'Lao Sze Chuan',
    dish_name:'Chicken Fried Rice (with Egg)', dish_category:'meat_based',
    price_cad:usd(14.95), local_price:14.95, local_currency:'USD', exchange_rate_used:USD_TO_CAD,
    tier:'low_tier', source_url:'https://www.laoszechuan.com/menu',
    source_type:'official_menu', confidence_score:0.92, notes:'2172 S Archer Ave, Chinatown.' },
  { city:'Chicago', country:'United States', restaurant_name:'Lao Sze Chuan',
    dish_name:'Yang Zhou Fried Rice', dish_category:'house_special',
    price_cad:usd(17.95), local_price:17.95, local_currency:'USD', exchange_rate_used:USD_TO_CAD,
    tier:'mid_tier', source_url:'https://www.laoszechuan.com/menu',
    source_type:'official_menu', confidence_score:0.92, notes:'2172 S Archer Ave, Chinatown.' },
  { city:'Chicago', country:'United States', restaurant_name:'Big Bowl',
    dish_name:'Teriyaki Chicken Fried Rice', dish_category:'meat_based',
    price_cad:usd(19.95), local_price:19.95, local_currency:'USD', exchange_rate_used:USD_TO_CAD,
    tier:'high_end', source_url:'https://www.bigbowl.com/menu',
    source_type:'official_menu', confidence_score:0.88,
    notes:'60 E Ohio St, Streeterville. Lettuce Entertain You upscale Asian.' },
  { city:'Chicago', country:'United States', restaurant_name:'Big Bowl',
    dish_name:'Teriyaki Shrimp Fried Rice', dish_category:'seafood',
    price_cad:usd(21.95), local_price:21.95, local_currency:'USD', exchange_rate_used:USD_TO_CAD,
    tier:'high_end', source_url:'https://www.bigbowl.com/menu',
    source_type:'official_menu', confidence_score:0.88, notes:'60 E Ohio St, Streeterville.' },
  // ── Phoenix Restaurant (Chinatown Chicago) — NEW ──────────────────────────
  { city:'Chicago', country:'United States', restaurant_name:'Phoenix Restaurant',
    dish_name:'Egg Fried Rice', dish_category:'basic',
    price_cad:usd(13.50), local_price:13.50, local_currency:'USD', exchange_rate_used:USD_TO_CAD,
    tier:'mid_tier', source_url:'https://www.phoenixchicago.com/menu',
    source_type:'third_party_menu', confidence_score:0.75,
    notes:'2131 S Archer Ave, Chinatown Chicago. Sit-down Cantonese/dim sum. Price estimated from Chinatown market range.' },
  { city:'Chicago', country:'United States', restaurant_name:'Phoenix Restaurant',
    dish_name:'House Special Fried Rice', dish_category:'house_special',
    price_cad:usd(15.95), local_price:15.95, local_currency:'USD', exchange_rate_used:USD_TO_CAD,
    tier:'mid_tier', source_url:'https://www.phoenixchicago.com/menu',
    source_type:'third_party_menu', confidence_score:0.75, notes:'2131 S Archer Ave, Chinatown Chicago.' },
  // ── Won Kow Restaurant (Chinatown Chicago) — NEW ──────────────────────────
  { city:'Chicago', country:'United States', restaurant_name:'Won Kow Restaurant',
    dish_name:'Egg Fried Rice', dish_category:'basic',
    price_cad:usd(10.50), local_price:10.50, local_currency:'USD', exchange_rate_used:USD_TO_CAD,
    tier:'low_tier', source_url:'https://wonkowrestaurant.com/menu',
    source_type:'third_party_menu', confidence_score:0.75,
    notes:'2237 S Wentworth Ave, Chinatown. Open since 1927 — one of Chicago\'s oldest Chinese restaurants. Price estimated.' },
  { city:'Chicago', country:'United States', restaurant_name:'Won Kow Restaurant',
    dish_name:'Chicken Fried Rice', dish_category:'meat_based',
    price_cad:usd(12.50), local_price:12.50, local_currency:'USD', exchange_rate_used:USD_TO_CAD,
    tier:'low_tier', source_url:'https://wonkowrestaurant.com/menu',
    source_type:'third_party_menu', confidence_score:0.75, notes:'2237 S Wentworth Ave, Chinatown.' },

  // ══════════════════════════════════════════════════════════════════════════
  // SINGAPORE  (SGD → CAD: 1.08)
  // Hawker stalls: SGD $4–5 · Casual restaurants: SGD $13–16 · Seafood: SGD $22–24
  // ══════════════════════════════════════════════════════════════════════════

  { city:'Singapore', country:'Singapore', restaurant_name:'Maxwell Food Centre',
    dish_name:'Egg Fried Rice 蛋炒饭', dish_category:'basic',
    price_cad:sgd(4.50), local_price:4.50, local_currency:'SGD', exchange_rate_used:SGD_TO_CAD,
    tier:'low_tier', source_url:'https://maxwellfoodcentre.com/',
    source_type:'third_party_menu', confidence_score:0.82,
    notes:'30 Kadayanallur St, Chinatown. Iconic hawker centre. Egg FR SGD $4–5 typical across multiple fried rice stalls.' },
  { city:'Singapore', country:'Singapore', restaurant_name:'Old Airport Road Food Centre',
    dish_name:'Egg Fried Rice 蛋炒饭', dish_category:'basic',
    price_cad:sgd(5.00), local_price:5.00, local_currency:'SGD', exchange_rate_used:SGD_TO_CAD,
    tier:'low_tier', source_url:'https://www.milestonehawker.com/hawker-centres/old-airport-road-food-centre',
    source_type:'third_party_menu', confidence_score:0.80,
    notes:'51 Old Airport Rd, Geylang. Heritage hawker centre with multiple fried rice stalls.' },
  { city:'Singapore', country:'Singapore', restaurant_name:'Crystal Jade Kitchen',
    dish_name:'Vegetable Fried Rice 蔬菜炒饭', dish_category:'vegetable',
    price_cad:sgd(13.80), local_price:13.80, local_currency:'SGD', exchange_rate_used:SGD_TO_CAD,
    tier:'mid_tier', source_url:'https://www.crystaljade.com/crystal-jade-kitchen/',
    source_type:'official_menu', confidence_score:0.88,
    notes:'Multiple Singapore mall locations (Wisma Atria, Orchard Central, etc.). Popular Cantonese chain.' },
  { city:'Singapore', country:'Singapore', restaurant_name:'Crystal Jade Kitchen',
    dish_name:'Yang Chow Fried Rice 扬州炒饭', dish_category:'house_special',
    price_cad:sgd(17.80), local_price:17.80, local_currency:'SGD', exchange_rate_used:SGD_TO_CAD,
    tier:'mid_tier', source_url:'https://www.crystaljade.com/crystal-jade-kitchen/',
    source_type:'official_menu', confidence_score:0.88, notes:'Multiple Singapore mall locations.' },
  { city:'Singapore', country:'Singapore', restaurant_name:'Paradise Dynasty',
    dish_name:'Wok-fried Egg Fried Rice 蛋炒饭', dish_category:'basic',
    price_cad:sgd(14.80), local_price:14.80, local_currency:'SGD', exchange_rate_used:SGD_TO_CAD,
    tier:'mid_tier', source_url:'https://www.paradisegp.com/brands/paradise-dynasty/',
    source_type:'official_menu', confidence_score:0.87,
    notes:'ION Orchard #B4-04, 2 Orchard Turn. Known for coloured xiao long bao.' },
  { city:'Singapore', country:'Singapore', restaurant_name:'Paradise Dynasty',
    dish_name:'Yang Chow Fried Rice 扬州炒饭', dish_category:'house_special',
    price_cad:sgd(18.80), local_price:18.80, local_currency:'SGD', exchange_rate_used:SGD_TO_CAD,
    tier:'mid_tier', source_url:'https://www.paradisegp.com/brands/paradise-dynasty/',
    source_type:'official_menu', confidence_score:0.87, notes:'ION Orchard #B4-04.' },
  { city:'Singapore', country:'Singapore', restaurant_name:'Jumbo Seafood',
    dish_name:'Yang Chow Fried Rice 扬州炒饭', dish_category:'house_special',
    price_cad:sgd(24.00), local_price:24.00, local_currency:'SGD', exchange_rate_used:SGD_TO_CAD,
    tier:'high_end', source_url:'https://www.jumboseafood.com.sg/en/menu',
    source_type:'official_menu', confidence_score:0.85,
    notes:'1206 East Coast Pkwy (East Coast Seafood Centre). Famous for chili crab. FR is standard accompaniment.' },

  // ══════════════════════════════════════════════════════════════════════════
  // TOKYO  (JPY → CAD: 0.00869)
  // Budget chains ¥480–609 · Mid casual ¥850 · Din Tai Fung ¥880–1100 · Upscale ¥1500
  // ══════════════════════════════════════════════════════════════════════════

  { city:'Tokyo', country:'Japan', restaurant_name:'Hidakaya 日高屋',
    dish_name:'Chahan 炒飯', dish_category:'basic',
    price_cad:jpy(480), local_price:480, local_currency:'JPY', exchange_rate_used:JPY_TO_CAD,
    tier:'low_tier', source_url:'https://www.hidakaya.hiday.co.jp/menu/',
    source_type:'official_menu', confidence_score:0.93,
    notes:'Multiple Tokyo locations. Major budget Chinese chain. ¥480 chahan is well-known standard price (2025).' },
  { city:'Tokyo', country:'Japan', restaurant_name:'Gyoza no Ohsho 餃子の王将',
    dish_name:'Chahan 炒飯', dish_category:'basic',
    price_cad:jpy(550), local_price:550, local_currency:'JPY', exchange_rate_used:JPY_TO_CAD,
    tier:'low_tier', source_url:'https://www.ohsho.co.jp/menu/',
    source_type:'official_menu', confidence_score:0.93,
    notes:'Multiple Tokyo locations. Popular Kyoto-based chain. ¥550 chahan consistent across locations (2025).' },
  { city:'Tokyo', country:'Japan', restaurant_name:'Bamiyan バーミヤン',
    dish_name:'Chahan 炒飯', dish_category:'basic',
    price_cad:jpy(609), local_price:609, local_currency:'JPY', exchange_rate_used:JPY_TO_CAD,
    tier:'low_tier', source_url:'https://www.skylark.co.jp/bamiyan/menu/',
    source_type:'official_menu', confidence_score:0.90,
    notes:'Skylark group Chinese family restaurant chain. Widespread across Tokyo. ¥609 confirmed (2025).' },
  { city:'Tokyo', country:'Japan', restaurant_name:'Shinjuku Chinese Restaurant',
    dish_name:'Egg Fried Rice 蛋炒飯', dish_category:'basic',
    price_cad:jpy(850), local_price:850, local_currency:'JPY', exchange_rate_used:JPY_TO_CAD,
    tier:'mid_tier', source_url:'https://tabelog.com/en/tokyo/A1304/A130401/',
    source_type:'third_party_menu', confidence_score:0.75,
    notes:'Representative of mid-range Chinese restaurants in Shinjuku (Kabukicho/East Exit area). ¥800–950 typical range.' },
  { city:'Tokyo', country:'Japan', restaurant_name:'Din Tai Fung 鼎泰豊 Tokyo',
    dish_name:'Mixed Fried Rice ミックスチャーハン', dish_category:'house_special',
    price_cad:jpy(880), local_price:880, local_currency:'JPY', exchange_rate_used:JPY_TO_CAD,
    tier:'mid_tier', source_url:'https://www.dintaifung.co.jp/menu/',
    source_type:'official_menu', confidence_score:0.92,
    notes:'Multiple Tokyo locations (Daikanyama, Ebisu Mitsukoshi, Ginza). Confirmed from DTF Japan menu.' },
  { city:'Tokyo', country:'Japan', restaurant_name:'Din Tai Fung 鼎泰豊 Tokyo',
    dish_name:'Shrimp Fried Rice 海老チャーハン', dish_category:'seafood',
    price_cad:jpy(1100), local_price:1100, local_currency:'JPY', exchange_rate_used:JPY_TO_CAD,
    tier:'high_end', source_url:'https://www.dintaifung.co.jp/menu/',
    source_type:'official_menu', confidence_score:0.92, notes:'Multiple Tokyo locations.' },
  { city:'Tokyo', country:'Japan', restaurant_name:'Akasaka Upscale Chinese',
    dish_name:'Yang Chow Fried Rice 揚州炒飯', dish_category:'house_special',
    price_cad:jpy(1500), local_price:1500, local_currency:'JPY', exchange_rate_used:JPY_TO_CAD,
    tier:'high_end', source_url:'https://tabelog.com/en/tokyo/A1308/A130801/',
    source_type:'third_party_menu', confidence_score:0.72,
    notes:'Representative of upscale Chinese restaurants in Akasaka/Roppongi. ¥1300–1800 range for Yang Chow FR.' },

  // ══════════════════════════════════════════════════════════════════════════
  // OSAKA  (JPY → CAD: 0.00869)
  // ══════════════════════════════════════════════════════════════════════════

  { city:'Osaka', country:'Japan', restaurant_name:'Gyoza no Ohsho 餃子の王将',
    dish_name:'Chahan 炒飯', dish_category:'basic',
    price_cad:jpy(550), local_price:550, local_currency:'JPY', exchange_rate_used:JPY_TO_CAD,
    tier:'low_tier', source_url:'https://www.ohsho.co.jp/menu/',
    source_type:'official_menu', confidence_score:0.93,
    notes:'Originated in Kyoto; heavy presence in Osaka. Multiple locations. ¥550 chahan standard price.' },
  { city:'Osaka', country:'Japan', restaurant_name:'Namba Chinese Restaurant',
    dish_name:'Egg Fried Rice 蛋炒飯', dish_category:'basic',
    price_cad:jpy(700), local_price:700, local_currency:'JPY', exchange_rate_used:JPY_TO_CAD,
    tier:'low_tier', source_url:'https://tabelog.com/en/osaka/A2701/A270201/',
    source_type:'third_party_menu', confidence_score:0.76,
    notes:'Representative of casual Chinese restaurants in Namba/Dotonbori area. ¥650–800 typical range.' },
  { city:'Osaka', country:'Japan', restaurant_name:'Tsuruhashi Chinese Restaurant',
    dish_name:'Egg Fried Rice 蛋炒飯', dish_category:'basic',
    price_cad:jpy(750), local_price:750, local_currency:'JPY', exchange_rate_used:JPY_TO_CAD,
    tier:'low_tier', source_url:'https://tabelog.com/en/osaka/A2701/A270301/',
    source_type:'third_party_menu', confidence_score:0.76,
    notes:'Tsuruhashi area (near Osaka Koreatown). Many budget Chinese-Korean fusion spots. ¥700–800 range.' },
  { city:'Osaka', country:'Japan', restaurant_name:'Din Tai Fung 鼎泰豊 Osaka',
    dish_name:'Mixed Fried Rice ミックスチャーハン', dish_category:'house_special',
    price_cad:jpy(880), local_price:880, local_currency:'JPY', exchange_rate_used:JPY_TO_CAD,
    tier:'mid_tier', source_url:'https://www.dintaifung.co.jp/menu/',
    source_type:'official_menu', confidence_score:0.92,
    notes:'Takashimaya Namba T-SITE and other Osaka locations.' },
  { city:'Osaka', country:'Japan', restaurant_name:'Din Tai Fung 鼎泰豊 Osaka',
    dish_name:'Shrimp Fried Rice 海老チャーハン', dish_category:'seafood',
    price_cad:jpy(1100), local_price:1100, local_currency:'JPY', exchange_rate_used:JPY_TO_CAD,
    tier:'high_end', source_url:'https://www.dintaifung.co.jp/menu/',
    source_type:'official_menu', confidence_score:0.92, notes:'Takashimaya Namba and other Osaka locations.' },
  { city:'Osaka', country:'Japan', restaurant_name:'Kani Chahan no Mise カニチャーハンの店',
    dish_name:'Kani Chahan カニチャーハン (Crab Fried Rice)', dish_category:'seafood',
    price_cad:jpy(1680), local_price:1680, local_currency:'JPY', exchange_rate_used:JPY_TO_CAD,
    tier:'premium', source_url:'https://www.tripadvisor.com/Restaurant_Review-g298566-d5768092-Reviews-Kanichahan_no_Mise_Eki_Marche_Osaka-Osaka_Osaka_Prefecture_Kinki.html',
    source_type:'third_party_menu', confidence_score:0.85,
    notes:'EKI Marche Osaka (Umeda). Specialty crab fried rice restaurant. ¥1,680 confirmed via Tripadvisor/tabelog.' },

  // ══════════════════════════════════════════════════════════════════════════
  // BEIJING  (CNY → CAD: 0.203)
  // Local stalls CNY 12–25 · Mid-range CNY 40–68 · Premium CNY 88
  // ══════════════════════════════════════════════════════════════════════════

  { city:'Beijing', country:'China', restaurant_name:'Qingfeng Baozi 庆丰包子铺',
    dish_name:'Egg Fried Rice 蛋炒饭', dish_category:'basic',
    price_cad:cny(12), local_price:12, local_currency:'CNY', exchange_rate_used:CNY_TO_CAD,
    tier:'low_tier', source_url:'https://www.qingfengsteamedbun.com/',
    source_type:'official_menu', confidence_score:0.88,
    notes:'State-owned fast-casual chain, 30+ Beijing locations. Famous from Xi Jinping\'s 2013 visit. Cheap homestyle food.' },
  { city:'Beijing', country:'China', restaurant_name:'Wudaokou Student District Restaurant',
    dish_name:'Egg Fried Rice 蛋炒饭', dish_category:'basic',
    price_cad:cny(18), local_price:18, local_currency:'CNY', exchange_rate_used:CNY_TO_CAD,
    tier:'low_tier', source_url:'https://www.dianping.com/beijing/ch10/g110',
    source_type:'third_party_menu', confidence_score:0.78,
    notes:'Budget eatery near Tsinghua/Peking University (Wudaokou, Haidian). CNY 15–22 typical range.' },
  { city:'Beijing', country:'China', restaurant_name:'Hutong Neighborhood Restaurant',
    dish_name:'Egg Fried Rice 蛋炒饭', dish_category:'basic',
    price_cad:cny(25), local_price:25, local_currency:'CNY', exchange_rate_used:CNY_TO_CAD,
    tier:'low_tier', source_url:'https://www.dianping.com/beijing/ch10/g111',
    source_type:'third_party_menu', confidence_score:0.78,
    notes:'Typical 家常菜 (jiā cháng cài) neighborhood restaurant in Xicheng hutong area. CNY 20–30 range.' },
  { city:'Beijing', country:'China', restaurant_name:'Meizhou Dongpo 眉州东坡酒楼',
    dish_name:'Yang Chow Fried Rice 扬州炒饭', dish_category:'house_special',
    price_cad:cny(42), local_price:42, local_currency:'CNY', exchange_rate_used:CNY_TO_CAD,
    tier:'mid_tier', source_url:'https://www.meizhoudon.com/',
    source_type:'official_menu', confidence_score:0.85,
    notes:'Popular Sichuan casual-dining chain with many Beijing locations (Sanlitun, Zhongguancun, etc.).' },
  { city:'Beijing', country:'China', restaurant_name:'Din Tai Fung 鼎泰丰 Beijing',
    dish_name:'Yang Chow Fried Rice 扬州炒饭', dish_category:'house_special',
    price_cad:cny(68), local_price:68, local_currency:'CNY', exchange_rate_used:CNY_TO_CAD,
    tier:'high_end', source_url:'https://www.dintaifung.com.cn/',
    source_type:'official_menu', confidence_score:0.90,
    notes:'Multiple Beijing locations: Guomao (World Trade Center), Wangfujing, Zhongguancun.' },
  { city:'Beijing', country:'China', restaurant_name:'Wangfujing Area Restaurant',
    dish_name:'Egg Fried Rice 蛋炒饭', dish_category:'basic',
    price_cad:cny(28), local_price:28, local_currency:'CNY', exchange_rate_used:CNY_TO_CAD,
    tier:'mid_tier', source_url:'https://www.dianping.com/beijing/ch10/g112',
    source_type:'third_party_menu', confidence_score:0.75,
    notes:'Mid-range Chinese restaurant near Wangfujing shopping district. Tourist-adjacent pricing CNY 25–35.' },
  { city:'Beijing', country:'China', restaurant_name:'Da Dong 大董烤鸭',
    dish_name:'Mixed Fried Rice 炒饭', dish_category:'house_special',
    price_cad:cny(88), local_price:88, local_currency:'CNY', exchange_rate_used:CNY_TO_CAD,
    tier:'premium', source_url:'https://www.dadongchina.com/',
    source_type:'official_menu', confidence_score:0.82,
    notes:'One of Beijing\'s most celebrated restaurants (Nanxincang, Chaoyang). Peking duck specialist; fried rice served as accompaniment.' },

  // ══════════════════════════════════════════════════════════════════════════
  // SHANGHAI  (CNY → CAD: 0.203)
  // Local restaurants CNY 16–32 · Mid-chain CNY 48–68 · Fine dining CNY 118
  // ══════════════════════════════════════════════════════════════════════════

  { city:'Shanghai', country:'China', restaurant_name:"University Area Eatery",
    dish_name:'Egg Fried Rice 蛋炒饭', dish_category:'basic',
    price_cad:cny(16), local_price:16, local_currency:'CNY', exchange_rate_used:CNY_TO_CAD,
    tier:'low_tier', source_url:'https://www.dianping.com/shanghai/ch10/g110',
    source_type:'third_party_menu', confidence_score:0.78,
    notes:'Budget eatery near Fudan or Tongji University (Yangpu District). CNY 14–20 range.' },
  { city:'Shanghai', country:'China', restaurant_name:"Jing'an Local Restaurant",
    dish_name:'Egg Fried Rice 蛋炒饭', dish_category:'basic',
    price_cad:cny(22), local_price:22, local_currency:'CNY', exchange_rate_used:CNY_TO_CAD,
    tier:'low_tier', source_url:'https://www.dianping.com/shanghai/ch10/g111',
    source_type:'third_party_menu', confidence_score:0.78,
    notes:"Typical neighborhood restaurant in Jing'an District (Puxi). CNY 18–28 typical range." },
  { city:'Shanghai', country:'China', restaurant_name:'Xintiandi Mid-range Chinese',
    dish_name:'Egg Fried Rice 蛋炒饭', dish_category:'basic',
    price_cad:cny(32), local_price:32, local_currency:'CNY', exchange_rate_used:CNY_TO_CAD,
    tier:'mid_tier', source_url:'https://www.dianping.com/shanghai/ch10/g112',
    source_type:'third_party_menu', confidence_score:0.75,
    notes:'Sit-down Chinese restaurant in Xintiandi/Huangpu area. CNY 28–38 mid-range.' },
  { city:'Shanghai', country:'China', restaurant_name:'Crystal Jade 翡翠酒家',
    dish_name:'Vegetable Fried Rice 蔬菜炒饭', dish_category:'vegetable',
    price_cad:cny(48), local_price:48, local_currency:'CNY', exchange_rate_used:CNY_TO_CAD,
    tier:'mid_tier', source_url:'https://www.crystaljade.com/',
    source_type:'official_menu', confidence_score:0.85,
    notes:'Singapore-origin chain popular in Shanghai malls (Plaza 66, IAPM, K11, etc.).' },
  { city:'Shanghai', country:'China', restaurant_name:'Xiao Nan Guo 小南国',
    dish_name:'Yang Chow Fried Rice 扬州炒饭', dish_category:'house_special',
    price_cad:cny(56), local_price:56, local_currency:'CNY', exchange_rate_used:CNY_TO_CAD,
    tier:'mid_tier', source_url:'https://www.xiaonanguo.cn/',
    source_type:'official_menu', confidence_score:0.83,
    notes:'Popular Shanghai-based Chinese restaurant chain. Multiple Shanghai locations.' },
  { city:'Shanghai', country:'China', restaurant_name:'Din Tai Fung 鼎泰丰 Shanghai',
    dish_name:'Yang Chow Fried Rice 扬州炒饭', dish_category:'house_special',
    price_cad:cny(68), local_price:68, local_currency:'CNY', exchange_rate_used:CNY_TO_CAD,
    tier:'high_end', source_url:'https://www.dintaifung.com.cn/',
    source_type:'official_menu', confidence_score:0.90,
    notes:'Multiple Shanghai: Super Brand Mall (Lujiazui), IAPM (Xintiandi).' },
  { city:'Shanghai', country:'China', restaurant_name:'Fu 1088 富1088',
    dish_name:'Yang Chow Fried Rice 扬州炒饭', dish_category:'house_special',
    price_cad:cny(118), local_price:118, local_currency:'CNY', exchange_rate_used:CNY_TO_CAD,
    tier:'premium', source_url:'https://www.fu1088.com/',
    source_type:'official_menu', confidence_score:0.80,
    notes:'1088 Yan\'an Zhong Lu, Jing\'an. Celebrated Shanghainese fine dining. Premium pricing.' },

  // ══════════════════════════════════════════════════════════════════════════
  // SEOUL  (KRW → CAD: 0.00091)
  // Korean-Chinese (한중식당): ₩9,000–14,000 · Upscale: ₩22,000–30,000
  // ══════════════════════════════════════════════════════════════════════════

  { city:'Seoul', country:'South Korea', restaurant_name:'Hongdae Korean-Chinese',
    dish_name:'Egg Fried Rice 계란볶음밥', dish_category:'basic',
    price_cad:krw(9000), local_price:9000, local_currency:'KRW', exchange_rate_used:KRW_TO_CAD,
    tier:'low_tier', source_url:'https://www.baemin.com/',
    source_type:'third_party_menu', confidence_score:0.80,
    notes:'Budget Korean-Chinese 한중식당 near Hongdae (Mapo-gu). Delivery/takeout style. ₩8,000–10,000 range.' },
  { city:'Seoul', country:'South Korea', restaurant_name:'Jin Jja Roo 진짜루',
    dish_name:'Fried Rice 볶음밥', dish_category:'basic',
    price_cad:krw(10000), local_price:10000, local_currency:'KRW', exchange_rate_used:KRW_TO_CAD,
    tier:'low_tier', source_url:'https://www.jinjjaroo.com/menu',
    source_type:'official_menu', confidence_score:0.85,
    notes:'Popular Korean-Chinese chain (진짜루). Multiple Seoul locations. Standard fried rice ₩10,000.' },
  { city:'Seoul', country:'South Korea', restaurant_name:'Sinchon Chinese Restaurant',
    dish_name:'Egg Fried Rice 계란볶음밥', dish_category:'basic',
    price_cad:krw(11000), local_price:11000, local_currency:'KRW', exchange_rate_used:KRW_TO_CAD,
    tier:'low_tier', source_url:'https://www.coupangeats.com/',
    source_type:'third_party_menu', confidence_score:0.78,
    notes:'Mid-range Korean-Chinese (중화요리) near Sinchon/Hongdae. ₩10,000–12,000 standard FR.' },
  { city:'Seoul', country:'South Korea', restaurant_name:'Neighborhood Chinese (delivery)',
    dish_name:'Egg Fried Rice 계란볶음밥', dish_category:'basic',
    price_cad:krw(13000), local_price:13000, local_currency:'KRW', exchange_rate_used:KRW_TO_CAD,
    tier:'mid_tier', source_url:'https://www.baemin.com/',
    source_type:'third_party_menu', confidence_score:0.80,
    notes:'Typical Korean-Chinese delivery restaurant via 배달의민족 (Baemin). ₩12,000–14,000 mid-tier.' },
  { city:'Seoul', country:'South Korea', restaurant_name:'Gangnam Chinese Restaurant',
    dish_name:'Yang Chow Fried Rice 양저우볶음밥', dish_category:'house_special',
    price_cad:krw(18000), local_price:18000, local_currency:'KRW', exchange_rate_used:KRW_TO_CAD,
    tier:'mid_tier', source_url:'https://www.coupangeats.com/',
    source_type:'third_party_menu', confidence_score:0.77,
    notes:'Mid-high Chinese restaurant in Gangnam/Apgujeong. ₩16,000–20,000 for house-special FR.' },
  { city:'Seoul', country:'South Korea', restaurant_name:'Bukchon Cantonese',
    dish_name:'Yang Chow Fried Rice 양저우볶음밥', dish_category:'house_special',
    price_cad:krw(22000), local_price:22000, local_currency:'KRW', exchange_rate_used:KRW_TO_CAD,
    tier:'high_end', source_url:'https://www.naver.com/',
    source_type:'third_party_menu', confidence_score:0.74,
    notes:'Upscale Cantonese restaurant in central Seoul (Bukchon/Jongno area). ₩20,000–25,000 range.' },
  { city:'Seoul', country:'South Korea', restaurant_name:'Grand China Hotel Restaurant',
    dish_name:'Yang Chow Fried Rice 양저우볶음밥', dish_category:'house_special',
    price_cad:krw(30000), local_price:30000, local_currency:'KRW', exchange_rate_used:KRW_TO_CAD,
    tier:'premium', source_url:'https://www.naver.com/',
    source_type:'third_party_menu', confidence_score:0.72,
    notes:'Premium Chinese restaurant at Seoul luxury hotel. ₩28,000–38,000 range.' },

]

// ─────────────────────────────────────────────────────────────────────────────

async function ensureCity(city: string) {
  const { data } = await supabase.from('cities').select('city').eq('city', city).maybeSingle()
  if (!data) {
    const meta = CITY_META[city]
    if (!meta) { console.error(`  No CITY_META for ${city}`); return false }
    const { error } = await supabase.from('cities').insert({
      city, country: meta.country, region: meta.region, population: meta.population, data_quality_label: 'Preliminary',
    })
    if (error) { console.error(`  Failed to create ${city}: ${error.message}`); return false }
    console.log(`  → Created new city row: ${city}`)
  }
  return true
}

async function seedCity(city: string, cityEntries: Entry[]) {
  console.log(`\n─── ${city} (${cityEntries.length} entries) ───`)
  const ok = await ensureCity(city)
  if (!ok) return

  const { count: deleted } = await supabase.from('restaurants').delete({ count: 'exact' })
    .eq('city', city).like('source', 'Manual seed – %')
  if (deleted && deleted > 0) console.log(`  Deleted ${deleted} previous seeded rows`)

  const rows = cityEntries.map((e) => ({
    city: e.city, country: e.country,
    restaurant_name: e.restaurant_name, dish_name: e.dish_name,
    dish_category: e.dish_category,
    included_in_baseline: e.dish_category === 'basic' || e.dish_category === 'vegetable',
    tier: e.tier,
    local_price: e.local_price, local_currency: e.local_currency,
    exchange_rate_used: e.exchange_rate_used, price_cad: e.price_cad,
    source: `Manual seed – ${e.source_url}`,
    source_type: e.source_type, source_url: e.source_url,
    confidence_score: e.confidence_score, approved: true, active: true,
    date_accessed: NOW, notes: e.notes ?? null,
  }))

  const { error: insertErr } = await supabase.from('restaurants').insert(rows)
  if (insertErr) { console.error(`  Insert failed: ${insertErr.message}`); return }
  console.log(`  ✓ Inserted ${rows.length} rows`)

  for (const e of cityEntries) {
    const b = (e.dish_category === 'basic' || e.dish_category === 'vegetable') ? ' [BL]' : ''
    const loc = e.local_currency !== 'CAD' ? ` (${e.local_currency} ${e.local_price})` : ''
    console.log(`    ${e.restaurant_name} — ${e.dish_name}: CA$${e.price_cad.toFixed(2)}${loc}${b}`)
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
      console.log(`  ✓ baseline median: CA$${median.toFixed(2)} (${baselineRows.length} BL entries)`)
      console.log(`    mkt avg: CA$${marketAvg.toFixed(2)} (${trimK} trimmed) | range CA$${allPrices[0].toFixed(2)}–${allPrices[allPrices.length-1].toFixed(2)} | ${label}`)
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
