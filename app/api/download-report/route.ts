import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase-admin'

const REPORT_VERSION = '1.0'
const INDEX_NAME = 'Fried Rice Index'
const METHODOLOGY_URL = 'https://efr-index.vercel.app/methodology'
const PUBLISHER = 'Fried Rice Index (efr-index.vercel.app)'

function trimmedMean(sortedPrices: number[], trimFraction = 0.05): number | null {
  if (sortedPrices.length === 0) return null
  const n = sortedPrices.length
  const k = Math.round(n * trimFraction)
  const trimmed = k > 0 ? sortedPrices.slice(k, n - k) : sortedPrices
  if (trimmed.length === 0) return sortedPrices.reduce((s, p) => s + p, 0) / sortedPrices.length
  return trimmed.reduce((s, p) => s + p, 0) / trimmed.length
}

function stdDev(values: number[]): number | null {
  if (values.length < 2) return null
  const mean = values.reduce((s, v) => s + v, 0) / values.length
  const variance = values.reduce((s, v) => s + (v - mean) ** 2, 0) / (values.length - 1)
  return Math.sqrt(variance)
}

function fmt(n: number | null | undefined, decimals = 2): string {
  if (n === null || n === undefined || !Number.isFinite(n)) return ''
  return n.toFixed(decimals)
}

function csvEscape(val: unknown): string {
  if (val === null || val === undefined) return ''
  const s = String(val)
  // Wrap in quotes if the value contains commas, quotes, or newlines
  if (s.includes(',') || s.includes('"') || s.includes('\n') || s.includes('\r')) {
    return `"${s.replace(/"/g, '""')}"`
  }
  return s
}

function csvRow(cells: unknown[]): string {
  return cells.map(csvEscape).join(',')
}

export async function GET() {
  try {
    const generatedAt = new Date()
    const generatedAtISO = generatedAt.toISOString()
    const generatedAtDisplay = generatedAt.toUTCString()
    const filenamestamp = generatedAt
      .toISOString()
      .replace(/[:.]/g, '-')
      .slice(0, 19)

    // ── Fetch all data ───────────────────────────────────────────────────────
    const { data: cities, error: cityErr } = await supabase
      .from('cities')
      .select('*')
      .order('city', { ascending: true })

    if (cityErr) throw new Error(cityErr.message)

    const { data: restaurants, error: restErr } = await supabase
      .from('restaurants')
      .select('*')
      .eq('approved', true)
      .eq('active', true)
      .order('city', { ascending: true })
      .order('restaurant_name', { ascending: true })
      .order('price_cad', { ascending: true })

    if (restErr) throw new Error(restErr.message)

    // ── Pre-compute per-city stats from live restaurant data ─────────────────
    type CityStats = {
      stdDev: number | null
      trimmedAvg: number | null
      liveMin: number | null
      liveMax: number | null
      liveCount: number
      baselineCount: number
    }
    const cityStatsMap = new Map<string, CityStats>()

    for (const city of cities ?? []) {
      const cityRests = (restaurants ?? []).filter((r) => r.city === city.city)
      const allPrices = cityRests
        .map((r) => Number(r.price_cad))
        .filter((p) => Number.isFinite(p) && p > 0)
        .sort((a, b) => a - b)
      const baselineCount = cityRests.filter((r) => r.included_in_baseline).length

      cityStatsMap.set(city.city, {
        stdDev: stdDev(allPrices),
        trimmedAvg: trimmedMean(allPrices),
        liveMin: allPrices.length > 0 ? allPrices[0] : null,
        liveMax: allPrices.length > 0 ? allPrices[allPrices.length - 1] : null,
        liveCount: allPrices.length,
        baselineCount,
      })
    }

    // ── Build CSV ────────────────────────────────────────────────────────────
    const lines: string[] = []

    // Report header block
    lines.push(csvRow(['FRIED RICE INDEX — FULL DATASET REPORT']))
    lines.push(csvRow(['Publisher', PUBLISHER]))
    lines.push(csvRow(['Report version', REPORT_VERSION]))
    lines.push(csvRow(['Generated (UTC)', generatedAtDisplay]))
    lines.push(csvRow(['Methodology', METHODOLOGY_URL]))
    lines.push(csvRow(['Currency', 'All prices in Canadian Dollars (CAD)']))
    lines.push(csvRow(['Market average method', '5% trimmed mean (top and bottom 5% excluded)']))
    lines.push(csvRow(['Std deviation basis', 'Sample std dev across all approved entries per city']))
    lines.push(csvRow(['Baseline definition', 'Basic or vegetable fried rice only']))
    lines.push(csvRow(['Licence', 'Public domain — cite efr-index.vercel.app']))
    lines.push('')

    // ── Section 1: City summary ──────────────────────────────────────────────
    lines.push(csvRow(['SECTION 1 — CITY SUMMARY']))
    lines.push(
      csvRow([
        'City',
        'Country',
        'Region',
        'Baseline Median (CA$)',
        'Market Avg 5% Trimmed (CA$)',
        'Market Std Dev (CA$)',
        'Market Min (CA$)',
        'Market Max (CA$)',
        'Total Approved Entries',
        'Baseline Entries',
        'Data Quality',
        'Avg Confidence',
        'Price Last Updated',
        'Population',
      ])
    )

    for (const city of cities ?? []) {
      const stats = cityStatsMap.get(city.city)
      lines.push(
        csvRow([
          city.city,
          city.country ?? '',
          city.region ?? '',
          fmt(city.baseline_median_cad ?? city.price_cad),
          fmt(stats?.trimmedAvg),
          fmt(stats?.stdDev),
          fmt(city.market_min_cad ?? stats?.liveMin),
          fmt(city.market_max_cad ?? stats?.liveMax),
          stats?.liveCount ?? city.market_entry_count ?? 0,
          stats?.baselineCount ?? city.baseline_entry_count ?? 0,
          city.data_quality_label ?? '',
          city.confidence_score !== null ? fmt(city.confidence_score * 100, 0) + '%' : '',
          city.price_updated_at
            ? new Date(city.price_updated_at).toISOString().slice(0, 10)
            : '',
          city.population ?? '',
        ])
      )
    }

    lines.push('')

    // ── Section 2: Restaurant entries ───────────────────────────────────────
    lines.push(csvRow(['SECTION 2 — RESTAURANT ENTRIES']))
    lines.push(
      csvRow([
        'City',
        'Country',
        'Restaurant Name',
        'Dish Name',
        'Dish Category',
        'Included in Baseline',
        'Tier',
        'Local Price',
        'Local Currency',
        'Exchange Rate Used',
        'Price (CA$)',
        'Source Type',
        'Source URL',
        'Confidence Score',
        'Date Accessed',
        'Notes',
      ])
    )

    for (const r of restaurants ?? []) {
      lines.push(
        csvRow([
          r.city,
          r.country ?? '',
          r.restaurant_name ?? '',
          r.dish_name ?? '',
          r.dish_category ?? '',
          r.included_in_baseline ? 'Yes' : 'No',
          r.tier ?? '',
          r.local_price !== null ? fmt(r.local_price) : '',
          r.local_currency ?? '',
          r.exchange_rate_used !== null ? fmt(r.exchange_rate_used, 4) : '',
          fmt(r.price_cad),
          r.source_type ?? '',
          r.source_url ?? '',
          r.confidence_score !== null ? fmt(r.confidence_score * 100, 0) + '%' : '',
          r.date_accessed ? new Date(r.date_accessed).toISOString().slice(0, 10) : '',
          r.notes ?? '',
        ])
      )
    }

    lines.push('')
    lines.push(csvRow([`End of report — generated ${generatedAtISO}`]))

    const csv = lines.join('\r\n')
    const filename = `fried-rice-index-${filenamestamp}.csv`

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Report generation failed' },
      { status: 500 }
    )
  }
}
