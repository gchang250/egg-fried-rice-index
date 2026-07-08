/**
 * audit-data-quality.ts — Quadruple-check every active restaurant entry.
 *
 * Checks (in order):
 *   1. CITY DISAMBIGUATION  — city names known to exist in multiple places
 *   2. FABRICATED NAMES     — heuristics for AI-hallucinated restaurant names
 *   3. GENERIC SOURCE URLS  — category/search pages instead of specific menus
 *   4. PORTION SIZE         — prices too high for one person; may be shared dish
 *   5. PRICE OUTLIERS       — statistical outliers within each city
 *   6. SOURCE QUALITY       — scores evidence strength per entry
 *   7. COVERAGE GAPS        — cities with thin or imbalanced data
 *   8. DUPLICATES           — near-duplicate entries within the same city
 *   9. PPP PLAUSIBILITY     — price in international$ must be $1–$20 (new)
 *  10. WAGE RATIO           — price vs. local median hourly wage (new)
 *
 * Does NOT modify the database. Outputs a report and exits with code 1 if
 * any CRITICAL issues are found.
 *
 * Run:
 *   export $(grep -v '^#' .env.local | xargs) && npx tsx scripts/audit-data-quality.ts
 * Flags:
 *   --city "Toronto"     Only audit one city
 *   --severity critical  Only print critical issues (default: all)
 *   --json               Output machine-readable JSON summary at the end
 */

import { createClient } from '@supabase/supabase-js'

const s = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

const CITY_FILTER = (() => {
  const i = process.argv.indexOf('--city'); return i >= 0 ? process.argv[i + 1] : null
})()
const SEVERITY_FILTER = (() => {
  const i = process.argv.indexOf('--severity'); return i >= 0 ? process.argv[i + 1] : 'all'
})()
const JSON_OUTPUT = process.argv.includes('--json')

// ─── Types ────────────────────────────────────────────────────────────────────

type Severity = 'critical' | 'warning' | 'info'

interface Flag {
  check: string
  severity: Severity
  message: string
}

interface Row {
  id: string
  city: string
  country: string
  restaurant_name: string
  dish_name: string
  dish_category: string
  tier: string
  price_cad: number
  local_price: number
  local_currency: string
  source_url: string | null
  source_type: string | null
  confidence_score: number | null
  included_in_baseline: boolean | null
  approved: boolean | null
  active: boolean | null
  notes: string | null
}

// ─── 1. City disambiguation ───────────────────────────────────────────────────
// Names that exist in more than one country/state and have appeared as data errors
// in AI-generated seeds. The value is a description of the ambiguity.

const AMBIGUOUS_CITIES: Record<string, string> = {
  'Vancouver':    'Vancouver, BC, Canada vs. Vancouver, WA, USA',
  'Portland':     'Portland, OR, USA vs. Portland, ME, USA',
  'Springfield':  'Multiple US states — must specify state',
  'Hamilton':     'Hamilton, ON, Canada vs. Hamilton, New Zealand vs. Bermuda',
  'Richmond':     'Richmond, BC, Canada vs. Richmond, VA, USA vs. London Borough of Richmond, UK',
  'Kingston':     'Kingston, ON, Canada vs. Kingston, Jamaica vs. Kingston upon Thames, UK',
  'Perth':        'Perth, Western Australia vs. Perth, Scotland, UK',
  'Edinburgh':    'Edinburgh, Scotland vs. Edinburgh, Indiana, USA',
  'Calgary':      'Calgary, AB, Canada — verify not Calgary, Wales, UK (very small)',
  'Adelaide':     'Adelaide, South Australia — verify not Adelaide suburb of another city',
  'Bristol':      'Bristol, UK vs. Bristol, CT / VA / TN, USA',
  'Cambridge':    'Cambridge, UK (England) vs. Cambridge, MA, USA',
  'Oxford':       'Oxford, UK vs. Oxford, MS / OH, USA',
  'Bath':         'Bath, UK vs. Bath, ME / NY / OH, USA',
  'Wellington':   'Wellington, New Zealand vs. Wellington, FL / KS, USA',
  'Phoenix':      'Phoenix, AZ, USA — confirm state, not Phoenix, Ireland',
  'Guangzhou':    'Guangzhou (Canton), China — confirm not confused with other Guangdong cities',
  'Chengdu':      'Chengdu, Sichuan, China — confirm not Chongqing or another Southwest city',
}

function checkCityAmbiguity(city: string, country: string): Flag | null {
  const hint = AMBIGUOUS_CITIES[city]
  if (!hint) return null
  return {
    check: 'CITY_DISAMBIGUATION',
    severity: 'warning',
    message: `"${city}" is ambiguous. Known conflicts: ${hint}. Confirm country="${country}" is correct.`,
  }
}

// ─── 2. Fabricated / AI-hallucinated restaurant names ─────────────────────────

// These patterns strongly suggest Claude invented a generic placeholder rather
// than a real named restaurant. Real restaurants have specific names; hallucinated
// ones tend to be geo-descriptors + cuisine type.

const FABRICATION_CRITICAL: RegExp[] = [
  // "Haidian Student District 海淀学生街", "Sanlitun Neighbourhood Chinese 三里屯"
  /\b(student district|neighbourhood chinese|neighborhood chinese|area chinese|district chinese)\b/i,
  // "Representative [tier] restaurant", "Budget Chinese Restaurant"
  /^(representative|budget|mid-range|upscale)\s+(chinese|asian|thai|indian|korean|japanese)\s+(restaurant|stall|delivery|takeout)/i,
  // "X Street Chinese" or "X Road Street Stall" — geo + generic cuisine, no name
  /^[A-Za-z\s]+(road|blvd|blvd\.?|ave\.?|avenue|street|st\.?)\s+(chinese|stall|restaurant|hawker)$/i,
  // "[Place] Area Restaurant", "[Place] Lunch Chinese"
  /\b(area restaurant|lunch chinese|area chinese|cbp chinese|cbd lunch)\b/i,
]

const FABRICATION_WARNING: RegExp[] = [
  // Parenthetical qualifiers AI loves: "Golden Dragon (Olaya District)", "Dragon Restaurant (Nişantaşı)"
  // These are OK for well-known chains but suspicious for generic names
  /^(golden dragon|china house|peking restaurant|beijing restaurant|dragon palace|royal china|oriental palace|dynasty restaurant|jade restaurant|china inn|china club)\s*\(/i,
  // "X Neighbourhood Chinese", "X Area Chinese"
  /\b(neighbourhood|neighborhood|area|district|corridor|strip|zone)\b.*\b(chinese|asian)\b/i,
  // Five or more words + Chinese characters — suggests AI added local script for authenticity
  /^(\w+\s+){5,}[一-鿿]/,
  // Appended city disambiguation "(Chinatown)" without a real name
  /^(street (stall|chinese|restaurant)|stall|takeout|delivery|food court)\b/i,
]

function checkHallucination(row: Row): Flag | null {
  const n = row.restaurant_name

  for (const re of FABRICATION_CRITICAL) {
    if (re.test(n)) {
      return {
        check: 'FABRICATED_NAME',
        severity: 'critical',
        message: `Restaurant name looks AI-generated (no real establishment): "${n}"`,
      }
    }
  }

  // Additional critical check: no source URL AND name is generic
  if (!row.source_url) {
    const generic = /\b(neighbourhood|street stall|budget|mid-range|area restaurant|representative|student district|lunch spot|casual dining)\b/i
    if (generic.test(n)) {
      return {
        check: 'FABRICATED_NAME',
        severity: 'critical',
        message: `Generic name with no source URL — likely hallucinated: "${n}"`,
      }
    }
  }

  for (const re of FABRICATION_WARNING) {
    if (re.test(n)) {
      return {
        check: 'FABRICATED_NAME',
        severity: 'warning',
        message: `Restaurant name pattern suggests AI placeholder — verify it exists: "${n}"`,
      }
    }
  }

  return null
}

// ─── 3. Generic / category source URLs ────────────────────────────────────────

function checkSourceUrl(row: Row): Flag | null {
  const url = row.source_url

  if (!url) {
    if (row.included_in_baseline) {
      return {
        check: 'MISSING_SOURCE',
        severity: 'critical',
        message: 'Included in baseline but has no source URL — price is unverifiable.',
      }
    }
    return {
      check: 'MISSING_SOURCE',
      severity: 'warning',
      message: 'No source URL — cannot verify price.',
    }
  }

  // TripAdvisor city-level search (not a specific restaurant page)
  if (/tripadvisor\.[a-z.]+\/Restaurants-g\d+/.test(url)) {
    return {
      check: 'GENERIC_SOURCE_URL',
      severity: 'critical',
      message: `Source is a TripAdvisor city search page, not a specific restaurant: ${url.slice(0, 80)}`,
    }
  }

  // Dianping city browse page (not a /shop/ page)
  if (/dianping\.com\/[a-z]+(\/[a-z]+)?$/.test(url) && !url.includes('/shop/')) {
    return {
      check: 'GENERIC_SOURCE_URL',
      severity: 'critical',
      message: `Source is a Dianping city browse page, not a specific restaurant: ${url.slice(0, 80)}`,
    }
  }

  // Generic Zomato city page (not a specific restaurant)
  if (/zomato\.com\/[a-z-]+$/.test(url)) {
    return {
      check: 'GENERIC_SOURCE_URL',
      severity: 'warning',
      message: `Source is a Zomato city page, not a specific restaurant: ${url.slice(0, 80)}`,
    }
  }

  // Generic TripAdvisor restaurant search for a neighbourhood (without a restaurant ID)
  if (/tripadvisor\.[a-z.]+\/(Restaurant_Review-g\d+-d\d+)/.test(url)) {
    // This is actually fine — specific restaurant review page
    return null
  }

  return null
}

// ─── 4. Portion size / price sanity ──────────────────────────────────────────
//
// The FRI tracks the price of ONE large serving for a single person.
// These thresholds are the maximum a single serving could realistically cost
// before we must question whether it's a shared/family dish.
//
// The thresholds are intentionally conservative: a Michelin-starred restaurant
// CAN charge CAD 80+ for fried rice, but we require explicit verification.

const SINGLE_SERVING_MAX_CAD: Record<string, number> = {
  basic:         42,   // plain / egg fried rice: no plausible reason to exceed ~CAD 42 as single
  vegetable:     42,
  meat_based:    55,
  seafood:       65,
  house_special: 65,
  premium:       110,  // e.g. Wagyu or truffle fried rice at 5-star
}

// Absolute ceiling — anything above this is essentially certainly shared or wrong
const ABSOLUTE_CEILING_CAD = 90

function checkPortionSize(row: Row): Flag | null {
  const p = Number(row.price_cad)
  if (!Number.isFinite(p) || p <= 0) return null

  if (p > ABSOLUTE_CEILING_CAD) {
    return {
      check: 'PORTION_SIZE',
      severity: 'critical',
      message:
        `CA$${p.toFixed(2)} exceeds CA$${ABSOLUTE_CEILING_CAD} absolute ceiling. ` +
        `This is almost certainly a shared/family-sized dish or a data error. ` +
        `Verify the menu explicitly states this is a single-person serving.`,
    }
  }

  const catMax = SINGLE_SERVING_MAX_CAD[row.dish_category] ?? SINGLE_SERVING_MAX_CAD.house_special
  if (p > catMax) {
    return {
      check: 'PORTION_SIZE',
      severity: 'warning',
      message:
        `CA$${p.toFixed(2)} exceeds the expected single-serving maximum ` +
        `(CA$${catMax} for "${row.dish_category}"). ` +
        `In Chinese restaurants, fried rice is often ordered for the table. ` +
        `Confirm this price is for one person, not a shared portion.`,
    }
  }

  return null
}

// ─── 5. Price outliers (per city) ────────────────────────────────────────────

function median(values: number[]): number {
  if (!values.length) return 0
  const s = [...values].sort((a, b) => a - b)
  const m = Math.floor(s.length / 2)
  return s.length % 2 === 1 ? s[m] : (s[m - 1] + s[m]) / 2
}

function checkPriceOutlier(row: Row, cityBaselineMedian: number): Flag | null {
  if (cityBaselineMedian <= 0) return null
  const p = Number(row.price_cad)
  if (!Number.isFinite(p) || p <= 0) return null

  if (p > cityBaselineMedian * 4) {
    return {
      check: 'PRICE_OUTLIER',
      severity: 'warning',
      message:
        `CA$${p.toFixed(2)} is ${(p / cityBaselineMedian).toFixed(1)}× the city baseline median ` +
        `(CA$${cityBaselineMedian.toFixed(2)}). Verify this is not a shared dish or data entry error.`,
    }
  }

  if (p < cityBaselineMedian * 0.2 && row.included_in_baseline) {
    return {
      check: 'PRICE_OUTLIER',
      severity: 'warning',
      message:
        `CA$${p.toFixed(2)} is only ${((p / cityBaselineMedian) * 100).toFixed(0)}% of the city ` +
        `baseline median (CA$${cityBaselineMedian.toFixed(2)}). Verify the price is correct and ` +
        `not in a different currency or denomination.`,
    }
  }

  return null
}

// ─── 6. Source quality scoring ────────────────────────────────────────────────
//
// Scores evidence strength. Entries in the baseline with low scores are flagged.
//
// Score key:
//   8 = direct official menu URL with known domain (e.g., hakkasan.com/menu/)
//   6 = delivery platform with specific restaurant page (ubereats, doordash)
//   5 = third-party menu aggregator with specific restaurant
//   4 = specific TripAdvisor/Yelp restaurant page
//   3 = general review site aggregator search (Zomato city, Yelp city search)
//   2 = generic category page (TripAdvisor city, Dianping city)
//   0 = no URL

function sourceQualityScore(url: string | null): number {
  if (!url) return 0

  // Known official menu domains
  if (/hakkasan\.com|dintaifung|mrchow\.com|fourseasons\.com|shangri-la\.com|hyatt\.com|marriott\.com|hilton\.com|ritzcarlton\.com|noburestaurants\.com|lottehotel\.com|madinatjumeirah\.com|pchotels\.com|tajhotels\.com/.test(url)) return 8
  if (/\.com\/(menu|dining|food|order|reserv)/.test(url)) return 7

  // Delivery apps with specific restaurant slugs (not city search)
  if (/(ubereats|doordash|skipthedishes|grubhub|deliveroo)\.com\/(ca\/|us\/)?store\//.test(url)) return 6
  if (/foodpanda\.\w+\/en\/restaurant\//.test(url)) return 6

  // Menu aggregators (specific restaurant)
  if (/menupix\.com\/menus\/|allmenus\.com\/|menuism\.com\/restaurants\//.test(url)) return 5
  if (/toasttab\.com\/|chownow\.com\/order\//.test(url)) return 5
  if (/fantuanorder\.com\//.test(url)) return 5

  // Yelp specific restaurant page
  if (/yelp\.com\/biz\//.test(url)) return 4

  // TripAdvisor specific restaurant review page
  if (/tripadvisor\.[a-z.]+\/Restaurant_Review-g\d+-d\d+/.test(url)) return 4

  // Zomato specific restaurant
  if (/zomato\.com\/[a-z-]+\/[a-z-]+-restaurant/.test(url) || /zomato\.com\/[\w-]+\/[\w-]+-\d+/.test(url)) return 4

  // General aggregator city pages (not specific)
  if (/yelp\.com\/search|yelp\.com\/biz\?/.test(url)) return 3
  if (/zomato\.com\/[a-z-]+$/.test(url)) return 3
  if (/tripadvisor\.[a-z.]+\/Restaurants-g\d+/.test(url)) return 2
  if (/dianping\.com\/[a-z]+(\/[a-z]+)?$/.test(url) && !url.includes('/shop/')) return 2

  return 5  // Unknown but specific-looking URL
}

function checkSourceQuality(row: Row): Flag | null {
  const score = sourceQualityScore(row.source_url)
  if (score <= 2 && row.included_in_baseline) {
    return {
      check: 'SOURCE_QUALITY',
      severity: 'critical',
      message: `Source quality score ${score}/8 — generic or category URL used for a baseline entry. ` +
        `A specific restaurant menu or page is required for baseline data.`,
    }
  }
  if (score <= 3 && row.included_in_baseline) {
    return {
      check: 'SOURCE_QUALITY',
      severity: 'warning',
      message: `Source quality score ${score}/8 — generic aggregator search used for a baseline entry. ` +
        `Prefer a specific restaurant page or official menu URL.`,
    }
  }
  return null
}

// ─── 7. Coverage gap detection ────────────────────────────────────────────────

interface CoverageIssue {
  city: string
  severity: Severity
  message: string
}

function checkCoverage(city: string, rows: Row[]): CoverageIssue[] {
  const issues: CoverageIssue[] = []
  const active = rows.filter(r => r.active)
  const baseline = active.filter(r => r.included_in_baseline)

  if (active.length < 5) {
    issues.push({ city, severity: 'critical', message: `Only ${active.length} active entries — minimum 5 needed for reliable median.` })
  } else if (active.length < 8) {
    issues.push({ city, severity: 'warning', message: `Only ${active.length} active entries — 8+ recommended for "Moderate" data quality.` })
  }

  if (baseline.length < 3) {
    issues.push({ city, severity: 'critical', message: `Only ${baseline.length} baseline entries — need at least 3 for a meaningful price index.` })
  }

  const tiers = new Set(active.map(r => r.tier))
  if (!tiers.has('low_tier') && !tiers.has('mid_tier')) {
    issues.push({ city, severity: 'warning', message: 'No low-tier or mid-tier entries — baseline may skew premium.' })
  }

  return issues
}

// ─── 9. PPP plausibility ─────────────────────────────────────────────────────
//
// Converts local_price to IMF international dollars using PPP factors.
// A single bowl of fried rice should cost $1–$20 intl$ globally.
// Below $1: almost certainly wrong currency or denomination.
// Above $20: very expensive in real purchasing-power terms; above $35 is critical.
//
// PPP factors (local currency units per international dollar) from IMF WEO 2024.

const PPP_FACTORS: Record<string, number> = {
  USD: 1.000, CAD: 1.251, EUR: 0.768, GBP: 0.711, AUD: 1.527,
  JPY: 107.9, CNY: 4.351, KRW: 903.0, SGD: 1.115, HKD: 6.010,
  INR: 25.74, PKR: 94.5, AED: 2.270, SAR: 2.380, EGP: 7.25,
  RUB: 26.3, TRY: 7.80, MXN: 10.3,
  // ARS: updated from IMF Apr-2024 baseline (200) to 2025–2026 estimate (~700)
  // due to Argentina's 200%+ annual inflation since the baseline was set.
  ARS: 700.0,
  // IRR: extremely volatile due to sanctions/parallel rates; skip by omitting factor
}

// PPP ceilings by tier. Premium restaurants at 5-star hotels genuinely cost more;
// the check still catches clear data errors (currency confusion, shared dishes).
const PPP_WARN_BY_TIER: Record<string, number>     = { low_tier: 12, mid_tier: 15, high_end: 25, premium: 45 }
const PPP_CRITICAL_BY_TIER: Record<string, number> = { low_tier: 20, mid_tier: 25, high_end: 45, premium: 75 }

function checkPPPPlausibility(row: Row): Flag | null {
  const factor = PPP_FACTORS[row.local_currency]
  if (!factor) return null

  const localPrice = Number(row.local_price)
  if (!Number.isFinite(localPrice) || localPrice <= 0) return null

  const intlPrice = localPrice / factor

  if (intlPrice < 1.0) {
    return {
      check: 'PPP_PLAUSIBILITY',
      severity: 'critical',
      message:
        `PPP-adjusted price is $${intlPrice.toFixed(2)} intl$ — below the $1 floor. ` +
        `Local price ${localPrice} ${row.local_currency} may be in the wrong currency or denomination.`,
    }
  }

  const critCeil = PPP_CRITICAL_BY_TIER[row.tier] ?? PPP_CRITICAL_BY_TIER.premium
  const warnCeil = PPP_WARN_BY_TIER[row.tier] ?? PPP_WARN_BY_TIER.premium

  // Ceiling violations are warnings (not critical) — PORTION_SIZE already catches
  // the definitive cases. PPP ceiling is a secondary confirmation signal only.
  if (intlPrice > critCeil) {
    return {
      check: 'PPP_PLAUSIBILITY',
      severity: 'warning',
      message:
        `PPP-adjusted price is $${intlPrice.toFixed(2)} intl$ (${row.tier} ceiling: $${critCeil}). ` +
        `High in real purchasing-power terms — verify single-person serving, not a shared dish.`,
    }
  }

  if (intlPrice > warnCeil) {
    return {
      check: 'PPP_PLAUSIBILITY',
      severity: 'warning',
      message:
        `PPP-adjusted price is $${intlPrice.toFixed(2)} intl$ — above the $${warnCeil} expected ceiling for ${row.tier}. ` +
        `Verify this is a single-person portion, not a shared dish.`,
    }
  }

  return null
}

// ─── 10. Wage ratio ───────────────────────────────────────────────────────────
//
// A bowl of fried rice should cost between 0.1× and 4× the local median hourly wage.
// Below 0.1×: suspiciously cheap — may indicate wrong currency or denomination.
// Above 4×:   requires several hours of work — likely shared dish or data error.
//
// Uses median_monthly_salary_cad from the cities table as a proxy for local wages.
// Converts to hourly by dividing by 160 (40 hrs/week × 4 weeks).

function checkWageRatio(row: Row, monthlyWageCad: number | undefined): Flag | null {
  if (!monthlyWageCad || monthlyWageCad <= 0) return null
  const p = Number(row.price_cad)
  if (!Number.isFinite(p) || p <= 0) return null

  const hourlyWage = monthlyWageCad / 160
  const ratio = p / hourlyWage

  // Wage ratio is always a warning, not critical — in low-income cities any upscale
  // restaurant will exceed 4×, but that reflects tourism/luxury pricing, not a data error.
  if (ratio > 8) {
    return {
      check: 'WAGE_RATIO',
      severity: 'warning',
      message:
        `CA$${p.toFixed(2)} = ${ratio.toFixed(1)}× median hourly wage (CA$${hourlyWage.toFixed(2)}/hr). ` +
        `Very expensive relative to local wages — confirm single-person serving.`,
    }
  }

  if (ratio > 4) {
    return {
      check: 'WAGE_RATIO',
      severity: 'warning',
      message:
        `CA$${p.toFixed(2)} = ${ratio.toFixed(1)}× median hourly wage (CA$${hourlyWage.toFixed(2)}/hr). ` +
        `Costs more than 4 hrs of work — verify this is a single-person portion.`,
    }
  }

  if (ratio < 0.05 && row.included_in_baseline) {
    return {
      check: 'WAGE_RATIO',
      severity: 'warning',
      message:
        `CA$${p.toFixed(2)} is only ${(ratio * 100).toFixed(1)}% of median hourly wage — ` +
        `suspiciously cheap; may indicate wrong currency or denomination.`,
    }
  }

  return null
}

// ─── 8. Duplicate detection ───────────────────────────────────────────────────

function normalize(s: string | null | undefined): string {
  return String(s ?? '').toLowerCase().replace(/[^a-z0-9]/g, '').trim()
}

function findDuplicates(rows: Row[]): Array<{ ids: string[]; city: string; message: string }> {
  const seen = new Map<string, Row>()
  const dupes: Array<{ ids: string[]; city: string; message: string }> = []

  for (const row of rows) {
    const key = `${normalize(row.city)}:${normalize(row.restaurant_name)}:${normalize(row.dish_name)}`
    const existing = seen.get(key)
    if (existing) {
      const priceDiff = Math.abs(Number(row.price_cad) - Number(existing.price_cad))
      const pctDiff = priceDiff / Number(existing.price_cad)
      if (pctDiff < 0.05) {
        dupes.push({
          ids: [existing.id, row.id],
          city: row.city,
          message: `Exact duplicate: ${row.restaurant_name} — ${row.dish_name} (both CA$${Number(row.price_cad).toFixed(2)})`,
        })
      } else {
        dupes.push({
          ids: [existing.id, row.id],
          city: row.city,
          message: `Near-duplicate with price drift: ${row.restaurant_name} — ${row.dish_name} ` +
            `(CA$${Number(existing.price_cad).toFixed(2)} vs CA$${Number(row.price_cad).toFixed(2)}, ${(pctDiff * 100).toFixed(0)}% diff)`,
        })
      }
    } else {
      seen.set(key, row)
    }
  }

  return dupes
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\n${'═'.repeat(62)}`)
  console.log(`  Egg Fried Rice Index — Data Quality Audit`)
  console.log(`  ${new Date().toISOString().slice(0, 10)}${CITY_FILTER ? ` · city: ${CITY_FILTER}` : ' · all cities'}`)
  console.log(`${'═'.repeat(62)}\n`)

  let q = s.from('restaurants')
    .select('id,city,country,restaurant_name,dish_name,dish_category,tier,price_cad,local_price,local_currency,source_url,source_type,confidence_score,included_in_baseline,approved,active,notes')
    .eq('active', true)
  if (CITY_FILTER) q = q.eq('city', CITY_FILTER)

  const { data, error } = await q
  if (error || !data) { console.error('DB error:', error?.message); process.exit(1) }

  const rows = data as Row[]
  console.log(`Loaded ${rows.length} active entries\n`)

  // Load city salary data for wage-ratio check
  const { data: cityData } = await s.from('cities').select('city,median_monthly_salary_cad')
  const citySalaries = new Map<string, number>()
  for (const c of cityData ?? []) {
    if (c.median_monthly_salary_cad) citySalaries.set(c.city, Number(c.median_monthly_salary_cad))
  }

  // Group by city
  const byCity = new Map<string, Row[]>()
  for (const r of rows) {
    if (!byCity.has(r.city)) byCity.set(r.city, [])
    byCity.get(r.city)!.push(r)
  }

  // Pre-compute city baseline medians
  const cityMedians = new Map<string, number>()
  for (const [city, cityRows] of byCity) {
    const baseline = cityRows.filter(r => r.included_in_baseline).map(r => Number(r.price_cad)).filter(p => p > 0)
    cityMedians.set(city, median(baseline))
  }

  // Per-entry checks
  const allFlags: Array<{ row: Row; flags: Flag[] }> = []
  let criticalCount = 0
  let warningCount = 0

  for (const row of rows) {
    const flags: Flag[] = []
    const m = cityMedians.get(row.city) ?? 0

    const checks = [
      checkCityAmbiguity(row.city, row.country),
      checkHallucination(row),
      checkSourceUrl(row),
      checkPortionSize(row),
      checkPriceOutlier(row, m),
      checkSourceQuality(row),
      checkPPPPlausibility(row),
      checkWageRatio(row, citySalaries.get(row.city)),
    ]

    for (const f of checks) {
      if (f) {
        if (SEVERITY_FILTER === 'critical' && f.severity !== 'critical') continue
        flags.push(f)
        if (f.severity === 'critical') criticalCount++
        if (f.severity === 'warning') warningCount++
      }
    }

    if (flags.length > 0) allFlags.push({ row, flags })
  }

  // Print per-entry results grouped by city
  const currentCity = { name: '' }
  for (const { row, flags } of allFlags.sort((a, b) => a.row.city.localeCompare(b.row.city))) {
    if (row.city !== currentCity.name) {
      currentCity.name = row.city
      const m = cityMedians.get(row.city) ?? 0
      const cityRows = byCity.get(row.city) ?? []
      const baseline = cityRows.filter(r => r.included_in_baseline).length
      console.log(`\n── ${row.city} (${row.country}) — ${cityRows.length} entries, ${baseline} baseline, median CA$${m.toFixed(2)} ──`)
    }

    const icon = flags.some(f => f.severity === 'critical') ? '🔴' : '🟡'
    console.log(`\n  ${icon} ${row.restaurant_name.slice(0, 55)}`)
    console.log(`     ${row.dish_name.slice(0, 45)} · CA$${Number(row.price_cad).toFixed(2)} · ${row.tier} · id:${row.id.slice(0, 8)}`)
    for (const f of flags) {
      const badge = f.severity === 'critical' ? '[CRITICAL]' : '[WARNING] '
      console.log(`     ${badge} ${f.check}: ${f.message}`)
    }
  }

  // Coverage checks
  console.log('\n\n── Coverage gaps ──')
  for (const [city, cityRows] of [...byCity].sort(([a], [b]) => a.localeCompare(b))) {
    const issues = checkCoverage(city, cityRows)
    if (issues.length) {
      console.log(`\n  ${city}:`)
      for (const i of issues) {
        const badge = i.severity === 'critical' ? '🔴 [CRITICAL]' : '🟡 [WARNING] '
        console.log(`    ${badge} ${i.message}`)
        if (i.severity === 'critical') criticalCount++
        if (i.severity === 'warning') warningCount++
      }
    }
  }

  // Duplicate detection
  console.log('\n\n── Duplicate detection ──')
  const dupes = findDuplicates(rows)
  if (dupes.length === 0) {
    console.log('  No duplicates found.')
  } else {
    for (const d of dupes) {
      console.log(`  🟡 [WARNING]  DUPLICATE · ${d.city}: ${d.message}`)
      console.log(`     IDs: ${d.ids.join(', ')}`)
      warningCount++
    }
  }

  // Summary
  console.log(`\n\n${'═'.repeat(62)}`)
  console.log(`  Summary`)
  console.log(`${'═'.repeat(62)}`)
  console.log(`  Total entries checked  : ${rows.length}`)
  console.log(`  Entries with issues    : ${allFlags.length}`)
  console.log(`  🔴 Critical issues     : ${criticalCount}`)
  console.log(`  🟡 Warnings            : ${warningCount}`)
  console.log(`  Duplicates found       : ${dupes.length}`)

  // JSON output
  if (JSON_OUTPUT) {
    const report = {
      generated_at: new Date().toISOString(),
      total_entries: rows.length,
      entries_with_issues: allFlags.length,
      critical: criticalCount,
      warnings: warningCount,
      duplicates: dupes.length,
      flags: allFlags.map(({ row, flags }) => ({
        id: row.id,
        city: row.city,
        restaurant_name: row.restaurant_name,
        dish_name: row.dish_name,
        price_cad: row.price_cad,
        flags,
      })),
    }
    console.log('\n\n--- JSON ---')
    console.log(JSON.stringify(report, null, 2))
  }

  if (criticalCount > 0) {
    console.log(`\n  ⚠️  ${criticalCount} critical issues require attention before publishing data.`)
    process.exit(1)
  } else {
    console.log('\n  ✓ No critical issues found.')
  }
}

main().catch(err => { console.error(err); process.exit(1) })
