import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase-admin'

const validTiers = ['low_tier', 'mid_tier', 'high_end', 'premium', 'fine_dining']

const validDishCategories = [
  'basic',
  'vegetable',
  'meat_based',
  'seafood',
  'house_special',
  'premium',
  'unknown',
]

const validSourceTypes = [
  'official_menu',
  'official_ordering_page',
  'menu_photo',
  'third_party_menu',
  'delivery_app',
  'scraper_result',
  'public_submission',
  'manual_review',
]

function isValidNumber(value: unknown) {
  const number = Number(value)
  return Number.isFinite(number)
}

function normalizeBoolean(value: unknown) {
  return value === true || value === 'true'
}

function unauthorized() {
  return NextResponse.json(
    { success: false, error: 'Unauthorized' },
    { status: 401 }
  )
}

export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const password = searchParams.get('password')

    if (password !== process.env.ADMIN_PASSWORD) {
      return unauthorized()
    }

    const body = await request.json()

    const city = String(body.city ?? '').trim()
    const country = body.country ? String(body.country).trim() : null
    const restaurantName = String(body.restaurant_name ?? '').trim()
    const dishName = String(body.dish_name ?? '').trim()
    const dishCategory = String(body.dish_category ?? 'unknown')
    const includedInBaseline = normalizeBoolean(body.included_in_baseline)
    const tier = String(body.tier ?? 'mid_tier')
    const localCurrency = String(body.local_currency ?? 'CAD').trim().toUpperCase()
    const source = String(body.source ?? '').trim()
    const sourceType = String(body.source_type ?? 'manual_review')
    const sourceUrl = body.source_url ? String(body.source_url).trim() : null
    const notes = body.notes ? String(body.notes).trim() : null
    const dateAccessed = body.date_accessed
      ? String(body.date_accessed)
      : new Date().toISOString()

    const priceCad = Number(body.price_cad)
    const localPrice = Number(body.local_price ?? body.price_cad)
    const exchangeRateUsed = Number(body.exchange_rate_used ?? 1)
    const confidenceScore = Number(body.confidence_score ?? 0.7)
    const approved = normalizeBoolean(body.approved)
    const active = body.active === undefined ? true : normalizeBoolean(body.active)

    if (!city || !restaurantName || !dishName || !source || !sourceUrl) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Missing required fields: city, restaurant_name, dish_name, source, and source_url are required.',
        },
        { status: 400 }
      )
    }

    if (!validTiers.includes(tier)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid tier. Use one of: ${validTiers.join(', ')}`,
        },
        { status: 400 }
      )
    }

    if (!validDishCategories.includes(dishCategory)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid dish category. Use one of: ${validDishCategories.join(
            ', '
          )}`,
        },
        { status: 400 }
      )
    }

    if (!validSourceTypes.includes(sourceType)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid source type. Use one of: ${validSourceTypes.join(', ')}`,
        },
        { status: 400 }
      )
    }

    if (!isValidNumber(priceCad) || priceCad <= 0) {
      return NextResponse.json(
        { success: false, error: 'CAD price must be a positive number.' },
        { status: 400 }
      )
    }

    if (!isValidNumber(localPrice) || localPrice <= 0) {
      return NextResponse.json(
        { success: false, error: 'Local price must be a positive number.' },
        { status: 400 }
      )
    }

    if (!isValidNumber(exchangeRateUsed) || exchangeRateUsed <= 0) {
      return NextResponse.json(
        { success: false, error: 'Exchange rate must be a positive number.' },
        { status: 400 }
      )
    }

    if (
      !isValidNumber(confidenceScore) ||
      confidenceScore < 0 ||
      confidenceScore > 1
    ) {
      return NextResponse.json(
        {
          success: false,
          error: 'Confidence score must be a number between 0 and 1.',
        },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('restaurants')
      .insert({
        city,
        country,
        restaurant_name: restaurantName,
        dish_name: dishName,
        dish_category: dishCategory,
        included_in_baseline: includedInBaseline,
        tier,
        local_price: localPrice,
        local_currency: localCurrency,
        exchange_rate_used: exchangeRateUsed,
        price_cad: priceCad,
        source,
        source_type: sourceType,
        source_url: sourceUrl,
        confidence_score: confidenceScore,
        notes,
        date_accessed: dateAccessed,
        approved,
        approved_at: approved ? new Date().toISOString() : null,
        active,
      })
      .select()

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `${restaurantName} added for ${city}`,
      data,
    })
  } catch {
    return NextResponse.json(
      { success: false, error: 'Invalid request body.' },
      { status: 400 }
    )
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const password = searchParams.get('password')

  if (password !== process.env.ADMIN_PASSWORD) {
    return unauthorized()
  }

  const city = searchParams.get('city')
  const restaurantName = searchParams.get('name')
  const dishName = searchParams.get('dish') ?? 'Fried Rice'
  const dishCategory = searchParams.get('dish_category') ?? 'unknown'
  const includedInBaseline = searchParams.get('included_in_baseline') === 'true'
  const tier = searchParams.get('tier') ?? 'mid_tier'
  const price = searchParams.get('price')
  const localPrice = searchParams.get('local_price') ?? price
  const localCurrency = searchParams.get('local_currency') ?? 'CAD'
  const exchangeRateUsed = searchParams.get('exchange_rate_used') ?? '1'
  const source = searchParams.get('source') ?? 'Manual API entry'
  const sourceType = searchParams.get('source_type') ?? 'manual_review'
  const sourceUrl = searchParams.get('source_url')
  const confidence = searchParams.get('confidence') ?? '0.8'
  const approved = searchParams.get('approved') ?? 'true'

  if (!city || !restaurantName || !price || !sourceUrl) {
    return NextResponse.json(
      {
        success: false,
        error:
          'Missing required fields. Required: city, name, price, source_url. Optional: dish, dish_category, included_in_baseline, tier, local_price, local_currency, exchange_rate_used, source, source_type, confidence, approved.',
      },
      { status: 400 }
    )
  }

  if (!validTiers.includes(tier)) {
    return NextResponse.json(
      {
        success: false,
        error: `Invalid tier. Use one of: ${validTiers.join(', ')}`,
      },
      { status: 400 }
    )
  }

  if (!validDishCategories.includes(dishCategory)) {
    return NextResponse.json(
      {
        success: false,
        error: `Invalid dish category. Use one of: ${validDishCategories.join(
          ', '
        )}`,
      },
      { status: 400 }
    )
  }

  if (!validSourceTypes.includes(sourceType)) {
    return NextResponse.json(
      {
        success: false,
        error: `Invalid source type. Use one of: ${validSourceTypes.join(', ')}`,
      },
      { status: 400 }
    )
  }

  const priceNumber = Number(price)
  const localPriceNumber = Number(localPrice)
  const exchangeRateNumber = Number(exchangeRateUsed)
  const confidenceNumber = Number(confidence)
  const approvedBoolean = approved === 'true'

  if (!Number.isFinite(priceNumber) || priceNumber <= 0) {
    return NextResponse.json(
      { success: false, error: 'CAD price must be a positive number.' },
      { status: 400 }
    )
  }

  if (!Number.isFinite(localPriceNumber) || localPriceNumber <= 0) {
    return NextResponse.json(
      { success: false, error: 'Local price must be a positive number.' },
      { status: 400 }
    )
  }

  if (!Number.isFinite(exchangeRateNumber) || exchangeRateNumber <= 0) {
    return NextResponse.json(
      { success: false, error: 'Exchange rate must be a positive number.' },
      { status: 400 }
    )
  }

  if (
    !Number.isFinite(confidenceNumber) ||
    confidenceNumber < 0 ||
    confidenceNumber > 1
  ) {
    return NextResponse.json(
      { success: false, error: 'Confidence must be a number between 0 and 1.' },
      { status: 400 }
    )
  }

  const { data, error } = await supabase
    .from('restaurants')
    .insert({
      city,
      restaurant_name: restaurantName,
      dish_name: dishName,
      dish_category: dishCategory,
      included_in_baseline: includedInBaseline,
      tier,
      local_price: localPriceNumber,
      local_currency: localCurrency.toUpperCase(),
      exchange_rate_used: exchangeRateNumber,
      price_cad: priceNumber,
      source,
      source_type: sourceType,
      source_url: sourceUrl,
      confidence_score: confidenceNumber,
      approved: approvedBoolean,
      approved_at: approvedBoolean ? new Date().toISOString() : null,
      active: true,
      date_accessed: new Date().toISOString(),
    })
    .select()

  if (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }

  return NextResponse.json({
    success: true,
    message: `${restaurantName} added for ${city}`,
    data,
  })
}