/**
 * patch-population-v1.ts — Fix all city population figures.
 *
 * Issues found:
 *   - North American cities truncated to single digit (1, 2, 3) or partial (750)
 *     due to apparent data-entry error at seed time.
 *   - Several cities using inconsistent scopes (metro vs. city proper).
 *   - Some Chinese cities using full administrative municipality (includes vast
 *     rural areas — corrected to urban-area figures where grossly misleading).
 *
 * Methodology: city proper / special municipality / built-up urban area,
 * sourced from most recent national census (2020–2024).
 *
 *   export $(grep -v '^#' .env.local | xargs) && npx tsx scripts/patch-population-v1.ts
 */

import { createClient } from '@supabase/supabase-js'
const s = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

type Pop = { city: string; population: string; source: string }

const POPS: Pop[] = [
  // ── NORTH AMERICA — all city-proper figures, 2020/2021 census ─────────────
  { city: 'New York',
    population: '8336817',
    source: 'US Census 2020, City of New York (5 boroughs)' },
  { city: 'Los Angeles',
    population: '3898747',
    source: 'US Census 2020, City of Los Angeles' },
  { city: 'Chicago',
    population: '2696555',
    source: 'US Census 2020, City of Chicago' },
  { city: 'Houston',
    population: '2304580',
    source: 'US Census 2020, City of Houston' },
  { city: 'Phoenix',
    population: '1608139',
    source: 'US Census 2020, City of Phoenix' },
  { city: 'Philadelphia',
    population: '1603797',
    source: 'US Census 2020, City of Philadelphia' },
  { city: 'Miami',
    population: '442241',
    source: 'US Census 2020, City of Miami (city proper; metro ~6.1M)' },
  { city: 'Toronto',
    population: '2794356',
    source: 'Statistics Canada 2021, City of Toronto' },
  { city: 'Montreal',
    population: '1762949',
    source: 'Statistics Canada 2021, City of Montréal' },
  { city: 'Vancouver',
    population: '662248',
    source: 'Statistics Canada 2021, City of Vancouver' },
  { city: 'Calgary',
    population: '1336000',
    source: 'Statistics Canada 2021, City of Calgary' },
  { city: 'Edmonton',
    population: '1010899',
    source: 'Statistics Canada 2021, City of Edmonton' },

  // ── EAST ASIA — correcting Chinese cities using full administrative
  //   municipality (which includes vast rural hinterlands) to urban-area figures
  //   that better represent the actual city people experience ──────────────────
  { city: 'Chongqing',
    population: '8850000',
    source: 'NBS China 2020 census, Chongqing urban built-up area (城区人口). Full municipality is 32M but includes enormous rural territory.' },
  { city: 'Chengdu',
    population: '9400000',
    source: 'NBS China 2020 census, Chengdu urban built-up area (城区人口). Full municipality is 21M.' },
  { city: 'Wuhan',
    population: '8900000',
    source: 'NBS China 2020 census, Wuhan urban area. Full municipality is 12.3M including rural counties.' },
  { city: 'Suzhou',
    population: '5500000',
    source: 'NBS China 2020 census, Suzhou urban built-up area. Full municipality is 10.7M.' },
  // Beijing, Shanghai: their municipal populations are already representative
  // (both are almost entirely urban); leave as-is.

  // ── SOUTH ASIA ─────────────────────────────────────────────────────────────
  { city: 'Mumbai',
    population: '12478447',
    source: 'India Census 2011 (latest available), BMC (Brihan Mumbai) area. Urban agglomeration ~20M.' },
  { city: 'New Delhi',
    population: '32941309',
    source: 'India Census projection 2023, Delhi NCT. "New Delhi" city proper is only ~315k but the indexable unit is the full Delhi territory.' },
  { city: 'Kolkata',
    population: '4631392',
    source: 'India Census 2011, Kolkata Municipal Corporation. Metro ~15M.' },

  // ── MIDDLE EAST / AFRICA ───────────────────────────────────────────────────
  { city: 'Cairo',
    population: '10107125',
    source: 'CAPMAS Egypt 2023, Cairo Governorate. Greater Cairo metro ~22M.' },
  { city: 'Riyadh',
    population: '7676654',
    source: 'GASTAT Saudi Arabia 2022, Riyadh Region. City proper ~7.7M.' },

  // ── EUROPE ─────────────────────────────────────────────────────────────────
  { city: 'Istanbul',
    population: '15840900',
    source: 'TUIK Turkey 2023, Istanbul Province (essentially coterminous with city). Correct.' },
  { city: 'Moscow',
    population: '13104177',
    source: 'Rosstat Russia 2021, City of Moscow. Previous figure was 2010-era census.' },
  { city: 'Paris',
    population: '2161000',
    source: 'INSEE France 2022, Commune de Paris. Île-de-France region ~12.3M.' },

  // ── LATIN AMERICA ──────────────────────────────────────────────────────────
  { city: 'Buenos Aires',
    population: '3075646',
    source: 'INDEC Argentina 2022, Autonomous City of Buenos Aires. Greater BA ~15.6M. Correct.' },
  { city: 'Mexico City',
    population: '9209944',
    source: 'INEGI Mexico 2020, CDMX Federal Entity. Valley of Mexico metro ~22M. Correct.' },

  // ── OCEANIA ────────────────────────────────────────────────────────────────
  { city: 'Sydney',
    population: '5312000',
    source: 'ABS Australia 2022, Greater Sydney. Correct.' },
  { city: 'Melbourne',
    population: '5078193',
    source: 'ABS Australia 2022, Greater Melbourne. Correct.' },

  // ── SOUTHEAST / SOUTH ASIA ─────────────────────────────────────────────────
  { city: 'Karachi',
    population: '16093786',
    source: 'PBS Pakistan 2023, Karachi Division. Correct.' },

  // ── EAST ASIA — already correct ──────────────────────────────────────────
  { city: 'Tokyo',
    population: '13960000',
    source: 'Tokyo Metropolitan Government 2023, Tokyo Metropolis. Correct.' },
  { city: 'Osaka',
    population: '2752000',
    source: 'Statistics Japan 2020, Osaka City (Osaka-shi). Correct.' },
  { city: 'Seoul',
    population: '9776000',
    source: 'Statistics Korea 2022, Seoul Special Metropolitan City. Correct.' },
  { city: 'Singapore',
    population: '5917600',
    source: 'Singstat 2023, Republic of Singapore (city-state). Correct.' },
  { city: 'Hong Kong',
    population: '7500000',
    source: 'Census and Statistics Dept HK 2022. Correct.' },
  { city: 'Beijing',
    population: '21893095',
    source: 'NBS China 2020 census, Beijing Municipality. Correct (mostly urban).' },
  { city: 'Shanghai',
    population: '24870000',
    source: 'NBS China 2020 census, Shanghai Municipality. Correct (mostly urban).' },

  // ── MIDDLE EAST ────────────────────────────────────────────────────────────
  { city: 'Dubai',
    population: '3604713',
    source: 'Dubai Statistics Centre 2023. Correct.' },
  { city: 'Tehran',
    population: '9259009',
    source: 'SCI Iran 2016 (latest full census), Tehran city. Correct.' },

  // ── EUROPE ─────────────────────────────────────────────────────────────────
  { city: 'London',
    population: '9002488',
    source: 'ONS UK 2021 census, Greater London. Correct.' },
  { city: 'Amsterdam',
    population: '921402',
    source: 'CBS Netherlands 2023, Municipality of Amsterdam. Correct.' },
]

async function main() {
  console.log('Patching population figures...\n')
  let ok = 0, skip = 0

  for (const p of POPS) {
    const { error } = await s.from('cities')
      .update({ population: p.population })
      .eq('city', p.city)

    if (error) {
      console.error(`✗ ${p.city}: ${error.message}`)
    } else {
      const n = parseInt(p.population).toLocaleString()
      console.log(`✓ ${p.city.padEnd(18)} ${n.padStart(14)}  (${p.source.slice(0, 55)})`)
      ok++
    }
  }
  console.log(`\n${ok} updated, ${skip} skipped.`)
}
main().catch(console.error)
