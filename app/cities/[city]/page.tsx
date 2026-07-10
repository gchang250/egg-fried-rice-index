import { supabase } from '@/lib/supabase'
import { previewRent } from '@/lib/rent-preview'
import { notFound } from 'next/navigation'
import CityPageContent from './CityPageContent'
import type { CityRow } from './CityPageContent'

export const dynamic = 'force-dynamic'

type PageProps = {
  params: Promise<{ city: string }>
}

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

export default async function CityDetailPage({ params }: PageProps) {
  const { city: slug } = await params

  const { data: rows, error: cityErr } = await supabase
    .from('cities').select('*').order('city')
  if (cityErr) throw new Error(cityErr.message)

  const city = previewRent((rows ?? []) as CityRow[]).find(r => slugify(r.city) === slug)
  if (!city) notFound()

  return <CityPageContent city={city} />
}
