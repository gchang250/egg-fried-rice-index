/**
 * Seed script v6 — Add lat/lon, flag, and blurb to 6 new East Asian cities.
 *
 * Run with:
 *   export $(grep -v '^#' .env.local | xargs) && npx tsx scripts/seed-update-v6.ts
 */

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

const cities = [
  {
    city: 'Singapore',
    flag: '🇸🇬',
    latitude: 1.3521,
    longitude: 103.8198,
    blurb:
      'A city-state of 5.9 million at the crossroads of Southeast Asia, Singapore has one of the highest GDPs per capita in the world. Its economy is built on finance, trade, and logistics. The population is majority Chinese, with large Malay, Indian, and expatriate communities. Hawker centres are the cultural backbone of daily dining — government-subsidized food stalls where a full meal can cost as little as S$4–6.',
  },
  {
    city: 'Tokyo',
    flag: '🇯🇵',
    latitude: 35.6762,
    longitude: 139.6503,
    blurb:
      "The world's most populous metropolitan area and Japan's political, economic, and cultural capital. Tokyo has more Michelin-starred restaurants than any other city in the world, yet dining out remains accessible at every price tier — from sub-¥500 chain meals to multi-course kaiseki. Eating out is deeply embedded in everyday culture, and the density and quality of food options across all budgets is unmatched globally.",
  },
  {
    city: 'Osaka',
    flag: '🇯🇵',
    latitude: 34.6937,
    longitude: 135.5023,
    blurb:
      "Japan's second-largest city and its unofficial food capital. Osaka's residents are renowned for 'kuidaore' — eating until you drop — and the city punches above its weight for casual dining quality. A major port city with a long merchant culture, Osaka is more street-food-forward than Tokyo. Home to a significant Korean-Japanese community in the Tsuruhashi district.",
  },
  {
    city: 'Beijing',
    flag: '🇨🇳',
    latitude: 39.9042,
    longitude: 116.4074,
    blurb:
      "China's political capital and a city of 21 million with a history stretching back over 3,000 years. Beijing's dining scene reflects its role as the national centre — cuisines from every province are represented alongside traditional local dishes like Peking duck and zhajiangmian. The cost of eating out varies enormously: student-area canteens serve meals for under ¥10, while premium restaurants charge hundreds.",
  },
  {
    city: 'Shanghai',
    flag: '🇨🇳',
    latitude: 31.2304,
    longitude: 121.4737,
    blurb:
      "China's financial and commercial capital, Shanghai is one of the world's great cosmopolitan cities. Its restaurant scene is among the most sophisticated in Asia, reflecting both Shanghainese culinary tradition and heavy international influence. Rent and dining costs are significantly higher than in Beijing, and the city has the highest concentration of foreign residents in mainland China.",
  },
  {
    city: 'Seoul',
    flag: '🇰🇷',
    latitude: 37.5665,
    longitude: 126.978,
    blurb:
      "South Korea's capital and home to nearly half the country's population in the greater metropolitan area. Seoul is a global leader in technology, entertainment, and consumer culture. Chinese-Korean cuisine (한중식당) is a beloved everyday staple, and the city has a highly developed food delivery ecosystem. Despite high urban land costs, everyday dining remains accessible compared to Tokyo or Singapore.",
  },
]

async function main() {
  console.log('Updating 6 East Asian cities with coordinates, flags, and blurbs...\n')

  for (const c of cities) {
    const { error } = await supabase
      .from('cities')
      .update({
        flag: c.flag,
        latitude: c.latitude,
        longitude: c.longitude,
        blurb: c.blurb,
      })
      .eq('city', c.city)

    if (error) {
      console.error(`✗ ${c.city}: ${error.message}`)
    } else {
      console.log(`✓ ${c.flag}  ${c.city} — [${c.latitude}, ${c.longitude}]`)
    }
  }

  console.log('\nDone.')
}

main().catch(console.error)
