import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase-admin'

export async function PATCH(request: Request) {
  try {
    const body = await request.json()

    const password = String(body.password ?? '')
    const id = String(body.id ?? '').trim()

    if (password !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    if (!id) {
      return NextResponse.json({ success: false, error: 'Missing id.' }, { status: 400 })
    }

    const updates: Record<string, unknown> = {}

    if (body.price_cad !== undefined) {
      const price = Number(body.price_cad)
      if (!Number.isFinite(price) || price <= 0) {
        return NextResponse.json({ success: false, error: 'Invalid price_cad.' }, { status: 400 })
      }
      updates.price_cad = price
    }

    if (body.dish_category !== undefined) {
      updates.dish_category = String(body.dish_category)
    }

    if (body.included_in_baseline !== undefined) {
      updates.included_in_baseline = Boolean(body.included_in_baseline)
    }

    if (body.active !== undefined) {
      updates.active = Boolean(body.active)
    }

    if (body.tier !== undefined) {
      updates.tier = String(body.tier)
    }

    if (body.confidence_score !== undefined) {
      const score = Number(body.confidence_score)
      if (!Number.isFinite(score) || score < 0 || score > 1) {
        return NextResponse.json({ success: false, error: 'Invalid confidence_score.' }, { status: 400 })
      }
      updates.confidence_score = score
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ success: false, error: 'No fields to update.' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('restaurants')
      .update(updates)
      .eq('id', id)
      .select()

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    if (!data || data.length === 0) {
      return NextResponse.json({ success: false, error: 'Restaurant not found.' }, { status: 404 })
    }

    return NextResponse.json({ success: true, updated: data[0] })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Update failed' },
      { status: 400 }
    )
  }
}
