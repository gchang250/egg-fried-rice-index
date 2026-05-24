import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'

type PageProps = {
  params: Promise<{
    city: string
  }>
}

type CityRow = {
  city: string
  country: string | null
  region: string | null
  flag: string | null
  population: string | null
  climate: string | null
  blurb: string | null
  price_cad: number | null
  price_source: string | null
  price_updated_at: string | null
  confidence_score: number | null
  baseline_median_cad: number | null
  market_average_cad: number | null
  market_min_cad: number | null
  market_max_cad: number | null
  market_entry_count: number | null
  baseline_entry_count: number | null
  premium_entry_count: number | null
  data_quality_label: string | null
}

type RestaurantRow = {
  id: string
  city: string
  country: string | null
  restaurant_name: string | null
  dish_name: string | null
  dish_category: string | null
  included_in_baseline: boolean | null
  tier: string | null
  local_price: number | null
  local_currency: string | null
  exchange_rate_used: number | null
  price_cad: number | null
  source: string | null
  source_type: string | null
  source_url: string | null
  confidence_score: number | null
  notes: string | null
  date_accessed: string | null
  created_at: string | null
}

function slugifyCity(city: string) {
  return city.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

function titleFromSlug(slug: string) {
  return slug
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function formatPrice(value: number | null | undefined, currency = 'CAD') {
  if (value === null || value === undefined || !Number.isFinite(Number(value))) {
    return 'Pending'
  }

  if (currency === 'CAD') {
    return `CA$${Number(value).toFixed(2)}`
  }

  return `${currency} ${Number(value).toFixed(2)}`
}

function formatDate(value: string | null | undefined) {
  if (!value) return 'Not available'

  return new Date(value).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function formatConfidence(value: number | null | undefined) {
  if (value === null || value === undefined) return 'Not available'
  if (value <= 1) return `${Math.round(value * 100)}%`
  return `${Math.round(value)}%`
}

function formatCount(value: number | null | undefined) {
  if (value === null || value === undefined) return '0'
  return String(value)
}

function formatCategory(value: string | null | undefined) {
  if (!value) return 'Unknown'

  const labels: Record<string, string> = {
    basic: 'Basic',
    vegetable: 'Vegetable',
    meat_based: 'Meat-based',
    seafood: 'Seafood',
    house_special: 'House special',
    premium: 'Premium',
    unknown: 'Unknown',
  }

  return labels[value] ?? value.replaceAll('_', ' ')
}

function formatTier(value: string | null | undefined) {
  if (!value) return 'Unknown'

  const labels: Record<string, string> = {
    low_tier: 'Low tier',
    mid_tier: 'Mid tier',
    high_end: 'High end',
    premium: 'Premium',
    fine_dining: 'Fine dining',
  }

  return labels[value] ?? value.replaceAll('_', ' ')
}

function average(values: number[]) {
  if (values.length === 0) return null
  return values.reduce((sum, value) => sum + value, 0) / values.length
}

function standardDeviation(values: number[]) {
  if (values.length < 2) return null
  const mean = values.reduce((sum, v) => sum + v, 0) / values.length
  const variance = values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / (values.length - 1)
  return Math.sqrt(variance)
}

function median(values: number[]) {
  if (values.length === 0) return null

  const sorted = [...values].sort((a, b) => a - b)
  const midpoint = Math.floor(sorted.length / 2)

  if (sorted.length % 2 === 0) {
    return (sorted[midpoint - 1] + sorted[midpoint]) / 2
  }

  return sorted[midpoint]
}

export default async function CityDetailPage({ params }: PageProps) {
  const { city: citySlug } = await params
  const expectedCityName = titleFromSlug(citySlug)

  const { data: cities, error: cityError } = await supabase
    .from('cities')
    .select(
      `
      city,
      country,
      region,
      flag,
      population,
      climate,
      blurb,
      price_cad,
      price_source,
      price_updated_at,
      confidence_score,
      baseline_median_cad,
      market_average_cad,
      market_min_cad,
      market_max_cad,
      market_entry_count,
      baseline_entry_count,
      premium_entry_count,
      data_quality_label
    `
    )

  if (cityError) {
    throw new Error(cityError.message)
  }

  const city = ((cities ?? []) as CityRow[]).find(
    (row) => slugifyCity(row.city) === citySlug
  )

  if (!city) {
    notFound()
  }

  const { data: restaurantData, error: restaurantsError } = await supabase
    .from('restaurants')
    .select(
      `
      id,
      city,
      country,
      restaurant_name,
      dish_name,
      dish_category,
      included_in_baseline,
      tier,
      local_price,
      local_currency,
      exchange_rate_used,
      price_cad,
      source,
      source_type,
      source_url,
      confidence_score,
      notes,
      date_accessed,
      created_at
    `
    )
    .eq('city', city.city)
    .eq('approved', true)
    .eq('active', true)
    .order('price_cad', { ascending: true })

  if (restaurantsError) {
    throw new Error(restaurantsError.message)
  }

  const restaurants = (restaurantData ?? []) as RestaurantRow[]

  const baselineEntries = restaurants.filter((entry) => entry.included_in_baseline)
  const marketEntries = restaurants.filter((entry) => !entry.included_in_baseline)
  const premiumEntries = restaurants.filter(
    (entry) =>
      entry.dish_category === 'premium' ||
      entry.tier === 'premium' ||
      entry.tier === 'fine_dining' ||
      entry.tier === 'high_end'
  )

  const baselinePrices = baselineEntries
    .map((entry) => entry.price_cad)
    .filter((price): price is number => typeof price === 'number')

  const allPrices = restaurants
    .map((entry) => entry.price_cad)
    .filter((price): price is number => typeof price === 'number')

  const fallbackBaselineMedian = median(baselinePrices)
  const fallbackMarketAverage = average(allPrices)
  const fallbackMinPrice = allPrices.length > 0 ? Math.min(...allPrices) : null
  const fallbackMaxPrice = allPrices.length > 0 ? Math.max(...allPrices) : null

  const baselineMedian =
    city.baseline_median_cad ?? city.price_cad ?? fallbackBaselineMedian

  const marketAverage = city.market_average_cad ?? fallbackMarketAverage
  const marketMin = city.market_min_cad ?? fallbackMinPrice
  const marketMax = city.market_max_cad ?? fallbackMaxPrice

  // Standard deviation computed live from restaurant entries (all approved prices)
  const marketStdDev = standardDeviation(allPrices)

  const baselineEntryCount = city.baseline_entry_count ?? baselineEntries.length
  const marketEntryCount = city.market_entry_count ?? restaurants.length
  const premiumEntryCount = city.premium_entry_count ?? premiumEntries.length

  return (
    <main style={pageStyle}>
      <link
        href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500&display=swap"
        rel="stylesheet"
      />

      <nav style={navStyle}>
        <Link href="/" style={brandStyle}>
          fried rice <span style={{ color: '#C25E1E' }}>index</span>
        </Link>

        <div style={navLinksStyle}>
          <Link href="/cities" style={navLinkStyle}>
            cities
          </Link>

          <Link href="/submit" style={navLinkStyle}>
            submit
          </Link>

          <Link href="/about" style={navLinkStyle}>
            about
          </Link>

          <Link href="/methodology" style={navLinkStyle}>
            methodology
          </Link>
        </div>
      </nav>

      <section style={heroStyle}>
        <p style={eyebrowStyle}>City profile</p>

        <h1 style={titleStyle}>
          {city.flag ? `${city.flag} ` : ''}
          {city.city}
        </h1>

        <p style={subtitleStyle}>
          {[city.region, city.country].filter(Boolean).join(', ') || expectedCityName}
        </p>

        <p style={introStyle}>
          {city.blurb ??
            'This city profile tracks baseline fried rice affordability and broader fried rice market variation using approved restaurant-level data.'}
        </p>

        <div style={statGridStyle}>
          <StatCard
            label="Baseline median"
            value={formatPrice(baselineMedian)}
            note={`${baselineEntryCount} baseline entr${
              baselineEntryCount === 1 ? 'y' : 'ies'
            }`}
          />

          <StatCard
            label="Market average"
            value={formatPrice(marketAverage)}
            note={`${marketEntryCount} total approved entr${
              marketEntryCount === 1 ? 'y' : 'ies'
            }`}
          />

          <StatCard
            label="Market range"
            value={
              marketMin !== null && marketMax !== null
                ? `${formatPrice(marketMin)}–${formatPrice(marketMax)}`
                : 'Pending'
            }
            note="Approved fried rice entries"
          />

          <StatCard
            label="Std deviation"
            value={marketStdDev !== null ? `±CA$${marketStdDev.toFixed(2)}` : 'Pending'}
            note={`Across ${marketEntryCount} approved entr${marketEntryCount === 1 ? 'y' : 'ies'}`}
          />

          <StatCard
            label="Data quality"
            value={city.data_quality_label ?? 'Not available'}
            note={`Updated ${formatDate(city.price_updated_at)}`}
          />

          <StatCard
            label="Confidence"
            value={formatConfidence(city.confidence_score)}
            note="Baseline-price confidence"
          />
        </div>
      </section>

      <section style={sectionStyle}>
        <SectionHeader
          title="Baseline entries"
          description="Only basic or vegetable fried rice entries are included in the baseline index price."
        />

        <RestaurantTable rows={baselineEntries} emptyText="No approved baseline entries yet." />
      </section>

      <section style={sectionStyle}>
        <SectionHeader
          title="Full fried rice market profile"
          description="All approved fried rice entries, including meat, seafood, house special, and premium dishes."
        />

        <RestaurantTable rows={restaurants} emptyText="No approved restaurant entries yet." />
      </section>

      <section style={sectionStyle}>
        <SectionHeader
          title="Premium and non-baseline entries"
          description="Higher-end entries are tracked as market signals but are not treated as baseline affordability data."
        />

        <RestaurantTable
          rows={premiumEntries.length > 0 ? premiumEntries : marketEntries}
          emptyText="No premium or non-baseline entries yet."
        />
      </section>

      <section style={sectionStyle}>
        <SectionHeader
          title="Data notes"
          description="Methodological notes for this city profile."
        />

        <div style={notesBoxStyle}>
          <p style={noteTextStyle}>
            <strong>Baseline source:</strong> {city.price_source ?? 'Not available'}
          </p>

          <p style={noteTextStyle}>
            <strong>Population:</strong> {city.population ?? 'Not available'}
          </p>

          <p style={noteTextStyle}>
            <strong>Climate:</strong> {city.climate ?? 'Not available'}
          </p>

          <p style={noteTextStyle}>
            <strong>Stored market summary:</strong>{' '}
            {city.market_entry_count !== null && city.market_entry_count !== undefined
              ? `${city.market_entry_count} approved market entries, ${city.baseline_entry_count ?? 0} baseline entries, and ${city.premium_entry_count ?? 0} premium entries.`
              : 'Not available yet. Recalculate this city to generate stored market statistics.'}
          </p>

          <p style={noteTextStyle}>
            Fried rice dishes with premium proteins, seafood, luxury ingredients, or
            restaurant positioning are included in the market profile but excluded from
            the baseline price calculation.
          </p>
        </div>
      </section>
    </main>
  )
}

function StatCard({
  label,
  value,
  note,
}: {
  label: string
  value: string
  note: string
}) {
  return (
    <div style={statCardStyle}>
      <p style={statLabelStyle}>{label}</p>
      <p style={statValueStyle}>{value}</p>
      <p style={statNoteStyle}>{note}</p>
    </div>
  )
}

function SectionHeader({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <div style={{ marginBottom: '1rem' }}>
      <h2 style={sectionTitleStyle}>{title}</h2>
      <p style={sectionDescriptionStyle}>{description}</p>
    </div>
  )
}

function RestaurantTable({
  rows,
  emptyText,
}: {
  rows: RestaurantRow[]
  emptyText: string
}) {
  if (rows.length === 0) {
    return <p style={emptyStyle}>{emptyText}</p>
  }

  return (
    <div style={tableWrapperStyle}>
      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={thStyle}>Restaurant</th>
            <th style={thStyle}>Dish</th>
            <th style={thStyle}>Category</th>
            <th style={thStyle}>Tier</th>
            <th style={thStyle}>Local price</th>
            <th style={thStyle}>CAD price</th>
            <th style={thStyle}>Baseline</th>
            <th style={thStyle}>Confidence</th>
            <th style={thStyle}>Source type</th>
            <th style={thStyle}>Date accessed</th>
            <th style={thStyle}>Source</th>
          </tr>
        </thead>

        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              <td style={tdStyle}>{row.restaurant_name ?? 'Unknown'}</td>
              <td style={tdStyle}>{row.dish_name ?? 'Fried rice'}</td>
              <td style={tdStyle}>{formatCategory(row.dish_category)}</td>
              <td style={tdStyle}>{formatTier(row.tier)}</td>
              <td style={tdStyle}>
                {row.local_price
                  ? formatPrice(row.local_price, row.local_currency ?? 'LOCAL')
                  : 'Pending'}
              </td>
              <td style={tdStyle}>{formatPrice(row.price_cad)}</td>
              <td style={tdStyle}>{row.included_in_baseline ? 'Yes' : 'No'}</td>
              <td style={tdStyle}>{formatConfidence(row.confidence_score)}</td>
              <td style={tdStyle}>{row.source_type ?? '—'}</td>
              <td style={tdStyle}>{formatDate(row.date_accessed)}</td>
              <td style={tdStyle}>
                {row.source_url ? (
                  <a
                    href={row.source_url}
                    target="_blank"
                    rel="noreferrer"
                    style={sourceLinkStyle}
                  >
                    Open source
                  </a>
                ) : (
                  row.source ?? 'Not available'
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

const pageStyle: React.CSSProperties = {
  fontFamily: 'DM Sans, sans-serif',
  background: '#FAFAF8',
  minHeight: '100vh',
  color: '#1a1a18',
}

const navStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: '1rem',
  padding: '1.25rem 2.5rem',
  borderBottom: '0.5px solid #e5e3da',
  flexWrap: 'wrap',
}

const brandStyle: React.CSSProperties = {
  fontFamily: 'DM Serif Display, serif',
  fontSize: 18,
  color: '#1a1a18',
  textDecoration: 'none',
}

const navLinksStyle: React.CSSProperties = {
  display: 'flex',
  gap: '1.5rem',
  flexWrap: 'wrap',
}

const navLinkStyle: React.CSSProperties = {
  fontSize: 13,
  color: '#6b6b64',
  textDecoration: 'none',
}

const heroStyle: React.CSSProperties = {
  padding: '4rem 2.5rem 2rem',
  maxWidth: 1180,
  margin: '0 auto',
}

const eyebrowStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 500,
  letterSpacing: '1.5px',
  textTransform: 'uppercase',
  color: '#C25E1E',
  marginBottom: '1rem',
}

const titleStyle: React.CSSProperties = {
  fontFamily: 'DM Serif Display, serif',
  fontSize: 58,
  lineHeight: 1.05,
  letterSpacing: -1.5,
  margin: '0 0 0.5rem',
}

const subtitleStyle: React.CSSProperties = {
  fontSize: 15,
  color: '#6b6b64',
  margin: '0 0 1rem',
}

const introStyle: React.CSSProperties = {
  fontSize: 16,
  color: '#3a3a34',
  lineHeight: 1.7,
  maxWidth: 760,
  marginBottom: '2rem',
}

const statGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
  gap: '1rem',
}

const statCardStyle: React.CSSProperties = {
  background: '#fff',
  border: '0.5px solid #e5e3da',
  borderRadius: 16,
  padding: '1.1rem',
}

const statLabelStyle: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 500,
  letterSpacing: '1.1px',
  textTransform: 'uppercase',
  color: '#9b9b90',
  margin: '0 0 0.5rem',
}

const statValueStyle: React.CSSProperties = {
  fontFamily: 'DM Serif Display, serif',
  fontSize: 30,
  color: '#C25E1E',
  margin: 0,
}

const statNoteStyle: React.CSSProperties = {
  fontSize: 12,
  color: '#6b6b64',
  margin: '0.4rem 0 0',
}

const sectionStyle: React.CSSProperties = {
  maxWidth: 1180,
  margin: '0 auto',
  padding: '1.5rem 2.5rem',
}

const sectionTitleStyle: React.CSSProperties = {
  fontFamily: 'DM Serif Display, serif',
  fontSize: 30,
  letterSpacing: -0.5,
  margin: '0 0 0.4rem',
}

const sectionDescriptionStyle: React.CSSProperties = {
  fontSize: 14,
  color: '#6b6b64',
  lineHeight: 1.6,
  margin: 0,
  maxWidth: 760,
}

const tableWrapperStyle: React.CSSProperties = {
  background: '#fff',
  border: '0.5px solid #e5e3da',
  borderRadius: 16,
  overflowX: 'auto',
}

const tableStyle: React.CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  minWidth: 1200,
}

const thStyle: React.CSSProperties = {
  textAlign: 'left',
  padding: '0.85rem',
  fontSize: 11,
  textTransform: 'uppercase',
  letterSpacing: '1px',
  color: '#9b9b90',
  borderBottom: '0.5px solid #e5e3da',
  whiteSpace: 'nowrap',
}

const tdStyle: React.CSSProperties = {
  padding: '0.85rem',
  fontSize: 13,
  color: '#3a3a34',
  borderBottom: '0.5px solid #f0ede6',
  verticalAlign: 'top',
}

const sourceLinkStyle: React.CSSProperties = {
  color: '#C25E1E',
  textDecoration: 'none',
}

const emptyStyle: React.CSSProperties = {
  background: '#fff',
  border: '0.5px solid #e5e3da',
  borderRadius: 16,
  padding: '1rem',
  color: '#6b6b64',
  fontSize: 14,
}

const notesBoxStyle: React.CSSProperties = {
  background: '#fff',
  border: '0.5px solid #e5e3da',
  borderRadius: 16,
  padding: '1.25rem',
}

const noteTextStyle: React.CSSProperties = {
  fontSize: 14,
  color: '#3a3a34',
  lineHeight: 1.7,
  margin: '0 0 0.75rem',
}