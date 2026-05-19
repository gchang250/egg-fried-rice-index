import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

const validTiers = ['low_tier', 'mid_tier', 'high_end', 'fine_dining']

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const password = searchParams.get('password')

  if (password !== process.env.ADMIN_PASSWORD) {

    return NextResponse.json(

      { success: false, error: 'Unauthorized' },

      { status: 401 }

    )

  }
  const city = searchParams.get('city')
  const restaurantName = searchParams.get('name')
  const tier = searchParams.get('tier')
  const price = searchParams.get('price')
  const source = searchParams.get('source') ?? 'Manual API entry'
  const confidence = searchParams.get('confidence') ?? '0.8'
  const approved = searchParams.get('approved') ?? 'true'

  if (!city || !restaurantName || !tier || !price) {
    return NextResponse.json(
      {
        success: false,
        error:
          'Missing required fields. Use /api/add-restaurant?city=Toronto&name=Swatow&tier=mid_tier&price=14.50&source=manual%20research&confidence=0.8',
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

  const priceNumber = Number(price)
  const confidenceNumber = Number(confidence)
  const approvedBoolean = approved === 'true'

  if (Number.isNaN(priceNumber)) {
    return NextResponse.json(
      { success: false, error: 'Price must be a number.' },
      { status: 400 }
    )
  }

  if (
    Number.isNaN(confidenceNumber) ||
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
        tier,
        price_cad: priceNumber,
        source,
        confidence_score: confidenceNumber,
        approved: approvedBoolean,
        active: true,
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