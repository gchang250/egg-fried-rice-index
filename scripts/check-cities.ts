import { createClient } from '@supabase/supabase-js'
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
async function main() {
  const { data } = await supabase.from('cities')
    .select('city,country,baseline_median_cad,market_average_cad,market_min_cad,market_max_cad,market_entry_count,baseline_entry_count,data_quality_label')
    .order('baseline_median_cad', { ascending: true })
  console.log('\n=== FINAL CITY BASELINES (cheapest → priciest) ===')
  for (const c of data ?? []) {
    const usdBaseline = c.country === 'United States' ? ` (~$${(c.baseline_median_cad / 1.39).toFixed(2)} USD)` : ''
    console.log(`${c.city.padEnd(16)} ${c.country.padEnd(14)} CA$${c.baseline_median_cad?.toFixed(2).padStart(6)}${usdBaseline} | ${c.market_entry_count} entries (${c.baseline_entry_count} BL) | ${c.data_quality_label}`)
  }
}
main()
