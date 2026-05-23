import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase-admin'
import { scrapeCity } from '@/app/api/scrape-city/route'

// Vercel Cron Jobs call this route as a GET request.
// The Authorization header is set to: Bearer ${CRON_SECRET}
// Configure CRON_SECRET in your Vercel project environment variables.

export const dynamic = 'force-dynamic'
export const maxDuration = 300 // 5-minute cap — upgrade to Pro for longer

type CityRecord = {
  city: string
  country: string | null
}

export async function GET(request: Request) {
  // Auth: accept either CRON_SECRET (Vercel cron header) or ADMIN_PASSWORD (manual trigger)
  const authHeader = request.headers.get('authorization') ?? ''
  const token = authHeader.replace(/^Bearer\s+/i, '').trim()

  const validCronSecret = process.env.CRON_SECRET && token === process.env.CRON_SECRET
  const validAdminPassword = token === process.env.ADMIN_PASSWORD

  if (!validCronSecret && !validAdminPassword) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!process.env.GOOGLE_AI_API_KEY) {
    return NextResponse.json({ error: 'GOOGLE_AI_API_KEY is not configured' }, { status: 500 })
  }

  // Fetch all cities that have a known country
  const { data: cities, error } = await supabase
    .from('cities')
    .select('city, country')
    .not('country', 'is', null)
    .order('city')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const cityList = (cities ?? []) as CityRecord[]
  const results: Array<{
    city: string
    proposals_inserted: number
    pages_scraped: number
    dishes_found: number
    error?: string
  }> = []

  for (const { city, country } of cityList) {
    if (!country) continue

    try {
      const result = await scrapeCity(city, country)
      results.push({
        city,
        proposals_inserted: result.proposals_inserted,
        pages_scraped: result.pages_scraped,
        dishes_found: result.dishes_found,
      })
    } catch (err) {
      results.push({
        city,
        proposals_inserted: 0,
        pages_scraped: 0,
        dishes_found: 0,
        error: err instanceof Error ? err.message : String(err),
      })
    }

    // Pause between cities to avoid rate limits
    await new Promise((r) => setTimeout(r, 1500))
  }

  const totalProposals = results.reduce((sum, r) => sum + r.proposals_inserted, 0)
  const totalErrors = results.filter((r) => r.error).length

  return NextResponse.json({
    success: true,
    cities_scraped: results.length,
    total_proposals_inserted: totalProposals,
    errors: totalErrors,
    results,
  })
}
