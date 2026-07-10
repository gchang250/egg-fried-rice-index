import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function main() {
  const { data } = await supabase.from('cities')
    .select('*')
    .ilike('city', '%Spadina%')

  console.log('\n=== SPADINA-FORT YORK INSPECTION ===')
  console.log(JSON.stringify(data, null, 2))
}

main()
