import PDFDocument from 'pdfkit'
import { supabase } from '@/lib/supabase-admin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type CitySnapshot = {
  city?: string | null
  country?: string | null
  region?: string | null
  price_cad?: number | null
  median_rent_1br_cad?: number | null
  median_monthly_salary_cad?: number | null
  baseline_entry_count?: number | null
  market_entry_count?: number | null
  data_quality_label?: string | null
}

type DistributionStats = {
  count: number
  mean: number | null
  median: number | null
  min: number | null
  max: number | null
  range: number | null
  varianceSample: number | null
  stdDevSample: number | null
  standardError: number | null
  coefficientOfVariation: number | null
  q1: number | null
  q3: number | null
  iqr: number | null
  p10: number | null
  p90: number | null
  p95: number | null
  mad: number | null
  skewness: number | null
  excessKurtosis: number | null
  trimmedMean5: number | null
  ci95Low: number | null
  ci95High: number | null
  lowerOutlierFence: number | null
  upperOutlierFence: number | null
  outlierCount: number
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

function trimmedMean(sortedValues: number[], trimFraction = 0.05): number | null {
  if (sortedValues.length === 0) return null
  const k = Math.round(sortedValues.length * trimFraction)
  const trimmed = k > 0 ? sortedValues.slice(k, sortedValues.length - k) : sortedValues
  const source = trimmed.length ? trimmed : sortedValues
  return source.reduce((s, v) => s + v, 0) / source.length
}

function distributionStats(values: number[]): DistributionStats {
  const sorted = values.filter((v) => Number.isFinite(v) && v > 0).sort((a, b) => a - b)
  const count = sorted.length
  const mean = count ? sorted.reduce((s, v) => s + v, 0) / count : null
  const median = percentile(sorted, 0.5)
  const min = count ? sorted[0] : null
  const max = count ? sorted[count - 1] : null
  const range = min !== null && max !== null ? max - min : null
  const varianceSample = mean !== null && count > 1
    ? sorted.reduce((s, v) => s + (v - mean) ** 2, 0) / (count - 1)
    : null
  const stdDevSample = varianceSample !== null ? Math.sqrt(varianceSample) : null
  const standardError = stdDevSample !== null ? stdDevSample / Math.sqrt(count) : null
  const coefficientOfVariation = stdDevSample !== null && mean !== null && mean !== 0 ? stdDevSample / mean : null
  const q1 = percentile(sorted, 0.25)
  const q3 = percentile(sorted, 0.75)
  const iqr = q1 !== null && q3 !== null ? q3 - q1 : null
  const deviations = median !== null ? sorted.map((v) => Math.abs(v - median)).sort((a, b) => a - b) : []
  const mad = percentile(deviations, 0.5)
  const populationStdDev = mean !== null && count > 0
    ? Math.sqrt(sorted.reduce((s, v) => s + (v - mean) ** 2, 0) / count)
    : null
  const skewness = mean !== null && populationStdDev !== null && populationStdDev > 0 && count > 2
    ? sorted.reduce((s, v) => s + ((v - mean) / populationStdDev) ** 3, 0) / count
    : null
  const excessKurtosis = mean !== null && populationStdDev !== null && populationStdDev > 0 && count > 3
    ? sorted.reduce((s, v) => s + ((v - mean) / populationStdDev) ** 4, 0) / count - 3
    : null
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
    stdDevSample,
    standardError,
    coefficientOfVariation,
    q1,
    q3,
    iqr,
    p10: percentile(sorted, 0.1),
    p90: percentile(sorted, 0.9),
    p95: percentile(sorted, 0.95),
    mad,
    skewness,
    excessKurtosis,
    trimmedMean5: trimmedMean(sorted, 0.05),
    ci95Low,
    ci95High,
    lowerOutlierFence,
    upperOutlierFence,
    outlierCount,
  }
}

function money(n: number | null | undefined) {
  return n === null || n === undefined || !Number.isFinite(n) ? '-' : `CA$${n.toFixed(2)}`
}

function num(n: number | null | undefined, decimals = 2) {
  return n === null || n === undefined || !Number.isFinite(n) ? '-' : n.toFixed(decimals)
}

export async function GET(_req: Request, ctx: RouteContext<'/api/reports/[month]/download'>) {
  const { month } = await ctx.params

  const { data: report, error } = await supabase
    .from('monthly_reports')
    .select('*')
    .eq('month', month)
    .eq('is_published', true)
    .single()

  if (error || !report) return Response.json({ error: 'Report not found' }, { status: 404 })

  const now = new Date()
  const downloadedAt = now.toLocaleString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    timeZoneName: 'short',
  })

  const cities = (Array.isArray(report.city_snapshot) ? [...report.city_snapshot] : [])
    .sort((a: CitySnapshot, b: CitySnapshot) => Number(a.price_cad ?? 0) - Number(b.price_cad ?? 0)) as CitySnapshot[]
  const rates = (report.exchange_rates_snapshot ?? {}) as Record<string, number>
  const paragraphs = String(report.analysis).split('\n\n').filter(Boolean)
  const baselinePrices = cities
    .map((city) => Number(city.price_cad))
    .filter((price) => Number.isFinite(price) && price > 0)
  const rentBurdens = cities
    .map((city) => {
      const rent = Number(city.median_rent_1br_cad ?? 0)
      const salary = Number(city.median_monthly_salary_cad ?? 0)
      return rent > 0 && salary > 0 ? (rent / salary) * 100 : null
    })
    .filter((burden): burden is number => burden !== null && Number.isFinite(burden))
  const entryCounts = cities
    .map((city) => Number(city.market_entry_count ?? city.baseline_entry_count ?? 0))
    .filter((count) => Number.isFinite(count) && count > 0)
  const priceStats = distributionStats(baselinePrices)
  const burdenStats = distributionStats(rentBurdens)
  const entryStats = distributionStats(entryCounts)

  /* ── constants ──────────────────────────────────────────────────────── */
  const PW = 595.28, PH = 841.89
  const ML = 56, MR = 56, MT = 56, MB = 56
  const CW = PW - ML - MR

  const ACCENT = '#d9682a'
  const DARK   = '#111111'
  const MID    = '#555555'
  const LITE   = '#999999'
  const RULE   = '#e0ddd8'
  const BGWARM = '#f8f6f2'

  /* ── build PDF ──────────────────────────────────────────────────────── */
  const doc = new PDFDocument({
    size: 'A4',
    margins: { top: MT, bottom: MB, left: ML, right: MR },
    bufferPages: true,
    info: {
      Title:   `Fried Rice Index — ${report.title}`,
      Author:  'Fried Rice Index',
      Creator: 'efr-index.vercel.app',
    },
  })

  const chunks: Buffer[] = []
  doc.on('data', (c: Buffer) => chunks.push(c))
  const done = new Promise<void>(res => doc.on('end', res))

  const hRule = (y: number, color = RULE, thickness = 0.5) =>
    doc.rect(ML, y, CW, thickness).fill(color)

  /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ PAGE 1: COVER + ANALYSIS ━━ */

  // Warm background tint
  doc.rect(0, 0, PW, PH).fill(BGWARM)

  // Accent bar
  doc.rect(ML, MT, CW, 3).fill(ACCENT)

  // Branding
  let y = MT + 18
  doc.font('Helvetica-Bold').fontSize(7.5).fillColor(ACCENT)
     .text('FRIED RICE INDEX', ML, y, { characterSpacing: 2.5 })
  y += 13
  doc.font('Helvetica').fontSize(8).fillColor(LITE)
     .text('efr-index.vercel.app', ML, y)

  // Month title
  y += 44
  doc.font('Helvetica-Bold').fontSize(54).fillColor(DARK)
     .text(report.title, ML, y)
  y += 65

  // Subtitle
  if (report.subtitle) {
    doc.font('Helvetica').fontSize(13).fillColor(MID).text(report.subtitle, ML, y)
    y += 20
  }

  // Report type + download timestamp
  hRule(y)
  y += 9
  doc.font('Helvetica-Bold').fontSize(8).fillColor(DARK)
     .text('MONTHLY REPORT', ML, y, { characterSpacing: 0.8 })
  y += 13
  doc.font('Helvetica').fontSize(7.5).fillColor(LITE)
     .text(`Downloaded ${downloadedAt}`, ML, y)
  y += 24

  // Stats strip
  const statY = y
  doc.rect(ML, statY, CW, 60).fill('#efe9df')

  const STATS = [
    { l: 'CITIES',        v: String(report.city_count) },
    { l: 'CHEAPEST',      v: `CA$${Number(report.cheapest_price_cad).toFixed(2)}`, s: report.cheapest_city },
    { l: 'MOST EXPENSIVE',v: `CA$${Number(report.priciest_price_cad).toFixed(2)}`, s: report.priciest_city },
    { l: 'SPREAD',        v: `${report.spread_ratio}×` },
    { l: 'AVG BASELINE',  v: `CA$${Number(report.avg_baseline_cad).toFixed(2)}` },
  ]
  const SW = CW / STATS.length
  STATS.forEach((s, i) => {
    const sx = ML + i * SW + 8
    doc.font('Helvetica').fontSize(6).fillColor(LITE)
       .text(s.l, sx, statY + 9, { width: SW - 12, characterSpacing: 0.6 })
    doc.font('Helvetica-Bold').fontSize(15).fillColor(ACCENT)
       .text(s.v, sx, statY + 20, { width: SW - 12 })
    if (s.s) {
      doc.font('Helvetica').fontSize(7.5).fillColor(MID)
         .text(s.s, sx, statY + 40, { width: SW - 12 })
    }
  })
  y = statY + 70

  // Analysis heading
  hRule(y)
  y += 12
  doc.font('Helvetica-Bold').fontSize(7.5).fillColor(ACCENT)
     .text('ANALYSIS', ML, y, { characterSpacing: 1.8 })
  y += 15
  hRule(y, '#eee9e0')
  y += 12

  // Paragraphs — each properly wrapped
  paragraphs.forEach((para, i) => {
    if (y > PH - MB - 70) {
      doc.addPage()
      doc.rect(0, 0, PW, PH).fill(BGWARM)
      hRule(MT, ACCENT, 1.5)
      y = MT + 18
    }
    const opts = { width: CW, align: 'justify' as const, lineGap: 3 }
    doc.font(i === 0 ? 'Helvetica-Bold' : 'Helvetica')
       .fontSize(9.5)
       .fillColor(i === 0 ? DARK : '#2d2d2d')
       .text(para, ML, y, opts)
    y = doc.y + 11
  })

  /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ PAGE 2: DATA ━━━━━━ */
  doc.addPage()
  doc.rect(0, 0, PW, PH).fill(BGWARM)
  hRule(MT, ACCENT, 1.5)
  y = MT + 18

  /* Exchange rates */
  doc.font('Helvetica-Bold').fontSize(7.5).fillColor(ACCENT)
     .text('EXCHANGE RATES', ML, y, { characterSpacing: 1.8 })
  doc.font('Helvetica').fontSize(7.5).fillColor(LITE)
     .text(`CAD per 1 unit · ${report.title}`, ML + 120, y + 1)
  y += 15
  hRule(y, '#eee9e0')
  y += 10

  const rateEntries = Object.entries(rates).sort(([a], [b]) => a.localeCompare(b))
  const RCOLS = 4, RCW = CW / RCOLS
  rateEntries.forEach(([cur, rate], i) => {
    const col = i % RCOLS
    const row = Math.floor(i / RCOLS)
    const rx = ML + col * RCW
    const ry = y + row * 15
    doc.font('Helvetica-Bold').fontSize(8).fillColor(DARK)
       .text(cur, rx, ry, { width: 28 })
    doc.font('Helvetica').fontSize(8).fillColor(MID)
       .text(Number(rate).toFixed(5), rx + 30, ry, { width: RCW - 36 })
  })
  y += Math.ceil(rateEntries.length / RCOLS) * 15 + 20

  /* Statistical analysis */
  hRule(y, ACCENT, 1.5)
  y += 12

  doc.font('Helvetica-Bold').fontSize(7.5).fillColor(ACCENT)
     .text('STATISTICAL ANALYSIS', ML, y, { characterSpacing: 1.8 })
  doc.font('Helvetica').fontSize(7.5).fillColor(LITE)
     .text('City baseline distribution, rent burden, and sample depth', ML + 160, y + 1)
  y += 16

  const statRows: Array<[string, string, string, string]> = [
    ['Sample size', String(priceStats.count), String(burdenStats.count), String(entryStats.count)],
    ['Mean', money(priceStats.mean), `${num(burdenStats.mean, 1)}%`, num(entryStats.mean, 1)],
    ['Median', money(priceStats.median), `${num(burdenStats.median, 1)}%`, num(entryStats.median, 1)],
    ['Min / Max', `${money(priceStats.min)} / ${money(priceStats.max)}`, `${num(burdenStats.min, 1)}% / ${num(burdenStats.max, 1)}%`, `${num(entryStats.min, 0)} / ${num(entryStats.max, 0)}`],
    ['Range', money(priceStats.range), `${num(burdenStats.range, 1)} pts`, num(entryStats.range, 0)],
    ['Std dev', money(priceStats.stdDevSample), `${num(burdenStats.stdDevSample, 1)} pts`, num(entryStats.stdDevSample, 1)],
    ['Variance', num(priceStats.varianceSample, 3), num(burdenStats.varianceSample, 3), num(entryStats.varianceSample, 3)],
    ['Std error', money(priceStats.standardError), `${num(burdenStats.standardError, 1)} pts`, num(entryStats.standardError, 1)],
    ['Coefficient var.', `${num((priceStats.coefficientOfVariation ?? 0) * 100, 1)}%`, `${num((burdenStats.coefficientOfVariation ?? 0) * 100, 1)}%`, `${num((entryStats.coefficientOfVariation ?? 0) * 100, 1)}%`],
    ['Q1 / Q3', `${money(priceStats.q1)} / ${money(priceStats.q3)}`, `${num(burdenStats.q1, 1)}% / ${num(burdenStats.q3, 1)}%`, `${num(entryStats.q1, 1)} / ${num(entryStats.q3, 1)}`],
    ['IQR', money(priceStats.iqr), `${num(burdenStats.iqr, 1)} pts`, num(entryStats.iqr, 1)],
    ['P10 / P90', `${money(priceStats.p10)} / ${money(priceStats.p90)}`, `${num(burdenStats.p10, 1)}% / ${num(burdenStats.p90, 1)}%`, `${num(entryStats.p10, 1)} / ${num(entryStats.p90, 1)}`],
    ['P95', money(priceStats.p95), `${num(burdenStats.p95, 1)}%`, num(entryStats.p95, 1)],
    ['MAD', money(priceStats.mad), `${num(burdenStats.mad, 1)} pts`, num(entryStats.mad, 1)],
    ['Skewness', num(priceStats.skewness, 3), num(burdenStats.skewness, 3), num(entryStats.skewness, 3)],
    ['Excess kurtosis', num(priceStats.excessKurtosis, 3), num(burdenStats.excessKurtosis, 3), num(entryStats.excessKurtosis, 3)],
    ['5% trimmed mean', money(priceStats.trimmedMean5), `${num(burdenStats.trimmedMean5, 1)}%`, num(entryStats.trimmedMean5, 1)],
    ['95% CI', `${money(priceStats.ci95Low)} - ${money(priceStats.ci95High)}`, `${num(burdenStats.ci95Low, 1)}% - ${num(burdenStats.ci95High, 1)}%`, `${num(entryStats.ci95Low, 1)} - ${num(entryStats.ci95High, 1)}`],
    ['Outlier fences', `${money(priceStats.lowerOutlierFence)} / ${money(priceStats.upperOutlierFence)}`, `${num(burdenStats.lowerOutlierFence, 1)}% / ${num(burdenStats.upperOutlierFence, 1)}%`, `${num(entryStats.lowerOutlierFence, 1)} / ${num(entryStats.upperOutlierFence, 1)}`],
    ['Outlier count', String(priceStats.outlierCount), String(burdenStats.outlierCount), String(entryStats.outlierCount)],
  ]

  const SCOLS = [
    { h: 'MEASURE', w: 104 },
    { h: 'BASELINE PRICE', w: 142 },
    { h: 'RENT BURDEN', w: 118 },
    { h: 'ENTRY COUNT', w: CW - 104 - 142 - 118 },
  ]

  doc.rect(ML, y, CW, 14).fill('#efe9df')
  let sx = ML
  SCOLS.forEach((c) => {
    doc.font('Helvetica-Bold').fontSize(6).fillColor(LITE)
       .text(c.h, sx + 3, y + 3.5, { width: c.w - 4, characterSpacing: 0.4 })
    sx += c.w
  })
  y += 14

  statRows.forEach((row, i) => {
    if (y > PH - MB - 18) {
      doc.addPage()
      doc.rect(0, 0, PW, PH).fill(BGWARM)
      hRule(MT, ACCENT, 1.5)
      y = MT + 18
    }
    if (i % 2 === 0) doc.rect(ML, y, CW, 13).fill('#f3f0ea')
    sx = ML
    row.forEach((cell, ci) => {
      doc.font(ci === 0 ? 'Helvetica-Bold' : 'Helvetica').fontSize(7)
         .fillColor(ci === 1 ? ACCENT : DARK)
         .text(cell, sx + 3, y + 2.5, { width: SCOLS[ci].w - 4, lineBreak: false })
      sx += SCOLS[ci].w
    })
    y += 13
  })

  y += 20

  /* City table */
  hRule(y, ACCENT, 1.5)
  y += 12

  doc.font('Helvetica-Bold').fontSize(7.5).fillColor(ACCENT)
     .text('CITY DATA SNAPSHOT', ML, y, { characterSpacing: 1.8 })
  doc.font('Helvetica').fontSize(7.5).fillColor(LITE)
     .text(`${report.city_count} cities · cheapest to most expensive`, ML + 160, y + 1)
  y += 16

  const COLS = [
    { h: '#',           w: 22 },
    { h: 'CITY',        w: 112 },
    { h: 'PRICE (CA$)', w: 58 },
    { h: 'Z-SCORE',     w: 48 },
    { h: 'PCTILE',      w: 44 },
    { h: 'RENT BURDEN', w: 58 },
    { h: 'ENTRIES',     w: 48 },
    { h: 'QUALITY',     w: CW - 22 - 112 - 58 - 48 - 44 - 58 - 48 },
  ]

  const drawHeader = (hy: number) => {
    doc.rect(ML, hy, CW, 14).fill('#efe9df')
    let cx = ML
    COLS.forEach(c => {
      doc.font('Helvetica-Bold').fontSize(6).fillColor(LITE)
         .text(c.h, cx + 3, hy + 3.5, { width: c.w - 4, characterSpacing: 0.4 })
      cx += c.w
    })
    return hy + 14
  }

  y = drawHeader(y)

  cities.forEach((city, i) => {
    if (y > PH - MB - 18) {
      doc.addPage()
      doc.rect(0, 0, PW, PH).fill(BGWARM)
      hRule(MT, ACCENT, 1.5)
      y = drawHeader(MT + 14)
    }
    if (i % 2 === 0) doc.rect(ML, y, CW, 13).fill('#f3f0ea')

    const price = Number(city.price_cad ?? 0)
    const rent = Number(city.median_rent_1br_cad ?? 0)
    const salary = Number(city.median_monthly_salary_cad ?? 0)
    const burden = rent && salary ? `${Math.round((rent / salary) * 100)}%` : '—'
    const zScore = priceStats.stdDevSample && priceStats.mean !== null
      ? (price - priceStats.mean) / priceStats.stdDevSample
      : null
    const percentileRank = cities.length > 1 ? Math.round((i / (cities.length - 1)) * 100) : 100
    const entries = Number(city.market_entry_count ?? city.baseline_entry_count ?? 0)

    const cells = [
      String(i + 1),
      String(city.city ?? ''),
      `CA$${price.toFixed(2)}`,
      zScore !== null ? zScore.toFixed(2) : '—',
      `${percentileRank}`,
      burden,
      entries ? String(entries) : '—',
      String(city.data_quality_label ?? '—'),
    ]

    let cx = ML
    cells.forEach((cell, ci) => {
      doc.font('Helvetica').fontSize(7.5)
         .fillColor(ci === 2 ? ACCENT : DARK)
         .text(cell, cx + 3, y + 2.5, { width: COLS[ci].w - 4, lineBreak: false })
      cx += COLS[ci].w
    })
    y += 13
  })

  /* Footers on every page */
  const range = doc.bufferedPageRange()
  for (let p = 0; p < range.count; p++) {
    doc.switchToPage(range.start + p)
    hRule(PH - MB + 8, RULE)
    doc.font('Helvetica').fontSize(7).fillColor(LITE)
       .text('Fried Rice Index · efr-index.vercel.app', ML, PH - MB + 14, { width: CW / 2 })
    doc.text(`Page ${p + 1} of ${range.count}`, ML, PH - MB + 14, { width: CW, align: 'right' })
  }

  doc.end()
  await done

  return new Response(Buffer.concat(chunks), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="fried-rice-index-${month}.pdf"`,
      'Cache-Control': 'no-store',
    },
  })
}
