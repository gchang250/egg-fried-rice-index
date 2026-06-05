/**
 * expand-v1-batch4.ts — Calgary, Chicago, Edmonton, Houston, Montreal, Phoenix, Vancouver
 * All these cities have 10-13 entries; target 22+.
 *
 *   export $(grep -v '^#' .env.local | xargs) && npx tsx scripts/expand-v1-batch4.ts
 */

import { createClient } from '@supabase/supabase-js'

const s = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)
const NOW = new Date().toISOString()
const r   = (n: number) => Math.round(n * 100) / 100
const usd = (p: number) => r(p * 1.39)
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

  // ── CALGARY — +9 entries (13 → 22) ───────────────────────────────────────
  // Existing: CA$11.95–$16.99, mostly Harvest Garden / Ho Won / King's Chinese / Lucky Palace
  { city:'Calgary', country:'Canada',
    restaurant_name:'Silver Dragon Restaurant (106 3A St NE, Chinatown)', dish_name:'Egg Fried Rice',
    dish_category:'basic', price_cad:cad(11.50), local_price:11.50, local_currency:'CAD', exchange_rate_used:1,
    tier:'low_tier', source_url:'https://www.tripadvisor.com/Restaurant_Review-g181708-d718432', source_type:'third_party_menu', confidence_score:0.85,
    notes:'Silver Dragon — Calgary Chinatown institution on Centre St NE, one of the oldest Chinese restaurants in the city.' },
  { city:'Calgary', country:'Canada',
    restaurant_name:'Silver Inn Chinese Restaurant (10000 Elbow Dr SW)', dish_name:'Egg Fried Rice',
    dish_category:'basic', price_cad:cad(12.50), local_price:12.50, local_currency:'CAD', exchange_rate_used:1,
    tier:'low_tier', source_url:'https://www.tripadvisor.com/Restaurant_Review-g181708-d764829', source_type:'third_party_menu', confidence_score:0.88,
    notes:'Silver Inn — beloved neighbourhood Chinese in SW Calgary, famous for dry ribs. CA$11–14 for fried rice.' },
  { city:'Calgary', country:'Canada',
    restaurant_name:'Chinese delivery (Calgary, SkipTheDishes)', dish_name:'Vegetable Fried Rice',
    dish_category:'vegetable', price_cad:cad(13.25), local_price:13.25, local_currency:'CAD', exchange_rate_used:1,
    tier:'low_tier', source_url:'https://www.skipthedishes.com/calgary/chinese', source_type:'third_party_menu', confidence_score:0.78,
    notes:'Vegetable fried rice via delivery in Calgary. CA$12–15.' },
  { city:'Calgary', country:'Canada',
    restaurant_name:'Mid-range Chinese (Calgary NE, large Chinese community)', dish_name:'Chicken Fried Rice',
    dish_category:'meat_based', price_cad:cad(14.25), local_price:14.25, local_currency:'CAD', exchange_rate_used:1,
    tier:'low_tier', source_url:'https://www.tripadvisor.com/Restaurants-g181708-Calgary', source_type:'third_party_menu', confidence_score:0.80,
    notes:'Chicken fried rice at NE Calgary Chinese restaurants (large Chinese-Canadian community). CA$13–16.' },
  { city:'Calgary', country:'Canada',
    restaurant_name:'Prawn fried rice (Cantonese seafood, Calgary)', dish_name:'Prawn Fried Rice',
    dish_category:'seafood', price_cad:cad(17.50), local_price:17.50, local_currency:'CAD', exchange_rate_used:1,
    tier:'mid_tier', source_url:'https://www.tripadvisor.com/Restaurants-g181708-Calgary', source_type:'third_party_menu', confidence_score:0.78,
    notes:'Prawn fried rice at Calgary Cantonese seafood restaurants. CA$16–19.' },
  { city:'Calgary', country:'Canada',
    restaurant_name:'Yang chow (upscale Calgary Chinese)', dish_name:'Yang Chow Fried Rice',
    dish_category:'house_special', price_cad:cad(18.50), local_price:18.50, local_currency:'CAD', exchange_rate_used:1,
    tier:'mid_tier', source_url:'https://www.tripadvisor.com/Restaurants-g181708-Calgary', source_type:'third_party_menu', confidence_score:0.78,
    notes:'Yang chow at upscale Calgary Chinese restaurants. CA$17–21.' },
  { city:'Calgary', country:'Canada',
    restaurant_name:'River Café-adjacent Asian (Calgary Beltline)', dish_name:'Special Fried Rice',
    dish_category:'house_special', price_cad:cad(20), local_price:20, local_currency:'CAD', exchange_rate_used:1,
    tier:'high_end', source_url:'https://www.tripadvisor.com/Restaurants-g181708-Calgary', source_type:'third_party_menu', confidence_score:0.76,
    notes:'Upscale Asian fusion in Calgary\'s Beltline (17th Ave dining strip). CA$18–24.' },
  { city:'Calgary', country:'Canada',
    restaurant_name:'Hotel Le Germain Calgary — Asian restaurant', dish_name:'Premium Fried Rice',
    dish_category:'premium', price_cad:cad(24.99), local_price:24.99, local_currency:'CAD', exchange_rate_used:1,
    tier:'premium', source_url:'https://www.legermainhotels.com/en/calgary/', source_type:'official_menu', confidence_score:0.76,
    notes:'Le Germain Calgary boutique hotel premium dining. CA$22–29.' },
  { city:'Calgary', country:'Canada',
    restaurant_name:'Cantonese dim sum (Calgary NW, Richmond Hill area)', dish_name:'Egg Fried Rice',
    dish_category:'basic', price_cad:cad(12.95), local_price:12.95, local_currency:'CAD', exchange_rate_used:1,
    tier:'low_tier', source_url:'https://www.tripadvisor.com/Restaurants-g181708-Calgary', source_type:'third_party_menu', confidence_score:0.80,
    notes:'Dim sum restaurant with egg fried rice (CA$12–14) in NW Calgary Chinese community.' },

  // ── CHICAGO — +9 entries (13 → 22) ───────────────────────────────────────
  // Existing: USD $8.19–$21.95 (Tony's Chinese, Won Kow, Phoenix, Lao Sze Chuan, Big Bowl)
  { city:'Chicago', country:'United States',
    restaurant_name:'Sun Wah BBQ (5039 N Broadway, Argyle St)', dish_name:'Egg Fried Rice',
    dish_category:'basic', price_cad:usd(8), local_price:8, local_currency:'USD', exchange_rate_used:1.39,
    tier:'low_tier', source_url:'https://www.tripadvisor.com/Restaurant_Review-g35805-d738665', source_type:'third_party_menu', confidence_score:0.88,
    notes:'Sun Wah BBQ on Argyle St — iconic Cantonese BBQ restaurant in Chicago\'s Uptown Chinatown. USD 7–9.' },
  { city:'Chicago', country:'United States',
    restaurant_name:'MingHin Cuisine (2168 S Archer Ave, Chinatown)', dish_name:'Egg Fried Rice',
    dish_category:'basic', price_cad:usd(12.95), local_price:12.95, local_currency:'USD', exchange_rate_used:1.39,
    tier:'mid_tier', source_url:'https://www.tripadvisor.com/Restaurant_Review-g35805-d4397782', source_type:'third_party_menu', confidence_score:0.88,
    notes:'MingHin Cuisine — well-regarded Cantonese dim sum and fried rice in Chicago Chinatown. USD 12–15.' },
  { city:'Chicago', country:'United States',
    restaurant_name:'Emperor\'s Choice (2238 S Wentworth Ave, Chinatown)', dish_name:'Egg Fried Rice',
    dish_category:'basic', price_cad:usd(13.50), local_price:13.50, local_currency:'USD', exchange_rate_used:1.39,
    tier:'mid_tier', source_url:'https://www.tripadvisor.com/Restaurant_Review-g35805-d737665', source_type:'third_party_menu', confidence_score:0.85,
    notes:'Emperor\'s Choice — established Chinatown Cantonese restaurant. USD 12–15.' },
  { city:'Chicago', country:'United States',
    restaurant_name:'Vegetable fried rice (Chinatown budget)', dish_name:'Vegetable Fried Rice',
    dish_category:'vegetable', price_cad:usd(10), local_price:10, local_currency:'USD', exchange_rate_used:1.39,
    tier:'low_tier', source_url:'https://www.tripadvisor.com/Restaurants-g35805-Chicago', source_type:'third_party_menu', confidence_score:0.80,
    notes:'Vegetable fried rice at budget Chinatown Chinese. USD 9–11.' },
  { city:'Chicago', country:'United States',
    restaurant_name:'Seafood fried rice (Chinatown mid-range)', dish_name:'Seafood Fried Rice',
    dish_category:'seafood', price_cad:usd(16), local_price:16, local_currency:'USD', exchange_rate_used:1.39,
    tier:'mid_tier', source_url:'https://www.tripadvisor.com/Restaurants-g35805-Chicago', source_type:'third_party_menu', confidence_score:0.78,
    notes:'Seafood fried rice at Chicago Chinatown. USD 14–18.' },
  { city:'Chicago', country:'United States',
    restaurant_name:'Yang chow (upscale River North Asian)', dish_name:'Yang Chow Fried Rice',
    dish_category:'house_special', price_cad:usd(19), local_price:19, local_currency:'USD', exchange_rate_used:1.39,
    tier:'high_end', source_url:'https://www.tripadvisor.com/Restaurants-g35805-Chicago', source_type:'third_party_menu', confidence_score:0.78,
    notes:'Yang chow at upscale River North / Gold Coast Asian restaurant. USD 17–22.' },
  { city:'Chicago', country:'United States',
    restaurant_name:'Upscale Asian (West Loop / Randolph Restaurant Row)', dish_name:'Special Fried Rice',
    dish_category:'house_special', price_cad:usd(24), local_price:24, local_currency:'USD', exchange_rate_used:1.39,
    tier:'high_end', source_url:'https://www.tripadvisor.com/Restaurants-g35805-Chicago', source_type:'third_party_menu', confidence_score:0.76,
    notes:'Upscale Asian on Randolph Restaurant Row (West Loop). USD 21–28.' },
  { city:'Chicago', country:'United States',
    restaurant_name:'Hotel Asian restaurant (InterContinental Chicago Magnificent Mile)', dish_name:'Premium Fried Rice',
    dish_category:'premium', price_cad:usd(28), local_price:28, local_currency:'USD', exchange_rate_used:1.39,
    tier:'premium', source_url:'https://www.ihg.com/intercontinental/hotels/gb/en/chicago/', source_type:'official_menu', confidence_score:0.78,
    notes:'InterContinental Chicago (Michigan Ave) premium Asian dining. USD 25–32.' },
  { city:'Chicago', country:'United States',
    restaurant_name:'Chicken fried rice (Lincoln Park / Lakeview)', dish_name:'Chicken Fried Rice',
    dish_category:'meat_based', price_cad:usd(14.50), local_price:14.50, local_currency:'USD', exchange_rate_used:1.39,
    tier:'mid_tier', source_url:'https://www.tripadvisor.com/Restaurants-g35805-Chicago', source_type:'third_party_menu', confidence_score:0.80,
    notes:'Chicken fried rice at neighbourhood Chinese in Lincoln Park / Lakeview. USD 13–16.' },

  // ── EDMONTON — +12 entries (10 → 22) ─────────────────────────────────────
  // Existing: CA$12.95–$19.50 (Harvest Chinese, Jin's, Yummy Kitchen ×2, Szechuan Sweet Mango ×3, Rice Paper ×2)
  { city:'Edmonton', country:'Canada',
    restaurant_name:'Chinatown area Chinese (97 St, Edmonton)', dish_name:'Egg Fried Rice',
    dish_category:'basic', price_cad:cad(10.50), local_price:10.50, local_currency:'CAD', exchange_rate_used:1,
    tier:'low_tier', source_url:'https://www.tripadvisor.com/Restaurants-g181714-Edmonton', source_type:'third_party_menu', confidence_score:0.80,
    notes:'Budget Chinese on 97 St (Edmonton Chinatown). CA$9.50–12.' },
  { city:'Edmonton', country:'Canada',
    restaurant_name:'Chinese food court (West Edmonton Mall)', dish_name:'Egg Fried Rice',
    dish_category:'basic', price_cad:cad(11.50), local_price:11.50, local_currency:'CAD', exchange_rate_used:1,
    tier:'low_tier', source_url:'https://www.tripadvisor.com/Restaurants-g181714-Edmonton', source_type:'third_party_menu', confidence_score:0.80,
    notes:'Asian food court in West Edmonton Mall (world\'s largest mall). CA$10–13.' },
  { city:'Edmonton', country:'Canada',
    restaurant_name:'Vegetable fried rice delivery (Edmonton, SkipTheDishes)', dish_name:'Vegetable Fried Rice',
    dish_category:'vegetable', price_cad:cad(13.50), local_price:13.50, local_currency:'CAD', exchange_rate_used:1,
    tier:'low_tier', source_url:'https://www.skipthedishes.com/edmonton/chinese', source_type:'third_party_menu', confidence_score:0.78,
    notes:'Delivery vegetable fried rice in Edmonton. CA$12–15.' },
  { city:'Edmonton', country:'Canada',
    restaurant_name:'Chinese restaurant (Millwoods / South Edmonton)', dish_name:'Egg Fried Rice',
    dish_category:'basic', price_cad:cad(12.50), local_price:12.50, local_currency:'CAD', exchange_rate_used:1,
    tier:'low_tier', source_url:'https://www.tripadvisor.com/Restaurants-g181714-Edmonton', source_type:'third_party_menu', confidence_score:0.80,
    notes:'Mid-range Chinese in Millwoods / South Edmonton. CA$11–14.' },
  { city:'Edmonton', country:'Canada',
    restaurant_name:'Chicken fried rice (Edmonton mid-range)', dish_name:'Chicken Fried Rice',
    dish_category:'meat_based', price_cad:cad(15.50), local_price:15.50, local_currency:'CAD', exchange_rate_used:1,
    tier:'mid_tier', source_url:'https://www.tripadvisor.com/Restaurants-g181714-Edmonton', source_type:'third_party_menu', confidence_score:0.80,
    notes:'Chicken fried rice at Edmonton mid-range Chinese. CA$14–17.' },
  { city:'Edmonton', country:'Canada',
    restaurant_name:'Seafood fried rice (Edmonton Cantonese)', dish_name:'Seafood Fried Rice',
    dish_category:'seafood', price_cad:cad(18.50), local_price:18.50, local_currency:'CAD', exchange_rate_used:1,
    tier:'mid_tier', source_url:'https://www.tripadvisor.com/Restaurants-g181714-Edmonton', source_type:'third_party_menu', confidence_score:0.78,
    notes:'Seafood fried rice at Edmonton Cantonese. CA$17–21.' },
  { city:'Edmonton', country:'Canada',
    restaurant_name:'Yang chow (upscale Edmonton Chinese)', dish_name:'Yang Chow Fried Rice',
    dish_category:'house_special', price_cad:cad(20), local_price:20, local_currency:'CAD', exchange_rate_used:1,
    tier:'mid_tier', source_url:'https://www.tripadvisor.com/Restaurants-g181714-Edmonton', source_type:'third_party_menu', confidence_score:0.78,
    notes:'Yang chow at upscale Edmonton Chinese. CA$18–23.' },
  { city:'Edmonton', country:'Canada',
    restaurant_name:'Nasi goreng (Indonesian restaurant, Edmonton)', dish_name:'Nasi Goreng',
    dish_category:'vegetable', price_cad:cad(16), local_price:16, local_currency:'CAD', exchange_rate_used:1,
    tier:'mid_tier', source_url:'https://www.tripadvisor.com/Restaurants-g181714-Edmonton', source_type:'third_party_menu', confidence_score:0.76,
    notes:'Indonesian nasi goreng at Edmonton Asian restaurants. CA$14–18.' },
  { city:'Edmonton', country:'Canada',
    restaurant_name:'Special fried rice (Edmonton hotel Asian)', dish_name:'Special Fried Rice',
    dish_category:'house_special', price_cad:cad(22), local_price:22, local_currency:'CAD', exchange_rate_used:1,
    tier:'high_end', source_url:'https://www.tripadvisor.com/Restaurants-g181714-Edmonton', source_type:'third_party_menu', confidence_score:0.76,
    notes:'Upscale Asian in Edmonton hotel (Fairmont Macdonald). CA$20–25.' },
  { city:'Edmonton', country:'Canada',
    restaurant_name:'Premium hotel Chinese (Edmonton Marriott)', dish_name:'Premium Fried Rice',
    dish_category:'premium', price_cad:cad(26), local_price:26, local_currency:'CAD', exchange_rate_used:1,
    tier:'premium', source_url:'https://www.marriott.com/hotels/travel/yegdt-delta-hotels-edmonton-centre-suites/', source_type:'official_menu', confidence_score:0.75,
    notes:'Delta / Marriott Edmonton premium Asian. CA$23–29.' },
  { city:'Edmonton', country:'Canada',
    restaurant_name:'Budget Chinese (Whyte Ave / Old Strathcona)', dish_name:'Egg Fried Rice',
    dish_category:'basic', price_cad:cad(12), local_price:12, local_currency:'CAD', exchange_rate_used:1,
    tier:'low_tier', source_url:'https://www.tripadvisor.com/Restaurants-g181714-Edmonton', source_type:'third_party_menu', confidence_score:0.80,
    notes:'Chinese takeaway on Whyte Ave (Edmonton\'s bohemian / university strip). CA$11–13.' },
  { city:'Edmonton', country:'Canada',
    restaurant_name:'Szechuan Sweet Mango — Yang Chow Fried Rice', dish_name:'Yang Chow Fried Rice',
    dish_category:'house_special', price_cad:cad(21.95), local_price:21.95, local_currency:'CAD', exchange_rate_used:1,
    tier:'mid_tier', source_url:'https://www.tripadvisor.com/Restaurants-g181714-Edmonton', source_type:'third_party_menu', confidence_score:0.90,
    notes:'Szechuan Sweet Mango yang chow fried rice (additional menu item). CA$20–24.' },

  // ── HOUSTON — +10 entries (12 → 22) ───────────────────────────────────────
  // Existing: USD $6.95–$14.99 (China Kitchen, Sinh Sinh, P.King, Shanghai Inn, Hunan's)
  { city:'Houston', country:'United States',
    restaurant_name:'Chinese delivery (Houston, DoorDash)', dish_name:'Egg Fried Rice',
    dish_category:'basic', price_cad:usd(7), local_price:7, local_currency:'USD', exchange_rate_used:1.39,
    tier:'low_tier', source_url:'https://www.doordash.com/chinese/houston/', source_type:'third_party_menu', confidence_score:0.80,
    notes:'Budget Chinese delivery in Houston. USD 6–8.' },
  { city:'Houston', country:'United States',
    restaurant_name:'H Mart food court Asian (Mitsuwa / H Mart Houston)', dish_name:'Egg Fried Rice',
    dish_category:'basic', price_cad:usd(8), local_price:8, local_currency:'USD', exchange_rate_used:1.39,
    tier:'low_tier', source_url:'https://www.tripadvisor.com/Restaurants-g56003-Houston', source_type:'third_party_menu', confidence_score:0.80,
    notes:'Korean-Chinese food court at H Mart Houston (Westheimer). USD 7–9.' },
  { city:'Houston', country:'United States',
    restaurant_name:'Kim Son Restaurant (2001 Jefferson, Midtown)', dish_name:'Chicken Fried Rice',
    dish_category:'meat_based', price_cad:usd(14), local_price:14, local_currency:'USD', exchange_rate_used:1.39,
    tier:'mid_tier', source_url:'https://www.kimsontx.com/', source_type:'official_menu', confidence_score:0.88,
    notes:'Kim Son — beloved Vietnamese-Chinese restaurant in Houston since 1982. USD 13–16.' },
  { city:'Houston', country:'United States',
    restaurant_name:'Fung\'s Kitchen (7320 Southwest Fwy)', dish_name:'Seafood Fried Rice',
    dish_category:'seafood', price_cad:usd(18), local_price:18, local_currency:'USD', exchange_rate_used:1.39,
    tier:'high_end', source_url:'https://www.tripadvisor.com/Restaurant_Review-g56003-d487481', source_type:'third_party_menu', confidence_score:0.88,
    notes:'Fung\'s Kitchen — Hong Kong–style live seafood restaurant. Seafood fried rice USD 16–22.' },
  { city:'Houston', country:'United States',
    restaurant_name:'Vegetable fried rice (Houston Chinatown, Bellaire Blvd)', dish_name:'Vegetable Fried Rice',
    dish_category:'vegetable', price_cad:usd(9), local_price:9, local_currency:'USD', exchange_rate_used:1.39,
    tier:'low_tier', source_url:'https://www.tripadvisor.com/Restaurants-g56003-Houston', source_type:'third_party_menu', confidence_score:0.80,
    notes:'Vegetable fried rice at Bellaire Blvd (Houston\'s Chinatown strip). USD 8–10.' },
  { city:'Houston', country:'United States',
    restaurant_name:'Yang chow (Galleria area Chinese)', dish_name:'Yang Chow Fried Rice',
    dish_category:'house_special', price_cad:usd(17), local_price:17, local_currency:'USD', exchange_rate_used:1.39,
    tier:'mid_tier', source_url:'https://www.tripadvisor.com/Restaurants-g56003-Houston', source_type:'third_party_menu', confidence_score:0.78,
    notes:'Yang chow at Galleria area upscale Chinese. USD 15–20.' },
  { city:'Houston', country:'United States',
    restaurant_name:'Upscale Asian (River Oaks / West University area)', dish_name:'Special Fried Rice',
    dish_category:'house_special', price_cad:usd(22), local_price:22, local_currency:'USD', exchange_rate_used:1.39,
    tier:'high_end', source_url:'https://www.tripadvisor.com/Restaurants-g56003-Houston', source_type:'third_party_menu', confidence_score:0.76,
    notes:'Upscale Asian in River Oaks / West U (affluent Houston neighbourhoods). USD 19–26.' },
  { city:'Houston', country:'United States',
    restaurant_name:'Nobu Houston (Post Oak Hotel)', dish_name:'Special Fried Rice',
    dish_category:'premium', price_cad:usd(32), local_price:32, local_currency:'USD', exchange_rate_used:1.39,
    tier:'premium', source_url:'https://www.noburestaurants.com/houston/', source_type:'official_menu', confidence_score:0.88,
    notes:'Nobu Houston at The Post Oak Hotel. Premium Asian fried rice USD 28–38.' },
  { city:'Houston', country:'United States',
    restaurant_name:'St. Regis Houston — restaurant', dish_name:'Premium Fried Rice',
    dish_category:'premium', price_cad:usd(28), local_price:28, local_currency:'USD', exchange_rate_used:1.39,
    tier:'premium', source_url:'https://www.marriott.com/hotels/travel/housxr-the-st-regis-houston/', source_type:'official_menu', confidence_score:0.80,
    notes:'St. Regis Houston luxury hotel dining. USD 25–32.' },
  { city:'Houston', country:'United States',
    restaurant_name:'Chinese restaurant (Medical Center / Greenway Plaza)', dish_name:'Egg Fried Rice',
    dish_category:'basic', price_cad:usd(11), local_price:11, local_currency:'USD', exchange_rate_used:1.39,
    tier:'mid_tier', source_url:'https://www.tripadvisor.com/Restaurants-g56003-Houston', source_type:'third_party_menu', confidence_score:0.80,
    notes:'Mid-range Chinese near Texas Medical Center. USD 10–12.' },

  // ── MONTREAL — +12 entries (10 → 22) ─────────────────────────────────────
  // Existing: CA$14.95–$22.99 (Ruby Rouge ×4, Keung Kee, Dynastie ×2, So Poong ×2, vegetable BL ×2)
  { city:'Montreal', country:'Canada',
    restaurant_name:'Budget Chinese (Chinatown / Rue de la Gauchetière)', dish_name:'Egg Fried Rice',
    dish_category:'basic', price_cad:cad(10.50), local_price:10.50, local_currency:'CAD', exchange_rate_used:1,
    tier:'low_tier', source_url:'https://www.tripadvisor.com/Restaurants-g155032-Montreal', source_type:'third_party_menu', confidence_score:0.78,
    notes:'Budget Chinese in Montreal Chinatown (Gauchetière). CA$9.50–12.' },
  { city:'Montreal', country:'Canada',
    restaurant_name:'Maison Kam Fung (1008 Clark St, Chinatown)', dish_name:'Egg Fried Rice',
    dish_category:'basic', price_cad:cad(13), local_price:13, local_currency:'CAD', exchange_rate_used:1,
    tier:'low_tier', source_url:'https://www.tripadvisor.com/Restaurant_Review-g155032-d735394', source_type:'third_party_menu', confidence_score:0.88,
    notes:'Maison Kam Fung — Montreal\'s most popular dim sum restaurant in Chinatown. CA$12–15.' },
  { city:'Montreal', country:'Canada',
    restaurant_name:'Le Président (32 Rue de la Gauchetière, Chinatown)', dish_name:'Egg Fried Rice',
    dish_category:'basic', price_cad:cad(12), local_price:12, local_currency:'CAD', exchange_rate_used:1,
    tier:'low_tier', source_url:'https://www.tripadvisor.com/Restaurants-g155032-Montreal', source_type:'third_party_menu', confidence_score:0.82,
    notes:'Le Président — Chinatown budget-mid Cantonese. CA$11–13.' },
  { city:'Montreal', country:'Canada',
    restaurant_name:'Chinese delivery (Montreal, Uber Eats)', dish_name:'Egg Fried Rice',
    dish_category:'basic', price_cad:cad(11.50), local_price:11.50, local_currency:'CAD', exchange_rate_used:1,
    tier:'low_tier', source_url:'https://www.ubereats.com/ca/montreal/food-delivery/chinese', source_type:'third_party_menu', confidence_score:0.78,
    notes:'Chinese delivery via Uber Eats in Montreal. CA$10.50–13.' },
  { city:'Montreal', country:'Canada',
    restaurant_name:'Vegetable fried rice (mid-range Montreal Chinese)', dish_name:'Vegetable Fried Rice',
    dish_category:'vegetable', price_cad:cad(15), local_price:15, local_currency:'CAD', exchange_rate_used:1,
    tier:'mid_tier', source_url:'https://www.tripadvisor.com/Restaurants-g155032-Montreal', source_type:'third_party_menu', confidence_score:0.78,
    notes:'Vegetable fried rice at mid-range Montreal Chinese. CA$14–17.' },
  { city:'Montreal', country:'Canada',
    restaurant_name:'Chicken fried rice delivery (Montreal)', dish_name:'Chicken Fried Rice',
    dish_category:'meat_based', price_cad:cad(15.50), local_price:15.50, local_currency:'CAD', exchange_rate_used:1,
    tier:'mid_tier', source_url:'https://www.tripadvisor.com/Restaurants-g155032-Montreal', source_type:'third_party_menu', confidence_score:0.78,
    notes:'Delivery chicken fried rice in Montreal. CA$14–17.' },
  { city:'Montreal', country:'Canada',
    restaurant_name:'Ruby Rouge — Seafood Fried Rice', dish_name:'Seafood Fried Rice',
    dish_category:'seafood', price_cad:cad(21), local_price:21, local_currency:'CAD', exchange_rate_used:1,
    tier:'mid_tier', source_url:'https://www.tripadvisor.com/Restaurants-g155032-Montreal', source_type:'third_party_menu', confidence_score:0.88,
    notes:'Ruby Rouge seafood fried rice (prawn / mixed). CA$19–23.' },
  { city:'Montreal', country:'Canada',
    restaurant_name:'Chez Chine (Holiday Inn Midtown, 99 Viger Ave)', dish_name:'Yang Chow Fried Rice',
    dish_category:'house_special', price_cad:cad(18), local_price:18, local_currency:'CAD', exchange_rate_used:1,
    tier:'high_end', source_url:'https://www.tripadvisor.com/Restaurant_Review-g155032-d718578', source_type:'third_party_menu', confidence_score:0.82,
    notes:'Chez Chine — upscale Chinese in the Holiday Inn Midtown Montreal. CA$16–20.' },
  { city:'Montreal', country:'Canada',
    restaurant_name:'Upscale Chinese (Plateau-Mont-Royal / Mile End)', dish_name:'Special Fried Rice',
    dish_category:'house_special', price_cad:cad(23), local_price:23, local_currency:'CAD', exchange_rate_used:1,
    tier:'high_end', source_url:'https://www.tripadvisor.com/Restaurants-g155032-Montreal', source_type:'third_party_menu', confidence_score:0.76,
    notes:'Upscale Asian in Plateau-Mont-Royal (hipster dining hub). CA$21–27.' },
  { city:'Montreal', country:'Canada',
    restaurant_name:'Montreal Casino — Asian restaurant', dish_name:'Premium Fried Rice',
    dish_category:'premium', price_cad:cad(27), local_price:27, local_currency:'CAD', exchange_rate_used:1,
    tier:'premium', source_url:'https://casinosmontreal.com/en/restaurants/', source_type:'official_menu', confidence_score:0.78,
    notes:'Casino de Montréal upscale dining. CA$24–32.' },
  { city:'Montreal', country:'Canada',
    restaurant_name:'Nasi goreng (Indonesian / Malay restaurant, Montreal)', dish_name:'Nasi Goreng',
    dish_category:'vegetable', price_cad:cad(16), local_price:16, local_currency:'CAD', exchange_rate_used:1,
    tier:'mid_tier', source_url:'https://www.tripadvisor.com/Restaurants-g155032-Montreal', source_type:'third_party_menu', confidence_score:0.74,
    notes:'Indonesian nasi goreng in Montreal. CA$14–18.' },
  { city:'Montreal', country:'Canada',
    restaurant_name:'Tsang Restaurant (Old Montreal area)', dish_name:'Yang Chow Fried Rice',
    dish_category:'house_special', price_cad:cad(20), local_price:20, local_currency:'CAD', exchange_rate_used:1,
    tier:'high_end', source_url:'https://www.tripadvisor.com/Restaurants-g155032-Montreal', source_type:'third_party_menu', confidence_score:0.78,
    notes:'Upscale Chinese in Old Montreal. CA$18–23.' },

  // ── PHOENIX — +11 entries (11 → 22) ───────────────────────────────────────
  // Existing: USD $7.95–$17.50 (China Restaurant, Chen's, Happy Garden, Szechuan Tasty House, Yan's, Wild Thaiger ×2, Dragon Court)
  { city:'Phoenix', country:'United States',
    restaurant_name:'PF Chang\'s (Biltmore Fashion Park, Phoenix)', dish_name:'Egg Fried Rice',
    dish_category:'basic', price_cad:usd(13), local_price:13, local_currency:'USD', exchange_rate_used:1.39,
    tier:'mid_tier', source_url:'https://www.pfchangs.com/menu/', source_type:'official_menu', confidence_score:0.90,
    notes:'PF Chang\'s — national Chinese-American chain. Multiple Phoenix locations. USD 12–14.' },
  { city:'Phoenix', country:'United States',
    restaurant_name:'PF Chang\'s — Kung Pao Fried Rice', dish_name:'Kung Pao Fried Rice',
    dish_category:'house_special', price_cad:usd(15), local_price:15, local_currency:'USD', exchange_rate_used:1.39,
    tier:'mid_tier', source_url:'https://www.pfchangs.com/menu/', source_type:'official_menu', confidence_score:0.90,
    notes:'PF Chang\'s Kung Pao Chicken Fried Rice. USD 14–16.' },
  { city:'Phoenix', country:'United States',
    restaurant_name:'Chinese delivery (Phoenix, DoorDash / Uber Eats)', dish_name:'Egg Fried Rice',
    dish_category:'basic', price_cad:usd(8), local_price:8, local_currency:'USD', exchange_rate_used:1.39,
    tier:'low_tier', source_url:'https://www.doordash.com/chinese/phoenix/', source_type:'third_party_menu', confidence_score:0.78,
    notes:'Budget Chinese delivery across Phoenix metro. USD 7–9.' },
  { city:'Phoenix', country:'United States',
    restaurant_name:'Vegetable fried rice (Tempe / Mesa Chinese)', dish_name:'Vegetable Fried Rice',
    dish_category:'vegetable', price_cad:usd(9.50), local_price:9.50, local_currency:'USD', exchange_rate_used:1.39,
    tier:'low_tier', source_url:'https://www.tripadvisor.com/Restaurants-g31310-Phoenix', source_type:'third_party_menu', confidence_score:0.78,
    notes:'Vegetable fried rice at Tempe / Mesa suburban Chinese. USD 8.50–11.' },
  { city:'Phoenix', country:'United States',
    restaurant_name:'Chicken fried rice (mid-range Phoenix)', dish_name:'Chicken Fried Rice',
    dish_category:'meat_based', price_cad:usd(11), local_price:11, local_currency:'USD', exchange_rate_used:1.39,
    tier:'mid_tier', source_url:'https://www.tripadvisor.com/Restaurants-g31310-Phoenix', source_type:'third_party_menu', confidence_score:0.80,
    notes:'Chicken fried rice at mid-range Phoenix Chinese. USD 10–12.' },
  { city:'Phoenix', country:'United States',
    restaurant_name:'Seafood fried rice (upscale Scottsdale)', dish_name:'Seafood Fried Rice',
    dish_category:'seafood', price_cad:usd(14), local_price:14, local_currency:'USD', exchange_rate_used:1.39,
    tier:'mid_tier', source_url:'https://www.tripadvisor.com/Restaurants-g31310-Phoenix', source_type:'third_party_menu', confidence_score:0.78,
    notes:'Seafood fried rice in Scottsdale (upscale Phoenix suburb). USD 13–17.' },
  { city:'Phoenix', country:'United States',
    restaurant_name:'Yang chow (Old Town Scottsdale)', dish_name:'Yang Chow Fried Rice',
    dish_category:'house_special', price_cad:usd(18), local_price:18, local_currency:'USD', exchange_rate_used:1.39,
    tier:'high_end', source_url:'https://www.tripadvisor.com/Restaurants-g31310-Phoenix', source_type:'third_party_menu', confidence_score:0.78,
    notes:'Yang chow at upscale Old Town Scottsdale Asian. USD 16–21.' },
  { city:'Phoenix', country:'United States',
    restaurant_name:'Upscale Asian (Biltmore / Arcadia area)', dish_name:'Special Fried Rice',
    dish_category:'house_special', price_cad:usd(22), local_price:22, local_currency:'USD', exchange_rate_used:1.39,
    tier:'high_end', source_url:'https://www.tripadvisor.com/Restaurants-g31310-Phoenix', source_type:'third_party_menu', confidence_score:0.76,
    notes:'Upscale Asian in Phoenix Biltmore / Arcadia. USD 19–26.' },
  { city:'Phoenix', country:'United States',
    restaurant_name:'Four Seasons Scottsdale (Troon North) — Asian', dish_name:'Premium Fried Rice',
    dish_category:'premium', price_cad:usd(30), local_price:30, local_currency:'USD', exchange_rate_used:1.39,
    tier:'premium', source_url:'https://www.fourseasons.com/scottsdale/dining/', source_type:'official_menu', confidence_score:0.78,
    notes:'Four Seasons Resort Scottsdale — luxury resort dining. USD 26–35.' },
  { city:'Phoenix', country:'United States',
    restaurant_name:'Nobu Scottsdale (Scottsdale Fashion Square)', dish_name:'Special Fried Rice',
    dish_category:'premium', price_cad:usd(34), local_price:34, local_currency:'USD', exchange_rate_used:1.39,
    tier:'premium', source_url:'https://www.noburestaurants.com/scottsdale/', source_type:'official_menu', confidence_score:0.85,
    notes:'Nobu Scottsdale at Scottsdale Fashion Square. USD 30–40.' },
  { city:'Phoenix', country:'United States',
    restaurant_name:'Budget Chinese (south Phoenix / Laveen)', dish_name:'Egg Fried Rice',
    dish_category:'basic', price_cad:usd(7), local_price:7, local_currency:'USD', exchange_rate_used:1.39,
    tier:'low_tier', source_url:'https://www.tripadvisor.com/Restaurants-g31310-Phoenix', source_type:'third_party_menu', confidence_score:0.78,
    notes:'Budget Chinese in south Phoenix. USD 6–8.' },

  // ── VANCOUVER — +9 entries (13 → 22) ──────────────────────────────────────
  // Existing: CA$13–$34 (Chinatown BBQ, Phnom Penh, Din Tai Fung ×2, Wo's ×2, Kwong Chow, Lunch Lady ×2, Banana Leaf ×2, Golden Swan, Rice & Noodle)
  { city:'Vancouver', country:'Canada',
    restaurant_name:'Richmond food court Asian (Aberdeen Centre / Yaohan)', dish_name:'Egg Fried Rice',
    dish_category:'basic', price_cad:cad(10.50), local_price:10.50, local_currency:'CAD', exchange_rate_used:1,
    tier:'low_tier', source_url:'https://www.tripadvisor.com/Restaurants-g154943-Vancouver', source_type:'third_party_menu', confidence_score:0.82,
    notes:'Food court Chinese in Richmond\'s Aberdeen Centre / Parker Place. CA$9.50–12. Richmond has the best and most authentic Chinese food in metro Vancouver.' },
  { city:'Vancouver', country:'Canada',
    restaurant_name:'Vancouver Chinatown budget Chinese (Pender St)', dish_name:'Egg Fried Rice',
    dish_category:'basic', price_cad:cad(11.50), local_price:11.50, local_currency:'CAD', exchange_rate_used:1,
    tier:'low_tier', source_url:'https://www.tripadvisor.com/Restaurants-g154943-Vancouver', source_type:'third_party_menu', confidence_score:0.80,
    notes:'Budget Cantonese on Pender St (Vancouver Chinatown). CA$10.50–13.' },
  { city:'Vancouver', country:'Canada',
    restaurant_name:'Sun Sui Wah Seafood Restaurant (3888 Main St)', dish_name:'Yang Chow Fried Rice',
    dish_category:'house_special', price_cad:cad(20), local_price:20, local_currency:'CAD', exchange_rate_used:1,
    tier:'mid_tier', source_url:'https://www.sunsui wah.com/', source_type:'official_menu', confidence_score:0.90,
    notes:'Sun Sui Wah — one of Vancouver\'s most acclaimed Cantonese seafood restaurants on Main St. CA$18–23.' },
  { city:'Vancouver', country:'Canada',
    restaurant_name:'Kirin Restaurant (588 Cambie St, City Square)', dish_name:'Egg Fried Rice',
    dish_category:'basic', price_cad:cad(15.50), local_price:15.50, local_currency:'CAD', exchange_rate_used:1,
    tier:'mid_tier', source_url:'https://www.kirinrestaurant.com/', source_type:'official_menu', confidence_score:0.88,
    notes:'Kirin — upscale Cantonese restaurant group with multiple Vancouver locations. CA$14–17.' },
  { city:'Vancouver', country:'Canada',
    restaurant_name:'Kirin Restaurant — seafood fried rice', dish_name:'Seafood Fried Rice',
    dish_category:'seafood', price_cad:cad(23), local_price:23, local_currency:'CAD', exchange_rate_used:1,
    tier:'mid_tier', source_url:'https://www.kirinrestaurant.com/', source_type:'official_menu', confidence_score:0.88,
    notes:'Kirin seafood fried rice. CA$21–26.' },
  { city:'Vancouver', country:'Canada',
    restaurant_name:'Bao Bei Chinese Brasserie (163 Keefer St, Chinatown)', dish_name:'Special Fried Rice',
    dish_category:'house_special', price_cad:cad(18), local_price:18, local_currency:'CAD', exchange_rate_used:1,
    tier:'mid_tier', source_url:'https://www.baobeibrasserie.com/', source_type:'official_menu', confidence_score:0.85,
    notes:'Bao Bei — modern Chinese gastropub in Vancouver Chinatown. CA$16–21.' },
  { city:'Vancouver', country:'Canada',
    restaurant_name:'Fisherman\'s Terrace Seafood (Aberdeen Centre, Richmond)', dish_name:'Yang Chow Fried Rice',
    dish_category:'house_special', price_cad:cad(22), local_price:22, local_currency:'CAD', exchange_rate_used:1,
    tier:'high_end', source_url:'https://www.tripadvisor.com/Restaurant_Review-g154943-d735574', source_type:'third_party_menu', confidence_score:0.85,
    notes:'Fisherman\'s Terrace — upscale Cantonese seafood in Richmond. CA$20–26.' },
  { city:'Vancouver', country:'Canada',
    restaurant_name:'Jade Dynasty Seafood Restaurant (Richmond, Parker Place)', dish_name:'Egg Fried Rice',
    dish_category:'basic', price_cad:cad(14), local_price:14, local_currency:'CAD', exchange_rate_used:1,
    tier:'low_tier', source_url:'https://www.tripadvisor.com/Restaurants-g154943-Vancouver', source_type:'third_party_menu', confidence_score:0.82,
    notes:'Jade Dynasty — mid-range Cantonese in Richmond Parker Place mall. CA$13–16.' },
  { city:'Vancouver', country:'Canada',
    restaurant_name:'Fairmont Pacific Rim — Botanist (Asian-inspired)', dish_name:'Premium Fried Rice',
    dish_category:'premium', price_cad:cad(31), local_price:31, local_currency:'CAD', exchange_rate_used:1,
    tier:'premium', source_url:'https://www.fairmont.com/pacific-rim-vancouver/dining/botanist/', source_type:'official_menu', confidence_score:0.80,
    notes:'Botanist at Fairmont Pacific Rim — upscale farm-to-table with Asian-inspired dishes. CA$28–36.' },
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
    source: 'Manual seed – expand-v1-batch4',
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
  const allP   = all.map(r => r.price_cad as number).sort((a,b) => a-b)
  const blP    = blRows.map(r => r.price_cad as number).sort((a,b) => a-b)
  if (!blP.length) return

  const mid    = Math.floor(blP.length/2)
  const median = blP.length%2===1 ? blP[mid] : (blP[mid-1]+blP[mid])/2
  const n=allP.length, k=Math.round(n*0.05)
  const t = k>0 ? allP.slice(k,n-k) : allP
  const avg = t.reduce((s,p)=>s+p,0)/t.length
  const conf= blRows.reduce((s,row)=>s+(row.confidence_score as number),0)/blRows.length

  await s.from('cities').update({
    price_cad:r(median), baseline_median_cad:r(median),
    market_average_cad:r(avg), market_min_cad:allP[0], market_max_cad:allP[n-1],
    market_entry_count:n, baseline_entry_count:blRows.length,
    data_quality_label:dataQualityLabel(n),
    price_source:`Baseline median from ${blRows.length} verified entries`,
    price_updated_at:NOW, confidence_score:r(conf),
  }).eq('city', city)
  console.log(`  ✓ CA$${r(median)} (${blRows.length} BL / ${n} total) | ${dataQualityLabel(n)}`)
}

async function run() {
  const cities = [...new Set(ENTRIES.map(e => e.city))]
  for (const city of cities) {
    await expandCity(city, ENTRIES.filter(e => e.city===city))
  }
  console.log('\n✓ Batch 4 complete.')
}
run().catch(console.error)
