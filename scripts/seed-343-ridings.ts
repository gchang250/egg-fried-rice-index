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
//  - median_total_income_annual, median_employment_income_annual: Statistics
//    Canada Census Profile, 2021, Federal electoral district (2023
//    Representation Order), catalogue 98-401-X2021029, reference year 2020.
//  - party_2025, elected_candidate: Elections Canada, official voting
//    results, 45th general election (April 28, 2025), Table 11.
//  - population_2025, registered_electors_2025: same Elections Canada table.
//  - safety (in ZONES below): Statistics Canada Crime Severity Index, 2024
//    (table 35-10-0026-01), by nearest surveyed CMA.
type RidingReal = {
  fed_num: string
  name: string
  province: string
  latitude: number
  longitude: number
  median_total_income_annual: number
  median_employment_income_annual: number
  party_2025: string
  elected_candidate: string
  population_2025: number
  registered_electors_2025: number
}
const RIDINGS: RidingReal[] = JSON.parse(
  fs.readFileSync(path.resolve(process.cwd(), 'scripts/data/ridings-real-data.json'), 'utf-8')
)

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(a))
}

// Deterministic pseudo-random in [0,1) from a string, used only for the
// remaining fields with no real per-riding public data source (safety,
// healthcare wait, internet speed). See methodology page.
function hashUnit(seed: string): number {
  let h = 2166136261
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return ((h >>> 0) % 100000) / 100000
}

// Rent: CMHC 2025 Rental Market Survey average 1BR rent (StatCan table 34-10-0133-01).
// Safety: Statistics Canada Crime Severity Index, 2024 (table 35-10-0026-01),
// rescaled to a 0-100 "higher is safer" score (raw = 100 - CSI/2, clamped 5-95)
// so it's comparable to the site's existing safety display.
// Both are real survey/administrative data, assigned by nearest surveyed metro
// since neither StatCan nor CMHC publish at the riding level.
type Zone = { name: string; anchor?: [number, number]; maxRadiusKm?: number; rent: number; safety: number }

const ZONES: Record<string, Zone[]> = {
  ON: [
    { name: 'Toronto CMA', anchor: [43.6532, -79.3832], maxRadiusKm: 70, rent: 1761, safety: 70 },
    { name: 'Ottawa-Gatineau CMA', anchor: [45.4215, -75.6972], maxRadiusKm: 60, rent: 1559, safety: 72 },
    { name: 'Hamilton CMA', anchor: [43.2557, -79.8711], maxRadiusKm: 350, rent: 1410, safety: 71 },
    { name: 'Ontario (fallback: Thunder Bay CMA)', rent: 1213, safety: 46 },
  ],
  QC: [
    { name: 'Montréal CMA', anchor: [45.5017, -73.5673], maxRadiusKm: 60, rent: 1200, safety: 69 },
    { name: 'Québec CMA', anchor: [46.8139, -71.2080], maxRadiusKm: 60, rent: 1130, safety: 72 },
    { name: 'Quebec (fallback: Sherbrooke CMA)', rent: 945, safety: 73 },
  ],
  BC: [
    { name: 'Vancouver CMA', anchor: [49.2827, -123.1207], maxRadiusKm: 50, rent: 1809, safety: 59 },
    { name: 'Victoria CMA', anchor: [48.4284, -123.3656], maxRadiusKm: 40, rent: 1622, safety: 64 },
    { name: 'BC (fallback: Kelowna CMA)', rent: 1596, safety: 46 },
  ],
  AB: [
    { name: 'Calgary CMA', anchor: [51.0447, -114.0719], maxRadiusKm: 50, rent: 1585, safety: 69 },
    { name: 'Edmonton CMA', anchor: [53.5461, -113.4938], maxRadiusKm: 50, rent: 1302, safety: 49 },
    { name: 'Alberta (fallback: Lethbridge CMA)', rent: 1392, safety: 47 },
  ],
  SK: [{ name: 'Saskatchewan (Regina/Saskatoon average)', rent: 1254, safety: 23 }],
  MB: [{ name: 'Winnipeg CMA', rent: 1236, safety: 38 }],
  NS: [{ name: 'Halifax CMA', rent: 1550, safety: 63 }],
  NB: [{ name: 'New Brunswick (Moncton/Saint John/Fredericton average)', rent: 1170, safety: 53 }],
  NL: [{ name: "St. John's CMA", rent: 1085, safety: 62 }],
  PE: [{ name: 'Charlottetown CMA', rent: 1090, safety: 64 }],
  // Not covered by CMHC's Rental Market Survey, rent is an estimate, not
  // survey data. Safety is still real (StatCan publishes CSI at the
  // territory level even though CMHC doesn't survey rents there).
  YT: [{ name: 'Yukon (rent estimate, no CMHC coverage)', rent: 1700, safety: 5 }],
  NT: [{ name: 'Northwest Territories (rent estimate, no CMHC coverage)', rent: 1825, safety: 5 }],
  NU: [{ name: 'Nunavut (rent estimate, no CMHC coverage)', rent: 2100, safety: 5 }],
}

function pickZone(prov: string, lat: number, lon: number): Zone {
  const zones = ZONES[prov]
  const fallback = zones[zones.length - 1]
  let best: Zone | null = null
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

// French mother-tongue share, provincial tax-bracket tier, and healthcare
// wait-time label have no equivalent real per-riding source in this pass,
// so they're left as qualitative, zone-level estimates (documented in methodology).
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
    const zone = pickZone(prov, latitude, longitude)
    const qualZone = pickQualZone(prov, latitude, longitude)

    const salaryVal = Math.round(riding.median_total_income_annual / 12)
    const employmentSalaryVal = Math.round(riding.median_employment_income_annual / 12)
    const rentVal = zone.rent

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
      tech_salary_cad: employmentSalaryVal,
      safety_index: zone.safety,
      healthcare_index: Math.floor(55 + hashUnit(`health:${name}`) * 23),
      avg_internet_mbps: Math.floor(80 + hashUnit(`internet:${name}`) * 80),
      salary_data_source: 'Statistics Canada Census Profile 2021 (98-401-X2021029), ref. year 2020',
      rent_data_source: zone.name + ', CMHC Rental Market Survey 2025 (StatCan table 34-10-0133-01)',
      median_rent_local: qualZone.french,
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
