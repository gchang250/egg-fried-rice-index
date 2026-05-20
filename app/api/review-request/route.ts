import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

function isValidNumber(value: unknown) {
  const number = Number(value)
  return Number.isFinite(number)
}

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

  const prices =
    restaurants
      ?.map((row) => Number(row.price_cad))
      .filter((price) => Number.isFinite(price) && price > 0) ?? []

  if (prices.length === 0) {
    throw new Error(`No valid approved prices found for ${city}.`)
  }

  const confidenceScores =
    restaurants
      ?.map((row) => Number(row.confidence_score))
      .filter((score) => Number.isFinite(score) && score >= 0 && score <= 1) ?? []

  const averagePrice =
    prices.reduce((sum, price) => sum + price, 0) / prices.length

  const averageConfidence =
    confidenceScores.length > 0
      ? confidenceScores.reduce((sum, score) => sum + score, 0) /
        confidenceScores.length
      : null

  const { error: updateCityError } = await supabase
    .from('cities')
    .update({
      price_cad: Number(averagePrice.toFixed(2)),
      price_source: `Restaurant average from ${prices.length} approved active entries`,
      price_updated_at: new Date().toISOString(),
      confidence_score:
        averageConfidence === null ? null : Number(averageConfidence.toFixed(2)),
    })
    .eq('city', city)

  if (updateCityError) {
    throw new Error(updateCityError.message)
  }

  return {
    average_price_cad: Number(averagePrice.toFixed(2)),
    average_confidence:
      averageConfidence === null ? null : Number(averageConfidence.toFixed(2)),
    restaurant_count: prices.length,
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const username = String(body.username ?? '')
    const password = String(body.password ?? '')
    const requestId = String(body.requestId ?? '')
    const decision = String(body.decision ?? '')

    if (
      username !== process.env.ADMIN_USERNAME ||
      password !== process.env.ADMIN_PASSWORD
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!requestId || !['approved', 'denied'].includes(decision)) {
      return NextResponse.json(
        { error: 'Invalid review request' },
        { status: 400 }
      )
    }

    const { data: pendingRequest, error: fetchError } = await supabase
      .from('pending_requests')
      .select('*')
      .eq('id', requestId)
      .single()

    if (fetchError || !pendingRequest) {
      return NextResponse.json(
        { error: 'Pending request not found' },
        { status: 404 }
      )
    }

    if (decision === 'denied') {
      const { error: denyError } = await supabase
        .from('pending_requests')
        .update({
          status: 'denied',
          reviewed_at: new Date().toISOString(),
          reviewed_by: username,
        })
        .eq('id', requestId)

      if (denyError) {
        return NextResponse.json({ error: denyError.message }, { status: 500 })
      }

      return NextResponse.json({ success: true, decision: 'denied' })
    }

    if (pendingRequest.request_type === 'restaurant') {
      if (!isValidNumber(pendingRequest.price_cad)) {
        return NextResponse.json(
          { error: 'Cannot approve restaurant request because price_cad is missing or invalid.' },
          { status: 400 }
        )
      }

      const confidenceScore = isValidNumber(pendingRequest.confidence_score)
        ? Number(pendingRequest.confidence_score)
        : 0.5

      const { error: insertError } = await supabase.from('restaurants').insert({
        city: pendingRequest.city,
        restaurant_name: pendingRequest.restaurant_name || 'Unknown restaurant',
        dish_name: pendingRequest.dish_name || 'Egg Fried Rice',
        tier: pendingRequest.tier || 'mid_tier',
        price_cad: Number(pendingRequest.price_cad),
        source: pendingRequest.source || 'Pending request approval',
        source_url: pendingRequest.source_url || null,
        confidence_score: confidenceScore,
        approved: true,
        active: true,
        scraped_at: pendingRequest.created_at,
        notes: pendingRequest.notes || null,
      })

      if (insertError) {
        return NextResponse.json({ error: insertError.message }, { status: 500 })
      }

      const recalculated = await recalculateCity(pendingRequest.city)

      const { error: approveError } = await supabase
        .from('pending_requests')
        .update({
          status: 'approved',
          reviewed_at: new Date().toISOString(),
          reviewed_by: username,
        })
        .eq('id', requestId)

      if (approveError) {
        return NextResponse.json({ error: approveError.message }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        decision: 'approved',
        request_type: 'restaurant',
        city: pendingRequest.city,
        ...recalculated,
      })
    }

    if (pendingRequest.request_type === 'population') {
      const { error: populationError } = await supabase
        .from('cities')
        .update({
          population: pendingRequest.population,
          population_source: pendingRequest.population_source,
          population_updated_at: new Date().toISOString(),
        })
        .eq('city', pendingRequest.city)

      if (populationError) {
        return NextResponse.json({ error: populationError.message }, { status: 500 })
      }

      const { error: approveError } = await supabase
        .from('pending_requests')
        .update({
          status: 'approved',
          reviewed_at: new Date().toISOString(),
          reviewed_by: username,
        })
        .eq('id', requestId)

      if (approveError) {
        return NextResponse.json({ error: approveError.message }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        decision: 'approved',
        request_type: 'population',
        city: pendingRequest.city,
      })
    }

    return NextResponse.json(
      { error: `Unknown request type: ${pendingRequest.request_type}` },
      { status: 400 }
    )
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Invalid request' },
      { status: 400 }
    )
  }
}