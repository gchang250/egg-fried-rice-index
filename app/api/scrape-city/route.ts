import { NextResponse } from 'next/server'
import * as cheerio from 'cheerio'
import { supabase } from '@/lib/supabase'

type SearchResult = {
  title?: string
  link?: string
  snippet?: string
  source?: string
}

type RestaurantCandidate = {
  city: string
  restaurant_name: string
  dish_name: string
  tier: string
  price_cad: number
  local_price: number
  local_currency: string
  source: string
  source_url: string
  confidence_score: number
  notes: string
}

const CAD_RATES: Record<string, number> = {
  CAD: 1,
  USD: 1.37,
  GBP: 1.73,
  EUR: 1.48,
  SGD: 1.01,
  HKD: 0.18,
  AUD: 0.91,
  JPY: 0.0093,
}

const ACCEPT_TERMS = [
  'egg fried rice',
  'plain egg fried rice',
  'classic egg fried rice',
  'fried rice with egg',
  'fried rice w egg',
  'egg and soy sauce fried rice',
  'egg soy sauce fried rice',
  'vegetable and egg fried rice',
  'veggie egg fried rice',
  'seasonal greens and egg fried rice',
]

const SOFT_ACCEPT_TERMS = [
  'egg fried',
  'fried rice egg',
  'eggs fried rice',
]

const REJECT_TERMS = [
  'lobster',
  'crab',
  'scallop',
  'scallops',
  'shrimp',
  'prawn',
  'prawns',
  'seafood',
  'xo sauce',
  'xo fried rice',
  'truffle',
  'wagyu',
  'duck',
  'combo',
  'combination',
  'deluxe',
  'house special',
  'special fried rice',
  'yang chow',
  'yangzhou',
  'bbq pork',
  'beef',
  'chicken',
  'pork',
  'ham',
  'bacon',
]

const BAD_DOMAINS = [
  'facebook.com',
  'instagram.com',
  'tiktok.com',
  'youtube.com',
  'reddit.com',
  'tripadvisor.com',
  'yelp.com',
]

const MENU_HINT_DOMAINS = [
  'menupix',
  'skipthedishes',
  'ubereats',
  'doordash',
  'ritual',
  'toasttab',
  'chownow',
  'squarespace',
  'wixsite',
  'menu',
  'restaurant',
]

function authorized(username: string, password: string) {
  return (
    username === process.env.ADMIN_USERNAME &&
    password === process.env.ADMIN_PASSWORD
  )
}

function normalizeText(text: string) {
  return text.replace(/\s+/g, ' ').trim()
}

function containsAny(text: string, terms: string[]) {
  const lower = text.toLowerCase()
  return terms.some((term) => lower.includes(term))
}

function currencyForCountry(country: string) {
  const normalized = country.toLowerCase().trim()

  if (!normalized) {
    throw new Error('Country is required so scraper prices can be converted to CAD.')
  }

  if (normalized.includes('canada')) return 'CAD'

  if (
    normalized.includes('united states') ||
    normalized === 'us' ||
    normalized === 'usa' ||
    normalized.includes('u.s.')
  ) {
    return 'USD'
  }

  if (
    normalized.includes('united kingdom') ||
    normalized === 'uk' ||
    normalized.includes('england') ||
    normalized.includes('scotland') ||
    normalized.includes('wales')
  ) {
    return 'GBP'
  }

  if (normalized.includes('singapore')) return 'SGD'
  if (normalized.includes('hong kong')) return 'HKD'
  if (normalized.includes('australia')) return 'AUD'
  if (normalized.includes('japan')) return 'JPY'
  if (normalized.includes('eurozone')) return 'EUR'
  if (normalized.includes('france')) return 'EUR'
  if (normalized.includes('germany')) return 'EUR'
  if (normalized.includes('italy')) return 'EUR'
  if (normalized.includes('spain')) return 'EUR'
  if (normalized.includes('netherlands')) return 'EUR'
  if (normalized.includes('ireland')) return 'EUR'

  throw new Error(
    `Unsupported country/currency for scraper conversion: "${country}". Add this country to currencyForCountry() before scraping.`
  )
}

function convertToCad(localPrice: number, localCurrency: string) {
  const rate = CAD_RATES[localCurrency] ?? 1
  return Number((localPrice * rate).toFixed(2))
}

function looksLikeGoodDish(text: string) {
  const lower = text.toLowerCase()

  const hasAccept =
    containsAny(lower, ACCEPT_TERMS) || containsAny(lower, SOFT_ACCEPT_TERMS)

  if (!hasAccept) return false
  if (containsAny(lower, REJECT_TERMS)) return false

  return true
}

function extractPrice(text: string) {
  const matches = text.match(/\$ ?([0-9]{1,3}(?:\.[0-9]{2})?)/g)

  if (!matches || matches.length === 0) return null

  const prices = matches
    .map((match) => Number(match.replace('$', '').trim()))
    .filter((price) => Number.isFinite(price))
    .filter((price) => price >= 5 && price <= 40)

  if (prices.length === 0) return null

  return prices[0]
}

function guessTier(priceCad: number) {
  if (priceCad <= 12.5) return 'low_tier'
  if (priceCad <= 17.5) return 'mid_tier'
  if (priceCad <= 23) return 'high_end'
  return 'premium'
}

function confidenceFromUrl(url: string, line: string) {
  const lowerUrl = url.toLowerCase()
  const lowerLine = line.toLowerCase()

  let score = 0.55

  if (containsAny(lowerUrl, ['skipthedishes', 'ubereats', 'doordash'])) {
    score = 0.6
  }

  if (containsAny(lowerUrl, ['menupix'])) {
    score = 0.7
  }

  if (
    !containsAny(lowerUrl, ['skipthedishes', 'ubereats', 'doordash', 'menupix']) &&
    containsAny(lowerUrl, ['menu', 'restaurant', 'order'])
  ) {
    score = 0.75
  }

  if (containsAny(lowerLine, ACCEPT_TERMS)) {
    score += 0.05
  }

  return Math.min(Number(score.toFixed(2)), 0.85)
}

function guessRestaurantName(title: string | undefined, url: string) {
  if (title) {
    const menuOfMatch = title.match(/Menu of (.*?) in /i)

    if (menuOfMatch?.[1]) {
      return menuOfMatch[1].trim().slice(0, 90)
    }

    const orderFromMatch = title.match(/Order (.*?) Menu/i)

    if (orderFromMatch?.[1]) {
      return orderFromMatch[1].trim().slice(0, 90)
    }

    const cleaned = title
      .replace(/\|.*$/g, '')
      .replace(/\s+-\s+.*$/g, '')
      .replace(/\bmenu\b/gi, '')
      .replace(/\border\b/gi, '')
      .replace(/\bonline\b/gi, '')
      .replace(/\bdelivery\b/gi, '')
      .replace(/\brestaurant\b/gi, 'Restaurant')
      .trim()

    if (cleaned.length > 0) {
      return cleaned.slice(0, 90)
    }
  }

  try {
    const host = new URL(url).hostname.replace('www.', '')
    return host.split('.')[0] || 'Unknown restaurant'
  } catch {
    return 'Unknown restaurant'
  }
}

function isBadUrl(url: string) {
  const lower = url.toLowerCase()
  return BAD_DOMAINS.some((domain) => lower.includes(domain))
}

function isDuplicateCandidate(
  candidate: RestaurantCandidate,
  existing: RestaurantCandidate[]
) {
  return existing.some(
    (item) =>
      item.restaurant_name.toLowerCase() ===
        candidate.restaurant_name.toLowerCase() &&
      item.dish_name.toLowerCase() === candidate.dish_name.toLowerCase()
  )
}

async function serpSearch(query: string, location?: string): Promise<SearchResult[]> {
  const apiKey = process.env.SERPAPI_API_KEY

  if (!apiKey) {
    throw new Error('Missing SERPAPI_API_KEY')
  }

  const params = new URLSearchParams({
    engine: 'google',
    q: query,
    api_key: apiKey,
    num: '10',
    hl: 'en',
    gl: 'ca',
  })

  if (location) {
    params.set('location', location)
  }

  const response = await fetch(
    `https://serpapi.com/search.json?${params.toString()}`,
    {
      cache: 'no-store',
    }
  )

  if (!response.ok) {
    throw new Error(`SerpAPI request failed with status ${response.status}`)
  }

  const json = await response.json()

  return json.organic_results ?? []
}

async function fetchPageText(url: string) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 8000)

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (compatible; EggFriedRiceIndexBot/1.0; +https://efr-index.vercel.app)',
      },
      cache: 'no-store',
    })

    if (!response.ok) return null

    const contentType = response.headers.get('content-type') ?? ''

    if (
      !contentType.includes('text/html') &&
      !contentType.includes('text/plain') &&
      !contentType.includes('application/pdf')
    ) {
      return null
    }

    const raw = await response.text()

    if (!raw) return null

    const $ = cheerio.load(raw)
    $('script, style, noscript, svg, img').remove()

    return normalizeText($('body').text() || raw)
  } catch {
    return null
  } finally {
    clearTimeout(timeout)
  }
}

function extractCandidatesFromText(params: {
  city: string
  country: string
  pageText: string
  sourceUrl: string
  searchTitle?: string
}) {
  const { city, country, pageText, sourceUrl, searchTitle } = params

  const localCurrency = currencyForCountry(country)
  const candidates: RestaurantCandidate[] = []

  const chunks = pageText
    .split(/(?<=\$[0-9]{1,3}(?:\.[0-9]{2})?)|(?=[A-Z][A-Za-z '&().-]{3,80}\s+\$)/g)
    .map(normalizeText)
    .filter(Boolean)

  const fallbackChunks = pageText
    .split(/\.|•|\n|\r|\||\t/g)
    .map(normalizeText)
    .filter(Boolean)

  const allChunks = [...chunks, ...fallbackChunks]

  for (const chunk of allChunks) {
    if (!looksLikeGoodDish(chunk)) continue

    const localPrice = extractPrice(chunk)
    if (localPrice === null) continue

    const priceCad = convertToCad(localPrice, localCurrency)

    const dishMatch =
      chunk.match(
        /([A-Za-z '&().-]*(?:egg fried rice|fried rice with egg|fried rice w egg|egg and soy sauce fried rice|egg soy sauce fried rice|vegetable and egg fried rice|veggie egg fried rice|seasonal greens and egg fried rice)[A-Za-z '&().-]*)/i
      )?.[1] ?? 'Egg Fried Rice'

    const dishName = normalizeText(dishMatch).slice(0, 90)

    const candidate: RestaurantCandidate = {
      city,
      restaurant_name: guessRestaurantName(searchTitle, sourceUrl),
      dish_name: dishName,
      tier: guessTier(priceCad),
      price_cad: priceCad,
      local_price: localPrice,
      local_currency: localCurrency,
      source: searchTitle ?? 'Scraped menu page',
      source_url: sourceUrl,
      confidence_score: confidenceFromUrl(sourceUrl, chunk),
      notes: `Autonomous scraper candidate. Local price: ${localCurrency} ${localPrice.toFixed(
        2
      )}. Converted to CAD using static MVP exchange rate (${localCurrency}→CAD = ${
        CAD_RATES[localCurrency] ?? 1
      }). Extracted from text: "${chunk.slice(0, 220)}"`,
    }

    if (!isDuplicateCandidate(candidate, candidates)) {
      candidates.push(candidate)
    }
  }

  return candidates
}

async function createScraperRun(city: string) {
  const { data, error } = await supabase
    .from('scraper_runs')
    .insert({
      city,
      run_type: 'city_auto_scrape',
      status: 'running',
    })
    .select('id')
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return data.id as string
}

async function finishScraperRun(
  runId: string,
  status: 'completed' | 'failed',
  resultsFound: number,
  notes: string
) {
  await supabase
    .from('scraper_runs')
    .update({
      status,
      finished_at: new Date().toISOString(),
      results_found: resultsFound,
      notes,
    })
    .eq('id', runId)
}

function normalizeForDuplicateCheck(value: string | null | undefined) {
  return String(value ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .trim()
}

function sameScraperEntry(a: {
  city?: string | null
  restaurant_name?: string | null
  dish_name?: string | null
  source_url?: string | null
}, b: {
  city?: string | null
  restaurant_name?: string | null
  dish_name?: string | null
  source_url?: string | null
}) {
  const sameCity =
    normalizeForDuplicateCheck(a.city) === normalizeForDuplicateCheck(b.city)

  const sameRestaurant =
    normalizeForDuplicateCheck(a.restaurant_name) ===
    normalizeForDuplicateCheck(b.restaurant_name)

  const sameDish =
    normalizeForDuplicateCheck(a.dish_name) ===
    normalizeForDuplicateCheck(b.dish_name)

  const sameSourceUrl =
    normalizeForDuplicateCheck(a.source_url) !== '' &&
    normalizeForDuplicateCheck(a.source_url) ===
      normalizeForDuplicateCheck(b.source_url)

  return sameCity && ((sameRestaurant && sameDish) || sameSourceUrl)
}

async function insertRestaurantProposals(candidates: RestaurantCandidate[]) {
  if (candidates.length === 0) return 0

  const city = candidates[0].city

  const { data: existingPending, error: pendingError } = await supabase
    .from('pending_requests')
    .select('city, restaurant_name, dish_name, source_url, status')
    .eq('city', city)
    .eq('request_type', 'restaurant')
    .in('status', ['pending', 'approved'])

  if (pendingError) {
    throw new Error(pendingError.message)
  }

  const { data: existingRestaurants, error: restaurantError } = await supabase
    .from('restaurants')
    .select('city, restaurant_name, dish_name, source_url')
    .eq('city', city)

  if (restaurantError) {
    throw new Error(restaurantError.message)
  }

  const existingRows = [
    ...(existingPending ?? []),
    ...(existingRestaurants ?? []),
  ]

  const newCandidates = candidates.filter((candidate) => {
    return !existingRows.some((existing) =>
      sameScraperEntry(candidate, existing)
    )
  })

  if (newCandidates.length === 0) return 0

  const rows = newCandidates.map((candidate) => ({
    request_type: 'restaurant',
    city: candidate.city,
    restaurant_name: candidate.restaurant_name,
    dish_name: candidate.dish_name,
    tier: candidate.tier,
    price_cad: candidate.price_cad,
    source: candidate.source,
    source_url: candidate.source_url,
    confidence_score: candidate.confidence_score,
    notes: candidate.notes,
    status: 'pending',
  }))

  const { error } = await supabase.from('pending_requests').insert(rows)

  if (error) {
    throw new Error(error.message)
  }

  return rows.length
}

function extractPopulationFromSnippet(text: string) {
  const normalized = normalizeText(text)

  const populationMatch =
    normalized.match(/population[^0-9]{0,40}([0-9][0-9,]{4,})/i) ??
    normalized.match(/([0-9][0-9,]{4,})\s+(?:people|residents)/i)

  if (!populationMatch) return null

  return populationMatch[1]
}

async function insertPopulationProposal(city: string, country?: string) {
  const queryCity = country ? `${city} ${country}` : city

  const queries = [
    `${queryCity} population official`,
    `${queryCity} population census`,
    `${queryCity} population Statistics Canada`,
    `${queryCity} metro population`,
  ]

  for (const query of queries) {
    const results = await serpSearch(query, queryCity)

    const usefulResult = results.find((result) => {
      const text = `${result.title ?? ''} ${result.snippet ?? ''} ${result.link ?? ''}`
      return /population|census|statistics|official|city/i.test(text)
    })

    if (!usefulResult) continue

    const population = extractPopulationFromSnippet(
      `${usefulResult.title ?? ''} ${usefulResult.snippet ?? ''}`
    )

    if (!population) continue

const { data: existingPopulationRequests, error: existingPopulationError } =
  await supabase
    .from('pending_requests')
    .select('id')
    .eq('city', city)
    .eq('request_type', 'population')
    .in('status', ['pending', 'approved'])

if (existingPopulationError) {
  throw new Error(existingPopulationError.message)
}

if (existingPopulationRequests && existingPopulationRequests.length > 0) {
  return 0
}

    const { error } = await supabase.from('pending_requests').insert({
      request_type: 'population',
      city,
      population,
      population_source: usefulResult.title ?? 'Population search result',
      source_url: usefulResult.link,
      confidence_score: /statistics|census|official|statcan/i.test(
        `${usefulResult.title ?? ''} ${usefulResult.link ?? ''}`
      )
        ? 0.85
        : 0.65,
      notes:
        'Autonomous scraper population proposal. Verify source before approval.',
      status: 'pending',
    })

    if (error) {
      throw new Error(error.message)
    }

    return 1
  }

  return 0
}

export async function POST(request: Request) {
  let runId: string | null = null

  try {
    const body = await request.json()

    const username = String(body.username ?? '')
    const password = String(body.password ?? '')
    const city = String(body.city ?? '').trim()
    const country = String(body.country ?? '').trim()

    if (!authorized(username, password)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!city) {
      return NextResponse.json({ error: 'City is required' }, { status: 400 })
    }

    runId = await createScraperRun(city)

    const queryCity = country ? `${city}, ${country}` : city

    const queries = [
      `"egg fried rice" "${queryCity}" menu price`,
      `"plain egg fried rice" "${queryCity}" restaurant`,
      `"fried rice with egg" "${queryCity}" menu`,
      `site:menupix.com "egg fried rice" "${city}"`,
      `site:skipthedishes.com "egg fried rice" "${city}"`,
      `site:ubereats.com "egg fried rice" "${city}"`,
    ]

    const searchResults: SearchResult[] = []

    for (const query of queries) {
      const results = await serpSearch(query, queryCity)
      searchResults.push(...results)
    }

    const uniqueResults = Array.from(
      new Map(
        searchResults
          .filter((result) => result.link)
          .filter((result) => !isBadUrl(result.link as string))
          .map((result) => [result.link as string, result])
      ).values()
    ).slice(0, 18)

    const candidates: RestaurantCandidate[] = []

    for (const result of uniqueResults) {
      if (!result.link) continue

      const domainHint = MENU_HINT_DOMAINS.some((hint) =>
        result.link!.toLowerCase().includes(hint)
      )

      const resultText = `${result.title ?? ''} ${result.snippet ?? ''}`

      if (
        !domainHint &&
        !/egg fried rice|fried rice with egg|menu|price/i.test(resultText)
      ) {
        continue
      }

      const pageText = await fetchPageText(result.link)

      if (!pageText) continue

      const extracted = extractCandidatesFromText({
        city,
        country,
        pageText,
        sourceUrl: result.link,
        searchTitle: result.title,
      })

      for (const candidate of extracted) {
        if (!isDuplicateCandidate(candidate, candidates)) {
          candidates.push(candidate)
        }
      }

      if (candidates.length >= 8) break
    }

    const finalCandidates = candidates
      .sort((a, b) => b.confidence_score - a.confidence_score)
      .slice(0, 8)

    const restaurantCount = await insertRestaurantProposals(finalCandidates)
    const populationCount = await insertPopulationProposal(city, country)

    await finishScraperRun(
      runId,
      'completed',
      restaurantCount + populationCount,
      `Found ${restaurantCount} restaurant proposals and ${populationCount} population proposals.`
    )

    return NextResponse.json({
      success: true,
      city,
      country,
      local_currency: currencyForCountry(country),
      restaurant_proposals: restaurantCount,
      population_proposals: populationCount,
      candidates: finalCandidates,
    })
    
  } catch (error) {
    if (runId) {
      await finishScraperRun(
        runId,
        'failed',
        0,
        error instanceof Error ? error.message : 'Unknown error'
      )
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Scrape failed' },
      { status: 500 }
    )
  }
}