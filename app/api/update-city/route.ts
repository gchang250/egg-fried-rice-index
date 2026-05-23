import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase-admin'

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
  const price = searchParams.get('price')
  const source = searchParams.get('source') ?? 'Manual API update'
  const confidence = searchParams.get('confidence') ?? '0.9'

  if (!city || !price) {
    return NextResponse.json(
      {
        success: false,
        error:
          'Missing city or price. Use /api/update-city?city=Toronto&price=17.75&source=Manual%20research&confidence=0.8',
      },
      { status: 400 }
    )
  }

  const priceNumber = Number(price)
  const confidenceNumber = Number(confidence)

  if (Number.isNaN(priceNumber)) {
    return NextResponse.json(
      { success: false, error: 'Price must be a number.' },
      { status: 400 }
    )
  }

  if (Number.isNaN(confidenceNumber) || confidenceNumber < 0 || confidenceNumber > 1) {
    return NextResponse.json(
      { success: false, error: 'Confidence must be a number between 0 and 1.' },
      { status: 400 }
    )
  }

  const { data, error } = await supabase
    .from('cities')
    .update({
      price_cad: priceNumber,
      price_source: source,
      price_updated_at: new Date().toISOString(),
      confidence_score: confidenceNumber,
    })
    .eq('city', city)
    .select()

  if (error) {
    console.error('Supabase update error:', error)

    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }

  if (!data || data.length === 0) {
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
    message: `${city} updated successfully`,
    updated: {
      city,
      price_cad: priceNumber,
      price_source: source,
      confidence_score: confidenceNumber,
    },
    data,
  })
}