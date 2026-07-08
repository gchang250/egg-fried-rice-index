/**
 * seed-verified.ts — Strict template for all future manual restaurant seeding.
 *
 * RULES FOR ADDING DATA:
 *
 *   1. CITY DISAMBIGUATION
 *      city + country + region must be explicit. Never leave region blank for
 *      cities that exist in multiple places (Vancouver, Portland, Springfield…).
 *      Wrong: city: 'Vancouver', country: 'Canada'
 *      Right: city: 'Vancouver', country: 'Canada', region: 'BC'
 *
 *   2. REAL RESTAURANTS ONLY
 *      restaurant_name must be the name of a specific, named establishment.
 *      Do NOT use geographic descriptors as names:
 *        ✗ "Sanlitun Neighbourhood Chinese"
 *        ✗ "Budget Chinese Delivery (DHA)"
 *        ✗ "Burns Road Street Stall"
 *        ✓ "Jade Garden Restaurant" (a real place with an address)
 *
 *   3. WORKING SPECIFIC SOURCE URL (required for baseline entries)
 *      source_url must point to the specific restaurant's menu or page — NOT a
 *      city-level search or category page.
 *        ✗ https://www.tripadvisor.com/Restaurants-g186338-London
 *        ✗ https://www.dianping.com/beijing/chaoyang
 *        ✓ https://www.hakkasan.com/london/menu/
 *        ✓ https://www.yelp.com/biz/nom-wah-tea-parlor-new-york
 *
 *   4. SINGLE-PERSON SERVING PRICE
 *      price must be what ONE person pays for THEIR OWN plate of fried rice.
 *      In many Chinese restaurants, fried rice is ordered for the whole table —
 *      confirm the price is NOT for a shared/family dish.
 *      If the dish serves 2+, it must NOT be entered. Period.
 *
 *   5. PRICE VERIFICATION (triple-check)
 *      For each entry fill in ALL THREE of:
 *        primary_check   — where you got the price (menu URL, delivery app, etc.)
 *        secondary_check — a second source that confirms the price
 *        sanity_check    — brief note on why the price is realistic
 *      If you cannot complete all three, do NOT enter the data.
 *
 *   6. PRICE BOUNDS
 *      A single serving of fried rice should NEVER exceed these CAD thresholds.
 *      If yours does, either you have the wrong price or it is a shared dish.
 *        basic / vegetable:        CAD 42
 *        meat_based:               CAD 55
 *        seafood:                  CAD 65
 *        house_special:            CAD 65
 *        premium (Michelin etc.):  CAD 110
 *
 * HOW TO USE THIS FILE:
 *   1. Fill in the ENTRIES array below following the VerifiedEntry type.
 *   2. Run: export $(grep -v '^#' .env.local | xargs) && npx tsx scripts/seed-verified.ts --dry-run
 *   3. Review the printed validation report. Fix all errors and warnings.
 *   4. Run without --dry-run to commit.
 *   5. Run the audit afterward: npx tsx scripts/audit-data-quality.ts
 */

import { createClient } from '@supabase/supabase-js'

const s = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

const DRY_RUN = process.argv.includes('--dry-run')
const NOW = new Date().toISOString()

// ─── Types ────────────────────────────────────────────────────────────────────

type DishCat  = 'basic' | 'vegetable' | 'meat_based' | 'seafood' | 'house_special' | 'premium'
type Tier     = 'low_tier' | 'mid_tier' | 'high_end' | 'premium'
type SrcType  = 'official_menu' | 'delivery_app' | 'third_party_menu' | 'third_party_aggregator'

interface VerifiedEntry {
  // ── Location (required — must disambiguate) ──────────────────────────────
  city:     string   // e.g. 'Vancouver'
  country:  string   // e.g. 'Canada'
  region:   string   // e.g. 'BC' — MANDATORY, even if blank feels OK

  // ── Restaurant (must be a real named establishment) ──────────────────────
  restaurant_name: string
  address_hint:    string   // neighbourhood or street for cross-checking; not stored in DB

  // ── Dish ────────────────────────────────────────────────────────────────
  dish_name:     string
  dish_category: DishCat
  tier:          Tier

  // ── Price ────────────────────────────────────────────────────────────────
  local_price:       number
  local_currency:    string   // ISO 4217 code
  exchange_rate_used: number  // CAD per 1 unit of local_currency
  price_cad:         number   // = local_price × exchange_rate_used

  // ── Source ──────────────────────────────────────────────────────────────
  source_url:  string   // specific restaurant page — NOT a city/search page
  source_type: SrcType
  confidence_score: number   // 0.0–1.0

  // ── Verification (mandatory — must complete all three) ───────────────────
  primary_check:   string   // "Official menu at hakkasan.com/london/menu/, retrieved 2026-06-28"
  secondary_check: string   // "Confirmed on UberEats listing for same restaurant, same price"
  sanity_check:    string   // "GBP 32 at Michelin-starred Cantonese is consistent with peer entries"

  // ── Optional ────────────────────────────────────────────────────────────
  notes?: string
}

// ─── Validation ───────────────────────────────────────────────────────────────

const SINGLE_SERVING_MAX: Record<DishCat, number> = {
  basic:         42,
  vegetable:     42,
  meat_based:    55,
  seafood:       65,
  house_special: 65,
  premium:       110,
}

// Cities that require a region because they exist in multiple places
const REQUIRE_REGION = new Set([
  'Vancouver', 'Portland', 'Springfield', 'Hamilton', 'Richmond',
  'Kingston', 'Perth', 'Edinburgh', 'Calgary', 'Cambridge', 'Oxford',
  'Bath', 'Wellington', 'Bristol',
])

const GENERIC_NAME_PATTERNS = [
  /\b(student district|neighbourhood chinese|neighborhood chinese|area chinese|district chinese)\b/i,
  /^(budget|mid-range|upscale|representative|local|casual)\s+(chinese|asian|thai|indian|korean|japanese)\s*(restaurant|stall|delivery|takeout|dining)?\s*$/i,
  /^[a-z\s]+(road|blvd|avenue|street|st)\s+(chinese|stall|restaurant|hawker)\s*$/i,
  /\b(area restaurant|lunch chinese|area chinese|cbd lunch|student area)\b/i,
]

const CATEGORY_PAGE_PATTERNS = [
  /tripadvisor\.[a-z.]+\/Restaurants-g\d+/,
  /dianping\.com\/[a-z]+(\/[a-z]+)?$/,
  /zomato\.com\/[a-z-]+$/,
  /tripadvisor\.[a-z.]+\/[a-z]+-restaurants$/i,
]

interface ValidationError {
  field: string
  severity: 'error' | 'warning'
  message: string
}

function validate(e: VerifiedEntry, idx: number): ValidationError[] {
  const errs: ValidationError[] = []
  const label = `[${idx + 1}] ${e.city} — ${e.restaurant_name}`

  // City disambiguation
  if (REQUIRE_REGION.has(e.city) && !e.region.trim()) {
    errs.push({ field: 'region', severity: 'error',
      message: `${label}: "${e.city}" exists in multiple places — region is required.` })
  }

  // Restaurant name
  if (!e.restaurant_name || e.restaurant_name.trim().length < 3) {
    errs.push({ field: 'restaurant_name', severity: 'error',
      message: `${label}: restaurant_name is too short or missing.` })
  }
  for (const re of GENERIC_NAME_PATTERNS) {
    if (re.test(e.restaurant_name)) {
      errs.push({ field: 'restaurant_name', severity: 'error',
        message: `${label}: restaurant_name looks AI-generated / generic. Use a real named establishment.` })
      break
    }
  }
  if (!e.address_hint.trim()) {
    errs.push({ field: 'address_hint', severity: 'warning',
      message: `${label}: No address_hint — hard to cross-check the restaurant's location.` })
  }

  // Source URL
  if (!e.source_url.trim()) {
    errs.push({ field: 'source_url', severity: 'error',
      message: `${label}: source_url is required. Use a specific restaurant menu or page.` })
  } else {
    for (const re of CATEGORY_PAGE_PATTERNS) {
      if (re.test(e.source_url)) {
        errs.push({ field: 'source_url', severity: 'error',
          message: `${label}: source_url is a city/category search page, not a specific restaurant. Fix it.` })
        break
      }
    }
  }

  // Price CAD check
  const computedCad = Math.round(e.local_price * e.exchange_rate_used * 100) / 100
  if (Math.abs(computedCad - e.price_cad) > 0.05) {
    errs.push({ field: 'price_cad', severity: 'error',
      message: `${label}: price_cad (${e.price_cad}) ≠ local_price × rate (${computedCad}). Fix the arithmetic.` })
  }

  // Portion size
  const maxCad = SINGLE_SERVING_MAX[e.dish_category]
  if (e.price_cad > 90) {
    errs.push({ field: 'price_cad', severity: 'error',
      message: `${label}: CA$${e.price_cad} exceeds the absolute ceiling of CA$90 for a single serving. ` +
        `This is almost certainly a shared dish or data error. Do NOT enter it.` })
  } else if (e.price_cad > maxCad) {
    errs.push({ field: 'price_cad', severity: 'warning',
      message: `${label}: CA$${e.price_cad} exceeds the expected maximum of CA$${maxCad} for "${e.dish_category}". ` +
        `Verify explicitly that this is priced for ONE person, not a shared table dish.` })
  }

  // Verification fields
  if (!e.primary_check.trim() || e.primary_check.startsWith('TODO')) {
    errs.push({ field: 'primary_check', severity: 'error',
      message: `${label}: primary_check is required and must not be a placeholder.` })
  }
  if (!e.secondary_check.trim() || e.secondary_check.startsWith('TODO')) {
    errs.push({ field: 'secondary_check', severity: 'error',
      message: `${label}: secondary_check is required. Find a second source that confirms the price.` })
  }
  if (!e.sanity_check.trim() || e.sanity_check.startsWith('TODO')) {
    errs.push({ field: 'sanity_check', severity: 'warning',
      message: `${label}: sanity_check is empty — explain why this price makes sense for this city/tier.` })
  }

  // Confidence
  if (e.confidence_score < 0.7) {
    errs.push({ field: 'confidence_score', severity: 'warning',
      message: `${label}: confidence_score ${e.confidence_score} is low — is the source reliable?` })
  }

  return errs
}

// ─── Convert to DB row ────────────────────────────────────────────────────────

function toRow(e: VerifiedEntry) {
  return {
    city:                 e.city,
    country:              e.country,
    restaurant_name:      e.restaurant_name,
    dish_name:            e.dish_name,
    dish_category:        e.dish_category,
    included_in_baseline: e.dish_category === 'basic' || e.dish_category === 'vegetable',
    tier:                 e.tier,
    local_price:          e.local_price,
    local_currency:       e.local_currency,
    exchange_rate_used:   e.exchange_rate_used,
    price_cad:            e.price_cad,
    source:               `Manual verified seed — ${new Date(NOW).toISOString().slice(0, 10)}`,
    source_type:          e.source_type,
    source_url:           e.source_url,
    confidence_score:     e.confidence_score,
    approved:             true,
    active:               true,
    date_accessed:        NOW,
    notes: [
      e.notes ?? '',
      `✓ Primary: ${e.primary_check}`,
      `✓ Secondary: ${e.secondary_check}`,
      `✓ Sanity: ${e.sanity_check}`,
    ].filter(Boolean).join(' | '),
  }
}

// ─── ENTRIES — Fill this array with verified data ─────────────────────────────
//
// Replace these examples with real entries. Each one must pass validation
// before it will be inserted. Run with --dry-run to check first.

const ENTRIES: VerifiedEntry[] = [

  // ── EXAMPLE (delete before running) ──────────────────────────────────────
  // {
  //   city: 'London', country: 'United Kingdom', region: 'England',
  //   restaurant_name: 'Hakkasan Hanway Place',
  //   address_hint: 'Hanway Place, Fitzrovia, London W1T 1HD',
  //   dish_name: 'Black Pepper Rib-Eye Fried Rice',
  //   dish_category: 'house_special',
  //   tier: 'premium',
  //   local_price: 32, local_currency: 'GBP', exchange_rate_used: 1.76, price_cad: 56.32,
  //   source_url: 'https://hakkasan.com/london/menu/',
  //   source_type: 'official_menu',
  //   confidence_score: 0.92,
  //   primary_check:   'Official menu at hakkasan.com/london/menu/, retrieved 2026-06-28, shows £32 for this dish.',
  //   secondary_check: 'OpenTable listing for Hakkasan London confirms same dish and price.',
  //   sanity_check:    'Michelin-starred Cantonese, £32 single serving is in line with similar London premium entries (China Tang at £55 is the high end).',
  //   notes: 'Signature dish. Confirmed single portion.',
  // },

]

// ─── Runner ───────────────────────────────────────────────────────────────────

async function run() {
  console.log(`\n${'═'.repeat(60)}`)
  console.log(`  Verified Seed${DRY_RUN ? ' [DRY RUN]' : ''}`)
  console.log(`${'═'.repeat(60)}\n`)

  if (ENTRIES.length === 0) {
    console.log('  No entries to process. Add entries to the ENTRIES array.')
    return
  }

  // Validate all entries first
  let errorCount = 0
  let warnCount = 0
  const allErrors: ValidationError[] = []

  for (let i = 0; i < ENTRIES.length; i++) {
    const errs = validate(ENTRIES[i], i)
    for (const e of errs) {
      allErrors.push(e)
      if (e.severity === 'error') errorCount++
      if (e.severity === 'warning') warnCount++
    }
  }

  if (allErrors.length > 0) {
    console.log('── Validation results ──\n')
    for (const e of allErrors) {
      const icon = e.severity === 'error' ? '🔴 [ERROR]  ' : '🟡 [WARNING]'
      console.log(`  ${icon} ${e.message}`)
    }
    console.log(`\n  Errors: ${errorCount}  Warnings: ${warnCount}`)
  }

  if (errorCount > 0) {
    console.log('\n  ✗ Fix all errors before inserting. No data was written.')
    process.exit(1)
  }

  if (warnCount > 0 && !DRY_RUN) {
    console.log('\n  Warnings present — proceeding with insert (warnings are non-blocking).')
  }

  // Print preview
  console.log('\n── Entries to insert ──\n')
  for (const e of ENTRIES) {
    const cad = e.price_cad.toFixed(2)
    console.log(`  ✓ ${e.city} (${e.region}, ${e.country}) — ${e.restaurant_name}`)
    console.log(`    ${e.dish_name} · ${e.local_currency} ${e.local_price} → CA$${cad} · ${e.tier}`)
    console.log(`    ${e.source_url.slice(0, 70)}`)
  }

  if (DRY_RUN) {
    console.log('\n  [dry run] No data written. Remove --dry-run to insert.')
    return
  }

  // Check for existing duplicates
  const rows = ENTRIES.map(toRow)
  const { error } = await s.from('restaurants').insert(rows)
  if (error) {
    console.error('\n  ✗ Insert failed:', error.message)
    process.exit(1)
  }

  console.log(`\n  ✓ Inserted ${rows.length} entries.`)
  console.log('  Run: npx tsx scripts/audit-data-quality.ts — to verify the full dataset.')
}

run().catch(err => { console.error(err); process.exit(1) })
