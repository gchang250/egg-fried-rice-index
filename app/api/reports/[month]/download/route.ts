import path from 'node:path'
import fs from 'node:fs'
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

/* ── Design system (mirrors app/globals.css + the landing page) ──────── */
const BG       = '#0a0a0c'
const SURFACE  = '#101013'
const SURFACE2 = '#15151a'
const LINE     = '#222228'
const LINE_SOFT = '#1a1a1f'
const T1 = '#ece9e2'
const T2 = '#a8a8b0'
const T3 = '#8d8d96'
const T4 = '#55555e'
const GOLD   = '#c8a862'   // accent
const JADE   = '#76a98c'   // affordable / low end
const COPPER = '#c0674e'   // expensive / high end
const TRACK  = '#1e1e24'   // bar track on dark

const FONT_DIR = path.join(process.cwd(), 'lib', 'report-fonts')

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
  // Label only the four extreme cities to avoid an unreadable cluster
  const scatterLabelSet = new Set<string>()
  if (scatterCities.length) {
    const byPrice = [...scatterCities].sort((a, b) => a.price - b.price)
    const byBurden = [...scatterCities].sort((a, b) => a.burden - b.burden)
    ;[byPrice[0], byPrice[byPrice.length - 1], byBurden[0], byBurden[byBurden.length - 1]]
      .forEach(c => c && scatterLabelSet.add(c.city))
  }

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
  const ML = 54, MR = 54, MT = 54, MB = 52
  const CW = PW - ML - MR
  const BOTTOM = PH - MB
  const FOOT_Y = PH - 34

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

  /* Fonts — embed Geist (matches the site); fall back to the built-in
     Helvetica family if the vendored .ttf files are unavailable. */
  const F = { body: 'Helvetica', med: 'Helvetica', semi: 'Helvetica-Bold', mono: 'Courier', monoMed: 'Courier-Bold' }
  try {
    doc.registerFont('Geist',      fs.readFileSync(path.join(FONT_DIR, 'Geist-Regular.ttf')))
    doc.registerFont('Geist-Med',  fs.readFileSync(path.join(FONT_DIR, 'Geist-Medium.ttf')))
    doc.registerFont('Geist-Semi', fs.readFileSync(path.join(FONT_DIR, 'Geist-SemiBold.ttf')))
    doc.registerFont('Mono',       fs.readFileSync(path.join(FONT_DIR, 'GeistMono-Regular.ttf')))
    doc.registerFont('Mono-Med',   fs.readFileSync(path.join(FONT_DIR, 'GeistMono-Medium.ttf')))
    F.body = 'Geist'; F.med = 'Geist-Med'; F.semi = 'Geist-Semi'; F.mono = 'Mono'; F.monoMed = 'Mono-Med'
  } catch {
    // keep Helvetica/Courier fallback
  }

  const chunks: Buffer[] = []
  doc.on('data', (c: Buffer) => chunks.push(c))
  const done = new Promise<void>(res => doc.on('end', res))

  // Paint a dark background on every page (incl. any auto-added overflow page)
  doc.on('pageAdded', () => {
    doc.save()
    doc.rect(0, 0, PW, PH).fill(BG)
    doc.restore()
  })

  const hRule = (y: number, color = LINE, thickness = 0.5) =>
    doc.rect(ML, y, CW, thickness).fill(color)

  // Deliberate new content page: dark bg (via handler) + gold top rule
  const addReportPage = () => {
    doc.addPage()
    doc.rect(ML, MT, CW, 1.5).fill(GOLD)
    return MT + 16
  }

  // Only adds a page when the needed block won't fit
  const ensureSpace = (currentY: number, needed: number) =>
    currentY + needed > BOTTOM ? addReportPage() : currentY

  // Translucent fill helper (for soft bands / tints on the dark canvas)
  const softFill = (x: number, y: number, w: number, h: number, color: string, alpha: number) => {
    doc.save(); doc.fillOpacity(alpha); doc.rect(x, y, w, h).fill(color); doc.fillOpacity(1); doc.restore()
  }

  const priceColor = (price: number) => {
    if (!priceStats.q1 || !priceStats.q3) return GOLD
    if (price <= priceStats.q1) return JADE
    if (price >= priceStats.q3) return COPPER
    return GOLD
  }
  const burdenFill = (pct: number) => (pct <= 45 ? JADE : pct <= 65 ? GOLD : COPPER)

  // Gold rule + mono uppercase section title + right-aligned subtitle
  const sectionHead = (title: string, subtitle: string, y: number): number => {
    hRule(y, GOLD, 1.5)
    y += 13
    doc.font(F.monoMed).fontSize(8).fillColor(GOLD)
       .text(title.toUpperCase(), ML, y, { characterSpacing: 1.4, lineBreak: false })
    if (subtitle) {
      doc.font(F.body).fontSize(7.5).fillColor(T3)
         .text(subtitle, ML, y + 1, { width: CW, align: 'right', lineBreak: false })
    }
    return y + 18
  }

  // Small mono caption used above each chart
  const chartHead = (label: string, note: string, x: number, y: number, width: number) => {
    doc.font(F.monoMed).fontSize(7.5).fillColor(GOLD)
       .text(label.toUpperCase(), x, y, { characterSpacing: 1, lineBreak: false })
    doc.font(F.body).fontSize(7).fillColor(T3)
       .text(note, x, y + 0.5, { width, align: 'right', lineBreak: false })
    return y + 15
  }

  /* ─────────────────────────────────────── Chart drawing functions ── */

  const drawLegend = (x: number, y: number): number => {
    const items: [string, string][] = [
      ['Low quartile', JADE],
      ['Middle 50%', GOLD],
      ['High quartile', COPPER],
      ['Mean marker', T1],
      ['IQR band', '#4a4230'],
    ]
    let lx = x
    items.forEach(([label, color]) => {
      doc.rect(lx, y + 1, 8, 8).fill(color)
      doc.font(F.body).fontSize(7).fillColor(T2).text(label, lx + 11, y, { width: 66, lineBreak: false })
      lx += 80
    })
    return y + 18
  }

  const drawDistributionStrip = (x: number, y: number, width: number): number => {
    const min = priceStats.min ?? 0
    const max = priceStats.max ?? 1
    const span = Math.max(max - min, 1)
    const pos = (v: number | null) => v === null ? x : x + ((v - min) / span) * width

    y = chartHead('Baseline price distribution', 'Whiskers, IQR band, median and mean', x, y, width)

    const sy = y + 20
    doc.rect(x, sy, width, 7).fill(TRACK)
    const q1x = pos(priceStats.q1), q3x = pos(priceStats.q3)
    softFill(q1x, sy - 3, Math.max(q3x - q1x, 1), 13, GOLD, 0.22)
    const mx = pos(priceStats.median), mnx = pos(priceStats.mean)
    doc.moveTo(mx, sy - 7).lineTo(mx, sy + 16).strokeColor(GOLD).lineWidth(1.5).stroke()
    doc.moveTo(mnx, sy - 7).lineTo(mnx, sy + 16).strokeColor(T1).lineWidth(0.9).stroke()
    const lf = pos(priceStats.lowerOutlierFence), uf = pos(priceStats.upperOutlierFence)
    doc.moveTo(lf, sy - 5).lineTo(lf, sy + 14).strokeColor(T4).lineWidth(0.5).stroke()
    doc.moveTo(uf, sy - 5).lineTo(uf, sy + 14).strokeColor(T4).lineWidth(0.5).stroke()

    doc.font(F.body).fontSize(7).fillColor(T2).text(money(min), x, sy + 21, { lineBreak: false })
    doc.text(money(max), x + width - 52, sy + 21, { width: 52, align: 'right', lineBreak: false })
    doc.font(F.med).fontSize(7).fillColor(GOLD)
       .text(`Median ${money(priceStats.median)}`, mx - 34, sy - 20, { width: 68, align: 'center', lineBreak: false })
    doc.font(F.body).fontSize(7).fillColor(T1)
       .text(`Mean ${money(priceStats.mean)}`, mnx - 30, sy + 24, { width: 60, align: 'center', lineBreak: false })

    return y + 20 + 7 + 28
  }

  const drawPriceBars = (x: number, y: number, width: number, height: number): number => {
    const topCities = cities
      .filter((c) => Number.isFinite(Number(c.price_cad)) && Number(c.price_cad) > 0)
      .slice(-12).reverse()
    const maxP = Math.max(...topCities.map((c) => Number(c.price_cad)), 1)
    const rowH = height / topCities.length

    y = chartHead('Priciest baseline cities', 'Bar = baseline price in CA$', x, y, width)

    topCities.forEach((city, i) => {
      const ry = y + i * rowH
      const price = Number(city.price_cad ?? 0)
      const barW = (price / maxP) * (width - 120)
      doc.font(F.body).fontSize(7).fillColor(T2)
         .text(String(city.city ?? ''), x, ry + 1, { width: 86, lineBreak: false })
      doc.rect(x + 90, ry + 2, width - 120, 5).fill(TRACK)
      doc.rect(x + 90, ry + 2, barW, 5).fill(priceColor(price))
      doc.font(F.med).fontSize(7).fillColor(GOLD)
         .text(money(price), x + width - 36, ry, { width: 44, align: 'right', lineBreak: false })
    })

    return y + height + 10
  }

  const drawHistogram = (x: number, y: number, width: number): number => {
    y = chartHead('Price histogram', 'Cities per CA$3 bracket', x, y, width)

    const BAR_AREA = 52
    const binW = width / HIST_BINS.length

    HIST_BINS.forEach((bin, i) => {
      const bx = x + i * binW
      const barH = (bin.count / histMax) * BAR_AREA
      const barY = y + BAR_AREA - barH
      if (bin.count > 0) {
        doc.rect(bx + 2, barY, Math.max(binW - 4, 2), barH).fill(GOLD)
        doc.font(F.med).fontSize(6.5).fillColor(T1)
           .text(String(bin.count), bx, barY - 10, { width: binW, align: 'center', lineBreak: false })
      }
    })
    doc.rect(x, y + BAR_AREA, width, 0.5).fill(LINE)

    HIST_BINS.forEach((bin, i) => {
      const bx = x + i * binW
      doc.font(F.body).fontSize(6).fillColor(T3)
         .text(bin.label, bx, y + BAR_AREA + 5, { width: binW, align: 'center', lineBreak: false })
    })
    doc.font(F.body).fontSize(6.5).fillColor(T4)
       .text('CA$ per bowl', x, y + BAR_AREA + 16, { width: 60, lineBreak: false })

    return y + BAR_AREA + 28
  }

  const drawRegions = (x: number, y: number, width: number): number => {
    if (regionStats.length === 0) return y
    const ROW_H = 18
    const BAR_X = x + 100
    const BAR_W = width - 100 - 76

    y = chartHead('Regional breakdown', 'Baseline price range per region', x, y, width)

    regionStats.forEach((region, i) => {
      const ry = y + i * ROW_H
      doc.font(F.body).fontSize(7).fillColor(T2)
         .text(region.name, x, ry + 2, { width: 96, lineBreak: false })
      doc.font(F.body).fontSize(6.5).fillColor(T3)
         .text(`${region.count} ${region.count === 1 ? 'city' : 'cities'}`, x + 98, ry + 2, { width: 30, lineBreak: false })

      const leftPct = region.min / regionMaxPrice
      const widthPct = Math.max((region.max - region.min) / regionMaxPrice, 0.01)
      const medPct = region.median / regionMaxPrice

      doc.rect(BAR_X, ry + 5, BAR_W, 4).fill(TRACK)
      doc.rect(BAR_X + leftPct * BAR_W, ry + 5, widthPct * BAR_W, 4).fill(GOLD)
      doc.rect(BAR_X + medPct * BAR_W - 0.5, ry + 3, 1, 8).fill(T1)

      doc.font(F.body).fontSize(6).fillColor(T3)
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

    y = chartHead('Rent burden', `Monthly rent as % of median salary, ${burdenByCity.length} cities`, x, y, width)

    burdenByCity.forEach((item, i) => {
      const col = i < half ? 0 : 1
      const row = col === 0 ? i : i - half
      const cx = x + col * (COL_W + 16)
      const ry = y + row * ROW_H

      const BAR_X = cx + 60
      const BAR_W = COL_W - 60 - 28
      const barLen = (Math.min(item.burden, 100) / 100) * BAR_W
      const bColor = burdenFill(item.burden)

      doc.font(F.body).fontSize(6.5).fillColor(T2)
         .text(item.city, cx, ry, { width: 56, lineBreak: false })
      doc.rect(BAR_X, ry + 1.5, BAR_W, 4).fill(TRACK)
      doc.rect(BAR_X, ry + 1.5, Math.max(barLen, 0), 4).fill(bColor)
      doc.font(F.med).fontSize(6.5).fillColor(bColor)
         .text(`${Math.round(item.burden)}%`, BAR_X + BAR_W + 2, ry, { width: 24, align: 'right', lineBreak: false })
    })

    return y + half * ROW_H + 14
  }

  const drawScatter = (x: number, y: number, width: number): number => {
    if (scatterCities.length < 2) return y
    const PLOT_H = 150
    const PAD_L = 26, PAD_B = 22, PAD_T = 14, PAD_R = 10
    const IW = width - PAD_L - PAD_R
    const IH = PLOT_H - PAD_T - PAD_B

    y = chartHead('Scatter: baseline price vs rent burden', 'Each dot = one city; extremes labelled', x, y, width)

    const px = x + PAD_L
    const py = y + PAD_T

    doc.rect(px, py, IW, IH).fill(SURFACE)
    // Quadrant dividers
    doc.moveTo(px + IW / 2, py).lineTo(px + IW / 2, py + IH).strokeColor(LINE).lineWidth(0.5).stroke()
    doc.moveTo(px, py + IH / 2).lineTo(px + IW, py + IH / 2).strokeColor(LINE).lineWidth(0.5).stroke()

    // Axis labels
    doc.font(F.body).fontSize(6).fillColor(T3)
       .text(money(0), x, py + IH + 4, { width: PAD_L, align: 'right', lineBreak: false })
       .text(money(scatterMaxPrice), px + IW - 36, py + IH + 4, { width: 36, align: 'right', lineBreak: false })
       .text('0%', x, py + IH - 4, { width: PAD_L - 2, align: 'right', lineBreak: false })
       .text('100%', x, py - 2, { width: PAD_L - 2, align: 'right', lineBreak: false })
    doc.font(F.body).fontSize(6.5).fillColor(T3)
       .text('Price (CA$) >', px + IW / 2 - 24, py + IH + PAD_B - 8, { width: 60, align: 'center', lineBreak: false })

    // Dots
    scatterCities.forEach(city => {
      const dotX = px + (city.price / scatterMaxPrice) * IW
      const dotY = py + (1 - city.burden / Math.max(scatterMaxBurden, 100)) * IH
      doc.circle(dotX, dotY, 2.4).fill(burdenFill(city.burden))
      if (scatterLabelSet.has(city.city)) {
        const onRight = dotX > px + IW * 0.7
        doc.font(F.body).fontSize(6).fillColor(T1)
           .text(city.city, onRight ? dotX - 60 : dotX + 5, dotY - 3,
                 { width: 56, align: onRight ? 'right' : 'left', lineBreak: false })
      }
    })

    return y + PLOT_H
  }

  const drawBowls = (x: number, y: number, width: number): number => {
    if (bowlsAfterRent.length === 0) return y
    const ROW_H = 9
    const COL_W = (width - 16) / 2
    const half = Math.ceil(bowlsAfterRent.length / 2)

    y = chartHead('Bowls after rent', `Disposable income / baseline price, ${bowlsAfterRent.length} cities`, x, y, width)

    bowlsAfterRent.forEach((item, i) => {
      const col = i < half ? 0 : 1
      const row = col === 0 ? i : i - half
      const cx = x + col * (COL_W + 16)
      const ry = y + row * ROW_H

      const BAR_X = cx + 60
      const BAR_W = COL_W - 60 - 32
      const isNeg = item.bowls < 0
      const barLen = (Math.min(Math.abs(item.bowls), bowlsMax) / bowlsMax) * BAR_W
      const bColor = isNeg ? COPPER : item.bowls < 30 ? GOLD : JADE

      doc.font(F.body).fontSize(6.5).fillColor(T2)
         .text(item.city, cx, ry, { width: 56, lineBreak: false })
      doc.rect(BAR_X, ry + 1.5, BAR_W, 4).fill(TRACK)
      doc.rect(BAR_X, ry + 1.5, Math.max(barLen, 0), 4).fill(bColor)
      doc.font(F.med).fontSize(6.5).fillColor(bColor)
         .text(`${isNeg ? '-' : ''}${Math.abs(item.bowls)}`, BAR_X + BAR_W + 2, ry, { width: 28, align: 'right', lineBreak: false })
    })

    return y + half * ROW_H + 14
  }

  /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ PAGE 1: COVER + ANALYSIS ━━ */

  doc.rect(0, 0, PW, PH).fill(BG)
  doc.rect(ML, MT, CW, 1.5).fill(GOLD)

  let y = MT + 18
  doc.font(F.monoMed).fontSize(8).fillColor(GOLD)
     .text('FRIED RICE INDEX', ML, y, { characterSpacing: 2, lineBreak: false })
  y += 13
  doc.font(F.mono).fontSize(8).fillColor(T3).text('efr-index.vercel.app', ML, y, { lineBreak: false })

  y += 46
  doc.font(F.semi).fontSize(54).fillColor(T1).text(report.title, ML, y, { lineBreak: false })
  y += 66

  if (report.subtitle) {
    doc.font(F.body).fontSize(13).fillColor(T2).text(report.subtitle, ML, y, { lineBreak: false })
    y += 22
  }

  hRule(y)
  y += 10
  doc.font(F.monoMed).fontSize(8).fillColor(T2)
     .text('MONTHLY REPORT', ML, y, { characterSpacing: 0.8, lineBreak: false })
  y += 13
  doc.font(F.body).fontSize(7.5).fillColor(T3)
     .text(`Downloaded ${downloadedAt}`, ML, y, { lineBreak: false })
  y += 24

  // Key stats strip
  doc.rect(ML, y, CW, 62).fill(SURFACE)
  doc.rect(ML, y, CW, 62).lineWidth(0.5).stroke(LINE)
  const STATS = [
    { l: 'CITIES',         v: String(report.city_count) },
    { l: 'CHEAPEST',       v: `CA$${Number(report.cheapest_price_cad).toFixed(2)}`, s: report.cheapest_city },
    { l: 'MOST EXPENSIVE', v: `CA$${Number(report.priciest_price_cad).toFixed(2)}`, s: report.priciest_city },
    { l: 'SPREAD',         v: `${report.spread_ratio}x` },
    { l: 'AVG BASELINE',   v: `CA$${Number(report.avg_baseline_cad).toFixed(2)}` },
  ]
  const SW = CW / STATS.length
  STATS.forEach((s, i) => {
    const sx = ML + i * SW + 10
    if (i > 0) doc.rect(ML + i * SW, y + 12, 0.5, 38).fill(LINE)
    doc.font(F.mono).fontSize(6).fillColor(T3)
       .text(s.l, sx, y + 11, { width: SW - 14, characterSpacing: 0.6, lineBreak: false })
    doc.font(F.semi).fontSize(15).fillColor(GOLD)
       .text(s.v, sx, y + 21, { width: SW - 12, lineBreak: false })
    if (s.s) {
      doc.font(F.body).fontSize(7.5).fillColor(T2)
         .text(s.s, sx, y + 41, { width: SW - 14, lineBreak: false })
    }
  })
  y += 74

  // Analysis section
  hRule(y, GOLD, 1.5)
  y += 13
  doc.font(F.monoMed).fontSize(8).fillColor(GOLD)
     .text('ANALYSIS', ML, y, { characterSpacing: 1.4, lineBreak: false })
  y += 17

  paragraphs.forEach((para, i) => {
    if (y > BOTTOM - 70) y = addReportPage()
    const opts = { width: CW, align: 'justify' as const, lineGap: 3.5 }
    doc.font(i === 0 ? F.med : F.body)
       .fontSize(9.5)
       .fillColor(i === 0 ? T1 : T2)
       .text(para, ML, y, opts)
    y = doc.y + 11
  })

  /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ EXCHANGE RATES ━━ */
  y = ensureSpace(y, 90)
  y += 10
  y = sectionHead('Exchange rates', `CAD per 1 unit of foreign currency, ${report.title}`, y)

  const rateEntries = Object.entries(rates).sort(([a], [b]) => a.localeCompare(b))
  const RCOLS = 4, RCW = CW / RCOLS
  rateEntries.forEach(([cur, rate], i) => {
    const col = i % RCOLS, row = Math.floor(i / RCOLS)
    const rx = ML + col * RCW, ry = y + row * 15
    doc.font(F.monoMed).fontSize(8).fillColor(T1).text(cur, rx, ry, { width: 30, lineBreak: false })
    doc.font(F.mono).fontSize(8).fillColor(T3)
       .text(Number(rate).toFixed(5), rx + 32, ry, { width: RCW - 38, lineBreak: false })
  })
  y += Math.ceil(rateEntries.length / RCOLS) * 15 + 16

  /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ VISUAL ANALYSIS ━━ */
  y = ensureSpace(y, 150)
  y = sectionHead('Visual analysis', 'Price distribution, chart legend, and city rankings', y)
  y = drawLegend(ML, y)

  y = ensureSpace(y, 100)
  y = drawDistributionStrip(ML, y, CW)
  y += 10

  y = ensureSpace(y, 150)
  y = drawPriceBars(ML, y, CW, 126)
  y += 16

  y = ensureSpace(y, 100)
  y = drawHistogram(ML, y, CW)
  y += 10

  y = ensureSpace(y, regionStats.length > 0 ? Math.min(regionStats.length * 18 + 44, 220) : 44)
  y = drawRegions(ML, y, CW)
  y += 10

  y = ensureSpace(y, burdenByCity.length > 0 ? Math.min(Math.ceil(burdenByCity.length / 2) * 9 + 44, 220) : 44)
  y = drawBurdenBars(ML, y, CW)
  y += 12

  y = ensureSpace(y, 190)
  y = drawScatter(ML, y, CW)
  y += 12

  y = ensureSpace(y, bowlsAfterRent.length > 0 ? Math.min(Math.ceil(bowlsAfterRent.length / 2) * 9 + 44, 220) : 44)
  y = drawBowls(ML, y, CW)
  y += 12

  /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ STATISTICAL ANALYSIS ━━ */
  y = ensureSpace(y, 90)
  y = sectionHead('Statistical analysis', 'Baseline price, rent burden, and entry count distributions', y)

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
  doc.rect(ML, y, CW, 14).fill(SURFACE)
  let sx = ML
  SCOLS.forEach((c) => {
    doc.font(F.monoMed).fontSize(6).fillColor(T3)
       .text(c.h, sx + 3, y + 4, { width: c.w - 4, characterSpacing: 0.4, lineBreak: false })
    sx += c.w
  })
  y += 14

  statRows.forEach((row, i) => {
    if (y > BOTTOM - 18) y = addReportPage()
    if (i % 2 === 0) doc.rect(ML, y, CW, 13).fill(SURFACE2)
    sx = ML
    row.forEach((cell, ci) => {
      doc.font(ci === 0 ? F.med : F.body).fontSize(7)
         .fillColor(ci === 1 ? GOLD : ci === 0 ? T1 : T2)
         .text(cell, sx + 3, y + 2.8, { width: SCOLS[ci].w - 4, lineBreak: false })
      sx += SCOLS[ci].w
    })
    y += 13
  })
  y += 16

  /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ CITY TABLE ━━ */
  y = ensureSpace(y, 70)
  y = sectionHead('City data snapshot', `${report.city_count} cities, cheapest to most expensive`, y)

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
    doc.rect(ML, hy, CW, 14).fill(SURFACE)
    let cx = ML
    COLS.forEach(c => {
      doc.font(F.monoMed).fontSize(6).fillColor(T3)
         .text(c.h, cx + 3, hy + 4, { width: c.w - 4, characterSpacing: 0.4, lineBreak: false })
      cx += c.w
    })
    return hy + 14
  }

  y = drawTableHeader(y)

  cities.forEach((city, i) => {
    if (y > BOTTOM - 18) {
      y = drawTableHeader(addReportPage())
    }
    if (i % 2 === 0) doc.rect(ML, y, CW, 13).fill(SURFACE2)

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
      doc.font(ci === 1 ? F.med : F.body).fontSize(7.5)
         .fillColor(ci === 2 ? GOLD : ci === 1 ? T1 : T2)
         .text(cell, cx + 3, y + 2.8, { width: COLS[ci].w - 4, lineBreak: false })
      cx += COLS[ci].w
    })
    y += 13
  })

  /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ PAGE FOOTERS ━━ */
  const range = doc.bufferedPageRange()
  for (let p = 0; p < range.count; p++) {
    doc.switchToPage(range.start + p)
    // Drop the bottom margin so footer text below it does NOT trigger
    // PDFKit's auto page-break (the cause of trailing blank pages).
    doc.page.margins.bottom = 0
    doc.rect(ML, FOOT_Y, CW, 0.5).fill(LINE)
    doc.font(F.mono).fontSize(6.5).fillColor(T4)
       .text('FRIED RICE INDEX · efr-index.vercel.app', ML, FOOT_Y + 7, { width: CW * 0.7, lineBreak: false })
    doc.font(F.mono).fontSize(6.5).fillColor(T4)
       .text(`${String(p + 1).padStart(2, '0')} / ${String(range.count).padStart(2, '0')}`, ML, FOOT_Y + 7, { width: CW, align: 'right', lineBreak: false })
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
