import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const { username, password, requestId, decision } = body

    if (
      username !== process.env.ADMIN_USERNAME ||
      password !== process.env.ADMIN_PASSWORD
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!requestId || !['approved', 'denied'].includes(decision)) {
      return NextResponse.json({ error: 'Invalid review request' }, { status: 400 })
    }

    const { data: pendingRequest, error: fetchError } = await supabase
      .from('pending_requests')
      .select('*')
      .eq('id', requestId)
      .single()

    if (fetchError || !pendingRequest) {
      return NextResponse.json({ error: 'Pending request not found' }, { status: 404 })
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

      return NextResponse.json({ success: true })
    }

    if (pendingRequest.request_type === 'restaurant') {
      const { error: insertError } = await supabase.from('restaurants').insert({
        city: pendingRequest.city,
        restaurant_name: pendingRequest.restaurant_name,
        dish_name: pendingRequest.dish_name,
        tier: pendingRequest.tier,
        price_cad: pendingRequest.price_cad,
        source: pendingRequest.source,
        source_url: pendingRequest.source_url,
        confidence_score: pendingRequest.confidence_score,
        approved: true,
        active: true,
        scraped_at: pendingRequest.created_at,
        notes: pendingRequest.notes,
      })

      if (insertError) {
        return NextResponse.json({ error: insertError.message }, { status: 500 })
      }

      const { data: restaurants, error: restaurantError } = await supabase
        .from('restaurants')
        .select('price_cad')
        .eq('city', pendingRequest.city)
        .eq('approved', true)
        .eq('active', true)

      if (restaurantError) {
        return NextResponse.json({ error: restaurantError.message }, { status: 500 })
      }

      const prices =
        restaurants
          ?.map((row) => Number(row.price_cad))
          .filter((price) => Number.isFinite(price)) ?? []

      if (prices.length > 0) {
        const average =
          prices.reduce((sum, price) => sum + price, 0) / prices.length

        const { error: updateCityError } = await supabase
          .from('cities')
          .update({
            price_cad: Number(average.toFixed(2)),
            price_source: `Restaurant average from ${prices.length} approved active entries`,
            price_updated_at: new Date().toISOString(),
          })
          .eq('city', pendingRequest.city)

        if (updateCityError) {
          return NextResponse.json({ error: updateCityError.message }, { status: 500 })
        }
      }
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

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Invalid request' },
      { status: 400 }
    )
  }
}