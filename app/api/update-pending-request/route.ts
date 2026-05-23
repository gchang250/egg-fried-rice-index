import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase-admin'

const ALLOWED_FIELDS = [
  'restaurant_name',
  'dish_name',
  'dish_category',
  'tier',
  'included_in_baseline',
  'local_price',
  'local_currency',
  'price_cad',
  'notes',
] as const

export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const { password, id, ...fields } = body

    if (password !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 })
    }

    const update: Record<string, unknown> = {}
    for (const key of ALLOWED_FIELDS) {
      if (key in fields) update[key] = fields[key]
    }

    if (Object.keys(update).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    const { error } = await supabase
      .from('pending_requests')
      .update(update)
      .eq('id', id)
      .eq('status', 'pending')

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Invalid request' },
      { status: 400 }
    )
  }
}
