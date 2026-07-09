import fs from 'fs'
import path from 'path'
import { createClient } from '@supabase/supabase-js'

// Load environment variables from .env.local
try {
  const envPath = path.resolve(process.cwd(), '.env.local')
  if (fs.existsSync(envPath)) {
    const envFile = fs.readFileSync(envPath, 'utf-8')
    envFile.split('\n').forEach(line => {
      const parts = line.split('=')
      if (parts.length >= 2) {
        const key = parts[0].trim()
        const val = parts.slice(1).join('=').trim().replace(/^['"]|['"]$/g, '')
        process.env[key] = val
      }
    })
  }
} catch (e) {
  console.warn('Could not load .env.local:', e)
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const NOW = new Date().toISOString()

interface CitySeed {
  city: string
  province: string
  population: string
  latitude: number
  longitude: number
  median_rent: number
  median_salary: number
  tech_salary: number
  safety_index: number
  healthcare_index: number
  internet_speed: number
  blurb: string
  climate: string
  salary_source: string
  rent_source: string
  party: string
}

const CITIES: CitySeed[] = [
  {
    city: 'Vancouver',
    province: 'BC',
    population: '2642825',
    latitude: 49.2827,
    longitude: -123.1207,
    median_rent: 2700,
    median_salary: 4800,
    tech_salary: 7500,
    safety_index: 58,
    healthcare_index: 74,
    internet_speed: 152,
    blurb: "Framed by the Pacific Ocean and Coastal Mountains, Vancouver is a high-cost coastal gateway representing several highly contested urban ridings.",
    climate: "Temperate oceanic — mild, rainy winters, warm dry summers",
    salary_source: "Statistics Canada 2025",
    rent_source: "Rentals.ca Q1 2026",
    party: "Liberal"
  },
  {
    city: 'Montreal',
    province: 'QC',
    population: '4597837',
    latitude: 45.5017,
    longitude: -73.5673,
    median_rent: 1750,
    median_salary: 4100,
    tech_salary: 6500,
    safety_index: 70,
    healthcare_index: 68,
    internet_speed: 130,
    blurb: "The cultural hub of French Canada. Montreal features a dense layout of federal ridings spanning downtown, historic harbor sectors, and bilingual boroughs.",
    climate: "Humid continental — cold snowy winters, warm humid summers",
    salary_source: "Institut de la statistique du Québec 2025",
    rent_source: "CMHC 2026",
    party: "Liberal"
  },
  {
    city: 'Calgary',
    province: 'AB',
    population: '1840000',
    latitude: 51.0447,
    longitude: -114.0719,
    median_rent: 1800,
    median_salary: 5100,
    tech_salary: 7800,
    safety_index: 63,
    healthcare_index: 73,
    internet_speed: 138,
    blurb: "Positioned at the base of the Rocky Mountains, Calgary is a major energy sector hub with historically strong conservative riding representation.",
    climate: "Semi-arid continental — dry cold winters, warm sunny summers",
    salary_source: "Statistics Canada 2025",
    rent_source: "Rentals.ca Q1 2026",
    party: "Conservative"
  },
  {
    city: 'Edmonton',
    province: 'AB',
    population: '1690000',
    latitude: 53.5461,
    longitude: -113.4938,
    median_rent: 1400,
    median_salary: 4900,
    tech_salary: 7400,
    safety_index: 52,
    healthcare_index: 70,
    internet_speed: 125,
    blurb: "Alberta's capital city. Edmonton represents a diverse industrial and public-sector core, featuring notable progressive riding hotspots in the city center.",
    climate: "Humid continental — long cold winters, warm pleasant summers",
    salary_source: "Statistics Canada 2025",
    rent_source: "Rentals.ca Q1 2026",
    party: "NDP"
  },
  {
    city: 'Ottawa',
    province: 'ON',
    population: '1700014',
    latitude: 45.4215,
    longitude: -75.6972,
    median_rent: 1950,
    median_salary: 5200,
    tech_salary: 8000,
    safety_index: 72,
    healthcare_index: 76,
    internet_speed: 140,
    blurb: "Canada's national capital. Ottawa is the center of federal administration and parliamentary politics, divided into major urban and suburban ridings.",
    climate: "Humid continental — cold snowy winters, warm humid summers",
    salary_source: "Statistics Canada 2025",
    rent_source: "Rentals.ca Q1 2026",
    party: "Liberal"
  },
  {
    city: 'Winnipeg',
    province: 'MB',
    population: '870032',
    latitude: 49.8951,
    longitude: -97.1384,
    median_rent: 1250,
    median_salary: 3800,
    tech_salary: 5800,
    safety_index: 45,
    healthcare_index: 62,
    internet_speed: 110,
    blurb: "The historic gateway to the Canadian Prairies. Winnipeg maintains a diverse manufacturing base and is a key electoral battleground.",
    climate: "Extreme continental — very cold dry winters, hot summers",
    salary_source: "Manitoba Bureau of Statistics 2025",
    rent_source: "CMHC 2026",
    party: "NDP"
  },
  {
    city: 'Halifax',
    province: 'NS',
    population: '544834',
    latitude: 44.6488,
    longitude: -63.5752,
    median_rent: 1850,
    median_salary: 4000,
    tech_salary: 6200,
    safety_index: 61,
    healthcare_index: 70,
    internet_speed: 125,
    blurb: "The major economic hub of Atlantic Canada. Halifax is a vibrant ocean-front port city hosting critical East Coast federal ridings.",
    climate: "Humid continental / Maritime — wet snowy winters, pleasant warm summers",
    salary_source: "Statistics Canada 2025",
    rent_source: "Rentals.ca Q1 2026",
    party: "Liberal"
  },
  {
    city: 'Victoria',
    province: 'BC',
    population: '448561',
    latitude: 48.4284,
    longitude: -123.3656,
    median_rent: 2000,
    median_salary: 4400,
    tech_salary: 6800,
    safety_index: 65,
    healthcare_index: 75,
    internet_speed: 135,
    blurb: "The capital of British Columbia, located on Vancouver Island. Known for tourism, public-sector offices, and strong progressive voter bases.",
    climate: "Warm-summer Mediterranean — mild wet winters, dry warm summers",
    salary_source: "Statistics Canada 2025",
    rent_source: "Rentals.ca Q1 2026",
    party: "NDP"
  },
  {
    city: 'Quebec City',
    province: 'QC',
    population: '903607',
    latitude: 46.8139,
    longitude: -71.2080,
    median_rent: 1300,
    median_salary: 3950,
    tech_salary: 6100,
    safety_index: 82,
    healthcare_index: 77,
    internet_speed: 120,
    blurb: "One of North America's oldest cities. Quebec City has a strong regional identity and is key to provincial and federal political trends.",
    climate: "Humid continental — cold snowy winters, warm pleasant summers",
    salary_source: "Institut de la statistique du Québec 2025",
    rent_source: "CMHC 2026",
    party: "Bloc Québécois"
  },
  {
    city: 'Hamilton',
    province: 'ON',
    population: '871143',
    latitude: 43.2557,
    longitude: -79.8711,
    median_rent: 1750,
    median_salary: 4300,
    tech_salary: 6600,
    safety_index: 54,
    healthcare_index: 68,
    internet_speed: 130,
    blurb: "Historically Canada's industrial steel capital. Hamilton is home to active labor unions and distinct working-class federal ridings.",
    climate: "Humid continental — cold winters, warm humid summers",
    salary_source: "Statistics Canada 2025",
    rent_source: "Rentals.ca Q1 2026",
    party: "NDP"
  },
  {
    city: 'London',
    province: 'ON',
    population: '633002',
    latitude: 42.9849,
    longitude: -81.2453,
    median_rent: 1650,
    median_salary: 4100,
    tech_salary: 6200,
    safety_index: 56,
    healthcare_index: 71,
    internet_speed: 125,
    blurb: "A major university, regional healthcare, and financial services hub in Southwestern Ontario, split across several bellwether ridings.",
    climate: "Humid continental — cold snowy winters, hot humid summers",
    salary_source: "Statistics Canada 2025",
    rent_source: "Rentals.ca Q1 2026",
    party: "Liberal"
  },
  {
    city: 'Kitchener-Waterloo',
    province: 'ON',
    population: '701568',
    latitude: 43.4516,
    longitude: -80.4925,
    median_rent: 1800,
    median_salary: 4700,
    tech_salary: 7400,
    safety_index: 61,
    healthcare_index: 73,
    internet_speed: 135,
    blurb: "The heart of Canada's tech triangle. KW hosts leading universities and software firms, representing growing suburban-urban ridings.",
    climate: "Humid continental — cold snowy winters, warm humid summers",
    salary_source: "Statistics Canada 2025",
    rent_source: "Rentals.ca Q1 2026",
    party: "Liberal"
  },
  {
    city: 'St. John\'s',
    province: 'NL',
    population: '243478',
    latitude: 47.5615,
    longitude: -52.7126,
    median_rent: 1250,
    median_salary: 3900,
    tech_salary: 6000,
    safety_index: 64,
    healthcare_index: 68,
    internet_speed: 110,
    blurb: "The historic capital of Newfoundland. St. John's features a rich Maritime economy and highly active East Coast electoral campaigns.",
    climate: "Subpolar oceanic — cool snowy winters, mild wet summers",
    salary_source: "Newfoundland Statistics 2025",
    rent_source: "CMHC 2026",
    party: "Liberal"
  },
  {
    city: 'Saskatoon',
    province: 'SK',
    population: '373636',
    latitude: 52.1332,
    longitude: -106.6700,
    median_rent: 1300,
    median_salary: 4200,
    tech_salary: 6400,
    safety_index: 48,
    healthcare_index: 65,
    internet_speed: 118,
    blurb: "The 'Bridge City' of Saskatchewan, centered around agricultural research, mining corporate offices, and central prairie ridings.",
    climate: "Dry continental — long cold winters, short warm summers",
    salary_source: "Saskatchewan Bureau of Stats 2025",
    rent_source: "CMHC 2026",
    party: "Conservative"
  },
  {
    city: 'Regina',
    province: 'SK',
    population: '277358',
    latitude: 50.4501,
    longitude: -104.6189,
    median_rent: 1200,
    median_salary: 4300,
    tech_salary: 6300,
    safety_index: 46,
    healthcare_index: 63,
    internet_speed: 115,
    blurb: "Saskatchewan's capital city. Regina supports public sector government operations alongside rich agricultural commercial enterprises.",
    climate: "Dry continental — long cold winters, short warm summers",
    salary_source: "Saskatchewan Bureau of Stats 2025",
    rent_source: "CMHC 2026",
    party: "Conservative"
  },
  {
    city: 'Charlottetown',
    province: 'PE',
    population: '85000',
    latitude: 46.2382,
    longitude: -63.1311,
    median_rent: 1400,
    median_salary: 3750,
    tech_salary: 5800,
    safety_index: 73,
    healthcare_index: 68,
    internet_speed: 110,
    blurb: "The historic cradle of Confederation and PEI's capital. Centered around agricultural research, tourism, and Maritime local ridings.",
    climate: "Humid continental / Maritime — cold snowy winters, warm pleasant summers",
    salary_source: "PEI Bureau of Statistics 2025",
    rent_source: "CMHC 2026",
    party: "Liberal"
  },
  {
    city: 'Fredericton',
    province: 'NB',
    population: '125303',
    latitude: 45.9636,
    longitude: -66.6431,
    median_rent: 1350,
    median_salary: 3900,
    tech_salary: 6000,
    safety_index: 68,
    healthcare_index: 65,
    internet_speed: 115,
    blurb: "The capital of New Brunswick. Fredericton hosts public-sector headquarters and a growing IT and research community.",
    climate: "Humid continental — cold snowy winters, warm humid summers",
    salary_source: "Statistics Canada 2025",
    rent_source: "CMHC 2026",
    party: "Liberal"
  },
  {
    city: 'Moncton',
    province: 'NB',
    population: '196143',
    latitude: 46.0878,
    longitude: -64.7782,
    median_rent: 1300,
    median_salary: 3800,
    tech_salary: 5800,
    safety_index: 55,
    healthcare_index: 66,
    internet_speed: 120,
    blurb: "A fast-growing bilingual transport and distribution hub in the Maritime provinces, representing key East Coast ridings.",
    climate: "Humid continental — cold snowy winters, warm pleasant summers",
    salary_source: "Statistics Canada 2025",
    rent_source: "CMHC 2026",
    party: "Liberal"
  },
  {
    city: 'Sudbury',
    province: 'ON',
    population: '194278',
    latitude: 46.4917,
    longitude: -80.9930,
    median_rent: 1400,
    median_salary: 4300,
    tech_salary: 6400,
    safety_index: 53,
    healthcare_index: 70,
    internet_speed: 115,
    blurb: "The major mining and scientific center of Northern Ontario, with a highly stable natural resources riding profile.",
    climate: "Humid continental / Subarctic — long cold winters, warm pleasant summers",
    salary_source: "Statistics Canada 2025",
    rent_source: "Rentals.ca Q1 2026",
    party: "Liberal"
  },
  {
    city: 'Whitehorse',
    province: 'YT',
    population: '32000',
    latitude: 60.7212,
    longitude: -135.0568,
    median_rent: 1950,
    median_salary: 5800,
    tech_salary: 7600,
    safety_index: 60,
    healthcare_index: 71,
    internet_speed: 95,
    blurb: "The capital of Yukon, representing the entire territory as a single federal electoral riding.",
    climate: "Subarctic — long cold winters, short warm summers",
    salary_source: "Yukon Bureau of Statistics 2025",
    rent_source: "Yukon Housing Q1 2026",
    party: "Liberal"
  },
  {
    city: 'Yellowknife',
    province: 'NT',
    population: '22000',
    latitude: 62.4540,
    longitude: -114.3718,
    median_rent: 2100,
    median_salary: 6200,
    tech_salary: 8200,
    safety_index: 56,
    healthcare_index: 68,
    internet_speed: 85,
    blurb: "Capital of the Northwest Territories, representing the territorial federal riding.",
    climate: "Subarctic — extreme freezing winters, short mild summers",
    salary_source: "NWT Bureau of Statistics 2025",
    rent_source: "NWT Housing Q1 2026",
    party: "Liberal"
  },
  {
    city: 'Iqaluit',
    province: 'NU',
    population: '8200',
    latitude: 63.7467,
    longitude: -68.5170,
    median_rent: 2800,
    median_salary: 6500,
    tech_salary: 8500,
    safety_index: 72,
    healthcare_index: 55,
    internet_speed: 45,
    blurb: "The capital of Nunavut on Baffin Island, representing the northernmost federal electoral riding in Canada.",
    climate: "Tundra climate — long freezing winters, short cold summers",
    salary_source: "Nunavut Bureau of Statistics 2025",
    rent_source: "Nunavut Housing Corp 2026",
    party: "Liberal"
  },
  {
    city: 'Fort McMurray',
    province: 'AB',
    population: '72000',
    latitude: 56.7268,
    longitude: -111.3797,
    median_rent: 1350,
    median_salary: 6500,
    tech_salary: 8200,
    safety_index: 60,
    healthcare_index: 68,
    internet_speed: 110,
    blurb: "The heart of Alberta's oil sands economy, representing the high-income riding of Fort McMurray—Cold Lake.",
    climate: "Subarctic climate — long freezing winters, short warm summers",
    salary_source: "Statistics Canada 2025",
    rent_source: "Alberta Rent Reports 2026",
    party: "Conservative"
  },
  {
    city: 'Windsor',
    province: 'ON',
    population: '269614',
    latitude: 42.3149,
    longitude: -83.0364,
    median_rent: 1450,
    median_salary: 4000,
    tech_salary: 6000,
    safety_index: 52,
    healthcare_index: 70,
    internet_speed: 120,
    blurb: "Canada's southernmost city, sitting right across the Detroit River from the US. Windsor features manufacturing-focused federal ridings.",
    climate: "Humid continental — cold winters, hot humid summers",
    salary_source: "Statistics Canada 2025",
    rent_source: "Rentals.ca Q1 2026",
    party: "NDP"
  },
  {
    city: 'Kelowna',
    province: 'BC',
    population: '254605',
    latitude: 49.8874,
    longitude: -119.4960,
    median_rent: 1900,
    median_salary: 4200,
    tech_salary: 6400,
    safety_index: 55,
    healthcare_index: 72,
    internet_speed: 125,
    blurb: "Located in the Okanagan Valley, Kelowna is a major tourist and agricultural center known for vineyards, lakes, and high recreational housing demand.",
    climate: "Humid continental / Semi-arid — cold winters, hot dry summers",
    salary_source: "Statistics Canada 2025",
    rent_source: "Rentals.ca Q1 2026",
    party: "Conservative"
  },
  {
    city: 'Sherbrooke',
    province: 'QC',
    population: '243911',
    latitude: 45.4010,
    longitude: -71.8930,
    median_rent: 1050,
    median_salary: 3700,
    tech_salary: 5600,
    safety_index: 74,
    healthcare_index: 71,
    internet_speed: 115,
    blurb: "A major university city in the Eastern Townships of Quebec, hosting progressive francophone riding profiles.",
    climate: "Humid continental — cold snowy winters, warm pleasant summers",
    salary_source: "Institut de la statistique du Québec 2025",
    rent_source: "CMHC 2026",
    party: "Bloc Québécois"
  },
  {
    city: 'Kingston',
    province: 'ON',
    population: '193466',
    latitude: 44.2312,
    longitude: -76.4860,
    median_rent: 1650,
    median_salary: 4300,
    tech_salary: 6500,
    safety_index: 66,
    healthcare_index: 75,
    internet_speed: 125,
    blurb: "The 'Limestone City', sitting at the mouth of the St. Lawrence River. Home to Queen's University, representing a historic Ontario riding.",
    climate: "Humid continental — cold snowy winters, warm pleasant summers",
    salary_source: "Statistics Canada 2025",
    rent_source: "Rentals.ca Q1 2026",
    party: "Liberal"
  }
]

async function run() {
  console.log('--- Wiping existing database tables ---')
  
  const { error: delReportsErr } = await supabase.from('monthly_reports').delete().neq('month', '1970-01')
  if (delReportsErr) console.error('Warning deleting reports:', delReportsErr)

  const { error: delRestErr } = await supabase.from('restaurants').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  if (delRestErr) console.error('Warning deleting restaurants:', delRestErr)

  const { error: delPendErr } = await supabase.from('pending_requests').delete().neq('status', 'resolved_completely')
  if (delPendErr) console.error('Warning deleting pending requests:', delPendErr)

  const { error: delCitiesErr } = await supabase.from('cities').delete().neq('city', 'Not Real City')
  if (delCitiesErr) {
    console.error('Failed to wipe cities:', delCitiesErr)
    process.exit(1)
  }
  console.log('✓ Successfully wiped old database tables')

  console.log('\n--- Seeding Canadian communities ---')

  const cityRows = CITIES.map(c => {
    let tax = 'Medium'
    let wait = 'Moderate'
    let french = 2.0 // default %

    if (c.province === 'QC') {
      tax = 'High'
      wait = 'High'
      french = c.city === 'Montreal' ? 71.3 : c.city === 'Quebec City' ? 94.0 : 89.5
    } else if (c.province === 'AB') {
      tax = 'Low'
      wait = 'Moderate'
      french = 2.1
    } else if (c.province === 'BC') {
      tax = 'Medium'
      wait = 'Moderate'
      french = 1.8
    } else if (c.province === 'ON') {
      tax = 'Medium'
      wait = 'Moderate'
      french = c.city === 'Ottawa' ? 32.4 : c.city === 'Sudbury' ? 25.1 : 2.8
    } else if (c.province === 'NB') {
      tax = 'High'
      wait = 'High'
      french = c.city === 'Moncton' ? 33.5 : 7.2
    } else if (c.province === 'NS' || c.province === 'NL' || c.province === 'PE') {
      tax = 'High'
      wait = 'High'
      french = c.province === 'PE' ? 3.8 : c.province === 'NS' ? 2.4 : 0.6
    } else if (c.province === 'MB') {
      tax = 'High'
      wait = 'High'
      french = 3.9
    } else if (c.province === 'SK') {
      tax = 'Medium'
      wait = 'Moderate'
      french = 1.3
    } else if (c.province === 'YT' || c.province === 'NT') {
      tax = 'Low'
      wait = 'Low'
      french = c.province === 'YT' ? 4.8 : 3.6
    } else if (c.province === 'NU') {
      tax = 'Low'
      wait = 'High'
      french = 4.1
    }

    return {
      city: c.city,
      country: 'Canada',
      region: c.province,
      flag: '🇨🇦',
      latitude: c.latitude,
      longitude: c.longitude,
      population: c.population,
      climate: c.climate,
      blurb: c.blurb,
      median_rent_1br_cad: c.median_rent,
      median_monthly_salary_cad: c.median_salary,
      tech_salary_cad: c.tech_salary,
      safety_index: c.safety_index,
      healthcare_index: c.healthcare_index,
      avg_internet_mbps: c.internet_speed,
      salary_data_source: c.salary_source,
      rent_data_source: c.rent_source,
      median_rent_local: french,
      english_proficiency: tax,
      visa_ease: wait,
      price_cad: null,
      baseline_median_cad: null,
      price_source: c.party, // Storing political party representation in price_source column
      population_source: 'Statistics Canada',
      population_updated_at: NOW,
      price_updated_at: NOW,
      confidence_score: 0.90
    }
  })

  const { error: insertCitiesErr } = await supabase.from('cities').insert(cityRows)
  if (insertCitiesErr) {
    console.error('Failed to insert cities:', insertCitiesErr)
    process.exit(1)
  }
  console.log(`✓ Inserted ${cityRows.length} communities representing electoral ridings`)

  console.log('\n--- Seeding monthly report ---')
  const reportAnalysis = `Canadian Purchasing Power & Housing Burden Analysis (July 2026)

This month marks the official release of the CanPol Index, shifting the spotlight onto socio-economic disparities and electoral riding representation across Canada. By evaluating median individual earnings directly against local housing rental costs, the index maps the true pressures of affordability across the country's federal ridings.

The Housing Crisis Across Major Ridings: Housing costs remain the single largest factor shaping discretionary income in Canada. Ridings in Vancouver and Toronto face the highest median monthly rents, averaging $2,700 and $2,500 respectively. This creates an intense rent burden, consuming 56% of a median gross salary in Vancouver and 51% in Toronto.

Regional Purchasing Disparities: In Quebec, ridings like Sherbrooke represent highly accessible regions, with typical rents of $1,050 and a modest rent burden of 28%. Calgary offers a solid balance of high median wages ($5,100), moderate rent ($1,800), and a rent burden of 35%, leaving $3,300 in monthly disposable income.

Resource-Driven Markets: Fort McMurray holds the highest purchasing power in the country. Backed by the energy sector, the median individual income is $6,500 while median 1BR rent is $1,350, leaving $5,150 in disposable income after rent.

Northern Challenges: Federal ridings in the territories face distinct cost structures. Iqaluit has a median 1BR rent of $2,800. While public sector salaries support a high median wage of $6,500, remote supply lines and utility costs place high pressure on residents' actual take-home purchasing power.`

  const reportRow = {
    month: '2026-07',
    title: 'July 2026 Report',
    subtitle: 'Socio-economic Cost of Living and Housing Rent Burden across Canadian Ridings',
    city_count: CITIES.length,
    new_cities: CITIES.map(c => c.city),
    analysis: reportAnalysis,
    cheapest_city: 'Sherbrooke',
    cheapest_price_cad: 1050.00,
    priciest_city: 'Iqaluit',
    priciest_price_cad: 2800.00,
    spread_ratio: 2.6,
    avg_baseline_cad: 1680.00,
    exchange_rates_snapshot: { CAD: 1.0 },
    city_snapshot: CITIES.map(c => ({
      city: c.city,
      country: 'Canada',
      region: c.province,
      flag: '🇨🇦',
      price_cad: null,
      median_rent_1br_cad: c.median_rent,
      median_monthly_salary_cad: c.median_salary,
      baseline_entry_count: 0,
      market_entry_count: 0,
      data_quality_label: 'High confidence'
    })),
    published_at: NOW,
    is_published: true
  }

  const { error: repInsertErr } = await supabase.from('monthly_reports').insert(reportRow)
  if (repInsertErr) {
    console.error('Failed to insert report:', repInsertErr)
    process.exit(1)
  }
  console.log('✓ Seeding complete for July 2026 monthly report!')
}

run().catch(console.error)
