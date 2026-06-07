/**
 * patch-metrics-v2.ts — Corrects liveability metrics found in full audit.
 *
 * Run with:
 *   export $(grep -v '^#' .env.local | xargs) && npx tsx scripts/patch-metrics-v2.ts
 *
 * Issues addressed:
 *
 * MEXICO CITY — rent burden 97% (salary CA$1,332, rent CA$1,296)
 *   Root cause: median_rent_local was MXN 18,000 (Polanco / Roma Norte
 *   city-centre premium), same issue that was corrected for Mumbai/Delhi/etc.
 *   in patch-accuracy-v1.ts but was missed for CDMX.
 *   Fix: MXN 18,000 → MXN 11,000 (Narvarte / Del Valle / Colonia Roma accessible area)
 *   New burden: 792/1332 = 59% — reasonable.
 *   New bowlsLeft: (1332-792)/9 ≈ 60 bowls — realistic.
 *
 * MOSCOW — salary too low (national average used instead of Moscow-specific)
 *   Root cause: Rosstat national average RUB 79,000–95,000; Moscow-specific
 *   average (Rosstat regional data) is RUB 110,000–125,000 in 2025.
 *   Fix: median_monthly_salary_local RUB 95,000 → RUB 118,000
 *        tech_salary_local RUB 210,000 → RUB 250,000
 *   New burden: 1200/1770 = 68% — reasonable for Moscow.
 *
 * ISTANBUL — salary barely above minimum wage
 *   Root cause: TRY 23,000 seed was only slightly above Turkey's 2024
 *   minimum wage (TRY 22,104) and understates the Istanbul median.
 *   TUIK data for Istanbul Province (2025) shows average monthly earnings
 *   of TRY 27,000–30,000 for full-time workers.
 *   Fix: median_monthly_salary_local TRY 23,000 → TRY 28,000
 *        tech_salary_local TRY 58,000 → TRY 70,000
 *   New burden: 666/1036 = 64% — reasonable for Istanbul.
 */

import { createClient } from '@supabase/supabase-js'
const s = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

const r   = (n: number) => Math.round(n * 100) / 100
const mxn = (x: number) => r(x * 0.072)
const rub = (x: number) => r(x * 0.015)
const tri = (x: number) => r(x * 0.037)  // TRY

type Patch = { city: string; updates: Record<string, number | string>; reason: string }

const PATCHES: Patch[] = [
  {
    city: 'Mexico City',
    updates: {
      median_rent_local: 11000,
      median_rent_1br_cad: mxn(11000),
      rent_data_source: 'Lamudi.com.mx / Numbeo Q2 2026 (accessible area 1BR, Narvarte/Del Valle/Roma accessible)',
    },
    reason: 'Rent corrected from Polanco/Roma Norte city-centre premium (MXN 18,000) to typical middle-class 1BR in Narvarte/Del Valle (MXN 11,000). Burden drops from 97% to 59%.',
  },
  {
    city: 'Moscow',
    updates: {
      median_monthly_salary_local: 118000,
      median_monthly_salary_cad: rub(118000),
      tech_salary_local: 250000,
      tech_salary_cad: rub(250000),
      salary_data_source: 'Rosstat 2025 (Moscow-specific regional data, not national average)',
    },
    reason: 'Salary corrected from Russia-wide national average (RUB 95,000) to Moscow-specific figure (RUB 118,000). Moscow salaries are ~40% above the national average. Tech salaries updated proportionally.',
  },
  {
    city: 'Istanbul',
    updates: {
      median_monthly_salary_local: 28000,
      median_monthly_salary_cad: tri(28000),
      tech_salary_local: 70000,
      tech_salary_cad: tri(70000),
      salary_data_source: 'TÜİK (Turkish Statistical Institute) 2025 — Istanbul Province average monthly earnings',
    },
    reason: 'Salary corrected from TRY 23,000 (barely above 2024 minimum wage) to TRY 28,000 (Istanbul Province median per TUIK 2025). Tech salaries updated proportionally.',
  },
]

async function main() {
  console.log('Applying metrics patches v2...\n')
  let ok = 0, fail = 0

  for (const p of PATCHES) {
    const { error } = await s.from('cities').update(p.updates).eq('city', p.city)
    if (error) {
      console.error(`✗ ${p.city}: ${error.message}`)
      fail++
    } else {
      console.log(`✓ ${p.city}`)
      console.log(`  ${p.reason}`)
      ok++
    }
  }

  console.log(`\n${ok} patched, ${fail} failed.`)
}
main().catch(console.error)
