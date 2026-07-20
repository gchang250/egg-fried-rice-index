/**
 * Replace the `climate` field with real per-riding ECCC climate normals.
 *
 * Before this, every one of the 343 ridings carried the identical hardcoded string
 * "Humid continental / Maritime climate" -- displayed on each riding page as though
 * it described that riding. Nunavut and Vancouver said the same thing.
 *
 * Now each riding reports the measured 1981-2010 normals of its nearest ECCC station
 * (matched to the riding boundary, not the centroid), with the station and its
 * distance named in the value itself.
 *
 * Source data: scripts/data/climate-by-riding.json (built by build-climate.py).
 * Dry-run by default. Pass --apply to write.
 *
 *   npx tsx scripts/patch-climate.ts
 *   npx tsx scripts/patch-climate.ts --apply
 */
import fs from 'fs'
import path from 'path'
import { createClient } from '@supabase/supabase-js'

const envPath = path.resolve(process.cwd(), '.env.local')
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf-8').split('\n')) {
    const i = line.indexOf('=')
    if (i > 0) process.env[line.slice(0, i).trim()] = line.slice(i + 1).trim().replace(/^['"]|['"]$/g, '')
  }
}

const APPLY = process.argv.includes('--apply')
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

type Entry = {
  climate: string; climate_source: string
  station: string; station_km: number
  jan_c: number; jul_c: number; precip_mm: number
}

const CLIMATE: Record<string, Entry> = JSON.parse(
  fs.readFileSync(path.resolve(process.cwd(), 'scripts/data/climate-by-riding.json'), 'utf-8')
)

async function run() {
  const { data, error } = await supabase.from('cities').select('city,climate')
  if (error) throw error
  const before = new Map((data ?? []).map(r => [r.city as string, r.climate as string | null]))
  console.log(`${APPLY ? 'APPLYING' : 'DRY RUN'} — ${before.size} rows in cities, ${Object.keys(CLIMATE).length} ridings on file\n`)

  let changed = 0, missing = 0
  const samples: string[] = []

  for (const [name, e] of Object.entries(CLIMATE)) {
    if (!before.has(name)) {
      missing++
      console.warn(`  ! no cities row named ${name}`)
      continue
    }
    // Self-describing: the measurement AND where it was measured, in one value.
    const value = `${e.climate} (Environment and Climate Change Canada normals 1981–2010, ` +
                  `station ${e.station.replace(/\b\w/g, c => c.toUpperCase())}, ${Math.round(e.station_km)} km)`

    if (before.get(name) !== value) changed++
    if (samples.length < 5) samples.push(`  ${name.slice(0, 24).padEnd(26)} ${value.slice(0, 96)}`)

    if (APPLY) {
      const { error: upErr } = await supabase.from('cities').update({ climate: value }).eq('city', name)
      if (upErr) throw new Error(`update failed for ${name}: ${upErr.message}`)
    }
  }

  console.log(samples.join('\n'))
  console.log(`\n${APPLY ? 'updated' : 'would update'} ${changed} ridings; ${missing} with no matching row`)
  if (!APPLY) console.log('\nRe-run with --apply to write.')
}

run().catch(e => { console.error(e); process.exit(1) })
