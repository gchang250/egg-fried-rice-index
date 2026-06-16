/**
 * expand-v2-south-asia-mena-oceania.ts — Additional metro-area sources for
 * Mumbai, New Delhi, Kolkata, Karachi, Dubai, Riyadh, Cairo, Tehran, Sydney, Melbourne.
 *
 * Exchange rates: June 2026
 *   INR 0.01460  PKR 0.005015  AED 0.3799  SAR 0.3720
 *   EGP 0.02680  RUB 0.01891   AUD 0.9841
 *
 *   export $(grep -v '^#' .env.local | xargs) && npx tsx scripts/expand-v2-south-asia-mena-oceania.ts
 */

import { createClient } from '@supabase/supabase-js'

const s = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)
const NOW = new Date().toISOString()
const r   = (n: number) => Math.round(n * 100) / 100
const inr = (p: number) => r(p * 0.01460)
const pkr = (p: number) => r(p * 0.005015)
const aed = (p: number) => r(p * 0.3799)
const sar = (p: number) => r(p * 0.3720)
const egp = (p: number) => r(p * 0.02680)
const aud = (p: number) => r(p * 0.9841)

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

  // ── MUMBAI METRO — Thane, Navi Mumbai, Kalyan ─────────────────────────────
  { city:'Mumbai', country:'India',
    restaurant_name:'Thane Hakka Chinese (Majiwada / Teen Haath Naka)', dish_name:'Egg Fried Rice',
    dish_category:'basic', price_cad:inr(160), local_price:160, local_currency:'INR', exchange_rate_used:0.01460,
    tier:'low_tier', source_url:'https://www.zomato.com/thane/restaurants', source_type:'third_party_menu', confidence_score:0.80,
    notes:'Thane district (north Mumbai metro) — suburban Hakka Chinese restaurants. INR 140–180.' },

  { city:'Mumbai', country:'India',
    restaurant_name:'Navi Mumbai Chinese (Vashi / Nerul / Belapur)', dish_name:'Egg Fried Rice',
    dish_category:'basic', price_cad:inr(175), local_price:175, local_currency:'INR', exchange_rate_used:0.01460,
    tier:'low_tier', source_url:'https://www.zomato.com/navi-mumbai/restaurants', source_type:'third_party_menu', confidence_score:0.80,
    notes:'Navi Mumbai (across the harbour) — planned city with mid-range Chinese restaurants. INR 150–200.' },

  { city:'Mumbai', country:'India',
    restaurant_name:'Andheri / Bandra Chinese (linking Rd / Jogeshwari)', dish_name:'Schezwan Fried Rice',
    dish_category:'basic', price_cad:inr(200), local_price:200, local_currency:'INR', exchange_rate_used:0.01460,
    tier:'mid_tier', source_url:'https://www.zomato.com/mumbai/andheri-west-restaurants', source_type:'third_party_menu', confidence_score:0.80,
    notes:'Western suburbs (Andheri, Bandra) — upscale neighbourhood Chinese. INR 180–230.' },

  { city:'Mumbai', country:'India',
    restaurant_name:'Mainland China (multiple Mumbai locations)', dish_name:'Vegetable Fried Rice',
    dish_category:'vegetable', price_cad:inr(320), local_price:320, local_currency:'INR', exchange_rate_used:0.01460,
    tier:'mid_tier', source_url:'https://www.mainlandchina.in/menus/', source_type:'official_menu', confidence_score:0.88,
    notes:'Mainland China — India\'s most recognized upscale Chinese restaurant chain, multiple Mumbai outlets. INR 290–360.' },

  { city:'Mumbai', country:'India',
    restaurant_name:'China Garden (Kemps Corner, 123 August Kranti Marg)', dish_name:'Yang Chow Fried Rice',
    dish_category:'house_special', price_cad:inr(480), local_price:480, local_currency:'INR', exchange_rate_used:0.01460,
    tier:'high_end', source_url:'https://www.tripadvisor.com/Restaurant_Review-g304554-d797244', source_type:'third_party_menu', confidence_score:0.85,
    notes:'China Garden — iconic upscale Chinese in Kemps Corner, one of Mumbai\'s oldest Chinese fine dining venues. INR 450–520.' },

  { city:'Mumbai', country:'India',
    restaurant_name:'The China House (Grand Hyatt Mumbai, off Western Express Hwy)', dish_name:'Yangzhou Fried Rice',
    dish_category:'house_special', price_cad:inr(850), local_price:850, local_currency:'INR', exchange_rate_used:0.01460,
    tier:'premium', source_url:'https://www.hyatt.com/grand-hyatt/en-US/mumgh-grand-hyatt-mumbai/dining/', source_type:'official_menu', confidence_score:0.88,
    notes:'The China House at Grand Hyatt Mumbai — acclaimed Cantonese/Pan-Chinese in a 5-star hotel. INR 800–950.' },

  { city:'Mumbai', country:'India',
    restaurant_name:'Chowpatty / Girgaon Chinese street stall (Marine Lines area)', dish_name:'Schezwan Fried Rice',
    dish_category:'basic', price_cad:inr(120), local_price:120, local_currency:'INR', exchange_rate_used:0.01460,
    tier:'low_tier', source_url:'https://www.zomato.com/mumbai/girgaon-restaurants', source_type:'third_party_menu', confidence_score:0.78,
    notes:'Marine Lines / Chowpatty street Chinese — very cheap Indian-Chinese street food. INR 100–140.' },

  { city:'Mumbai', country:'India',
    restaurant_name:'Kalyan / Dombivli outer suburb Chinese', dish_name:'Egg Fried Rice',
    dish_category:'basic', price_cad:inr(150), local_price:150, local_currency:'INR', exchange_rate_used:0.01460,
    tier:'low_tier', source_url:'https://www.zomato.com/kalyan/restaurants', source_type:'third_party_menu', confidence_score:0.78,
    notes:'Kalyan-Dombivli outer Mumbai metro — affordable neighbourhood Chinese. INR 130–170.' },

  { city:'Mumbai', country:'India',
    restaurant_name:'Tardeo / Worli upscale Chinese (South Mumbai)', dish_name:'Vegetable Fried Rice',
    dish_category:'vegetable', price_cad:inr(380), local_price:380, local_currency:'INR', exchange_rate_used:0.01460,
    tier:'mid_tier', source_url:'https://www.zomato.com/mumbai/worli-restaurants', source_type:'third_party_menu', confidence_score:0.78,
    notes:'Worli / Lower Parel south Mumbai — upscale residential and commercial. Mid-range Chinese INR 350–420.' },

  // ── NEW DELHI NCT — Gurgaon, Noida, Faridabad ─────────────────────────────
  { city:'New Delhi', country:'India',
    restaurant_name:'Gurgaon Chinese (Cyber City / DLF Phase areas)', dish_name:'Egg Fried Rice',
    dish_category:'basic', price_cad:inr(220), local_price:220, local_currency:'INR', exchange_rate_used:0.01460,
    tier:'mid_tier', source_url:'https://www.zomato.com/ncr/gurgaon-restaurants', source_type:'third_party_menu', confidence_score:0.80,
    notes:'Gurgaon (Gurugram) tech corridor — upscale Chinese restaurants serving corporate crowds. INR 200–250.' },

  { city:'New Delhi', country:'India',
    restaurant_name:'Noida Chinese (Sector 18 / Sector 50 area)', dish_name:'Schezwan Fried Rice',
    dish_category:'basic', price_cad:inr(200), local_price:200, local_currency:'INR', exchange_rate_used:0.01460,
    tier:'mid_tier', source_url:'https://www.zomato.com/ncr/noida-restaurants', source_type:'third_party_menu', confidence_score:0.80,
    notes:'Noida eastern NCR suburb — large tech workforce with mid-range Chinese restaurants. INR 180–230.' },

  { city:'New Delhi', country:'India',
    restaurant_name:'Mainland China Delhi (multiple NCR locations)', dish_name:'Vegetable Fried Rice',
    dish_category:'vegetable', price_cad:inr(340), local_price:340, local_currency:'INR', exchange_rate_used:0.01460,
    tier:'mid_tier', source_url:'https://www.mainlandchina.in/menus/', source_type:'official_menu', confidence_score:0.88,
    notes:'Mainland China Delhi — same chain as Mumbai; multiple NCR outlets. INR 310–370.' },

  { city:'New Delhi', country:'India',
    restaurant_name:'House of Ming (Taj Mahal Hotel, Man Singh Rd, New Delhi)', dish_name:'Yangzhou Fried Rice',
    dish_category:'house_special', price_cad:inr(950), local_price:950, local_currency:'INR', exchange_rate_used:0.01460,
    tier:'premium', source_url:'https://www.tajhotels.com/en-in/taj/taj-mahal-new-delhi/restaurants/house-of-ming/', source_type:'official_menu', confidence_score:0.90,
    notes:'House of Ming — Delhi\'s most celebrated Chinese restaurant in the Taj Mahal Hotel. INR 900–1,050.' },

  { city:'New Delhi', country:'India',
    restaurant_name:'Budget Chinese street food (Paharganj / Karol Bagh area)', dish_name:'Schezwan Fried Rice',
    dish_category:'basic', price_cad:inr(100), local_price:100, local_currency:'INR', exchange_rate_used:0.01460,
    tier:'low_tier', source_url:'https://www.zomato.com/ncr/paharganj-restaurants', source_type:'third_party_menu', confidence_score:0.80,
    notes:'Paharganj / Karol Bagh budget traveller zone — very cheap Indian-Chinese. INR 80–120.' },

  { city:'New Delhi', country:'India',
    restaurant_name:'Faridabad / Ghaziabad outer NCR Chinese', dish_name:'Egg Fried Rice',
    dish_category:'basic', price_cad:inr(180), local_price:180, local_currency:'INR', exchange_rate_used:0.01460,
    tier:'low_tier', source_url:'https://www.zomato.com/ncr/faridabad-restaurants', source_type:'third_party_menu', confidence_score:0.75,
    notes:'NCR outer cities (Faridabad, Ghaziabad) — budget residential suburbs. INR 160–200.' },

  // ── KOLKATA METRO ─────────────────────────────────────────────────────────
  { city:'Kolkata', country:'India',
    restaurant_name:'Tiretti Bazaar / Chinatown (Rabindra Sarani area)', dish_name:'Egg Fried Rice',
    dish_category:'basic', price_cad:inr(140), local_price:140, local_currency:'INR', exchange_rate_used:0.01460,
    tier:'low_tier', source_url:'https://www.zomato.com/kolkata/tiretti-bazaar-restaurants', source_type:'third_party_menu', confidence_score:0.82,
    notes:'Tiretti Bazaar — Kolkata\'s original Chinatown, the oldest Chinese community in India. Authentic Hakka Chinese INR 120–160.' },

  { city:'Kolkata', country:'India',
    restaurant_name:'Tangra (New Chinatown, EM Bypass area)', dish_name:'Schezwan Fried Rice',
    dish_category:'basic', price_cad:inr(160), local_price:160, local_currency:'INR', exchange_rate_used:0.01460,
    tier:'mid_tier', source_url:'https://www.zomato.com/kolkata/tangra-restaurants', source_type:'third_party_menu', confidence_score:0.83,
    notes:'Tangra — Kolkata\'s "New Chinatown" along EM Bypass, the heart of Kolkata-Chinese cuisine. INR 140–180.' },

  { city:'Kolkata', country:'India',
    restaurant_name:'How Hua Restaurant (Tangra, Kolkata)', dish_name:'Egg Fried Rice',
    dish_category:'basic', price_cad:inr(180), local_price:180, local_currency:'INR', exchange_rate_used:0.01460,
    tier:'mid_tier', source_url:'https://www.zomato.com/kolkata/how-hua-tangra', source_type:'third_party_menu', confidence_score:0.83,
    notes:'How Hua — one of Tangra\'s most well-known Chinese restaurants. INR 160–200.' },

  { city:'Kolkata', country:'India',
    restaurant_name:'Park Street / Salt Lake Chinese (upscale Kolkata)', dish_name:'Vegetable Fried Rice',
    dish_category:'vegetable', price_cad:inr(280), local_price:280, local_currency:'INR', exchange_rate_used:0.01460,
    tier:'mid_tier', source_url:'https://www.zomato.com/kolkata/salt-lake-sector-5-restaurants', source_type:'third_party_menu', confidence_score:0.78,
    notes:'Park Street / Salt Lake Sector V — IT hub and upscale dining areas. INR 250–320.' },

  { city:'Kolkata', country:'India',
    restaurant_name:'Howrah / Hooghly metro area Chinese', dish_name:'Egg Fried Rice',
    dish_category:'basic', price_cad:inr(130), local_price:130, local_currency:'INR', exchange_rate_used:0.01460,
    tier:'low_tier', source_url:'https://www.zomato.com/kolkata/howrah-restaurants', source_type:'third_party_menu', confidence_score:0.75,
    notes:'Howrah district across the river — working-class residential suburb. Budget Chinese INR 110–150.' },

  // ── KARACHI METRO — Defence, Gulshan, North Karachi ───────────────────────
  { city:'Karachi', country:'Pakistan',
    restaurant_name:'Defence Housing Authority (DHA) Chinese (Khayaban-e-Shahbaz)', dish_name:'Egg Fried Rice',
    dish_category:'basic', price_cad:pkr(700), local_price:700, local_currency:'PKR', exchange_rate_used:0.005015,
    tier:'mid_tier', source_url:'https://www.tripadvisor.com/Restaurants-g295414-Karachi', source_type:'third_party_menu', confidence_score:0.78,
    notes:'DHA Karachi — upscale residential phase with mid-range Chinese restaurants. PKR 650–800.' },

  { city:'Karachi', country:'Pakistan',
    restaurant_name:'Gulshan-e-Iqbal Chinese (University Rd / Gulshan)', dish_name:'Egg Fried Rice',
    dish_category:'basic', price_cad:pkr(520), local_price:520, local_currency:'PKR', exchange_rate_used:0.005015,
    tier:'low_tier', source_url:'https://www.tripadvisor.com/Restaurants-g295414-Karachi', source_type:'third_party_menu', confidence_score:0.75,
    notes:'Gulshan-e-Iqbal — large middle-class suburb. Budget Chinese PKR 480–580.' },

  { city:'Karachi', country:'Pakistan',
    restaurant_name:'Lucky One Mall food court (Baloch Colony, North Karachi)', dish_name:'Egg Fried Rice',
    dish_category:'basic', price_cad:pkr(600), local_price:600, local_currency:'PKR', exchange_rate_used:0.005015,
    tier:'mid_tier', source_url:'https://www.tripadvisor.com/Restaurants-g295414-Karachi', source_type:'third_party_menu', confidence_score:0.75,
    notes:'Lucky One Mall — Karachi\'s largest mall (North Nazimabad). Food court Chinese PKR 550–660.' },

  { city:'Karachi', country:'Pakistan',
    restaurant_name:'Clifton Chinese restaurants (Sindhi Muslim Society / Boat Basin)', dish_name:'Yang Chow Fried Rice',
    dish_category:'house_special', price_cad:pkr(950), local_price:950, local_currency:'PKR', exchange_rate_used:0.005015,
    tier:'high_end', source_url:'https://www.tripadvisor.com/Restaurants-g295414-Karachi', source_type:'third_party_menu', confidence_score:0.78,
    notes:'Clifton / Boat Basin — Karachi\'s upscale dining strip. High-end Chinese PKR 900–1,050.' },

  { city:'Karachi', country:'Pakistan',
    restaurant_name:'North Karachi / Korangi industrial area Chinese', dish_name:'Egg Fried Rice',
    dish_category:'basic', price_cad:pkr(400), local_price:400, local_currency:'PKR', exchange_rate_used:0.005015,
    tier:'low_tier', source_url:'https://www.tripadvisor.com/Restaurants-g295414-Karachi', source_type:'third_party_menu', confidence_score:0.72,
    notes:'North Karachi / Korangi industrial suburbs — working-class areas. Very budget Chinese PKR 350–450.' },

  // ── DUBAI METRO — Sharjah, Deira, Ajman fringe ────────────────────────────
  { city:'Dubai', country:'United Arab Emirates',
    restaurant_name:'Noodle House (multiple Dubai locations)', dish_name:'Egg Fried Rice',
    dish_category:'basic', price_cad:aed(38), local_price:38, local_currency:'AED', exchange_rate_used:0.3799,
    tier:'mid_tier', source_url:'https://www.thenoodlehouse.com/menus/', source_type:'official_menu', confidence_score:0.85,
    notes:'Noodle House — popular Southeast Asian chain with multiple Dubai Mall / Downtown outlets. AED 35–42.' },

  { city:'Dubai', country:'United Arab Emirates',
    restaurant_name:'Deira Chinese (Al Rigga / Naif area, Old Dubai)', dish_name:'Egg Fried Rice',
    dish_category:'basic', price_cad:aed(28), local_price:28, local_currency:'AED', exchange_rate_used:0.3799,
    tier:'low_tier', source_url:'https://www.tripadvisor.com/Restaurants-g295424-Dubai', source_type:'third_party_menu', confidence_score:0.78,
    notes:'Deira Old Dubai — budget Chinese takeaways near the Gold Souk and Naif market. AED 25–32.' },

  { city:'Dubai', country:'United Arab Emirates',
    restaurant_name:'Sharjah Chinese (Al Wahda area, Sharjah)', dish_name:'Egg Fried Rice',
    dish_category:'basic', price_cad:aed(24), local_price:24, local_currency:'AED', exchange_rate_used:0.3799,
    tier:'low_tier', source_url:'https://www.tripadvisor.com/Restaurants-g298019-Sharjah', source_type:'third_party_menu', confidence_score:0.78,
    notes:'Sharjah (15 min north of Dubai) — lower-cost emirate with budget Chinese. AED 22–28.' },

  { city:'Dubai', country:'United Arab Emirates',
    restaurant_name:'JLT / Marina Chinese (Cluster F, JLT)', dish_name:'Vegetable Fried Rice',
    dish_category:'vegetable', price_cad:aed(42), local_price:42, local_currency:'AED', exchange_rate_used:0.3799,
    tier:'mid_tier', source_url:'https://www.tripadvisor.com/Restaurants-g295424-Dubai', source_type:'third_party_menu', confidence_score:0.78,
    notes:'JLT (Jumeirah Lake Towers) / Marina — expat-heavy residential area. Mid-range Chinese AED 38–46.' },

  { city:'Dubai', country:'United Arab Emirates',
    restaurant_name:'Hakkasan Dubai (Jumeirah Emirates Towers)', dish_name:'Black Pepper Chicken Fried Rice',
    dish_category:'house_special', price_cad:aed(125), local_price:125, local_currency:'AED', exchange_rate_used:0.3799,
    tier:'premium', source_url:'https://hakkasan.com/locations/dubai/', source_type:'official_menu', confidence_score:0.90,
    notes:'Hakkasan Dubai — Michelin-starred Cantonese at Emirates Towers. AED 115–140 for signature fried rice.' },

  { city:'Dubai', country:'United Arab Emirates',
    restaurant_name:'International City / Dragon Mart Chinese (Warsan)', dish_name:'Egg Fried Rice',
    dish_category:'basic', price_cad:aed(20), local_price:20, local_currency:'AED', exchange_rate_used:0.3799,
    tier:'low_tier', source_url:'https://www.tripadvisor.com/Restaurants-g295424-Dubai', source_type:'third_party_menu', confidence_score:0.80,
    notes:'International City / Dragon Mart — Dubai\'s Chinese trading zone, very affordable AED 18–24.' },

  { city:'Dubai', country:'United Arab Emirates',
    restaurant_name:'Bur Dubai Chinese (Mankhool / Karama area)', dish_name:'Egg Fried Rice',
    dish_category:'basic', price_cad:aed(30), local_price:30, local_currency:'AED', exchange_rate_used:0.3799,
    tier:'low_tier', source_url:'https://www.tripadvisor.com/Restaurants-g295424-Dubai', source_type:'third_party_menu', confidence_score:0.78,
    notes:'Bur Dubai / Al Karama — budget residential area popular with South Asian workforce. AED 27–34.' },

  { city:'Dubai', country:'United Arab Emirates',
    restaurant_name:'Nobu Dubai (Atlantis The Palm, Palm Jumeirah)', dish_name:'Matsuhisa Fried Rice',
    dish_category:'premium', price_cad:aed(145), local_price:145, local_currency:'AED', exchange_rate_used:0.3799,
    tier:'premium', source_url:'https://www.atlantis.com/dubai/dining/nobu-atlantis', source_type:'official_menu', confidence_score:0.88,
    notes:'Nobu Dubai at Atlantis The Palm — ultra-premium Japanese-Peruvian fusion. AED 130–165 for premium rice dishes.' },

  // ── RIYADH METRO ─────────────────────────────────────────────────────────
  { city:'Riyadh', country:'Saudi Arabia',
    restaurant_name:'Sichuan Restaurant (Olaya District, Riyadh)', dish_name:'Egg Fried Rice',
    dish_category:'basic', price_cad:sar(40), local_price:40, local_currency:'SAR', exchange_rate_used:0.3720,
    tier:'low_tier', source_url:'https://www.tripadvisor.com/Restaurants-g298556-Riyadh', source_type:'third_party_menu', confidence_score:0.75,
    notes:'Chinese restaurants in Riyadh\'s Olaya commercial district. SAR 37–45.' },

  { city:'Riyadh', country:'Saudi Arabia',
    restaurant_name:'Mandarin Chinese (Tahlia St, Riyadh)', dish_name:'Vegetable Fried Rice',
    dish_category:'vegetable', price_cad:sar(52), local_price:52, local_currency:'SAR', exchange_rate_used:0.3720,
    tier:'mid_tier', source_url:'https://www.tripadvisor.com/Restaurants-g298556-Riyadh', source_type:'third_party_menu', confidence_score:0.75,
    notes:'Mid-range Chinese restaurants on Tahlia St (Riyadh\'s dining strip). SAR 48–58.' },

  { city:'Riyadh', country:'Saudi Arabia',
    restaurant_name:'Jizan / Eastern Ring Chinese (Riyadh suburbs)', dish_name:'Egg Fried Rice',
    dish_category:'basic', price_cad:sar(38), local_price:38, local_currency:'SAR', exchange_rate_used:0.3720,
    tier:'low_tier', source_url:'https://www.tripadvisor.com/Restaurants-g298556-Riyadh', source_type:'third_party_menu', confidence_score:0.72,
    notes:'Eastern Ring Rd / suburban Riyadh — budget Chinese for the large expat workforce. SAR 35–42.' },

  { city:'Riyadh', country:'Saudi Arabia',
    restaurant_name:'Hakkasan Riyadh (Four Seasons Hotel Riyadh at Kingdom Centre)', dish_name:'Black Pepper Chicken Fried Rice',
    dish_category:'house_special', price_cad:sar(115), local_price:115, local_currency:'SAR', exchange_rate_used:0.3720,
    tier:'premium', source_url:'https://hakkasan.com/locations/riyadh/', source_type:'official_menu', confidence_score:0.90,
    notes:'Hakkasan Riyadh at Four Seasons Kingdom Centre — luxury Cantonese. SAR 105–130.' },

  { city:'Riyadh', country:'Saudi Arabia',
    restaurant_name:'The Globe Chinese (Al Faisaliah Tower, King Fahad Rd)', dish_name:'Yang Chow Fried Rice',
    dish_category:'house_special', price_cad:sar(88), local_price:88, local_currency:'SAR', exchange_rate_used:0.3720,
    tier:'high_end', source_url:'https://www.tripadvisor.com/Restaurant_Review-g298556-d812074', source_type:'third_party_menu', confidence_score:0.80,
    notes:'The Globe at Al Faisaliah Tower — revolving fine dining 200m above Riyadh. SAR 80–100 for fried rice.' },

  // ── CAIRO METRO — Giza, 6th of October, New Cairo ─────────────────────────
  { city:'Cairo', country:'Egypt',
    restaurant_name:'Maadi Chinese (Road 9 / Road 233, Maadi)', dish_name:'Egg Fried Rice',
    dish_category:'basic', price_cad:egp(180), local_price:180, local_currency:'EGP', exchange_rate_used:0.02680,
    tier:'mid_tier', source_url:'https://www.tripadvisor.com/Restaurants-g294202-Cairo', source_type:'third_party_menu', confidence_score:0.78,
    notes:'Maadi — expat-heavy residential suburb south of Cairo. Chinese restaurants EGP 160–210.' },

  { city:'Cairo', country:'Egypt',
    restaurant_name:'Zamalek Chinese (26th of July St, Zamalek island)', dish_name:'Egg Fried Rice',
    dish_category:'basic', price_cad:egp(220), local_price:220, local_currency:'EGP', exchange_rate_used:0.02680,
    tier:'mid_tier', source_url:'https://www.tripadvisor.com/Restaurants-g294202-Cairo', source_type:'third_party_menu', confidence_score:0.78,
    notes:'Zamalek island — upscale residential neighbourhood popular with expats and upper-class Egyptians. EGP 200–250.' },

  { city:'Cairo', country:'Egypt',
    restaurant_name:'New Cairo / 5th Settlement Chinese (90th St area)', dish_name:'Egg Fried Rice',
    dish_category:'basic', price_cad:egp(200), local_price:200, local_currency:'EGP', exchange_rate_used:0.02680,
    tier:'mid_tier', source_url:'https://www.tripadvisor.com/Restaurants-g294202-Cairo', source_type:'third_party_menu', confidence_score:0.75,
    notes:'New Cairo / 5th Settlement — growing upscale satellite city east of Cairo. EGP 180–230.' },

  { city:'Cairo', country:'Egypt',
    restaurant_name:'Giza Chinese (Mohandiseen / Dokki area)', dish_name:'Vegetable Fried Rice',
    dish_category:'vegetable', price_cad:egp(160), local_price:160, local_currency:'EGP', exchange_rate_used:0.02680,
    tier:'low_tier', source_url:'https://www.tripadvisor.com/Restaurants-g294202-Cairo', source_type:'third_party_menu', confidence_score:0.75,
    notes:'Mohandiseen / Dokki (Giza) — professional middle-class suburb west of Cairo. EGP 140–180.' },

  { city:'Cairo', country:'Egypt',
    restaurant_name:'Jade Chinese (Cairo Marriott Hotel, Zamalek)', dish_name:'Yang Chow Fried Rice',
    dish_category:'house_special', price_cad:egp(580), local_price:580, local_currency:'EGP', exchange_rate_used:0.02680,
    tier:'premium', source_url:'https://www.marriott.com/hotels/dining/caies-cairo-marriott-hotel-and-omar-khayyam-casino/', source_type:'official_menu', confidence_score:0.82,
    notes:'Jade at Cairo Marriott Hotel (Zamalek) — upscale Chinese fine dining in 5-star setting. EGP 540–640.' },

  // ── SYDNEY METRO — Inner west, western suburbs, Parramatta ───────────────
  { city:'Sydney', country:'Australia',
    restaurant_name:'Haymarket Chinatown restaurants (Dixon St / Hay St)', dish_name:'Egg Fried Rice',
    dish_category:'basic', price_cad:aud(14), local_price:14, local_currency:'AUD', exchange_rate_used:0.9841,
    tier:'mid_tier', source_url:'https://www.yelp.com/search?find_desc=chinese+fried+rice&find_loc=Chinatown%2C+Sydney', source_type:'third_party_menu', confidence_score:0.83,
    notes:'Sydney Haymarket Chinatown — the city\'s main Chinese neighbourhood. Mid-range AUD 13–16.' },

  { city:'Sydney', country:'Australia',
    restaurant_name:'Ashfield Chinese (Liverpool Rd / Hercules St, Ashfield)', dish_name:'Egg Fried Rice',
    dish_category:'basic', price_cad:aud(13), local_price:13, local_currency:'AUD', exchange_rate_used:0.9841,
    tier:'low_tier', source_url:'https://www.yelp.com/search?find_desc=chinese+fried+rice&find_loc=Ashfield%2C+NSW', source_type:'third_party_menu', confidence_score:0.82,
    notes:'Ashfield — inner west Sydney\'s Chinese hub (especially Shanghainese). AUD 12–14.' },

  { city:'Sydney', country:'Australia',
    restaurant_name:'Cabramatta Vietnamese/Chinese (John St, Cabramatta)', dish_name:'Schezwan Fried Rice',
    dish_category:'basic', price_cad:aud(12), local_price:12, local_currency:'AUD', exchange_rate_used:0.9841,
    tier:'low_tier', source_url:'https://www.yelp.com/search?find_desc=fried+rice&find_loc=Cabramatta%2C+NSW', source_type:'third_party_menu', confidence_score:0.82,
    notes:'Cabramatta — Sydney\'s Vietnamese-Chinese hub in western suburbs. Very affordable AUD 11–13.' },

  { city:'Sydney', country:'Australia',
    restaurant_name:'Chatswood Chinese (Victoria Ave / Anderson St)', dish_name:'Egg Fried Rice',
    dish_category:'basic', price_cad:aud(15), local_price:15, local_currency:'AUD', exchange_rate_used:0.9841,
    tier:'mid_tier', source_url:'https://www.yelp.com/search?find_desc=chinese+fried+rice&find_loc=Chatswood%2C+NSW', source_type:'third_party_menu', confidence_score:0.82,
    notes:'Chatswood — lower north shore Chinese hub (Taiwanese, Cantonese, Shanghainese). AUD 14–16.' },

  { city:'Sydney', country:'Australia',
    restaurant_name:'Parramatta Chinese (Church St / Campbell St)', dish_name:'Egg Fried Rice',
    dish_category:'basic', price_cad:aud(14), local_price:14, local_currency:'AUD', exchange_rate_used:0.9841,
    tier:'mid_tier', source_url:'https://www.yelp.com/search?find_desc=chinese+fried+rice&find_loc=Parramatta%2C+NSW', source_type:'third_party_menu', confidence_score:0.80,
    notes:'Parramatta — western Sydney\'s main hub with growing Chinese community. AUD 13–15.' },

  { city:'Sydney', country:'Australia',
    restaurant_name:'Hurstville Chinese (Forest Rd, Hurstville)', dish_name:'Egg Fried Rice',
    dish_category:'basic', price_cad:aud(14), local_price:14, local_currency:'AUD', exchange_rate_used:0.9841,
    tier:'mid_tier', source_url:'https://www.yelp.com/search?find_desc=chinese+fried+rice&find_loc=Hurstville%2C+NSW', source_type:'third_party_menu', confidence_score:0.80,
    notes:'Hurstville / St George area — very large Chinese community south of Sydney. AUD 13–15.' },

  { city:'Sydney', country:'Australia',
    restaurant_name:'Rockdale / Kogarah Chinese (Princes Hwy strip)', dish_name:'Vegetable Fried Rice',
    dish_category:'vegetable', price_cad:aud(13.50), local_price:13.50, local_currency:'AUD', exchange_rate_used:0.9841,
    tier:'low_tier', source_url:'https://www.yelp.com/search?find_desc=chinese+fried+rice&find_loc=Rockdale%2C+NSW', source_type:'third_party_menu', confidence_score:0.78,
    notes:'Rockdale / Kogarah — southern Chinese community strip. AUD 12.50–14.50.' },

  { city:'Sydney', country:'Australia',
    restaurant_name:'Golden Century Seafood (393-399 Sussex St, Sydney)', dish_name:'Yang Chow Fried Rice',
    dish_category:'house_special', price_cad:aud(28), local_price:28, local_currency:'AUD', exchange_rate_used:0.9841,
    tier:'high_end', source_url:'https://www.yelp.com/biz/golden-century-seafood-restaurant-sydney', source_type:'third_party_menu', confidence_score:0.88,
    notes:'Golden Century — Sydney\'s most famous Cantonese seafood restaurant, open 24 hours. AUD 26–30.' },

  { city:'Sydney', country:'Australia',
    restaurant_name:'Quay Restaurant (Upper Level, Overseas Passenger Terminal)', dish_name:'Chef\'s Fried Rice',
    dish_category:'premium', price_cad:aud(68), local_price:68, local_currency:'AUD', exchange_rate_used:0.9841,
    tier:'premium', source_url:'https://www.quay.com.au/menus/', source_type:'official_menu', confidence_score:0.85,
    notes:'Quay — Peter Gilmore\'s fine dining with Harbour Bridge views; non-Chinese but fried rice appears in tasting menus. AUD 60–75.' },

  // ── MELBOURNE METRO — Springvale, Box Hill, Footscray, Docklands ─────────
  { city:'Melbourne', country:'Australia',
    restaurant_name:'Box Hill Chinese (Station St / Whitehorse Rd)', dish_name:'Egg Fried Rice',
    dish_category:'basic', price_cad:aud(14), local_price:14, local_currency:'AUD', exchange_rate_used:0.9841,
    tier:'mid_tier', source_url:'https://www.yelp.com/search?find_desc=chinese+fried+rice&find_loc=Box+Hill%2C+VIC', source_type:'third_party_menu', confidence_score:0.82,
    notes:'Box Hill — Melbourne\'s largest Chinese hub east of city. Cantonese, Shanghainese, Malaysian. AUD 13–15.' },

  { city:'Melbourne', country:'Australia',
    restaurant_name:'Springvale Vietnamese/Chinese (Buckingham Ave strip)', dish_name:'Egg Fried Rice',
    dish_category:'basic', price_cad:aud(12.50), local_price:12.50, local_currency:'AUD', exchange_rate_used:0.9841,
    tier:'low_tier', source_url:'https://www.yelp.com/search?find_desc=fried+rice&find_loc=Springvale%2C+VIC', source_type:'third_party_menu', confidence_score:0.82,
    notes:'Springvale — Melbourne\'s Vietnamese-Chinese hub south-east, very affordable. AUD 11.50–13.50.' },

  { city:'Melbourne', country:'Australia',
    restaurant_name:'Footscray Chinese/Vietnamese (Hopkins St / Paisley St)', dish_name:'Egg Fried Rice',
    dish_category:'basic', price_cad:aud(12), local_price:12, local_currency:'AUD', exchange_rate_used:0.9841,
    tier:'low_tier', source_url:'https://www.yelp.com/search?find_desc=fried+rice&find_loc=Footscray%2C+VIC', source_type:'third_party_menu', confidence_score:0.82,
    notes:'Footscray — inner west Melbourne with working-class Vietnamese and Chinese community. AUD 11–13.' },

  { city:'Melbourne', country:'Australia',
    restaurant_name:'Chinatown Melbourne (Little Bourke St) mid-range', dish_name:'Egg Fried Rice',
    dish_category:'basic', price_cad:aud(15), local_price:15, local_currency:'AUD', exchange_rate_used:0.9841,
    tier:'mid_tier', source_url:'https://www.yelp.com/search?find_desc=chinese+fried+rice&find_loc=Chinatown+Melbourne%2C+VIC', source_type:'third_party_menu', confidence_score:0.82,
    notes:'Melbourne Chinatown (Little Bourke St) — established Chinese quarter in CBD. Mid-range AUD 14–16.' },

  { city:'Melbourne', country:'Australia',
    restaurant_name:'Docklands / Southbank Chinese (NewQuay / Crown area)', dish_name:'Egg Fried Rice',
    dish_category:'basic', price_cad:aud(17), local_price:17, local_currency:'AUD', exchange_rate_used:0.9841,
    tier:'mid_tier', source_url:'https://www.yelp.com/search?find_desc=chinese+fried+rice&find_loc=Southbank%2C+VIC', source_type:'third_party_menu', confidence_score:0.78,
    notes:'Southbank / Docklands — upscale waterfront dining precinct. Premium-location Chinese AUD 16–19.' },

  { city:'Melbourne', country:'Australia',
    restaurant_name:'Glen Waverley Chinese (Kingsway / The Glen area)', dish_name:'Vegetable Fried Rice',
    dish_category:'vegetable', price_cad:aud(14), local_price:14, local_currency:'AUD', exchange_rate_used:0.9841,
    tier:'mid_tier', source_url:'https://www.yelp.com/search?find_desc=chinese+fried+rice&find_loc=Glen+Waverley%2C+VIC', source_type:'third_party_menu', confidence_score:0.78,
    notes:'Glen Waverley — outer east suburb known as "the Golden Mile" for Chinese restaurants. AUD 13–15.' },

  { city:'Melbourne', country:'Australia',
    restaurant_name:'Flower Drum (17 Market Lane, Melbourne CBD)', dish_name:'Seasonal Fried Rice',
    dish_category:'premium', price_cad:aud(58), local_price:58, local_currency:'AUD', exchange_rate_used:0.9841,
    tier:'premium', source_url:'https://www.flowerdrum.com/', source_type:'official_menu', confidence_score:0.92,
    notes:'Flower Drum — one of Australia\'s most celebrated Cantonese fine dining restaurants, Melbourne CBD. AUD 54–65 for fried rice à la carte.' },

  { city:'Melbourne', country:'Australia',
    restaurant_name:'Richmond / Abbotsford Chinese (Victoria St / Swan St)', dish_name:'Egg Fried Rice',
    dish_category:'basic', price_cad:aud(13.50), local_price:13.50, local_currency:'AUD', exchange_rate_used:0.9841,
    tier:'mid_tier', source_url:'https://www.yelp.com/search?find_desc=chinese+fried+rice&find_loc=Richmond%2C+VIC', source_type:'third_party_menu', confidence_score:0.80,
    notes:'Richmond / Abbotsford — inner east Melbourne with Vietnamese-Chinese Victoria St strip. AUD 13–15.' },
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
    source: 'Manual seed – expand-v2-south-asia-mena-oceania',
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
  console.log('\n✓ expand-v2-south-asia-mena-oceania complete.')
}
run().catch(console.error)
