import { NextResponse } from 'next/server'
import Groq from 'groq-sdk'

export const maxDuration = 60

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)

  if (searchParams.get('password') !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const city = searchParams.get('city') ?? 'Vancouver'
  const country = searchParams.get('country') ?? 'Canada'
  const apiKey = process.env.SERPAPI_API_KEY

  if (!apiKey) return NextResponse.json({ error: 'No SERPAPI_API_KEY' })
  if (!process.env.GROQ_API_KEY) return NextResponse.json({ error: 'No GROQ_API_KEY' })

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

  const snippetText = organic
    .filter((r) => r.snippet.length > 20)
    .map((r) => `[${r.title}]\n${r.snippet}`)
    .join('\n\n')

  let groqResult: string | null = null
  let groqParsed: unknown = null
  try {
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })
    const completion = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [{
        role: 'user',
        content: `Extract fried rice dish prices from these search snippets for ${city}, ${country}.
Return a JSON array. Each object: { "dish_name": string, "local_price": number, "dish_category": string }
If no prices found, return [].

${snippetText.slice(0, 3000)}`
      }],
      temperature: 0.1,
      max_tokens: 1024,
    })
    groqResult = completion.choices[0]?.message?.content ?? ''
    const match = groqResult.match(/\[[\s\S]*\]/)
    if (match) {
      let cleaned = match[0]
      cleaned = cleaned.replace(/```(?:json)?\s*/gi, '').replace(/```/g, '')
      cleaned = cleaned.replace(/'([^']+)'(\s*:)/g, '"$1"$2')
      cleaned = cleaned.replace(/:\s*'([^']*)'/g, ': "$1"')
      cleaned = cleaned.replace(/,(\s*[}\]])/g, '$1')
      groqParsed = JSON.parse(cleaned)
    }
  } catch (e) {
    groqResult = String(e)
  }

  return NextResponse.json({
    query: q,
    organic_count: organic.length,
    organic,
    snippet_text_sent_to_groq: snippetText.slice(0, 2000),
    groq_raw_response: groqResult,
    groq_parsed: groqParsed,
  })
}
