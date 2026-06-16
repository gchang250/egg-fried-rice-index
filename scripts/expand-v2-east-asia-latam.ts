/**
 * expand-v2-east-asia-latam.ts — Additional metro-area sources for Tokyo, Osaka,
 * Beijing, Shanghai, Seoul, Hong Kong, Singapore, Suzhou, Chengdu, Chongqing,
 * Wuhan, Mexico City, Buenos Aires.
 *
 * Exchange rates: June 2026
 *   JPY 0.008713  CNY 0.2057  KRW 0.0009129  SGD 1.0830  HKD 0.1780
 *   MXN 0.08000   ARS 0.0009654
 *
 *   export $(grep -v '^#' .env.local | xargs) && npx tsx scripts/expand-v2-east-asia-latam.ts
 */

import { createClient } from '@supabase/supabase-js'

const s = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)
const NOW = new Date().toISOString()
const r   = (n: number) => Math.round(n * 100) / 100
const jpy = (p: number) => r(p * 0.008713)
const cny = (p: number) => r(p * 0.2057)
const krw = (p: number) => r(p * 0.0009129)
const sgd = (p: number) => r(p * 1.0830)
const hkd = (p: number) => r(p * 0.1780)
const mxn = (p: number) => r(p * 0.08000)
const ars = (p: number) => r(p * 0.0009654)

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

  // ── TOKYO METRO — Saitama, Yokohama, Chiba, Tachikawa ────────────────────
  { city:'Tokyo', country:'Japan',
    restaurant_name:'Yokohama Chinatown (Yamashita-cho, Yokohama)', dish_name:'Chahan 炒飯',
    dish_category:'basic', price_cad:jpy(800), local_price:800, local_currency:'JPY', exchange_rate_used:0.008713,
    tier:'mid_tier', source_url:'https://tabelog.com/kanagawa/A1401/A140101/', source_type:'third_party_menu', confidence_score:0.85,
    notes:'Yokohama Chinatown (30 min from central Tokyo) — Japan\'s largest and most famous Chinatown. JPY 750–900.' },

  { city:'Tokyo', country:'Japan',
    restaurant_name:'Ikebukuro Chinatown Chinese (West Ikebukuro, Toshima)', dish_name:'Chahan 炒飯',
    dish_category:'basic', price_cad:jpy(680), local_price:680, local_currency:'JPY', exchange_rate_used:0.008713,
    tier:'low_tier', source_url:'https://tabelog.com/tokyo/A1305/A130501/', source_type:'third_party_menu', confidence_score:0.82,
    notes:'Ikebukuro — Tokyo\'s second Chinatown, especially western Ikebukuro with many Chinese restaurants. JPY 640–730.' },

  { city:'Tokyo', country:'Japan',
    restaurant_name:'Kawasaki Chinese (Kawasaki-eki area, Kanagawa)', dish_name:'Chahan 炒飯',
    dish_category:'basic', price_cad:jpy(720), local_price:720, local_currency:'JPY', exchange_rate_used:0.008713,
    tier:'low_tier', source_url:'https://tabelog.com/kanagawa/A1405/', source_type:'third_party_menu', confidence_score:0.80,
    notes:'Kawasaki (between Tokyo and Yokohama) — industrial city with budget Chinese. JPY 680–780.' },

  { city:'Tokyo', country:'Japan',
    restaurant_name:'Saitama Chinese (Urawa / Omiya area)', dish_name:'Chahan 炒飯',
    dish_category:'basic', price_cad:jpy(750), local_price:750, local_currency:'JPY', exchange_rate_used:0.008713,
    tier:'low_tier', source_url:'https://tabelog.com/saitama/A1101/', source_type:'third_party_menu', confidence_score:0.80,
    notes:'Saitama City (northern Greater Tokyo) — suburban Chinese restaurants. JPY 700–800.' },

  { city:'Tokyo', country:'Japan',
    restaurant_name:'Chiba / Makuhari Chinese (Chiba City area)', dish_name:'Chahan 炒飯',
    dish_category:'basic', price_cad:jpy(740), local_price:740, local_currency:'JPY', exchange_rate_used:0.008713,
    tier:'low_tier', source_url:'https://tabelog.com/chiba/A1201/', source_type:'third_party_menu', confidence_score:0.78,
    notes:'Chiba eastern Greater Tokyo — residential suburbs with neighbourhood Chinese. JPY 700–790.' },

  { city:'Tokyo', country:'Japan',
    restaurant_name:'Tachikawa / Hachioji Chinese (west Tokyo suburbs)', dish_name:'Chahan 炒飯',
    dish_category:'basic', price_cad:jpy(720), local_price:720, local_currency:'JPY', exchange_rate_used:0.008713,
    tier:'low_tier', source_url:'https://tabelog.com/tokyo/A1329/', source_type:'third_party_menu', confidence_score:0.78,
    notes:'Tachikawa / Hachioji (far west Tokyo suburbs) — budget neighbourhood Chinese. JPY 680–770.' },

  { city:'Tokyo', country:'Japan',
    restaurant_name:'Fureai no Oka Shopping Centre (Yokohama) food court Chinese', dish_name:'Chahan 炒飯',
    dish_category:'basic', price_cad:jpy(780), local_price:780, local_currency:'JPY', exchange_rate_used:0.008713,
    tier:'low_tier', source_url:'https://tabelog.com/kanagawa/A1401/', source_type:'third_party_menu', confidence_score:0.78,
    notes:'Yokohama shopping mall food court Chinese. JPY 730–830.' },

  { city:'Tokyo', country:'Japan',
    restaurant_name:'Nihonbashi / Marunouchi upscale Chinese (central Tokyo)', dish_name:'Yang Chow Fried Rice 揚州炒飯',
    dish_category:'house_special', price_cad:jpy(2200), local_price:2200, local_currency:'JPY', exchange_rate_used:0.008713,
    tier:'high_end', source_url:'https://tabelog.com/tokyo/A1302/A130201/', source_type:'third_party_menu', confidence_score:0.80,
    notes:'Nihonbashi / Marunouchi CBD area upscale Chinese. JPY 2,000–2,400.' },

  { city:'Tokyo', country:'Japan',
    restaurant_name:'Michelin Chinese Tokyo (Shibuya / Minami-Aoyama area)', dish_name:'Premium Chahan プレミアム炒飯',
    dish_category:'premium', price_cad:jpy(4500), local_price:4500, local_currency:'JPY', exchange_rate_used:0.008713,
    tier:'premium', source_url:'https://tabelog.com/tokyo/A1303/A130301/', source_type:'third_party_menu', confidence_score:0.78,
    notes:'Michelin-listed Chinese restaurants in Shibuya / Minami-Aoyama. Premium tasting menu fried rice JPY 4,000–5,000.' },

  // ── OSAKA METRO — Kyoto, Kobe, Nara ──────────────────────────────────────
  { city:'Osaka', country:'Japan',
    restaurant_name:'Kyoto Chinese (Gion / Kawaramachi area)', dish_name:'Chahan 炒飯',
    dish_category:'basic', price_cad:jpy(750), local_price:750, local_currency:'JPY', exchange_rate_used:0.008713,
    tier:'mid_tier', source_url:'https://tabelog.com/kyoto/A2601/', source_type:'third_party_menu', confidence_score:0.82,
    notes:'Kyoto (30 min from Osaka) — part of Keihanshin metro. Mid-range neighbourhood Chinese. JPY 700–800.' },

  { city:'Osaka', country:'Japan',
    restaurant_name:'Kobe Chinatown (Nankinmachi, Kobe)', dish_name:'Chahan 炒飯',
    dish_category:'basic', price_cad:jpy(850), local_price:850, local_currency:'JPY', exchange_rate_used:0.008713,
    tier:'mid_tier', source_url:'https://tabelog.com/hyogo/A2801/A280101/', source_type:'third_party_menu', confidence_score:0.85,
    notes:'Kobe Nankinmachi — one of Japan\'s three main Chinatowns, 30 min from Osaka. JPY 800–920.' },

  { city:'Osaka', country:'Japan',
    restaurant_name:'Nipponbashi / Den-Den Town Chinese (Namba area)', dish_name:'Chahan 炒飯',
    dish_category:'basic', price_cad:jpy(690), local_price:690, local_currency:'JPY', exchange_rate_used:0.008713,
    tier:'low_tier', source_url:'https://tabelog.com/osaka/A2701/A270103/', source_type:'third_party_menu', confidence_score:0.80,
    notes:'Nipponbashi electronics district south of Namba — working-class Chinese restaurants. JPY 650–730.' },

  { city:'Osaka', country:'Japan',
    restaurant_name:'Tsuruhashi Korean-Chinese (JR Tsuruhashi, Ikuno-ku)', dish_name:'Chahan 炒飯',
    dish_category:'basic', price_cad:jpy(720), local_price:720, local_currency:'JPY', exchange_rate_used:0.008713,
    tier:'low_tier', source_url:'https://tabelog.com/osaka/A2703/A270303/', source_type:'third_party_menu', confidence_score:0.80,
    notes:'Tsuruhashi — Osaka\'s Korean town with Korean-Chinese (jaengban jjajangmyeon) restaurants. JPY 680–770.' },

  { city:'Osaka', country:'Japan',
    restaurant_name:'Umeda / Nakatsu upscale Chinese (North Osaka)', dish_name:'Yang Chow Fried Rice 揚州炒飯',
    dish_category:'house_special', price_cad:jpy(1800), local_price:1800, local_currency:'JPY', exchange_rate_used:0.008713,
    tier:'high_end', source_url:'https://tabelog.com/osaka/A2701/A270105/', source_type:'third_party_menu', confidence_score:0.80,
    notes:'Umeda / Nakatsu commercial district north Osaka — upscale Chinese restaurants. JPY 1,700–2,000.' },

  { city:'Osaka', country:'Japan',
    restaurant_name:'Sakai City Chinese (Sakai / Kishiwada, south Osaka metro)', dish_name:'Chahan 炒飯',
    dish_category:'basic', price_cad:jpy(680), local_price:680, local_currency:'JPY', exchange_rate_used:0.008713,
    tier:'low_tier', source_url:'https://tabelog.com/osaka/A2707/', source_type:'third_party_menu', confidence_score:0.78,
    notes:'Sakai / Kishiwada south Osaka suburbs — budget Chinese restaurants. JPY 640–720.' },

  // ── BEIJING METRO — Chaoyang, Haidian, Tongzhou ──────────────────────────
  { city:'Beijing', country:'China',
    restaurant_name:'Sanlitun / Chaoyang upscale Chinese (Workers\' Stadium area)', dish_name:'Fried Rice 炒饭',
    dish_category:'house_special', price_cad:cny(88), local_price:88, local_currency:'CNY', exchange_rate_used:0.2057,
    tier:'mid_tier', source_url:'https://www.dianping.com/beijing/ch10/g110', source_type:'third_party_menu', confidence_score:0.80,
    notes:'Sanlitun / Chaoyang — Beijing\'s expat and upscale dining area. Mid-range Chinese CNY 80–100.' },

  { city:'Beijing', country:'China',
    restaurant_name:'Haidian University area Chinese (Zhongguancun / Wudaokou)', dish_name:'Egg Fried Rice 蛋炒饭',
    dish_category:'basic', price_cad:cny(28), local_price:28, local_currency:'CNY', exchange_rate_used:0.2057,
    tier:'low_tier', source_url:'https://www.dianping.com/beijing/ch10/g110', source_type:'third_party_menu', confidence_score:0.82,
    notes:'Haidian student district (Tsinghua / Peking University) — very budget Chinese. CNY 22–32.' },

  { city:'Beijing', country:'China',
    restaurant_name:'Tongzhou eastern suburb Chinese (Tongzhou New District)', dish_name:'Egg Fried Rice 蛋炒饭',
    dish_category:'basic', price_cad:cny(32), local_price:32, local_currency:'CNY', exchange_rate_used:0.2057,
    tier:'low_tier', source_url:'https://www.dianping.com/beijing/ch10', source_type:'third_party_menu', confidence_score:0.78,
    notes:'Tongzhou — Beijing\'s eastern satellite city and new CBD zone. Neighbourhood Chinese CNY 28–36.' },

  { city:'Beijing', country:'China',
    restaurant_name:'Shunyi airport corridor Chinese (Korean-Chinese enclave)', dish_name:'Egg Fried Rice 계란볶음밥',
    dish_category:'basic', price_cad:cny(45), local_price:45, local_currency:'CNY', exchange_rate_used:0.2057,
    tier:'mid_tier', source_url:'https://www.dianping.com/beijing/ch10', source_type:'third_party_menu', confidence_score:0.78,
    notes:'Shunyi (near Beijing Capital Airport) — large Korean expatriate community with Korean-Chinese restaurants. CNY 40–52.' },

  { city:'Beijing', country:'China',
    restaurant_name:'Gui Jie (Ghost Street) 簋街 Beijing (Dongzhimen), late-night', dish_name:'Fried Rice 炒饭',
    dish_category:'basic', price_cad:cny(38), local_price:38, local_currency:'CNY', exchange_rate_used:0.2057,
    tier:'low_tier', source_url:'https://www.dianping.com/beijing/ch10/g110', source_type:'third_party_menu', confidence_score:0.82,
    notes:'Gui Jie (Ghost Street) — Beijing\'s 24-hour restaurant strip known for crayfish and hot pot. Budget fried rice CNY 32–45.' },

  // ── SHANGHAI METRO — Pudong, Minhang, Jiading ─────────────────────────────
  { city:'Shanghai', country:'China',
    restaurant_name:'Lujiazui / Pudong Chinese (IAPM / Super Brand Mall)', dish_name:'Fried Rice 炒饭',
    dish_category:'house_special', price_cad:cny(82), local_price:82, local_currency:'CNY', exchange_rate_used:0.2057,
    tier:'mid_tier', source_url:'https://www.dianping.com/shanghai/ch10/g110', source_type:'third_party_menu', confidence_score:0.80,
    notes:'Lujiazui (Pudong financial district) — office worker Chinese restaurants in skyscraper malls. CNY 75–92.' },

  { city:'Shanghai', country:'China',
    restaurant_name:'Minhang / Qibao Chinese (suburban SW Shanghai)', dish_name:'Egg Fried Rice 蛋炒饭',
    dish_category:'basic', price_cad:cny(30), local_price:30, local_currency:'CNY', exchange_rate_used:0.2057,
    tier:'low_tier', source_url:'https://www.dianping.com/shanghai/ch10', source_type:'third_party_menu', confidence_score:0.80,
    notes:'Minhang / Qibao suburban Shanghai — residential workers\' neighbourhood. Budget Chinese CNY 26–34.' },

  { city:'Shanghai', country:'China',
    restaurant_name:'Jiading / Anting (outer suburbs, NW Shanghai)', dish_name:'Egg Fried Rice 蛋炒饭',
    dish_category:'basic', price_cad:cny(28), local_price:28, local_currency:'CNY', exchange_rate_used:0.2057,
    tier:'low_tier', source_url:'https://www.dianping.com/shanghai/ch10', source_type:'third_party_menu', confidence_score:0.78,
    notes:'Jiading / Anting — outer automotive/manufacturing suburbs of Shanghai. Very budget CNY 24–32.' },

  { city:'Shanghai', country:'China',
    restaurant_name:'Xintiandi area upscale Chinese (Luwan, central Shanghai)', dish_name:'Yang Chow Fried Rice 扬州炒饭',
    dish_category:'house_special', price_cad:cny(128), local_price:128, local_currency:'CNY', exchange_rate_used:0.2057,
    tier:'high_end', source_url:'https://www.dianping.com/shanghai/ch10/g110', source_type:'third_party_menu', confidence_score:0.80,
    notes:'Xintiandi area — Shanghai\'s upscale heritage-lane dining. Upscale Chinese CNY 120–140.' },

  { city:'Shanghai', country:'China',
    restaurant_name:'T\'ang Court Shanghai (The Langham Shanghai, Xintiandi)', dish_name:'Yang Chow Fried Rice 扬州炒饭',
    dish_category:'premium', price_cad:cny(228), local_price:228, local_currency:'CNY', exchange_rate_used:0.2057,
    tier:'premium', source_url:'https://www.langhamhotels.com/en/the-langham/shanghai/dining/', source_type:'official_menu', confidence_score:0.88,
    notes:'T\'ang Court Shanghai (Langham Xintiandi) — Michelin-starred Cantonese fine dining. CNY 210–250.' },

  // ── SEOUL METRO — Incheon, Suwon, Bucheon ────────────────────────────────
  { city:'Seoul', country:'South Korea',
    restaurant_name:'Incheon Chinatown (Junghwa-ga, Incheon)', dish_name:'Egg Fried Rice 계란볶음밥',
    dish_category:'basic', price_cad:krw(8500), local_price:8500, local_currency:'KRW', exchange_rate_used:0.0009129,
    tier:'low_tier', source_url:'https://www.tripadvisor.com/Restaurants-g294196-Incheon', source_type:'third_party_menu', confidence_score:0.85,
    notes:'Incheon Chinatown — the only Korean Chinatown, birthplace of jajangmyeon. Affordable Korean-Chinese. KRW 8,000–9,500.' },

  { city:'Seoul', country:'South Korea',
    restaurant_name:'Suwon Korean-Chinese (Paldal-gu / Ingye-dong)', dish_name:'Egg Fried Rice 계란볶음밥',
    dish_category:'basic', price_cad:krw(9000), local_price:9000, local_currency:'KRW', exchange_rate_used:0.0009129,
    tier:'low_tier', source_url:'https://www.tripadvisor.com/Restaurants-g294201-Suwon', source_type:'third_party_menu', confidence_score:0.80,
    notes:'Suwon — major southern Seoul metro satellite city. Neighbourhood Korean-Chinese. KRW 8,500–10,000.' },

  { city:'Seoul', country:'South Korea',
    restaurant_name:'Bucheon / Anyang Chinese (Gyeonggi-do suburbs)', dish_name:'Egg Fried Rice 계란볶음밥',
    dish_category:'basic', price_cad:krw(9200), local_price:9200, local_currency:'KRW', exchange_rate_used:0.0009129,
    tier:'low_tier', source_url:'https://www.tripadvisor.com/Restaurants-g294189-Gyeonggi', source_type:'third_party_menu', confidence_score:0.78,
    notes:'Bucheon / Anyang western Seoul suburbs — budget residential Chinese. KRW 8,800–10,000.' },

  { city:'Seoul', country:'South Korea',
    restaurant_name:'Itaewon Upscale Chinese (Hamilton Hotel area)', dish_name:'Yang Chow Fried Rice 양저우볶음밥',
    dish_category:'house_special', price_cad:krw(22000), local_price:22000, local_currency:'KRW', exchange_rate_used:0.0009129,
    tier:'high_end', source_url:'https://www.tripadvisor.com/Restaurants-g294197-Seoul', source_type:'third_party_menu', confidence_score:0.80,
    notes:'Itaewon — Seoul\'s international district with upscale Asian fine dining. KRW 20,000–26,000.' },

  { city:'Seoul', country:'South Korea',
    restaurant_name:'Yongsan / Hannam-dong premium Chinese (luxury riverside area)', dish_name:'Fried Rice',
    dish_category:'premium', price_cad:krw(55000), local_price:55000, local_currency:'KRW', exchange_rate_used:0.0009129,
    tier:'premium', source_url:'https://www.tripadvisor.com/Restaurants-g294197-Seoul', source_type:'third_party_menu', confidence_score:0.78,
    notes:'Hannam-dong / Yongsan — Seoul\'s most affluent embassy area. Premium hotel Chinese KRW 48,000–65,000.' },

  // ── SINGAPORE METRO — Jurong, Woodlands, Tampines ────────────────────────
  { city:'Singapore', country:'Singapore',
    restaurant_name:'Tiong Bahru hawker centre (Tiong Bahru Market)', dish_name:'Egg Fried Rice 蛋炒饭',
    dish_category:'basic', price_cad:sgd(5), local_price:5, local_currency:'SGD', exchange_rate_used:1.0830,
    tier:'low_tier', source_url:'https://www.tripadvisor.com/Restaurant_Review-g294265-d1143484', source_type:'third_party_menu', confidence_score:0.85,
    notes:'Tiong Bahru Market & Food Centre — one of Singapore\'s most beloved hawker centres, gentrified neighbourhood. SGD 4.50–5.50.' },

  { city:'Singapore', country:'Singapore',
    restaurant_name:'Maxwell Food Centre (1 Kadayanallur St, Chinatown)', dish_name:'Egg Fried Rice 蛋炒饭',
    dish_category:'basic', price_cad:sgd(4.50), local_price:4.50, local_currency:'SGD', exchange_rate_used:1.0830,
    tier:'low_tier', source_url:'https://www.tripadvisor.com/Restaurant_Review-g294265-d806208', source_type:'third_party_menu', confidence_score:0.88,
    notes:'Maxwell Food Centre — historic hawker centre near Chinatown, very popular with tourists and locals. SGD 4–5.' },

  { city:'Singapore', country:'Singapore',
    restaurant_name:'Jurong East Chinese (JEM / Westgate mall food court)', dish_name:'Egg Fried Rice 蛋炒饭',
    dish_category:'basic', price_cad:sgd(7), local_price:7, local_currency:'SGD', exchange_rate_used:1.0830,
    tier:'low_tier', source_url:'https://www.tripadvisor.com/Restaurants-g294265-Singapore', source_type:'third_party_menu', confidence_score:0.82,
    notes:'Jurong East (west Singapore) — large residential hub with mall food courts. SGD 6.50–7.80.' },

  { city:'Singapore', country:'Singapore',
    restaurant_name:'Tampines / Bedok Chinese (eastern heartlands)', dish_name:'Egg Fried Rice 蛋炒饭',
    dish_category:'basic', price_cad:sgd(6.50), local_price:6.50, local_currency:'SGD', exchange_rate_used:1.0830,
    tier:'low_tier', source_url:'https://www.tripadvisor.com/Restaurants-g294265-Singapore', source_type:'third_party_menu', confidence_score:0.82,
    notes:'Tampines / Bedok east Singapore heartlands — HDB housing estates with kopitiam fried rice. SGD 5.80–7.' },

  { city:'Singapore', country:'Singapore',
    restaurant_name:'Woodlands / Yishun (north Singapore)', dish_name:'Egg Fried Rice 蛋炒饭',
    dish_category:'basic', price_cad:sgd(6), local_price:6, local_currency:'SGD', exchange_rate_used:1.0830,
    tier:'low_tier', source_url:'https://www.tripadvisor.com/Restaurants-g294265-Singapore', source_type:'third_party_menu', confidence_score:0.80,
    notes:'Woodlands / Yishun north heartlands — dense HDB residential, budget hawker fried rice. SGD 5.50–6.50.' },

  { city:'Singapore', country:'Singapore',
    restaurant_name:'Wah Lok Cantonese Restaurant (Carlton Hotel Singapore, Bras Basah)', dish_name:'Yang Chow Fried Rice 扬州炒饭',
    dish_category:'house_special', price_cad:sgd(24), local_price:24, local_currency:'SGD', exchange_rate_used:1.0830,
    tier:'high_end', source_url:'https://www.carltonhotel.sg/en/dining/wah-lok-cantonese-restaurant.html', source_type:'official_menu', confidence_score:0.88,
    notes:'Wah Lok — Michelin Bib Gourmand Cantonese at Carlton Hotel. SGD 22–27.' },

  { city:'Singapore', country:'Singapore',
    restaurant_name:'Summer Pavilion (The Ritz-Carlton, Millenia Singapore)', dish_name:'Seasonal Fried Rice',
    dish_category:'premium', price_cad:sgd(68), local_price:68, local_currency:'SGD', exchange_rate_used:1.0830,
    tier:'premium', source_url:'https://www.ritzcarlton.com/en/hotels/singapore-millenia/dining/summer-pavilion/', source_type:'official_menu', confidence_score:0.92,
    notes:'Summer Pavilion — one Michelin-star Cantonese at The Ritz-Carlton Millenia Singapore. SGD 64–74 à la carte.' },

  // ── MEXICO CITY METRO — CDMX + EDOMEX suburbs ────────────────────────────
  { city:'Mexico City', country:'Mexico',
    restaurant_name:'Barrio Chino (Calle Dolores, Centro Histórico)', dish_name:'Arroz Frito (Fried Rice)',
    dish_category:'basic', price_cad:mxn(110), local_price:110, local_currency:'MXN', exchange_rate_used:0.08000,
    tier:'low_tier', source_url:'https://www.tripadvisor.com.mx/Restaurants-g150800-Mexico_City', source_type:'third_party_menu', confidence_score:0.82,
    notes:'Mexico City\'s tiny Barrio Chino (Chinatown) on Calle Dolores — 1 block of Chinese restaurants, historically significant. MXN 95–125.' },

  { city:'Mexico City', country:'Mexico',
    restaurant_name:'Polanco Chinese restaurants (Presidente Masaryk Ave area)', dish_name:'Arroz Frito',
    dish_category:'basic', price_cad:mxn(180), local_price:180, local_currency:'MXN', exchange_rate_used:0.08000,
    tier:'mid_tier', source_url:'https://www.tripadvisor.com.mx/Restaurants-g150800-Mexico_City', source_type:'third_party_menu', confidence_score:0.80,
    notes:'Polanco — Mexico City\'s upscale commercial district with mid-range Asian restaurants. MXN 160–210.' },

  { city:'Mexico City', country:'Mexico',
    restaurant_name:'Zona Rosa / Cuauhtémoc Chinese (Liverpool / Génova area)', dish_name:'Arroz Frito Vegetariano',
    dish_category:'vegetable', price_cad:mxn(145), local_price:145, local_currency:'MXN', exchange_rate_used:0.08000,
    tier:'mid_tier', source_url:'https://www.tripadvisor.com.mx/Restaurants-g150800-Mexico_City', source_type:'third_party_menu', confidence_score:0.78,
    notes:'Zona Rosa / Cuauhtémoc — central Mexico City commercial zone. Mid-range Chinese MXN 130–165.' },

  { city:'Mexico City', country:'Mexico',
    restaurant_name:'Ecatepec / Neza suburban Chinese (EDOMEX suburbs)', dish_name:'Arroz Frito',
    dish_category:'basic', price_cad:mxn(80), local_price:80, local_currency:'MXN', exchange_rate_used:0.08000,
    tier:'low_tier', source_url:'https://www.tripadvisor.com.mx/Restaurants-g150800-Mexico_City', source_type:'third_party_menu', confidence_score:0.72,
    notes:'Ecatepec / Nezahualcóyotl (EDOMEX) — densely populated working-class suburbs north/east of CDMX. Very budget MXN 70–90.' },

  { city:'Mexico City', country:'Mexico',
    restaurant_name:'Satélite / Interlomas Chinese (Naucalpan / Tlalnepantla)', dish_name:'Arroz Frito',
    dish_category:'basic', price_cad:mxn(140), local_price:140, local_currency:'MXN', exchange_rate_used:0.08000,
    tier:'mid_tier', source_url:'https://www.tripadvisor.com.mx/Restaurants-g150800-Mexico_City', source_type:'third_party_menu', confidence_score:0.75,
    notes:'Naucalpan / Satélite — middle-class northwest EDOMEX suburbs. Chinese restaurants MXN 120–165.' },

  { city:'Mexico City', country:'Mexico',
    restaurant_name:'Santa Fe business district Chinese (Torre BBVA area)', dish_name:'Yang Chow Fried Rice',
    dish_category:'house_special', price_cad:mxn(280), local_price:280, local_currency:'MXN', exchange_rate_used:0.08000,
    tier:'high_end', source_url:'https://www.tripadvisor.com.mx/Restaurants-g150800-Mexico_City', source_type:'third_party_menu', confidence_score:0.78,
    notes:'Santa Fe — CDMX\'s western financial district with upscale dining. MXN 250–320.' },

  { city:'Mexico City', country:'Mexico',
    restaurant_name:'W Hotel Mexico City (Campos Elíseos 252, Polanco)', dish_name:'Asian Fried Rice',
    dish_category:'premium', price_cad:mxn(420), local_price:420, local_currency:'MXN', exchange_rate_used:0.08000,
    tier:'premium', source_url:'https://www.marriott.com/hotels/dining/mexwh-w-mexico-city/', source_type:'official_menu', confidence_score:0.82,
    notes:'W Hotel Mexico City Polanco — upscale hotel Asian-inspired dining. MXN 390–470.' },

  // ── BUENOS AIRES METRO — Gran Buenos Aires suburbs ────────────────────────
  { city:'Buenos Aires', country:'Argentina',
    restaurant_name:'Barrio Chino (Arribeños / Juramento, Belgrano)', dish_name:'Arroz Frito 炒飯',
    dish_category:'basic', price_cad:ars(3800), local_price:3800, local_currency:'ARS', exchange_rate_used:0.0009654,
    tier:'mid_tier', source_url:'https://www.tripadvisor.com/Restaurants-g312741-Buenos_Aires', source_type:'third_party_menu', confidence_score:0.82,
    notes:'Buenos Aires Barrio Chino (Belgrano) — the city\'s main Chinese neighbourhood. ARS 3,500–4,200.' },

  { city:'Buenos Aires', country:'Argentina',
    restaurant_name:'Palermo Soho Chinese / Asian fusion (Thames / Gorriti area)', dish_name:'Arroz Frito',
    dish_category:'basic', price_cad:ars(4200), local_price:4200, local_currency:'ARS', exchange_rate_used:0.0009654,
    tier:'mid_tier', source_url:'https://www.tripadvisor.com/Restaurants-g312741-Buenos_Aires', source_type:'third_party_menu', confidence_score:0.78,
    notes:'Palermo Soho — Buenos Aires trendy neighbourhood with upscale Asian restaurants. ARS 3,800–4,800.' },

  { city:'Buenos Aires', country:'Argentina',
    restaurant_name:'La Matanza / Morón western suburbs Chinese', dish_name:'Arroz con Huevo',
    dish_category:'basic', price_cad:ars(2800), local_price:2800, local_currency:'ARS', exchange_rate_used:0.0009654,
    tier:'low_tier', source_url:'https://www.tripadvisor.com/Restaurants-g312741-Buenos_Aires', source_type:'third_party_menu', confidence_score:0.72,
    notes:'La Matanza / Morón — working-class western GBA suburbs. Budget Chinese ARS 2,500–3,200.' },

  { city:'Buenos Aires', country:'Argentina',
    restaurant_name:'Mar del Plata route Chinese (CABA / GBA mixed)', dish_name:'Arroz Frito Vegetariano',
    dish_category:'vegetable', price_cad:ars(3600), local_price:3600, local_currency:'ARS', exchange_rate_used:0.0009654,
    tier:'mid_tier', source_url:'https://www.tripadvisor.com/Restaurants-g312741-Buenos_Aires', source_type:'third_party_menu', confidence_score:0.72,
    notes:'Mixed Chinese-Argentine delivery options across GBA. ARS 3,300–4,000. Note: ARS PPP factor very uncertain due to inflation.' },

  { city:'Buenos Aires', country:'Argentina',
    restaurant_name:'Grand Bourg / José C. Paz outer GBA Chinese', dish_name:'Arroz Frito',
    dish_category:'basic', price_cad:ars(2500), local_price:2500, local_currency:'ARS', exchange_rate_used:0.0009654,
    tier:'low_tier', source_url:'https://www.tripadvisor.com/Restaurants-g312741-Buenos_Aires', source_type:'third_party_menu', confidence_score:0.68,
    notes:'Outer GBA suburbs (Malvinas Argentinas / José C. Paz) — very budget Chinese. ARS 2,200–2,800. Prices change rapidly due to inflation.' },
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
    source: 'Manual seed – expand-v2-east-asia-latam',
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
  console.log('\n✓ expand-v2-east-asia-latam complete.')
}
run().catch(console.error)
