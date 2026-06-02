import { createClient } from '@supabase/supabase-js'
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

// Revised ratings — city-level, not country-level averages
// 'medium' = manageable day-to-day: English signage, tourist infrastructure,
//             young population speaks it, expat community present
// 'low'    = genuine daily barrier outside tourist zones
const updates: [string, string, string][] = [
  // city,    old,   new
  ['Tokyo',   'low', 'medium'],  // English everywhere in tourist/transit infrastructure; young population speaks it
  ['Osaka',   'low', 'medium'],  // Major international city; huge tourism push post-2023 improved signage
  ['Seoul',   'low', 'medium'],  // K-pop/drama boom drove English learning; Itaewon/Gangnam very accessible
  ['Shanghai','low', 'medium'],  // Largest expat community in mainland China; business English common; bilingual menus standard
  // Beijing stays 'low' — significantly harder than the above four
  // Singapore/HK/North America stay as-is
]

async function main() {
  for (const [city, , newVal] of updates) {
    const { error } = await s.from('cities')
      .update({ english_proficiency: newVal })
      .eq('city', city)
    if (error) console.error(`✗ ${city}: ${error.message}`)
    else console.log(`✓ ${city}: low → ${newVal}`)
  }
  console.log('\nDone.')
}
main().catch(console.error)
