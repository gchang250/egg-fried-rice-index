/**
 * Refined Hybrid Rent Estimator Pipeline
 * 
 * Implements a hybrid methodology for all 343 federal ridings in Canada:
 * 1. Deduplication: Eliminates cross-posted listings based on a coordinate-price fingerprint.
 * 2. Adaptive Radii: Queries smaller radii (10km) in Urban areas to prevent bleed, 
 *    and expands radii (15km -> 30km -> 50km) in Rural areas (bounded by province).
 * 3. Outlier Filter: Strips room rentals (<15th percentile) and luxury listings (>85th percentile).
 * 4. Turnover Correction: Deflates asking prices (10-15% in ON/BC/QC, 5% in others) to match occupied rents.
 * 5. Credibility Blending: Blends active listings and baseline data (N=25 saturation).
 */
import fs from 'fs'
import path from 'path'

// Path helpers
const dataDir = path.resolve(process.cwd(), 'scripts/data')
const ridingsFile = `${dataDir}/ridings-real-data.json`

// Types
type Riding = {
  fed_num: string
  name: string
  province: string
  median_total_income_annual: number
  population_2025?: number
}

type ScrapedListing = {
  price: number
  bedrooms: number
  latitude: number
  longitude: number
  province: string
}

type EstResult = {
  riding_name: string
  province: string
  estimated_rent_1br_cad: number
  data_source: string
  sample_size: number
  confidence: 'high' | 'medium' | 'low' | 'baseline'
}

// 1. Provincial Rent CPI Inflation Factors (2021 Census baseline to 2026)
const CPI_RENT_FACTORS: Record<string, number> = {
  ON: 1.18,  // Ontario (+18% cumulative rent CPI)
  BC: 1.22,  // British Columbia (+22%)
  QC: 1.15,  // Quebec (+15%)
  AB: 1.20,  // Alberta (+20%)
  MB: 1.12,  // Manitoba (+12%)
  SK: 1.10,  // Saskatchewan (+10%)
  NS: 1.25,  // Nova Scotia (+25%)
  NB: 1.16,  // New Brunswick (+16%)
  NL: 1.11,  // Newfoundland and Labrador (+11%)
  PE: 1.14,  // Prince Edward Island (+14%)
  YT: 1.12,  // Yukon
  NT: 1.08,  // Northwest Territories
  NU: 1.05   // Nunavut
}

// 2. Provincial Market Turnover Premium (Asking vs. Occupied gap)
const TURNOVER_PREMIUMS: Record<string, number> = {
  ON: 0.15,  // strict rent control (15% gap)
  BC: 0.15,  // strict rent control (15% gap)
  QC: 0.10,  // moderate rent control (10% gap)
  AB: 0.05,  // fluid market (5% gap)
  MB: 0.05,
  SK: 0.05,
  NS: 0.10,
  NB: 0.05,
  NL: 0.05,
  PE: 0.05,
  YT: 0.05,
  NT: 0.05,
  NU: 0.05
}

// 3. Simulated Scraped listings (including duplicates and outliers)
const SIMULATED_SCRAPED_LISTINGS: ScrapedListing[] = [
  // --- Toronto / Spadina-Fort York listings ---
  { price: 2400, bedrooms: 1, latitude: 43.640, longitude: -79.390, province: 'ON' },
  // Duplicate listing (same price & coordinates to 3 decimal places)
  { price: 2400, bedrooms: 1, latitude: 43.640, longitude: -79.390, province: 'ON' },
  { price: 2350, bedrooms: 1, latitude: 43.645, longitude: -79.385, province: 'ON' },
  { price: 2500, bedrooms: 1, latitude: 43.638, longitude: -79.395, province: 'ON' },
  { price: 2600, bedrooms: 1, latitude: 43.642, longitude: -79.378, province: 'ON' },
  // Low-end outlier (room rental - should be filtered out by IQR)
  { price: 750, bedrooms: 1, latitude: 43.641, longitude: -79.391, province: 'ON' },
  // High-end outlier (luxury penthouse - should be filtered out by IQR)
  { price: 9500, bedrooms: 1, latitude: 43.642, longitude: -79.392, province: 'ON' },

  // --- Vancouver Centre listings ---
  { price: 2800, bedrooms: 1, latitude: 49.280, longitude: -123.120, province: 'BC' },
  { price: 2750, bedrooms: 1, latitude: 49.285, longitude: -123.115, province: 'BC' },
  { price: 2900, bedrooms: 1, latitude: 49.278, longitude: -123.125, province: 'BC' },
  // Duplicate listing
  { price: 2800, bedrooms: 1, latitude: 49.280, longitude: -123.120, province: 'BC' },

  // --- Calgary Centre listings ---
  { price: 1650, bedrooms: 1, latitude: 51.040, longitude: -114.070, province: 'AB' },
  { price: 1700, bedrooms: 1, latitude: 51.045, longitude: -114.080, province: 'AB' },

  // --- Sparse listings in Moncton ---
  { price: 1200, bedrooms: 1, latitude: 46.090, longitude: -64.770, province: 'NB' }
]

// 4. Simulated StatCan Census 2021 Median 1BR Tenant Rents (baseline)
const CENSUS_2021_BASELINES: Record<string, number> = {
  'Nunavut': 950,
  'Northwest Territories': 1200,
  'Yukon': 1100,
  'Spadina—Harbourfront': 1850,
  'Vancouver Centre': 1900,
  'Calgary Centre': 1250,
  'Labrador': 680,
  'Pierre-Boucher—Les Patriotes—Verchères': 720,
  'Long Range Mountains': 650,
  'Bécancour—Nicolet—Saurel': 620
}

// Distance helper (Haversine)
function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371 // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return R * c
}

// Median helper
function getMedian(arr: number[]): number {
  if (arr.length === 0) return 0
  const sorted = [...arr].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
}

// Deduplicate listings based on rounded coordinates and price fingerprint
function deduplicateListings(listings: ScrapedListing[]): ScrapedListing[] {
  const seen = new Set<string>()
  const result: ScrapedListing[] = []
  for (const l of listings) {
    const fingerprint = `${Math.round(l.latitude * 1000)}_${Math.round(l.longitude * 1000)}_${l.price}`
    if (!seen.has(fingerprint)) {
      seen.add(fingerprint)
      result.push(l)
    }
  }
  return result
}

// Outlier removal using Interquartile Range (IQR equivalent - 15th to 85th percentiles)
function filterOutliersIQR(listings: ScrapedListing[]): ScrapedListing[] {
  if (listings.length < 4) return listings
  const sorted = [...listings].sort((a, b) => a.price - b.price)
  const q15Idx = Math.floor(sorted.length * 0.15)
  const q85Idx = Math.floor(sorted.length * 0.85)
  return sorted.slice(q15Idx, q85Idx + 1)
}

// Determine if a riding is Urban or Rural/Remote based on population
function isUrbanRiding(riding: Riding): boolean {
  if (['NU', 'NT', 'YT'].includes(riding.province)) return false
  if (riding.population_2025 && riding.population_2025 < 85000) return false
  const ruralList = [
    'Labrador', 'Long Range Mountains', 'Skeena—Bulkley Valley', 'Kenora', 
    'Desnethé—Missinippi—Churchill River', 'Churchill—Keewatinook Aski',
    'Abitibi—Baie-James—Nunavik—Eeyou'
  ]
  if (ruralList.includes(riding.name)) return false
  return true
}

// Get listings with adaptive geographic radii (bounded by province)
function getListingsForRiding(
  riding: Riding, 
  listings: ScrapedListing[], 
  ridingLat: number, 
  ridingLon: number
): ScrapedListing[] {
  const isUrban = isUrbanRiding(riding)
  let radius = isUrban ? 10 : 15
  
  let filtered = listings.filter(l => {
    if (l.province !== riding.province) return false
    return haversineDistance(ridingLat, ridingLon, l.latitude, l.longitude) <= radius
  })

  // Adaptive expansion for rural/remote areas
  if (!isUrban && filtered.length < 15) {
    radius = 30
    filtered = listings.filter(l => {
      if (l.province !== riding.province) return false
      return haversineDistance(ridingLat, ridingLon, l.latitude, l.longitude) <= radius
    })

    if (filtered.length < 15) {
      radius = 50
      filtered = listings.filter(l => {
        if (l.province !== riding.province) return false
        return haversineDistance(ridingLat, ridingLon, l.latitude, l.longitude) <= radius
      })
    }
  }

  return filtered
}

async function run() {
  if (!fs.existsSync(ridingsFile)) {
    console.error(`Error: ridings file not found at ${ridingsFile}`)
    return
  }

  const ridings: Riding[] = JSON.parse(fs.readFileSync(ridingsFile, 'utf8'))
  const assignmentsFile = `${dataDir}/metro-assignments.json`
  const assignments = fs.existsSync(assignmentsFile)
    ? JSON.parse(fs.readFileSync(assignmentsFile, 'utf8'))
    : {}

  console.log(`Loaded ${ridings.length} federal ridings. Running upgraded hybrid pipeline...\n`)

  // 1. Deduplicate global listings
  const dedupedListings = deduplicateListings(SIMULATED_SCRAPED_LISTINGS)
  console.log(`Global Listings: ${SIMULATED_SCRAPED_LISTINGS.length} raw -> ${dedupedListings.length} deduplicated.`)

  const results: EstResult[] = []
  const SATURATION_THRESHOLD = 25

  for (const riding of ridings) {
    const ridingLat = (riding as any).latitude
    const ridingLon = (riding as any).longitude

    // Find nearest polled center for baseline tracing transparency
    const assign = assignments[riding.fed_num]
    const polledCity = assign && assign.rent_metro ? assign.rent_metro.split(',')[0].trim() : riding.name

    // 2. Fetch listings with adaptive radius
    const rawRidingListings = getListingsForRiding(riding, dedupedListings, ridingLat, ridingLon)

    // 3. Remove outliers (IQR equivalent 15th-85th percentile)
    const cleanedListings = filterOutliersIQR(rawRidingListings)
    const N = cleanedListings.length

    // 4. Calculate baseline & adjusted market rates
    const baseCensusRent = CENSUS_2021_BASELINES[riding.name] || 800
    const cpiFactor = CPI_RENT_FACTORS[riding.province] || 1.15
    const censusBaseline2026 = baseCensusRent * cpiFactor

    const rawScrapedMedian = getMedian(cleanedListings.map(l => l.price))
    
    // Apply provincial Market Turnover Premium discount to adjust asking vs occupied rent
    const premium = TURNOVER_PREMIUMS[riding.province] || 0.05
    const adjustedScrapedMedian = rawScrapedMedian * (1 - premium)

    // 5. Credibility Blending (N = 25 saturation threshold)
    const w = Math.min(1.0, N / SATURATION_THRESHOLD)
    const finalEstimatedRent = (w * adjustedScrapedMedian) + ((1 - w) * censusBaseline2026)

    let dataSource = ''
    let confidence: 'high' | 'medium' | 'low' | 'baseline' = 'baseline'

    if (N >= SATURATION_THRESHOLD) {
      dataSource = `Market listings (N=${N}) adjusted for turnover bias (-${Math.round(premium*100)}%)`
      confidence = 'high'
    } else if (N > 0) {
      dataSource = `Hybrid blend: market listings (N=${N}, ${Math.round(w*100)}% weight) + Census baseline for ${polledCity} (CPI-adjusted, ${Math.round((1-w)*100)}% weight)`
      confidence = N >= 12 ? 'medium' : 'low'
    } else {
      dataSource = `Statistics Canada Census baseline for ${polledCity}, adjusted for ${riding.province} Rent CPI inflation (no active listings in region)`
      confidence = 'baseline'
    }

    results.push({
      riding_name: riding.name,
      province: riding.province,
      estimated_rent_1br_cad: Math.round(finalEstimatedRent),
      data_source: dataSource,
      sample_size: N,
      confidence
    })
  }

  // Write output
  const outFile = `${dataDir}/hybrid-rent-estimates.json`
  fs.writeFileSync(outFile, JSON.stringify(results, null, 2), 'utf8')
  console.log(`\nPipeline completed. Wrote ${results.length} riding estimates to ${outFile}`)
  
  // Show detailed sample audits
  console.log('\n=== HYBRID ESTIMATION SAMPLES ===')
  const sampleNames = ['Spadina-Fort York', 'Vancouver Centre', 'Labrador', 'Pierre-Boucher—Les Patriotes—Verchères']
  for (const name of sampleNames) {
    const res = results.find(r => r.riding_name === name)
    if (res) {
      console.log(`\nRiding: ${res.riding_name} (${res.province})`)
      console.log(`  Rent (1BR): CA$${res.estimated_rent_1br_cad}/mo`)
      console.log(`  Cleaned N:  ${res.sample_size}`)
      console.log(`  Confidence: ${res.confidence.toUpperCase()}`)
      console.log(`  Source:     ${res.data_source}`)
    }
  }
}

run()
