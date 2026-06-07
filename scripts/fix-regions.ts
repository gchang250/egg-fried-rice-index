/**
 * fix-regions.ts — Normalize region field for North American cities.
 * Many cities were seeded with province/state as region instead of "North America".
 *
 *   export $(grep -v '^#' .env.local | xargs) && npx tsx scripts/fix-regions.ts
 */
import { createClient } from '@supabase/supabase-js'
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

const FIXES: { city: string; region: string }[] = [
  // Canadian cities — province → North America
  { city: 'Toronto',      region: 'North America' },
  { city: 'Vancouver',    region: 'North America' },
  { city: 'Montreal',     region: 'North America' },
  { city: 'Calgary',      region: 'North America' },
  { city: 'Edmonton',     region: 'North America' },
  // US cities — state → North America
  { city: 'New York',     region: 'North America' },
  { city: 'Los Angeles',  region: 'North America' },
  { city: 'Chicago',      region: 'North America' },
  { city: 'Houston',      region: 'North America' },
  { city: 'Phoenix',      region: 'North America' },
  { city: 'Philadelphia', region: 'North America' },
  { city: 'Miami',        region: 'North America' },
]

async function main() {
  // First, show current values
  const { data } = await s.from('cities').select('city,region').order('region')
  console.log('Current regions:')
  for (const c of data ?? []) console.log(`  ${(c.region ?? 'NULL').padEnd(22)} ${c.city}`)

  console.log('\nApplying fixes...')
  let ok = 0
  for (const fix of FIXES) {
    const { error } = await s.from('cities').update({ region: fix.region }).eq('city', fix.city)
    if (error) { console.error(`  ✗ ${fix.city}: ${error.message}`); continue }
    console.log(`  ✓ ${fix.city} → ${fix.region}`)
    ok++
  }
  console.log(`\n${ok} updated.`)
}
main().catch(console.error)
