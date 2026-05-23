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
  country: string | null
  restaurant_name: string
  dish_name: string
  dish_category: string
  included_in_baseline: boolean
  tier: string
  price_cad: number
  local_price: number
  local_currency: string
  exchange_rate_used: number
  source: string
  source_type: string
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

const FRIED_RICE_TERMS = [
  'fried rice',
  'egg fried rice',
  'vegetable fried rice',
  'veggie fried rice',
  'chicken fried rice',
  'beef fried rice',
  'pork fried rice',
  'shrimp fried rice',
  'seafood fried rice',
  'house fried rice',
  'special fried rice',
  'combination fried rice',
  'yang chow fried rice',
  'yangzhou fried rice',
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

  if (!normalized) throw new Error('Country is required.')
  if (normalized.includes('canada')) return 'CAD'
  if (
    normalized.includes('united states') ||
    normalized === 'us' ||
    normalized === 'usa'
  ) return 'USD'
  if (
    normalized.includes('united kingdom') ||
    normalized === 'uk' ||
    normalized.includes('england') ||
    normalized.includes('scotland') ||
    normalized.includes('wales')
  ) return 'GBP'
  if (normalized.includes('singapore')) return 'SGD'
  if (normalized.includes('hong kong')) return 'HKD'
  if (normalized.includes('australia')) return 'AUD'
  if (normalized.includes('japan')) return 'JPY'
  if (
    normalized.includes('france') ||
    normalized.includes('germany') ||
    normalized.includes('italy') ||
    normalized.includes('spain') ||
    normalized.includes('netherlands') ||
    normalized.includes('ireland') ||
    normalized.includes('eurozone')
  ) return 'EUR'

  throw new Error(`Unsupported country/currency: "${country}".`)
}

function convertToCad(localPrice: number, localCurrency: string) {
  const rate = CAD_RATES[localCurrency] ?? 1
  return Number((localPrice * rate).toFixed(2))
}

function classifyDish(dishName: string) {
  const lower = dishName.toLowerCase()

  if (containsAny(lower, ['lobster', 'crab', 'scallop', 'truffle', 'wagyu'])) {
    return { dish_category: 'premium', included_in_baseline: false }
  }

  if (containsAny(lower, ['shrimp', 'prawn', 'seafood', 'xo sauce', 'xo fried rice'])) {
    return { dish_category: 'seafood', included_in_baseline: false }
  }

  if (containsAny(lower, ['chicken', 'beef', 'pork', 'ham', 'bacon', 'bbq pork', 'duck'])) {
    return { dish_category: 'meat_based', included_in_baseline: false }
  }

  if (containsAny(lower, ['house', 'special', 'combo', 'combination', 'yang chow', 'yangzhou'])) {
    return { dish_category: 'house_special', included_in_baseline: false }
  }

  if (containsAny(lower, ['vegetable', 'veggie', 'greens'])) {
    return { dish_category: 'vegetable', included_in_baseline: true }
  }

  if (containsAny(lower, ['egg fried rice', 'plain fried rice', 'fried rice with egg'])) {
    return { dish_category: 'basic', included_in_baseline: true }
  }

  return { dish_category: 'unknown', included_in_baseline: false }
}

function looksLikeFriedRice(text: string) {
  return containsAny(text, FRIED_RICE_TERMS)
}

function extractPrice(text: string) {
  const matches = text.match(/\$ ?([0-9]{1,3}(?:\.[0-9]{2})?)/g)
  if (!matches) return null

  const prices = matches
    .map((match) => Number(match.replace('$', '').trim()))
    .filter((price) => Number.isFinite(price))
    .filter((price) => price >= 5 && price <= 80)

  return prices[0] ?? null
}

function guessTier(priceCad: number) {
  if (priceCad <= 12.5) return 'low_tier'
  if (priceCad <= 17.5) return 'mid_tier'
  if (priceCad <= 23) return 'high_end'
  return 'premium'
}

function confidenceFromUrl(url: string, line: string) {
  const lowerUrl = url.toLowerCase()
  let score = 0.55

  if (containsAny(lowerUrl, ['skipthedishes', 'ubereats', 'doordash'])) score = 0.6
  if (containsAny(lowerUrl, ['menupix'])) score = 0.7

  if (
    !containsAny(lowerUrl, ['skipthedishes', 'ubereats', 'doordash', 'menupix']) &&
    containsAny(lowerUrl, ['menu', 'restaurant', 'order'])
  ) score = 0.75

  if (looksLikeFriedRice(line)) score += 0.05

  return Math.min(Number(score.toFixed(2)), 0.85)
}

function sourceTypeFromUrl(url: string) {
  const lower = url.toLowerCase()

  if (containsAny(lower, ['ubereats', 'doordash', 'skipthedishes'])) {
    return 'delivery_app'
  }

  if (containsAny(lower, ['menupix'])) {
    return 'third_party_menu'
  }

  if (containsAny(lower, ['toasttab', 'chownow', 'ritual'])) {
    return 'official_ordering_page'
  }

  if (containsAny(lower, ['menu', 'restaurant', 'order'])) {
    return 'official_menu'
  }

  return 'scraper_result'
}

function guessRestaurantName(title: string | undefined, url: string) {
  if (title) {
    const menuOfMatch = title.match(/Menu of (.*?) in /i)
    if (menuOfMatch?.[1]) return menuOfMatch[1].trim().slice(0, 90)

    const orderFromMatch = title.match(/Order (.*?) Menu/i)
    if (orderFromMatch?.[1]) return orderFromMatch[1].trim().slice(0, 90)

    const cleaned = title
      .replace(/\|.*$/g, '')
      .replace(/\s+-\s+.*$/g, '')
      .replace(/\bmenu\b/gi, '')
      .replace(/\border\b/gi, '')
      .replace(/\bonline\b/gi, '')
      .replace(/\bdelivery\b/gi, '')
      .trim()

    if (cleaned.length > 0) return cleaned.slice(0, 90)
  }

  try {
    const host = new URL(url).hostname.replace('www.', '')
    return host.split('.')[0] || 'Unknown restaurant'
  } catch {
    return 'Unknown restaurant'
  }
}

function isBadUrl(url: string) {
  return BAD_DOMAINS.some((domain) => url.toLowerCase().includes(domain))
}

function isDuplicateCandidate(
  candidate: RestaurantCandidate,
  existing: RestaurantCandidate[]
) {
  return existing.some(
    (item) =>
      item.restaurant_name.toLowerCase() === candidate.restaurant_name.toLowerCase() &&
      item.dish_name.toLowerCase() === candidate.dish_name.toLowerCase()
  )
}

async function serpSearch(query: string, location?: string): Promise<SearchResult[]> {
  const apiKey = process.env.SERPAPI_API_KEY
  if (!apiKey) throw new Error('Missing SERPAPI_API_KEY')

  const params = new URLSearchParams({
    engine: 'google',
    q: query,
    api_key: apiKey,
    num: '10',
    hl: 'en',
    gl: 'ca',
  })

  if (location) params.set('location', location)

  const response = await fetch(`https://serpapi.com/search.json?${params.toString()}`, {
    cache: 'no-store',
  })

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
          'Mozilla/5.0 (compatible; FriedRiceIndexBot/1.0; +https://efr-index.vercel.app)',
      },
      cache: 'no-store',
    })

    if (!response.ok) return null

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

function extractDishName(chunk: string) {
  const match =
    chunk.match(
      /([A-Za-z '&().-]*(?:fried rice)[A-Za-z '&().-]*)/i
    )?.[1] ?? 'Fried Rice'

  return normalizeText(match).slice(0, 90)
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
  const exchangeRateUsed = CAD_RATES[localCurrency] ?? 1
  const candidates: RestaurantCandidate[] = []

  const chunks = pageText
    .split(/\.|•|\n|\r|\||\t|(?<=\$[0-9]{1,3}(?:\.[0-9]{2})?)/g)
    .map(normalizeText)
    .filter(Boolean)

  for (const chunk of chunks) {
    if (!looksLikeFriedRice(chunk)) continue

    const localPrice = extractPrice(chunk)
    if (localPrice === null) continue

    const dishName = extractDishName(chunk)
    const classification = classifyDish(dishName)
    const priceCad = convertToCad(localPrice, localCurrency)

    const candidate: RestaurantCandidate = {
      city,
      country,
      restaurant_name: guessRestaurantName(searchTitle, sourceUrl),
      dish_name: dishName,
      dish_category: classification.dish_category,
      included_in_baseline: classification.included_in_baseline,
      tier: guessTier(priceCad),
      price_cad: priceCad,
      local_price: localPrice,
      local_currency: localCurrency,
      exchange_rate_used: exchangeRateUsed,
      source: searchTitle ?? 'Scraped menu page',
      source_type: sourceTypeFromUrl(sourceUrl),
      source_url: sourceUrl,
      confidence_score: confidenceFromUrl(sourceUrl, chunk),
      notes: `Autonomous scraper candidate. Category: ${classification.dish_category}. Baseline included: ${classification.included_in_baseline ? 'yes' : 'no'}. Local price: ${localCurrency} ${localPrice.toFixed(
        2
      )}. CAD rate used: ${exchangeRateUsed}. Extracted text: "${chunk.slice(0, 220)}"`,
    }

    if (!isDuplicateCandidate(candidate, candidates)) candidates.push(candidate)
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

  if (error) throw new Error(error.message)

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

function sameScraperEntry(
  a: {
    city?: string | null
    restaurant_name?: string | null
    dish_name?: string | null
    source_url?: string | null
  },
  b: {
    city?: string | null
    restaurant_name?: string | null
    dish_name?: string | null
    source_url?: string | null
  }
) {
  const sameCity =
    normalizeForDuplicateCheck(a.city) === normalizeForDuplicateCheck(b.city)

  const sameRestaurant =
    normalizeForDuplicateCheck(a.restaurant_name) ===
    normalizeForDuplicateCheck(b.restaurant_name)

  const sameDish =
    normalizeForDuplicateCheck(a.dish_name) === normalizeForDuplicateCheck(b.dish_name)

  const sameSourceUrl =
    normalizeForDuplicateCheck(a.source_url) !== '' &&
    normalizeForDuplicateCheck(a.source_url) === normalizeForDuplicateCheck(b.source_url)

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

  if (pendingError) throw new Error(pendingError.message)

  const { data: existingRestaurants, error: restaurantError } = await supabase
    .from('restaurants')
    .select('city, restaurant_name, dish_name, source_url')
    .eq('city', city)

  if (restaurantError) throw new Error(restaurantError.message)

  const existingRows = [...(existingPending ?? []), ...(existingRestaurants ?? [])]

  const newCandidates = candidates.filter((candidate) => {
    return !existingRows.some((existing) => sameScraperEntry(candidate, existing))
  })

  if (newCandidates.length === 0) return 0

  const rows = newCandidates.map((candidate) => ({
    request_type: 'restaurant',
    city: candidate.city,
    country: candidate.country,
    restaurant_name: candidate.restaurant_name,
    dish_name: candidate.dish_name,
    dish_category: candidate.dish_category,
    included_in_baseline: candidate.included_in_baseline,
    tier: candidate.tier,
    local_price: candidate.local_price,
    local_currency: candidate.local_currency,
    exchange_rate_used: candidate.exchange_rate_used,
    price_cad: candidate.price_cad,
    source: candidate.source,
    source_type: candidate.source_type,
    source_url: candidate.source_url,
    confidence_score: candidate.confidence_score,
    date_accessed: new Date().toISOString(),
    notes: candidate.notes,
    status: 'pending',
  }))

  const { error } = await supabase.from('pending_requests').insert(rows)
  if (error) throw new Error(error.message)

  return rows.length
}

function extractPopulationFromSnippet(text: string) {
  const normalized = normalizeText(text)

  const populationMatch =
    normalized.match(/population[^0-9]{0,40}([0-9][0-9,]{4,})/i) ??
    normalized.match(/([0-9][0-9,]{4,})\s+(?:people|residents)/i)

  return populationMatch?.[1] ?? null
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

    if (existingPopulationError) throw new Error(existingPopulationError.message)
    if (existingPopulationRequests && existingPopulationRequests.length > 0) return 0

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
      notes: 'Autonomous scraper population proposal. Verify source before approval.',
      status: 'pending',
    })

    if (error) throw new Error(error.message)

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

    if (!country) {
      return NextResponse.json({ error: 'Country is required' }, { status: 400 })
    }

    runId = await createScraperRun(city)

    const queryCity = `${city}, ${country}`

    const queries = [
      `"fried rice" "${queryCity}" menu price`,
      `"egg fried rice" "${queryCity}" menu price`,
      `"vegetable fried rice" "${queryCity}" menu`,
      `"chicken fried rice" "${queryCity}" menu`,
      `"shrimp fried rice" "${queryCity}" menu`,
      `site:menupix.com "fried rice" "${city}"`,
      `site:skipthedishes.com "fried rice" "${city}"`,
      `site:ubereats.com "fried rice" "${city}"`,
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

      if (!domainHint && !/fried rice|menu|price/i.test(resultText)) continue

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
        if (!isDuplicateCandidate(candidate, candidates)) candidates.push(candidate)
      }

      if (candidates.length >= 10) break
    }

    const finalCandidates = candidates
      .sort((a, b) => b.confidence_score - a.confidence_score)
      .slice(0, 10)

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