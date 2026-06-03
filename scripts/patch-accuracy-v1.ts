/**
 * Accuracy patch v1 — Corrects data errors identified in full audit.
 *
 * Run with:
 *   export $(grep -v '^#' .env.local | xargs) && npx tsx scripts/patch-accuracy-v1.ts
 *
 * Issues addressed:
 *
 * SAFETY INDICES (Numbeo Crime Index inverted to 0–100 safety scale):
 *   Tehran 42 → 74  (crime index ~26; Tehran has genuinely low street crime.
 *                    The security concerns are political, not Numbeo-tracked.)
 *   New Delhi 38 → 46  (crime index ~54; 38 was too pessimistic)
 *   Cairo 40 → 48      (crime index ~52; 40 was too pessimistic)
 *   Philadelphia 35 → 40  (crime index ~60; 35 was too pessimistic)
 *   Chicago 37 → 40    (crime index ~60; 37 was too pessimistic)
 *   Houston 41 → 44    (crime index ~56)
 *
 * HEALTHCARE INDICES (Numbeo Healthcare Index):
 *   Tehran 55 → 62   (Iran has modern hospitals in Tehran; 55 too low)
 *   Cairo 45 → 50    (major private hospitals in Cairo; 45 too low)
 *
 * VISA EASE:
 *   London 'complex' → 'moderate'
 *     (UK Skilled Worker visa + Global Talent visa are more accessible
 *      than US visa system; 'complex' overstated the barrier)
 *
 * RENT DATA — city-centre premium removed for cities where median workers
 *   cannot plausibly afford city-centre 1BR apartments. Changed to
 *   'typical accessible 1BR' (inner suburb / middle-class area):
 *
 *   Mumbai:    INR 45,000 → INR 22,000  (Andheri East / Thane level)
 *   New Delhi: INR 38,000 → INR 20,000  (Noida / Gurgaon / Rohini level)
 *   Kolkata:   INR 22,000 → INR 12,000  (Salt Lake / Rajarhat level)
 *   Karachi:   PKR 55,000 → PKR 32,000  (Gulshan / North Nazimabad level)
 *   Cairo:     EGP 10,000 → EGP 7,500   (Nasr City / Heliopolis suburbs)
 *   Tehran:    USD 600    → USD 380      (typical Tehran middle-class area)
 *   Buenos Aires: ARS 900,000 → USD equivalent 550/month = CA$764.50
 *     (BA landlords typically quote in USD; ARS seed rate caused the error)
 *
 * BUENOS AIRES salary also updated to USD equivalent for internal consistency:
 *   ARS 700,000 → USD equivalent 600/month = CA$834
 *   (higher than rent → burden now 92%, realistic for Buenos Aires)
 */

import { createClient } from '@supabase/supabase-js'
const s = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

const r = (n: number) => Math.round(n * 100) / 100

// Exchange helpers (same as seed scripts)
const inr = (x: number) => r(x * 0.0165)
const pkr = (x: number) => r(x * 0.0036)
const egp = (x: number) => r(x * 0.028)
const usd = (x: number) => r(x * 1.39)

type Patch = {
  city: string
  updates: Record<string, number | string>
  reason: string
}

const PATCHES: Patch[] = [

  // ── Safety indices ──────────────────────────────────────────────────────────
  {
    city: 'Tehran',
    updates: {
      safety_index: 74,
      healthcare_index: 62,
      // Rent: USD 600 → USD 380 (typical Tehran middle-class 1BR)
      median_rent_1br_cad: usd(380),
      median_rent_local: 380,
      rent_data_source: 'Divar.ir (USD equiv., typical middle-class area) Q1 2026',
    },
    reason: 'Safety 42→74: Tehran crime index ~26 (Numbeo); very low street crime. Rent corrected to middle-class area (not luxury Jordan Ave).',
  },
  {
    city: 'New Delhi',
    updates: {
      safety_index: 46,
      // Rent: INR 38,000 → INR 20,000 (Noida / Gurgaon / Rohini level)
      median_rent_1br_cad: inr(20000),
      median_rent_local: 20000,
      rent_data_source: 'NoBroker / Numbeo (accessible area 1BR, Noida/Gurgaon) Q1 2026',
    },
    reason: 'Safety 38→46: crime index ~54. Rent corrected to where median Delhi workers actually live.',
  },
  {
    city: 'Mumbai',
    updates: {
      // Rent: INR 45,000 → INR 22,000 (Andheri East / Thane / Mulund)
      median_rent_1br_cad: inr(22000),
      median_rent_local: 22000,
      rent_data_source: 'NoBroker / Numbeo (accessible area 1BR, Andheri/Thane) Q1 2026',
    },
    reason: 'Rent corrected from luxury city-centre (INR 45k) to accessible middle-class suburb (INR 22k).',
  },
  {
    city: 'Kolkata',
    updates: {
      // Rent: INR 22,000 → INR 12,000 (Salt Lake / Rajarhat / Behala)
      median_rent_1br_cad: inr(12000),
      median_rent_local: 12000,
      rent_data_source: 'NoBroker / Numbeo (accessible area 1BR, Salt Lake/Rajarhat) Q1 2026',
    },
    reason: 'Rent corrected from city-centre (INR 22k) to accessible suburb (INR 12k).',
  },
  {
    city: 'Cairo',
    updates: {
      safety_index: 48,
      healthcare_index: 50,
      // Rent: EGP 10,000 → EGP 7,500 (Nasr City / Heliopolis suburbs)
      median_rent_1br_cad: egp(7500),
      median_rent_local: 7500,
      rent_data_source: 'Aqarmap.com / Numbeo (Nasr City / Heliopolis suburban) Q1 2026',
    },
    reason: 'Safety 40→48 (crime index ~52). Healthcare 45→50. Rent corrected to suburban area.',
  },
  {
    city: 'Karachi',
    updates: {
      // Rent: PKR 55,000 → PKR 32,000 (Gulshan-e-Iqbal / North Nazimabad / Nazimabad)
      median_rent_1br_cad: pkr(32000),
      median_rent_local: 32000,
      rent_data_source: 'Zameen.com / Numbeo (Gulshan/North Nazimabad, accessible 1BR) Q1 2026',
    },
    reason: 'Rent corrected from DHA luxury (PKR 55k) to middle-class areas (PKR 32k).',
  },
  {
    city: 'Philadelphia',
    updates: { safety_index: 40 },
    reason: 'Safety 35→40: Numbeo crime index ~60, safety ~40.',
  },
  {
    city: 'Chicago',
    updates: { safety_index: 40 },
    reason: 'Safety 37→40: Numbeo crime index ~60.',
  },
  {
    city: 'Houston',
    updates: { safety_index: 44 },
    reason: 'Safety 41→44: Numbeo crime index ~56.',
  },

  // ── Visa ease ───────────────────────────────────────────────────────────────
  {
    city: 'London',
    updates: { visa_ease: 'moderate' },
    reason: 'UK Skilled Worker + Global Talent visa are more accessible than US visa system.',
  },

  // ── Buenos Aires — use USD equivalent for internal consistency ───────────────
  // ARS seed rate (0.0011) vs display rate (909) were calibrated but ARS
  // hyperinflation means the nominal ARS figures will become stale quickly.
  // USD-equivalent values are more stable and legible.
  {
    city: 'Buenos Aires',
    updates: {
      // Rent: USD 550/month (typical Palermo/Belgrano 1BR, landlords quote USD)
      median_rent_1br_cad: usd(550),
      median_rent_local: 550,
      rent_data_source: 'ZonaProp.com.ar (USD-quoted rental, Palermo/Belgrano) Q1 2026',
      // Salary: USD 600/month equivalent (professional-class, stable reference)
      median_monthly_salary_cad: usd(600),
      median_monthly_salary_local: 600,
      // Tech salary: USD 1,200/month equivalent
      tech_salary_cad: usd(1200),
      tech_salary_local: 1200,
      salary_data_source: 'INDEC Argentina 2025 (USD equiv. for stability; ARS inflation 120%+ annually)',
    },
    reason: 'Buenos Aires salary/rent switched to USD equivalent to eliminate ARS seed-rate vs display-rate gap. Burden now 92% (realistic).',
  },
]

async function main() {
  console.log('Applying accuracy patches...\n')
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
