import { createClient } from '@supabase/supabase-js'
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

async function main() {
  const { data: cities, error: err1 } = await supabase.from('cities').select('count', { count: 'exact' })
  const { data: restaurants, error: err2 } = await supabase.from('restaurants').select('count', { count: 'exact' })
  const { data: reports, error: err3 } = await supabase.from('monthly_reports').select('count', { count: 'exact' })

  console.log('Cities row count:', err1 ? err1.message : cities)
  console.log('Restaurants row count:', err2 ? err2.message : restaurants)
  console.log('Monthly reports row count:', err3 ? err3.message : reports)
}
main()
