import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const city = searchParams.get('city')

  if (!city) {
    return NextResponse.json(
      {
        success: false,
        error: 'Missing city. Use /api/recalculate-city?city=Toronto',
      },
      { status: 400 }
    )
  }

  const { data: restaurants, error: restaurantError } = await supabase
    .from('restaurants')
    .select('price_cad, confidence_score')
    .eq('city', city)
    .eq('approved', true)
    .eq('active', true)
  
  if (restaurantError) {
    return NextResponse.json(
      {
        success: false,
        error: restaurantError.message,
      },
      { status: 500 }
    )
  }

  if (!restaurants || restaurants.length === 0) {
    return NextResponse.json(
      {
        success: false,
        error: `No approved restaurant rows found for ${city}.`,
      },
      { status: 404 }
    )
  }

  const prices = restaurants
    .map((restaurant) => Number(restaurant.price_cad))
    .filter((price) => !Number.isNaN(price))

  if (prices.length === 0) {
    return NextResponse.json(
      {
        success: false,
        error: `No valid prices found for ${city}.`,
      },
      { status: 400 }
    )
  }

  const averagePrice =
    prices.reduce((sum, price) => sum + price, 0) / prices.length

  const confidenceScores = restaurants
    .map((restaurant) => Number(restaurant.confidence_score))
    .filter((score) => !Number.isNaN(score))

  const averageConfidence =
    confidenceScores.length > 0
      ? confidenceScores.reduce((sum, score) => sum + score, 0) /
        confidenceScores.length
      : null

  const roundedAveragePrice = Number(averagePrice.toFixed(2))

  const { data: updatedCity, error: updateError } = await supabase
    .from('cities')
    .update({
      price_cad: roundedAveragePrice,
      price_source: `Restaurant average from ${prices.length} approved active entries`,
      price_updated_at: new Date().toISOString(),
      confidence_score: averageConfidence,
    })
    .eq('city', city)
    .select()

  if (updateError) {
    return NextResponse.json(
      {
        success: false,
        error: updateError.message,
      },
      { status: 500 }
    )
  }

  if (!updatedCity || updatedCity.length === 0) {
    return NextResponse.json(
      {
        success: false,
        error: `No city found named ${city}. Check spelling and capitalization.`,
      },
      { status: 404 }
    )
  }

  return NextResponse.json({
    success: true,
    message: `${city} recalculated successfully`,
    city,
    restaurant_count: prices.length,
    average_price_cad: roundedAveragePrice,
    average_confidence: averageConfidence,
    updated_city: updatedCity,
  })
}