import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

function isValidNumber(value: unknown) {
  return Number.isFinite(Number(value))
}

function median(values: number[]) {
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 1
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2
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
  if (count >= 15 && confidence !== null && confidence >= 0.8) return 'High confidence'
  if (count >= 10 && confidence !== null && confidence >= 0.75) return 'Strong'
  return 'Moderate'
}

async function recalculateCity(city: string) {
  const { data: restaurants, error } = await supabase
    .from('restaurants')
    .select('price_cad, confidence_score')
    .eq('city', city)
    .eq('approved', true)
    .eq('active', true)
    .eq('included_in_baseline', true)

  if (error) throw new Error(error.message)

  const prices =
    restaurants
      ?.map((row) => Number(row.price_cad))
      .filter((price) => Number.isFinite(price) && price > 0) ?? []

  if (prices.length === 0) {
    throw new Error(`No valid approved baseline prices found for ${city}.`)
  }

  const confidenceScores =
    restaurants
      ?.map((row) => Number(row.confidence_score))
      .filter((score) => Number.isFinite(score) && score >= 0 && score <= 1) ?? []

  const medianPrice = roundMoney(median(prices))
  const averagePrice = roundMoney(average(prices))
  const minPrice = roundMoney(Math.min(...prices))
  const maxPrice = roundMoney(Math.max(...prices))
  const stdDev = roundMoney(standardDeviation(prices))
  const averageConfidence = roundScore(average(confidenceScores))
  const dataQualityLabel = getDataQualityLabel(prices.length, averageConfidence)

  const { error: updateError } = await supabase
    .from('cities')
    .update({
      price_cad: medianPrice,
      price_source: `Baseline median from ${prices.length} approved baseline fried rice entries`,
      price_updated_at: new Date().toISOString(),
      confidence_score: averageConfidence,
    })
    .eq('city', city)

  if (updateError) throw new Error(updateError.message)

  return {
    restaurant_count: prices.length,
    baseline_restaurant_count: prices.length,
    median_price_cad: medianPrice,
    average_price_cad: averagePrice,
    min_price_cad: minPrice,
    max_price_cad: maxPrice,
    standard_deviation: stdDev,
    average_confidence: averageConfidence,
    data_quality_label: dataQualityLabel,
  }
}

function defaultDishCategory(value: unknown) {
  const category = String(value ?? '').trim()
  return category || 'unknown'
}

function defaultBaselineInclusion(value: unknown, dishCategory: string) {
  if (typeof value === 'boolean') return value
  if (value === 'true') return true
  if (value === 'false') return false
  return dishCategory === 'basic' || dishCategory === 'vegetable'
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const username = String(body.username ?? '')
    const password = String(body.password ?? '')
    const requestId = String(body.requestId ?? '')
    const decision = String(body.decision ?? '')
    const overridePriceCad = body.override_price_cad !== undefined
      ? Number(body.override_price_cad)
      : null

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

      return NextResponse.json({ success: true, decision: 'denied' })
    }

    if (pendingRequest.request_type === 'restaurant') {
      const resolvedPriceCad = overridePriceCad !== null && Number.isFinite(overridePriceCad) && overridePriceCad > 0
        ? overridePriceCad
        : Number(pendingRequest.price_cad)

      if (!isValidNumber(resolvedPriceCad) || resolvedPriceCad <= 0) {
        return NextResponse.json(
          { error: 'Cannot approve restaurant request because price_cad is missing or invalid.' },
          { status: 400 }
        )
      }

      const priceCad = resolvedPriceCad
      const dishCategory = defaultDishCategory(pendingRequest.dish_category)
      const includedInBaseline = defaultBaselineInclusion(
        pendingRequest.included_in_baseline,
        dishCategory
      )

      const confidenceScore = isValidNumber(pendingRequest.confidence_score)
        ? Number(pendingRequest.confidence_score)
        : 0.5

      const localPrice = isValidNumber(pendingRequest.local_price)
        ? Number(pendingRequest.local_price)
        : priceCad

      const exchangeRateUsed = isValidNumber(pendingRequest.exchange_rate_used)
        ? Number(pendingRequest.exchange_rate_used)
        : 1

      const { error: insertError } = await supabase.from('restaurants').insert({
        city: pendingRequest.city,
        country: pendingRequest.country || null,
        restaurant_name: pendingRequest.restaurant_name || 'Unknown restaurant',
        dish_name: pendingRequest.dish_name || 'Fried Rice',
        dish_category: dishCategory,
        included_in_baseline: includedInBaseline,
        tier: pendingRequest.tier || 'mid_tier',
        local_price: localPrice,
        local_currency: pendingRequest.local_currency || 'CAD',
        exchange_rate_used: exchangeRateUsed,
        price_cad: priceCad,
        source: pendingRequest.source || 'Pending request approval',
        source_type: pendingRequest.source_type || 'scraper_result',
        source_url: pendingRequest.source_url || null,
        confidence_score: confidenceScore,
        approved: true,
        approved_at: new Date().toISOString(),
        active: true,
        scraped_at: pendingRequest.created_at,
        date_accessed: pendingRequest.date_accessed || pendingRequest.created_at,
        notes: pendingRequest.notes || null,
      })

      if (insertError) {
        return NextResponse.json({ error: insertError.message }, { status: 500 })
      }

      let recalculated = {}

      if (includedInBaseline) {
        recalculated = await recalculateCity(pendingRequest.city)
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
        request_type: 'restaurant',
        city: pendingRequest.city,
        included_in_baseline: includedInBaseline,
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