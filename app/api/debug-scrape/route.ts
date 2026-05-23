import { NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

export const maxDuration = 60

// Diagnostic endpoint — shows raw SerpAPI results and Gemini snippet extraction
// GET /api/debug-scrape?password=...&city=Vancouver&country=Canada
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)

  if (searchParams.get('password') !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const city = searchParams.get('city') ?? 'Vancouver'
  const country = searchParams.get('country') ?? 'Canada'
  const apiKey = process.env.SERPAPI_API_KEY

  if (!apiKey) return NextResponse.json({ error: 'No SERPAPI_API_KEY' })
  if (!process.env.GOOGLE_AI_API_KEY) return NextResponse.json({ error: 'No GOOGLE_AI_API_KEY' })

  // Single SerpAPI query
  const q = `"fried rice" price menu ${city} restaurant`
  const params = new URLSearchParams({ engine: 'google', q, api_key: apiKey, num: '8', hl: 'en', gl: 'ca' })
  const serpRes = await fetch(`https://serpapi.com/search.json?${params}`, { cache: 'no-store' })
  const serpJson = await serpRes.json()

  if (serpJson.error) {
    return NextResponse.json({ serpapi_error: serpJson.error, organic: [] })
  }

  const organic: Array<{ title: string; url: string; snippet: string }> =
    (serpJson.organic_results ?? []).map((r: { title?: string; link?: string; snippet?: string }) => ({
      title: r.title ?? '',
      url: r.link ?? '',
      snippet: r.snippet ?? '',
    }))

  // Build snippet text and run Gemini extraction
  const snippetText = organic
    .filter((r) => r.snippet.length > 20)
    .map((r) => `[${r.title}]\n${r.snippet}`)
    .join('\n\n')

  let geminiResult: string | null = null
  let geminiParsed: unknown = null
  try {
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!)
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
    const prompt = `Extract fried rice dish prices from these search snippets for ${city}, ${country}.
Return a JSON array. Each object: { "dish_name": string, "local_price": number, "dish_category": string }
If no prices found, return [].

${snippetText.slice(0, 3000)}`
    const res = await model.generateContent(prompt)
    geminiResult = res.response.text()
    const match = geminiResult.match(/\[[\s\S]*\]/)
    if (match) geminiParsed = JSON.parse(match[0])
  } catch (e) {
    geminiResult = String(e)
  }

  return NextResponse.json({
    query: q,
    organic_count: organic.length,
    organic,
    snippet_text_sent_to_gemini: snippetText.slice(0, 2000),
    gemini_raw_response: geminiResult,
    gemini_parsed: geminiParsed,
  })
}
