import fs from 'fs'
import path from 'path'
import { createClient } from '@supabase/supabase-js'

const envPath = path.resolve(process.cwd(), '.env.local')
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf-8').split('\n')) {
    const i = line.indexOf('=')
    if (i > 0) process.env[line.slice(0, i).trim()] = line.slice(i + 1).trim().replace(/^['"]|['"]$/g, '')
  }
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function run() {
  const { data, error } = await supabase
    .from('cities')
    .select('city,median_rent_1br_cad,median_monthly_salary_cad,tech_salary_cad')
  if (error) throw error

  const single_rents: number[] = []
  const family_rents: number[] = []
  
  for (const row of data || []) {
    const r = row.median_rent_1br_cad
    if (r !== null && r > 0) {
      single_rents.push(r)
      family_rents.push(r * 1.65)
    }
  }
  
  single_rents.sort((a, b) => a - b)
  family_rents.sort((a, b) => a - b)
  
  console.log("Single Renter Rents (first 10):", single_rents.slice(0, 10))
  console.log("Family Renter Rents (first 10):", family_rents.slice(0, 10))
}

run().catch(console.error)
