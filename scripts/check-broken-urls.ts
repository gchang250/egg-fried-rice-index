/**
 * check-broken-urls.ts — Fetch every active restaurant source_url and mark
 * entries inactive where the URL returns a 4xx/5xx or times out.
 *
 * Does NOT delete entries — sets active=false so the record is preserved.
 * Skips entries with null/empty source_url.
 *
 * Run:
 *   export $(grep -v '^#' .env.local | xargs) && npx tsx scripts/check-broken-urls.ts
 *
 * Flags:
 *   --dry-run   Print results but do not write to DB
 *   --city NYC  Only check one city
 */

import { createClient } from '@supabase/supabase-js'

const s = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

const DRY_RUN = process.argv.includes('--dry-run')
const CITY_FILTER = (() => {
  const idx = process.argv.indexOf('--city')
  return idx >= 0 ? process.argv[idx + 1] : null
})()
const TIMEOUT_MS = 10_000
const CONCURRENCY = 8

type Row = { id: string; city: string; restaurant_name: string; source_url: string }

async function checkUrl(url: string): Promise<{ ok: boolean; status: number | null; reason: string }> {
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
    if (res.ok || res.status === 405) return { ok: true, status: res.status, reason: 'ok' }
    return { ok: false, status: res.status, reason: `HTTP ${res.status}` }
  } catch (err: unknown) {
    clearTimeout(timer)
    const msg = err instanceof Error ? err.message : String(err)
    if (msg.includes('abort') || msg.includes('timed')) return { ok: false, status: null, reason: 'timeout' }
    return { ok: false, status: null, reason: msg.slice(0, 80) }
  }
}

async function processBatch(batch: Row[]): Promise<{ dead: Row[]; live: Row[] }> {
  const results = await Promise.all(
    batch.map(async row => {
      const { ok, status, reason } = await checkUrl(row.source_url)
      return { row, ok, status, reason }
    })
  )
  const dead = results.filter(r => !r.ok).map(r => {
    console.log(`  ✗ [${r.reason}] ${r.row.city} — ${r.row.restaurant_name.slice(0, 50)} → ${r.row.source_url.slice(0, 80)}`)
    return r.row
  })
  const live = results.filter(r => r.ok).map(r => r.row)
  return { dead, live }
}

async function main() {
  console.log('═══════════════════════════════════════════════')
  console.log(`  URL checker${DRY_RUN ? ' [DRY RUN]' : ''}${CITY_FILTER ? ` — ${CITY_FILTER}` : ''}`)
  console.log('═══════════════════════════════════════════════\n')

  let q = s.from('restaurants')
    .select('id, city, restaurant_name, source_url')
    .eq('active', true)
    .not('source_url', 'is', null)
    .neq('source_url', '')
  if (CITY_FILTER) q = q.eq('city', CITY_FILTER)

  const { data, error } = await q
  if (error || !data) { console.error('Fetch failed:', error?.message); process.exit(1) }

  const rows = data as Row[]
  console.log(`Checking ${rows.length} URLs (concurrency ${CONCURRENCY}, timeout ${TIMEOUT_MS / 1000}s)...\n`)

  const allDead: Row[] = []
  for (let i = 0; i < rows.length; i += CONCURRENCY) {
    const batch = rows.slice(i, i + CONCURRENCY)
    process.stdout.write(`  [${i + 1}–${Math.min(i + CONCURRENCY, rows.length)}/${rows.length}] `)
    const { dead, live } = await processBatch(batch)
    allDead.push(...dead)
    if (!dead.length) console.log(`all live`)
  }

  console.log(`\n── Summary ──`)
  console.log(`  Total checked : ${rows.length}`)
  console.log(`  Dead / broken : ${allDead.length}`)
  console.log(`  Live          : ${rows.length - allDead.length}`)

  if (!allDead.length) { console.log('\n  No broken URLs found.'); return }

  if (DRY_RUN) {
    console.log('\n  [dry run] Would deactivate:')
    allDead.forEach(r => console.log(`    ${r.city} — ${r.restaurant_name}`))
    return
  }

  console.log('\n── Deactivating broken entries ──')
  const ids = allDead.map(r => r.id)
  // Batch in groups of 50 (Supabase in-filter limit)
  for (let i = 0; i < ids.length; i += 50) {
    const batch = ids.slice(i, i + 50)
    const { error: upErr } = await s.from('restaurants').update({ active: false }).in('id', batch)
    if (upErr) console.error(`  Update error (batch ${i / 50 + 1}): ${upErr.message}`)
    else console.log(`  Deactivated ${batch.length} entries`)
  }

  console.log('\n  Done. City baselines unchanged — run recalculate-city API or seed-reports to refresh stats.')
}

main().catch(err => { console.error(err); process.exit(1) })
