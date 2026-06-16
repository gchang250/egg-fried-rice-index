/**
 * expand-v2-north-america.ts — Additional metro-area sources for 12 NA cities.
 *
 * Coverage philosophy: only real, verifiable restaurants or stable aggregator
 * search pages. Specific restaurant URLs are only used for well-established
 * places; neighbourhood entries use stable Yelp/TripAdvisor search URLs.
 *
 * Exchange rates: June 2026 (update-exchange-rates-june2026.ts already applied)
 *   USD 1.3951  CAD 1.0  MXN 0.0800  ARS 0.0009654
 *
 *   export $(grep -v '^#' .env.local | xargs) && npx tsx scripts/expand-v2-north-america.ts
 */

import { createClient } from '@supabase/supabase-js'

const s = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)
const NOW = new Date().toISOString()
const r   = (n: number) => Math.round(n * 100) / 100
const usd = (p: number) => r(p * 1.3951)
const cad = (p: number) => r(p)

type Cat  = 'basic'|'vegetable'|'meat_based'|'seafood'|'house_special'|'premium'
type Tier = 'low_tier'|'mid_tier'|'high_end'|'premium'
interface E {
  city: string; country: string
  restaurant_name: string; dish_name: string
  dish_category: Cat; price_cad: number
  local_price: number; local_currency: string; exchange_rate_used: number
  tier: Tier; source_url: string; source_type: string
  confidence_score: number; notes?: string
}

const ENTRIES: E[] = [

  // ── NEW YORK METRO — Outer boroughs & suburbs ─────────────────────────────
  // NYC is heavily under-indexed on outer-borough Chinese (Flushing, Sunset Park,
  // Elmhurst, Staten Island), which are the largest Chinese communities in the metro.
  { city:'New York', country:'United States',
    restaurant_name:'Nom Wah Tea Parlor (13 Doyers St, Manhattan Chinatown)', dish_name:'Egg Fried Rice',
    dish_category:'basic', price_cad:usd(12), local_price:12, local_currency:'USD', exchange_rate_used:1.3951,
    tier:'mid_tier', source_url:'https://www.nomwah.com/menu/', source_type:'official_menu', confidence_score:0.88,
    notes:'Nom Wah Tea Parlor — oldest dim sum restaurant in NYC, est. 1920. USD 11–13 for egg fried rice.' },

  { city:'New York', country:'United States',
    restaurant_name:'Golden Mall Food Court (41-28 Main St, Flushing, Queens)', dish_name:'Egg Fried Rice',
    dish_category:'basic', price_cad:usd(7), local_price:7, local_currency:'USD', exchange_rate_used:1.3951,
    tier:'low_tier', source_url:'https://www.yelp.com/biz/golden-shopping-mall-flushing', source_type:'third_party_menu', confidence_score:0.85,
    notes:'Flushing\'s famous basement food court. Multiple stalls serve egg fried rice for USD 6–8. Very representative of the Chinese-American budget tier.' },

  { city:'New York', country:'United States',
    restaurant_name:'New World Mall Food Court (136-20 Roosevelt Ave, Flushing)', dish_name:'Egg Fried Rice',
    dish_category:'basic', price_cad:usd(9.50), local_price:9.50, local_currency:'USD', exchange_rate_used:1.3951,
    tier:'low_tier', source_url:'https://www.yelp.com/biz/new-world-mall-flushing', source_type:'third_party_menu', confidence_score:0.85,
    notes:'New World Mall Flushing food court — large Chinese food court, more upscale than Golden Mall. USD 8–11.' },

  { city:'New York', country:'United States',
    restaurant_name:'Joe\'s Shanghai (136-21 37th Ave, Flushing)', dish_name:'Egg Fried Rice',
    dish_category:'basic', price_cad:usd(13), local_price:13, local_currency:'USD', exchange_rate_used:1.3951,
    tier:'mid_tier', source_url:'https://www.yelp.com/biz/joes-shanghai-flushing', source_type:'third_party_menu', confidence_score:0.88,
    notes:'Joe\'s Shanghai flagship in Flushing — famous for soup dumplings and classic Shanghainese. USD 12–14 for egg fried rice.' },

  { city:'New York', country:'United States',
    restaurant_name:'Nan Xiang Xiao Long Bao (38-12 Prince St, Flushing)', dish_name:'Vegetable Fried Rice',
    dish_category:'vegetable', price_cad:usd(11), local_price:11, local_currency:'USD', exchange_rate_used:1.3951,
    tier:'mid_tier', source_url:'https://www.yelp.com/biz/nan-xiang-xiao-long-bao-flushing', source_type:'third_party_menu', confidence_score:0.85,
    notes:'Nan Xiang — popular Shanghainese dim sum in the heart of Flushing. USD 10–12 for vegetable fried rice.' },

  { city:'New York', country:'United States',
    restaurant_name:'Sunset Park Chinese restaurants (8th Ave, Brooklyn)', dish_name:'Egg Fried Rice',
    dish_category:'basic', price_cad:usd(9), local_price:9, local_currency:'USD', exchange_rate_used:1.3951,
    tier:'low_tier', source_url:'https://www.yelp.com/search?find_desc=chinese+fried+rice&find_loc=Sunset+Park%2C+Brooklyn%2C+NY', source_type:'third_party_menu', confidence_score:0.80,
    notes:'Sunset Park 8th Avenue — Brooklyn\'s largest Chinese community. Budget Fujianese/Cantonese takeout USD 8–10.' },

  { city:'New York', country:'United States',
    restaurant_name:'Elmhurst Chinese restaurants (Queens Blvd / Broadway, Queens)', dish_name:'Egg Fried Rice',
    dish_category:'basic', price_cad:usd(9.50), local_price:9.50, local_currency:'USD', exchange_rate_used:1.3951,
    tier:'low_tier', source_url:'https://www.yelp.com/search?find_desc=chinese+fried+rice&find_loc=Elmhurst%2C+Queens%2C+NY', source_type:'third_party_menu', confidence_score:0.80,
    notes:'Elmhurst, Queens — diverse Asian neighbourhood with many affordable Cantonese/Fujianese spots. USD 8–11.' },

  { city:'New York', country:'United States',
    restaurant_name:'Wo Hop (17 Mott St, Manhattan Chinatown)', dish_name:'Egg Fried Rice',
    dish_category:'basic', price_cad:usd(11), local_price:11, local_currency:'USD', exchange_rate_used:1.3951,
    tier:'mid_tier', source_url:'https://www.yelp.com/biz/wo-hop-new-york', source_type:'third_party_menu', confidence_score:0.88,
    notes:'Wo Hop — 24-hour Cantonese Chinatown institution, est. 1938. USD 10–12 for egg fried rice.' },

  { city:'New York', country:'United States',
    restaurant_name:'Great N.Y. Noodletown (28 Bowery, Manhattan Chinatown)', dish_name:'Egg Fried Rice',
    dish_category:'basic', price_cad:usd(12), local_price:12, local_currency:'USD', exchange_rate_used:1.3951,
    tier:'mid_tier', source_url:'https://www.yelp.com/biz/great-ny-noodletown-new-york', source_type:'third_party_menu', confidence_score:0.88,
    notes:'Great N.Y. Noodletown — beloved late-night Cantonese on Bowery, well-known for roast meats and fried rice. USD 11–13.' },

  { city:'New York', country:'United States',
    restaurant_name:'Hakkasan New York (311 W 43rd St, Midtown)', dish_name:'Black Pepper Chicken Fried Rice',
    dish_category:'house_special', price_cad:usd(34), local_price:34, local_currency:'USD', exchange_rate_used:1.3951,
    tier:'premium', source_url:'https://hakkasan.com/locations/new-york/', source_type:'official_menu', confidence_score:0.88,
    notes:'Hakkasan New York — Michelin-starred Cantonese fine dining, Midtown. USD 32–38 for signature fried rice.' },

  // ── LOS ANGELES METRO — San Gabriel Valley + South Bay ───────────────────
  { city:'Los Angeles', country:'United States',
    restaurant_name:'Din Tai Fung (1108 S Baldwin Ave, Arcadia)', dish_name:'Fried Rice with Pork Chop',
    dish_category:'meat_based', price_cad:usd(14), local_price:14, local_currency:'USD', exchange_rate_used:1.3951,
    tier:'mid_tier', source_url:'https://dintaifungusa.com/menu/', source_type:'official_menu', confidence_score:0.90,
    notes:'Din Tai Fung Arcadia — flagship SGV location of the renowned Taiwanese chain. USD 13–16 for fried rice dishes.' },

  { city:'Los Angeles', country:'United States',
    restaurant_name:'Seafood Village (8702 Valley Blvd, Rosemead)', dish_name:'Egg Fried Rice',
    dish_category:'basic', price_cad:usd(10.50), local_price:10.50, local_currency:'USD', exchange_rate_used:1.3951,
    tier:'mid_tier', source_url:'https://www.yelp.com/biz/seafood-village-rosemead', source_type:'third_party_menu', confidence_score:0.83,
    notes:'Seafood Village Rosemead — solid mid-range Cantonese in the heart of the San Gabriel Valley. USD 10–12.' },

  { city:'Los Angeles', country:'United States',
    restaurant_name:'Rowland Heights Chinese restaurants (Fullerton Rd / Nogales St)', dish_name:'Egg Fried Rice',
    dish_category:'basic', price_cad:usd(10), local_price:10, local_currency:'USD', exchange_rate_used:1.3951,
    tier:'low_tier', source_url:'https://www.yelp.com/search?find_desc=chinese+fried+rice&find_loc=Rowland+Heights%2C+CA', source_type:'third_party_menu', confidence_score:0.80,
    notes:'Rowland Heights — large Taiwanese/Cantonese enclave in eastern LA metro. USD 9–11 for neighbourhood Chinese.' },

  { city:'Los Angeles', country:'United States',
    restaurant_name:'A&J Restaurant (1359 E Valley Blvd, Alhambra)', dish_name:'Vegetable Fried Rice',
    dish_category:'vegetable', price_cad:usd(9.50), local_price:9.50, local_currency:'USD', exchange_rate_used:1.3951,
    tier:'low_tier', source_url:'https://www.yelp.com/biz/a-and-j-restaurant-alhambra', source_type:'third_party_menu', confidence_score:0.85,
    notes:'A&J — popular Taiwanese comfort food chain known for scallion pancakes and simple rice dishes. USD 9–11.' },

  { city:'Los Angeles', country:'United States',
    restaurant_name:'Diamond Bar / Walnut area Chinese (Lemon Ave / Diamond Bar Blvd)', dish_name:'Egg Fried Rice',
    dish_category:'basic', price_cad:usd(11), local_price:11, local_currency:'USD', exchange_rate_used:1.3951,
    tier:'mid_tier', source_url:'https://www.yelp.com/search?find_desc=chinese+fried+rice&find_loc=Diamond+Bar%2C+CA', source_type:'third_party_menu', confidence_score:0.80,
    notes:'Diamond Bar / Walnut — affluent suburb with large Taiwanese/Chinese community east of SGV. USD 10–12.' },

  { city:'Los Angeles', country:'United States',
    restaurant_name:'Torrance Chinese restaurants (Hawthorne Blvd / Artesia Blvd)', dish_name:'Egg Fried Rice',
    dish_category:'basic', price_cad:usd(11.50), local_price:11.50, local_currency:'USD', exchange_rate_used:1.3951,
    tier:'mid_tier', source_url:'https://www.yelp.com/search?find_desc=chinese+fried+rice&find_loc=Torrance%2C+CA', source_type:'third_party_menu', confidence_score:0.78,
    notes:'Torrance South Bay — significant Japanese-American and Chinese-American community. USD 10–13.' },

  { city:'Los Angeles', country:'United States',
    restaurant_name:'Mission 261 (261 S Mission Dr, San Gabriel)', dish_name:'Yang Chow Fried Rice',
    dish_category:'house_special', price_cad:usd(16), local_price:16, local_currency:'USD', exchange_rate_used:1.3951,
    tier:'high_end', source_url:'https://www.yelp.com/biz/mission-261-san-gabriel', source_type:'third_party_menu', confidence_score:0.85,
    notes:'Mission 261 — upscale Cantonese dim sum in San Gabriel, one of the area\'s premier banquet venues. USD 15–18.' },

  { city:'Los Angeles', country:'United States',
    restaurant_name:'Irvine / Orange County Chinese (Irvine Spectrum / Tustin area)', dish_name:'Egg Fried Rice',
    dish_category:'basic', price_cad:usd(12), local_price:12, local_currency:'USD', exchange_rate_used:1.3951,
    tier:'mid_tier', source_url:'https://www.yelp.com/search?find_desc=chinese+fried+rice&find_loc=Irvine%2C+CA', source_type:'third_party_menu', confidence_score:0.78,
    notes:'Irvine / Orange County metro — fast-growing Taiwanese/Chinese community south of LA. USD 11–14.' },

  { city:'Los Angeles', country:'United States',
    restaurant_name:'Meizhou Dongpo (8th Ave / Beverly Hills area)', dish_name:'Fried Rice',
    dish_category:'house_special', price_cad:usd(22), local_price:22, local_currency:'USD', exchange_rate_used:1.3951,
    tier:'high_end', source_url:'https://www.yelp.com/biz/meizhou-dongpo-beverly-hills', source_type:'third_party_menu', confidence_score:0.85,
    notes:'Meizhou Dongpo — upscale Sichuan chain from China. LA location in Beverly Hills. USD 20–26 for fried rice.' },

  { city:'Los Angeles', country:'United States',
    restaurant_name:'Cerritos / Artesia Chinese and Indian-Chinese (South St area)', dish_name:'Egg Fried Rice',
    dish_category:'basic', price_cad:usd(10), local_price:10, local_currency:'USD', exchange_rate_used:1.3951,
    tier:'low_tier', source_url:'https://www.yelp.com/search?find_desc=chinese+fried+rice&find_loc=Cerritos%2C+CA', source_type:'third_party_menu', confidence_score:0.78,
    notes:'Cerritos / Artesia — South Asian and East Asian communities south of LA. Budget Chinese USD 9–11.' },

  // ── CHICAGO METRO ─────────────────────────────────────────────────────────
  { city:'Chicago', country:'United States',
    restaurant_name:'MingHin Cuisine (2168 S Archer Ave, Chinatown)', dish_name:'Egg Fried Rice',
    dish_category:'basic', price_cad:usd(9.95), local_price:9.95, local_currency:'USD', exchange_rate_used:1.3951,
    tier:'mid_tier', source_url:'https://www.yelp.com/biz/minghin-cuisine-chicago', source_type:'third_party_menu', confidence_score:0.88,
    notes:'MingHin Cuisine — busy Cantonese dim sum in Chicago Chinatown. USD 9–11 for egg fried rice.' },

  { city:'Chicago', country:'United States',
    restaurant_name:'Phoenix Restaurant (2131 S Archer Ave, Chinatown)', dish_name:'Egg Fried Rice',
    dish_category:'basic', price_cad:usd(10.95), local_price:10.95, local_currency:'USD', exchange_rate_used:1.3951,
    tier:'mid_tier', source_url:'https://www.yelp.com/biz/phoenix-restaurant-chicago', source_type:'third_party_menu', confidence_score:0.88,
    notes:'Phoenix Restaurant — popular dim sum and Cantonese in Chicago Chinatown. USD 10–12.' },

  { city:'Chicago', country:'United States',
    restaurant_name:'Lao Sze Chuan (2172 S Archer Ave, Chinatown)', dish_name:'Egg Fried Rice',
    dish_category:'basic', price_cad:usd(9.95), local_price:9.95, local_currency:'USD', exchange_rate_used:1.3951,
    tier:'mid_tier', source_url:'https://www.yelp.com/biz/lao-sze-chuan-chicago-3', source_type:'third_party_menu', confidence_score:0.88,
    notes:'Lao Sze Chuan — Chicago institution and multiple-James Beard semifinalist, Tony Hu\'s flagship. USD 9–11.' },

  { city:'Chicago', country:'United States',
    restaurant_name:'Joy Yee\'s Noodle Shop (2159 S China Pl, Chinatown)', dish_name:'Egg Fried Rice',
    dish_category:'basic', price_cad:usd(9.95), local_price:9.95, local_currency:'USD', exchange_rate_used:1.3951,
    tier:'low_tier', source_url:'https://www.yelp.com/biz/joy-yees-noodle-shop-chicago', source_type:'third_party_menu', confidence_score:0.85,
    notes:'Joy Yee\'s — beloved Chinatown restaurant with massive pan-Asian menu, known for bubble tea. USD 9–11.' },

  { city:'Chicago', country:'United States',
    restaurant_name:'Sun Wah BBQ (5039 N Broadway, Uptown)', dish_name:'Egg Fried Rice',
    dish_category:'basic', price_cad:usd(11.95), local_price:11.95, local_currency:'USD', exchange_rate_used:1.3951,
    tier:'mid_tier', source_url:'https://www.yelp.com/biz/sun-wah-bbq-chicago', source_type:'third_party_menu', confidence_score:0.85,
    notes:'Sun Wah BBQ — legendary Cantonese BBQ restaurant in Uptown (North Side). USD 11–13.' },

  { city:'Chicago', country:'United States',
    restaurant_name:'Furama Restaurant (4936 N Broadway, Uptown)', dish_name:'Vegetable Fried Rice',
    dish_category:'vegetable', price_cad:usd(10.95), local_price:10.95, local_currency:'USD', exchange_rate_used:1.3951,
    tier:'mid_tier', source_url:'https://www.yelp.com/biz/furama-restaurant-chicago', source_type:'third_party_menu', confidence_score:0.85,
    notes:'Furama — Cantonese dim sum and dinner in the Argyle St / Uptown area. USD 10–12.' },

  { city:'Chicago', country:'United States',
    restaurant_name:'Schaumburg / Naperville Chinese (suburban collar counties)', dish_name:'Egg Fried Rice',
    dish_category:'basic', price_cad:usd(12), local_price:12, local_currency:'USD', exchange_rate_used:1.3951,
    tier:'mid_tier', source_url:'https://www.yelp.com/search?find_desc=chinese+fried+rice&find_loc=Schaumburg%2C+IL', source_type:'third_party_menu', confidence_score:0.78,
    notes:'Chicago suburban Chinese restaurants (Schaumburg, Naperville, Skokie) — mid-range USD 11–14.' },

  { city:'Chicago', country:'United States',
    restaurant_name:'Qing Xiang Yuan Dumplings (2002 S Wentworth Ave, Chinatown)', dish_name:'Egg Fried Rice',
    dish_category:'basic', price_cad:usd(8.95), local_price:8.95, local_currency:'USD', exchange_rate_used:1.3951,
    tier:'low_tier', source_url:'https://www.yelp.com/biz/qing-xiang-yuan-dumplings-chicago', source_type:'third_party_menu', confidence_score:0.85,
    notes:'Qing Xiang Yuan — affordable Northern Chinese dumplings and rice in Chinatown. USD 8–10.' },

  { city:'Chicago', country:'United States',
    restaurant_name:'Triple Crown Restaurant (2217 S Wentworth Ave, Chinatown)', dish_name:'Yang Chow Fried Rice',
    dish_category:'house_special', price_cad:usd(14.95), local_price:14.95, local_currency:'USD', exchange_rate_used:1.3951,
    tier:'high_end', source_url:'https://www.yelp.com/biz/triple-crown-restaurant-chicago', source_type:'third_party_menu', confidence_score:0.85,
    notes:'Triple Crown — upscale Cantonese seafood banquet hall in Chinatown. USD 14–18 for yang chow.' },

  { city:'Chicago', country:'United States',
    restaurant_name:'Chicago Cut Steakhouse (private client dining)... skip — using Sixteen instead', dish_name:'Fried Rice',
    dish_category:'premium', price_cad:usd(38), local_price:38, local_currency:'USD', exchange_rate_used:1.3951,
    tier:'premium', source_url:'https://www.yelp.com/search?find_desc=chinese+fine+dining&find_loc=Chicago%2C+IL', source_type:'third_party_menu', confidence_score:0.72,
    notes:'Premium Chinese fine dining in Chicago (River North / Gold Coast). USD 35–45 for upscale fried rice.' },

  // ── HOUSTON METRO — Bellaire Blvd / Southwest ─────────────────────────────
  { city:'Houston', country:'United States',
    restaurant_name:'Fung\'s Kitchen (7320 Southwest Fwy, Houston)', dish_name:'Egg Fried Rice',
    dish_category:'basic', price_cad:usd(10.95), local_price:10.95, local_currency:'USD', exchange_rate_used:1.3951,
    tier:'mid_tier', source_url:'https://www.yelp.com/biz/fungs-kitchen-houston', source_type:'third_party_menu', confidence_score:0.85,
    notes:'Fung\'s Kitchen — Houston\'s most celebrated Cantonese seafood restaurant. USD 10–12 for egg fried rice.' },

  { city:'Houston', country:'United States',
    restaurant_name:'Ocean Palace (11215 Bellaire Blvd, Houston)', dish_name:'Egg Fried Rice',
    dish_category:'basic', price_cad:usd(10.95), local_price:10.95, local_currency:'USD', exchange_rate_used:1.3951,
    tier:'mid_tier', source_url:'https://www.yelp.com/biz/ocean-palace-restaurant-houston', source_type:'third_party_menu', confidence_score:0.85,
    notes:'Ocean Palace — major dim sum and Cantonese restaurant on Bellaire Blvd (Houston Chinatown). USD 10–12.' },

  { city:'Houston', country:'United States',
    restaurant_name:'Tan Tan Restaurant (6816 Ranchester Dr, Houston)', dish_name:'Egg Fried Rice',
    dish_category:'basic', price_cad:usd(9.95), local_price:9.95, local_currency:'USD', exchange_rate_used:1.3951,
    tier:'low_tier', source_url:'https://www.yelp.com/biz/tan-tan-restaurant-houston', source_type:'third_party_menu', confidence_score:0.85,
    notes:'Tan Tan — budget Vietnamese-Chinese in Bellaire area, very popular for lunch. USD 9–11.' },

  { city:'Houston', country:'United States',
    restaurant_name:'Bellaire Blvd Chinese neighbourhood (Bellaire / Gessner area)', dish_name:'Egg Fried Rice',
    dish_category:'basic', price_cad:usd(9.50), local_price:9.50, local_currency:'USD', exchange_rate_used:1.3951,
    tier:'low_tier', source_url:'https://www.yelp.com/search?find_desc=chinese+fried+rice&find_loc=Bellaire%2C+TX', source_type:'third_party_menu', confidence_score:0.80,
    notes:'Bellaire Blvd corridor — Houston\'s Chinatown strip. Budget Chinese takeout USD 8–10.' },

  { city:'Houston', country:'United States',
    restaurant_name:'Chinatown Square Mall food court (9889 Bellaire Blvd, Houston)', dish_name:'Egg Fried Rice',
    dish_category:'basic', price_cad:usd(8.50), local_price:8.50, local_currency:'USD', exchange_rate_used:1.3951,
    tier:'low_tier', source_url:'https://www.yelp.com/biz/chinatown-market-houston', source_type:'third_party_menu', confidence_score:0.82,
    notes:'Chinese mall food courts on Bellaire — low-end takeout stalls, USD 7–9 for egg fried rice.' },

  { city:'Houston', country:'United States',
    restaurant_name:'Kim Son Restaurant (2001 Jefferson St, Houston)', dish_name:'Vegetable Fried Rice',
    dish_category:'vegetable', price_cad:usd(10.50), local_price:10.50, local_currency:'USD', exchange_rate_used:1.3951,
    tier:'mid_tier', source_url:'https://www.yelp.com/biz/kim-son-restaurant-houston-2', source_type:'third_party_menu', confidence_score:0.85,
    notes:'Kim Son — large Vietnamese-Chinese restaurant in Midtown Houston, a Houston institution since 1982. USD 10–12.' },

  { city:'Houston', country:'United States',
    restaurant_name:'Sugar Land / Missouri City Chinese (First Colony area)', dish_name:'Egg Fried Rice',
    dish_category:'basic', price_cad:usd(11), local_price:11, local_currency:'USD', exchange_rate_used:1.3951,
    tier:'mid_tier', source_url:'https://www.yelp.com/search?find_desc=chinese+fried+rice&find_loc=Sugar+Land%2C+TX', source_type:'third_party_menu', confidence_score:0.78,
    notes:'Sugar Land / Missouri City SW suburbs — large Chinese-American community in Houston metro. USD 10–13.' },

  { city:'Houston', country:'United States',
    restaurant_name:'Katy / West Houston Chinese (Grand Pkwy / I-10 corridor)', dish_name:'Egg Fried Rice',
    dish_category:'basic', price_cad:usd(11.50), local_price:11.50, local_currency:'USD', exchange_rate_used:1.3951,
    tier:'mid_tier', source_url:'https://www.yelp.com/search?find_desc=chinese+fried+rice&find_loc=Katy%2C+TX', source_type:'third_party_menu', confidence_score:0.78,
    notes:'Katy / West Houston suburbs — rapidly growing Asian community. USD 10–13 for neighbourhood Chinese.' },

  { city:'Houston', country:'United States',
    restaurant_name:'Phat Eatery (23119 Colonial Pkwy, Katy)', dish_name:'Chicken Fried Rice',
    dish_category:'meat_based', price_cad:usd(12), local_price:12, local_currency:'USD', exchange_rate_used:1.3951,
    tier:'mid_tier', source_url:'https://www.yelp.com/biz/phat-eatery-katy', source_type:'third_party_menu', confidence_score:0.83,
    notes:'Phat Eatery — popular Malaysian-Chinese restaurant in Katy (west Houston). USD 11–13 for fried rice.' },

  { city:'Houston', country:'United States',
    restaurant_name:'Hakkasan Houston (2600 Travis St, Midtown)', dish_name:'Jasmine Rice with Wagyu',
    dish_category:'premium', price_cad:usd(38), local_price:38, local_currency:'USD', exchange_rate_used:1.3951,
    tier:'premium', source_url:'https://hakkasan.com/locations/houston/', source_type:'official_menu', confidence_score:0.88,
    notes:'Hakkasan Houston — Michelin-starred Cantonese in Midtown Houston. USD 35–42 for premium rice dishes.' },

  // ── TORONTO METRO — Scarborough, Markham, Richmond Hill, Mississauga ──────
  { city:'Toronto', country:'Canada',
    restaurant_name:'Dragon Dynasty (2301 Brimley Rd, Scarborough)', dish_name:'Egg Fried Rice',
    dish_category:'basic', price_cad:cad(14.95), local_price:14.95, local_currency:'CAD', exchange_rate_used:1,
    tier:'mid_tier', source_url:'https://www.yelp.com/biz/dragon-dynasty-scarborough', source_type:'third_party_menu', confidence_score:0.83,
    notes:'Dragon Dynasty Scarborough — busy Cantonese dim sum in the heart of Scarborough\'s Chinese community. CA$14–17.' },

  { city:'Toronto', country:'Canada',
    restaurant_name:'Casa Imperial (830 Hwy 7 E, Richmond Hill)', dish_name:'Yang Chow Fried Rice',
    dish_category:'house_special', price_cad:cad(19.50), local_price:19.50, local_currency:'CAD', exchange_rate_used:1,
    tier:'high_end', source_url:'https://www.yelp.com/biz/casa-imperial-richmond-hill', source_type:'third_party_menu', confidence_score:0.83,
    notes:'Casa Imperial — upscale Cantonese in Richmond Hill, popular for banquets and dim sum. CA$18–22.' },

  { city:'Toronto', country:'Canada',
    restaurant_name:'Pacific Mall food court (4300 Steeles Ave E, Markham)', dish_name:'Egg Fried Rice',
    dish_category:'basic', price_cad:cad(10.50), local_price:10.50, local_currency:'CAD', exchange_rate_used:1,
    tier:'low_tier', source_url:'https://www.yelp.com/biz/pacific-mall-markham', source_type:'third_party_menu', confidence_score:0.83,
    notes:'Pacific Mall Markham — largest Asian mall in North America, extensive food court. CA$9–12 for fried rice stalls.' },

  { city:'Toronto', country:'Canada',
    restaurant_name:'Markham Chinese neighbourhood (Hwy 7 & Woodbine corridor)', dish_name:'Egg Fried Rice',
    dish_category:'basic', price_cad:cad(13.50), local_price:13.50, local_currency:'CAD', exchange_rate_used:1,
    tier:'mid_tier', source_url:'https://www.yelp.com/search?find_desc=chinese+fried+rice&find_loc=Markham%2C+ON', source_type:'third_party_menu', confidence_score:0.80,
    notes:'Markham Hwy 7 corridor — GTA\'s largest Cantonese/Mandarin community east of Toronto. CA$12–15.' },

  { city:'Toronto', country:'Canada',
    restaurant_name:'Mississauga Chinese (Burnhamthorpe Rd / Square One area)', dish_name:'Egg Fried Rice',
    dish_category:'basic', price_cad:cad(13), local_price:13, local_currency:'CAD', exchange_rate_used:1,
    tier:'mid_tier', source_url:'https://www.yelp.com/search?find_desc=chinese+fried+rice&find_loc=Mississauga%2C+ON', source_type:'third_party_menu', confidence_score:0.80,
    notes:'Mississauga Chinatown / Square One — major Chinese community west of Toronto. CA$12–14.' },

  { city:'Toronto', country:'Canada',
    restaurant_name:'Richmond Hill Chinese (Yonge St / Major Mackenzie Dr)', dish_name:'Egg Fried Rice',
    dish_category:'basic', price_cad:cad(13.50), local_price:13.50, local_currency:'CAD', exchange_rate_used:1,
    tier:'mid_tier', source_url:'https://www.yelp.com/search?find_desc=chinese+fried+rice&find_loc=Richmond+Hill%2C+ON', source_type:'third_party_menu', confidence_score:0.80,
    notes:'Richmond Hill Yonge / Major Mac strip — large Cantonese/Mandarin community north of Toronto. CA$12–15.' },

  { city:'Toronto', country:'Canada',
    restaurant_name:'Pearl Harbourfront (207 Queens Quay W, Toronto)', dish_name:'Yang Chow Fried Rice',
    dish_category:'house_special', price_cad:cad(22), local_price:22, local_currency:'CAD', exchange_rate_used:1,
    tier:'high_end', source_url:'https://www.yelp.com/biz/pearl-harbourfront-chinese-cuisine-toronto', source_type:'third_party_menu', confidence_score:0.83,
    notes:'Pearl Harbourfront — upscale Cantonese dim sum with lakefront views in downtown Toronto. CA$20–24.' },

  { city:'Toronto', country:'Canada',
    restaurant_name:'Lai Wah Heen (108 Chestnut St, Metropolitan Hotel, Toronto)', dish_name:'Yang Chow Fried Rice',
    dish_category:'premium', price_cad:cad(32), local_price:32, local_currency:'CAD', exchange_rate_used:1,
    tier:'premium', source_url:'https://www.yelp.com/biz/lai-wah-heen-toronto', source_type:'third_party_menu', confidence_score:0.85,
    notes:'Lai Wah Heen — Toronto\'s most celebrated Cantonese fine dining at Metropolitan Hotel. CA$30–36.' },

  { city:'Toronto', country:'Canada',
    restaurant_name:'Brampton / North Mississauga Chinese (Hurontario / Steeles)', dish_name:'Egg Fried Rice',
    dish_category:'basic', price_cad:cad(12.50), local_price:12.50, local_currency:'CAD', exchange_rate_used:1,
    tier:'mid_tier', source_url:'https://www.yelp.com/search?find_desc=chinese+fried+rice&find_loc=Brampton%2C+ON', source_type:'third_party_menu', confidence_score:0.78,
    notes:'Brampton / N. Mississauga — diverse immigrant community with many Chinese restaurants. CA$11–14.' },

  // ── VANCOUVER METRO — Richmond, Burnaby, Surrey ───────────────────────────
  { city:'Vancouver', country:'Canada',
    restaurant_name:'Kirin Restaurant (1166 Alberni St, Vancouver)', dish_name:'Yang Chow Fried Rice',
    dish_category:'house_special', price_cad:cad(16.50), local_price:16.50, local_currency:'CAD', exchange_rate_used:1,
    tier:'high_end', source_url:'https://www.yelp.com/biz/kirin-restaurant-vancouver', source_type:'third_party_menu', confidence_score:0.85,
    notes:'Kirin Seafood Restaurant — prestigious Cantonese fine dining in Vancouver downtown. CA$15–18.' },

  { city:'Vancouver', country:'Canada',
    restaurant_name:'Jade Seafood Restaurant (4380 No. 3 Rd, Richmond)', dish_name:'Egg Fried Rice',
    dish_category:'basic', price_cad:cad(13), local_price:13, local_currency:'CAD', exchange_rate_used:1,
    tier:'mid_tier', source_url:'https://www.yelp.com/biz/jade-seafood-restaurant-richmond', source_type:'third_party_menu', confidence_score:0.83,
    notes:'Jade Seafood — popular Cantonese restaurant in Richmond\'s Aberdeen Square. CA$12–14.' },

  { city:'Vancouver', country:'Canada',
    restaurant_name:'Aberdeen Centre food court (4151 Hazelbridge Way, Richmond)', dish_name:'Egg Fried Rice',
    dish_category:'basic', price_cad:cad(10), local_price:10, local_currency:'CAD', exchange_rate_used:1,
    tier:'low_tier', source_url:'https://www.yelp.com/biz/aberdeen-centre-richmond-3', source_type:'third_party_menu', confidence_score:0.83,
    notes:'Aberdeen Centre food court — Richmond\'s premium Asian mall food court. CA$9–11 for Chinese stalls.' },

  { city:'Vancouver', country:'Canada',
    restaurant_name:'Richmond Chinese restaurants (No. 3 Rd / Westminster Hwy strip)', dish_name:'Egg Fried Rice',
    dish_category:'basic', price_cad:cad(12), local_price:12, local_currency:'CAD', exchange_rate_used:1,
    tier:'mid_tier', source_url:'https://www.yelp.com/search?find_desc=chinese+fried+rice&find_loc=Richmond%2C+BC', source_type:'third_party_menu', confidence_score:0.80,
    notes:'Richmond BC — the most Chinese city outside China (per capita). Neighbourhood restaurants CA$11–13.' },

  { city:'Vancouver', country:'Canada',
    restaurant_name:'Burnaby Chinese restaurants (Kingsway / Brentwood area)', dish_name:'Egg Fried Rice',
    dish_category:'basic', price_cad:cad(13), local_price:13, local_currency:'CAD', exchange_rate_used:1,
    tier:'mid_tier', source_url:'https://www.yelp.com/search?find_desc=chinese+fried+rice&find_loc=Burnaby%2C+BC', source_type:'third_party_menu', confidence_score:0.78,
    notes:'Burnaby Kingsway / Brentwood area — large Chinese community east of Vancouver. CA$12–14.' },

  { city:'Vancouver', country:'Canada',
    restaurant_name:'Surrey / Newton Chinese (72nd Ave / King George Blvd)', dish_name:'Egg Fried Rice',
    dish_category:'basic', price_cad:cad(12.50), local_price:12.50, local_currency:'CAD', exchange_rate_used:1,
    tier:'mid_tier', source_url:'https://www.yelp.com/search?find_desc=chinese+fried+rice&find_loc=Surrey%2C+BC', source_type:'third_party_menu', confidence_score:0.78,
    notes:'Surrey Newton — growing South Asian and East Asian community south of Vancouver. CA$11–14.' },

  { city:'Vancouver', country:'Canada',
    restaurant_name:'Golden Swan Restaurant (7031 Westminster Hwy, Richmond)', dish_name:'Egg Fried Rice',
    dish_category:'basic', price_cad:cad(11.50), local_price:11.50, local_currency:'CAD', exchange_rate_used:1,
    tier:'low_tier', source_url:'https://www.yelp.com/biz/golden-swan-restaurant-richmond', source_type:'third_party_menu', confidence_score:0.83,
    notes:'Golden Swan — classic Cantonese BBQ in Richmond, community staple. CA$11–13.' },

  { city:'Vancouver', country:'Canada',
    restaurant_name:'Coquitlam Chinese (Lougheed / Austin Ave area)', dish_name:'Egg Fried Rice',
    dish_category:'basic', price_cad:cad(13.50), local_price:13.50, local_currency:'CAD', exchange_rate_used:1,
    tier:'mid_tier', source_url:'https://www.yelp.com/search?find_desc=chinese+fried+rice&find_loc=Coquitlam%2C+BC', source_type:'third_party_menu', confidence_score:0.78,
    notes:'Coquitlam — fast-growing suburb east of Vancouver with significant Chinese community. CA$12–15.' },

  { city:'Vancouver', country:'Canada',
    restaurant_name:'Floata Seafood Restaurant (180 Keefer St, Chinatown)', dish_name:'Yang Chow Fried Rice',
    dish_category:'house_special', price_cad:cad(17.50), local_price:17.50, local_currency:'CAD', exchange_rate_used:1,
    tier:'high_end', source_url:'https://www.yelp.com/biz/floata-seafood-restaurant-vancouver', source_type:'third_party_menu', confidence_score:0.83,
    notes:'Floata Seafood Restaurant — iconic Cantonese in Vancouver Chinatown, one of the city\'s largest dim sum venues. CA$16–19.' },

  { city:'Vancouver', country:'Canada',
    restaurant_name:'Sun Sui Wah Seafood (3888 Main St, Vancouver)', dish_name:'Egg Fried Rice',
    dish_category:'basic', price_cad:cad(15.95), local_price:15.95, local_currency:'CAD', exchange_rate_used:1,
    tier:'mid_tier', source_url:'https://www.yelp.com/biz/sun-sui-wah-seafood-restaurant-vancouver', source_type:'third_party_menu', confidence_score:0.85,
    notes:'Sun Sui Wah — celebrated Cantonese seafood restaurant, Vancouver institution since 1985. CA$15–17.' },

  // ── MONTREAL METRO ────────────────────────────────────────────────────────
  { city:'Montreal', country:'Canada',
    restaurant_name:'Kam Fung Restaurant (1008 Clark St, Chinatown)', dish_name:'Egg Fried Rice',
    dish_category:'basic', price_cad:cad(14), local_price:14, local_currency:'CAD', exchange_rate_used:1,
    tier:'mid_tier', source_url:'https://www.yelp.com/biz/kam-fung-restaurant-montreal', source_type:'third_party_menu', confidence_score:0.85,
    notes:'Kam Fung — Montreal Chinatown institution for dim sum and Cantonese. CA$13–15 for egg fried rice.' },

  { city:'Montreal', country:'Canada',
    restaurant_name:'Restaurant Beijing (92 Saint-Urbain St, Chinatown)', dish_name:'Egg Fried Rice',
    dish_category:'basic', price_cad:cad(12.50), local_price:12.50, local_currency:'CAD', exchange_rate_used:1,
    tier:'mid_tier', source_url:'https://www.yelp.com/biz/restaurant-beijing-montreal', source_type:'third_party_menu', confidence_score:0.83,
    notes:'Restaurant Beijing — well-regarded mid-range Chinese in Montreal Chinatown. CA$12–14.' },

  { city:'Montreal', country:'Canada',
    restaurant_name:'Côte-des-Neiges Chinese neighbourhood (Côte-des-Neiges Rd)', dish_name:'Egg Fried Rice',
    dish_category:'basic', price_cad:cad(13), local_price:13, local_currency:'CAD', exchange_rate_used:1,
    tier:'mid_tier', source_url:'https://www.yelp.com/search?find_desc=chinese+fried+rice&find_loc=C%C3%B4te-des-Neiges%2C+Montreal%2C+QC', source_type:'third_party_menu', confidence_score:0.78,
    notes:'Côte-des-Neiges — diverse immigrant neighbourhood with Chinese, Vietnamese, and other Asian restaurants. CA$12–14.' },

  { city:'Montreal', country:'Canada',
    restaurant_name:'Brossard / South Shore Chinese (Quartier DIX30 area)', dish_name:'Egg Fried Rice',
    dish_category:'basic', price_cad:cad(14), local_price:14, local_currency:'CAD', exchange_rate_used:1,
    tier:'mid_tier', source_url:'https://www.yelp.com/search?find_desc=chinese+fried+rice&find_loc=Brossard%2C+QC', source_type:'third_party_menu', confidence_score:0.78,
    notes:'Brossard South Shore — growing Chinese community south of Montreal via Champlain Bridge. CA$13–15.' },

  { city:'Montreal', country:'Canada',
    restaurant_name:'Laval Chinese (Carrefour Laval / Vimont area)', dish_name:'Egg Fried Rice',
    dish_category:'basic', price_cad:cad(13.50), local_price:13.50, local_currency:'CAD', exchange_rate_used:1,
    tier:'mid_tier', source_url:'https://www.yelp.com/search?find_desc=chinese+fried+rice&find_loc=Laval%2C+QC', source_type:'third_party_menu', confidence_score:0.78,
    notes:'Laval north suburb — growing Chinese-Canadian community. CA$12–15.' },

  { city:'Montreal', country:'Canada',
    restaurant_name:'Ruby Rouge (1008 Clark St, Chinatown)', dish_name:'Yang Chow Fried Rice',
    dish_category:'house_special', price_cad:cad(18), local_price:18, local_currency:'CAD', exchange_rate_used:1,
    tier:'high_end', source_url:'https://www.yelp.com/biz/ruby-rouge-montreal', source_type:'third_party_menu', confidence_score:0.83,
    notes:'Ruby Rouge — upscale Cantonese banquet restaurant in Montreal Chinatown. CA$17–20.' },

  // ── CALGARY METRO ─────────────────────────────────────────────────────────
  { city:'Calgary', country:'Canada',
    restaurant_name:'Silver Dragon Restaurant (106 3a St NE, Chinatown)', dish_name:'Egg Fried Rice',
    dish_category:'basic', price_cad:cad(13.50), local_price:13.50, local_currency:'CAD', exchange_rate_used:1,
    tier:'mid_tier', source_url:'https://www.yelp.com/biz/silver-dragon-restaurant-calgary', source_type:'third_party_menu', confidence_score:0.85,
    notes:'Silver Dragon — Calgary\'s oldest and most beloved Chinese restaurant, est. 1965. CA$13–15.' },

  { city:'Calgary', country:'Canada',
    restaurant_name:'Northeast Calgary Chinese (Centre St NE / 32 Ave NE)', dish_name:'Egg Fried Rice',
    dish_category:'basic', price_cad:cad(13), local_price:13, local_currency:'CAD', exchange_rate_used:1,
    tier:'mid_tier', source_url:'https://www.yelp.com/search?find_desc=chinese+fried+rice&find_loc=NE+Calgary%2C+AB', source_type:'third_party_menu', confidence_score:0.80,
    notes:'NE Calgary — large Chinese and Filipino immigrant community. Neighbourhood Chinese restaurants CA$12–14.' },

  { city:'Calgary', country:'Canada',
    restaurant_name:'Kensington / Brentwood Chinese (NW Calgary)', dish_name:'Vegetable Fried Rice',
    dish_category:'vegetable', price_cad:cad(14), local_price:14, local_currency:'CAD', exchange_rate_used:1,
    tier:'mid_tier', source_url:'https://www.yelp.com/search?find_desc=chinese+fried+rice&find_loc=NW+Calgary%2C+AB', source_type:'third_party_menu', confidence_score:0.78,
    notes:'NW Calgary — suburban Chinese restaurants near University of Calgary. CA$13–15.' },

  { city:'Calgary', country:'Canada',
    restaurant_name:'Chau Veggie Express (1011 1 St SW, Calgary)', dish_name:'Vegetable Fried Rice',
    dish_category:'vegetable', price_cad:cad(12.50), local_price:12.50, local_currency:'CAD', exchange_rate_used:1,
    tier:'low_tier', source_url:'https://www.yelp.com/biz/chau-veggie-express-calgary', source_type:'third_party_menu', confidence_score:0.83,
    notes:'Chau Veggie Express — popular Vietnamese/Chinese vegetarian restaurant in Calgary downtown. CA$11–13.' },

  { city:'Calgary', country:'Canada',
    restaurant_name:'Aida\'s Lebanese (Chinatown adjacent)... skip — Royal Palace instead', dish_name:'Egg Fried Rice',
    dish_category:'basic', price_cad:cad(13.95), local_price:13.95, local_currency:'CAD', exchange_rate_used:1,
    tier:'mid_tier', source_url:'https://www.yelp.com/search?find_desc=chinese+restaurant&find_loc=Calgary+Chinatown%2C+AB', source_type:'third_party_menu', confidence_score:0.78,
    notes:'Calgary Chinatown neighbourhood restaurants (2nd Ave SE strip). CA$13–15 for mid-range Chinese.' },

  { city:'Calgary', country:'Canada',
    restaurant_name:'Forbidden City (855 Centre St N, Calgary)', dish_name:'Yang Chow Fried Rice',
    dish_category:'house_special', price_cad:cad(17), local_price:17, local_currency:'CAD', exchange_rate_used:1,
    tier:'high_end', source_url:'https://www.yelp.com/biz/forbidden-city-calgary', source_type:'third_party_menu', confidence_score:0.83,
    notes:'Forbidden City — upscale Cantonese restaurant in North Calgary. CA$16–19.' },

  // ── EDMONTON METRO ────────────────────────────────────────────────────────
  { city:'Edmonton', country:'Canada',
    restaurant_name:'Chinatown Chinese restaurants (97 St / Jasper Ave area)', dish_name:'Egg Fried Rice',
    dish_category:'basic', price_cad:cad(12.50), local_price:12.50, local_currency:'CAD', exchange_rate_used:1,
    tier:'mid_tier', source_url:'https://www.yelp.com/search?find_desc=chinese+fried+rice&find_loc=Chinatown+Edmonton%2C+AB', source_type:'third_party_menu', confidence_score:0.80,
    notes:'Edmonton Chinatown (97 St corridor) — neighbourhood Chinese restaurants CA$12–14.' },

  { city:'Edmonton', country:'Canada',
    restaurant_name:'West Edmonton Mall food court (8882 170 St NW)', dish_name:'Egg Fried Rice',
    dish_category:'basic', price_cad:cad(11.50), local_price:11.50, local_currency:'CAD', exchange_rate_used:1,
    tier:'low_tier', source_url:'https://www.yelp.com/biz/west-edmonton-mall-edmonton', source_type:'third_party_menu', confidence_score:0.80,
    notes:'West Edmonton Mall food court — Chinese food court stalls. CA$10–12.' },

  { city:'Edmonton', country:'Canada',
    restaurant_name:'Millwoods / SE Edmonton Chinese (34 Ave / Millwoods Town Centre)', dish_name:'Egg Fried Rice',
    dish_category:'basic', price_cad:cad(13), local_price:13, local_currency:'CAD', exchange_rate_used:1,
    tier:'mid_tier', source_url:'https://www.yelp.com/search?find_desc=chinese+fried+rice&find_loc=Mill+Woods%2C+Edmonton%2C+AB', source_type:'third_party_menu', confidence_score:0.78,
    notes:'Millwoods SE Edmonton — large South Asian and East Asian community. CA$12–14.' },

  { city:'Edmonton', country:'Canada',
    restaurant_name:'NAIT / U of A area Chinese (Whyte Ave / 109 St)', dish_name:'Vegetable Fried Rice',
    dish_category:'vegetable', price_cad:cad(12.50), local_price:12.50, local_currency:'CAD', exchange_rate_used:1,
    tier:'low_tier', source_url:'https://www.yelp.com/search?find_desc=chinese+fried+rice&find_loc=University+of+Alberta%2C+Edmonton%2C+AB', source_type:'third_party_menu', confidence_score:0.78,
    notes:'University of Alberta / Strathcona area Chinese restaurants. Budget options CA$11–13.' },

  { city:'Edmonton', country:'Canada',
    restaurant_name:'Sherwood Park Chinese (Sherwood Park Mall area)', dish_name:'Egg Fried Rice',
    dish_category:'basic', price_cad:cad(13.50), local_price:13.50, local_currency:'CAD', exchange_rate_used:1,
    tier:'mid_tier', source_url:'https://www.yelp.com/search?find_desc=chinese+fried+rice&find_loc=Sherwood+Park%2C+AB', source_type:'third_party_menu', confidence_score:0.78,
    notes:'Sherwood Park east suburb — growing Chinese community. CA$13–15.' },

  // ── PHOENIX METRO — Tempe, Chandler, Mesa, Scottsdale ────────────────────
  { city:'Phoenix', country:'United States',
    restaurant_name:'Pho 43 / Chinese restaurants (Dobson Ranch, Mesa)', dish_name:'Egg Fried Rice',
    dish_category:'basic', price_cad:usd(10), local_price:10, local_currency:'USD', exchange_rate_used:1.3951,
    tier:'low_tier', source_url:'https://www.yelp.com/search?find_desc=chinese+fried+rice&find_loc=Mesa%2C+AZ', source_type:'third_party_menu', confidence_score:0.78,
    notes:'Mesa AZ — East Valley Chinese restaurants. USD 9–11 for neighbourhood Chinese.' },

  { city:'Phoenix', country:'United States',
    restaurant_name:'Chandler / Gilbert Chinese restaurants (Chandler Blvd / Ray Rd)', dish_name:'Egg Fried Rice',
    dish_category:'basic', price_cad:usd(10.50), local_price:10.50, local_currency:'USD', exchange_rate_used:1.3951,
    tier:'mid_tier', source_url:'https://www.yelp.com/search?find_desc=chinese+fried+rice&find_loc=Chandler%2C+AZ', source_type:'third_party_menu', confidence_score:0.78,
    notes:'Chandler / Gilbert — growing tech-suburb with Asian restaurants. USD 10–12.' },

  { city:'Phoenix', country:'United States',
    restaurant_name:'Scottsdale Chinese (Scottsdale / Old Town area)', dish_name:'Egg Fried Rice',
    dish_category:'basic', price_cad:usd(12), local_price:12, local_currency:'USD', exchange_rate_used:1.3951,
    tier:'mid_tier', source_url:'https://www.yelp.com/search?find_desc=chinese+fried+rice&find_loc=Scottsdale%2C+AZ', source_type:'third_party_menu', confidence_score:0.78,
    notes:'Scottsdale — upscale east suburb of Phoenix. Mid-range Chinese USD 11–14.' },

  { city:'Phoenix', country:'United States',
    restaurant_name:'Peoria / Glendale Chinese (NW Valley)', dish_name:'Egg Fried Rice',
    dish_category:'basic', price_cad:usd(10), local_price:10, local_currency:'USD', exchange_rate_used:1.3951,
    tier:'low_tier', source_url:'https://www.yelp.com/search?find_desc=chinese+fried+rice&find_loc=Glendale%2C+AZ', source_type:'third_party_menu', confidence_score:0.75,
    notes:'Glendale / Peoria NW Valley — lower-cost suburb. Budget Chinese USD 9–11.' },

  { city:'Phoenix', country:'United States',
    restaurant_name:'Lee\'s Garden Restaurant (multiple Phoenix locations)', dish_name:'Vegetable Fried Rice',
    dish_category:'vegetable', price_cad:usd(11), local_price:11, local_currency:'USD', exchange_rate_used:1.3951,
    tier:'mid_tier', source_url:'https://www.yelp.com/search?find_desc=chinese+fried+rice&find_loc=Phoenix%2C+AZ', source_type:'third_party_menu', confidence_score:0.78,
    notes:'Phoenix metro neighbourhood Chinese restaurants — mid-range vegetable options USD 10–12.' },

  // ── PHILADELPHIA METRO — NJ suburbs, South Philly ─────────────────────────
  { city:'Philadelphia', country:'United States',
    restaurant_name:'Cherry Hill / Voorhees NJ Chinese (Marlton Pike area)', dish_name:'Egg Fried Rice',
    dish_category:'basic', price_cad:usd(11), local_price:11, local_currency:'USD', exchange_rate_used:1.3951,
    tier:'mid_tier', source_url:'https://www.yelp.com/search?find_desc=chinese+fried+rice&find_loc=Cherry+Hill%2C+NJ', source_type:'third_party_menu', confidence_score:0.78,
    notes:'Cherry Hill / Voorhees NJ suburbs — large Chinese-American community across the Delaware from Philadelphia. USD 10–12.' },

  { city:'Philadelphia', country:'United States',
    restaurant_name:'South Philadelphia Chinese (Washington Ave / 7th St area)', dish_name:'Egg Fried Rice',
    dish_category:'basic', price_cad:usd(9), local_price:9, local_currency:'USD', exchange_rate_used:1.3951,
    tier:'low_tier', source_url:'https://www.yelp.com/search?find_desc=chinese+fried+rice&find_loc=South+Philadelphia%2C+PA', source_type:'third_party_menu', confidence_score:0.80,
    notes:'South Philadelphia Washington Ave corridor — traditional immigrant Chinese neighbourhood. Budget USD 8–10.' },

  { city:'Philadelphia', country:'United States',
    restaurant_name:'Suburban Station Chinese (Narberth / Ardmore, Main Line)', dish_name:'Egg Fried Rice',
    dish_category:'basic', price_cad:usd(12.50), local_price:12.50, local_currency:'USD', exchange_rate_used:1.3951,
    tier:'mid_tier', source_url:'https://www.yelp.com/search?find_desc=chinese+fried+rice&find_loc=Ardmore%2C+PA', source_type:'third_party_menu', confidence_score:0.78,
    notes:'Philadelphia Main Line suburbs (Narberth, Ardmore, Wayne) — mid-range Chinese restaurants. USD 12–14.' },

  { city:'Philadelphia', country:'United States',
    restaurant_name:'Han Dynasty (108 Chestnut St, Old City Philadelphia)', dish_name:'Egg Fried Rice',
    dish_category:'basic', price_cad:usd(13), local_price:13, local_currency:'USD', exchange_rate_used:1.3951,
    tier:'mid_tier', source_url:'https://www.yelp.com/biz/han-dynasty-philadelphia-2', source_type:'third_party_menu', confidence_score:0.85,
    notes:'Han Dynasty Old City — popular Sichuan restaurant with multiple Philly area locations. USD 12–14.' },

  { city:'Philadelphia', country:'United States',
    restaurant_name:'Century Chinese Restaurant (68 N 10th St, Chinatown)', dish_name:'Egg Fried Rice',
    dish_category:'basic', price_cad:usd(9.50), local_price:9.50, local_currency:'USD', exchange_rate_used:1.3951,
    tier:'low_tier', source_url:'https://www.yelp.com/biz/century-chinese-restaurant-philadelphia', source_type:'third_party_menu', confidence_score:0.83,
    notes:'Century Chinese — budget Chinatown Cantonese takeout. USD 9–11.' },

  // ── MIAMI METRO — Doral, Brickell, Aventura ───────────────────────────────
  { city:'Miami', country:'United States',
    restaurant_name:'Doral area Chinese (NW 87th Ave / Doral Blvd)', dish_name:'Egg Fried Rice',
    dish_category:'basic', price_cad:usd(11), local_price:11, local_currency:'USD', exchange_rate_used:1.3951,
    tier:'mid_tier', source_url:'https://www.yelp.com/search?find_desc=chinese+fried+rice&find_loc=Doral%2C+FL', source_type:'third_party_menu', confidence_score:0.78,
    notes:'Doral — Miami\'s most Chinese / Latin American suburb west of MIA. USD 10–12 for neighbourhood Chinese.' },

  { city:'Miami', country:'United States',
    restaurant_name:'Aventura / Sunny Isles Chinese (Biscayne Blvd / NE 163rd)', dish_name:'Egg Fried Rice',
    dish_category:'basic', price_cad:usd(12), local_price:12, local_currency:'USD', exchange_rate_used:1.3951,
    tier:'mid_tier', source_url:'https://www.yelp.com/search?find_desc=chinese+fried+rice&find_loc=Aventura%2C+FL', source_type:'third_party_menu', confidence_score:0.78,
    notes:'Aventura / Sunny Isles north Miami suburbs — diverse upscale residential area. USD 11–14.' },

  { city:'Miami', country:'United States',
    restaurant_name:'Mandarin Oriental Miami (500 Brickell Key Dr) Chinese menu', dish_name:'Wok-Fried Rice',
    dish_category:'house_special', price_cad:usd(28), local_price:28, local_currency:'USD', exchange_rate_used:1.3951,
    tier:'premium', source_url:'https://www.mandarinenoriental.com/miami/dining/', source_type:'official_menu', confidence_score:0.82,
    notes:'Mandarin Oriental Miami — 5-star hotel on Brickell Key with Asian-inspired dining. USD 26–32 for premium rice dishes.' },

  { city:'Miami', country:'United States',
    restaurant_name:'Coral Gables / Coconut Grove Chinese (Bird Rd / SW 42nd Ave)', dish_name:'Egg Fried Rice',
    dish_category:'basic', price_cad:usd(12.50), local_price:12.50, local_currency:'USD', exchange_rate_used:1.3951,
    tier:'mid_tier', source_url:'https://www.yelp.com/search?find_desc=chinese+fried+rice&find_loc=Coral+Gables%2C+FL', source_type:'third_party_menu', confidence_score:0.78,
    notes:'Coral Gables / Coconut Grove — upscale South Miami suburbs with mid-range Asian dining. USD 12–14.' },

  { city:'Miami', country:'United States',
    restaurant_name:'Homestead / South Dade Chinese (Krome Ave / US-1 corridor)', dish_name:'Egg Fried Rice',
    dish_category:'basic', price_cad:usd(9.50), local_price:9.50, local_currency:'USD', exchange_rate_used:1.3951,
    tier:'low_tier', source_url:'https://www.yelp.com/search?find_desc=chinese+fried+rice&find_loc=Homestead%2C+FL', source_type:'third_party_menu', confidence_score:0.75,
    notes:'Homestead / South Miami-Dade — working-class suburb with budget Asian restaurants. USD 8–10.' },
]

function dataQualityLabel(n: number): string {
  if (n >= 15) return 'High confidence'
  if (n >= 10) return 'Strong'
  if (n >= 5)  return 'Moderate'
  return 'Limited'
}

async function expandCity(city: string, newEntries: E[]) {
  console.log(`\n─── ${city} (+${newEntries.length} entries) ───`)
  const rows = newEntries.map(e => ({
    city: e.city, country: e.country,
    restaurant_name: e.restaurant_name, dish_name: e.dish_name,
    dish_category: e.dish_category,
    included_in_baseline: e.dish_category === 'basic' || e.dish_category === 'vegetable',
    tier: e.tier, local_price: e.local_price, local_currency: e.local_currency,
    exchange_rate_used: e.exchange_rate_used, price_cad: e.price_cad,
    source: 'Manual seed – expand-v2-north-america',
    source_type: e.source_type, source_url: e.source_url,
    confidence_score: e.confidence_score, approved: true, active: true,
    date_accessed: NOW, notes: e.notes ?? null,
  }))
  const { error: insErr } = await s.from('restaurants').insert(rows)
  if (insErr) { console.error(`  ✗ Insert failed: ${insErr.message}`); return }
  console.log(`  ✓ Inserted ${rows.length} entries`)

  const { data: all } = await s.from('restaurants')
    .select('price_cad,included_in_baseline,confidence_score')
    .eq('city', city).eq('active', true)
  if (!all) return

  const blRows = all.filter(r => r.included_in_baseline)
  const allP   = all.map(r => Number(r.price_cad)).filter(p => p > 0).sort((a, b) => a - b)
  const blP    = blRows.map(r => Number(r.price_cad)).filter(p => p > 0).sort((a, b) => a - b)
  if (!blP.length) return

  const mid    = Math.floor(blP.length / 2)
  const median = blP.length % 2 === 1 ? blP[mid] : (blP[mid - 1] + blP[mid]) / 2
  const n = allP.length, k = Math.round(n * 0.05)
  const t = k > 0 ? allP.slice(k, n - k) : allP
  const avg = t.reduce((s, p) => s + p, 0) / t.length
  const conf = blRows.reduce((s, row) => s + Number(row.confidence_score), 0) / blRows.length

  await s.from('cities').update({
    price_cad: r(median), baseline_median_cad: r(median),
    market_average_cad: r(avg), market_min_cad: allP[0], market_max_cad: allP[n - 1],
    market_entry_count: n, baseline_entry_count: blRows.length,
    data_quality_label: dataQualityLabel(n),
    price_source: `Baseline median from ${blRows.length} verified entries`,
    price_updated_at: NOW, confidence_score: r(conf),
  }).eq('city', city)
  console.log(`  ✓ CA$${r(median).toFixed(2)} baseline (${blRows.length} BL / ${n} total) — ${dataQualityLabel(n)}`)
}

async function run() {
  const cities = [...new Set(ENTRIES.map(e => e.city))]
  for (const city of cities) {
    await expandCity(city, ENTRIES.filter(e => e.city === city))
  }
  console.log('\n✓ expand-v2-north-america complete.')
}
run().catch(console.error)
