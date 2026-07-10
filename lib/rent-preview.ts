import overrides from '@/lib/rent-final.json'

/**
 * DEV-ONLY rent preview overlay.
 *
 * The live `cities` table in Supabase still holds the fabricated rent values.
 * This lets `next dev` (localhost) show the staged real dataset
 * (scripts/data/rent-final.json, mirrored to lib/rent-final.json) WITHOUT
 * writing anything to Supabase — so production stays untouched until an
 * explicit `patch-real-rent-safety.ts --apply`.
 *
 * It is a no-op in production builds (`NODE_ENV !== 'development'`), so it never
 * affects the deployed site. Rebuild lib/rent-final.json whenever
 * scripts/data/rent-final.json changes:
 *   python3 -c "import json;d=json.load(open('scripts/data/rent-final.json'));\
 *   json.dump({o['riding_name']:{'rent':o['median_rent_1br_cad'],'source':o['rent_data_source']} for o in d},\
 *   open('lib/rent-final.json','w'),ensure_ascii=False,indent=0)"
 */
type RentOverride = { rent: number | null; source: string }
const MAP = overrides as Record<string, RentOverride>

export function previewRent<
  T extends { city?: string | null; median_rent_1br_cad?: number | null; rent_data_source?: string | null }
>(rows: T[] | null | undefined): T[] {
  if (!rows || process.env.NODE_ENV !== 'development') return (rows ?? []) as T[]
  return rows.map(r => {
    const o = r.city ? MAP[r.city] : undefined
    return o ? { ...r, median_rent_1br_cad: o.rent, rent_data_source: o.source } : r
  })
}
