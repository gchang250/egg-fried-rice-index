import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase-admin'

const REPORT_VERSION = '1.0'
const METHODOLOGY_URL = 'https://efr-index.vercel.app/methodology'
const PUBLISHER = 'Fried Rice Index (efr-index.vercel.app)'

type DistributionStats = {
  count: number
  mean: number | null
  median: number | null
  min: number | null
  max: number | null
  range: number | null
  varianceSample: number | null
  variancePopulation: number | null
  stdDevSample: number | null
  stdDevPopulation: number | null
  standardError: number | null
  coefficientOfVariation: number | null
  q1: number | null
  q3: number | null
  iqr: number | null
  p5: number | null
  p10: number | null
  p25: number | null
  p50: number | null
  p75: number | null
  p90: number | null
  p95: number | null
  mad: number | null
  skewness: number | null
  excessKurtosis: number | null
  geometricMean: number | null
  harmonicMean: number | null
  trimmedMean5: number | null
  trimmedMean10: number | null
  trimmedMean20: number | null
  ci95Low: number | null
  ci95High: number | null
  lowerOutlierFence: number | null
  upperOutlierFence: number | null
  outlierCount: number
}

function trimmedMean(sortedPrices: number[], trimFraction = 0.05): number | null {
  if (sortedPrices.length === 0) return null
  const n = sortedPrices.length
  const k = Math.round(n * trimFraction)
  const trimmed = k > 0 ? sortedPrices.slice(k, n - k) : sortedPrices
  if (trimmed.length === 0) return sortedPrices.reduce((s, p) => s + p, 0) / sortedPrices.length
  return trimmed.reduce((s, p) => s + p, 0) / trimmed.length
}

function percentile(sortedValues: number[], p: number): number | null {
  if (sortedValues.length === 0) return null
  if (sortedValues.length === 1) return sortedValues[0]
  const idx = (sortedValues.length - 1) * p
  const lo = Math.floor(idx)
  const hi = Math.ceil(idx)
  const weight = idx - lo
  return sortedValues[lo] * (1 - weight) + sortedValues[hi] * weight
}

function distributionStats(values: number[]): DistributionStats {
  const sorted = values.filter((v) => Number.isFinite(v) && v > 0).sort((a, b) => a - b)
  const count = sorted.length
  const mean = count ? sorted.reduce((s, v) => s + v, 0) / count : null
  const median = percentile(sorted, 0.5)
  const min = count ? sorted[0] : null
  const max = count ? sorted[count - 1] : null
  const range = min !== null && max !== null ? max - min : null
  const variancePopulation = mean !== null && count > 0
    ? sorted.reduce((s, v) => s + (v - mean) ** 2, 0) / count
    : null
  const varianceSample = mean !== null && count > 1
    ? sorted.reduce((s, v) => s + (v - mean) ** 2, 0) / (count - 1)
    : null
  const stdDevPopulation = variancePopulation !== null ? Math.sqrt(variancePopulation) : null
  const stdDevSample = varianceSample !== null ? Math.sqrt(varianceSample) : null
  const standardError = stdDevSample !== null && count > 0 ? stdDevSample / Math.sqrt(count) : null
  const coefficientOfVariation = stdDevSample !== null && mean !== null && mean !== 0 ? stdDevSample / mean : null
  const q1 = percentile(sorted, 0.25)
  const q3 = percentile(sorted, 0.75)
  const iqr = q1 !== null && q3 !== null ? q3 - q1 : null
  const deviations = median !== null ? sorted.map((v) => Math.abs(v - median)).sort((a, b) => a - b) : []
  const mad = percentile(deviations, 0.5)
  const skewness = mean !== null && stdDevPopulation !== null && stdDevPopulation > 0 && count > 2
    ? sorted.reduce((s, v) => s + ((v - mean) / stdDevPopulation) ** 3, 0) / count
    : null
  const excessKurtosis = mean !== null && stdDevPopulation !== null && stdDevPopulation > 0 && count > 3
    ? sorted.reduce((s, v) => s + ((v - mean) / stdDevPopulation) ** 4, 0) / count - 3
    : null
  const geometricMean = count ? Math.exp(sorted.reduce((s, v) => s + Math.log(v), 0) / count) : null
  const harmonicMean = count ? count / sorted.reduce((s, v) => s + 1 / v, 0) : null
  const ci95Low = mean !== null && standardError !== null ? mean - 1.96 * standardError : null
  const ci95High = mean !== null && standardError !== null ? mean + 1.96 * standardError : null
  const lowerOutlierFence = q1 !== null && iqr !== null ? q1 - 1.5 * iqr : null
  const upperOutlierFence = q3 !== null && iqr !== null ? q3 + 1.5 * iqr : null
  const outlierCount = lowerOutlierFence !== null && upperOutlierFence !== null
    ? sorted.filter((v) => v < lowerOutlierFence || v > upperOutlierFence).length
    : 0

  return {
    count,
    mean,
    median,
    min,
    max,
    range,
    varianceSample,
    variancePopulation,
    stdDevSample,
    stdDevPopulation,
    standardError,
    coefficientOfVariation,
    q1,
    q3,
    iqr,
    p5: percentile(sorted, 0.05),
    p10: percentile(sorted, 0.1),
    p25: q1,
    p50: median,
    p75: q3,
    p90: percentile(sorted, 0.9),
    p95: percentile(sorted, 0.95),
    mad,
    skewness,
    excessKurtosis,
    geometricMean,
    harmonicMean,
    trimmedMean5: trimmedMean(sorted, 0.05),
    trimmedMean10: trimmedMean(sorted, 0.1),
    trimmedMean20: trimmedMean(sorted, 0.2),
    ci95Low,
    ci95High,
    lowerOutlierFence,
    upperOutlierFence,
    outlierCount,
  }
}

function fmt(n: number | null | undefined, decimals = 2): string {
  if (n === null || n === undefined || !Number.isFinite(n)) return ''
  return n.toFixed(decimals)
}

function fmtPct(n: number | null | undefined, decimals = 1): string {
  if (n === null || n === undefined || !Number.isFinite(n)) return ''
  return `${(n * 100).toFixed(decimals)}%`
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
      all: DistributionStats
      baseline: DistributionStats
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
      const baselinePrices = cityRests
        .filter((r) => r.included_in_baseline)
        .map((r) => Number(r.price_cad))
        .filter((p) => Number.isFinite(p) && p > 0)
        .sort((a, b) => a - b)

      cityStatsMap.set(city.city, {
        all: distributionStats(allPrices),
        baseline: distributionStats(baselinePrices),
        liveMin: allPrices.length > 0 ? allPrices[0] : null,
        liveMax: allPrices.length > 0 ? allPrices[allPrices.length - 1] : null,
        liveCount: allPrices.length,
        baselineCount: baselinePrices.length,
      })
    }

    const allMarketPrices = (restaurants ?? [])
      .map((r) => Number(r.price_cad))
      .filter((p) => Number.isFinite(p) && p > 0)
    const allBaselinePrices = (restaurants ?? [])
      .filter((r) => r.included_in_baseline)
      .map((r) => Number(r.price_cad))
      .filter((p) => Number.isFinite(p) && p > 0)
    const cityBaselinePrices = (cities ?? [])
      .map((city) => Number(city.baseline_median_cad ?? city.price_cad))
      .filter((p) => Number.isFinite(p) && p > 0)
    const globalMarketStats = distributionStats(allMarketPrices)
    const globalBaselineEntryStats = distributionStats(allBaselinePrices)
    const globalCityBaselineStats = distributionStats(cityBaselinePrices)

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

    // ── Section 0: Overall statistics ───────────────────────────────────────
    lines.push(csvRow(['SECTION 0 — OVERALL STATISTICAL ANALYSIS']))
    lines.push(csvRow(['Metric', 'All Restaurant Entries', 'Baseline Restaurant Entries', 'City Baseline Medians']))
    const statRows: Array<[string, keyof DistributionStats, number]> = [
      ['Count', 'count', 0],
      ['Mean (CA$)', 'mean', 2],
      ['Median / P50 (CA$)', 'median', 2],
      ['Minimum (CA$)', 'min', 2],
      ['Maximum (CA$)', 'max', 2],
      ['Range (CA$)', 'range', 2],
      ['Sample Variance', 'varianceSample', 4],
      ['Population Variance', 'variancePopulation', 4],
      ['Sample Std Dev (CA$)', 'stdDevSample', 2],
      ['Population Std Dev (CA$)', 'stdDevPopulation', 2],
      ['Standard Error (CA$)', 'standardError', 2],
      ['Coefficient of Variation', 'coefficientOfVariation', 4],
      ['P5 (CA$)', 'p5', 2],
      ['P10 (CA$)', 'p10', 2],
      ['Q1 / P25 (CA$)', 'p25', 2],
      ['Q3 / P75 (CA$)', 'p75', 2],
      ['P90 (CA$)', 'p90', 2],
      ['P95 (CA$)', 'p95', 2],
      ['IQR (CA$)', 'iqr', 2],
      ['Median Absolute Deviation (CA$)', 'mad', 2],
      ['Skewness', 'skewness', 4],
      ['Excess Kurtosis', 'excessKurtosis', 4],
      ['Geometric Mean (CA$)', 'geometricMean', 2],
      ['Harmonic Mean (CA$)', 'harmonicMean', 2],
      ['5% Trimmed Mean (CA$)', 'trimmedMean5', 2],
      ['10% Trimmed Mean (CA$)', 'trimmedMean10', 2],
      ['20% Trimmed Mean (CA$)', 'trimmedMean20', 2],
      ['95% CI Low (CA$)', 'ci95Low', 2],
      ['95% CI High (CA$)', 'ci95High', 2],
      ['Lower Outlier Fence (CA$)', 'lowerOutlierFence', 2],
      ['Upper Outlier Fence (CA$)', 'upperOutlierFence', 2],
      ['Outlier Count', 'outlierCount', 0],
    ]
    for (const [label, key, decimals] of statRows) {
      const formatValue = (stats: DistributionStats) =>
        key === 'count' || key === 'outlierCount'
          ? String(stats[key])
          : fmt(stats[key] as number | null, decimals)
      lines.push(csvRow([
        label,
        formatValue(globalMarketStats),
        formatValue(globalBaselineEntryStats),
        formatValue(globalCityBaselineStats),
      ]))
    }
    lines.push('')

    // ── Section 1: City summary ──────────────────────────────────────────────
    lines.push(csvRow(['SECTION 1 — CITY SUMMARY']))
    lines.push(
      csvRow([
        'City',
        'Country',
        'Region',
        'Baseline Median (CA$)',
        'Baseline Mean (CA$)',
        'Baseline Std Dev (CA$)',
        'Baseline Min (CA$)',
        'Baseline Max (CA$)',
        'Market Avg 5% Trimmed (CA$)',
        'Market Mean (CA$)',
        'Market Median (CA$)',
        'Market Std Dev (CA$)',
        'Market Variance',
        'Market Standard Error (CA$)',
        'Market Coefficient of Variation',
        'Market Min (CA$)',
        'Market Q1 (CA$)',
        'Market Q3 (CA$)',
        'Market IQR (CA$)',
        'Market Max (CA$)',
        'Market P10 (CA$)',
        'Market P90 (CA$)',
        'Market Skewness',
        'Market Excess Kurtosis',
        'Outlier Count',
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
          fmt(stats?.baseline.mean),
          fmt(stats?.baseline.stdDevSample),
          fmt(stats?.baseline.min),
          fmt(stats?.baseline.max),
          fmt(stats?.all.trimmedMean5),
          fmt(stats?.all.mean),
          fmt(stats?.all.median),
          fmt(stats?.all.stdDevSample),
          fmt(stats?.all.varianceSample, 4),
          fmt(stats?.all.standardError),
          fmtPct(stats?.all.coefficientOfVariation),
          fmt(city.market_min_cad ?? stats?.liveMin),
          fmt(stats?.all.q1),
          fmt(stats?.all.q3),
          fmt(stats?.all.iqr),
          fmt(city.market_max_cad ?? stats?.liveMax),
          fmt(stats?.all.p10),
          fmt(stats?.all.p90),
          fmt(stats?.all.skewness, 4),
          fmt(stats?.all.excessKurtosis, 4),
          stats?.all.outlierCount ?? 0,
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
