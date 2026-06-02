/**
 * Migration: add liveability metric columns to the cities table.
 * Uses Supabase management API (requires SUPABASE_ACCESS_TOKEN and project ref).
 *
 * Alternatively, paste scripts/migrate-v1-city-metrics.sql into the
 * Supabase SQL editor and run it directly.
 */
import { createClient } from '@supabase/supabase-js'

const s = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

// Try inserting a dummy row to discover which columns are missing
async function main() {
  const { data, error } = await s.from('cities').select('*').limit(1)
  if (error) { console.error(error); return }
  const cols = Object.keys(data![0])
  console.log('Current cities columns:', cols.join(', '))
  
  const needed = [
    'median_rent_1br_cad', 'median_rent_local',
    'median_monthly_salary_cad', 'median_monthly_salary_local',
    'tech_salary_cad', 'tech_salary_local',
    'safety_index', 'healthcare_index',
    'english_proficiency', 'visa_ease',
    'avg_internet_mbps', 'salary_data_source', 'rent_data_source',
  ]
  const missing = needed.filter(c => !cols.includes(c))
  if (missing.length === 0) {
    console.log('All columns already exist!')
  } else {
    console.log('\nMissing columns (need to be added via SQL migration):')
    missing.forEach(c => console.log(' -', c))
    console.log('\nRun the following in the Supabase SQL editor:')
    console.log(missing.map(c => {
      const t = ['safety_index','healthcare_index','avg_internet_mbps',
                 'median_rent_1br_cad','median_rent_local',
                 'median_monthly_salary_cad','median_monthly_salary_local',
                 'tech_salary_cad','tech_salary_local'].includes(c) ? 'NUMERIC' : 'TEXT'
      return `ALTER TABLE cities ADD COLUMN IF NOT EXISTS ${c} ${t};`
    }).join('\n'))
  }
}
main().catch(console.error)
