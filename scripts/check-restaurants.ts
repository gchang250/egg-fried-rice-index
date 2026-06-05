import { createClient } from '@supabase/supabase-js'
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

async function main() {
  const { data } = await s
    .from('restaurants')
    .select('city,restaurant_name,dish_name,price_cad,local_price,local_currency,dish_category,included_in_baseline,confidence_score')
    .order('city').order('price_cad')
  
  let curCity = ''
  for (const r of data ?? []) {
    if (r.city !== curCity) {
      curCity = r.city
      console.log(`\n═══ ${r.city} ═══`)
    }
    const bl = r.included_in_baseline ? ' [BL]' : ''
    const loc = r.local_currency !== 'CAD' ? ` (${r.local_currency} ${r.local_price})` : ''
    console.log(`  $${r.price_cad.toFixed(2)}${bl}  ${r.restaurant_name} — ${r.dish_name}${loc}  [${r.dish_category}] conf:${r.confidence_score}`)
  }
}
main().catch(console.error)
