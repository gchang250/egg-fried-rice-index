/**
 * clean-source-urls.ts — Two-pass URL quality cleanup.
 *
 * Pass 1 (instant): null out source_url for generic category/browse pages
 *   - TripAdvisor city search pages  (e.g. /Restaurants-g186338-London)
 *   - Dianping city category pages   (e.g. /beijing/chaoyang)
 *   These were never real restaurant menu links.
 *
 * Pass 2 (network): check specific restaurant websites; null out source_url for HTTP 404.
 *   - Skips 403/429 (bot protection — site exists, just blocks crawlers)
 *   - Skips "fetch failed" (SSL quirks or bot block, treat as possibly live)
 *   - Only acts on confirmed 404 (page definitively gone)
 *
 * Does NOT deactivate restaurant entries — only removes the bad URL field.
 *
 * Run:
 *   export $(grep -v '^#' .env.local | xargs) && npx tsx scripts/clean-source-urls.ts
 * Flags:
 *   --dry-run   Print what would be changed but don't write to DB
 */

import { createClient } from '@supabase/supabase-js'

const s = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

const DRY_RUN = process.argv.includes('--dry-run')
const TIMEOUT_MS = 12_000
const CONCURRENCY = 10

type Row = { id: string; city: string; restaurant_name: string; source_url: string }

function isGenericCategoryUrl(url: string): string | null {
  // TripAdvisor city-level search pages (not specific restaurant reviews)
  if (/tripadvisor\.[a-z.]+\/Restaurants-g\d+/.test(url)) {
    return 'TripAdvisor city search page'
  }
  // Dianping city/district browse pages (not /shop/ pages)
  if (/dianping\.com\/[a-z]+\/(chaoyang|haidian|dongcheng|xicheng|yangpu|huangpu|jing.an|pudong|[a-z]+)$/.test(url)) {
    return 'Dianping city browse page'
  }
  // Dianping city top-level pages like /beijing or /shanghai/huangpu without /shop/
  if (/dianping\.com\/[a-z]+$/.test(url) || /dianping\.com\/[a-z]+\/[a-z]+$/.test(url)) {
    return 'Dianping city browse page'
  }
  return null
}

async function check404(url: string): Promise<boolean> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS)
  try {
    const res = await fetch(url, {
      method: 'HEAD',
      signal: ctrl.signal,
      redirect: 'follow',
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; EFRI-checker/1.0)' },
    })
    clearTimeout(timer)
    return res.status === 404
  } catch {
    clearTimeout(timer)
    return false  // fetch failed = treat as possibly live (bot block, SSL quirk)
  }
}

async function nullOutUrls(ids: string[], reason: string) {
  if (DRY_RUN) return
  for (let i = 0; i < ids.length; i += 50) {
    const batch = ids.slice(i, i + 50)
    const { error } = await s.from('restaurants').update({ source_url: null }).in('id', batch)
    if (error) console.error(`  DB error (batch ${Math.floor(i / 50) + 1}): ${error.message}`)
  }
}

async function main() {
  console.log(`\n${'═'.repeat(55)}`)
  console.log(`  Source URL cleanup${DRY_RUN ? ' [DRY RUN]' : ''}`)
  console.log(`${'═'.repeat(55)}\n`)

  const { data, error } = await s.from('restaurants')
    .select('id, city, restaurant_name, source_url')
    .eq('active', true)
    .not('source_url', 'is', null)
    .neq('source_url', '')

  if (error || !data) { console.error('Fetch failed:', error?.message); process.exit(1) }
  const rows = data as Row[]
  console.log(`Total active restaurants with source_url: ${rows.length}\n`)

  // ── Pass 1: Generic category pages ──────────────────────────────────────
  console.log('── Pass 1: Removing generic category page URLs ──')
  const categoryIds: string[] = []
  for (const row of rows) {
    const reason = isGenericCategoryUrl(row.source_url)
    if (reason) {
      console.log(`  ${DRY_RUN ? '[would clear]' : '[clearing]'} ${row.city} — ${row.restaurant_name.slice(0, 50)}`)
      console.log(`    ${reason}: ${row.source_url.slice(0, 80)}`)
      categoryIds.push(row.id)
    }
  }
  console.log(`\n  ${categoryIds.length} generic category URLs found`)
  if (!DRY_RUN && categoryIds.length > 0) {
    await nullOutUrls(categoryIds, 'generic category page')
    console.log(`  Cleared source_url for ${categoryIds.length} entries`)
  }

  // ── Pass 2: Check remaining specific URLs for 404 ───────────────────────
  console.log('\n── Pass 2: Checking specific restaurant URLs for 404 ──')
  const categoryIdSet = new Set(categoryIds)
  const specificRows = rows.filter(r =>
    !categoryIdSet.has(r.id) &&
    !r.source_url.includes('tripadvisor.com') &&  // bot-blocked but live
    !r.source_url.includes('ubereats.com') &&      // bot-blocked but live
    !r.source_url.includes('foodpanda.')           // bot-blocked but live
  )
  console.log(`Checking ${specificRows.length} specific restaurant/menu URLs...\n`)

  const deadIds: string[] = []
  for (let i = 0; i < specificRows.length; i += CONCURRENCY) {
    const batch = specificRows.slice(i, i + CONCURRENCY)
    const results = await Promise.all(
      batch.map(async row => ({ row, is404: await check404(row.source_url) }))
    )
    for (const { row, is404 } of results) {
      if (is404) {
        console.log(`  ✗ [404] ${row.city} — ${row.restaurant_name.slice(0, 50)}`)
        console.log(`    ${row.source_url.slice(0, 80)}`)
        deadIds.push(row.id)
      }
    }
    const done = Math.min(i + CONCURRENCY, specificRows.length)
    if (results.every(r => !r.is404)) {
      process.stdout.write(`  [${i + 1}–${done}/${specificRows.length}] all live\n`)
    }
  }

  console.log(`\n  ${deadIds.length} confirmed 404 URLs found`)
  if (!DRY_RUN && deadIds.length > 0) {
    await nullOutUrls(deadIds, '404')
    console.log(`  Cleared source_url for ${deadIds.length} entries`)
  }

  // ── Summary ─────────────────────────────────────────────────────────────
  console.log(`\n${'═'.repeat(55)}`)
  console.log(`  Summary${DRY_RUN ? ' [DRY RUN — no changes made]' : ''}`)
  console.log(`${'═'.repeat(55)}`)
  console.log(`  Generic category URLs cleared : ${categoryIds.length}`)
  console.log(`  Confirmed 404 URLs cleared    : ${deadIds.length}`)
  console.log(`  Total source_url fields cleared: ${categoryIds.length + deadIds.length}`)
  console.log(`  (Restaurant entries remain active — only source_url field nulled)`)
}

main().catch(err => { console.error(err); process.exit(1) })
