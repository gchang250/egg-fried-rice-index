import { NextResponse } from 'next/server'

// Currencies shown in the UI — used as fallback and to filter the live response
const FALLBACK: Record<string, number> = {
  CAD: 1,
  USD: 0.73,
  EUR: 0.68,
  CHF: 0.66,
  GBP: 0.58,
  JPY: 107.5,
  CNY: 5.3,
  AUD: 1.13,
  HKD: 5.72,
  SGD: 0.99,
  SAR: 2.74,
  PHP: 41.2,
  MYR: 3.18,
  MXN: 14.6,
  ARS: 720.0,
  KRW: 1001.0,
  INR: 60.8,
  AED: 2.68,
}

// Revalidate once per day at the Next.js cache layer
export const revalidate = 86400

export async function GET() {
  try {
    // Rates are X units of each currency per 1 CAD — matches what the UI needs
    const res = await fetch('https://open.er-api.com/v6/latest/CAD', {
      next: { revalidate: 86400 },
    })
    if (!res.ok) return NextResponse.json(FALLBACK)

    const json = await res.json()
    if (json.result !== 'success' || !json.rates) return NextResponse.json(FALLBACK)

    const live: Record<string, number> = { CAD: 1 }
    for (const code of Object.keys(FALLBACK)) {
      if (code === 'CAD') continue
      const rate = json.rates[code]
      if (rate && rate > 0) live[code] = rate
      else live[code] = FALLBACK[code]
    }

    return NextResponse.json(live)
  } catch {
    return NextResponse.json(FALLBACK)
  }
}
