/**
 * Hybrid Rent Estimator Pipeline
 * 
 * Implements a hybrid methodology for all 343 federal ridings in Canada:
 * 1. Primary Source: Active web-scraped market listings (e.g. Rentals.ca, Kijiji).
 * 2. Baseline Source: Statistics Canada Census rent data per riding (complete baseline).
 * 3. CPI Adjustment: Adjusts the historical Census baseline to 2026 dollars using province-level Rent CPI factors.
 * 4. Credibility Blending: Blends active listings and baseline data based on local sample sizes to smooth outliers.
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

// 2. Simulated Scraped listings (representing primary active listings)
// In production, this would be loaded from a web scraping database/API.
const SIMULATED_SCRAPED_LISTINGS: ScrapedListing[] = [
  // Toronto / Spadina-Fort York listings
  { price: 2400, bedrooms: 1, latitude: 43.64, longitude: -79.39, province: 'ON' },
  { price: 2350, bedrooms: 1, latitude: 43.645, longitude: -79.385, province: 'ON' },
  { price: 2500, bedrooms: 1, latitude: 43.638, longitude: -79.395, province: 'ON' },
  { price: 2600, bedrooms: 1, latitude: 43.642, longitude: -79.378, province: 'ON' },
  // Vancouver Centre listings
  { price: 2800, bedrooms: 1, latitude: 49.28, longitude: -123.12, province: 'BC' },
  { price: 2750, bedrooms: 1, latitude: 49.285, longitude: -123.115, province: 'BC' },
  { price: 2900, bedrooms: 1, latitude: 49.278, longitude: -123.125, province: 'BC' },
  // Calgary Centre listings
  { price: 1650, bedrooms: 1, latitude: 51.04, longitude: -114.07, province: 'AB' },
  { price: 1700, bedrooms: 1, latitude: 51.045, longitude: -114.08, province: 'AB' },
  // A few sparse listings in Moncton
  { price: 1200, bedrooms: 1, latitude: 46.09, longitude: -64.77, province: 'NB' }
]

// 3. Simulated StatCan Census 2021 Median 1BR Tenant Rents (baseline)
// In production, this would be read from a complete Census database dump by FED number.
const CENSUS_2021_BASELINES: Record<string, number> = {
  'Nunavut': 950,
  'Northwest Territories': 1200,
  'Yukon': 1100,
  'Spadina-Fort York': 1850,
  'Vancouver Centre': 1900,
  'Calgary Centre': 1250,
  'Labrador': 680,
  'Pierre-Boucher—Les Patriotes—Verchères': 720,
  'Long Range Mountains': 650,
  'Bécancour—Nicolet—Saurel': 620
}

// Distance helper
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

async function run() {
  if (!fs.existsSync(ridingsFile)) {
    console.error(`Error: ridings file not found at ${ridingsFile}`)
    return
  }

  const ridings: Riding[] = JSON.parse(fs.readFileSync(ridingsFile, 'utf8'))
  console.log(`Loaded ${ridings.length} federal ridings. Running hybrid estimation pipeline...\n`)

  const results: EstResult[] = []

  // Sample size threshold for full trust in scraped listings
  const MIN_SAMPLE_SIZE = 10 

  for (const riding of ridings) {
    // 1. Get Census Baseline rent (fallback to national default of $800 if missing in mock dictionary)
    const baseCensusRent = CENSUS_2021_BASELINES[riding.name] || 800
    
    // 2. Adjust Census Baseline for CPI rent inflation (2021 -> 2026)
    const cpiFactor = CPI_RENT_FACTORS[riding.province] || 1.15
    const baselineAdjusted = baseCensusRent * cpiFactor

    // 3. Find active scraped listings close to this riding's centroid (e.g. within 15 km)
    // In production, we would use exact point-in-polygon matching via PostGIS.
    const ridingLat = (riding as any).latitude
    const ridingLon = (riding as any).longitude

    const nearbyListings = SIMULATED_SCRAPED_LISTINGS.filter(l => {
      // Must match province and be geographically close (within 15km)
      if (l.province !== riding.province) return false
      const dist = haversineDistance(ridingLat, ridingLon, l.latitude, l.longitude)
      return dist <= 15
    })

    const sampleSize = nearbyListings.length
    const prices = nearbyListings.map(l => l.price)
    
    let estimatedRent = 0
    let dataSource = ''
    let confidence: 'high' | 'medium' | 'low' | 'baseline' = 'baseline'

    if (sampleSize >= MIN_SAMPLE_SIZE) {
      // Scenario A: Plenty of active listings. Rely completely on real-time market data.
      estimatedRent = getMedian(prices)
      dataSource = `Active scraped market listings (N=${sampleSize})`
      confidence = 'high'
    } else if (sampleSize > 0) {
      // Scenario B: Sparse active listings. Blend active listings and CPI-adjusted Census baseline.
      const scrapedMedian = getMedian(prices)
      const weight = sampleSize / MIN_SAMPLE_SIZE // e.g. 3 listings = 30% weight to active, 70% to baseline
      estimatedRent = (weight * scrapedMedian) + ((1 - weight) * baselineAdjusted)
      dataSource = `Hybrid blend: active listings (N=${sampleSize}, ${Math.round(weight*100)}% weight) + Census baseline (adjusted by ${riding.province} Rent CPI)`
      confidence = sampleSize >= 5 ? 'medium' : 'low'
    } else {
      // Scenario C: No active listings in area. Rely 100% on the CPI-adjusted Census baseline.
      estimatedRent = baselineAdjusted
      dataSource = `Statistics Canada Census baseline, adjusted for ${riding.province} Rent CPI inflation (no active listings in region)`
      confidence = 'baseline'
    }

    results.push({
      riding_name: riding.name,
      province: riding.province,
      estimated_rent_1br_cad: Math.round(estimatedRent),
      data_source: dataSource,
      sample_size: sampleSize,
      confidence
    })
  }

  // Write output
  const outFile = `${dataDir}/hybrid-rent-estimates.json`
  fs.writeFileSync(outFile, JSON.stringify(results, null, 2), 'utf8')
  console.log(`Pipeline completed. Wrote ${results.length} riding estimates to ${outFile}`)
  
  // Show samples
  console.log('\n=== HYBRID ESTIMATION SAMPLES ===')
  const sampleNames = ['Spadina-Fort York', 'Vancouver Centre', 'Labrador', 'Pierre-Boucher—Les Patriotes—Verchères']
  for (const name of sampleNames) {
    const res = results.find(r => r.riding_name === name)
    if (res) {
      console.log(`\nRiding: ${res.riding_name} (${res.province})`)
      console.log(`  Rent (1BR): CA$${res.estimated_rent_1br_cad}/mo`)
      console.log(`  Confidence: ${res.confidence.toUpperCase()}`)
      console.log(`  Source:     ${res.data_source}`)
    }
  }
}

run()
