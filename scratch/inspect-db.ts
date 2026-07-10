import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function main() {
  const { data } = await supabase.from('cities')
    .select('*')
    .or('city.eq.Labrador,city.ilike.%Pierre-Boucher%')

  console.log('\n=== DATABASE RECORD INSPECTION ===')
  console.log(JSON.stringify(data, null, 2))
}

main()
