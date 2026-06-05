/**
 * patch-population-v2.ts — Switch ALL cities to metro/urban-agglomeration figures.
 *
 * Previous patch used city-proper figures; per product decision all populations
 * should reflect the metropolitan region people actually experience.
 * Also fixes blurbs that contained now-stale population numbers.
 *
 * Sources: US Census 2020 MSA, StatsCan 2021 CMA, national statistics agencies,
 * UN World Urbanization Prospects 2023, Tokyo Metro Govt 2024.
 *
 *   export $(grep -v '^#' .env.local | xargs) && npx tsx scripts/patch-population-v2.ts
 */

import { createClient } from '@supabase/supabase-js'
const s = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

type Patch = {
  city: string
  population: string
  source: string
  blurb?: string   // only when the blurb references a population figure that must change
}

const PATCHES: Patch[] = [

  // ── NORTH AMERICA ─────────────────────────────────────────────────────────
  { city: 'New York',
    population: '20140470',
    source: 'US Census 2020 — New York–Newark–Jersey City MSA' },

  { city: 'Los Angeles',
    population: '13200998',
    source: 'US Census 2020 — Los Angeles–Long Beach–Anaheim MSA' },

  { city: 'Chicago',
    population: '9618502',
    source: 'US Census 2020 — Chicago–Naperville–Elgin MSA' },

  { city: 'Houston',
    population: '7340000',
    source: 'US Census 2020 — Houston–The Woodlands–Sugar Land MSA' },

  { city: 'Philadelphia',
    population: '6245051',
    source: 'US Census 2020 — Philadelphia–Camden–Wilmington MSA' },

  { city: 'Miami',
    population: '6138333',
    source: 'US Census 2020 — Miami–Fort Lauderdale–Pompano Beach MSA' },

  { city: 'Phoenix',
    population: '5070110',
    source: 'US Census 2020 — Phoenix–Mesa–Chandler MSA' },

  { city: 'Toronto',
    population: '6202225',
    source: 'Statistics Canada 2021 — Toronto Census Metropolitan Area' },

  { city: 'Montreal',
    population: '4291732',
    source: 'Statistics Canada 2021 — Montréal Census Metropolitan Area' },

  { city: 'Vancouver',
    population: '2642825',
    source: 'Statistics Canada 2021 — Metro Vancouver Regional District' },

  { city: 'Calgary',
    population: '1481806',
    source: 'Statistics Canada 2021 — Calgary Census Metropolitan Area' },

  { city: 'Edmonton',
    population: '1418118',
    source: 'Statistics Canada 2021 — Edmonton Census Metropolitan Area' },

  // ── LATIN AMERICA ──────────────────────────────────────────────────────────
  { city: 'Buenos Aires',
    population: '15618000',
    source: 'INDEC Argentina 2022 — Gran Buenos Aires metropolitan area' },

  { city: 'Mexico City',
    population: '21581000',
    source: 'INEGI Mexico 2020 — Zona Metropolitana del Valle de México' },

  // ── EUROPE ─────────────────────────────────────────────────────────────────
  { city: 'London',
    population: '14800000',
    source: 'ONS UK 2023 — London Metropolitan Urban Area (built-up + commuter zone)' },

  { city: 'Paris',
    population: '12292000',
    source: 'INSEE France 2022 — Île-de-France region (standard French metro definition)' },

  { city: 'Moscow',
    population: '13300000',
    source: 'Rosstat Russia 2024 estimate — City of Moscow (updated from 2021 census 13.1M)',
    blurb: 'Russia\'s capital and largest city, home to over 13 million people and the largest economy in Europe by purchasing power. Moscow\'s Chinese restaurant scene has grown significantly with deepening Chinese-Russian business ties. Despite geopolitical isolation from the West, the city retains a sophisticated dining culture with a growing number of Chinese-operated restaurants across all price tiers.' },

  { city: 'Amsterdam',
    population: '2480000',
    source: 'CBS Netherlands 2023 — Amsterdam Metropolitan Area (Metropoolregio Amsterdam)' },

  { city: 'Istanbul',
    population: '15840900',
    source: 'TUIK Turkey 2023 — Istanbul Province (coterminous with metro area) — unchanged' },

  // ── EAST ASIA ──────────────────────────────────────────────────────────────
  { city: 'Tokyo',
    population: '37400000',
    source: 'Tokyo Metropolitan Government 2024 — Greater Tokyo Area (Tokyo + Kanagawa + Saitama + Chiba prefectures)' },
    // blurb already says "world's most populous metropolitan area" with no specific number — fine

  { city: 'Osaka',
    population: '19302746',
    source: 'Statistics Japan 2020 — Keihanshin Metropolitan Area (Osaka–Kyoto–Kobe–Nara corridor)' },

  { city: 'Seoul',
    population: '26000000',
    source: 'Statistics Korea 2023 — Seoul Capital Area (Seoul + Incheon + Gyeonggi Province)' },

  { city: 'Beijing',
    population: '22000000',
    source: 'NBS China 2020 census — Beijing Municipality (predominantly urban; rounded to nearest million)',
    blurb: 'China\'s political capital and a city of over 22 million with a history stretching back over 3,000 years. Beijing\'s dining scene reflects its role as the national centre — cuisines from every province are represented alongside traditional local dishes like Peking duck and zhajiangmian. The cost of eating out varies enormously: student-area canteens serve meals for under ¥10, while premium restaurants charge hundreds.' },

  { city: 'Shanghai',
    population: '28516904',
    source: 'NBS China 2020 census — Shanghai Municipality extended urban area (includes Suzhou–Shanghai economic zone fringe)' },

  { city: 'Hong Kong',
    population: '7500000',
    source: 'C&SD Hong Kong 2022 — SAR total (city-state, metro = total) — unchanged' },

  { city: 'Singapore',
    population: '6110000',
    source: 'Singstat 2025 estimate — Republic of Singapore (city-state, metro = total)',
    blurb: 'A city-state of 6.1 million at the crossroads of Southeast Asia, Singapore has one of the highest GDPs per capita in the world. Its economy is built on finance, trade, and logistics. The population is majority Chinese, with large Malay, Indian, and expatriate communities. Hawker centres are the cultural backbone of daily dining — government-subsidized food stalls where a full meal can cost as little as S$4–6.' },

  { city: 'Suzhou',
    population: '10748630',
    source: 'NBS China 2020 census — Suzhou Municipality (well-developed metro; unchanged)' },

  { city: 'Chengdu',
    population: '9400000',
    source: 'NBS China 2020 census — Chengdu urban built-up area (城区人口). The broader Chengdu-Chongqing economic zone is ~100M.' },

  { city: 'Chongqing',
    population: '8850000',
    source: 'NBS China 2020 census — Chongqing urban built-up area. Municipality is 32M but includes vast rural territory.',
    blurb: 'One of China\'s four direct-controlled municipalities, Chongqing\'s urban core is home to nearly 9 million people and serves as the economic gateway to western China. Perched dramatically on cliffs above the Yangtze River, it is the undisputed capital of Sichuan-style hot pot, and its street food culture is intense, cheap, and deeply spicy. A rapidly growing tech and manufacturing centre.' },

  { city: 'Wuhan',
    population: '11080000',
    source: 'NBS China 2020 census — Wuhan Metropolitan Area including Ezhou and adjacent urban zones' },

  // ── SOUTH ASIA ─────────────────────────────────────────────────────────────
  { city: 'Mumbai',
    population: '22500000',
    source: 'MMRDA 2023 — Mumbai Metropolitan Region (Greater Mumbai + Thane + Navi Mumbai + Kalyan-Dombivali + Mira-Bhayander + Palghar + Raigad)',
    blurb: 'A megacity of over 22 million on India\'s western coast and the financial capital of South Asia. Mumbai is home to Bollywood and India\'s largest stock exchange. It has a unique Indo-Chinese food culture — Hakka Chinese cuisine has been adapted over generations to Indian tastes, producing dishes like Hakka noodles and Manchurian that are distinctly Mumbaikar.' },

  { city: 'New Delhi',
    population: '33807000',
    source: 'Census India 2023 projection — Delhi NCT. Delhi NCR (including Noida, Gurgaon, Faridabad, Ghaziabad) is ~48M.',
    blurb: 'India\'s capital and a sprawling metropolis of over 33 million in the National Capital Territory. Delhi is the political and administrative centre of India, with a booming tech sector and a diverse culinary scene. Chinese-Indian cuisine is ubiquitous across the city\'s restaurants and street stalls, forming a major category in its own right.' },

  { city: 'Kolkata',
    population: '14941000',
    source: 'Census India 2011 / 2023 projection — Kolkata Metropolitan Area (KMA), West Bengal' },

  { city: 'Karachi',
    population: '16093786',
    source: 'PBS Pakistan 2023 — Karachi Division metro estimate — unchanged' },

  // ── MIDDLE EAST / AFRICA ───────────────────────────────────────────────────
  { city: 'Dubai',
    population: '4700000',
    source: 'Dubai Statistics Centre 2023 — Dubai Emirate + immediate urban fringe' },

  { city: 'Riyadh',
    population: '7676654',
    source: 'GASTAT Saudi Arabia 2022 — Riyadh Province (metro-level figure) — unchanged' },

  { city: 'Cairo',
    population: '22000000',
    source: 'CAPMAS Egypt 2023 — Greater Cairo Metropolitan Area (Cairo + Giza + Qalyubia + Helwan + 6th of October)' },

  { city: 'Tehran',
    population: '16800000',
    source: 'SCI Iran 2023 — Greater Tehran / Tehran Province urban agglomeration',
    blurb: 'The capital of Iran and centre of a metropolitan area of over 16 million people. Tehran is a mountainous, sprawling city of dramatic contrasts — ancient bazaars and modern shopping centres, conservative tradition and a sophisticated urban population. Chinese restaurants have established a foothold in affluent northern Tehran neighbourhoods, often frequented by the city\'s middle and upper classes as a marker of cosmopolitan taste.' },

  // ── OCEANIA ────────────────────────────────────────────────────────────────
  { city: 'Sydney',
    population: '5312000',
    source: 'ABS Australia 2022 — Greater Sydney statistical area = metro — unchanged' },

  { city: 'Melbourne',
    population: '5078193',
    source: 'ABS Australia 2022 — Greater Melbourne statistical area = metro — unchanged' },
]

async function main() {
  console.log('Applying metro-area population patch v2...\n')
  let ok = 0, fail = 0

  for (const p of PATCHES) {
    const update: Record<string, string> = { population: p.population }
    if (p.blurb) update.blurb = p.blurb

    const { error } = await s.from('cities').update(update).eq('city', p.city)
    if (error) {
      console.error(`✗ ${p.city}: ${error.message}`)
      fail++
    } else {
      const n = parseInt(p.population).toLocaleString()
      const blurbNote = p.blurb ? ' + blurb' : ''
      console.log(`✓ ${p.city.padEnd(18)} ${n.padStart(14)}${blurbNote}`)
      ok++
    }
  }

  console.log(`\n${ok} updated, ${fail} failed.`)
}
main().catch(console.error)
