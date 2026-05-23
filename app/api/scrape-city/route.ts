// curl -H "Authorization: Bearer ps20123139" https://efr-index.vercel.app/api/cron/scrape-all-cities

import Groq from 'groq-sdk'
import * as cheerio from 'cheerio'
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase-admin'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Currency = { code: string; symbol: string }

type SearchResult = { title: string; url: string; snippet: string }

type ExtractedDish = {
  dish_name: string
  local_price: number
  dish_category: 'basic' | 'vegetable' | 'meat_based' | 'seafood' | 'house_special' | 'premium'
  restaurant_name?: string
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

// Google country codes for localised search results
const GL_BY_COUNTRY: Record<string, string> = {
  canada: 'ca', 'united states': 'us', usa: 'us', us: 'us',
  'united kingdom': 'gb', uk: 'gb', england: 'gb', scotland: 'gb', wales: 'gb',
  australia: 'au', singapore: 'sg', 'hong kong': 'hk',
  japan: 'jp', china: 'cn', taiwan: 'tw', 'south korea': 'kr', korea: 'kr',
  india: 'in', malaysia: 'my', philippines: 'ph', indonesia: 'id',
  thailand: 'th', vietnam: 'vn', france: 'fr', germany: 'de',
  italy: 'it', spain: 'es', netherlands: 'nl', switzerland: 'ch',
  mexico: 'mx', brazil: 'br', argentina: 'ar',
  'uae': 'ae', 'united arab emirates': 'ae', 'saudi arabia': 'sa',
  'new zealand': 'nz',
}

function glCodeForCountry(country: string): string {
  const key = country.toLowerCase().trim()
  if (GL_BY_COUNTRY[key]) return GL_BY_COUNTRY[key]
  for (const [k, v] of Object.entries(GL_BY_COUNTRY)) {
    if (key.includes(k) || k.includes(key)) return v
  }
  return 'us'
}

// Domains to skip entirely
const BLOCKED_DOMAINS = [
  'facebook.com', 'instagram.com', 'tiktok.com', 'youtube.com',
  'reddit.com', 'twitter.com', 'x.com', 'pinterest.com',
  'tripadvisor.com', 'google.com/maps',
]

// Roundup / list / review sites — their snippets have no prices and their
// titles ("38 best fried rice spots") would be mistaken for restaurant names
const ROUNDUP_DOMAINS = [
  'eater.com', 'timeout.com', 'thrillist.com', 'narcity.com',
  'blogto.com', 'infatuation.com', 'zagat.com', 'tasteatlas.com',
  'lonelyplanet.com', 'theculturetrip.com', 'foodnetwork.com',
  'bonappetit.com', 'seriouseats.com', 'chowhound.com', 'listed.city',
  'zomato.com', 'opentable.com', 'resy.com', 'quora.com',
]

function isRoundupPage(title: string, url: string): boolean {
  const t = title.toLowerCase()
  const u = url.toLowerCase()
  if (ROUNDUP_DOMAINS.some((d) => u.includes(d))) return true
  // Title patterns: "38 best fried rice", "Top 10 restaurants", "guide to", etc.
  if (/\b\d+\s+(best|top|great|amazing|must.try)\b|\bbest\b.{0,30}\b(rice|restaurant|spot|place)\b|guide to|where to eat|must.try|ranked/i.test(t)) return true
  return false
}

// JS SPAs — their snippets are useful but fetching them returns empty HTML
const SPA_DOMAINS = [
  'ubereats.com', 'doordash.com', 'skipthedishes.com',
  'grubhub.com', 'seamless.com', 'deliveroo.com', 'foodpanda.com',
  'yelp.com',
]

// Static sites worth fetching
const HIGH_VALUE_DOMAINS = [
  'menupix.com', 'allmenus.com', 'menuism.com',
  'toasttab.com', 'chownow.com', 'olo.com', 'fantuanorder.com',
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

async function fetchLiveRates(): Promise<Record<string, number>> {
  try {
    const res = await fetch('https://open.er-api.com/v6/latest/CAD', { cache: 'no-store' })
    if (!res.ok) return TO_CAD
    const json = await res.json()
    if (json.result !== 'success' || !json.rates) return TO_CAD
    const live: Record<string, number> = { CAD: 1 }
    for (const [code, rate] of Object.entries(json.rates as Record<string, number>)) {
      if (rate > 0) live[code] = Number((1 / rate).toFixed(8))
    }
    return live
  } catch {
    return TO_CAD
  }
}

function toCad(localPrice: number, currencyCode: string, rates: Record<string, number> = TO_CAD): number {
  const rate = rates[currencyCode] ?? TO_CAD[currencyCode] ?? 1
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

function isSpaDomain(url: string): boolean {
  return SPA_DOMAINS.some((d) => url.toLowerCase().includes(d))
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

// Strict dish name filter — must be an actual fried rice dish, not noodles or fries
function isValidFriedRiceDish(name: string): boolean {
  const d = name.toLowerCase()
  if (!d.includes('fried rice')) return false
  // Reject noodle/vermicelli variants that sound like fried rice
  if (/fried rice noodle|noodle.{0,10}fried rice|rice noodle|vermicelli/.test(d)) return false
  return true
}

// Restaurant name must be a real, specific establishment name
function isValidRestaurantName(name: string): boolean {
  if (!name || name.trim().length < 3) return false
  // Anything over 70 chars is almost certainly a sentence or article title
  if (name.length > 70) return false
  const n = name.toLowerCase().trim()
  const invalid = [
    'unknown restaurant', 'various restaurants', 'unknown', 'restaurant',
    'n/a', 'na', 'google search snippet', 'various',
  ]
  if (invalid.includes(n)) return false
  // Reject list/roundup titles: "38 best fried rice", "Top 5 spots", etc.
  if (/\b\d+\s+(best|top|great|must)\b|\bbest\b.{0,20}\b(restaurant|rice|spot)\b|guide to|where to eat/i.test(n)) return false
  // Must contain at least one letter
  if (!/[a-z]/i.test(name)) return false
  return true
}

// After building per-city candidates, keep only the cheapest and most expensive dish
// per restaurant to avoid over-sampling the same source
function keepMinMaxPerRestaurant(candidates: Candidate[]): Candidate[] {
  const byKey = new Map<string, Candidate[]>()
  for (const c of candidates) {
    const key = normalizeForDupe(c.source_url) || normalizeForDupe(c.restaurant_name)
    if (!byKey.has(key)) byKey.set(key, [])
    byKey.get(key)!.push(c)
  }

  const result: Candidate[] = []
  for (const group of byKey.values()) {
    if (group.length === 0) continue
    const sorted = [...group].sort((a, b) => a.price_cad - b.price_cad)
    result.push(sorted[0]) // cheapest
    if (sorted.length > 1 && sorted[sorted.length - 1].price_cad > sorted[0].price_cad * 1.05) {
      result.push(sorted[sorted.length - 1]) // most expensive if meaningfully different
    }
  }
  return result
}

function checkDuplicate(
  candidate: { city: string; restaurant_name: string; dish_name: string; source_url: string; price_cad: number },
  existing: Array<{ city?: string | null; restaurant_name?: string | null; dish_name?: string | null; source_url?: string | null; price_cad?: number | null }>
): { isDupe: boolean; oldPrice?: number } {
  for (const row of existing) {
    const sameCity = normalizeForDupe(row.city) === normalizeForDupe(candidate.city)
    if (!sameCity) continue

    const sameUrl =
      normalizeForDupe(candidate.source_url) !== '' &&
      normalizeForDupe(row.source_url) === normalizeForDupe(candidate.source_url)

    const samePair =
      normalizeForDupe(row.restaurant_name) === normalizeForDupe(candidate.restaurant_name) &&
      normalizeForDupe(row.dish_name) === normalizeForDupe(candidate.dish_name)

    if (sameUrl || samePair) {
      const oldPrice = Number(row.price_cad)
      if (Number.isFinite(oldPrice) && oldPrice > 0) {
        const pctChange = Math.abs(candidate.price_cad - oldPrice) / oldPrice
        if (pctChange > 0.10) return { isDupe: false, oldPrice }
      }
      return { isDupe: true }
    }
  }
  return { isDupe: false }
}

// ---------------------------------------------------------------------------
// Search
// ---------------------------------------------------------------------------

async function searchMenuUrls(city: string, country: string, region?: string): Promise<SearchResult[]> {
  const apiKey = process.env.SERPAPI_API_KEY
  if (!apiKey) throw new Error('Missing SERPAPI_API_KEY')

  // Include region in SerpAPI location to disambiguate e.g. Vancouver BC vs Vancouver WA
  const location = region ? `${city}, ${region}, ${country}` : `${city}, ${country}`
  // Short region hint for queries (e.g. "BC", "NY") — use first word or abbreviation
  const regionHint = region ? ` ${region}` : ''
  const gl = glCodeForCountry(country)

  // Each query targets a different segment to surface different restaurants.
  // Roundup sites excluded with -site: operators on the broadest queries.
  const queries = [
    // Chinese & East-Asian restaurants — biggest fried rice category
    `${city}${regionHint} chinese restaurant "fried rice" menu price -site:tripadvisor.com -site:yelp.com`,
    // Delivery platforms: UberEats/DoorDash snippets already contain prices
    `"fried rice" ${city}${regionHint} site:ubereats.com OR site:doordash.com OR site:skipthedishes.com OR site:fantuanorder.com`,
    // Menu aggregator sites — static, high-quality price data
    `fried rice ${city}${regionHint} site:menupix.com OR site:allmenus.com OR site:menuism.com`,
    // Thai, Vietnamese, Indian, Malaysian cuisines (hit different restaurants)
    `${city}${regionHint} thai OR vietnamese OR indian OR malaysian restaurant "fried rice" menu price`,
    // Korean, Japanese, Filipino, Indonesian cuisine (hit yet more different restaurants)
    `${city}${regionHint} korean OR japanese OR filipino OR indonesian restaurant "fried rice" menu price`,
  ]

  const seen = new Set<string>()
  const results: SearchResult[] = []

  for (const q of queries) {
    try {
      const params = new URLSearchParams({
        engine: 'google',
        q,
        api_key: apiKey,
        num: '10',
        hl: 'en',
        gl,
        location,
      })

      const res = await fetch(`https://serpapi.com/search.json?${params}`, { cache: 'no-store' })
      if (!res.ok) continue

      const json = await res.json()
      const organic: Array<{ title?: string; link?: string; snippet?: string }> = json.organic_results ?? []

      for (const item of organic) {
        const url = item.link
        const title = item.title ?? ''
        if (!url || seen.has(url) || isBlockedUrl(url)) continue
        if (isRoundupPage(title, url)) continue
        seen.add(url)
        results.push({ title, url, snippet: item.snippet ?? '' })
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
// LLM extraction
// ---------------------------------------------------------------------------

const VALID_CATEGORIES = new Set(['basic', 'vegetable', 'meat_based', 'seafood', 'house_special', 'premium'])

function normalizeCategory(raw: string, dishName: string): ExtractedDish['dish_category'] {
  const r = raw.toLowerCase().trim()
  if (VALID_CATEGORIES.has(r)) return r as ExtractedDish['dish_category']

  const d = dishName.toLowerCase()
  if (/shrimp|prawn|lobster|crab|scallop|squid|fish/.test(d)) return 'seafood'
  if (/chicken|beef|pork|ham|bacon|duck|char siu|bbq pork/.test(d)) return 'meat_based'
  if (/veg|vegetable|veggie|garden|schezwan|szechuan/.test(d)) return 'vegetable'
  if (/special|combination|combo|mixed|yang.?chow|yangzhou|deluxe/.test(d)) return 'house_special'
  if (/truffle|wagyu|gold|lobster/.test(d)) return 'premium'
  return 'basic'
}

function cleanLlmJson(raw: string): string {
  let s = raw.replace(/```(?:json)?\s*/gi, '').replace(/```/g, '')
  // Single-quoted property names: 'key': → "key":
  s = s.replace(/'([^']+)'(\s*:)/g, '"$1"$2')
  // Single-quoted string values: : 'value' → : "value"
  s = s.replace(/:\s*'([^']*)'/g, ': "$1"')
  // Trailing commas before } or ]
  s = s.replace(/,(\s*[}\]])/g, '$1')
  return s.trim()
}

async function extractWithGemini(params: {
  text: string
  restaurantName: string
  city: string
  country: string
  region?: string
  currency: Currency
}): Promise<ExtractedDish[]> {
  const { text, restaurantName, city, country, region, currency } = params
  const cityLabel = region ? `${city}, ${region}, ${country}` : `${city}, ${country}`

  const floor = PRICE_FLOOR_LOCAL[currency.code] ?? 3
  const ceil = PRICE_CEIL_LOCAL[currency.code] ?? 90
  const premiumHint = PRICE_CEIL_LOCAL[currency.code]
    ? `${Math.round(PRICE_CEIL_LOCAL[currency.code] * 0.6)} ${currency.code}`
    : `30 ${currency.code}`

  const prompt = `You are extracting fried rice dish data from restaurant menu text for ${cityLabel}.

Currency: ${currency.code} (symbol: ${currency.symbol})
Valid price range: ${floor}–${ceil} ${currency.code}

--- TEXT ---
${text.slice(0, 4000)}
--- END ---

Return ONLY a valid JSON array (no prose, no markdown fences). Each object:
{
  "restaurant_name": "exact restaurant name from the text",
  "dish_name": "exact dish name from the menu",
  "local_price": number (numeric only, e.g. 14.99),
  "dish_category": "basic" | "vegetable" | "meat_based" | "seafood" | "house_special" | "premium"
}

STRICT RULES — violating these means the entry must be omitted:
1. dish_name MUST contain the words "fried rice" — do NOT include fried noodles, rice noodles, chow mein, lo mein, pad thai, bibimbap, sweet potato fries, or any dish that is not a fried rice dish
2. restaurant_name MUST be a real, specific restaurant name found in the text — not "Unknown", "Various", or a delivery platform name
3. The restaurant MUST appear to be located in ${cityLabel} — skip any restaurant that is clearly in a different city${region ? ` (e.g. do not include restaurants in a different region or state with the same city name)` : ''} or country
4. local_price must be a number between ${floor} and ${ceil}

Category rules:
- basic: plain egg fried rice, plain fried rice, no specific protein
- vegetable: vegetable/veggie/garden fried rice
- meat_based: chicken, beef, pork, ham, duck, char siu, bbq pork
- seafood: shrimp, prawn, lobster, crab, scallop, squid, fish
- house_special: combination, special, yang chow, yangzhou, mixed protein, deluxe
- premium: wagyu, truffle, gold leaf, luxury, or price above ${premiumHint}

If no qualifying fried rice dishes are found, return [].`

  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const completion = await groq.chat.completions.create({
        model: 'llama-3.1-8b-instant',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1,
        max_tokens: 1024,
      })
      const raw = completion.choices[0]?.message?.content ?? ''

      const jsonMatch = raw.match(/\[[\s\S]*\]/)
      if (!jsonMatch) return []

      const parsed = JSON.parse(cleanLlmJson(jsonMatch[0]))
      if (!Array.isArray(parsed)) return []

      return parsed
        .filter(
          (item: { dish_name?: unknown; local_price?: unknown; dish_category?: unknown; restaurant_name?: unknown }) =>
            typeof item.dish_name === 'string' &&
            isValidFriedRiceDish(item.dish_name) &&
            typeof item.local_price === 'number' &&
            Number.isFinite(item.local_price) &&
            item.local_price >= floor &&
            item.local_price <= ceil
        )
        .map((item: { dish_name: string; local_price: number; dish_category?: unknown; restaurant_name?: unknown }) => ({
          dish_name: item.dish_name,
          local_price: item.local_price,
          dish_category: normalizeCategory(String(item.dish_category ?? ''), item.dish_name),
          restaurant_name: typeof item.restaurant_name === 'string' && isValidRestaurantName(item.restaurant_name)
            ? item.restaurant_name : undefined,
        }))
    } catch (err) {
      const msg = String(err)
      if (msg.includes('429') || msg.includes('rate')) {
        await new Promise((r) => setTimeout(r, (attempt + 1) * 10000))
        continue
      }
      return []
    }
  }
  return []
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
    rates: Record<string, number>
  }
): Candidate[] {
  const { city, country, restaurantName, currency, sourceUrl, sourceTitle, rates } = meta
  const rate = rates[currency.code] ?? TO_CAD[currency.code] ?? 1

  return dishes.map((dish) => {
    const priceCad = toCad(dish.local_price, currency.code, rates)
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
      .select('city, restaurant_name, dish_name, source_url, price_cad')
      .eq('city', city)
      .eq('request_type', 'restaurant')
      .in('status', ['pending', 'approved']),
    supabase
      .from('restaurants')
      .select('city, restaurant_name, dish_name, source_url, price_cad')
      .eq('city', city),
  ])

  const existingRows = [...(existingPending ?? []), ...(existingRestaurants ?? [])]

  const newCandidates: Array<Candidate & { priceUpdateFrom?: number }> = []
  for (const c of candidates) {
    const { isDupe, oldPrice } = checkDuplicate(c, existingRows)
    if (!isDupe) newCandidates.push({ ...c, priceUpdateFrom: oldPrice })
  }
  if (newCandidates.length === 0) return 0

  const rows = newCandidates.map((c) => ({
    request_type: c.priceUpdateFrom !== undefined ? 'price_update' : 'restaurant',
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
    notes: c.priceUpdateFrom !== undefined
      ? `Price update: was CA$${c.priceUpdateFrom.toFixed(2)}, now CA$${c.price_cad.toFixed(2)}. ${c.notes}`
      : c.notes,
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
  region?: string
  urls_checked: number
  pages_scraped: number
  dishes_found: number
  proposals_inserted: number
  errors: string[]
}

export async function scrapeCity(city: string, country: string, region?: string): Promise<ScrapeResult> {
  const currency = currencyForCountry(country)
  const rates = await fetchLiveRates()
  const errors: string[] = []
  let pagesScraped = 0
  let dishesFound = 0

  const runId = await logRunStart(city)
  const allCandidates: Candidate[] = []

  const searchResults = await searchMenuUrls(city, country, region)

  // --- Pass 1: extract from search snippets in labelled batches ---
  // Only include snippets that have a price signal and aren't from roundup pages.
  // Process in batches of 5 with explicit per-source labels so the LLM never
  // confuses an article headline with a restaurant name.
  const SNIPPET_BATCH = 5
  const priceSignal = /\$|£|€|¥|₩|₹|price|menu|\d+\.\d{2}/i

  const snippetSources = searchResults.filter(
    (r) => r.snippet.length > 30 && priceSignal.test(r.snippet)
  )

  for (let i = 0; i < snippetSources.length; i += SNIPPET_BATCH) {
    const batch = snippetSources.slice(i, i + SNIPPET_BATCH)

    // Build labelled text: each entry knows exactly which restaurant it belongs to
    const batchText = batch.map((r) => {
      let domain = ''
      try { domain = new URL(r.url).hostname.replace(/^www\./, '') } catch { domain = '' }
      const name = restaurantNameFromTitle(r.title, r.url)
      return `RESTAURANT: "${name}" (${domain})\nSNIPPET: ${r.snippet}`
    }).join('\n\n---\n\n')

    try {
      const batchDishes = await extractWithGemini({
        text: batchText,
        restaurantName: '',
        city, country, region, currency,
      })

      if (batchDishes.length > 0) {
        dishesFound += batchDishes.length
        for (const dish of batchDishes) {
          const restaurantName = dish.restaurant_name ?? ''
          if (!isValidRestaurantName(restaurantName)) continue

          // Find the source this dish came from
          const match = batch.find((r) => {
            const n = restaurantNameFromTitle(r.title, r.url).toLowerCase()
            const d = restaurantName.toLowerCase()
            return n.includes(d.split(' ')[0]) || d.includes(n.split(' ')[0])
          }) ?? batch[0]

          const candidates = buildCandidates([dish], {
            city, country, restaurantName, currency,
            sourceUrl: match.url,
            sourceTitle: match.title || restaurantName,
            rates,
          })
          allCandidates.push(...candidates)
        }
      }
    } catch {
      // batch extraction failed — continue
    }
  }

  // --- Pass 2: fetch static-friendly pages ---
  for (const result of searchResults.filter((r) => !isSpaDomain(r.url) && !isRoundupPage(r.title, r.url)).slice(0, 5)) {
    try {
      const page = await fetchCleanText(result.url)
      if (!page) continue

      pagesScraped++
      const restaurantName = restaurantNameFromTitle(page.title || result.title, result.url)

      if (!isValidRestaurantName(restaurantName)) continue

      const dishes = await extractWithGemini({
        text: page.text,
        restaurantName,
        city,
        country,
        region,
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
        rates,
      })

      allCandidates.push(...candidates)
    } catch (err) {
      errors.push(`${result.url}: ${err instanceof Error ? err.message : String(err)}`)
    }

    await new Promise((r) => setTimeout(r, 5000))
  }

  // Keep only cheapest + most expensive dish per restaurant to maximise source diversity
  const cappedCandidates = keepMinMaxPerRestaurant(allCandidates)

  // Deduplicate across candidates from different pages
  const seenKey = new Set<string>()
  const uniqueCandidates = cappedCandidates.filter((c) => {
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
    const region = body.region ? String(body.region).trim() : undefined

    if (username !== process.env.ADMIN_USERNAME || password !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!city || !country) {
      return NextResponse.json({ error: 'city and country are required' }, { status: 400 })
    }

    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json({ error: 'GROQ_API_KEY is not configured' }, { status: 500 })
    }

    const result = await scrapeCity(city, country, region)

    return NextResponse.json({ success: true, ...result })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Scrape failed' },
      { status: 500 }
    )
  }
}
