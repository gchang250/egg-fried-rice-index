/**
 * Seed script — liveability metrics for all 18 cities.
 *
 * Run AFTER the SQL migration has added the new columns:
 *   export $(grep -v '^#' .env.local | xargs) && npx tsx scripts/seed-metrics-v1.ts
 *
 * Data sources (all figures approximate, Q1–Q2 2026):
 *   Rent       — Numbeo, Expatistan, local housing portals
 *   Salary     — National statistics offices, Glassdoor, LinkedIn Salary Insights
 *   Safety     — Numbeo Crime Index (inverted to 0–100 safety scale)
 *   Healthcare — Numbeo Healthcare Index
 *   Internet   — Ookla Speedtest Global Index Q1 2026
 *   Visa       — Government immigration portals (perspective: Western passport holder)
 *   English    — EF English Proficiency Index 2025, Wikipedia official language status
 *
 * Exchange rates (May 2026 — same as seed scripts):
 *   USD → CAD 1.39   SGD → CAD 1.08
 *   JPY → CAD 0.00869  CNY → CAD 0.203
 *   KRW → CAD 0.00091  HKD → CAD 0.1748
 */

import { createClient } from '@supabase/supabase-js'

const s = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

const r = (n: number) => Math.round(n * 100) / 100

// ── Exchange helpers ──────────────────────────────────────────────────────────
const usd = (x: number) => r(x * 1.39)
const sgd = (x: number) => r(x * 1.08)
const jpy = (x: number) => r(x * 0.00869)
const cny = (x: number) => r(x * 0.203)
const krw = (x: number) => r(x * 0.00091)
const hkd = (x: number) => r(x * 0.1748)

type CityMetrics = {
  city: string

  // Rent — median 1BR apartment, city centre, monthly
  median_rent_local: number
  median_rent_1br_cad: number
  rent_data_source: string

  // Salary — median gross monthly
  median_monthly_salary_local: number
  median_monthly_salary_cad: number
  // Tech/knowledge workers — median gross monthly
  tech_salary_local: number
  tech_salary_cad: number
  salary_data_source: string

  // Liveability
  safety_index: number       // 0–100, higher = safer
  healthcare_index: number   // 0–100
  english_proficiency: string // 'native' | 'high' | 'medium' | 'low'
  visa_ease: string          // 'easy' | 'moderate' | 'complex'
  avg_internet_mbps: number
}

const METRICS: CityMetrics[] = [

  // ── NORTH AMERICA ──────────────────────────────────────────────────────────

  {
    city: 'New York',
    median_rent_local: 3500, median_rent_1br_cad: usd(3500),
    rent_data_source: 'Numbeo / StreetEasy Q1 2026',
    median_monthly_salary_local: 5800, median_monthly_salary_cad: usd(5800),
    tech_salary_local: 9500, tech_salary_cad: usd(9500),
    salary_data_source: 'US BLS / LinkedIn Salary Insights 2025',
    safety_index: 54,
    healthcare_index: 68,
    english_proficiency: 'native',
    visa_ease: 'complex',
    avg_internet_mbps: 175,
  },
  {
    city: 'Los Angeles',
    median_rent_local: 2650, median_rent_1br_cad: usd(2650),
    rent_data_source: 'Numbeo / Zillow Q1 2026',
    median_monthly_salary_local: 4800, median_monthly_salary_cad: usd(4800),
    tech_salary_local: 8800, tech_salary_cad: usd(8800),
    salary_data_source: 'US BLS / LinkedIn Salary Insights 2025',
    safety_index: 43,
    healthcare_index: 66,
    english_proficiency: 'native',
    visa_ease: 'complex',
    avg_internet_mbps: 155,
  },
  {
    city: 'Chicago',
    median_rent_local: 2000, median_rent_1br_cad: usd(2000),
    rent_data_source: 'Numbeo / Apartments.com Q1 2026',
    median_monthly_salary_local: 4500, median_monthly_salary_cad: usd(4500),
    tech_salary_local: 7500, tech_salary_cad: usd(7500),
    salary_data_source: 'US BLS / LinkedIn Salary Insights 2025',
    safety_index: 37,
    healthcare_index: 70,
    english_proficiency: 'native',
    visa_ease: 'complex',
    avg_internet_mbps: 165,
  },
  {
    city: 'Houston',
    median_rent_local: 1600, median_rent_1br_cad: usd(1600),
    rent_data_source: 'Numbeo / Apartments.com Q1 2026',
    median_monthly_salary_local: 4200, median_monthly_salary_cad: usd(4200),
    tech_salary_local: 7000, tech_salary_cad: usd(7000),
    salary_data_source: 'US BLS / LinkedIn Salary Insights 2025',
    safety_index: 41,
    healthcare_index: 65,
    english_proficiency: 'native',
    visa_ease: 'complex',
    avg_internet_mbps: 150,
  },
  {
    city: 'Phoenix',
    median_rent_local: 1500, median_rent_1br_cad: usd(1500),
    rent_data_source: 'Numbeo / Apartments.com Q1 2026',
    median_monthly_salary_local: 3900, median_monthly_salary_cad: usd(3900),
    tech_salary_local: 6800, tech_salary_cad: usd(6800),
    salary_data_source: 'US BLS / LinkedIn Salary Insights 2025',
    safety_index: 50,
    healthcare_index: 68,
    english_proficiency: 'native',
    visa_ease: 'complex',
    avg_internet_mbps: 145,
  },
  {
    city: 'Philadelphia',
    median_rent_local: 1750, median_rent_1br_cad: usd(1750),
    rent_data_source: 'Numbeo / Zillow Q1 2026',
    median_monthly_salary_local: 4100, median_monthly_salary_cad: usd(4100),
    tech_salary_local: 7200, tech_salary_cad: usd(7200),
    salary_data_source: 'US BLS / LinkedIn Salary Insights 2025',
    safety_index: 35,
    healthcare_index: 72,
    english_proficiency: 'native',
    visa_ease: 'complex',
    avg_internet_mbps: 155,
  },
  {
    city: 'Toronto',
    median_rent_local: 2900, median_rent_1br_cad: 2900,
    rent_data_source: 'CMHC / Rentals.ca Q1 2026',
    median_monthly_salary_local: 4900, median_monthly_salary_cad: 4900,
    tech_salary_local: 7600, tech_salary_cad: 7600,
    salary_data_source: 'Statistics Canada 2025 / LinkedIn Salary Insights',
    safety_index: 60,
    healthcare_index: 72,
    english_proficiency: 'native',
    visa_ease: 'complex',
    avg_internet_mbps: 145,
  },
  {
    city: 'Vancouver',
    median_rent_local: 3200, median_rent_1br_cad: 3200,
    rent_data_source: 'CMHC / Rentals.ca Q1 2026',
    median_monthly_salary_local: 4600, median_monthly_salary_cad: 4600,
    tech_salary_local: 7200, tech_salary_cad: 7200,
    salary_data_source: 'Statistics Canada 2025 / LinkedIn Salary Insights',
    safety_index: 58,
    healthcare_index: 73,
    english_proficiency: 'native',
    visa_ease: 'complex',
    avg_internet_mbps: 140,
  },
  {
    city: 'Montreal',
    median_rent_local: 1950, median_rent_1br_cad: 1950,
    rent_data_source: 'CMHC / Rentals.ca Q1 2026',
    median_monthly_salary_local: 4200, median_monthly_salary_cad: 4200,
    tech_salary_local: 6400, tech_salary_cad: 6400,
    salary_data_source: 'Statistics Canada 2025 / LinkedIn Salary Insights',
    safety_index: 62,
    healthcare_index: 74,
    english_proficiency: 'native',  // bilingual city, English widely spoken
    visa_ease: 'complex',
    avg_internet_mbps: 130,
  },
  {
    city: 'Calgary',
    median_rent_local: 2100, median_rent_1br_cad: 2100,
    rent_data_source: 'CMHC / Rentals.ca Q1 2026',
    median_monthly_salary_local: 5300, median_monthly_salary_cad: 5300,
    tech_salary_local: 7600, tech_salary_cad: 7600,
    salary_data_source: 'Statistics Canada 2025 / LinkedIn Salary Insights',
    safety_index: 68,
    healthcare_index: 74,
    english_proficiency: 'native',
    visa_ease: 'complex',
    avg_internet_mbps: 125,
  },
  {
    city: 'Edmonton',
    median_rent_local: 1700, median_rent_1br_cad: 1700,
    rent_data_source: 'CMHC / Rentals.ca Q1 2026',
    median_monthly_salary_local: 5100, median_monthly_salary_cad: 5100,
    tech_salary_local: 7100, tech_salary_cad: 7100,
    salary_data_source: 'Statistics Canada 2025 / LinkedIn Salary Insights',
    safety_index: 60,
    healthcare_index: 73,
    english_proficiency: 'native',
    visa_ease: 'complex',
    avg_internet_mbps: 120,
  },

  // ── EAST ASIA ──────────────────────────────────────────────────────────────

  {
    city: 'Singapore',
    median_rent_local: 3800, median_rent_1br_cad: sgd(3800),
    rent_data_source: 'PropertyGuru / Numbeo Q1 2026',
    median_monthly_salary_local: 5800, median_monthly_salary_cad: sgd(5800),
    tech_salary_local: 8200, tech_salary_cad: sgd(8200),
    salary_data_source: 'MOM Singapore Occupational Wage Survey 2025',
    safety_index: 84,
    healthcare_index: 78,
    english_proficiency: 'native',  // official language
    visa_ease: 'easy',
    avg_internet_mbps: 260,
  },
  {
    city: 'Hong Kong',
    median_rent_local: 18000, median_rent_1br_cad: hkd(18000),
    rent_data_source: '28Hse / Numbeo Q1 2026',
    median_monthly_salary_local: 22000, median_monthly_salary_cad: hkd(22000),
    tech_salary_local: 35000, tech_salary_cad: hkd(35000),
    salary_data_source: 'HKSAR Census & Statistics Department 2025',
    safety_index: 70,
    healthcare_index: 75,
    english_proficiency: 'high',   // co-official language, widely spoken in business
    visa_ease: 'easy',
    avg_internet_mbps: 230,
  },
  {
    city: 'Tokyo',
    median_rent_local: 180000, median_rent_1br_cad: jpy(180000),
    rent_data_source: 'SUUMO / Numbeo Q1 2026',
    median_monthly_salary_local: 390000, median_monthly_salary_cad: jpy(390000),
    tech_salary_local: 560000, tech_salary_cad: jpy(560000),
    salary_data_source: 'Japan Ministry of Health, Labour and Welfare 2025',
    safety_index: 82,
    healthcare_index: 82,
    english_proficiency: 'medium',
    visa_ease: 'moderate',   // visa-free tourist; work visa requires employer sponsorship
    avg_internet_mbps: 200,
  },
  {
    city: 'Osaka',
    median_rent_local: 120000, median_rent_1br_cad: jpy(120000),
    rent_data_source: 'SUUMO / Numbeo Q1 2026',
    median_monthly_salary_local: 340000, median_monthly_salary_cad: jpy(340000),
    tech_salary_local: 490000, tech_salary_cad: jpy(490000),
    salary_data_source: 'Japan Ministry of Health, Labour and Welfare 2025',
    safety_index: 80,
    healthcare_index: 80,
    english_proficiency: 'medium',
    visa_ease: 'moderate',
    avg_internet_mbps: 195,
  },
  {
    city: 'Seoul',
    median_rent_local: 1800000, median_rent_1br_cad: krw(1800000),
    rent_data_source: 'Naver Real Estate / Numbeo Q1 2026',
    median_monthly_salary_local: 3300000, median_monthly_salary_cad: krw(3300000),
    tech_salary_local: 5600000, tech_salary_cad: krw(5600000),
    salary_data_source: 'Statistics Korea / LinkedIn Salary Insights 2025',
    safety_index: 76,
    healthcare_index: 84,
    english_proficiency: 'medium', // tourist infrastructure extensively English-friendly; young population speaks it well
    visa_ease: 'moderate',
    avg_internet_mbps: 245,
  },
  {
    city: 'Beijing',
    median_rent_local: 8500, median_rent_1br_cad: cny(8500),
    rent_data_source: 'Lianjia / Numbeo Q1 2026',
    median_monthly_salary_local: 18000, median_monthly_salary_cad: cny(18000),
    tech_salary_local: 28000, tech_salary_cad: cny(28000),
    salary_data_source: 'National Bureau of Statistics China 2025',
    safety_index: 65,
    healthcare_index: 63,
    english_proficiency: 'medium',
    visa_ease: 'complex',  // visa required; improving with 6-day visa-free transit
    avg_internet_mbps: 145,
  },
  {
    city: 'Shanghai',
    median_rent_local: 10000, median_rent_1br_cad: cny(10000),
    rent_data_source: 'Lianjia / Numbeo Q1 2026',
    median_monthly_salary_local: 22000, median_monthly_salary_cad: cny(22000),
    tech_salary_local: 32000, tech_salary_cad: cny(32000),
    salary_data_source: 'National Bureau of Statistics China 2025',
    safety_index: 68,
    healthcare_index: 65,
    english_proficiency: 'medium',
    visa_ease: 'complex',
    avg_internet_mbps: 155,
  },
]

async function main() {
  console.log('Seeding liveability metrics for', METRICS.length, 'cities...\n')

  let ok = 0, fail = 0
  for (const m of METRICS) {
    const { error } = await s.from('cities').update({
      median_rent_1br_cad:         r(m.median_rent_1br_cad),
      median_rent_local:            m.median_rent_local,
      median_monthly_salary_cad:    r(m.median_monthly_salary_cad),
      median_monthly_salary_local:  m.median_monthly_salary_local,
      tech_salary_cad:              r(m.tech_salary_cad),
      tech_salary_local:            m.tech_salary_local,
      safety_index:                 m.safety_index,
      healthcare_index:             m.healthcare_index,
      english_proficiency:          m.english_proficiency,
      visa_ease:                    m.visa_ease,
      avg_internet_mbps:            m.avg_internet_mbps,
      salary_data_source:           m.salary_data_source,
      rent_data_source:             m.rent_data_source,
    }).eq('city', m.city)

    if (error) {
      console.error(`✗ ${m.city}: ${error.message}`)
      fail++
    } else {
      const bowlPrice = 0 // will be shown after
      const rentBowls = '—'
      console.log(`✓ ${m.city}`)
      console.log(`    rent CA$${r(m.median_rent_1br_cad)}/mo | salary CA$${r(m.median_monthly_salary_cad)}/mo | tech CA$${r(m.tech_salary_cad)}/mo`)
      console.log(`    safety ${m.safety_index} | healthcare ${m.healthcare_index} | english: ${m.english_proficiency} | visa: ${m.visa_ease} | ${m.avg_internet_mbps} Mbps`)
      ok++
    }
  }

  console.log(`\n${ok} cities updated, ${fail} failed.`)
  if (fail > 0) {
    console.log('\nIf you see "column does not exist" errors, run the SQL migration first:')
    console.log('  → Supabase dashboard → SQL editor → paste scripts/migrate-v1-city-metrics.sql')
  }
}

main().catch(console.error)
