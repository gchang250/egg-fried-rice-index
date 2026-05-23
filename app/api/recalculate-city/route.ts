import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

type RestaurantRow = {
  price_cad: number | string | null
  confidence_score: number | string | null
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

function getDataQualityLabel(count: number, confidence: number | null) {
  if (count <= 0) return 'No baseline data'
  if (count <= 2) return 'Preliminary'
  if (count <= 4) return 'Limited'

  if (count >= 15 && confidence !== null && confidence >= 0.8) {
    return 'High confidence'
  }

  if (count >= 10 && confidence !== null && confidence >= 0.75) {
    return 'Strong'
  }

  return 'Moderate'
}

async function recalculateCity(city: string) {
  const { data: restaurants, error: restaurantError } = await supabase
    .from('restaurants')
    .select('price_cad, confidence_score')
    .eq('city', city)
    .eq('approved', true)
    .eq('active', true)
    .eq('included_in_baseline', true)

  if (restaurantError) {
    throw new Error(restaurantError.message)
  }

  if (!restaurants || restaurants.length === 0) {
    throw new Error(`No approved baseline restaurant rows found for ${city}.`)
  }

  const prices = (restaurants as RestaurantRow[])
    .map((restaurant) => Number(restaurant.price_cad))
    .filter((price) => Number.isFinite(price) && price > 0)

  if (prices.length === 0) {
    throw new Error(`No valid baseline prices found for ${city}.`)
  }

  const confidenceScores = (restaurants as RestaurantRow[])
    .map((restaurant) => Number(restaurant.confidence_score))
    .filter((score) => Number.isFinite(score) && score >= 0 && score <= 1)

  const medianPrice = roundMoney(median(prices))
  const averagePrice = roundMoney(average(prices))
  const minPrice = roundMoney(Math.min(...prices))
  const maxPrice = roundMoney(Math.max(...prices))
  const stdDev = roundMoney(standardDeviation(prices))
  const averageConfidence = roundScore(average(confidenceScores))
  const dataQualityLabel = getDataQualityLabel(prices.length, averageConfidence)

  const { data: updatedCity, error: updateError } = await supabase
    .from('cities')
    .update({
      price_cad: medianPrice,
      price_source: `Baseline median from ${prices.length} approved baseline fried rice entries`,
      price_updated_at: new Date().toISOString(),
      confidence_score: averageConfidence,
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
    restaurant_count: prices.length,
    baseline_restaurant_count: prices.length,
    median_price_cad: medianPrice,
    average_price_cad: averagePrice,
    min_price_cad: minPrice,
    max_price_cad: maxPrice,
    standard_deviation: stdDev,
    average_confidence: averageConfidence,
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
          error: 'Missing city. Use /api/recalculate-city?city=Toronto',
        },
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