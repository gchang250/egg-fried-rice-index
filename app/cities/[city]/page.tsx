import { supabase } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import CityPageContent from './CityPageContent'
import type { CityRow, RestaurantRow } from './CityPageContent'

export const dynamic = 'force-dynamic'

type PageProps = {
  params: Promise<{ city: string }>
}

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

function median(vals: number[]) {
  if (!vals.length) return null
  const s = [...vals].sort((a, b) => a - b)
  const m = Math.floor(s.length / 2)
  return s.length % 2 === 1 ? s[m] : (s[m - 1] + s[m]) / 2
}

export default async function CityDetailPage({ params }: PageProps) {
  const { city: slug } = await params

  const { data: rows, error: cityErr } = await supabase
    .from('cities').select('*').order('city')
  if (cityErr) throw new Error(cityErr.message)

  const city = ((rows ?? []) as CityRow[]).find(r => slugify(r.city) === slug)
  if (!city) notFound()

  const { data: rData } = await supabase
    .from('restaurants').select('*')
    .eq('city', city.city).eq('approved', true).eq('active', true)
    .order('price_cad', { ascending: true })

  const restaurants = (rData ?? []) as RestaurantRow[]

  // Back-fill price_cad if missing from DB (shouldn't be, but just in case)
  if (city.price_cad == null && city.baseline_median_cad == null) {
    const blPrices = restaurants
      .filter(r => r.included_in_baseline)
      .map(r => r.price_cad)
      .filter((p): p is number => p != null)
    ;(city as any).price_cad = median(blPrices)
  }

  // Fetch baseline price history from published monthly reports
  const { data: reportsData } = await supabase
    .from('monthly_reports')
    .select('month, title, published_at, city_snapshot')
    .eq('is_published', true)
    .order('month', { ascending: true })

  const history = (reportsData ?? [])
    .map(r => {
      const snap = Array.isArray(r.city_snapshot)
        ? r.city_snapshot.find((c: any) => slugify(c.city) === slug)
        : null
      return snap && snap.price_cad != null
        ? { month: r.month, date: r.title, price_cad: Number(snap.price_cad) }
        : null
    })
    .filter((pt): pt is { month: string; date: string; price_cad: number } => pt !== null)

  // Append the current live price if it is newer
  if (city.price_cad != null) {
    const currentMonthStr = new Date().toISOString().slice(0, 7) // e.g. "2026-06"
    const hasCurrentMonth = history.some(pt => pt.month === currentMonthStr)
    if (!hasCurrentMonth) {
      history.push({
        month: currentMonthStr,
        date: new Date().toLocaleDateString(undefined, { month: 'short', year: 'numeric' }),
        price_cad: Number(city.price_cad)
      })
    }
  }

  return <CityPageContent city={city} restaurants={restaurants} history={history} />
}
