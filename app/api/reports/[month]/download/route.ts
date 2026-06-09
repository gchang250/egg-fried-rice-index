import { supabase } from '@/lib/supabase-admin'

function csvEsc(val: unknown): string {
  if (val === null || val === undefined) return ''
  const s = String(val)
  return s.includes(',') || s.includes('"') || s.includes('\n')
    ? `"${s.replace(/"/g, '""')}"` : s
}
function row(...cells: unknown[]): string { return cells.map(csvEsc).join(',') }

export async function GET(_req: Request, ctx: RouteContext<'/api/reports/[month]/download'>) {
  const { month } = await ctx.params

  const { data: report, error } = await supabase
    .from('monthly_reports')
    .select('*')
    .eq('month', month)
    .eq('is_published', true)
    .single()

  if (error || !report) {
    return Response.json({ error: 'Report not found' }, { status: 404 })
  }

  const cities: Record<string, unknown>[] = Array.isArray(report.city_snapshot)
    ? report.city_snapshot : []
  const rates: Record<string, number> = report.exchange_rates_snapshot ?? {}

  const lines: string[] = []

  lines.push(row('FRIED RICE INDEX — MONTHLY REPORT'))
  lines.push(row('Month', report.title))
  if (report.subtitle) lines.push(row('Edition', report.subtitle))
  lines.push(row('Published', new Date(report.published_at).toISOString().slice(0, 10)))
  lines.push(row('Cities', report.city_count))
  lines.push(row('Cheapest city', report.cheapest_city, `CA$${report.cheapest_price_cad}`))
  lines.push(row('Most expensive', report.priciest_city, `CA$${report.priciest_price_cad}`))
  lines.push(row('Price spread', `${report.spread_ratio}×`))
  lines.push(row('Avg baseline', `CA$${Number(report.avg_baseline_cad).toFixed(2)}`))
  lines.push(row('Methodology', 'https://efr-index.vercel.app/methodology'))
  lines.push('')

  if (report.new_cities?.length > 0) {
    lines.push(row('NEW CITIES THIS MONTH'))
    lines.push(row(report.new_cities.join(', ')))
    lines.push('')
  }

  lines.push(row('ANALYSIS'))
  for (const para of String(report.analysis).split('\n\n')) {
    lines.push(csvEsc(para.replace(/\n/g, ' ')))
  }
  lines.push('')

  lines.push(row('EXCHANGE RATES (CAD per 1 unit)'))
  lines.push(row('Currency', 'CAD equivalent'))
  for (const [cur, rate] of Object.entries(rates).sort(([a], [b]) => a.localeCompare(b))) {
    lines.push(row(cur, Number(rate).toFixed(5)))
  }
  lines.push('')

  lines.push(row('CITY DATA SNAPSHOT'))
  lines.push(row(
    'Rank', 'City', 'Country', 'Region',
    'Baseline Price (CA$)', 'Median Rent 1BR (CA$)', 'Median Salary (CA$)',
    'Rent Burden %', 'Bowls After Rent', 'Baseline Entries', 'Total Entries', 'Data Quality',
  ))

  const sorted = [...cities].sort((a, b) => Number(a.price_cad ?? 0) - Number(b.price_cad ?? 0))
  sorted.forEach((c, i) => {
    const price = Number(c.price_cad ?? 0)
    const rent = Number(c.median_rent_1br_cad ?? 0)
    const salary = Number(c.median_monthly_salary_cad ?? 0)
    const burden = rent && salary ? Math.round((rent / salary) * 100) : ''
    const afterRent = salary && rent && price ? Math.round((salary - rent) / price) : ''
    lines.push(row(
      i + 1, c.city, c.country, c.region,
      price.toFixed(2),
      rent ? rent.toFixed(2) : '',
      salary ? salary.toFixed(2) : '',
      burden, afterRent,
      c.baseline_entry_count ?? '', c.market_entry_count ?? '',
      c.data_quality_label ?? '',
    ))
  })

  lines.push('')
  lines.push(row(`End of report — efr-index.vercel.app`))

  const csv = lines.join('\r\n')
  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="fried-rice-index-${month}.csv"`,
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
