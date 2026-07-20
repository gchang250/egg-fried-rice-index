/**
 * Replace the fabricated rent/salary fields in `cities` with the real values,
 * in place. Unlike seed-343-ridings.ts this wipes nothing.
 *
 * Sets, per riding:
 *   median_rent_1br_cad       CMHC RMS 2025 avg 1BR rent, nearest surveyed metro
 *   safety_index              StatCan CSI 2024, rescaled 100 - CSI/2 (clamp 5-95)
 *   median_monthly_salary_cad Census 2021 median total income / 12 (no adjustment)
 *   tech_salary_cad           Census 2021 median household income / 12
 *   rent_data_source          the surveyed centre and its distance to the riding
 *
 * Dry-run by default. Pass --apply to write.
 *
 *   npx tsx scripts/patch-real-rent-safety.ts
 *   npx tsx scripts/patch-real-rent-safety.ts --apply
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

type Riding = {
  fed_num: string
  name: string
  province: string
  median_total_income_annual: number
  median_household_income_annual: number
}
type Assignment = {
  rent_1br_cad: number
  rent_metro: string
  rent_distance_km: number
  safety_index: number
}

type RentFinal = {
  fed_num: string
  median_rent_1br_cad: number | null
  rent_confidence: string
  rent_data_source: string
}

const dataDir = path.resolve(process.cwd(), 'scripts/data')
const RIDINGS: Riding[] = JSON.parse(fs.readFileSync(`${dataDir}/ridings-real-data.json`, 'utf-8'))
const ASSIGNMENTS: Record<string, Assignment> = JSON.parse(
  fs.readFileSync(`${dataDir}/metro-assignments.json`, 'utf-8')
)
// Real CMHC 2025 rents, tiered by confidence, unrepresentative ridings withheld.
// Built by scripts/data/build-rent-final.py from metro-assignments.json.
const RENT_FINAL: Record<string, RentFinal> = Object.fromEntries(
  (JSON.parse(fs.readFileSync(`${dataDir}/rent-final.json`, 'utf-8')) as RentFinal[])
    .map(r => [r.fed_num, r])
)

// NOTE: an INCOME_OVERRIDES table used to hard-code monthly salary for 11 ridings
// (e.g. Fort McMurray—Cold Lake 6200 vs the Census 5100). Those values traced to no
// source -- they were round annual figures divided by 12 (55000/12, 52000/12,
// 74400/12), deviated in both directions, and matched neither total nor employment
// income -- yet every riding page attributed the number to the Census. They are gone.
// Census Profile 2021 for the 2023 Representation Order (98-401-X2021029) is the
// authoritative riding-level income source: CRA's Federal Electoral District
// Statistics is discontinued (last edition = 2017 tax year, on the old 338-riding
// boundaries), so no more current riding-level series exists for these 343 ridings.

async function run() {
  const { data: existing, error } = await supabase
    .from('cities')
    .select('city,median_rent_1br_cad,median_monthly_salary_cad,tech_salary_cad,safety_index')
  if (error) throw error

  const before = new Map((existing ?? []).map(r => [r.city as string, r]))
  console.log(`${APPLY ? 'APPLYING' : 'DRY RUN'} — ${before.size} rows in cities, ${RIDINGS.length} ridings on file\n`)

  let changed = 0
  let missing = 0
  const samples: string[] = []

  for (const riding of RIDINGS) {
    const a = ASSIGNMENTS[riding.fed_num]
    if (!a) throw new Error(`no assignment for ${riding.fed_num} (${riding.name})`)

    const prev = before.get(riding.name)
    if (!prev) {
      missing++
      console.warn(`  ! no cities row named ${riding.name!}`)
      continue
    }

    const rf = RENT_FINAL[riding.fed_num]
    if (!rf) throw new Error(`no rent-final entry for ${riding.fed_num} (${riding.name})`)

    const median_monthly_salary_cad = Math.round(riding.median_total_income_annual / 12)

    // Census median HOUSEHOLD income. Note the riding page must label this as
    // household income -- it is not employment income.
    const tech_salary_cad = Math.round(riding.median_household_income_annual / 12)

    const next = {
      median_rent_1br_cad: rf.median_rent_1br_cad,   // null where withheld
      safety_index: a.safety_index,
      median_monthly_salary_cad,
      tech_salary_cad,
      rent_data_source: rf.rent_data_source,
    }

    if (samples.length < 6) {
      samples.push(
        `  ${riding.name.padEnd(26)} rent ${String(prev.median_rent_1br_cad).padStart(5)} -> ${String(next.median_rent_1br_cad).padStart(5)}` +
        `   salary ${String(prev.median_monthly_salary_cad).padStart(5)} -> ${String(next.median_monthly_salary_cad).padStart(5)}` +
        `   safety ${String(prev.safety_index).padStart(3)} -> ${String(next.safety_index).padStart(3)}`
      )
    }
    changed++

    if (APPLY) {
      const { error: upErr } = await supabase.from('cities').update(next).eq('city', riding.name)
      if (upErr) throw new Error(`update failed for ${riding.name}: ${upErr.message}`)
    }
  }

  console.log(samples.join('\n'))
  console.log(`\n${APPLY ? 'updated' : 'would update'} ${changed} ridings; ${missing} with no matching row`)
  if (!APPLY) console.log('\nRe-run with --apply to write.')
}

run().catch(e => { console.error(e); process.exit(1) })
