import PDFDocument from 'pdfkit'
import { supabase } from '@/lib/supabase-admin'
import {
  type CitySnapshot,
  distributionStats,
  money,
  num,
  percentileRank,
  rentBurden,
} from '@/lib/report-stats'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

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
  // Strip em dashes from analysis text at render time
  const rawAnalysis = String(report.analysis)
    .replace(/ — /g, ', ')
    .replace(/—/g, ', ')
  const paragraphs = rawAnalysis.split('\n\n').filter(Boolean)
  const baselinePrices = cities
    .map((c) => Number(c.price_cad))
    .filter((p) => Number.isFinite(p) && p > 0)
  const rentBurdens = cities
    .map((c) => rentBurden(c))
    .filter((b): b is number => b !== null && Number.isFinite(b))
  const entryCounts = cities
    .map((c) => Number(c.market_entry_count ?? c.baseline_entry_count ?? 0))
    .filter((n) => Number.isFinite(n) && n > 0)
  const priceStats = distributionStats(baselinePrices)
  const burdenStats = distributionStats(rentBurdens)
  const entryStats = distributionStats(entryCounts)

  /* Chart data */
  const HIST_BINS = [
    { lo: 0,  hi: 3,        label: '0-3',   count: 0 },
    { lo: 3,  hi: 6,        label: '3-6',   count: 0 },
    { lo: 6,  hi: 9,        label: '6-9',   count: 0 },
    { lo: 9,  hi: 12,       label: '9-12',  count: 0 },
    { lo: 12, hi: 15,       label: '12-15', count: 0 },
    { lo: 15, hi: 18,       label: '15-18', count: 0 },
    { lo: 18, hi: 21,       label: '18-21', count: 0 },
    { lo: 21, hi: Infinity, label: '21+',   count: 0 },
  ]
  for (const price of baselinePrices) {
    for (const bin of HIST_BINS) {
      if (price >= bin.lo && price < bin.hi) { bin.count++; break }
    }
  }
  const histMax = Math.max(...HIST_BINS.map(b => b.count), 1)

  const burdenByCity = cities
    .map(c => { const b = rentBurden(c); return b !== null ? { city: String(c.city ?? ''), burden: b } : null })
    .filter((x): x is { city: string; burden: number } => x !== null)
    .sort((a, b) => b.burden - a.burden)

  const regionPriceMap = new Map<string, number[]>()
  for (const c of cities) {
    if (!c.region || !c.price_cad) continue
    const arr = regionPriceMap.get(c.region) ?? []
    arr.push(Number(c.price_cad))
    regionPriceMap.set(c.region, arr)
  }
  const regionStats = [...regionPriceMap.entries()]
    .map(([name, prices]) => {
      const sorted = [...prices].sort((a, b) => a - b)
      const mid = Math.floor(sorted.length / 2)
      const med = sorted.length % 2 === 1 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
      return { name, count: sorted.length, min: sorted[0], max: sorted[sorted.length - 1], median: med }
    })
    .sort((a, b) => a.median - b.median)
  const regionMaxPrice = Math.max(...regionStats.map(r => r.max), 1)

  const scatterCities = cities
    .map(c => {
      const burden = rentBurden(c)
      const price = Number(c.price_cad ?? 0)
      return burden !== null && price > 0 ? { city: String(c.city ?? ''), price, burden } : null
    })
    .filter((x): x is { city: string; price: number; burden: number } => x !== null)
  const scatterMaxPrice = Math.max(...scatterCities.map(c => c.price), 1)
  const scatterMaxBurden = Math.max(...scatterCities.map(c => c.burden), 1)

  const bowlsAfterRent = cities
    .map(c => {
      const price = Number(c.price_cad ?? 0)
      const rent = Number(c.median_rent_1br_cad ?? 0)
      const salary = Number(c.median_monthly_salary_cad ?? 0)
      if (price <= 0 || salary <= 0) return null
      const bowls = Math.round((salary - rent) / price)
      return { city: String(c.city ?? ''), bowls }
    })
    .filter((x): x is { city: string; bowls: number } => x !== null)
    .sort((a, b) => b.bowls - a.bowls)
  const bowlsMax = Math.max(...bowlsAfterRent.map(c => Math.abs(c.bowls)), 1)

  /* PDF constants */
  const PW = 595.28, PH = 841.89
  const ML = 56, MR = 56, MT = 56, MB = 56
  const CW = PW - ML - MR

  const ACCENT = '#d9682a'
  const DARK   = '#111111'
  const MID    = '#555555'
  const LITE   = '#999999'
  const RULE   = '#e0ddd8'
  const BGWARM = '#f8f6f2'
  const BAR_BG = '#efe9df'

  const BOTTOM = PH - MB

  /* Build PDF */
  const doc = new PDFDocument({
    size: 'A4',
    margins: { top: MT, bottom: MB, left: ML, right: MR },
    bufferPages: true,
    info: {
      Title:   `Fried Rice Index: ${report.title}`,
      Author:  'Fried Rice Index',
      Creator: 'efr-index.vercel.app',
    },
  })

  const chunks: Buffer[] = []
  doc.on('data', (c: Buffer) => chunks.push(c))
  const done = new Promise<void>(res => doc.on('end', res))

  const hRule = (y: number, color = RULE, thickness = 0.5) =>
    doc.rect(ML, y, CW, thickness).fill(color)

  const addReportPage = () => {
    doc.addPage()
    doc.rect(0, 0, PW, PH).fill(BGWARM)
    hRule(MT, ACCENT, 1.5)
    return MT + 18
  }

  // Only adds a page when the needed block won't fit
  const ensureSpace = (currentY: number, needed: number) =>
    currentY + needed > BOTTOM ? addReportPage() : currentY

  const priceColor = (price: number) => {
    if (!priceStats.q1 || !priceStats.q3) return ACCENT
    if (price <= priceStats.q1) return '#3db870'
    if (price >= priceStats.q3) return '#b83418'
    return ACCENT
  }

  const burdenFill = (pct: number) =>
    pct <= 45 ? '#3db870' : pct <= 65 ? '#c4890f' : '#b83418'

  // Accent rule + uppercase section title + right-aligned subtitle
  const sectionHead = (title: string, subtitle: string, y: number): number => {
    hRule(y, ACCENT, 1.5)
    y += 12
    doc.font('Helvetica-Bold').fontSize(7.5).fillColor(ACCENT)
       .text(title, ML, y, { characterSpacing: 1.8 })
    if (subtitle) {
      doc.font('Helvetica').fontSize(7).fillColor(LITE)
         .text(subtitle, ML, y + 1, { width: CW, align: 'right' })
    }
    return y + 16
  }

  /* ─────────────────────────────────────── Chart drawing functions ── */

  const drawLegend = (x: number, y: number): number => {
    const items: [string, string][] = [
      ['Low quartile', '#3db870'],
      ['Middle 50%', ACCENT],
      ['High quartile', '#b83418'],
      ['Mean marker', DARK],
      ['IQR band', '#e8d8bf'],
    ]
    let lx = x
    items.forEach(([label, color]) => {
      doc.rect(lx, y + 1, 8, 8).fill(color)
      doc.font('Helvetica').fontSize(7).fillColor(MID).text(label, lx + 11, y, { width: 65 })
      lx += 78
    })
    return y + 18
  }

  const drawDistributionStrip = (x: number, y: number, width: number): number => {
    const min = priceStats.min ?? 0
    const max = priceStats.max ?? 1
    const span = Math.max(max - min, 1)
    const pos = (v: number | null) => v === null ? x : x + ((v - min) / span) * width

    doc.font('Helvetica-Bold').fontSize(7.5).fillColor(ACCENT)
       .text('BASELINE PRICE DISTRIBUTION', x, y, { characterSpacing: 1.1 })
    doc.font('Helvetica').fontSize(7).fillColor(LITE)
       .text('Whiskers, IQR band, median and mean', x, y + 1, { width, align: 'right' })
    y += 14

    const sy = y + 20
    doc.rect(x, sy, width, 7).fill(BAR_BG)
    const q1x = pos(priceStats.q1), q3x = pos(priceStats.q3)
    doc.rect(q1x, sy - 3, Math.max(q3x - q1x, 1), 13).fill('#e8d8bf')
    const mx = pos(priceStats.median), mnx = pos(priceStats.mean)
    doc.moveTo(mx, sy - 7).lineTo(mx, sy + 16).strokeColor(ACCENT).lineWidth(1.5).stroke()
    doc.moveTo(mnx, sy - 7).lineTo(mnx, sy + 16).strokeColor(DARK).lineWidth(0.9).stroke()
    const lf = pos(priceStats.lowerOutlierFence), uf = pos(priceStats.upperOutlierFence)
    doc.moveTo(lf, sy - 5).lineTo(lf, sy + 14).strokeColor(LITE).lineWidth(0.5).stroke()
    doc.moveTo(uf, sy - 5).lineTo(uf, sy + 14).strokeColor(LITE).lineWidth(0.5).stroke()

    doc.font('Helvetica').fontSize(7).fillColor(MID).text(money(min), x, sy + 21)
    doc.text(money(max), x + width - 52, sy + 21, { width: 52, align: 'right' })
    doc.font('Helvetica-Bold').fontSize(7).fillColor(ACCENT)
       .text(`Median ${money(priceStats.median)}`, mx - 34, sy - 20, { width: 68, align: 'center' })
    doc.font('Helvetica').fontSize(7).fillColor(DARK)
       .text(`Mean ${money(priceStats.mean)}`, mnx - 30, sy + 24, { width: 60, align: 'center' })

    return y + 20 + 7 + 28 // sy base + strip + labels
  }

  const drawPriceBars = (x: number, y: number, width: number, height: number): number => {
    const topCities = cities
      .filter((c) => Number.isFinite(Number(c.price_cad)) && Number(c.price_cad) > 0)
      .slice(-12).reverse()
    const maxP = Math.max(...topCities.map((c) => Number(c.price_cad)), 1)
    const rowH = height / topCities.length

    doc.font('Helvetica-Bold').fontSize(7.5).fillColor(ACCENT)
       .text('PRICIEST BASELINE CITIES', x, y, { characterSpacing: 1.1 })
    doc.font('Helvetica').fontSize(7).fillColor(LITE)
       .text('Bar = baseline price in CA$', x, y + 1, { width, align: 'right' })
    y += 14

    topCities.forEach((city, i) => {
      const ry = y + i * rowH
      const price = Number(city.price_cad ?? 0)
      const barW = (price / maxP) * (width - 120)
      doc.font('Helvetica').fontSize(7).fillColor(DARK)
         .text(String(city.city ?? ''), x, ry + 1, { width: 86, lineBreak: false })
      doc.rect(x + 90, ry + 2, width - 120, 5).fill(BAR_BG)
      doc.rect(x + 90, ry + 2, barW, 5).fill(priceColor(price))
      doc.font('Helvetica-Bold').fontSize(7).fillColor(ACCENT)
         .text(money(price), x + width - 28, ry, { width: 36, align: 'right' })
    })

    return y + height + 10
  }

  const drawHistogram = (x: number, y: number, width: number): number => {
    doc.font('Helvetica-Bold').fontSize(7.5).fillColor(ACCENT)
       .text('PRICE HISTOGRAM', x, y, { characterSpacing: 1.1 })
    doc.font('Helvetica').fontSize(7).fillColor(LITE)
       .text('Cities per CA$3 bracket', x, y + 1, { width, align: 'right' })
    y += 14

    const BAR_AREA = 52
    const binW = width / HIST_BINS.length

    HIST_BINS.forEach((bin, i) => {
      const bx = x + i * binW
      const barH = (bin.count / histMax) * BAR_AREA
      const barY = y + BAR_AREA - barH
      if (bin.count > 0) {
        doc.rect(bx + 2, barY, Math.max(binW - 4, 2), barH).fill(ACCENT)
        doc.font('Helvetica-Bold').fontSize(6.5).fillColor(DARK)
           .text(String(bin.count), bx, barY - 10, { width: binW, align: 'center' })
      }
    })
    doc.rect(x, y + BAR_AREA, width, 0.5).fill(RULE)

    HIST_BINS.forEach((bin, i) => {
      const bx = x + i * binW
      doc.font('Helvetica').fontSize(6).fillColor(LITE)
         .text(bin.label, bx, y + BAR_AREA + 5, { width: binW, align: 'center' })
    })
    doc.font('Helvetica').fontSize(6.5).fillColor(LITE)
       .text('CA$ per bowl', x, y + BAR_AREA + 16, { width: 60 })

    return y + BAR_AREA + 28
  }

  const drawRegions = (x: number, y: number, width: number): number => {
    if (regionStats.length === 0) return y
    const ROW_H = 18
    const BAR_X = x + 100
    const BAR_W = width - 100 - 76

    doc.font('Helvetica-Bold').fontSize(7.5).fillColor(ACCENT)
       .text('REGIONAL BREAKDOWN', x, y, { characterSpacing: 1.1 })
    doc.font('Helvetica').fontSize(7).fillColor(LITE)
       .text('Baseline price range per region', x, y + 1, { width, align: 'right' })
    y += 14

    regionStats.forEach((region, i) => {
      const ry = y + i * ROW_H
      doc.font('Helvetica').fontSize(7).fillColor(DARK)
         .text(region.name, x, ry + 2, { width: 96, lineBreak: false })
      doc.font('Helvetica').fontSize(6.5).fillColor(LITE)
         .text(`${region.count} ${region.count === 1 ? 'city' : 'cities'}`, x + 98, ry + 2, { width: 30, lineBreak: false })

      const leftPct = region.min / regionMaxPrice
      const widthPct = Math.max((region.max - region.min) / regionMaxPrice, 0.01)
      const medPct = region.median / regionMaxPrice

      doc.rect(BAR_X, ry + 5, BAR_W, 4).fill(BAR_BG)
      doc.rect(BAR_X + leftPct * BAR_W, ry + 5, widthPct * BAR_W, 4).fill(ACCENT)
      doc.rect(BAR_X + medPct * BAR_W - 0.5, ry + 3, 1, 8).fill(DARK)

      doc.font('Helvetica').fontSize(6).fillColor(LITE)
         .text(`${money(region.min)} / ${money(region.median)} / ${money(region.max)}`,
               BAR_X + BAR_W + 4, ry + 3, { width: 72, lineBreak: false })
    })

    return y + regionStats.length * ROW_H + 10
  }

  const drawBurdenBars = (x: number, y: number, width: number): number => {
    if (burdenByCity.length === 0) return y
    const ROW_H = 9
    const COL_W = (width - 16) / 2
    const half = Math.ceil(burdenByCity.length / 2)

    doc.font('Helvetica-Bold').fontSize(7.5).fillColor(ACCENT)
       .text('RENT BURDEN', x, y, { characterSpacing: 1.1 })
    doc.font('Helvetica').fontSize(7).fillColor(LITE)
       .text(`Monthly rent as % of median salary, ${burdenByCity.length} cities`, x, y + 1, { width, align: 'right' })
    y += 14

    burdenByCity.forEach((item, i) => {
      const col = i < half ? 0 : 1
      const row = col === 0 ? i : i - half
      const cx = x + col * (COL_W + 16)
      const ry = y + row * ROW_H

      const BAR_X = cx + 60
      const BAR_W = COL_W - 60 - 28
      const barLen = (Math.min(item.burden, 100) / 100) * BAR_W
      const bColor = burdenFill(item.burden)

      doc.font('Helvetica').fontSize(6.5).fillColor(DARK)
         .text(item.city, cx, ry, { width: 56, lineBreak: false })
      doc.rect(BAR_X, ry + 1.5, BAR_W, 4).fill(BAR_BG)
      doc.rect(BAR_X, ry + 1.5, Math.max(barLen, 0), 4).fill(bColor)
      doc.font('Helvetica-Bold').fontSize(6.5).fillColor(bColor)
         .text(`${Math.round(item.burden)}%`, BAR_X + BAR_W + 2, ry, { width: 24, align: 'right' })
    })

    return y + half * ROW_H + 14
  }

  const drawScatter = (x: number, y: number, width: number): number => {
    if (scatterCities.length < 2) return y
    const PLOT_H = 130
    const PAD_L = 24, PAD_B = 20, PAD_T = 14, PAD_R = 8
    const IW = width - PAD_L - PAD_R
    const IH = PLOT_H - PAD_T - PAD_B

    doc.font('Helvetica-Bold').fontSize(7.5).fillColor(ACCENT)
       .text('SCATTER: BASELINE PRICE vs RENT BURDEN', x, y, { characterSpacing: 1.1 })
    doc.font('Helvetica').fontSize(7).fillColor(LITE)
       .text('Each dot = one city', x, y + 1, { width, align: 'right' })
    y += 14

    const px = x + PAD_L
    const py = y + PAD_T

    // Plot background
    doc.rect(px, py, IW, IH).fill(BAR_BG)

    // Quadrant dividers
    doc.moveTo(px + IW / 2, py).lineTo(px + IW / 2, py + IH).strokeColor(RULE).lineWidth(0.5).stroke()
    doc.moveTo(px, py + IH / 2).lineTo(px + IW, py + IH / 2).strokeColor(RULE).lineWidth(0.5).stroke()

    // Axis labels
    doc.font('Helvetica').fontSize(6).fillColor(LITE)
       .text(money(0), x, py + IH + 3, { width: PAD_L, align: 'right' })
       .text(money(scatterMaxPrice), px + IW - 10, py + IH + 3, { width: 32 })
       .text('0%', x, py + IH - 4, { width: PAD_L - 2, align: 'right' })
       .text('100%', x, py - 2, { width: PAD_L - 2, align: 'right' })
    doc.font('Helvetica').fontSize(6.5).fillColor(MID)
       .text('Price (CA$)', px + IW / 2 - 20, py + IH + PAD_B - 8, { width: 40, align: 'center' })

    // City dots + abbreviated labels
    scatterCities.forEach(city => {
      const dotX = px + (city.price / scatterMaxPrice) * IW
      const dotY = py + (1 - city.burden / Math.max(scatterMaxBurden, 100)) * IH
      const dotColor = city.burden > 65 && city.price > scatterMaxPrice * 0.5 ? '#b83418'
        : city.burden > 65 ? '#c4890f'
        : '#3db870'
      doc.rect(dotX - 2, dotY - 2, 4, 4).fill(dotColor)
      const label = city.city.substring(0, 3)
      doc.font('Helvetica').fontSize(5).fillColor(DARK)
         .text(label, dotX + 3, dotY - 3, { width: 18, lineBreak: false })
    })

    return y + PLOT_H
  }

  const drawBowls = (x: number, y: number, width: number): number => {
    if (bowlsAfterRent.length === 0) return y
    const ROW_H = 9
    const COL_W = (width - 16) / 2
    const half = Math.ceil(bowlsAfterRent.length / 2)

    doc.font('Helvetica-Bold').fontSize(7.5).fillColor(ACCENT)
       .text('BOWLS AFTER RENT', x, y, { characterSpacing: 1.1 })
    doc.font('Helvetica').fontSize(7).fillColor(LITE)
       .text(`Disposable income / baseline price, ${bowlsAfterRent.length} cities`, x, y + 1, { width, align: 'right' })
    y += 14

    bowlsAfterRent.forEach((item, i) => {
      const col = i < half ? 0 : 1
      const row = col === 0 ? i : i - half
      const cx = x + col * (COL_W + 16)
      const ry = y + row * ROW_H

      const BAR_X = cx + 60
      const BAR_W = COL_W - 60 - 32
      const isNeg = item.bowls < 0
      const barLen = (Math.min(Math.abs(item.bowls), bowlsMax) / bowlsMax) * BAR_W
      const bColor = isNeg ? '#b83418' : item.bowls < 30 ? '#c4890f' : '#3db870'

      doc.font('Helvetica').fontSize(6.5).fillColor(DARK)
         .text(item.city, cx, ry, { width: 56, lineBreak: false })
      doc.rect(BAR_X, ry + 1.5, BAR_W, 4).fill(BAR_BG)
      doc.rect(BAR_X, ry + 1.5, Math.max(barLen, 0), 4).fill(bColor)
      doc.font('Helvetica-Bold').fontSize(6.5).fillColor(bColor)
         .text(`${isNeg ? '-' : ''}${Math.abs(item.bowls)}`, BAR_X + BAR_W + 2, ry, { width: 28, align: 'right' })
    })

    return y + half * ROW_H + 14
  }

  /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ PAGE 1: COVER + ANALYSIS ━━ */

  doc.rect(0, 0, PW, PH).fill(BGWARM)
  hRule(MT, ACCENT, 1.5)

  let y = MT + 18
  doc.font('Helvetica-Bold').fontSize(7.5).fillColor(ACCENT)
     .text('FRIED RICE INDEX', ML, y, { characterSpacing: 2.5 })
  y += 13
  doc.font('Helvetica').fontSize(8).fillColor(LITE)
     .text('efr-index.vercel.app', ML, y)

  y += 44
  doc.font('Helvetica-Bold').fontSize(54).fillColor(DARK).text(report.title, ML, y)
  y += 65

  if (report.subtitle) {
    doc.font('Helvetica').fontSize(13).fillColor(MID).text(report.subtitle, ML, y)
    y += 20
  }

  hRule(y)
  y += 9
  doc.font('Helvetica-Bold').fontSize(8).fillColor(DARK)
     .text('MONTHLY REPORT', ML, y, { characterSpacing: 0.8 })
  y += 13
  doc.font('Helvetica').fontSize(7.5).fillColor(LITE)
     .text(`Downloaded ${downloadedAt}`, ML, y)
  y += 24

  // Key stats strip
  doc.rect(ML, y, CW, 60).fill(BAR_BG)
  const STATS = [
    { l: 'CITIES',         v: String(report.city_count) },
    { l: 'CHEAPEST',       v: `CA$${Number(report.cheapest_price_cad).toFixed(2)}`, s: report.cheapest_city },
    { l: 'MOST EXPENSIVE', v: `CA$${Number(report.priciest_price_cad).toFixed(2)}`, s: report.priciest_city },
    { l: 'SPREAD',         v: `${report.spread_ratio}x` },
    { l: 'AVG BASELINE',   v: `CA$${Number(report.avg_baseline_cad).toFixed(2)}` },
  ]
  const SW = CW / STATS.length
  STATS.forEach((s, i) => {
    const sx = ML + i * SW + 8
    doc.font('Helvetica').fontSize(6).fillColor(LITE)
       .text(s.l, sx, y + 9, { width: SW - 12, characterSpacing: 0.6 })
    doc.font('Helvetica-Bold').fontSize(15).fillColor(ACCENT)
       .text(s.v, sx, y + 20, { width: SW - 12 })
    if (s.s) {
      doc.font('Helvetica').fontSize(7.5).fillColor(MID)
         .text(s.s, sx, y + 40, { width: SW - 12 })
    }
  })
  y += 70

  // Analysis section
  hRule(y)
  y += 12
  doc.font('Helvetica-Bold').fontSize(7.5).fillColor(ACCENT)
     .text('ANALYSIS', ML, y, { characterSpacing: 1.8 })
  y += 15
  hRule(y, '#eee9e0')
  y += 12

  paragraphs.forEach((para, i) => {
    if (y > BOTTOM - 70) y = addReportPage()
    const opts = { width: CW, align: 'justify' as const, lineGap: 3 }
    doc.font(i === 0 ? 'Helvetica-Bold' : 'Helvetica')
       .fontSize(9.5)
       .fillColor(i === 0 ? DARK : '#2d2d2d')
       .text(para, ML, y, opts)
    y = doc.y + 11
  })

  /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ EXCHANGE RATES ━━ */
  // Continue on the same page as analysis if there is room; start fresh if not
  y = ensureSpace(y, 80)
  y += 10

  y = sectionHead('EXCHANGE RATES', `CAD per 1 unit of foreign currency, ${report.title}`, y)

  const rateEntries = Object.entries(rates).sort(([a], [b]) => a.localeCompare(b))
  const RCOLS = 4, RCW = CW / RCOLS
  rateEntries.forEach(([cur, rate], i) => {
    const col = i % RCOLS, row = Math.floor(i / RCOLS)
    const rx = ML + col * RCW, ry = y + row * 15
    doc.font('Helvetica-Bold').fontSize(8).fillColor(DARK).text(cur, rx, ry, { width: 28 })
    doc.font('Helvetica').fontSize(8).fillColor(MID)
       .text(Number(rate).toFixed(5), rx + 30, ry, { width: RCW - 36 })
  })
  y += Math.ceil(rateEntries.length / RCOLS) * 15 + 16

  /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ VISUAL ANALYSIS ━━ */

  y = ensureSpace(y, 140)
  y = sectionHead('VISUAL ANALYSIS', 'Price distribution, chart legend, and city rankings', y)
  y = drawLegend(ML, y)

  // Distribution strip + price bars: two-column if enough width, else stacked
  y = ensureSpace(y, 100)
  y = drawDistributionStrip(ML, y, CW)
  y += 8

  y = ensureSpace(y, 140)
  y = drawPriceBars(ML, y, CW, 126)
  y += 16

  // Histogram
  y = ensureSpace(y, 100)
  y = drawHistogram(ML, y, CW)
  y += 8

  // Regional breakdown
  y = ensureSpace(y, regionStats.length > 0 ? Math.min(regionStats.length * 18 + 40, 200) : 40)
  y = drawRegions(ML, y, CW)
  y += 8

  // Rent burden
  y = ensureSpace(y, burdenByCity.length > 0 ? Math.min(Math.ceil(burdenByCity.length / 2) * 9 + 40, 200) : 40)
  y = drawBurdenBars(ML, y, CW)
  y += 8

  // Scatter
  y = ensureSpace(y, 170)
  y = drawScatter(ML, y, CW)
  y += 8

  // Bowls after rent
  y = ensureSpace(y, bowlsAfterRent.length > 0 ? Math.min(Math.ceil(bowlsAfterRent.length / 2) * 9 + 40, 200) : 40)
  y = drawBowls(ML, y, CW)
  y += 8

  /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ STATISTICAL ANALYSIS ━━ */

  y = ensureSpace(y, 80)
  y = sectionHead('STATISTICAL ANALYSIS', 'Baseline price, rent burden, and entry count distributions', y)

  const statRows: Array<[string, string, string, string]> = [
    ['Sample size', String(priceStats.count), String(burdenStats.count), String(entryStats.count)],
    ['Mean', money(priceStats.mean), `${num(burdenStats.mean, 1)}%`, num(entryStats.mean, 1)],
    ['Median', money(priceStats.median), `${num(burdenStats.median, 1)}%`, num(entryStats.median, 1)],
    ['Min / max', `${money(priceStats.min)} / ${money(priceStats.max)}`, `${num(burdenStats.min, 1)}% / ${num(burdenStats.max, 1)}%`, `${num(entryStats.min, 0)} / ${num(entryStats.max, 0)}`],
    ['Range', money(priceStats.range), `${num(burdenStats.range, 1)} pts`, num(entryStats.range, 0)],
    ['Std dev', money(priceStats.stdDevSample), `${num(burdenStats.stdDevSample, 1)} pts`, num(entryStats.stdDevSample, 1)],
    ['Variance', num(priceStats.varianceSample, 3), num(burdenStats.varianceSample, 3), num(entryStats.varianceSample, 3)],
    ['Std error', money(priceStats.standardError), `${num(burdenStats.standardError, 1)} pts`, num(entryStats.standardError, 1)],
    ['Coeff. of variation', `${num((priceStats.coefficientOfVariation ?? 0) * 100, 1)}%`, `${num((burdenStats.coefficientOfVariation ?? 0) * 100, 1)}%`, `${num((entryStats.coefficientOfVariation ?? 0) * 100, 1)}%`],
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
    { h: 'MEASURE',        w: 104 },
    { h: 'BASELINE PRICE', w: 142 },
    { h: 'RENT BURDEN',    w: 118 },
    { h: 'ENTRY COUNT',    w: CW - 104 - 142 - 118 },
  ]

  y = ensureSpace(y, 28)
  doc.rect(ML, y, CW, 14).fill(BAR_BG)
  let sx = ML
  SCOLS.forEach((c) => {
    doc.font('Helvetica-Bold').fontSize(6).fillColor(LITE)
       .text(c.h, sx + 3, y + 3.5, { width: c.w - 4, characterSpacing: 0.4 })
    sx += c.w
  })
  y += 14

  statRows.forEach((row, i) => {
    if (y > BOTTOM - 18) y = addReportPage()
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
  y += 16

  /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ CITY TABLE ━━ */

  y = ensureSpace(y, 70)
  y = sectionHead('CITY DATA SNAPSHOT', `${report.city_count} cities, cheapest to most expensive`, y)

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

  const drawTableHeader = (hy: number) => {
    doc.rect(ML, hy, CW, 14).fill(BAR_BG)
    let cx = ML
    COLS.forEach(c => {
      doc.font('Helvetica-Bold').fontSize(6).fillColor(LITE)
         .text(c.h, cx + 3, hy + 3.5, { width: c.w - 4, characterSpacing: 0.4 })
      cx += c.w
    })
    return hy + 14
  }

  y = drawTableHeader(y)

  cities.forEach((city, i) => {
    if (y > BOTTOM - 18) {
      y = drawTableHeader(addReportPage())
    }
    if (i % 2 === 0) doc.rect(ML, y, CW, 13).fill('#f3f0ea')

    const price = Number(city.price_cad ?? 0)
    const rent = Number(city.median_rent_1br_cad ?? 0)
    const salary = Number(city.median_monthly_salary_cad ?? 0)
    const burden = rent && salary ? `${Math.round((rent / salary) * 100)}%` : '-'
    const zScore = priceStats.stdDevSample && priceStats.mean !== null
      ? (price - priceStats.mean) / priceStats.stdDevSample : null
    const entries = Number(city.market_entry_count ?? city.baseline_entry_count ?? 0)

    const cells = [
      String(i + 1),
      String(city.city ?? ''),
      `CA$${price.toFixed(2)}`,
      zScore !== null ? zScore.toFixed(2) : '-',
      `${percentileRank(i, cities.length)}`,
      burden,
      entries ? String(entries) : '-',
      String(city.data_quality_label ?? '-'),
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

  /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ PAGE FOOTERS ━━ */
  const range = doc.bufferedPageRange()
  for (let p = 0; p < range.count; p++) {
    doc.switchToPage(range.start + p)
    hRule(BOTTOM + 8, RULE)
    doc.font('Helvetica').fontSize(7).fillColor(LITE)
       .text('Fried Rice Index · efr-index.vercel.app', ML, BOTTOM + 14, { width: CW / 2 })
    doc.text(`Page ${p + 1} of ${range.count}`, ML, BOTTOM + 14, { width: CW, align: 'right' })
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
