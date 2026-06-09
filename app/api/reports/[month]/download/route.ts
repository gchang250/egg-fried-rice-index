import PDFDocument from 'pdfkit'
import { supabase } from '@/lib/supabase-admin'

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
    .sort((a: any, b: any) => Number(a.price_cad ?? 0) - Number(b.price_cad ?? 0)) as any[]
  const rates = (report.exchange_rates_snapshot ?? {}) as Record<string, number>
  const paragraphs = String(report.analysis).split('\n\n').filter(Boolean)

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
    { h: 'CITY',        w: 96 },
    { h: 'COUNTRY',     w: 80 },
    { h: 'REGION',      w: 70 },
    { h: 'PRICE (CA$)', w: 58 },
    { h: 'RENT BURDEN', w: 58 },
    { h: 'QUALITY',     w: CW - 22 - 96 - 80 - 70 - 58 - 58 },
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

    const cells = [
      String(i + 1),
      String(city.city ?? ''),
      String(city.country ?? ''),
      String(city.region ?? ''),
      `CA$${price.toFixed(2)}`,
      burden,
      String(city.data_quality_label ?? '—'),
    ]

    let cx = ML
    cells.forEach((cell, ci) => {
      doc.font('Helvetica').fontSize(7.5)
         .fillColor(ci === 4 ? ACCENT : DARK)
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
