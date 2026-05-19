import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const city = searchParams.get('city')

  if (!city) {
    return NextResponse.json(
      { success: false, error: 'Missing city. Use /api/restaurants?city=Toronto' },
      { status: 400 }
    )
  }

  const { data, error } = await supabase
    .from('restaurants')
    .select('id, city, restaurant_name, tier, price_cad, source, confidence_score, approved, active, created_at')
    .eq('city', city)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }

  return NextResponse.json({
    success: true,
    city,
    restaurants: data ?? [],
  })
}