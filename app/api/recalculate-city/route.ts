import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

async function recalculateCity(city: string) {
  const { data: restaurants, error: restaurantError } = await supabase
    .from('restaurants')
    .select('price_cad, confidence_score')
    .eq('city', city)
    .eq('approved', true)
    .eq('active', true)

  if (restaurantError) {
    throw new Error(restaurantError.message)
  }

  if (!restaurants || restaurants.length === 0) {
    throw new Error(`No approved restaurant rows found for ${city}.`)
  }

  const prices = restaurants
    .map((restaurant) => Number(restaurant.price_cad))
    .filter((price) => Number.isFinite(price) && price > 0)

  if (prices.length === 0) {
    throw new Error(`No valid prices found for ${city}.`)
  }

  const confidenceScores = restaurants
    .map((restaurant) => Number(restaurant.confidence_score))
    .filter((score) => Number.isFinite(score) && score >= 0 && score <= 1)

  const averagePrice =
    prices.reduce((sum, price) => sum + price, 0) / prices.length

  const averageConfidence =
    confidenceScores.length > 0
      ? confidenceScores.reduce((sum, score) => sum + score, 0) /
        confidenceScores.length
      : null

  const roundedAveragePrice = Number(averagePrice.toFixed(2))
  const roundedAverageConfidence =
    averageConfidence === null ? null : Number(averageConfidence.toFixed(2))

  const { data: updatedCity, error: updateError } = await supabase
    .from('cities')
    .update({
      price_cad: roundedAveragePrice,
      price_source: `Restaurant average from ${prices.length} approved active entries`,
      price_updated_at: new Date().toISOString(),
      confidence_score: roundedAverageConfidence,
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
    average_price_cad: roundedAveragePrice,
    average_confidence: roundedAverageConfidence,
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