import { createClient } from '@supabase/supabase-js'
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

async function main() {
  const { data } = await s.from('cities')
    .select('city,price_cad,median_rent_1br_cad,median_monthly_salary_cad,tech_salary_cad,safety_index,healthcare_index,english_proficiency,visa_ease,avg_internet_mbps')
    .order('city')

  console.log('\n=== LIVEABILITY AUDIT ===\n')
  for (const c of data ?? []) {
    const rent = c.median_rent_1br_cad
    const sal = c.median_monthly_salary_cad
    const tech = c.tech_salary_cad
    const bowl = c.price_cad
    const rentBurden = rent && sal ? Math.round((rent/sal)*100) : null
    const afterRent = rent && sal ? Math.round(sal - rent) : null
    const bowlsAfter = afterRent && bowl ? Math.round(afterRent / bowl) : null
    const flag = (rentBurden && rentBurden > 100) ? ' ⚠️ RENT>SALARY' : ''
    console.log(`${c.city.padEnd(16)} safety:${String(c.safety_index??'—').padStart(3)} health:${String(c.healthcare_index??'—').padStart(3)} eng:${(c.english_proficiency??'—').padEnd(8)} visa:${(c.visa_ease??'—').padEnd(8)} net:${String(c.avg_internet_mbps??'—').padStart(4)}mbps  rent:CA$${rent??'—'} sal:CA$${sal??'—'} burden:${rentBurden??'—'}% bowlsLeft:${bowlsAfter??'—'}${flag}`)
  }
}
main().catch(console.error)
