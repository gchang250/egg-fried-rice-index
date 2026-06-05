import { createClient } from '@supabase/supabase-js'
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
async function main() {
  const { data } = await s.from('cities').select('city,country,population').order('city')
  for (const c of data ?? []) {
    const pop = c.population ? parseInt(c.population).toLocaleString() : 'NULL'
    console.log(`${c.city.padEnd(20)} ${(c.country||'').padEnd(22)} ${pop}`)
  }
}
main()
