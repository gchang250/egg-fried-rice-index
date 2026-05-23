import { NextResponse } from 'next/server'
import { scrapeCity } from '@/app/api/scrape-city/route'

// Temporary diagnostic endpoint — remove after debugging
// Usage: GET /api/debug-scrape?password=...&city=Vancouver&country=Canada
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)

  if (searchParams.get('password') !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const city = searchParams.get('city') ?? 'Vancouver'
  const country = searchParams.get('country') ?? 'Canada'

  const apiKey = process.env.SERPAPI_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'No SERPAPI_API_KEY' })

  // Run one raw SerpAPI query and return everything
  const q = `"fried rice" price menu ${city} restaurant`
  const params = new URLSearchParams({ engine: 'google', q, api_key: apiKey, num: '8', hl: 'en', gl: 'ca' })
  const serpRes = await fetch(`https://serpapi.com/search.json?${params}`, { cache: 'no-store' })
  const serpJson = await serpRes.json()

  const organic = (serpJson.organic_results ?? []).map((r: { title?: string; link?: string; snippet?: string }) => ({
    title: r.title,
    url: r.link,
    snippet: r.snippet,
  }))

  // Also run the full scrape so we can see proposals_inserted + errors
  const result = await scrapeCity(city, country)

  return NextResponse.json({
    serpapi_status: serpRes.status,
    serpapi_error: serpJson.error ?? null,
    organic_count: organic.length,
    organic,
    scrape_result: result,
  })
}
