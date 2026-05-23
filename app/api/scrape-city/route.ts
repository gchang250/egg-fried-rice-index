import { GoogleGenerativeAI } from '@google/generative-ai'
import * as cheerio from 'cheerio'
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Currency = { code: string; symbol: string }

type SearchResult = { title: string; url: string; snippet: string }

type ExtractedDish = {
  dish_name: string
  local_price: number
  dish_category: 'basic' | 'vegetable' | 'meat_based' | 'seafood' | 'house_special' | 'premium'
}

type Candidate = {
  city: string
  country: string
  restaurant_name: string
  dish_name: string
  dish_category: string
  included_in_baseline: boolean
  tier: string
  local_price: number
  local_currency: string
  exchange_rate_used: number
  price_cad: number
  source: string
  source_type: string
  source_url: string
  confidence_score: number
  notes: string
}

// ---------------------------------------------------------------------------
// Currency data
// ---------------------------------------------------------------------------

const CURRENCY_BY_COUNTRY: Record<string, Currency> = {
  'canada':            { code: 'CAD', symbol: 'CA$' },
  'united states':     { code: 'USD', symbol: '$' },
  'usa':               { code: 'USD', symbol: '$' },
  'us':                { code: 'USD', symbol: '$' },
  'united kingdom':    { code: 'GBP', symbol: '£' },
  'uk':                { code: 'GBP', symbol: '£' },
  'england':           { code: 'GBP', symbol: '£' },
  'scotland':          { code: 'GBP', symbol: '£' },
  'wales':             { code: 'GBP', symbol: '£' },
  'australia':         { code: 'AUD', symbol: 'AU$' },
  'singapore':         { code: 'SGD', symbol: 'S$' },
  'hong kong':         { code: 'HKD', symbol: 'HK$' },
  'japan':             { code: 'JPY', symbol: '¥' },
  'china':             { code: 'CNY', symbol: '¥' },
  'taiwan':            { code: 'TWD', symbol: 'NT$' },
  'south korea':       { code: 'KRW', symbol: '₩' },
  'korea':             { code: 'KRW', symbol: '₩' },
  'india':             { code: 'INR', symbol: '₹' },
  'malaysia':          { code: 'MYR', symbol: 'RM' },
  'philippines':       { code: 'PHP', symbol: '₱' },
  'indonesia':         { code: 'IDR', symbol: 'Rp' },
  'thailand':          { code: 'THB', symbol: '฿' },
  'vietnam':           { code: 'VND', symbol: '₫' },
  'mexico':            { code: 'MXN', symbol: 'MX$' },
  'brazil':            { code: 'BRL', symbol: 'R$' },
  'argentina':         { code: 'ARS', symbol: 'AR$' },
  'uae':               { code: 'AED', symbol: 'د.إ' },
  'united arab emirates': { code: 'AED', symbol: 'د.إ' },
  'saudi arabia':      { code: 'SAR', symbol: '﷼' },
  'france':            { code: 'EUR', symbol: '€' },
  'germany':           { code: 'EUR', symbol: '€' },
  'italy':             { code: 'EUR', symbol: '€' },
  'spain':             { code: 'EUR', symbol: '€' },
  'netherlands':       { code: 'EUR', symbol: '€' },
  'belgium':           { code: 'EUR', symbol: '€' },
  'switzerland':       { code: 'CHF', symbol: 'Fr' },
  'new zealand':       { code: 'NZD', symbol: 'NZ$' },
}

const TO_CAD: Record<string, number> = {
  CAD: 1,
  USD: 1.37,
  GBP: 1.73,
  EUR: 1.48,
  CHF: 1.52,
  AUD: 0.91,
  NZD: 0.83,
  SGD: 1.01,
  HKD: 0.18,
  JPY: 0.0093,
  CNY: 0.19,
  TWD: 0.042,
  KRW: 0.001,
  INR: 0.016,
  MYR: 0.31,
  PHP: 0.024,
  IDR: 0.000087,
  THB: 0.040,
  VND: 0.000054,
  MXN: 0.071,
  BRL: 0.27,
  ARS: 0.0014,
  AED: 0.37,
  SAR: 0.37,
}

// Price sanity bounds per currency (to filter obvious non-price numbers)
const PRICE_FLOOR_LOCAL: Record<string, number> = {
  CAD: 3, USD: 3, GBP: 2, EUR: 2, CHF: 3, AUD: 3, NZD: 3,
  SGD: 3, HKD: 20, JPY: 300, CNY: 10, TWD: 60, KRW: 3000,
  INR: 80, MYR: 5, PHP: 80, IDR: 15000, THB: 60, VND: 30000,
  MXN: 30, BRL: 8, ARS: 500, AED: 8, SAR: 8,
}
const PRICE_CEIL_LOCAL: Record<string, number> = {
  CAD: 90, USD: 70, GBP: 50, EUR: 55, CHF: 60, AUD: 90, NZD: 90,
  SGD: 60, HKD: 300, JPY: 5000, CNY: 200, TWD: 800, KRW: 50000,
  INR: 1500, MYR: 80, PHP: 1000, IDR: 200000, THB: 800, VND: 400000,
  MXN: 400, BRL: 80, ARS: 8000, AED: 80, SAR: 80,
}

// Domains to skip
const BLOCKED_DOMAINS = [
  'facebook.com', 'instagram.com', 'tiktok.com', 'youtube.com',
  'reddit.com', 'twitter.com', 'x.com', 'pinterest.com',
]

// Domains that reliably carry menu prices
const HIGH_VALUE_DOMAINS = [
  'ubereats.com', 'doordash.com', 'skipthedishes.com',
  'grubhub.com', 'seamless.com', 'deliveroo.com', 'foodpanda.com',
  'menupix.com', 'allmenus.com', 'menuism.com',
  'toasttab.com', 'chownow.com', 'olo.com',
  'opentable.com',
]

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function currencyForCountry(country: string): Currency {
  const key = country.toLowerCase().trim()
  const direct = CURRENCY_BY_COUNTRY[key]
  if (direct) return direct

  for (const [k, v] of Object.entries(CURRENCY_BY_COUNTRY)) {
    if (key.includes(k) || k.includes(key)) return v
  }

  return { code: 'USD', symbol: '$' }
}

function toCad(localPrice: number, currencyCode: string): number {
  const rate = TO_CAD[currencyCode] ?? 1
  return Number((localPrice * rate).toFixed(2))
}

function guessTier(priceCad: number): string {
  if (priceCad <= 12) return 'low_tier'
  if (priceCad <= 17) return 'mid_tier'
  if (priceCad <= 24) return 'high_end'
  return 'premium'
}

function sourceTypeFromUrl(url: string): string {
  const lower = url.toLowerCase()
  if (/ubereats|doordash|skipthedishes|grubhub|seamless|deliveroo|foodpanda/.test(lower)) return 'delivery_app'
  if (/menupix|allmenus|menuism/.test(lower)) return 'third_party_menu'
  if (/toasttab|chownow|olo\.com/.test(lower)) return 'official_ordering_page'
  return 'official_menu'
}

function confidenceFromSource(url: string): number {
  const lower = url.toLowerCase()
  if (/toasttab|chownow|olo\.com/.test(lower)) return 0.82
  if (/ubereats|doordash|skipthedishes|grubhub/.test(lower)) return 0.72
  if (/menupix|allmenus/.test(lower)) return 0.68
  if (/deliveroo|foodpanda/.test(lower)) return 0.72
  return 0.65
}

function isBlockedUrl(url: string): boolean {
  return BLOCKED_DOMAINS.some((d) => url.toLowerCase().includes(d))
}

function restaurantNameFromTitle(title: string, url: string): string {
  if (title) {
    // "Menu of Foo Restaurant in City" → "Foo Restaurant"
    const m1 = title.match(/Menu of (.*?) in /i)
    if (m1?.[1]) return m1[1].trim().slice(0, 90)

    // "Order Foo Restaurant Menu" → "Foo Restaurant"
    const m2 = title.match(/^Order\s+(.*?)\s+(?:Menu|Online|Delivery)/i)
    if (m2?.[1]) return m2[1].trim().slice(0, 90)

    // "Foo Restaurant | Uber Eats" → "Foo Restaurant"
    const m3 = title.split(/\s*[\|–-]\s*/)[0].trim()
    if (m3 && m3.length < 80) return m3
  }

  try {
    const host = new URL(url).hostname.replace(/^www\./, '')
    return host.split('.')[0] || 'Unknown restaurant'
  } catch {
    return 'Unknown restaurant'
  }
}

function normalizeForDupe(value: string | null | undefined): string {
  return String(value ?? '').toLowerCase().replace(/[^a-z0-9]/g, '').trim()
}

function isDuplicate(
  candidate: { city: string; restaurant_name: string; dish_name: string; source_url: string },
  existing: Array<{ city?: string | null; restaurant_name?: string | null; dish_name?: string | null; source_url?: string | null }>
): boolean {
  return existing.some((row) => {
    const sameCity = normalizeForDupe(row.city) === normalizeForDupe(candidate.city)
    if (!sameCity) return false

    const sameUrl =
      normalizeForDupe(candidate.source_url) !== '' &&
      normalizeForDupe(row.source_url) === normalizeForDupe(candidate.source_url)

    const samePair =
      normalizeForDupe(row.restaurant_name) === normalizeForDupe(candidate.restaurant_name) &&
      normalizeForDupe(row.dish_name) === normalizeForDupe(candidate.dish_name)

    return sameUrl || samePair
  })
}

// ---------------------------------------------------------------------------
// Search
// ---------------------------------------------------------------------------

async function searchMenuUrls(city: string, country: string): Promise<SearchResult[]> {
  const apiKey = process.env.SERPAPI_API_KEY
  if (!apiKey) throw new Error('Missing SERPAPI_API_KEY')

  const location = `${city}, ${country}`

  const queries = [
    `"fried rice" restaurant menu price ${city}`,
    `egg fried rice vegetable fried rice menu ${city}`,
    `site:ubereats.com fried rice ${city}`,
    `site:doordash.com fried rice ${city}`,
    `site:menupix.com fried rice ${city}`,
  ]

  const seen = new Set<string>()
  const results: SearchResult[] = []

  for (const q of queries) {
    try {
      const params = new URLSearchParams({
        engine: 'google',
        q,
        api_key: apiKey,
        num: '8',
        hl: 'en',
        gl: 'ca',
        location,
      })

      const res = await fetch(`https://serpapi.com/search.json?${params}`, { cache: 'no-store' })
      if (!res.ok) continue

      const json = await res.json()
      const organic: Array<{ title?: string; link?: string; snippet?: string }> = json.organic_results ?? []

      for (const item of organic) {
        const url = item.link
        if (!url || seen.has(url) || isBlockedUrl(url)) continue
        seen.add(url)
        results.push({
          title: item.title ?? '',
          url,
          snippet: item.snippet ?? '',
        })
      }
    } catch {
      // skip failed query
    }
  }

  // Sort: high-value domains first, then others
  return results.sort((a, b) => {
    const aHigh = HIGH_VALUE_DOMAINS.some((d) => a.url.includes(d)) ? 0 : 1
    const bHigh = HIGH_VALUE_DOMAINS.some((d) => b.url.includes(d)) ? 0 : 1
    return aHigh - bHigh
  })
}

// ---------------------------------------------------------------------------
// Fetch
// ---------------------------------------------------------------------------

async function fetchCleanText(url: string): Promise<{ text: string; title: string } | null> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 9000)

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; FriedRiceIndexBot/1.0)',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      cache: 'no-store',
    })

    if (!res.ok) return null

    const html = await res.text()
    if (!html) return null

    const $ = cheerio.load(html)
    $('script, style, noscript, svg, img, iframe, nav, footer, header').remove()

    const title = $('title').text().trim() || $('h1').first().text().trim()
    const text = $('body').text().replace(/\s+/g, ' ').trim().slice(0, 8000)

    return { text, title }
  } catch {
    return null
  } finally {
    clearTimeout(timeout)
  }
}

// ---------------------------------------------------------------------------
// Claude extraction
// ---------------------------------------------------------------------------

async function extractWithGemini(params: {
  text: string
  restaurantName: string
  city: string
  country: string
  currency: Currency
}): Promise<ExtractedDish[]> {
  const { text, restaurantName, city, country, currency } = params

  const floor = PRICE_FLOOR_LOCAL[currency.code] ?? 3
  const ceil = PRICE_CEIL_LOCAL[currency.code] ?? 90
  const premiumHint = PRICE_CEIL_LOCAL[currency.code]
    ? `${Math.round(PRICE_CEIL_LOCAL[currency.code] * 0.6)} ${currency.code}`
    : `30 ${currency.code}`

  const prompt = `You are extracting fried rice dish data from a restaurant menu page.

Restaurant: ${restaurantName}
Location: ${city}, ${country}
Currency: ${currency.code} (symbol: ${currency.symbol})
Valid price range: ${floor}–${ceil} ${currency.code}

--- PAGE TEXT ---
${text.slice(0, 4000)}
--- END ---

Extract every fried rice dish you can find. Return ONLY a valid JSON array with no other text.

Each object must have exactly:
{
  "dish_name": "exact name from the menu",
  "local_price": number (e.g. 14.99 or 1400 — numeric only, no currency symbols),
  "dish_category": "basic" | "vegetable" | "meat_based" | "seafood" | "house_special" | "premium"
}

Category rules:
- basic: plain egg fried rice, plain fried rice with egg, no specific protein listed
- vegetable: vegetable fried rice, veggie fried rice, garden fried rice
- meat_based: chicken, beef, pork, ham, bacon, duck, char siu / bbq pork fried rice
- seafood: shrimp, prawn, lobster, crab, scallop, squid, fish fried rice
- house_special: combination, special, yang chow, yangzhou, mixed protein fried rice
- premium: wagyu, truffle, gold leaf, luxury ingredients, or price over ${premiumHint}

Only include dishes that contain "fried rice" or are unmistakably a fried rice dish.
Only include prices between ${floor} and ${ceil} ${currency.code}.
If no fried rice dishes found, return [].`

  try {
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!)
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })

    const result = await model.generateContent(prompt)
    const raw = result.response.text()

    const jsonMatch = raw.match(/\[[\s\S]*\]/)
    if (!jsonMatch) return []

    const parsed = JSON.parse(jsonMatch[0])
    if (!Array.isArray(parsed)) return []

    return parsed.filter(
      (item): item is ExtractedDish =>
        typeof item.dish_name === 'string' &&
        typeof item.local_price === 'number' &&
        item.local_price >= floor &&
        item.local_price <= ceil &&
        typeof item.dish_category === 'string'
    )
  } catch {
    return []
  }
}

// ---------------------------------------------------------------------------
// Build + dedup + insert
// ---------------------------------------------------------------------------

function buildCandidates(
  dishes: ExtractedDish[],
  meta: {
    city: string
    country: string
    restaurantName: string
    currency: Currency
    sourceUrl: string
    sourceTitle: string
  }
): Candidate[] {
  const { city, country, restaurantName, currency, sourceUrl, sourceTitle } = meta
  const rate = TO_CAD[currency.code] ?? 1

  return dishes.map((dish) => {
    const priceCad = toCad(dish.local_price, currency.code)
    const includedInBaseline = dish.dish_category === 'basic' || dish.dish_category === 'vegetable'

    return {
      city,
      country,
      restaurant_name: restaurantName,
      dish_name: dish.dish_name,
      dish_category: dish.dish_category,
      included_in_baseline: includedInBaseline,
      tier: guessTier(priceCad),
      local_price: dish.local_price,
      local_currency: currency.code,
      exchange_rate_used: rate,
      price_cad: priceCad,
      source: sourceTitle || 'Scraped menu page',
      source_type: sourceTypeFromUrl(sourceUrl),
      source_url: sourceUrl,
      confidence_score: confidenceFromSource(sourceUrl),
      notes: `Scraped via Claude parser. ${currency.code} ${dish.local_price} → CA$${priceCad}. Source: ${sourceUrl.slice(0, 120)}`,
    }
  })
}

async function deduplicateAndInsert(candidates: Candidate[], city: string): Promise<number> {
  if (candidates.length === 0) return 0

  const [{ data: existingPending }, { data: existingRestaurants }] = await Promise.all([
    supabase
      .from('pending_requests')
      .select('city, restaurant_name, dish_name, source_url')
      .eq('city', city)
      .eq('request_type', 'restaurant')
      .in('status', ['pending', 'approved']),
    supabase
      .from('restaurants')
      .select('city, restaurant_name, dish_name, source_url')
      .eq('city', city),
  ])

  const existingRows = [...(existingPending ?? []), ...(existingRestaurants ?? [])]

  const newCandidates = candidates.filter((c) => !isDuplicate(c, existingRows))
  if (newCandidates.length === 0) return 0

  const rows = newCandidates.map((c) => ({
    request_type: 'restaurant',
    city: c.city,
    country: c.country,
    restaurant_name: c.restaurant_name,
    dish_name: c.dish_name,
    dish_category: c.dish_category,
    included_in_baseline: c.included_in_baseline,
    tier: c.tier,
    local_price: c.local_price,
    local_currency: c.local_currency,
    exchange_rate_used: c.exchange_rate_used,
    price_cad: c.price_cad,
    source: c.source,
    source_type: c.source_type,
    source_url: c.source_url,
    confidence_score: c.confidence_score,
    date_accessed: new Date().toISOString(),
    notes: c.notes,
    status: 'pending',
  }))

  const { error } = await supabase.from('pending_requests').insert(rows)
  if (error) throw new Error(error.message)

  return rows.length
}

// ---------------------------------------------------------------------------
// Scraper run logging
// ---------------------------------------------------------------------------

async function logRunStart(city: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('scraper_runs')
    .insert({ city, run_type: 'city_auto_scrape', status: 'running' })
    .select('id')
    .single()

  if (error) return null
  return data?.id ?? null
}

async function logRunFinish(
  runId: string,
  status: 'completed' | 'failed',
  resultsFound: number,
  notes: string
) {
  await supabase
    .from('scraper_runs')
    .update({ status, finished_at: new Date().toISOString(), results_found: resultsFound, notes })
    .eq('id', runId)
}

// ---------------------------------------------------------------------------
// Core scrape logic (exported for cron use)
// ---------------------------------------------------------------------------

export type ScrapeResult = {
  city: string
  country: string
  urls_checked: number
  pages_scraped: number
  dishes_found: number
  proposals_inserted: number
  errors: string[]
}

export async function scrapeCity(city: string, country: string): Promise<ScrapeResult> {
  const currency = currencyForCountry(country)
  const errors: string[] = []
  let pagesScraped = 0
  let dishesFound = 0

  const runId = await logRunStart(city)
  const allCandidates: Candidate[] = []

  const searchResults = await searchMenuUrls(city, country)

  for (const result of searchResults.slice(0, 15)) {
    try {
      const page = await fetchCleanText(result.url)
      if (!page) continue

      pagesScraped++
      const restaurantName = restaurantNameFromTitle(page.title || result.title, result.url)

      const dishes = await extractWithGemini({
        text: page.text,
        restaurantName,
        city,
        country,
        currency,
      })

      if (dishes.length === 0) continue

      dishesFound += dishes.length

      const candidates = buildCandidates(dishes, {
        city,
        country,
        restaurantName,
        currency,
        sourceUrl: result.url,
        sourceTitle: page.title || result.title,
      })

      allCandidates.push(...candidates)
    } catch (err) {
      errors.push(`${result.url}: ${err instanceof Error ? err.message : String(err)}`)
    }

    // Avoid hammering Claude / external pages
    await new Promise((r) => setTimeout(r, 300))
  }

  // Deduplicate across candidates from different pages
  const seenKey = new Set<string>()
  const uniqueCandidates = allCandidates.filter((c) => {
    const key = `${normalizeForDupe(c.restaurant_name)}:${normalizeForDupe(c.dish_name)}`
    if (seenKey.has(key)) return false
    seenKey.add(key)
    return true
  })

  const proposalsInserted = await deduplicateAndInsert(uniqueCandidates, city)

  if (runId) {
    await logRunFinish(
      runId,
      'completed',
      proposalsInserted,
      `${pagesScraped} pages scraped, ${dishesFound} dishes found, ${proposalsInserted} new proposals inserted. Errors: ${errors.length}.`
    )
  }

  return {
    city,
    country,
    urls_checked: searchResults.length,
    pages_scraped: pagesScraped,
    dishes_found: dishesFound,
    proposals_inserted: proposalsInserted,
    errors,
  }
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const username = String(body.username ?? '')
    const password = String(body.password ?? '')
    const city = String(body.city ?? '').trim()
    const country = String(body.country ?? '').trim()

    if (username !== process.env.ADMIN_USERNAME || password !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!city || !country) {
      return NextResponse.json({ error: 'city and country are required' }, { status: 400 })
    }

    if (!process.env.GOOGLE_AI_API_KEY) {
      return NextResponse.json({ error: 'GOOGLE_AI_API_KEY is not configured' }, { status: 500 })
    }

    const result = await scrapeCity(city, country)

    return NextResponse.json({ success: true, ...result })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Scrape failed' },
      { status: 500 }
    )
  }
}
