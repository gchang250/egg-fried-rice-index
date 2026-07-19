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
    .select('city,median_rent_1br_cad,median_monthly_salary_cad')
  if (error) throw error

  const burdens: number[] = []
  
  for (const row of data || []) {
    const r = row.median_rent_1br_cad
    const s = row.median_monthly_salary_cad
    if (r !== null && s !== null && s > 0) {
      burdens.push(Math.round((r / s) * 100))
    }
  }
  
  const avg = burdens.reduce((sum, b) => sum + b, 0) / burdens.length
  console.log("Number of ridings with valid burdens:", burdens.length)
  console.log("Calculated Average Rent Burden:", Math.round(avg))
}

run().catch(console.error)
