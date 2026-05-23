import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase-admin'

function str(value: unknown): string | null {
  if (value === undefined || value === null || value === '') return null
  return String(value).trim() || null
}

function num(value: unknown): number | null {
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    if (String(body.password ?? '') !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const cityName = str(body.city)
    if (!cityName) {
      return NextResponse.json({ success: false, error: 'City name is required.' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('cities')
      .insert({
        city: cityName,
        country: str(body.country),
        region: str(body.region),
        flag: str(body.flag),
        population: str(body.population),
        latitude: num(body.latitude),
        longitude: num(body.longitude),
        climate: str(body.climate),
        blurb: str(body.blurb),
        population_source: str(body.population_source),
      })
      .select()

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, city: data?.[0] ?? null })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to create city' },
      { status: 400 }
    )
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json()

    if (String(body.password ?? '') !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const cityName = str(body.city)
    if (!cityName) {
      return NextResponse.json({ success: false, error: 'City name is required.' }, { status: 400 })
    }

    const updates: Record<string, unknown> = {}

    if (body.country !== undefined) updates.country = str(body.country)
    if (body.region !== undefined) updates.region = str(body.region)
    if (body.flag !== undefined) updates.flag = str(body.flag)
    if (body.population !== undefined) updates.population = str(body.population)
    if (body.latitude !== undefined) updates.latitude = num(body.latitude)
    if (body.longitude !== undefined) updates.longitude = num(body.longitude)
    if (body.climate !== undefined) updates.climate = str(body.climate)
    if (body.blurb !== undefined) updates.blurb = str(body.blurb)
    if (body.population_source !== undefined) updates.population_source = str(body.population_source)

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ success: false, error: 'No fields to update.' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('cities')
      .update(updates)
      .eq('city', cityName)
      .select()

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    if (!data || data.length === 0) {
      return NextResponse.json({ success: false, error: `City "${cityName}" not found.` }, { status: 404 })
    }

    return NextResponse.json({ success: true, city: data[0] })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to update city' },
      { status: 400 }
    )
  }
}
