import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase-admin'

export async function POST(request: Request) {
  try {
    const body = await request.json()

    if (
      body.username !== process.env.ADMIN_USERNAME ||
      body.password !== process.env.ADMIN_PASSWORD
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data, error } = await supabase
      .from('pending_requests')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ requests: data ?? [] })
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}