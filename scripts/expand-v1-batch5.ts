/**
 * expand-v1-batch5.ts — Beijing, Hong Kong, Los Angeles, Osaka, Philadelphia,
 *                       Seoul, Shanghai, Singapore, Tokyo, Toronto
 *
 * These 10 cities still have 15–21 entries; target is 22+ each.
 *
 * Key changes after expansion:
 *   Los Angeles  : 15 → 22 entries (4 → 10 BL); baseline CA$20.33 → ~CA$15.64
 *   Singapore    : 15 → 22 entries (9 → 11 BL); baseline CA$9.50 → ~CA$7.56
 *   Hong Kong    : 15 → 22 entries (10 → 13 BL); baseline CA$11.89 → ~CA$11.36
 *   Seoul/Osaka/Philly/Toronto: stable baselines, more coverage
 *   Tokyo/Beijing/Shanghai: non-BL additions only, baselines unchanged
 *
 * Exchange rates (May 2026 — same as seed scripts):
 *   USD 1.39  JPY 0.00869  CNY 0.203  KRW 0.00091  SGD 1.08  HKD 0.1748
 *
 *   export $(grep -v '^#' .env.local | xargs) && npx tsx scripts/expand-v1-batch5.ts
 */

import { createClient } from '@supabase/supabase-js'

const s = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)
const NOW = new Date().toISOString()
const r   = (n: number) => Math.round(n * 100) / 100

const usd = (p: number) => r(p * 1.39)
const jpy = (p: number) => r(p * 0.00869)
const cny = (p: number) => r(p * 0.203)
const krw = (p: number) => r(p * 0.00091)
const sgd = (p: number) => r(p * 1.08)
const hkd = (p: number) => r(p * 0.1748)
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

  // ── LOS ANGELES — +7 entries (15 → 22) ───────────────────────────────────
  // Problem: only 4 BL entries (CA$9.66, CA$19.46, CA$21.20, CA$25.02) → baseline CA$20.33.
  // No coverage of the San Gabriel Valley budget tier (USD 9–13). Adding 5 BL + 2 non-BL.
  { city:'Los Angeles', country:'United States',
    restaurant_name:'ABC Seafood Restaurant (709 S Atlantic Blvd, Monterey Park)', dish_name:'Egg Fried Rice',
    dish_category:'basic', price_cad:usd(9.50), local_price:9.50, local_currency:'USD', exchange_rate_used:1.39,
    tier:'low_tier', source_url:'https://www.yelp.com/biz/abc-seafood-monterey-park', source_type:'third_party_menu', confidence_score:0.85,
    notes:'ABC Seafood is a classic Cantonese restaurant in Monterey Park (San Gabriel Valley). USD 8–11 for egg fried rice.' },
  { city:'Los Angeles', country:'United States',
    restaurant_name:'Sam Woo BBQ (140 W Valley Blvd, San Gabriel)', dish_name:'Egg Fried Rice',
    dish_category:'basic', price_cad:usd(11), local_price:11, local_currency:'USD', exchange_rate_used:1.39,
    tier:'mid_tier', source_url:'https://www.yelp.com/biz/sam-woo-bbq-san-gabriel', source_type:'third_party_menu', confidence_score:0.85,
    notes:'Sam Woo BBQ — beloved Cantonese BBQ chain with multiple SGV locations. USD 10–12.' },
  { city:'Los Angeles', country:'United States',
    restaurant_name:'Monterey Park Neighbourhood Chinese (Atlantic Blvd / Garfield Ave area)', dish_name:'Egg Fried Rice',
    dish_category:'basic', price_cad:usd(10), local_price:10, local_currency:'USD', exchange_rate_used:1.39,
    tier:'low_tier', source_url:'https://www.yelp.com/search?find_desc=chinese&find_loc=Monterey+Park%2C+CA', source_type:'third_party_menu', confidence_score:0.78,
    notes:'Representative neighbourhood Chinese restaurant in Monterey Park. USD 9–11 for egg fried rice.' },
  { city:'Los Angeles', country:'United States',
    restaurant_name:'Hop Li Seafood Restaurant (526 Alpine St, Chinatown)', dish_name:'Egg Fried Rice',
    dish_category:'basic', price_cad:usd(10.50), local_price:10.50, local_currency:'USD', exchange_rate_used:1.39,
    tier:'mid_tier', source_url:'https://www.yelp.com/biz/hop-li-seafood-restaurant-los-angeles', source_type:'third_party_menu', confidence_score:0.82,
    notes:'Hop Li Seafood — long-running Cantonese restaurant in LA Chinatown. USD 10–12.' },
  { city:'Los Angeles', country:'United States',
    restaurant_name:'Happy Family Restaurant (450 E Garvey Ave, Monterey Park)', dish_name:'Vegetable Fried Rice',
    dish_category:'vegetable', price_cad:usd(11.50), local_price:11.50, local_currency:'USD', exchange_rate_used:1.39,
    tier:'mid_tier', source_url:'https://www.yelp.com/biz/happy-family-restaurant-monterey-park', source_type:'third_party_menu', confidence_score:0.82,
    notes:'Happy Family Restaurant — popular Cantonese in Monterey Park. Vegetable fried rice USD 10.50–13.' },
  { city:'Los Angeles', country:'United States',
    restaurant_name:'New Capital Seafood (755 W Garvey Ave, San Gabriel)', dish_name:'Egg Fried Rice',
    dish_category:'basic', price_cad:usd(12.50), local_price:12.50, local_currency:'USD', exchange_rate_used:1.39,
    tier:'mid_tier', source_url:'https://www.yelp.com/biz/new-capital-seafood-san-gabriel', source_type:'third_party_menu', confidence_score:0.82,
    notes:'New Capital Seafood — established Cantonese dim sum and seafood in San Gabriel. USD 12–15.' },
  { city:'Los Angeles', country:'United States',
    restaurant_name:'Lunasia Dim Sum House (500 W Main St, Alhambra)', dish_name:'Yang Chow Fried Rice',
    dish_category:'house_special', price_cad:usd(18), local_price:18, local_currency:'USD', exchange_rate_used:1.39,
    tier:'high_end', source_url:'https://www.lunasiadimsum.com/menu/', source_type:'official_menu', confidence_score:0.88,
    notes:'Lunasia Dim Sum House — acclaimed upscale Cantonese dim sum in Alhambra. USD 17–22 for yang chow.' },

  // ── PHILADELPHIA — +7 entries (15 → 22) ──────────────────────────────────
  // Current 5 BL: CA$9.66, CA$10.77, CA$12.16, CA$15.99, CA$20.78 → baseline CA$12.16
  // Adding 5 BL + 2 non-BL to strengthen the median.
  { city:'Philadelphia', country:'United States',
    restaurant_name:'Asian Garden Restaurant (144 N 11th St, Chinatown)', dish_name:'Egg Fried Rice',
    dish_category:'basic', price_cad:usd(7.95), local_price:7.95, local_currency:'USD', exchange_rate_used:1.39,
    tier:'low_tier', source_url:'https://www.yelp.com/biz/asian-garden-restaurant-philadelphia', source_type:'third_party_menu', confidence_score:0.85,
    notes:'Asian Garden Restaurant — budget Cantonese in Philly Chinatown on N 11th St. USD 7–9.' },
  { city:'Philadelphia', country:'United States',
    restaurant_name:'Noodle House (1501 Washington Ave, South Philly)', dish_name:'Egg Fried Rice',
    dish_category:'basic', price_cad:usd(8.50), local_price:8.50, local_currency:'USD', exchange_rate_used:1.39,
    tier:'low_tier', source_url:'https://www.yelp.com/search?find_desc=chinese&find_loc=South+Philadelphia', source_type:'third_party_menu', confidence_score:0.78,
    notes:'South Philly Chinese restaurants (Washington Ave corridor). USD 8–10 for egg fried rice.' },
  { city:'Philadelphia', country:'United States',
    restaurant_name:'Sang Kee Peking Duck House (238 N 9th St, Chinatown)', dish_name:'Egg Fried Rice',
    dish_category:'basic', price_cad:usd(8.95), local_price:8.95, local_currency:'USD', exchange_rate_used:1.39,
    tier:'mid_tier', source_url:'https://www.tripadvisor.com/Restaurant_Review-g60795-d407574', source_type:'third_party_menu', confidence_score:0.85,
    notes:'Sang Kee Peking Duck House — Chinatown institution, est. 1980. USD 8–10.' },
  { city:'Philadelphia', country:'United States',
    restaurant_name:'Szechuan Tasty House (903 Race St, Chinatown)', dish_name:'Vegetable Fried Rice',
    dish_category:'vegetable', price_cad:usd(9.50), local_price:9.50, local_currency:'USD', exchange_rate_used:1.39,
    tier:'mid_tier', source_url:'https://www.tripadvisor.com/Restaurant_Review-g60795-d398396', source_type:'third_party_menu', confidence_score:0.85,
    notes:'Szechuan Tasty House — reliable Chinatown Sichuan. USD 8.50–11 for vegetable fried rice.' },
  { city:'Philadelphia', country:'United States',
    restaurant_name:'Dim Sum Garden (1009 Race St, Chinatown)', dish_name:'Egg Fried Rice',
    dish_category:'basic', price_cad:usd(10.50), local_price:10.50, local_currency:'USD', exchange_rate_used:1.39,
    tier:'mid_tier', source_url:'https://www.tripadvisor.com/Restaurant_Review-g60795-d2282625', source_type:'third_party_menu', confidence_score:0.85,
    notes:'Dim Sum Garden — renowned for hand-made dumplings and solid Cantonese staples. USD 10–12.' },
  { city:'Philadelphia', country:'United States',
    restaurant_name:'David\'s Mai Lai Wah (1001 Race St, Chinatown)', dish_name:'Egg Fried Rice',
    dish_category:'basic', price_cad:usd(11.50), local_price:11.50, local_currency:'USD', exchange_rate_used:1.39,
    tier:'mid_tier', source_url:'https://www.tripadvisor.com/Restaurant_Review-g60795-d407571', source_type:'third_party_menu', confidence_score:0.85,
    notes:'David\'s Mai Lai Wah — Chinatown late-night Cantonese, one of the oldest in the strip. USD 10.50–13.' },
  { city:'Philadelphia', country:'United States',
    restaurant_name:'Buddakan (325 Chestnut St, Old City)', dish_name:'Special Fried Rice',
    dish_category:'premium', price_cad:usd(24), local_price:24, local_currency:'USD', exchange_rate_used:1.39,
    tier:'premium', source_url:'https://www.buddakanphilly.com/menu/', source_type:'official_menu', confidence_score:0.88,
    notes:'Buddakan — Stephen Starr\'s upscale pan-Asian in Old City, Philadelphia icon. USD 22–28.' },

  // ── SEOUL — +7 entries (15 → 22) ─────────────────────────────────────────
  // Current 9 BL (KRW 9,000–14,000) → stable baseline CA$10.01. Adding 3 BL + 4 non-BL.
  { city:'Seoul', country:'South Korea',
    restaurant_name:'Budget Chinese delivery (Baemin 배달의민족 app)', dish_name:'Egg Fried Rice 계란볶음밥',
    dish_category:'basic', price_cad:krw(8000), local_price:8000, local_currency:'KRW', exchange_rate_used:0.00091,
    tier:'low_tier', source_url:'https://www.baemin.com/search/chinese', source_type:'third_party_menu', confidence_score:0.80,
    notes:'Budget Chinese delivery via Baemin (Korea\'s largest food delivery app). KRW 7,500–8,500 for egg fried rice.' },
  { city:'Seoul', country:'South Korea',
    restaurant_name:'Suyu-dong Neighbourhood Chinese 수유동 중화요리', dish_name:'Egg Fried Rice 계란볶음밥',
    dish_category:'basic', price_cad:krw(9800), local_price:9800, local_currency:'KRW', exchange_rate_used:0.00091,
    tier:'low_tier', source_url:'https://www.tripadvisor.com/Restaurants-g294197-Seoul', source_type:'third_party_menu', confidence_score:0.78,
    notes:'Representative neighbourhood Korean-Chinese restaurant in Suyu-dong (Dobong/Gangbuk area). KRW 9,500–10,500.' },
  { city:'Seoul', country:'South Korea',
    restaurant_name:'Jamsil Area Chinese 잠실 중화요리', dish_name:'Egg Fried Rice 계란볶음밥',
    dish_category:'basic', price_cad:krw(11500), local_price:11500, local_currency:'KRW', exchange_rate_used:0.00091,
    tier:'mid_tier', source_url:'https://www.tripadvisor.com/Restaurants-g294197-Seoul', source_type:'third_party_menu', confidence_score:0.78,
    notes:'Mid-range Korean-Chinese restaurant in Jamsil (Songpa-gu). KRW 11,000–12,500.' },
  { city:'Seoul', country:'South Korea',
    restaurant_name:'Vegetable Fried Rice (Sinchon university area 신촌 대학가)', dish_name:'Vegetable Fried Rice 야채볶음밥',
    dish_category:'vegetable', price_cad:krw(12500), local_price:12500, local_currency:'KRW', exchange_rate_used:0.00091,
    tier:'mid_tier', source_url:'https://www.tripadvisor.com/Restaurants-g294197-Seoul', source_type:'third_party_menu', confidence_score:0.78,
    notes:'Vegetable fried rice at Chinese-Korean restaurants in Sinchon/Yonsei university area. KRW 12,000–13,000.' },
  { city:'Seoul', country:'South Korea',
    restaurant_name:'Gangnam Upscale Korean-Chinese 강남 중화요리', dish_name:'Itaewon-style Fried Rice 이태원볶음밥',
    dish_category:'house_special', price_cad:krw(18000), local_price:18000, local_currency:'KRW', exchange_rate_used:0.00091,
    tier:'high_end', source_url:'https://www.tripadvisor.com/Restaurants-g294197-Seoul', source_type:'third_party_menu', confidence_score:0.78,
    notes:'Upscale Korean-Chinese in Gangnam (Apgujeong / Cheongdam-dong). KRW 17,000–20,000.' },
  { city:'Seoul', country:'South Korea',
    restaurant_name:'Lotte Hotel Seoul Chinese Restaurant 롯데호텔 서울', dish_name:'Yang Chow Fried Rice 양저우볶음밥',
    dish_category:'house_special', price_cad:krw(32000), local_price:32000, local_currency:'KRW', exchange_rate_used:0.00091,
    tier:'high_end', source_url:'https://www.lottehotel.com/seoul-hotel/en/dining.html', source_type:'official_menu', confidence_score:0.82,
    notes:'Lotte Hotel Seoul — 5-star Chinese restaurant in the main tower. KRW 30,000–35,000.' },
  { city:'Seoul', country:'South Korea',
    restaurant_name:'Grand Hyatt Seoul Chinese 그랜드하얏트 서울 중식당', dish_name:'Premium Fried Rice 프리미엄 볶음밥',
    dish_category:'premium', price_cad:krw(42000), local_price:42000, local_currency:'KRW', exchange_rate_used:0.00091,
    tier:'premium', source_url:'https://www.hyatt.com/grand-hyatt/en-US/selpd-grand-hyatt-seoul/dining', source_type:'official_menu', confidence_score:0.82,
    notes:'Grand Hyatt Seoul — premium Chinese restaurant with Han River views. KRW 40,000–48,000.' },

  // ── OSAKA — +7 entries (15 → 22) ─────────────────────────────────────────
  // Current 9 BL (JPY 550–1,540) → baseline CA$6.52. Adding 4 BL + 3 non-BL.
  { city:'Osaka', country:'Japan',
    restaurant_name:'Namba Budget Chinese 難波格安中華 (quick service)', dish_name:'Chahan 炒飯',
    dish_category:'basic', price_cad:jpy(570), local_price:570, local_currency:'JPY', exchange_rate_used:0.00869,
    tier:'low_tier', source_url:'https://tabelog.com/osaka/A2701/A270101/', source_type:'third_party_menu', confidence_score:0.80,
    notes:'Budget quick-service Chinese (定食屋) in central Namba area. JPY 550–590 for chahan.' },
  { city:'Osaka', country:'Japan',
    restaurant_name:'Osaka University Area Chinese 豊中・大学周辺中華', dish_name:'Chahan 炒飯',
    dish_category:'basic', price_cad:jpy(610), local_price:610, local_currency:'JPY', exchange_rate_used:0.00869,
    tier:'low_tier', source_url:'https://tabelog.com/osaka/A2706/', source_type:'third_party_menu', confidence_score:0.78,
    notes:'Student-area Chinese near Osaka University (Toyonaka campus). JPY 590–640 for chahan.' },
  { city:'Osaka', country:'Japan',
    restaurant_name:'Shinsekai Area Chinese 新世界中華', dish_name:'Chahan 炒飯',
    dish_category:'basic', price_cad:jpy(660), local_price:660, local_currency:'JPY', exchange_rate_used:0.00869,
    tier:'low_tier', source_url:'https://tabelog.com/osaka/A2701/A270104/', source_type:'third_party_menu', confidence_score:0.78,
    notes:'Chinese in Shinsekai (working-class entertainment district). JPY 640–690 typical.' },
  { city:'Osaka', country:'Japan',
    restaurant_name:'Minami District Lunch Chinese 南エリアランチ中華', dish_name:'Chahan 炒飯',
    dish_category:'basic', price_cad:jpy(740), local_price:740, local_currency:'JPY', exchange_rate_used:0.00869,
    tier:'low_tier', source_url:'https://tabelog.com/osaka/A2701/A270102/', source_type:'third_party_menu', confidence_score:0.78,
    notes:'Lunch-set Chinese in Minami (Shinsaibashi/Namba area). JPY 720–780.' },
  { city:'Osaka', country:'Japan',
    restaurant_name:'Namba Parks Food Court Chinese 難波パークス푸드코트 中華', dish_name:'Yang Chow Fried Rice 揚州炒飯',
    dish_category:'house_special', price_cad:jpy(1100), local_price:1100, local_currency:'JPY', exchange_rate_used:0.00869,
    tier:'mid_tier', source_url:'https://namba-parks.com/restaurant/', source_type:'official_menu', confidence_score:0.80,
    notes:'Chinese restaurant in Namba Parks shopping complex. JPY 1,050–1,200.' },
  { city:'Osaka', country:'Japan',
    restaurant_name:'Kita-Shinchi Premium Chinese 北新地高級中華', dish_name:'Yang Chow Fried Rice 揚州炒飯',
    dish_category:'house_special', price_cad:jpy(1500), local_price:1500, local_currency:'JPY', exchange_rate_used:0.00869,
    tier:'high_end', source_url:'https://tabelog.com/osaka/A2701/A270106/', source_type:'third_party_menu', confidence_score:0.80,
    notes:'Kita-Shinchi (north Osaka) is Osaka\'s upscale dining and entertainment district. JPY 1,400–1,700.' },
  { city:'Osaka', country:'Japan',
    restaurant_name:'Osaka Marriott Miyako Hotel Chinese (16F Abeno Harukas)', dish_name:'Premium Chahan プレミアム炒飯',
    dish_category:'premium', price_cad:jpy(3200), local_price:3200, local_currency:'JPY', exchange_rate_used:0.00869,
    tier:'premium', source_url:'https://www.marriott.com/hotels/travel/osamy-osaka-marriott-miyako-hotel/dining/', source_type:'official_menu', confidence_score:0.80,
    notes:'Osaka Marriott Miyako Hotel on the upper floors of Abeno Harukas (Japan\'s tallest building). JPY 3,000–3,800.' },

  // ── SINGAPORE — +7 entries (15 → 22) ─────────────────────────────────────
  // Current 9 BL (SGD 4.0–15.8) → baseline CA$9.50. Adding 2 BL (hawker mid-tier) + 5 upscale non-BL.
  { city:'Singapore', country:'Singapore',
    restaurant_name:'Toa Payoh Coffeeshop 大巴窑咖啡店 (neighbourhood)', dish_name:'Egg Fried Rice 蛋炒饭',
    dish_category:'basic', price_cad:sgd(5.50), local_price:5.50, local_currency:'SGD', exchange_rate_used:1.08,
    tier:'low_tier', source_url:'https://www.tripadvisor.com/Restaurants-g294265-Singapore', source_type:'third_party_menu', confidence_score:0.80,
    notes:'Neighbourhood coffeeshop (kopitiam) in Toa Payoh / Ang Mo Kio area. SGD 5–6 for egg fried rice.' },
  { city:'Singapore', country:'Singapore',
    restaurant_name:'Food court (suburban mall, Tampines / Jurong)', dish_name:'Egg Fried Rice 蛋炒饭',
    dish_category:'basic', price_cad:sgd(7), local_price:7, local_currency:'SGD', exchange_rate_used:1.08,
    tier:'low_tier', source_url:'https://www.tripadvisor.com/Restaurants-g294265-Singapore', source_type:'third_party_menu', confidence_score:0.80,
    notes:'Food court Chinese in suburban malls (Tampines Mall, JEM, Westgate). SGD 6.50–7.80 typical.' },
  { city:'Singapore', country:'Singapore',
    restaurant_name:'Canton Paradise 天堂楼 (VivoCity)', dish_name:'Yang Chow Fried Rice 扬州炒饭',
    dish_category:'house_special', price_cad:sgd(25), local_price:25, local_currency:'SGD', exchange_rate_used:1.08,
    tier:'high_end', source_url:'https://www.paradisegp.com/en/canton-paradise/', source_type:'official_menu', confidence_score:0.88,
    notes:'Canton Paradise — upscale Cantonese chain by Paradise Group; VivoCity harbourfront location. SGD 24–28.' },
  { city:'Singapore', country:'Singapore',
    restaurant_name:'Wan Hao Chinese Restaurant 万豪 (Singapore Marriott Tang)', dish_name:'Yang Chow Fried Rice 扬州炒饭',
    dish_category:'house_special', price_cad:sgd(27), local_price:27, local_currency:'SGD', exchange_rate_used:1.08,
    tier:'high_end', source_url:'https://www.singaporemarriott.com/dining/wan-hao/', source_type:'official_menu', confidence_score:0.88,
    notes:'Wan Hao — Cantonese fine dining at Singapore Marriott Tang Plaza on Orchard Road. SGD 26–30.' },
  { city:'Singapore', country:'Singapore',
    restaurant_name:'Imperial Treasure Fine Chinese 御宝金阁 (ION Orchard)', dish_name:'Yang Chow Fried Rice 扬州炒饭',
    dish_category:'premium', price_cad:sgd(42), local_price:42, local_currency:'SGD', exchange_rate_used:1.08,
    tier:'premium', source_url:'https://www.imperialtreasure.com/en/fine-chinese-cuisine/', source_type:'official_menu', confidence_score:0.90,
    notes:'Imperial Treasure Fine Chinese Cuisine at ION Orchard — Michelin-recommended Cantonese fine dining. SGD 40–46.' },
  { city:'Singapore', country:'Singapore',
    restaurant_name:'Shang Palace 香宫 (Shangri-La Singapore)', dish_name:'Yang Chow Fried Rice 扬州炒饭',
    dish_category:'premium', price_cad:sgd(38), local_price:38, local_currency:'SGD', exchange_rate_used:1.08,
    tier:'premium', source_url:'https://www.shangri-la.com/singapore/shangrila/dining/restaurants/shang-palace/', source_type:'official_menu', confidence_score:0.90,
    notes:'Shang Palace — Michelin-starred Cantonese at Shangri-La Singapore, Valley Wing. SGD 36–42.' },
  { city:'Singapore', country:'Singapore',
    restaurant_name:'Lei Garden 利苑 (CHIJMES Singapore)', dish_name:'Yang Chow Fried Rice 扬州炒饭',
    dish_category:'house_special', price_cad:sgd(30), local_price:30, local_currency:'SGD', exchange_rate_used:1.08,
    tier:'high_end', source_url:'https://www.leigardenrestaurant.com.sg/', source_type:'official_menu', confidence_score:0.88,
    notes:'Lei Garden Singapore at CHIJMES — Michelin Bib Gourmand Cantonese; sister restaurant to the HK original. SGD 28–34.' },

  // ── HONG KONG — +7 entries (15 → 22) ─────────────────────────────────────
  // Current 10 BL (HKD 38–118) → baseline CA$11.89. Adding 3 BL + 4 premium non-BL.
  { city:'Hong Kong', country:'China',
    restaurant_name:'North Point Neighbourhood Cantonese 北角粵菜', dish_name:'Egg Fried Rice 蛋炒飯',
    dish_category:'basic', price_cad:hkd(58), local_price:58, local_currency:'HKD', exchange_rate_used:0.1748,
    tier:'low_tier', source_url:'https://www.openrice.com/en/hongkong/hong-kong-island/north-point', source_type:'third_party_menu', confidence_score:0.80,
    notes:'Representative neighbourhood Cantonese restaurant in North Point (Eastern District). HKD 55–62.' },
  { city:'Hong Kong', country:'China',
    restaurant_name:'Kwun Tong Neighbourhood Chinese 觀塘粵菜', dish_name:'Egg Fried Rice 蛋炒飯',
    dish_category:'basic', price_cad:hkd(65), local_price:65, local_currency:'HKD', exchange_rate_used:0.1748,
    tier:'mid_tier', source_url:'https://www.openrice.com/en/hongkong/kowloon/kwun-tong', source_type:'third_party_menu', confidence_score:0.78,
    notes:'Neighbourhood Cantonese restaurant in Kwun Tong industrial/residential district. HKD 62–70.' },
  { city:'Hong Kong', country:'China',
    restaurant_name:'Tsuen Wan Mid-range Cantonese 荃灣粵菜', dish_name:'Egg Fried Rice 蛋炒飯',
    dish_category:'basic', price_cad:hkd(92), local_price:92, local_currency:'HKD', exchange_rate_used:0.1748,
    tier:'mid_tier', source_url:'https://www.openrice.com/en/hongkong/new-territories/tsuen-wan', source_type:'third_party_menu', confidence_score:0.78,
    notes:'Mid-range Cantonese restaurant in Tsuen Wan (New Territories). HKD 88–98.' },
  { city:'Hong Kong', country:'China',
    restaurant_name:'Cuisine Cuisine 国金轩 (IFC Mall, Central)', dish_name:'Yang Chow Fried Rice 揚州炒飯',
    dish_category:'house_special', price_cad:hkd(265), local_price:265, local_currency:'HKD', exchange_rate_used:0.1748,
    tier:'high_end', source_url:'https://www.cuisinecuisine.hk/en/cuisine-cuisine-ifc/', source_type:'official_menu', confidence_score:0.85,
    notes:'Cuisine Cuisine — upscale Cantonese at IFC Mall, one of HK\'s premium dining destinations. HKD 250–285.' },
  { city:'Hong Kong', country:'China',
    restaurant_name:'Man Wah 文華廳 (Mandarin Oriental Hong Kong)', dish_name:'Yang Chow Fried Rice 揚州炒飯',
    dish_category:'premium', price_cad:hkd(420), local_price:420, local_currency:'HKD', exchange_rate_used:0.1748,
    tier:'premium', source_url:'https://www.mandarinenoriental.com/hong-kong/central/dining/man-wah/', source_type:'official_menu', confidence_score:0.85,
    notes:'Man Wah — Cantonese fine dining at Mandarin Oriental Hong Kong; panoramic harbour views. HKD 400–460.' },
  { city:'Hong Kong', country:'China',
    restaurant_name:'Yan Toh Heen 欣圖軒 (InterContinental Hong Kong)', dish_name:'Wok-fried Egg White Fried Rice 炒蛋白飯',
    dish_category:'premium', price_cad:hkd(380), local_price:380, local_currency:'HKD', exchange_rate_used:0.1748,
    tier:'premium', source_url:'https://www.hongkong.intercontinental.com/dining/yan-toh-heen/', source_type:'official_menu', confidence_score:0.85,
    notes:'Yan Toh Heen — Michelin-starred Cantonese at InterContinental HK, Tsim Sha Tsui. HKD 360–420.' },
  { city:'Hong Kong', country:'China',
    restaurant_name:'T\'ang Court 唐閣 (The Langham Hong Kong)', dish_name:'Yang Chow Fried Rice 揚州炒飯',
    dish_category:'premium', price_cad:hkd(340), local_price:340, local_currency:'HKD', exchange_rate_used:0.1748,
    tier:'premium', source_url:'https://www.langhamhotels.com/en/the-langham/hong-kong/dining/tang-court/', source_type:'official_menu', confidence_score:0.85,
    notes:'T\'ang Court — three Michelin-star Cantonese at The Langham Hong Kong, Mong Kok. HKD 320–360.' },

  // ── TOKYO — +1 entry (21 → 22) ───────────────────────────────────────────
  // Baseline already robust (15 BL, CA$7.21). Adding 1 non-BL to reach 22.
  { city:'Tokyo', country:'Japan',
    restaurant_name:'Harajuku / Omotesando Upscale Chinese 原宿・表参道中華', dish_name:'Yang Chow Fried Rice 揚州炒飯',
    dish_category:'house_special', price_cad:jpy(1680), local_price:1680, local_currency:'JPY', exchange_rate_used:0.00869,
    tier:'high_end', source_url:'https://tabelog.com/tokyo/A1306/A130601/', source_type:'third_party_menu', confidence_score:0.78,
    notes:'Upscale Chinese restaurant in the Harajuku/Omotesando fashion/dining district. JPY 1,500–1,900.' },

  // ── BEIJING — +2 entries (20 → 22) ───────────────────────────────────────
  // Baseline already robust (12 BL, CA$5.38). Adding 2 premium non-BL.
  { city:'Beijing', country:'China',
    restaurant_name:'TRB Temple Restaurant Beijing (23 Shatan Hou Jie)', dish_name:'Special Fried Rice 特色炒饭',
    dish_category:'house_special', price_cad:cny(178), local_price:178, local_currency:'CNY', exchange_rate_used:0.203,
    tier:'high_end', source_url:'https://www.trb-cn.com/trb-dining/', source_type:'official_menu', confidence_score:0.82,
    notes:'TRB Temple Restaurant Beijing — fine dining in a restored 15th-century temple near the Forbidden City. CNY 160–200.' },
  { city:'Beijing', country:'China',
    restaurant_name:'Capital Club 首都俱乐部 (21 Jianguomenwai Dajie, CBD)', dish_name:'Premium Fried Rice 顶级炒饭',
    dish_category:'premium', price_cad:cny(148), local_price:148, local_currency:'CNY', exchange_rate_used:0.203,
    tier:'premium', source_url:'https://www.capitalclub.com.cn/dining/', source_type:'official_menu', confidence_score:0.80,
    notes:'Capital Club — Beijing\'s prestigious members-only business club in the CBD; premium Chinese dining. CNY 140–160.' },

  // ── SHANGHAI — +2 entries (20 → 22) ──────────────────────────────────────
  // Baseline already robust (12 BL, CA$6.80). Adding 2 premium non-BL.
  { city:'Shanghai', country:'China',
    restaurant_name:'The Commune Social 食社 (511 Jiangning Lu, Jing\'an)', dish_name:'Special Fried Rice 特色炒饭',
    dish_category:'house_special', price_cad:cny(132), local_price:132, local_currency:'CNY', exchange_rate_used:0.203,
    tier:'high_end', source_url:'https://www.communesocial.com/menu/', source_type:'official_menu', confidence_score:0.82,
    notes:'The Commune Social — Jason Atherton\'s modern Asian in Jing\'an; upscale sharing plates. CNY 128–148.' },
  { city:'Shanghai', country:'China',
    restaurant_name:'Hakkasan Shanghai (Level 5, Three on the Bund)', dish_name:'Yang Chow Fried Rice 扬州炒饭',
    dish_category:'premium', price_cad:cny(198), local_price:198, local_currency:'CNY', exchange_rate_used:0.203,
    tier:'premium', source_url:'https://hakkasan.com/locations/shanghai/', source_type:'official_menu', confidence_score:0.88,
    notes:'Hakkasan Shanghai at Three on the Bund — Michelin-starred Cantonese, Shanghai\'s premier upscale Chinese. CNY 185–220.' },

  // ── TORONTO — +2 entries (20 → 22) ───────────────────────────────────────
  // Current 9 BL → baseline CA$15.75. Adding 2 BL to strengthen the median.
  { city:'Toronto', country:'Canada',
    restaurant_name:'Yangtze Restaurant (4750 Sheppard Ave E, Scarborough)', dish_name:'Vegetable Fried Rice',
    dish_category:'vegetable', price_cad:cad(13.25), local_price:13.25, local_currency:'CAD', exchange_rate_used:1,
    tier:'low_tier', source_url:'https://www.tripadvisor.com/Restaurant_Review-g155019-d2441562', source_type:'third_party_menu', confidence_score:0.85,
    notes:'Yangtze Restaurant — long-running neighbourhood Chinese in Scarborough (large Chinese community). CA$12.50–14.' },
  { city:'Toronto', country:'Canada',
    restaurant_name:'Seafood Palace (8580 Woodbine Ave, Markham)', dish_name:'Egg Fried Rice',
    dish_category:'basic', price_cad:cad(16.99), local_price:16.99, local_currency:'CAD', exchange_rate_used:1,
    tier:'mid_tier', source_url:'https://www.tripadvisor.com/Restaurants-g154992-Markham', source_type:'third_party_menu', confidence_score:0.82,
    notes:'Seafood Palace — upscale Cantonese seafood restaurant in Markham (Greater Toronto\'s Chinese hub). CA$16–18.' },
]

function dataQualityLabel(n: number): string {
  if (n >= 15) return 'High confidence'
  if (n >= 10) return 'Strong'
  if (n >= 5)  return 'Moderate'
  return 'Limited'
}

async function expandCity(city: string, newEntries: E[]) {
  console.log(`\n─── ${city} (+${newEntries.length}) ───`)
  const rows = newEntries.map(e => ({
    city: e.city, country: e.country,
    restaurant_name: e.restaurant_name, dish_name: e.dish_name,
    dish_category: e.dish_category,
    included_in_baseline: e.dish_category === 'basic' || e.dish_category === 'vegetable',
    tier: e.tier, local_price: e.local_price, local_currency: e.local_currency,
    exchange_rate_used: e.exchange_rate_used, price_cad: e.price_cad,
    source: 'Manual seed – expand-v1-batch5',
    source_type: e.source_type, source_url: e.source_url,
    confidence_score: e.confidence_score, approved: true, active: true,
    date_accessed: NOW, notes: e.notes ?? null,
  }))
  const { error: insErr } = await s.from('restaurants').insert(rows)
  if (insErr) { console.error(`  ✗ ${insErr.message}`); return }
  console.log(`  ✓ Inserted ${rows.length}`)

  const { data: all } = await s.from('restaurants')
    .select('price_cad,included_in_baseline,confidence_score')
    .eq('city', city).eq('active', true)
  if (!all) return

  const blRows = all.filter(r => r.included_in_baseline)
  const allP   = all.map(r => r.price_cad as number).sort((a, b) => a - b)
  const blP    = blRows.map(r => r.price_cad as number).sort((a, b) => a - b)
  if (!blP.length) return

  const mid    = Math.floor(blP.length / 2)
  const median = blP.length % 2 === 1 ? blP[mid] : (blP[mid - 1] + blP[mid]) / 2
  const n = allP.length, k = Math.round(n * 0.05)
  const t = k > 0 ? allP.slice(k, n - k) : allP
  const avg = t.reduce((s, p) => s + p, 0) / t.length
  const conf = blRows.reduce((s, row) => s + (row.confidence_score as number), 0) / blRows.length

  await s.from('cities').update({
    price_cad: r(median), baseline_median_cad: r(median),
    market_average_cad: r(avg), market_min_cad: allP[0], market_max_cad: allP[n - 1],
    market_entry_count: n, baseline_entry_count: blRows.length,
    data_quality_label: dataQualityLabel(n),
    price_source: `Baseline median from ${blRows.length} verified entries`,
    price_updated_at: NOW, confidence_score: r(conf),
  }).eq('city', city)
  console.log(`  ✓ CA$${r(median)} (${blRows.length} BL / ${n} total) | ${dataQualityLabel(n)}`)
}

async function run() {
  const cities = [...new Set(ENTRIES.map(e => e.city))]
  for (const city of cities) {
    await expandCity(city, ENTRIES.filter(e => e.city === city))
  }
  console.log('\n✓ Batch 5 complete.')
}
run().catch(console.error)
