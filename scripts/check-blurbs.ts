import { createClient } from '@supabase/supabase-js'
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

async function main() {
  const { data } = await s.from('cities').select('city,flag,latitude,longitude,blurb').order('city')
  for (const c of data ?? []) {
    console.log(`\n── ${c.city} (${c.flag}) [${c.latitude}, ${c.longitude}]`)
    console.log(`   ${c.blurb ?? '(no blurb)'}`)
  }
}
main().catch(console.error)
