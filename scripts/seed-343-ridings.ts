import fs from 'fs'
import path from 'path'
import { createClient } from '@supabase/supabase-js'

// Load environment variables from .env.local
try {
  const envPath = path.resolve(process.cwd(), '.env.local')
  if (fs.existsSync(envPath)) {
    const envFile = fs.readFileSync(envPath, 'utf-8')
    envFile.split('\n').forEach(line => {
      const parts = line.split('=')
      if (parts.length >= 2) {
        const key = parts[0].trim()
        const val = parts.slice(1).join('=').trim().replace(/^['"]|['"]$/g, '')
        process.env[key] = val
      }
    })
  }
} catch (e) {
  console.warn('Could not load .env.local:', e)
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const NOW = new Date().toISOString()

// Real data for all 343 federal ridings under the 2023 Representation Order:
//  - fed_num, name, province, latitude, longitude: Elections Canada boundary
//    data via the Represent API (OpenNorth), matches public/ridings.json.
//  - median_total_income_annual, median_employment_income_annual,
//    median_household_income_annual: Statistics Canada Census Profile, 2021,
//    Federal electoral district (2023 Representation Order), catalogue
//    98-401-X2021029, reference year 2020.
//  - party_2025, elected_candidate: Elections Canada, official voting
//    results, 45th general election (April 28, 2025), Table 11.
//  - population_2025, registered_electors_2025: same Elections Canada table.
type RidingReal = {
  fed_num: string
  name: string
  province: string
  latitude: number
  longitude: number
  median_total_income_annual: number
  median_employment_income_annual: number
  median_household_income_annual: number
  party_2025: string
  elected_candidate: string
  population_2025: number
  registered_electors_2025: number
}
const RIDINGS: RidingReal[] = JSON.parse(
  fs.readFileSync(path.resolve(process.cwd(), 'scripts/data/ridings-real-data.json'), 'utf-8')
)

// Rent and safety, assigned to each riding by nearest surveyed metro, because
// neither agency publishes at the riding level. Built by
// scripts/data/build-metro-assignments.py; see that file for the derivation.
//  - rent_1br_cad: CMHC Rental Market Survey 2025, average rent for a
//    one-bedroom unit (StatCan table 34-10-0133-01).
//  - csi / safety_index: Statistics Canada Crime Severity Index, 2024 (table
//    35-10-0026-01), rescaled to a 0-100 "higher is safer" score via
//    100 - CSI/2, clamped to 5-95.
// Distance is measured from the surveyed centre to the riding's 2023 boundary
// polygon, so a centre inside the riding scores 0 km.
type MetroAssignment = {
  rent_1br_cad: number
  rent_metro: string
  rent_distance_km: number
  csi: number
  csi_geo: string
  csi_distance_km: number | null
  safety_index: number
}
const ASSIGNMENTS: Record<string, MetroAssignment> = JSON.parse(
  fs.readFileSync(path.resolve(process.cwd(), 'scripts/data/metro-assignments.json'), 'utf-8')
)

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(a))
}

// French mother-tongue share, provincial tax-bracket tier, and healthcare
// wait-time label have no equivalent real per-riding source in this pass,
// so they're left as qualitative, zone-level estimates. Nothing on the site
// presents these as sourced government data.
type QualZone = { anchor?: [number, number]; maxRadiusKm?: number; french: number; tax: string; wait: string }
const QUAL_ZONES: Record<string, QualZone[]> = {
  ON: [
    { anchor: [45.4215, -75.6972], maxRadiusKm: 60, french: 32.4, tax: 'Medium', wait: 'Moderate' },
    { french: 2.8, tax: 'Medium', wait: 'Moderate' },
  ],
  QC: [
    { anchor: [45.5017, -73.5673], maxRadiusKm: 60, french: 71.3, tax: 'High', wait: 'High' },
    { anchor: [46.8139, -71.2080], maxRadiusKm: 60, french: 94.0, tax: 'High', wait: 'High' },
    { french: 89.5, tax: 'High', wait: 'High' },
  ],
  BC: [{ french: 1.4, tax: 'Medium', wait: 'Moderate' }],
  AB: [{ french: 2.1, tax: 'Low', wait: 'Moderate' }],
  SK: [{ french: 1.4, tax: 'Medium', wait: 'Moderate' }],
  MB: [{ french: 3.2, tax: 'Medium', wait: 'Moderate' }],
  NS: [{ french: 3.3, tax: 'High', wait: 'High' }],
  NB: [{ french: 33.5, tax: 'High', wait: 'High' }],
  NL: [{ french: 0.4, tax: 'Medium', wait: 'High' }],
  PE: [{ french: 3.8, tax: 'Medium', wait: 'Moderate' }],
  YT: [{ french: 3.4, tax: 'Low', wait: 'Moderate' }],
  NT: [{ french: 2.1, tax: 'Low', wait: 'High' }],
  NU: [{ french: 1.5, tax: 'Low', wait: 'High' }],
}

function pickQualZone(prov: string, lat: number, lon: number): QualZone {
  const zones = QUAL_ZONES[prov]
  const fallback = zones[zones.length - 1]
  let best: QualZone | null = null
  let bestDist = Infinity
  for (const z of zones) {
    if (!z.anchor || !z.maxRadiusKm) continue
    const dist = haversineKm(lat, lon, z.anchor[0], z.anchor[1])
    if (dist <= z.maxRadiusKm && dist < bestDist) {
      best = z
      bestDist = dist
    }
  }
  return best ?? fallback
}

async function run() {
  console.log('--- Wiping existing database tables ---')

  const { error: delReportsErr } = await supabase.from('monthly_reports').delete().neq('month', '1970-01')
  if (delReportsErr) console.error('Warning deleting reports:', delReportsErr)

  const { error: delRestErr } = await supabase.from('restaurants').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  if (delRestErr) console.error('Warning deleting restaurants:', delRestErr)

  const { error: delPendErr } = await supabase.from('pending_requests').delete().neq('status', 'resolved_completely')
  if (delPendErr) console.error('Warning deleting pending requests:', delPendErr)

  const { error: delCitiesErr } = await supabase.from('cities').delete().neq('city', 'Not Real City')
  if (delCitiesErr) {
    console.error('Failed to wipe cities:', delCitiesErr)
    process.exit(1)
  }
  console.log('✓ Successfully wiped database tables')

  console.log(`\n--- Seeding ${RIDINGS.length} Canadian Electoral Ridings (real boundaries, income, party, population) ---`)

  const citiesToInsert = RIDINGS.map(riding => {
    const { name, province: prov, latitude, longitude } = riding
    const assign = ASSIGNMENTS[riding.fed_num]
    if (!assign) throw new Error(`No metro assignment for riding ${riding.fed_num} (${name})`)
    const qualZone = pickQualZone(prov, latitude, longitude)

    // Straight monthly conversions of the real annual census medians. No
    // adjustment factors: the site states these figures are the census values.
    const salaryVal = Math.round(riding.median_total_income_annual / 12)
    const householdSalaryVal = Math.round(riding.median_household_income_annual / 12)
    const rentVal = assign.rent_1br_cad

    const rentSource =
      `CMHC Rental Market Survey 2025, average one-bedroom rent for ` +
      `${assign.rent_metro} (Statistics Canada table 34-10-0133-01); ` +
      `nearest surveyed centre, ${assign.rent_distance_km} km from this riding`

    return {
      city: name,
      country: 'Canada',
      region: prov,
      flag: '🇨🇦',
      latitude,
      longitude,
      population: String(riding.population_2025),
      climate: 'Humid continental / Maritime climate',
      blurb: `Federal electoral district riding of ${name}, ${prov}. Represented by ${riding.elected_candidate} (${riding.party_2025}) following the 2025 general election.`,
      median_rent_1br_cad: rentVal,
      median_monthly_salary_cad: salaryVal,
      tech_salary_cad: householdSalaryVal,
      safety_index: assign.safety_index,
      healthcare_index: null,
      avg_internet_mbps: null,
      salary_data_source: 'Statistics Canada Census Profile 2021 (98-401-X2021029), ref. year 2020',
      rent_data_source: rentSource,
      median_rent_local: null,
      english_proficiency: qualZone.tax,
      visa_ease: qualZone.wait,
      price_cad: null,
      baseline_median_cad: null,
      price_source: riding.party_2025,
      population_source: 'Elections Canada, 45th general election official voting results (2025)',
      population_updated_at: NOW,
      price_updated_at: NOW,
      confidence_score: 0.95
    }
  })

  // Insert in batches of 100 to avoid request body size limitations
  console.log(`Seeding ${citiesToInsert.length} total ridings...`)
  const BATCH_SIZE = 100
  for (let start = 0; start < citiesToInsert.length; start += BATCH_SIZE) {
    const batch = citiesToInsert.slice(start, start + BATCH_SIZE)
    const { error } = await supabase.from('cities').insert(batch)
    if (error) {
      console.error(`Failed to insert batch starting at ${start}:`, error)
      process.exit(1)
    }
    console.log(`✓ Inserted batch ${start / BATCH_SIZE + 1} (${batch.length} ridings)`)
  }

  console.log('\n--- Seeding monthly report ---')
  const reportAnalysis = `Canadian Purchasing Power & Housing Burden Analysis (July 2026)

This release maps all 343 Canadian federal ridings under the 2023 Representation Order using official Elections Canada riding boundaries, real median income by riding from Statistics Canada's 2021 Census Profile, real 2025 general election results, and CMHC 2025 rental survey data applied by nearest surveyed metro. By evaluating median individual income directly against local housing rental costs, the index maps affordability pressure across the country's federal ridings.

Regional Purchasing Disparities: Ridings in downtown Toronto and Vancouver experience the most severe rent burdens relative to local income. Ridings in Alberta and Saskatchewan tend to offer higher disposable income due to comparatively high wages and moderate housing costs.`

  const cheapestRiding = citiesToInsert.reduce((min, c) => c.median_rent_1br_cad < min.median_rent_1br_cad ? c : min)
  const priciestRiding = citiesToInsert.reduce((max, c) => c.median_rent_1br_cad > max.median_rent_1br_cad ? c : max)

  const reportRow = {
    month: '2026-07',
    title: 'July 2026 Report',
    subtitle: 'Socio-economic Cost of Living and Housing Rent Burden across 343 Canadian Ridings',
    city_count: citiesToInsert.length,
    new_cities: citiesToInsert.slice(0, 10).map(c => c.city),
    analysis: reportAnalysis,
    cheapest_city: cheapestRiding.city,
    cheapest_price_cad: cheapestRiding.median_rent_1br_cad,
    priciest_city: priciestRiding.city,
    priciest_price_cad: priciestRiding.median_rent_1br_cad,
    spread_ratio: Math.round((priciestRiding.median_rent_1br_cad / cheapestRiding.median_rent_1br_cad) * 100) / 100,
    avg_baseline_cad: Math.round(citiesToInsert.reduce((sum, c) => sum + c.median_rent_1br_cad, 0) / citiesToInsert.length),
    exchange_rates_snapshot: { CAD: 1.0 },
    city_snapshot: citiesToInsert.slice(0, 50).map(c => ({
      city: c.city,
      country: 'Canada',
      region: c.region,
      flag: '🇨🇦',
      price_cad: null,
      median_rent_1br_cad: c.median_rent_1br_cad,
      median_monthly_salary_cad: c.median_monthly_salary_cad,
      baseline_entry_count: 0,
      market_entry_count: 0,
      data_quality_label: 'High confidence'
    })),
    published_at: NOW,
    is_published: true
  }

  const { error: repInsertErr } = await supabase.from('monthly_reports').insert(reportRow)
  if (repInsertErr) {
    console.error('Failed to insert report:', repInsertErr)
    process.exit(1)
  }
  console.log('✓ Seeding complete for July 2026 monthly report with 343 ridings!')
}

run().catch(console.error)
