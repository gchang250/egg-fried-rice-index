import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase-admin'

type RestaurantRow = {
  price_cad: number | string | null
  confidence_score: number | string | null
  included_in_baseline: boolean | null
  dish_category: string | null
  tier: string | null
}

function median(values: number[]) {
  if (values.length === 0) return null

  const sorted = [...values].sort((a, b) => a - b)
  const middle = Math.floor(sorted.length / 2)

  if (sorted.length % 2 === 1) {
    return sorted[middle]
  }

  return (sorted[middle - 1] + sorted[middle]) / 2
}

function average(values: number[]) {
  if (values.length === 0) return null
  return values.reduce((sum, value) => sum + value, 0) / values.length
}

function standardDeviation(values: number[]) {
  if (values.length < 2) return 0

  const mean = average(values)
  if (mean === null) return null

  const variance =
    values.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0) /
    (values.length - 1)

  return Math.sqrt(variance)
}

function roundMoney(value: number | null) {
  if (value === null || !Number.isFinite(value)) return null
  return Number(value.toFixed(2))
}

function roundScore(value: number | null) {
  if (value === null || !Number.isFinite(value)) return null
  return Number(value.toFixed(2))
}

function getDataQualityLabel(baselineCount: number, confidence: number | null) {
  if (baselineCount <= 0) return 'No baseline data'
  if (baselineCount <= 2) return 'Preliminary'
  if (baselineCount <= 4) return 'Limited'

  if (baselineCount >= 15 && confidence !== null && confidence >= 0.8) {
    return 'High confidence'
  }

  if (baselineCount >= 10 && confidence !== null && confidence >= 0.75) {
    return 'Strong'
  }

  return 'Moderate'
}

function isPremiumEntry(row: RestaurantRow) {
  return (
    row.dish_category === 'premium' ||
    row.tier === 'premium' ||
    row.tier === 'fine_dining' ||
    row.tier === 'high_end'
  )
}

function validPrice(value: number | string | null) {
  const price = Number(value)
  return Number.isFinite(price) && price > 0 ? price : null
}

function validConfidence(value: number | string | null) {
  const score = Number(value)
  return Number.isFinite(score) && score >= 0 && score <= 1 ? score : null
}

async function recalculateCity(city: string) {
  const { data: restaurants, error: restaurantError } = await supabase
    .from('restaurants')
    .select(
      `
      price_cad,
      confidence_score,
      included_in_baseline,
      dish_category,
      tier
    `
    )
    .eq('city', city)
    .eq('approved', true)
    .eq('active', true)

  if (restaurantError) {
    throw new Error(restaurantError.message)
  }

  const rows = (restaurants ?? []) as RestaurantRow[]

  const baselineRows = rows.filter((row) => row.included_in_baseline === true)
  const premiumRows = rows.filter(isPremiumEntry)

  const baselinePrices = baselineRows
    .map((row) => validPrice(row.price_cad))
    .filter((price): price is number => price !== null)

  const marketPrices = rows
    .map((row) => validPrice(row.price_cad))
    .filter((price): price is number => price !== null)

  // No data — zero out all stats
  if (rows.length === 0 || baselinePrices.length === 0) {
    const now = new Date().toISOString()
    await supabase
      .from('cities')
      .update({
        price_cad: null,
        baseline_median_cad: null,
        market_average_cad: null,
        market_min_cad: null,
        market_max_cad: null,
        market_entry_count: 0,
        baseline_entry_count: 0,
        premium_entry_count: 0,
        data_quality_label: 'No baseline data',
        price_source: null,
        price_updated_at: now,
        confidence_score: null,
      })
      .eq('city', city)
    return {
      city,
      restaurant_count: 0,
      market_entry_count: 0,
      baseline_entry_count: 0,
      premium_entry_count: 0,
      median_price_cad: null,
      baseline_median_cad: null,
      baseline_average_cad: null,
      baseline_min_cad: null,
      baseline_max_cad: null,
      standard_deviation: null,
      market_average_cad: null,
      market_min_cad: null,
      market_max_cad: null,
      average_confidence: null,
      market_average_confidence: null,
      data_quality_label: 'No baseline data',
      updated_city: [],
    }
  }

  const baselineConfidenceScores = baselineRows
    .map((row) => validConfidence(row.confidence_score))
    .filter((score): score is number => score !== null)

  const marketConfidenceScores = rows
    .map((row) => validConfidence(row.confidence_score))
    .filter((score): score is number => score !== null)

  const baselineMedian = roundMoney(median(baselinePrices))
  const baselineAverage = roundMoney(average(baselinePrices))
  const baselineMin = roundMoney(Math.min(...baselinePrices))
  const baselineMax = roundMoney(Math.max(...baselinePrices))
  const baselineStdDev = roundMoney(standardDeviation(baselinePrices))

  const marketAverage = roundMoney(average(marketPrices))
  const marketMin =
    marketPrices.length > 0 ? roundMoney(Math.min(...marketPrices)) : null
  const marketMax =
    marketPrices.length > 0 ? roundMoney(Math.max(...marketPrices)) : null

  const baselineAverageConfidence = roundScore(average(baselineConfidenceScores))
  const marketAverageConfidence = roundScore(average(marketConfidenceScores))

  const dataQualityLabel = getDataQualityLabel(
    baselinePrices.length,
    baselineAverageConfidence
  )

  const now = new Date().toISOString()

  const { data: updatedCity, error: updateError } = await supabase
    .from('cities')
    .update({
      price_cad: baselineMedian,
      baseline_median_cad: baselineMedian,
      market_average_cad: marketAverage,
      market_min_cad: marketMin,
      market_max_cad: marketMax,
      market_entry_count: marketPrices.length,
      baseline_entry_count: baselinePrices.length,
      premium_entry_count: premiumRows.length,
      data_quality_label: dataQualityLabel,
      price_source: `Baseline median from ${baselinePrices.length} approved baseline fried rice entries`,
      price_updated_at: now,
      confidence_score: baselineAverageConfidence,
    })
    .eq('city', city)
    .select()

  if (updateError) {
    throw new Error(updateError.message)
  }

  if (!updatedCity || updatedCity.length === 0) {
    throw new Error(`No city found named ${city}. Check spelling and capitalization.`)
  }

  return {
    city,
    restaurant_count: marketPrices.length,
    market_entry_count: marketPrices.length,
    baseline_entry_count: baselinePrices.length,
    premium_entry_count: premiumRows.length,

    median_price_cad: baselineMedian,
    baseline_median_cad: baselineMedian,
    baseline_average_cad: baselineAverage,
    baseline_min_cad: baselineMin,
    baseline_max_cad: baselineMax,
    standard_deviation: baselineStdDev,

    market_average_cad: marketAverage,
    market_min_cad: marketMin,
    market_max_cad: marketMax,

    average_confidence: baselineAverageConfidence,
    market_average_confidence: marketAverageConfidence,
    data_quality_label: dataQualityLabel,

    updated_city: updatedCity,
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const password = searchParams.get('password')
    const city = searchParams.get('city')

    if (password !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    if (!city) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing city. Use /api/recalculate-city?city=Toronto or ?city=all',
        },
        { status: 400 }
      )
    }

    if (city === 'all') {
      const { data: cityRows, error: cityError } = await supabase
        .from('cities')
        .select('city')
        .order('city')
      if (cityError) {
        return NextResponse.json({ success: false, error: cityError.message }, { status: 500 })
      }
      const results = []
      for (const row of cityRows ?? []) {
        try {
          const result = await recalculateCity(row.city)
          results.push({ city: row.city, ok: true, baseline_entry_count: result.baseline_entry_count })
        } catch (err) {
          results.push({ city: row.city, ok: false, error: err instanceof Error ? err.message : String(err) })
        }
      }
      return NextResponse.json({ success: true, results })
    }

    const result = await recalculateCity(city)

    return NextResponse.json({
      success: true,
      message: `${city} recalculated successfully`,
      ...result,
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Recalculation failed',
      },
      { status: 400 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const password = String(body.password ?? '')
    const city = String(body.city ?? '').trim()

    if (password !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    if (!city) {
      return NextResponse.json(
        { success: false, error: 'Missing city.' },
        { status: 400 }
      )
    }

    const result = await recalculateCity(city)

    return NextResponse.json({
      success: true,
      message: `${city} recalculated successfully`,
      ...result,
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Recalculation failed',
      },
      { status: 400 }
    )
  }
}