/**
 * Seed script — liveability metrics for 22 new cities.
 *
 * Run with:
 *   export $(grep -v '^#' .env.local | xargs) && npx tsx scripts/seed-metrics-v2.ts
 */

import { createClient } from '@supabase/supabase-js'

const s = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

const r   = (n: number) => Math.round(n * 100) / 100
const usd = (x: number) => r(x * 1.39)
const inr = (x: number) => r(x * 0.0165)
const aud = (x: number) => r(x * 0.88)
const gbp = (x: number) => r(x * 1.76)
const eur = (x: number) => r(x * 1.51)
const rub = (x: number) => r(x * 0.015)
const aed = (x: number) => r(x * 0.379)
const sar = (x: number) => r(x * 0.370)
const egp = (x: number) => r(x * 0.028)
const pkr = (x: number) => r(x * 0.0036)
const mxn = (x: number) => r(x * 0.072)
const tri = (x: number) => r(x * 0.037)
const ars = (x: number) => r(x * 0.0011)
const cny = (x: number) => r(x * 0.203)

const METRICS = [
  // ── INDIA ──────────────────────────────────────────────────────────────────
  { city: 'Mumbai',
    median_rent_local: 45000, median_rent_1br_cad: inr(45000),
    rent_data_source: 'NoBroker / Numbeo Q1 2026',
    median_monthly_salary_local: 38000, median_monthly_salary_cad: inr(38000),
    tech_salary_local: 95000, tech_salary_cad: inr(95000),
    salary_data_source: 'NASSCOM / LinkedIn Salary Insights India 2025',
    safety_index: 52, healthcare_index: 58,
    english_proficiency: 'high', visa_ease: 'complex', avg_internet_mbps: 80 },

  { city: 'New Delhi',
    median_rent_local: 38000, median_rent_1br_cad: inr(38000),
    rent_data_source: 'NoBroker / Numbeo Q1 2026',
    median_monthly_salary_local: 34000, median_monthly_salary_cad: inr(34000),
    tech_salary_local: 88000, tech_salary_cad: inr(88000),
    salary_data_source: 'NASSCOM / LinkedIn Salary Insights India 2025',
    safety_index: 38, healthcare_index: 55,
    english_proficiency: 'high', visa_ease: 'complex', avg_internet_mbps: 70 },

  { city: 'Kolkata',
    median_rent_local: 22000, median_rent_1br_cad: inr(22000),
    rent_data_source: 'NoBroker / Numbeo Q1 2026',
    median_monthly_salary_local: 28000, median_monthly_salary_cad: inr(28000),
    tech_salary_local: 68000, tech_salary_cad: inr(68000),
    salary_data_source: 'NASSCOM / LinkedIn Salary Insights India 2025',
    safety_index: 52, healthcare_index: 52,
    english_proficiency: 'high', visa_ease: 'complex', avg_internet_mbps: 65 },

  // ── OCEANIA ────────────────────────────────────────────────────────────────
  { city: 'Melbourne',
    median_rent_local: 2200, median_rent_1br_cad: aud(2200),
    rent_data_source: 'Domain.com.au / Numbeo Q1 2026',
    median_monthly_salary_local: 5900, median_monthly_salary_cad: aud(5900),
    tech_salary_local: 8600, tech_salary_cad: aud(8600),
    salary_data_source: 'ABS (Australian Bureau of Statistics) 2025',
    safety_index: 72, healthcare_index: 80,
    english_proficiency: 'native', visa_ease: 'complex', avg_internet_mbps: 135 },

  { city: 'Sydney',
    median_rent_local: 2600, median_rent_1br_cad: aud(2600),
    rent_data_source: 'Domain.com.au / Numbeo Q1 2026',
    median_monthly_salary_local: 6100, median_monthly_salary_cad: aud(6100),
    tech_salary_local: 8900, tech_salary_cad: aud(8900),
    salary_data_source: 'ABS (Australian Bureau of Statistics) 2025',
    safety_index: 68, healthcare_index: 82,
    english_proficiency: 'native', visa_ease: 'complex', avg_internet_mbps: 145 },

  // ── EUROPE ─────────────────────────────────────────────────────────────────
  { city: 'London',
    median_rent_local: 2200, median_rent_1br_cad: gbp(2200),
    rent_data_source: 'Rightmove / Numbeo Q1 2026',
    median_monthly_salary_local: 3500, median_monthly_salary_cad: gbp(3500),
    tech_salary_local: 5600, tech_salary_cad: gbp(5600),
    salary_data_source: 'ONS (Office for National Statistics) UK 2025',
    safety_index: 52, healthcare_index: 72,
    english_proficiency: 'native', visa_ease: 'complex', avg_internet_mbps: 165 },

  { city: 'Paris',
    median_rent_local: 1600, median_rent_1br_cad: eur(1600),
    rent_data_source: 'SeLoger / Numbeo Q1 2026',
    median_monthly_salary_local: 3200, median_monthly_salary_cad: eur(3200),
    tech_salary_local: 4600, tech_salary_cad: eur(4600),
    salary_data_source: 'INSEE (Institut national de la statistique) France 2025',
    safety_index: 55, healthcare_index: 78,
    english_proficiency: 'medium', visa_ease: 'moderate', avg_internet_mbps: 170 },

  { city: 'Moscow',
    median_rent_local: 80000, median_rent_1br_cad: rub(80000),
    rent_data_source: 'CIAN.ru / Numbeo Q1 2026',
    median_monthly_salary_local: 95000, median_monthly_salary_cad: rub(95000),
    tech_salary_local: 210000, tech_salary_cad: rub(210000),
    salary_data_source: 'Rosstat (Federal State Statistics Service) Russia 2025',
    safety_index: 44, healthcare_index: 60,
    english_proficiency: 'low', visa_ease: 'complex', avg_internet_mbps: 75 },

  { city: 'Amsterdam',
    median_rent_local: 1900, median_rent_1br_cad: eur(1900),
    rent_data_source: 'Funda.nl / Numbeo Q1 2026',
    median_monthly_salary_local: 3800, median_monthly_salary_cad: eur(3800),
    tech_salary_local: 5600, tech_salary_cad: eur(5600),
    salary_data_source: 'CBS (Statistics Netherlands) 2025',
    safety_index: 68, healthcare_index: 78,
    english_proficiency: 'high',  // Netherlands #1-2 globally EF EPI
    visa_ease: 'moderate', avg_internet_mbps: 175 },

  // ── MIDDLE EAST ────────────────────────────────────────────────────────────
  { city: 'Dubai',
    median_rent_local: 9000, median_rent_1br_cad: aed(9000),
    rent_data_source: 'PropertyFinder.ae / Numbeo Q1 2026',
    median_monthly_salary_local: 14000, median_monthly_salary_cad: aed(14000),
    tech_salary_local: 22000, tech_salary_cad: aed(22000),
    salary_data_source: 'UAE Ministry of HR / LinkedIn Salary Insights 2025',
    safety_index: 82, healthcare_index: 72,
    english_proficiency: 'high', visa_ease: 'easy', avg_internet_mbps: 190 },

  { city: 'Riyadh',
    median_rent_local: 5000, median_rent_1br_cad: sar(5000),
    rent_data_source: 'Bayut.sa / Numbeo Q1 2026',
    median_monthly_salary_local: 10500, median_monthly_salary_cad: sar(10500),
    tech_salary_local: 18500, tech_salary_cad: sar(18500),
    salary_data_source: 'GASTAT Saudi Arabia / LinkedIn Salary Insights 2025',
    safety_index: 72, healthcare_index: 65,
    english_proficiency: 'medium', visa_ease: 'moderate', avg_internet_mbps: 145 },

  { city: 'Tehran',
    // USD-equivalent pricing (IRR too volatile)
    median_rent_local: 600, median_rent_1br_cad: usd(600),
    rent_data_source: 'Divar.ir (USD equivalent, market rate) Q1 2026',
    median_monthly_salary_local: 420, median_monthly_salary_cad: usd(420),
    tech_salary_local: 1300, tech_salary_cad: usd(1300),
    salary_data_source: 'SCI Iran (Statistical Centre of Iran) 2025, USD equiv.',
    safety_index: 42, healthcare_index: 55,
    english_proficiency: 'low', visa_ease: 'complex', avg_internet_mbps: 28 },

  // ── AFRICA ─────────────────────────────────────────────────────────────────
  { city: 'Cairo',
    median_rent_local: 10000, median_rent_1br_cad: egp(10000),
    rent_data_source: 'Aqarmap.com / Numbeo Q1 2026',
    median_monthly_salary_local: 9000, median_monthly_salary_cad: egp(9000),
    tech_salary_local: 25000, tech_salary_cad: egp(25000),
    salary_data_source: 'CAPMAS Egypt / LinkedIn Salary Insights 2025',
    safety_index: 40, healthcare_index: 45,
    english_proficiency: 'medium', visa_ease: 'easy', avg_internet_mbps: 55 },

  // ── SOUTH ASIA ─────────────────────────────────────────────────────────────
  { city: 'Karachi',
    median_rent_local: 55000, median_rent_1br_cad: pkr(55000),
    rent_data_source: 'Zameen.com / Numbeo Q1 2026',
    median_monthly_salary_local: 48000, median_monthly_salary_cad: pkr(48000),
    tech_salary_local: 155000, tech_salary_cad: pkr(155000),
    salary_data_source: 'PBS Pakistan / LinkedIn Salary Insights 2025',
    safety_index: 32, healthcare_index: 38,
    english_proficiency: 'high',  // co-official language, widely used in business
    visa_ease: 'complex', avg_internet_mbps: 45 },

  // ── LATIN AMERICA ──────────────────────────────────────────────────────────
  { city: 'Mexico City',
    median_rent_local: 18000, median_rent_1br_cad: mxn(18000),
    rent_data_source: 'Lamudi.com.mx / Numbeo Q1 2026',
    median_monthly_salary_local: 18500, median_monthly_salary_cad: mxn(18500),
    tech_salary_local: 42000, tech_salary_cad: mxn(42000),
    salary_data_source: 'INEGI Mexico / LinkedIn Salary Insights 2025',
    safety_index: 40, healthcare_index: 62,
    english_proficiency: 'low', visa_ease: 'easy', avg_internet_mbps: 90 },

  { city: 'Buenos Aires',
    median_rent_local: 900000, median_rent_1br_cad: ars(900000),
    rent_data_source: 'ZonaProp.com.ar / Numbeo Q1 2026 (ARS highly volatile)',
    median_monthly_salary_local: 700000, median_monthly_salary_cad: ars(700000),
    tech_salary_local: 2400000, tech_salary_cad: ars(2400000),
    salary_data_source: 'INDEC Argentina 2025 (nominal ARS)',
    safety_index: 42, healthcare_index: 60,
    english_proficiency: 'low', visa_ease: 'easy', avg_internet_mbps: 80 },

  // ── EUROPE (Turkey) ────────────────────────────────────────────────────────
  { city: 'Istanbul',
    median_rent_local: 18000, median_rent_1br_cad: tri(18000),
    rent_data_source: 'Emlakjet.com / Numbeo Q1 2026',
    median_monthly_salary_local: 23000, median_monthly_salary_cad: tri(23000),
    tech_salary_local: 58000, tech_salary_cad: tri(58000),
    salary_data_source: 'TÜİK (Turkish Statistical Institute) 2025',
    safety_index: 52, healthcare_index: 68,
    english_proficiency: 'low', visa_ease: 'moderate', avg_internet_mbps: 80 },

  // ── EAST ASIA (China tier-2) ───────────────────────────────────────────────
  { city: 'Suzhou',
    median_rent_local: 5500, median_rent_1br_cad: cny(5500),
    rent_data_source: 'Lianjia / Numbeo Q1 2026',
    median_monthly_salary_local: 12500, median_monthly_salary_cad: cny(12500),
    tech_salary_local: 22000, tech_salary_cad: cny(22000),
    salary_data_source: 'NBS China / LinkedIn Salary Insights 2025',
    safety_index: 72, healthcare_index: 64,
    english_proficiency: 'low', visa_ease: 'complex', avg_internet_mbps: 155 },

  { city: 'Wuhan',
    median_rent_local: 4500, median_rent_1br_cad: cny(4500),
    rent_data_source: 'Lianjia / Numbeo Q1 2026',
    median_monthly_salary_local: 10500, median_monthly_salary_cad: cny(10500),
    tech_salary_local: 18500, tech_salary_cad: cny(18500),
    salary_data_source: 'NBS China / LinkedIn Salary Insights 2025',
    safety_index: 68, healthcare_index: 65,
    english_proficiency: 'low', visa_ease: 'complex', avg_internet_mbps: 145 },

  { city: 'Chongqing',
    median_rent_local: 3800, median_rent_1br_cad: cny(3800),
    rent_data_source: 'Lianjia / Numbeo Q1 2026',
    median_monthly_salary_local: 9200, median_monthly_salary_cad: cny(9200),
    tech_salary_local: 16500, tech_salary_cad: cny(16500),
    salary_data_source: 'NBS China / LinkedIn Salary Insights 2025',
    safety_index: 65, healthcare_index: 62,
    english_proficiency: 'low', visa_ease: 'complex', avg_internet_mbps: 140 },

  { city: 'Chengdu',
    median_rent_local: 4000, median_rent_1br_cad: cny(4000),
    rent_data_source: 'Lianjia / Numbeo Q1 2026',
    median_monthly_salary_local: 9800, median_monthly_salary_cad: cny(9800),
    tech_salary_local: 18500, tech_salary_cad: cny(18500),
    salary_data_source: 'NBS China / LinkedIn Salary Insights 2025',
    safety_index: 70, healthcare_index: 63,
    english_proficiency: 'low', visa_ease: 'complex', avg_internet_mbps: 140 },

  // ── NORTH AMERICA ──────────────────────────────────────────────────────────
  { city: 'Miami',
    median_rent_local: 2200, median_rent_1br_cad: usd(2200),
    rent_data_source: 'Zillow / Numbeo Q1 2026',
    median_monthly_salary_local: 4400, median_monthly_salary_cad: usd(4400),
    tech_salary_local: 7600, tech_salary_cad: usd(7600),
    salary_data_source: 'US BLS / LinkedIn Salary Insights 2025',
    safety_index: 47, healthcare_index: 68,
    english_proficiency: 'native', visa_ease: 'complex', avg_internet_mbps: 150 },
]

async function main() {
  console.log(`Seeding liveability metrics for ${METRICS.length} cities...\n`)
  let ok = 0, fail = 0

  for (const m of METRICS) {
    const { error } = await s.from('cities').update({
      median_rent_1br_cad:          m.median_rent_1br_cad,
      median_rent_local:             m.median_rent_local,
      median_monthly_salary_cad:     m.median_monthly_salary_cad,
      median_monthly_salary_local:   m.median_monthly_salary_local,
      tech_salary_cad:               m.tech_salary_cad,
      tech_salary_local:             m.tech_salary_local,
      safety_index:                  m.safety_index,
      healthcare_index:              m.healthcare_index,
      english_proficiency:           m.english_proficiency,
      visa_ease:                     m.visa_ease,
      avg_internet_mbps:             m.avg_internet_mbps,
      salary_data_source:            m.salary_data_source,
      rent_data_source:              m.rent_data_source,
    }).eq('city', m.city)

    if (error) { console.error(`✗ ${m.city}: ${error.message}`); fail++ }
    else {
      console.log(`✓ ${m.city}  rent CA$${m.median_rent_1br_cad} | salary CA$${m.median_monthly_salary_cad} | tech CA$${m.tech_salary_cad}`)
      ok++
    }
  }
  console.log(`\n${ok} updated, ${fail} failed.`)
}
main().catch(console.error)
