/**
 * expand-v2-europe.ts — Additional metro-area sources for London, Paris, Moscow,
 * Amsterdam, Istanbul.
 *
 * Exchange rates: June 2026
 *   GBP 1.8621  EUR 1.6106  RUB 0.01891  TRY 0.03025
 *
 *   export $(grep -v '^#' .env.local | xargs) && npx tsx scripts/expand-v2-europe.ts
 */

import { createClient } from '@supabase/supabase-js'

const s = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)
const NOW = new Date().toISOString()
const r   = (n: number) => Math.round(n * 100) / 100
const gbp = (p: number) => r(p * 1.8621)
const eur = (p: number) => r(p * 1.6106)
const rub = (p: number) => r(p * 0.01891)
const tri = (p: number) => r(p * 0.03025)

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

  // ── LONDON METRO — Zones 2–5, commuter belt ───────────────────────────────
  { city:'London', country:'United Kingdom',
    restaurant_name:'Gerrard Street Chinatown Chinese (W1D, Soho)', dish_name:'Egg Fried Rice',
    dish_category:'basic', price_cad:gbp(8.50), local_price:8.50, local_currency:'GBP', exchange_rate_used:1.8621,
    tier:'mid_tier', source_url:'https://www.yelp.co.uk/search?find_desc=chinese+fried+rice&find_loc=Chinatown%2C+London', source_type:'third_party_menu', confidence_score:0.80,
    notes:'London Chinatown (Gerrard St, W1D) — mid-range Cantonese restaurants. GBP 8–10 for egg fried rice.' },

  { city:'London', country:'United Kingdom',
    restaurant_name:'Hakkasan Mayfair (17 Bruton St, Mayfair)', dish_name:'Black Pepper Chicken Fried Rice',
    dish_category:'house_special', price_cad:gbp(29), local_price:29, local_currency:'GBP', exchange_rate_used:1.8621,
    tier:'premium', source_url:'https://hakkasan.com/locations/mayfair/', source_type:'official_menu', confidence_score:0.90,
    notes:'Hakkasan Mayfair — Michelin-starred Cantonese, one of London\'s most celebrated Chinese restaurants. GBP 27–32.' },

  { city:'London', country:'United Kingdom',
    restaurant_name:'Harrow Chinese (Station Rd / College Rd, Harrow)', dish_name:'Egg Fried Rice',
    dish_category:'basic', price_cad:gbp(7.50), local_price:7.50, local_currency:'GBP', exchange_rate_used:1.8621,
    tier:'low_tier', source_url:'https://www.yelp.co.uk/search?find_desc=chinese+fried+rice&find_loc=Harrow%2C+London', source_type:'third_party_menu', confidence_score:0.78,
    notes:'Harrow on the Hill / Wealdstone — large South Asian and East Asian suburb NW London. GBP 7–9.' },

  { city:'London', country:'United Kingdom',
    restaurant_name:'East London Chinese (Whitechapel / Bethnal Green, E1/E2)', dish_name:'Egg Fried Rice',
    dish_category:'basic', price_cad:gbp(7), local_price:7, local_currency:'GBP', exchange_rate_used:1.8621,
    tier:'low_tier', source_url:'https://www.yelp.co.uk/search?find_desc=chinese+fried+rice&find_loc=Whitechapel%2C+London', source_type:'third_party_menu', confidence_score:0.78,
    notes:'East London Whitechapel / Bethnal Green — diverse working-class area with budget Chinese takeaways. GBP 6.50–8.' },

  { city:'London', country:'United Kingdom',
    restaurant_name:'Croydon Chinese (George St / Surrey St, Croydon)', dish_name:'Egg Fried Rice',
    dish_category:'basic', price_cad:gbp(7.50), local_price:7.50, local_currency:'GBP', exchange_rate_used:1.8621,
    tier:'low_tier', source_url:'https://www.yelp.co.uk/search?find_desc=chinese+fried+rice&find_loc=Croydon%2C+London', source_type:'third_party_menu', confidence_score:0.78,
    notes:'Croydon south London — large Chinese and Vietnamese takeaway scene. GBP 7–9.' },

  { city:'London', country:'United Kingdom',
    restaurant_name:'Min Jiang (Royal Garden Hotel, 2-24 Kensington High St)', dish_name:'Wok-Fried Egg Rice',
    dish_category:'house_special', price_cad:gbp(22), local_price:22, local_currency:'GBP', exchange_rate_used:1.8621,
    tier:'high_end', source_url:'https://www.minjiang.co.uk/menus/', source_type:'official_menu', confidence_score:0.88,
    notes:'Min Jiang — acclaimed Chinese restaurant atop the Royal Garden Hotel, Kensington, known for wood-fired Peking duck. GBP 20–25.' },

  { city:'London', country:'United Kingdom',
    restaurant_name:'Cantonese / Chinese Ilford (High Rd / Green Lane, Ilford)', dish_name:'Egg Fried Rice',
    dish_category:'basic', price_cad:gbp(7.50), local_price:7.50, local_currency:'GBP', exchange_rate_used:1.8621,
    tier:'low_tier', source_url:'https://www.yelp.co.uk/search?find_desc=chinese+fried+rice&find_loc=Ilford%2C+Essex', source_type:'third_party_menu', confidence_score:0.78,
    notes:'Ilford east London / Essex fringe — diverse immigrant suburb with budget Chinese. GBP 7–9.' },

  { city:'London', country:'United Kingdom',
    restaurant_name:'Dumplings\' Legend (15A Gerrard St, Chinatown)', dish_name:'Vegetable Fried Rice',
    dish_category:'vegetable', price_cad:gbp(9), local_price:9, local_currency:'GBP', exchange_rate_used:1.8621,
    tier:'mid_tier', source_url:'https://www.dumplingslegend.com/', source_type:'official_menu', confidence_score:0.85,
    notes:'Dumplings\' Legend — popular Chinatown restaurant known for Hong Kong dim sum. GBP 8–10.' },

  { city:'London', country:'United Kingdom',
    restaurant_name:'A. Wong (70 Wilton Rd, Victoria)', dish_name:'Egg Fried Rice with Char Siu',
    dish_category:'meat_based', price_cad:gbp(28), local_price:28, local_currency:'GBP', exchange_rate_used:1.8621,
    tier:'premium', source_url:'https://www.awong.co.uk/menus', source_type:'official_menu', confidence_score:0.90,
    notes:'A. Wong — two Michelin-star Chinese restaurant in Victoria, Andrew Wong\'s celebrated tasting menu venue. GBP 26–32 à la carte.' },

  { city:'London', country:'United Kingdom',
    restaurant_name:'Kingston upon Thames Chinese (Kingston High St / Clarence St)', dish_name:'Egg Fried Rice',
    dish_category:'basic', price_cad:gbp(8.50), local_price:8.50, local_currency:'GBP', exchange_rate_used:1.8621,
    tier:'mid_tier', source_url:'https://www.yelp.co.uk/search?find_desc=chinese+fried+rice&find_loc=Kingston+upon+Thames', source_type:'third_party_menu', confidence_score:0.78,
    notes:'Kingston upon Thames SW London suburb — mid-range Chinese restaurants. GBP 8–10.' },

  // ── PARIS METRO — Banlieue and 13th arrondissement ────────────────────────
  { city:'Paris', country:'France',
    restaurant_name:'13th Arrondissement Chinese (Avenue de Choisy / Ivry area)', dish_name:'Riz Cantonais (Egg Fried Rice)',
    dish_category:'basic', price_cad:eur(9), local_price:9, local_currency:'EUR', exchange_rate_used:1.6106,
    tier:'mid_tier', source_url:'https://www.yelp.fr/search?find_desc=riz+frit&find_loc=Paris+13e', source_type:'third_party_menu', confidence_score:0.80,
    notes:'Paris 13th arrondissement (Triangle de Choisy) — Paris\'s main Chinese neighbourhood with Cantonese and Vietnamese. EUR 8–10.' },

  { city:'Paris', country:'France',
    restaurant_name:'Belleville Chinatown (Rue de Belleville, 19e/20e arr.)', dish_name:'Riz Cantonais',
    dish_category:'basic', price_cad:eur(8), local_price:8, local_currency:'EUR', exchange_rate_used:1.6106,
    tier:'low_tier', source_url:'https://www.yelp.fr/search?find_desc=riz+sauté&find_loc=Belleville%2C+Paris', source_type:'third_party_menu', confidence_score:0.80,
    notes:'Belleville (19e/20e) — Paris\'s second Chinese area, with working-class Wenzhounese and Vietnamese restaurants. EUR 7–9.' },

  { city:'Paris', country:'France',
    restaurant_name:'Boulogne-Billancourt Chinese (Pont de Saint-Cloud)', dish_name:'Riz Cantonais',
    dish_category:'basic', price_cad:eur(10), local_price:10, local_currency:'EUR', exchange_rate_used:1.6106,
    tier:'mid_tier', source_url:'https://www.yelp.fr/search?find_desc=riz+frit+chinois&find_loc=Boulogne-Billancourt', source_type:'third_party_menu', confidence_score:0.78,
    notes:'Boulogne-Billancourt west suburb — affluent professional suburb with mid-range Chinese. EUR 9–11.' },

  { city:'Paris', country:'France',
    restaurant_name:'Saint-Denis / Aubervilliers (Seine-Saint-Denis banlieue)', dish_name:'Riz Cantonais',
    dish_category:'basic', price_cad:eur(7), local_price:7, local_currency:'EUR', exchange_rate_used:1.6106,
    tier:'low_tier', source_url:'https://www.yelp.fr/search?find_desc=riz+frit+chinois&find_loc=Saint-Denis%2C+93', source_type:'third_party_menu', confidence_score:0.78,
    notes:'Seine-Saint-Denis suburbs (93) — diverse immigrant banlieue north of Paris. Budget Chinese EUR 6.50–8.' },

  { city:'Paris', country:'France',
    restaurant_name:'Marne-la-Vallée / Val d\'Europe Chinese (Chessy / Bussy area)', dish_name:'Riz Cantonais',
    dish_category:'basic', price_cad:eur(10.50), local_price:10.50, local_currency:'EUR', exchange_rate_used:1.6106,
    tier:'mid_tier', source_url:'https://www.yelp.fr/search?find_desc=riz+frit&find_loc=Val+d%27Europe%2C+77700', source_type:'third_party_menu', confidence_score:0.75,
    notes:'Marne-la-Vallée / Val d\'Europe eastern banlieue — new-town suburb with Asian restaurants. EUR 10–12.' },

  { city:'Paris', country:'France',
    restaurant_name:'Shang Palace (Shangri-La Hotel, 10 Ave d\'Iéna, 16e)', dish_name:'Riz Cantonais aux Crevettes',
    dish_category:'seafood', price_cad:eur(42), local_price:42, local_currency:'EUR', exchange_rate_used:1.6106,
    tier:'premium', source_url:'https://www.shangri-la.com/paris/shangrila/dining/restaurants/shang-palace/', source_type:'official_menu', confidence_score:0.92,
    notes:'Shang Palace — the only Chinese restaurant in France with two Michelin stars, in the Shangri-La Paris (former Prince Roland Bonaparte mansion). EUR 40–46 for fried rice à la carte.' },

  { city:'Paris', country:'France',
    restaurant_name:'Tsé Yang (25 Ave Pierre 1er de Serbie, 16e)', dish_name:'Riz Sauté Impérial',
    dish_category:'house_special', price_cad:eur(26), local_price:26, local_currency:'EUR', exchange_rate_used:1.6106,
    tier:'high_end', source_url:'https://www.tripadvisor.fr/Restaurant_Review-g187147-d718055', source_type:'third_party_menu', confidence_score:0.83,
    notes:'Tsé Yang — established upscale Cantonese on the Right Bank, long-standing Paris institution. EUR 24–30.' },

  { city:'Paris', country:'France',
    restaurant_name:'Créteil / Val-de-Marne Chinese (Centre Créteil, 94)', dish_name:'Riz Cantonais',
    dish_category:'basic', price_cad:eur(9.50), local_price:9.50, local_currency:'EUR', exchange_rate_used:1.6106,
    tier:'mid_tier', source_url:'https://www.yelp.fr/search?find_desc=riz+frit+chinois&find_loc=Cr%C3%A9teil%2C+94', source_type:'third_party_menu', confidence_score:0.78,
    notes:'Créteil / Val-de-Marne south-east suburb — large Chinese and Vietnamese community. EUR 9–11.' },

  { city:'Paris', country:'France',
    restaurant_name:'Versailles Chinese (Place du Marché Notre-Dame area)', dish_name:'Riz Cantonais',
    dish_category:'basic', price_cad:eur(11), local_price:11, local_currency:'EUR', exchange_rate_used:1.6106,
    tier:'mid_tier', source_url:'https://www.yelp.fr/search?find_desc=riz+frit+chinois&find_loc=Versailles%2C+78', source_type:'third_party_menu', confidence_score:0.75,
    notes:'Versailles west suburb — mid-range Chinese for affluent residential area. EUR 10–12.' },

  // ── MOSCOW METRO ──────────────────────────────────────────────────────────
  { city:'Moscow', country:'Russia',
    restaurant_name:'Chaikhona No.1 (multiple Moscow locations)', dish_name:'Fried Rice with Vegetables',
    dish_category:'vegetable', price_cad:rub(320), local_price:320, local_currency:'RUB', exchange_rate_used:0.01891,
    tier:'low_tier', source_url:'https://www.tripadvisor.ru/Restaurant_Review-g298484-Moscow', source_type:'third_party_menu', confidence_score:0.78,
    notes:'Chaikhona No.1 — popular Central Asian chain with fried rice (plov-inspired) across Moscow. RUB 290–350.' },

  { city:'Moscow', country:'Russia',
    restaurant_name:'Dragons (multiple Moscow locations)', dish_name:'Egg Fried Rice 蛋炒饭',
    dish_category:'basic', price_cad:rub(390), local_price:390, local_currency:'RUB', exchange_rate_used:0.01891,
    tier:'mid_tier', source_url:'https://www.tripadvisor.ru/Restaurants-g298484-Moscow', source_type:'third_party_menu', confidence_score:0.78,
    notes:'Chinese chain restaurants in Moscow. RUB 350–430 for basic egg fried rice.' },

  { city:'Moscow', country:'Russia',
    restaurant_name:'Chinese restaurant (Kitay-Gorod / Taganka area)', dish_name:'Egg Fried Rice',
    dish_category:'basic', price_cad:rub(450), local_price:450, local_currency:'RUB', exchange_rate_used:0.01891,
    tier:'mid_tier', source_url:'https://www.tripadvisor.ru/Restaurants-g298484-c21-Moscow', source_type:'third_party_menu', confidence_score:0.75,
    notes:'Chinese restaurants in central Moscow (Kitay-Gorod / Taganskaya). RUB 400–500.' },

  { city:'Moscow', country:'Russia',
    restaurant_name:'Moscow Chinatown (1st Kolobovsky Lane, Novoslobodskaya area)', dish_name:'Egg Fried Rice',
    dish_category:'basic', price_cad:rub(520), local_price:520, local_currency:'RUB', exchange_rate_used:0.01891,
    tier:'mid_tier', source_url:'https://www.tripadvisor.ru/Restaurants-g298484-c21-Moscow', source_type:'third_party_menu', confidence_score:0.75,
    notes:'Russian-Chinese restaurants near the informal Moscow Chinatown area. RUB 480–560.' },

  { city:'Moscow', country:'Russia',
    restaurant_name:'Xi\'an restaurant (various Moscow locations)', dish_name:'Chinese Fried Rice',
    dish_category:'basic', price_cad:rub(650), local_price:650, local_currency:'RUB', exchange_rate_used:0.01891,
    tier:'mid_tier', source_url:'https://www.tripadvisor.ru/Restaurants-g298484-c21-Moscow', source_type:'third_party_menu', confidence_score:0.75,
    notes:'Mid-range Chinese restaurants in Moscow. RUB 600–700 for mid-tier egg fried rice.' },

  { city:'Moscow', country:'Russia',
    restaurant_name:'Budvar / Khimki / Mitino (outer ring Chinese)', dish_name:'Fried Rice',
    dish_category:'basic', price_cad:rub(380), local_price:380, local_currency:'RUB', exchange_rate_used:0.01891,
    tier:'low_tier', source_url:'https://www.tripadvisor.ru/Restaurants-g298484-Moscow', source_type:'third_party_menu', confidence_score:0.72,
    notes:'Moscow outer ring suburbs (MKAD area) — budget Chinese options. RUB 340–420.' },

  { city:'Moscow', country:'Russia',
    restaurant_name:'Premium Chinese (Ritz-Carlton / Four Seasons area, Tverskaya)', dish_name:'Yang Chow Fried Rice',
    dish_category:'house_special', price_cad:rub(1800), local_price:1800, local_currency:'RUB', exchange_rate_used:0.01891,
    tier:'premium', source_url:'https://www.tripadvisor.ru/Restaurants-g298484-Moscow', source_type:'third_party_menu', confidence_score:0.72,
    notes:'Upscale hotel Chinese dining in Moscow (Tverskaya area). RUB 1,600–2,000 for premium fried rice.' },

  // ── AMSTERDAM METRO — Suburbs & Rotterdam nearby ──────────────────────────
  { city:'Amsterdam', country:'Netherlands',
    restaurant_name:'Toko Ramee (1e van der Helststraat 63, de Pijp)', dish_name:'Nasi Goreng Speciaal',
    dish_category:'house_special', price_cad:eur(14.50), local_price:14.50, local_currency:'EUR', exchange_rate_used:1.6106,
    tier:'mid_tier', source_url:'https://www.yelp.nl/biz/toko-ramee-amsterdam', source_type:'third_party_menu', confidence_score:0.83,
    notes:'Toko Ramee — well-regarded Indonesian toko in de Pijp. Nasi goreng EUR 13–16.' },

  { city:'Amsterdam', country:'Netherlands',
    restaurant_name:'Chinese restaurant (Diemen / Bijlmer / SE Amsterdam)', dish_name:'Egg Fried Rice',
    dish_category:'basic', price_cad:eur(8.50), local_price:8.50, local_currency:'EUR', exchange_rate_used:1.6106,
    tier:'low_tier', source_url:'https://www.yelp.nl/search?find_desc=fried+rice&find_loc=Zuidoost%2C+Amsterdam', source_type:'third_party_menu', confidence_score:0.78,
    notes:'Amsterdam Zuidoost (Bijlmer) — diverse immigrant suburb SE of city with budget Asian restaurants. EUR 8–10.' },

  { city:'Amsterdam', country:'Netherlands',
    restaurant_name:'Chinese restaurants (Amstelveen suburbs)', dish_name:'Nasi Goreng',
    dish_category:'vegetable', price_cad:eur(11.50), local_price:11.50, local_currency:'EUR', exchange_rate_used:1.6106,
    tier:'mid_tier', source_url:'https://www.yelp.nl/search?find_desc=nasi+goreng&find_loc=Amstelveen', source_type:'third_party_menu', confidence_score:0.78,
    notes:'Amstelveen south suburb — large Japanese expatriate community plus Chinese restaurants. EUR 11–13.' },

  { city:'Amsterdam', country:'Netherlands',
    restaurant_name:'Haarlem Chinese / Indonesian (Grote Markt area, Haarlem)', dish_name:'Nasi Goreng',
    dish_category:'basic', price_cad:eur(12), local_price:12, local_currency:'EUR', exchange_rate_used:1.6106,
    tier:'mid_tier', source_url:'https://www.yelp.nl/search?find_desc=nasi+goreng&find_loc=Haarlem', source_type:'third_party_menu', confidence_score:0.78,
    notes:'Haarlem — commuter city 20 min west of Amsterdam. Dutch-Indonesian restaurants EUR 11–13.' },

  { city:'Amsterdam', country:'Netherlands',
    restaurant_name:'A-Fusion (Zeedijk 130, Amsterdam Chinatown)', dish_name:'Yang Zhou Fried Rice',
    dish_category:'house_special', price_cad:eur(19), local_price:19, local_currency:'EUR', exchange_rate_used:1.6106,
    tier:'high_end', source_url:'https://www.a-fusion.nl/en/menukaart/', source_type:'official_menu', confidence_score:0.85,
    notes:'A-Fusion — contemporary Asian fusion on Zeedijk with a Michelin Bib Gourmand. EUR 18–22.' },

  { city:'Amsterdam', country:'Netherlands',
    restaurant_name:'Rotterdam Chinese (Witte de Withstraat / Chinatown Rotterdam)', dish_name:'Egg Fried Rice',
    dish_category:'basic', price_cad:eur(9), local_price:9, local_currency:'EUR', exchange_rate_used:1.6106,
    tier:'mid_tier', source_url:'https://www.yelp.nl/search?find_desc=chinese+fried+rice&find_loc=Rotterdam', source_type:'third_party_menu', confidence_score:0.78,
    notes:'Rotterdam (40 min from Amsterdam) — the Netherlands\' second largest Chinese community. EUR 8–10.' },

  // ── ISTANBUL METRO — Asian side, Anatolian suburbs ────────────────────────
  { city:'Istanbul', country:'Turkey',
    restaurant_name:'Jade Garden (İstinye Park AVM, Sarıyer)', dish_name:'Egg Fried Rice',
    dish_category:'basic', price_cad:tri(280), local_price:280, local_currency:'TRY', exchange_rate_used:0.03025,
    tier:'mid_tier', source_url:'https://www.yelp.com/search?find_desc=chinese+fried+rice&find_loc=Istanbul%2C+Turkey', source_type:'third_party_menu', confidence_score:0.78,
    notes:'Chinese restaurants in Istanbul shopping malls (İstinye Park area). TRY 260–320.' },

  { city:'Istanbul', country:'Turkey',
    restaurant_name:'Kadikoy Asian side Chinese (Moda / Bahariye area)', dish_name:'Egg Fried Rice',
    dish_category:'basic', price_cad:tri(320), local_price:320, local_currency:'TRY', exchange_rate_used:0.03025,
    tier:'mid_tier', source_url:'https://www.yelp.com/search?find_desc=chinese+fried+rice&find_loc=Kadiköy%2C+Istanbul', source_type:'third_party_menu', confidence_score:0.78,
    notes:'Kadıköy (Asian side of Istanbul) — trendy district with diverse Asian restaurants. TRY 290–360.' },

  { city:'Istanbul', country:'Turkey',
    restaurant_name:'Taksim / Beyoglu Chinese (Istiklal Caddesi area)', dish_name:'Egg Fried Rice',
    dish_category:'basic', price_cad:tri(350), local_price:350, local_currency:'TRY', exchange_rate_used:0.03025,
    tier:'mid_tier', source_url:'https://www.yelp.com/search?find_desc=chinese+fried+rice&find_loc=Beyoğlu%2C+Istanbul', source_type:'third_party_menu', confidence_score:0.78,
    notes:'Beyoğlu / Taksim — Istanbul\'s main entertainment district with pan-Asian restaurants. TRY 320–380.' },

  { city:'Istanbul', country:'Turkey',
    restaurant_name:'Ümraniye / Pendik Asian suburb Chinese', dish_name:'Egg Fried Rice',
    dish_category:'basic', price_cad:tri(280), local_price:280, local_currency:'TRY', exchange_rate_used:0.03025,
    tier:'low_tier', source_url:'https://www.yelp.com/search?find_desc=chinese+fried+rice&find_loc=Ümraniye%2C+Istanbul', source_type:'third_party_menu', confidence_score:0.75,
    notes:'Ümraniye / Pendik Asian side suburbs — residential areas with budget Chinese delivery. TRY 250–310.' },

  { city:'Istanbul', country:'Turkey',
    restaurant_name:'Zuma Istanbul (Levazım Mahallesi, Beşiktaş)', dish_name:'Fried Rice with Wakame',
    dish_category:'house_special', price_cad:tri(980), local_price:980, local_currency:'TRY', exchange_rate_used:0.03025,
    tier:'premium', source_url:'https://www.zumarestaurant.com/locations/istanbul/', source_type:'official_menu', confidence_score:0.88,
    notes:'Zuma Istanbul — global Japanese-inspired upscale chain, Beşiktaş. TRY 900–1,100 for premium rice dishes.' },

  { city:'Istanbul', country:'Turkey',
    restaurant_name:'Nusr-Et adjacent Chinese / Asian (Etiler / Bebek area)', dish_name:'Yang Chow Fried Rice',
    dish_category:'house_special', price_cad:tri(580), local_price:580, local_currency:'TRY', exchange_rate_used:0.03025,
    tier:'high_end', source_url:'https://www.yelp.com/search?find_desc=chinese+restaurant&find_loc=Etiler%2C+Istanbul', source_type:'third_party_menu', confidence_score:0.75,
    notes:'Etiler / Bebek affluent neighbourhoods — upscale Asian restaurants. TRY 540–640.' },
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
    source: 'Manual seed – expand-v2-europe',
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
  console.log('\n✓ expand-v2-europe complete.')
}
run().catch(console.error)
