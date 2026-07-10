/**
 * Patch Hybrid Rent Estimates into Supabase
 * 
 * Reads scripts/data/hybrid-rent-estimates.json and updates:
 *   median_rent_1br_cad
 *   rent_data_source
 * in the 'cities' table.
 * 
 * Dry-run by default. Pass --apply to write.
 * 
 *   npx tsx scripts/patch-hybrid-estimates.ts
 *   npx tsx scripts/patch-hybrid-estimates.ts --apply
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

type Estimate = {
  riding_name: string
  province: string
  estimated_rent_1br_cad: number
  data_source: string
}

const estimatesFile = path.resolve(process.cwd(), 'scripts/data/hybrid-rent-estimates.json')

async function run() {
  if (!fs.existsSync(estimatesFile)) {
    console.error(`Error: estimates file not found at ${estimatesFile}`)
    return
  }

  const estimates: Estimate[] = JSON.parse(fs.readFileSync(estimatesFile, 'utf8'))
  console.log(`${APPLY ? 'APPLYING' : 'DRY RUN'} — Patching ${estimates.length} hybrid estimates into Supabase\n`)

  let updatedCount = 0
  let errorCount = 0

  for (const est of estimates) {
    const next = {
      median_rent_1br_cad: est.estimated_rent_1br_cad,
      rent_data_source: est.data_source
    }

    if (APPLY) {
      const { error } = await supabase
        .from('cities')
        .update(next)
        .eq('city', est.riding_name)

      if (error) {
        console.error(`❌ Failed to update ${est.riding_name}: ${error.message}`)
        errorCount++
      } else {
        updatedCount++
      }
    } else {
      // Dry run logging of a few samples
      if (updatedCount < 5) {
        console.log(`[Dry Run] Would update "${est.riding_name}":`)
        console.log(`  Rent:   CA$${next.median_rent_1br_cad}`)
        console.log(`  Source: ${next.rent_data_source}`)
        updatedCount++
      }
    }
  }

  if (APPLY) {
    console.log(`\nSuccessfully updated ${updatedCount} rows. Errors: ${errorCount}`)
  } else {
    console.log(`\n[Dry Run complete] Re-run with --apply to write changes to Supabase.`)
  }
}

run().catch(console.error)
